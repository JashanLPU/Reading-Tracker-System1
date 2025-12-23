/* server/index.js */
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// MODELS
const User = require('./models/User');
const Book = require('./models/Book');
const Message = require('./models/Message');

const app = express();
app.use(express.json());
app.use(cors());

// --- DATABASE CONNECTION ---
// This works on your laptop AND on Vercel
const DB_URI = process.env.MONGO_URI || "mongodb+srv://admin1:admin123@cluster0.0x7h9fz.mongodb.net/?appName=Cluster0";

mongoose.connect(DB_URI)
    .then(() => console.log("✅ Cloud DB Connected"))
    .catch(err => console.log("❌ DB Error:", err));

// --- RAZORPAY ---
const razorpay = new Razorpay({
    key_id: "rzp_test_Ruf0QnWdRTCqcs",     
    key_secret: "n0EjlUB5PjAaW8EGoRYGwvhn" 
});

// --- ROUTES ---

// 1. Auth
app.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.json({ status: "error", message: "User already exists" });
        const newUser = await User.create({ name, email, password });
        res.json({ status: "ok", user: newUser });
    } catch (err) { res.json({ status: "error", message: err.message }); }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (user && user.password === password) {
            return res.json({ 
                status: "ok", 
                user: { 
                    id: user._id, 
                    name: user.name, 
                    email: user.email,
                    isMember: user.isMember,
                    planType: user.planType,
                    purchasedBooks: user.purchasedBooks
                } 
            });
        }
        return res.json({ status: "error", message: "Invalid Credentials" });
    } catch (err) { res.json({ status: "error", message: err.message }); }
});

// 2. Profile
app.get('/get-user/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        res.json({ status: user ? "ok" : "error", user });
    } catch (err) { res.json({ status: "error", message: err.message }); }
});

app.put('/update-user/:id', async (req, res) => {
    try {
        const { name, email } = req.body;
        await User.findByIdAndUpdate(req.params.id, { name, email });
        res.json({ status: "ok", message: "Profile Updated" });
    } catch (err) { res.json({ status: "error", message: err.message }); }
});

// 3. Payment
app.post('/create-order', async (req, res) => {
    try {
        const { amount } = req.body; 
        const options = { amount: amount, currency: "INR", receipt: "r_" + Date.now() };
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (err) { res.status(500).send("Error creating order"); }
});

app.post('/verify-membership', async (req, res) => {
    try {
        const { userId, planType, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
        const MY_SECRET = "n0EjlUB5PjAaW8EGoRYGwvhn"; 
        const generated_signature = crypto.createHmac('sha256', MY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id).digest('hex');

        if (generated_signature === razorpay_signature) {
            await User.findByIdAndUpdate(userId, { isMember: true, planType: planType });
            res.json({ status: "ok", message: "Membership Granted" });
        } else {
            res.json({ status: "error", message: "Verification Failed" });
        }
    } catch (err) { res.json({ status: "error", message: err.message }); }
});

app.post('/record-purchase', async (req, res) => {
    try {
        const { userId, bookId } = req.body;
        const bookObjectId = new mongoose.Types.ObjectId(bookId);
        await User.findByIdAndUpdate(userId, { $addToSet: { purchasedBooks: bookObjectId } });
        res.json({ status: "ok", message: "Purchase Recorded" });
    } catch (err) { res.json({ status: "error", message: err.message }); }
});

app.post('/claim-premium', async (req, res) => {
    try {
        const { userId, bookId } = req.body;
        const user = await User.findById(userId);
        if (!user || !user.isMember) return res.json({ status: "error", message: "Membership Required" });
        
        const bookObjectId = new mongoose.Types.ObjectId(bookId);
        await User.findByIdAndUpdate(userId, { $addToSet: { purchasedBooks: bookObjectId } });
        res.json({ status: "ok", message: "Claimed" });
    } catch (err) { res.json({ status: "error", message: err.message }); }
});

// 4. Books & Library
app.get('/library', async (req, res) => {
    try {
        const books = await Book.find({});
        res.json({ status: "ok", books });
    } catch(err) { res.json({ status: "error", message: err.message }); }
});

app.get('/get-book/:id', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        res.json({ status: "ok", book });
    } catch(err) { res.json({ status: "error", message: err.message }); }
});

app.put('/update-book/:id', async (req, res) => {
    try {
        const { rating, review } = req.body;
        const update = {};
        if (rating) update.rating = rating;
        if (review) update.review = review;
        await Book.findByIdAndUpdate(req.params.id, update);
        res.json({ status: "ok", message: "Updated" });
    } catch (err) { res.json({ status: "error", message: err.message }); }
});

app.get('/my-collection/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).populate('purchasedBooks');
        if (user) res.json({ status: "ok", books: user.purchasedBooks });
        else res.json({ status: "error", message: "User not found" });
    } catch (err) { res.json({ status: "error", message: err.message }); }
});

app.post('/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        await Message.create({ name, email, subject, message });
        res.json({ status: "ok", message: "Sent" });
    } catch (err) { res.json({ status: "error", message: err.message }); }
});


// --- SERVER START (VERCEL COMPATIBLE) ---
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`🚀 Local Server running on ${PORT}`));
}

module.exports = app;