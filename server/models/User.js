const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true, // Prevents duplicate emails
    },
    password: {
        type: String,
        required: true,
    },
    // Membership Status
    isMember: {
        type: Boolean,
        default: false,
    },
    planType: {
        type: String,
        default: 'Novice', // Options: 'Novice', 'Scholar', 'Keeper'
    },
    // Array of Book IDs that the user has purchased or claimed
    purchasedBooks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book'
    }],
    // Payment History (Optional but good for debugging)
    paymentHistory: [{
        orderId: String,
        paymentId: String,
        date: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);