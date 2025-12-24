const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Load environment variables

// Import Models
const User = require('./models/User');
const Book = require('./models/Book');
const Message = require('./models/Message');

const app = express();

// --- 1. CORS CONFIGURATION (Crucial for Vercel Frontend) ---
app.use(cors({
    origin: [
        "http://localhost:5173", 
        "https://reading-tracker-system1.onrender.com", // (Optional: your backend URL)
        "https://YOUR-NETLIFY-SITE-NAME.netlify.app"   // <--- PASTE YOUR NETLIFY LINK HERE
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use(express.json());

// --- 2. SECURE DATABASE CONNECTION ---
// We use process.env.MONGO_URL so you don't expose your password
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("Connected to MongoDB Atlas"))
    .catch(err => console.error("MongoDB Connection Error:", err));

const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

// ================= ROUTES ================= //

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

// ADMIN SEED (Use carefully in production)
app.post('/admin-seed', async (req, res) => {
    try {
        await Book.deleteMany({});
        await Book.create([
            {
                title: "The Alchemist",
                author: "Paulo Coelho",
                coverUrl: "https://images-na.ssl-images-amazon.com/images/I/71aFt4+OTOL.jpg",
                content: "The boy's name was Santiago...",
                price: 299,
                isPremium: false
            },
            {
                title: "Atomic Habits",
                author: "James Clear",
                coverUrl: "https://m.media-amazon.com/images/I/91bYsX41DVL.jpg",
                content: "Changes that seem small and unimportant at first...",
                price: 499,
                isPremium: true
            }
        ]);
        res.json({ status: 'ok', message: 'Library seeded' });
    } catch (err) {
        res.status(500).json({ error: err.message });
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

// UPDATE BOOK RATING
app.put('/update-book/:id', async (req, res) => {
    try {
        const { rating } = req.body;
        await Book.findByIdAndUpdate(req.params.id, { rating });
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

// GET USER DETAILS
app.get('/get-user/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        res.json({ status: 'ok', user });
    } catch (err) {
        res.json({ status: 'error' });
    }
});

// UPDATE USER PROFILE
app.put('/update-user/:id', async (req, res) => {
    try {
        const { name, email } = req.body;
        await User.findByIdAndUpdate(req.params.id, { name, email });
        res.json({ status: 'ok' });
    } catch (err) {
        res.json({ status: 'error' });
    }
});

// --- RAZORPAY PAYMENT ---
app.post('/create-order', async (req, res) => {
    try {
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,     // Set in Render Environment Variables
            key_secret: process.env.RAZORPAY_KEY_SECRET // Set in Render Environment Variables
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

// RECORD PURCHASE
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

// VERIFY MEMBERSHIP PAYMENT
app.post('/verify-membership', async (req, res) => {
    const { userId, planType, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    if (expectedSignature === razorpay_signature) {
        await User.findByIdAndUpdate(userId, { isMember: true, planType: planType });
        res.json({ status: 'ok' });
    } else {
        res.json({ status: 'error', message: 'Invalid Signature' });
    }
});

// CLAIM PREMIUM BOOK
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

// --- 3. DYNAMIC PORT LISTENER (Required for Deployment) ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on Port ${PORT}`);
});