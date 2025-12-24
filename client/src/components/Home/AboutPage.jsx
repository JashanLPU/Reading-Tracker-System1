import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './About.css'; 
import videoBg from '../../background.mp4';
import API from "../../config/api";

// or "../../config${API}" depending on folder


const AboutPage = () => {
    const navigate = useNavigate();
    
    // Animation Refs
    const heroRef = useRef(null);
    const missionRef = useRef(null);
    const featuresRef = useRef(null);
    const statsRef = useRef(null);

    // Scroll Observer (Fade In Effect)
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('fade-in-visible');
            });
        }, { threshold: 0.1 });

        [heroRef, missionRef, featuresRef, statsRef].forEach(ref => {
            if (ref.current) observer.observe(ref.current);
        });
        
        return () => observer.disconnect();
    }, []);

    return (
        <div className="about-page-wrapper">
            
            {/* 1. FIXED BACKGROUND */}
            <div className="video-overlay"></div>
            <video className="bg-video-fullscreen" autoPlay muted loop playsInline>
                <source src={videoBg} type="video/mp4" />
            </video>

            {/* 2. HERO SECTION */}
            <section ref={heroRef} className="about-section hero-section fade-in">
                <div className="hero-content">
                    <h1 className="cinematic-title">STORYVERSE</h1>
                    <div className="gold-separator"></div>
                    <p className="cinematic-subtitle">The Digital Sanctuary for the Modern Reader.</p>
                    
                    <div className="hero-actions">
                        <button className="btn-primary-gold" onClick={() => navigate('/auth')}>
                            Enter The Archive
                        </button>
                    </div>
                </div>
            </section>

            {/* 3. MISSION SECTION */}
            <section ref={missionRef} className="about-section fade-in">
                <div className="glass-card medium-width">
                    <h2 className="section-heading">Our Philosophy</h2>
                    <p className="section-text-large">
                        "In an era of endless scrolling, we choose the quiet dignity of a turned page."
                    </p>
                    <div className="text-grid">
                        <p>
                            StoryVerse is not a social network. It is a <strong>vault</strong>. 
                            We believe your reading history is a map of your intellectual journey, 
                            and it deserves better than a spreadsheet or a messy shelf.
                        </p>
                        <p>
                            We built this for the <strong>Keepers</strong>—those who read not just to consume, 
                            but to remember. We do not sell your data. We do not interrupt your focus.
                        </p>
                    </div>
                </div>
            </section>

            {/* 4. FEATURES GRID */}
            <section ref={featuresRef} className="about-section fade-in">
                <div className="glass-card full-width">
                    <h2 className="section-heading">Tools for the Keeper</h2>
                    <div className="feature-grid">
                        <div className="feature-item">
                            <span className="feature-icon">⚓</span>
                            <h3>The Vault</h3>
                            <p>A secure, cloud-based home for your Premium Editions. Accessible anywhere, anytime.</p>
                        </div>
                        <div className="feature-item">
                            <span className="feature-icon">⏳</span>
                            <h3>The Timeline</h3>
                            <p>Track your reading velocity. Watch your history transform into a beautiful chronology.</p>
                        </div>
                        <div className="feature-item">
                            <span className="feature-icon">✒️</span>
                            <h3>The Journal</h3>
                            <p>Private notes attached to every book. Capture ideas before they fade away.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. GENUINE STATS (The Change) */}
            <section ref={statsRef} className="about-section fade-in" style={{marginBottom: '50px'}}>
                <div className="stats-container">
                    <div className="stat-box">
                        {/* Genuine Info: No Ads */}
                        <h1>Zero</h1>
                        <span>Ads & Trackers</span>
                    </div>
                    <div className="stat-line"></div>
                    <div className="stat-box">
                        {/* Genuine Info: Privacy focus */}
                        <h1>100%</h1>
                        <span>Private Data</span>
                    </div>
                    <div className="stat-line"></div>
                    <div className="stat-box">
                        {/* Genuine Info: Design philosophy */}
                        <h1>∞</h1>
                        <span>Shelf Space</span>
                    </div>
                </div>
                
                <div className="footer-cta">
                    <p>Your shelf is waiting.</p>
                    <button className="btn-text-only" onClick={() => navigate('/auth')}>Begin Now ➔</button>
                </div>
            </section>

        </div>
    );
};

export default AboutPage;