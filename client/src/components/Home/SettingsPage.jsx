import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Home.css';
import './Contact.css'; // Re-use contact styles for the form layout
import videoBg from '../../background.mp4';

const SettingsPage = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // 1. Fetch Real User Data on Mount
    useEffect(() => {
        const userId = localStorage.getItem("userId");
        if (!userId) {
            navigate('/auth');
            return;
        }

        axios.get(`http://localhost:5000/get-user/${userId}`)
            .then(res => {
                if (res.data.status === 'ok') {
                    setName(res.data.user.name);
                    setEmail(res.data.user.email);
                }
            })
            .catch(err => console.error("Failed to fetch user data"));
    }, [navigate]);

    // 2. Handle Update
    const handleUpdate = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const userId = localStorage.getItem("userId");

        try {
            const res = await axios.put(`http://localhost:5000/update-user/${userId}`, {
                name, 
                email
            });

            if (res.data.status === 'ok') {
                // Update Local Storage so Navbar updates instantly
                localStorage.setItem("userName", name);
                alert("Profile Updated Successfully!");
                window.location.reload(); // Refresh to see changes in Navbar
            } else {
                alert("Update Failed.");
            }
        } catch (err) {
            alert("Server Error.");
        }
        setIsSaving(false);
    };

    return (
        <div className="home-container">
            <video className="bg-video-fixed" autoPlay muted loop playsInline>
                <source src={videoBg} type="video/mp4" />
            </video>

            {/* Re-using Contact Panel styles for consistency */}
            <div className="contact-container">
                <div className="contact-panel" style={{flexDirection:'column', maxWidth:'600px', gap:'20px'}}>
                    
                    <h1 className="contact-title" style={{textAlign:'center'}}>Account Settings</h1>
                    <p className="contact-subtitle" style={{textAlign:'center', marginBottom:'30px'}}>
                        Update your personal credentials.
                    </p>

                    <form className="contact-form" onSubmit={handleUpdate}>
                        
                        <div className="form-group">
                            <label className="form-label">Display Name</label>
                            <input 
                                type="text" 
                                className="contact-input" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required 
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input 
                                type="email" 
                                className="contact-input" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required 
                            />
                        </div>

                        <button type="submit" className="btn-send" style={{marginTop:'30px'}}>
                            {isSaving ? "Saving..." : "Save Changes"}
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;