const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    coverUrl: { type: String, default: "https://via.placeholder.com/150" }, 
    content: { type: String, required: true }, 

    // NEW COMMERCE FIELDS
    price: { type: Number, required: true, default: 0 },     // Cost in INR
    isPremium: { type: Boolean, default: false },            // True = Locked for non-members
    
    // TRACKING (Global defaults - in a real app, these move to a UserBook relation)
    status: { type: String, default: 'Want to Read' },
    rating: { type: Number, default: 0 },
    review: { type: String, default: "" } 
});

module.exports = mongoose.model('Book', BookSchema);