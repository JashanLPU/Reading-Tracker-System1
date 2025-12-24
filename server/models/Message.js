const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    subject: {
        type: String,
        default: 'General Inquiry'
    },
    message: {
        type: String,
        required: true,
    },
    // Track if you have replied to them (admin use)
    status: {
        type: String,
        enum: ['New', 'Read', 'Replied'],
        default: 'New'
    }
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);