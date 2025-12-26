const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import Models
const User = require('./models/User');
const Book = require('./models/Book');
const Message = require('./models/Message');

const app = express();

// --- 1. DYNAMIC CORS CONFIGURATION ---
// We allow localhost and ANY Vercel deployment (ends with .vercel.app)
const allowedOrigins = [
    "http://localhost:5173",
    "https://reading-tracker-system1-2.onrender.com",
    "https://readingtracker21.netlify.app"
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow any Vercel deployment or specific domains
        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith(".vercel.app")) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use(express.json());

// --- 2. OPTIMIZED DATABASE CONNECTION (For Vercel) ---
const DB_URI = process.env.MONGO_URL || "mongodb+srv://admin1:admin123@cluster0.0x7h9fz.mongodb.net/?appName=Cluster0";

// Global variable to cache the connection
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(DB_URI).then((mongoose) => {
      console.log("✅ Cloud DB Connected");
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// Connect immediately (but errors handled inside routes if needed)
connectDB().catch(console.error);

const JWT_SECRET = process.env.JWT_SECRET || 'mySuperSecretKey123';

// --- 3. ROUTES ---

// Health Check (Good for debugging)
app.get('/', (req, res) => {
    res.send("Backend is running on Vercel!");
});

// REGISTER
app.post('/register', async (req, res) => {
    await connectDB(); // Ensure DB is connected
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
    await connectDB();
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
    await connectDB();
    try {
        const books = await Book.find();
        res.json({ status: 'ok', books });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// GET SINGLE BOOK
app.get('/get-book/:id', async (req, res) => {
    await connectDB();
    try {
        const book = await Book.findById(req.params.id);
        res.json({ status: 'ok', book });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// UPDATE BOOK RATING/REVIEW
app.put('/update-book/:id', async (req, res) => {
    await connectDB();
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
    await connectDB();
    try {
        const user = await User.findById(req.params.userId).populate('purchasedBooks');
        res.json({ status: 'ok', books: user ? user.purchasedBooks : [] });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// CONTACT FORM
app.post('/contact', async (req, res) => {
    await connectDB();
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
    await connectDB();
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
    await connectDB();
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
    await connectDB();
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

// UPDATE USER PROFILE
app.put('/update-user/:id', async (req, res) => {
    await connectDB();
    const { id } = req.params;
    const { name, email } = req.body;
    try {
        await User.findByIdAndUpdate(id, { name, email });
        res.json({ status: 'ok' });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// --- 4. START SERVER (Updated for Vercel) ---
// This conditional check is vital!
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on Port ${PORT}`);
    });
}

// REQUIRED: Export the app for Vercel
module.exports = app;