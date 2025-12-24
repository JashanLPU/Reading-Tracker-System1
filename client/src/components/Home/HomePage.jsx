import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import videoBg from '../../background.mp4';
import API from "../../config/api";

// or "../../config${API}" depending on folder


const HomePage = () => {
    const navigate = useNavigate();
    const [books, setBooks] = useState([]);
    const [search, setSearch] = useState(''); // Search State
    const [isMember, setIsMember] = useState(false);

    useEffect(() => {
        if(!localStorage.getItem("userId")) { navigate('/auth'); return; }
        setIsMember(localStorage.getItem("isMember") === "true");

        axios.get(`${API}/library`)
            .then(res => { if(res.data.status === 'ok') setBooks(res.data.books); })
            .catch(err => console.log(err));
    }, [navigate]);

    // Filter books based on search
    const filteredBooks = books.filter(book => 
        book.title.toLowerCase().includes(search.toLowerCase()) || 
        book.author.toLowerCase().includes(search.toLowerCase())
    );

    const handleBookClick = (book) => {
        if (book.isPremium && !isMember) {
            alert("🔒 Premium Content! Subscribe to unlock.");
            navigate('/subscription');
        } else {
            navigate(`/book/${book._id}`);
        }
    };

    return (
        <div className="home-container">
            <video className="bg-video-fixed" autoPlay muted loop playsInline>
                <source src={videoBg} type="video/mp4" />
            </video>

            {/* HEADER & SEARCH */}
            <div style={{textAlign: 'center', marginTop: '60px', padding: '0 20px'}}>
                <h1 style={{fontFamily: 'Crimson Text', fontSize: '3.5rem', color: '#fff', textShadow: '0 5px 15px black'}}>
                    The Grand Library
                </h1>
                
                {/* SEARCH BAR */}
                <input 
                    type="text" 
                    placeholder="Search by Title or Author..." 
                    className="edit-input"
                    style={{maxWidth:'500px', margin:'30px auto', display:'block', textAlign:'center', fontSize:'1.2rem', padding:'15px', borderRadius:'30px', border:'1px solid #FFD700'}}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* BOOKSHELF GRID */}
            <div className="bookshelf">
                {filteredBooks.map((book) => (
                    <div className="book-card" key={book._id} onClick={() => handleBookClick(book)}>
                        {book.isPremium && !isMember && (
                            <div style={{
                                position:'absolute', top:0, left:0, width:'100%', height:'100%',
                                background:'rgba(0,0,0,0.7)', borderRadius:'12px', zIndex:10,
                                display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column'
                            }}>
                                <span style={{fontSize:'3rem'}}>🔒</span>
                                <span style={{color:'#FFD700', fontWeight:'bold', marginTop:'10px'}}>MEMBER ONLY</span>
                            </div>
                        )}
                        <img src={book.coverUrl} alt="cover" className="book-cover" />
                        <div className="book-info">
                            <h3>{book.title}</h3>
                            <p>{book.author}</p>
                            <div style={{color:'#FFD700', fontWeight:'bold', marginTop:'5px'}}>₹{book.price}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HomePage;