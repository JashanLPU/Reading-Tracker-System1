const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    
    // COMMERCE FIELDS
    isMember: { type: Boolean, default: false },
    planType: { type: String, default: 'Novice' },
    
    // THE VAULT ARRAY
    purchasedBooks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);