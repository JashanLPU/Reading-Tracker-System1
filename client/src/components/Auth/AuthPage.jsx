import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AuthForms.css';
import videoBg from '../../background.mp4';
import API from "../../config/api";

const AuthPage = () => {
    const [rightPanelActive, setRightPanelActive] = useState(false);
    const navigate = useNavigate();

    // STATES
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // IF USER IS ALREADY LOGGED IN -> GO TO HOME
    useEffect(() => {
        if (localStorage.getItem('userId')) {
            navigate('/home');
        }
    }, [navigate]);

    // --- REGISTER LOGIC ---
    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API}/register`, {
                name,
                email,
                password
            });

            if (res.data.status === 'ok') {
                alert("Account Created Successfully! Please Sign In.");
                setRightPanelActive(false);
            } else {
                alert("Registration Failed: " + res.data.message);
            }
        } catch (err) {
            console.error(err);
            alert("Server Error. Is backend running?");
        }
    };

    // --- LOGIN LOGIC ---
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API}/login`, {
                email,
                password
            });

            if (res.data.status === 'ok') {
                localStorage.setItem('userId', res.data.user.id);
                localStorage.setItem('userName', res.data.user.name);
                localStorage.setItem('userPlan', 'Novice Scribe');
                navigate('/home');
            } else {
                alert("Login Failed: " + res.data.message);
            }
        } catch (err) {
            console.error(err);
            alert("Server Error. Is backend running?");
        }
    };

    return (
        <div className="auth-page-container">
            <div className="brand-logo" onClick={() => navigate('/')}>StoryVerse</div>

            <video className="bg-video" autoPlay muted loop playsInline>
                <source src={videoBg} type="video/mp4" />
            </video>
            <div className="video-overlay"></div>

            <div className={`container ${rightPanelActive ? "right-panel-active" : ""}`}>

                <div className="form-container sign-up-container">
                    <form onSubmit={handleRegister}>
                        <h1>New Profile</h1>
                        <p>Begin your chronicle.</p>

                        <input type="text" placeholder="Full Name" onChange={(e) => setName(e.target.value)} required />
                        <input type="email" placeholder="Email Address" onChange={(e) => setEmail(e.target.value)} required />
                        <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} required />

                        <button type="submit">Initialize</button>
                    </form>
                </div>

                <div className="form-container sign-in-container">
                    <form onSubmit={handleLogin}>
                        <h1>Welcome Back</h1>
                        <p>Access your archives.</p>

                        <input type="email" placeholder="Email Address" onChange={(e) => setEmail(e.target.value)} required />
                        <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} required />

                        <button type="submit">Enter</button>
                    </form>
                </div>

                <div className="overlay-container">
                    <div className="overlay">
                        <div className="overlay-panel overlay-left">
                            <h1>Existing Member?</h1>
                            <button className="ghost" onClick={() => setRightPanelActive(false)}>Sign In</button>
                        </div>
                        <div className="overlay-panel overlay-right">
                            <h1>New Reader?</h1>
                            <button className="ghost" onClick={() => setRightPanelActive(true)}>Sign Up</button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AuthPage;
