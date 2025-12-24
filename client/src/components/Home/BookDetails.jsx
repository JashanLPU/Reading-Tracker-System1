import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Home.css'; 
import videoBg from '../../background.mp4';
import API from "../../config/api";

const BookDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [book, setBook] = useState(null);
    const [isOwned, setIsOwned] = useState(false);
    const [isMember, setIsMember] = useState(false); 

    useEffect(() => {
        const userId = localStorage.getItem("userId");
        if(!userId) { navigate('/auth'); return; }

        // 1. Fetch Book (Uses Backticks ` `)
        axios.get(`${API}/get-book/${id}`)
            .then(res => setBook(res.data.book))
            .catch(err => console.error("Error fetching book:", err));

        // 2. Check User Status (Uses Backticks ` `)
        axios.get(`${API}/get-user/${userId}`)
            .then(res => {
                if(res.data.status === 'ok') {
                    setIsMember(res.data.user.isMember);
                    
                    // Check ownership
                    const myBooks = res.data.user.purchasedBooks || [];
                    if (myBooks.includes(id)) setIsOwned(true);
                }
            })
            .catch(err => console.error("Error fetching user:", err));
    }, [id, navigate]);

    // --- HELPER: Update Local Storage (Syncs Frontend with Backend) ---
    const updateLocalLibrary = (newBookId) => {
        const currentUser = JSON.parse(localStorage.getItem("user"));
        if (currentUser) {
            if (!currentUser.purchasedBooks) currentUser.purchasedBooks = [];
            
            if (!currentUser.purchasedBooks.includes(newBookId)) {
                currentUser.purchasedBooks.push(newBookId);
                localStorage.setItem("user", JSON.stringify(currentUser));
            }
        }
    };

    // A. BUY NORMAL BOOK (Everyone pays)
    const handlePurchase = async () => {
        const userId = localStorage.getItem("userId");
        
        // Load Razorpay Script
        const load = (src) => new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = src;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });

        const res = await load("https://checkout.razorpay.com/v1/checkout.js");
        if (!res) { alert("Razorpay failed to load"); return; }

        try {
            // FIXED: Used Backticks ` ` instead of Quotes " "
            const orderData = await axios.post(`${API}/create-order`, { amount: book.price * 100 });
            
            const options = {
                key: "rzp_test_Ruf0QnWdRTCqcs",
                amount: orderData.data.amount,
                currency: "INR",
                name: "StoryVerse",
                description: `Purchase: ${book.title}`,
                order_id: orderData.data.id,
                
                handler: async function (response) {
                    // FIXED: Used Backticks ` ` here too
                    await axios.post(`${API}/record-purchase`, { userId, bookId: book._id });
                    
                    // Update Local Storage & State
                    updateLocalLibrary(book._id);
                    setIsOwned(true);
                    
                    alert("Book Added to Collection!");
                    navigate('/collection');
                },
                theme: { color: "#FFD700" }
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch(err) { 
            console.error(err);
            alert("Purchase Failed"); 
        }
    };

    // B. CLAIM PREMIUM BOOK (Members Only)
    const handleClaimPremium = async () => {
        const userId = localStorage.getItem("userId");
        try {
            // FIXED: Used Backticks ` ` instead of Quotes " "
            const res = await axios.post(`${API}/claim-premium`, { userId, bookId: book._id });
            
            if (res.data.status === 'ok') {
                // Update Local Storage & State
                updateLocalLibrary(book._id);
                setIsOwned(true);

                alert("✨ Premium Book Claimed!");
                navigate('/collection');
            } else {
                alert(res.data.message);
            }
        } catch (err) {
            console.error(err);
            alert("Error claiming book");
        }
    };

    if (!book) return <div className="loading-screen">Loading...</div>;

    return (
        <div className="home-container">
            <video className="bg-video-fixed" autoPlay muted loop playsInline>
                <source src={videoBg} type="video/mp4" />
            </video>
            
            <div className="details-container">
                <div className="dossier-panel">
                    <div className="dossier-left">
                        <img src={book.coverUrl} className="dossier-cover" alt="cover" />

                        {/* --- THE DECISION LOGIC --- */}
                        
                        {isOwned ? (
                            // 1. ALREADY OWNED (Read)
                            <button className="btn-action btn-read" style={{background:'#4CAF50'}} onClick={() => navigate(`/read/${book._id}`)}>
                                📖 Read Now
                            </button>

                        ) : book.isPremium ? (
                            // 2. PREMIUM BOOK
                            isMember ? (
                                // Member? -> Claim Free
                                <button className="btn-action btn-gold" onClick={handleClaimPremium}>
                                    ✨ Claim (Member Perk)
                                </button>
                            ) : (
                                // Non-Member? -> Lock & Link to Sub Page
                                <button className="btn-action btn-locked" onClick={() => navigate('/membership')}>
                                    🔒 Premium Only (Join)
                                </button>
                            )

                        ) : (
                            // 3. NORMAL BOOK (Pay to Own)
                            <button className="btn-action btn-read" onClick={handlePurchase}>
                                Buy for ₹{book.price}
                            </button>
                        )}
                        
                    </div>

                    <div className="dossier-right">
                        <h1 className="dossier-title">
                            {book.isPremium && <span style={{color:'#FFD700', marginRight:'10px'}}>✦</span>}
                            {book.title}
                        </h1>
                        <h3 className="dossier-author">{book.author}</h3>
                        
                        {book.isPremium ? (
                            <p style={{color:'#FFD700', border:'1px solid #FFD700', display:'inline-block', padding:'5px 10px', borderRadius:'5px'}}>
                                ✦ Included with Membership
                            </p>
                        ) : (
                            <p style={{color:'#aaa', border:'1px solid #555', display:'inline-block', padding:'5px 10px', borderRadius:'5px'}}>
                                Standard Edition
                            </p>
                        )}

                        <p style={{marginTop:'20px', color:'#ccc', lineHeight:'1.6'}}>
                            {book.content.substring(0, 300)}...
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookDetails;