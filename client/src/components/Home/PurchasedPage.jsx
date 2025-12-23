import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Home.css';
import videoBg from '../../background.mp4';

const PurchasedPage = () => {
    const navigate = useNavigate();
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [readStatus, setReadStatus] = useState({}); 

    useEffect(() => {
        const userId = localStorage.getItem("userId");
        if (!userId) { navigate('/auth'); return; }

        // 1. Fetch Books from DB
        axios.get(`http://localhost:5000/my-collection/${userId}`)
            .then(res => {
                if (res.data.status === 'ok') {
                    setBooks(res.data.books);
                    
                    // 2. NUCLEAR LOAD: Read from the shared key
                    const key = `reading_tracker_${userId}`;
                    const savedStatuses = JSON.parse(localStorage.getItem(key)) || {};
                    
                    console.log("🔥 NUCLEAR TRACKER: Loaded Statuses:", savedStatuses);
                    setReadStatus(savedStatuses);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [navigate]);

    const renderStars = (rating) => {
        const score = rating || 4; 
        return (
            <span style={{ color: '#FFD700', fontSize: '1.2rem', letterSpacing: '2px' }}>
                {'★'.repeat(Math.round(score))}
                <span style={{ color: '#555' }}>{'★'.repeat(5 - Math.round(score))}</span>
            </span>
        );
    };

    // MANUAL TOGGLE (Writes to the same Key)
    const toggleStatus = (e, bookId) => {
        e.stopPropagation(); 
        const userId = localStorage.getItem("userId");
        
        const current = readStatus[bookId] || 'Reading';
        const newStatus = current === 'Reading' ? 'Completed' : 'Reading';
        
        const updatedStatuses = { ...readStatus, [bookId]: newStatus };
        setReadStatus(updatedStatuses);
        
        const key = `reading_tracker_${userId}`;
        localStorage.setItem(key, JSON.stringify(updatedStatuses));
    };

    return (
        <div className="home-container" style={{ overflowY: 'auto', minHeight: '100vh' }}>
            <video className="bg-video-fixed" autoPlay muted loop playsInline>
                <source src={videoBg} type="video/mp4" />
            </video>

            <div style={{ position: 'relative', zIndex: 10, padding: '120px 50px 50px 50px' }}>
                <h1 style={{ fontFamily: 'Cinzel', color: '#FFD700', textAlign: 'center', fontSize: '3rem', marginBottom: '10px' }}>
                    My Collection
                </h1>
                <p style={{ textAlign: 'center', color: '#ccc', fontFamily: 'Lato', marginBottom: '50px' }}>
                    The stories you have gathered.
                </p>

                {loading ? (
                    <div style={{ color: 'white', textAlign: 'center' }}>Loading Archive...</div>
                ) : books.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#aaa', marginTop: '50px' }}>
                        <h2>Your vault is empty.</h2>
                        <button onClick={() => navigate('/home')} style={{
                            marginTop: '20px', padding: '10px 30px', borderRadius: '30px',
                            background: 'transparent', border: '1px solid #FFD700', color: '#FFD700', cursor: 'pointer'
                        }}>
                            Visit Store
                        </button>
                    </div>
                ) : (
                    <div className="books-grid">
                        {books.map(book => {
                            const status = readStatus[book._id] || 'Reading';
                            const isCompleted = status === 'Completed';

                            return (
                                <div key={book._id} className="book-card" onClick={() => navigate(`/read/${book._id}`)}>
                                    <img src={book.coverUrl} alt={book.title} className="book-cover" />
                                    
                                    <div className="book-info">
                                        <h3>{book.title}</h3>
                                        <p style={{marginBottom:'5px'}}>{book.author}</p>
                                        
                                        <div style={{ marginBottom: '15px' }}>{renderStars(book.rating)}</div>

                                        {/* STATUS BADGE */}
                                        <div 
                                            onClick={(e) => toggleStatus(e, book._id)}
                                            style={{
                                                display:'inline-block', padding:'4px 12px', borderRadius:'12px',
                                                fontSize:'0.75rem', fontWeight:'bold', textTransform:'uppercase', cursor:'pointer',
                                                marginBottom:'15px', 
                                                border: isCompleted ? '1px solid #4CAF50' : '1px solid #FFD700',
                                                color: isCompleted ? '#4CAF50' : '#FFD700', 
                                                background: isCompleted ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 215, 0, 0.1)'
                                            }}
                                        >
                                            {isCompleted ? '✓ Completed' : '📖 Reading'}
                                        </div>

                                        <button style={{
                                            marginTop: '0px', padding: '10px 15px', width: '100%',
                                            background: isCompleted ? '#333' : '#FFD700', 
                                            color: isCompleted ? '#aaa' : '#1a0f0a', 
                                            fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer',
                                            transition: '0.3s'
                                        }}>
                                            {isCompleted ? 'Read Again' : 'Continue'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PurchasedPage;