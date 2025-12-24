const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const bcrypt = require('bcryptjs'); // Using bcryptjs as we fixed earlier
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import Models
const User = require('./models/User');
const Book = require('./models/Book');
const Message = require('./models/Message');

const app = express();

// --- 1. FIXED CORS CONFIGURATION (The Solution) ---
app.use(cors({
    origin: [
        "http://localhost:5173",                            // Localhost (for testing)
        "https://reading-tracker-system1-2.onrender.com",   // The Backend itself
        "https://readingtracker21.netlify.app"              // <--- YOUR NETLIFY FRONTEND (Crucial!)
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use(express.json());

// --- 2. DATABASE CONNECTION ---
// Uses Env Variable if available, otherwise uses your direct link
const DB_URI = process.env.MONGO_URL || "mongodb+srv://admin1:admin123@cluster0.0x7h9fz.mongodb.net/?appName=Cluster0";

mongoose.connect(DB_URI)
    .then(() => console.log("✅ Cloud DB Connected"))
    .catch(err => console.error("❌ DB Connection Error:", err));

const JWT_SECRET = process.env.JWT_SECRET || 'mySuperSecretKey123';

// --- 3. ROUTES ---

// REGISTER
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.json({ status: 'error', message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ name, email, password: hashedPassword });
        res.json({ status: 'ok' });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// LOGIN
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.json({ status: 'error', message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            const token = jwt.sign({ email: user.email, id: user._id }, JWT_SECRET);
            return res.json({ status: 'ok', token, user: { name: user.name, id: user._id, plan: user.planType } });
        } else {
            return res.json({ status: 'error', message: 'Invalid Password' });
        }
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// GET LIBRARY
app.get('/library', async (req, res) => {
    try {
        const books = await Book.find();
        res.json({ status: 'ok', books });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// GET SINGLE BOOK
app.get('/get-book/:id', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        res.json({ status: 'ok', book });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// UPDATE BOOK RATING/REVIEW
app.put('/update-book/:id', async (req, res) => {
    try {
        const { rating, review } = req.body;
        const update = {};
        if (rating) update.rating = rating;
        if (review) update.review = review;
        
        await Book.findByIdAndUpdate(req.params.id, update);
        res.json({ status: 'ok' });
    } catch (err) {
        res.json({ status: 'error' });
    }
});

// GET USER COLLECTION
app.get('/my-collection/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).populate('purchasedBooks');
        res.json({ status: 'ok', books: user ? user.purchasedBooks : [] });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// CONTACT FORM
app.post('/contact', async (req, res) => {
    try {
        await Message.create(req.body);
        res.json({ status: 'ok' });
    } catch (err) {
        res.json({ status: 'error' });
    }
});

// --- RAZORPAY PAYMENT ---
app.post('/create-order', async (req, res) => {
    try {
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_Ruf0QnWdRTCqcs",
            key_secret: process.env.RAZORPAY_KEY_SECRET || "n0EjlUB5PjAaW8EGoRYGwvhn"
        });

        const options = {
            amount: req.body.amount,
            currency: "INR",
            receipt: crypto.randomBytes(10).toString("hex"),
        };

        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error creating order");
    }
});

// VERIFY MEMBERSHIP
app.post('/verify-membership', async (req, res) => {
    const { userId, planType, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    const secret = process.env.RAZORPAY_KEY_SECRET || "n0EjlUB5PjAaW8EGoRYGwvhn";
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body.toString())
        .digest('hex');

    if (expectedSignature === razorpay_signature) {
        await User.findByIdAndUpdate(userId, { isMember: true, planType: planType });
        res.json({ status: 'ok' });
    } else {
        res.json({ status: 'error', message: 'Invalid Signature' });
    }
});

// RECORD PURCHASE (Individual Books)
app.post('/record-purchase', async (req, res) => {
    const { userId, bookId } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user.purchasedBooks.includes(bookId)) {
            user.purchasedBooks.push(bookId);
            await user.save();
        }
        res.json({ status: 'ok' });
    } catch (err) {
        res.status(500).json({ status: 'error' });
    }
});

// CLAIM PREMIUM BOOK (For Members)
app.post('/claim-premium', async (req, res) => {
    const { userId, bookId } = req.body;
    try {
        const user = await User.findById(userId);
        if (user.isMember) {
            if (!user.purchasedBooks.includes(bookId)) {
                user.purchasedBooks.push(bookId);
                await user.save();
            }
            res.json({ status: 'ok' });
        } else {
            res.json({ status: 'error', message: 'Not a member' });
        }
    } catch (err) {
        res.status(500).json({ status: 'error' });
    }
});

// --- 4. START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on Port ${PORT}`);
});