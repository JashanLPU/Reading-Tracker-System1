import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import HTMLFlipBook from 'react-pageflip';
import axios from 'axios';
import './BookReader.css'; 
import API from "../../config/api";

// or "../../config${API}" depending on folder


const BookReader = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const bookRef = useRef(); 
    
    const [book, setBook] = useState(null);
    const [pages, setPages] = useState([]);
    const [userRating, setUserRating] = useState(0);
    const [hasRated, setHasRated] = useState(false);

    useEffect(() => {
        axios.get(`${API}/get-book/${id}`)
            .then(res => {
                const b = res.data.book;
                setBook(b);
                
                // --- NUCLEAR STATUS UPDATE ---
                const userId = localStorage.getItem("userId");
                if (userId) {
                    const key = `reading_tracker_${userId}`;
                    const currentData = JSON.parse(localStorage.getItem(key)) || {};
                    currentData[id] = 'Reading'; 
                    localStorage.setItem(key, JSON.stringify(currentData));
                }

                // SPLIT TEXT (350 chars for double page look)
                const charsPerPage = 350; 
                const numPages = Math.ceil(b.content.length / charsPerPage);
                const pageArray = [];
                for (let i = 0; i < numPages; i++) {
                    pageArray.push(b.content.substring(i * charsPerPage, (i + 1) * charsPerPage));
                }
                
                // PAD PAGES: Ensure total count (including covers) works for spreads
                // If we have odd text pages, add a blank one so back cover is standalone
                if (pageArray.length % 2 !== 0) {
                    pageArray.push("");
                }
                
                setPages(pageArray);
            })
            .catch(err => console.error(err));
    }, [id]);

    const nextFlip = () => { if (bookRef.current) bookRef.current.pageFlip().flipNext(); };
    const prevFlip = () => { if (bookRef.current) bookRef.current.pageFlip().flipPrev(); };

    const submitRating = async (score) => {
        setUserRating(score);
        setHasRated(true);
        const userId = localStorage.getItem("userId");
        try {
            await axios.put(`${API}/update-book/${id}`, { rating: score });
            if (userId) {
                const key = `reading_tracker_${userId}`;
                const currentData = JSON.parse(localStorage.getItem(key)) || {};
                currentData[id] = 'Completed';
                localStorage.setItem(key, JSON.stringify(currentData));
            }
            setTimeout(() => navigate('/collection'), 1500);
        } catch (err) { console.error(err); }
    };

    if (!book || pages.length === 0) return <div className="loading-screen">Opening Tome...</div>;

    return (
        <div className="flipbook-stage">
            <button className="exit-btn" onClick={() => navigate('/collection')}>Close Book</button>

            {/* CONTROLS */}
            <div className="book-controls">
                <button className="control-btn prev-btn" onClick={prevFlip}>❮</button>
                <button className="control-btn next-btn" onClick={nextFlip}>❯</button>
            </div>

            {/* THE BOOK ENGINE */}
            <div className="book-shadow-wrapper">
                <HTMLFlipBook 
                    width={500}       
                    height={700}      
                    size="fixed"      
                    minWidth={0}       // Removed constraints
                    maxWidth={2000}
                    minHeight={0}
                    maxHeight={2000}
                    maxShadowOpacity={0.5}
                    showCover={true}  
                    mobileScrollSupport={false} // DISABLE MOBILE MODE
                    usePortrait={false}         // CRITICAL: FORCE LANDSCAPE (DOUBLE PAGE)
                    startZIndex={0}
                    useMouseEvents={false}
                    className="grand-grimoire"
                    ref={bookRef}
                >
                    {/* PAGE 0: FRONT COVER */}
                    <div className="page cover-page front">
                        <div className="cover-leather"></div>
                        <div className="cover-frame">
                            <h1 className="cover-title">{book.title}</h1>
                            <div className="cover-icon">⚜</div>
                            <h3 className="cover-author">{book.author}</h3>
                        </div>
                    </div>

                    {/* INTERIOR PAGES */}
                    {pages.map((text, index) => (
                        <div className="page paper-page" key={index}>
                            {/* Inner Spine Shadows */}
                            <div className={`page-gradient ${index % 2 === 0 ? 'left-page-shadow' : 'right-page-shadow'}`}></div>
                            
                            <div className="page-header">
                                <span>{index % 2 === 0 ? `Chapter ${(index/2)+1}` : book.title}</span>
                                <span>{index + 1}</span>
                            </div>
                            
                            <div className="page-content">
                                {index === 0 ? <span className="drop-cap">{text.charAt(0)}</span> : null}
                                {index === 0 ? text.substring(1) : text}
                            </div>
                        </div>
                    ))}

                    {/* RATING PAGE */}
                    <div className="page paper-page rating-page">
                        <div className="page-gradient right-page-shadow"></div>
                        <div className="rating-container">
                            <h2>The End</h2>
                            <p>Rate this Chronicle</p>
                            <div className="stars-wrapper">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span key={star} className={`magic-star ${star <= userRating ? 'active' : ''}`} onClick={() => submitRating(star)}>★</span>
                                ))}
                            </div>
                            {hasRated && <div className="wax-seal">Archived</div>}
                        </div>
                    </div>

                    {/* BACK COVER */}
                    <div className="page cover-page back">
                        <div className="cover-leather"></div>
                        <div className="back-branding">
                            <span>StoryVerse</span>
                        </div>
                    </div>

                </HTMLFlipBook>
            </div>
        </div>
    );
};

export default BookReader;