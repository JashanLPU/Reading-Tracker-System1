import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Home.css';    
import './Contact.css'; 
import videoBg from '../../background.mp4';

const ContactPage = () => {
    const navigate = useNavigate();
    
    // Form States
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('Request New Volume'); 
    const [message, setMessage] = useState('');

    // Security Check
    useEffect(() => {
        if(!localStorage.getItem("userId")) {
            navigate('/auth'); // Redirect to Login
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/contact', { 
                name, email, subject, message 
            });
            
            if(res.data.status === 'ok') {
                alert("Your inquiry has been archived for review.");
                navigate('/home');
            } else {
                alert("Transmission Failed.");
            }
        } catch (err) { 
            alert("Server Error. The owls are on strike."); 
        }
    };

    return (
        <div className="home-container">
            <video className="bg-video-fixed" autoPlay muted loop playsInline>
                <source src={videoBg} type="video/mp4" />
            </video>

            {/* CONTACT PANEL */}
            <div className="contact-container">
                <div className="contact-panel">
                    
                    {/* Left: Context */}
                    <div className="contact-info">
                        <h1 className="contact-title">Archive Inquiries</h1>
                        <p className="contact-subtitle">
                            Our archivists are standing by. Whether you have found a missing page, 
                            spotted a spelling error, or wish to request a tome for the collection, let us know.
                        </p>
                        
                        <div className="info-list">
                            <div className="info-item">
                                <span className="icon">📜</span> 
                                <div>
                                    <strong>Request a Book</strong>
                                    <p style={{fontSize:'0.8rem', color:'#888'}}>Submit title & author for inclusion.</p>
                                </div>
                            </div>
                            <div className="info-item">
                                <span className="icon">✒️</span> 
                                <div>
                                    <strong>Report Errors</strong>
                                    <p style={{fontSize:'0.8rem', color:'#888'}}>Found a typo? Let us fix the manuscript.</p>
                                </div>
                            </div>
                            <div className="info-item">
                                <span className="icon">⚙️</span> 
                                <div>
                                    <strong>System Issues</strong>
                                    <p style={{fontSize:'0.8rem', color:'#888'}}>Technical bugs or glitches.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: The Form */}
                    <form className="contact-form" onSubmit={handleSubmit}>
                        
                        <div className="form-group">
                            <label className="form-label">Curator Name</label>
                            <input type="text" className="contact-input" placeholder="Your Name" required onChange={(e) => setName(e.target.value)} />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Contact Owl (Email)</label>
                            <input type="email" className="contact-input" placeholder="email@address.com" required onChange={(e) => setEmail(e.target.value)} />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Purpose of Missive</label>
                            <select className="contact-select" onChange={(e) => setSubject(e.target.value)}>
                                <option value="Request New Volume">Request New Book Addition</option>
                                <option value="Report Content Error">Report Word/Text Mistake</option>
                                <option value="Report Technical Bug">Report System Bug</option>
                                <option value="General Inquiry">General Inquiry</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Details</label>
                            <textarea 
                                className="contact-textarea" 
                                placeholder="Please describe the issue or book details (Title, Author)..." 
                                required 
                                onChange={(e) => setMessage(e.target.value)}
                            ></textarea>
                        </div>

                        <button type="submit" className="btn-send">Dispatch Message</button>
                    </form>

                </div>
            </div>
        </div>
    );
};

export default ContactPage;