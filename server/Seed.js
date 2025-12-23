/* server/seed.js */
const mongoose = require('mongoose');

// 1. YOUR CLOUD DATABASE CONNECTION
// I have added your username (admin1) and password (admin123) for you.
const DB_URI = "mongodb+srv://admin1:admin123@cluster0.0x7h9fz.mongodb.net/?appName=Cluster0";

// 2. SCHEMA
const BookSchema = new mongoose.Schema({
    title: String,
    author: String,
    price: Number,
    coverUrl: String,
    rating: Number,
    review: String,
    status: { type: String, default: 'Unread' },
    content: String, 
    isPremium: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const Book = mongoose.model('Book', BookSchema);

// 3. BOOK DATA
const covers = [
    "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&q=80",
    "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&q=80",
    "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500&q=80",
    "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&q=80",
    "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500&q=80",
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500&q=80",
    "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=500&q=80",
    "https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=500&q=80",
    "https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?w=500&q=80",
    "https://images.unsplash.com/photo-1535905557558-afc4877a26fc?w=500&q=80"
];

const adjectives = ["Silent", "Golden", "Dark", "Eternal", "Lost", "Crimson", "Velvet", "Broken", "Ancient", "Whispering"];
const nouns = ["Empire", "Key", "Shadow", "Throne", "Secret", "Vow", "Legacy", "Storm", "Forest", "Prophecy"];
const authors = ["A. R. Sterling", "Eleanor Vance", "Marcus Thorne", "Silas Blackwood", "Isla Winter", "Victor Cross"];

const generateContent = (title) => {
    let story = `The legend of ${title} began on a night when the stars refused to shine. `;
    const part1 = "It was a secret known only to a few, hidden in the archives of the old world. ";
    const part2 = "Shadows crept across the walls, whispering truths that no mortal should hear. The protagonist stood at the edge of the abyss, looking down into the infinite darkness. ";
    const part3 = "Choices had to be made. Sacrifices were inevitable. The ancient magic hummed in the air, electric and dangerous. ";
    for(let i=0; i<25; i++) {
        story += part1 + part2 + `The mystery of ${title} deepened. ` + part3;
    }
    return story + "In the end, silence reclaimed the world. The End.";
};

const seedDB = async () => {
    try {
        await mongoose.connect(DB_URI);
        console.log("✅ Connected to Cloud Database");

        await Book.deleteMany({});
        console.log("🧹 Vault Cleaned");

        const books = [];
        console.log("🚀 Generating 30 Classic Books...");

        for (let i = 0; i < 30; i++) {
            const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
            const noun = nouns[Math.floor(Math.random() * nouns.length)];
            let title = `The ${adj} ${noun}`;
            
            // 20% Chance of Premium
            const isPremium = Math.random() > 0.8;
            if (isPremium) title = "✦ " + title;

            books.push({
                title: title,
                author: authors[Math.floor(Math.random() * authors.length)],
                price: isPremium ? 999 : 299,
                coverUrl: covers[Math.floor(Math.random() * covers.length)],
                rating: 0,
                review: "",
                status: "Unread",
                isPremium: isPremium,
                content: generateContent(title)
            });
        }

        await Book.insertMany(books);
        console.log("✅ SUCCESS: 30 Books Added to Cloud.");
        mongoose.disconnect();

    } catch (err) { console.error(err); }
};

seedDB();