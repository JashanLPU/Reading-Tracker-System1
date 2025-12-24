const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    author: {
        type: String,
        required: true,
    },
    // URL to the cover image
    coverUrl: {
        type: String,
        required: true, 
    },
    // The actual text content of the book
    content: {
        type: String,
        required: true,
    },
    // Price in Rupees (for non-members)
    price: {
        type: Number,
        required: true,
        default: 0
    },
    // If true, only Members can claim for free. Non-members must buy.
    isPremium: {
        type: Boolean,
        default: false
    },
    // Average Rating (0-5)
    rating: {
        type: Number,
        default: 0
    },
    // Number of people who read it
    reads: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Book', BookSchema);