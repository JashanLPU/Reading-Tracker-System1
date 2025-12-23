import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [user, setUser] = useState(null);
    const [showProfile, setShowProfile] = useState(false);
    
    // --- OPTIMIZED ANIMATION STATES ---
    const [isScrolled, setIsScrolled] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
    
    // Refs for performance (reading refs doesn't trigger re-renders)
    const lastScrollY = useRef(0);
    const ticking = useRef(false);

    // 1. SCROLL LOOP (The Nuclear Engine)
    useEffect(() => {
        const updateNavbar = () => {
            const aboutContainer = document.querySelector('.about-page-wrapper'); // New class from About Page redesign
            const isAboutPage = location.pathname === '/';
            
            // Get scroll from correct source
            const currentScrollY = isAboutPage 
                ? (window.scrollY > 0 ? window.scrollY : (aboutContainer?.scrollTop || 0)) // Fallback logic
                : window.scrollY;

            // LOGIC A: GLASS MODE (Threshold 20px)
            if (currentScrollY > 20) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }

            // LOGIC B: HIDE ON SCROLL DOWN (Smart Scroll)
            // Buffer of 10px to prevent jitter
            if (currentScrollY > lastScrollY.current + 10 && currentScrollY > 100) {
                setIsHidden(true);
            } else if (currentScrollY < lastScrollY.current - 5) {
                setIsHidden(false);
            }

            lastScrollY.current = currentScrollY;
            ticking.current = false;
        };

        const onScroll = () => {
            if (!ticking.current) {
                window.requestAnimationFrame(updateNavbar);
                ticking.current = true;
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        // Also listen to body/html just in case
        document.body.addEventListener('scroll', onScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', onScroll);
            document.body.removeEventListener('scroll', onScroll);
        };
    }, [location.pathname]);

    // 2. AUTH & RESET
    useEffect(() => {
        setIsScrolled(false);
        setIsHidden(false);
        
        const userId = localStorage.getItem("userId");
        const userName = localStorage.getItem("userName"); 
        const userPlan = localStorage.getItem("userPlan") || "Novice"; 
        
        if (userId) setUser({ name: userName, plan: userPlan });
        else setUser(null);
    }, [location]); 

    const handleLogout = () => {
        localStorage.clear();
        setUser(null);
        navigate('/'); 
    };

    if (location.pathname === '/auth' || location.pathname.includes('/read/')) return null;

    return (
        // OUTER CONTAINER: Handles Layout & Hiding
        <div className={`navbar-container ${isScrolled ? 'scrolled' : ''} ${isHidden ? 'hidden' : ''}`}>
            
            {/* INNER PILL: Handles The Look */}
            <nav className="navbar-pill">
                <div className="nav-logo" onClick={() => navigate('/')}>StoryVerse</div>
                
                <div className="nav-links">
                    <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        About
                    </NavLink>

                    {user && (
                        <>
                            <NavLink to="/home" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                                Store
                            </NavLink>
                            <NavLink to="/collection" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                                Collection
                            </NavLink>
                            <NavLink to="/contact" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                                Contact
                            </NavLink>
                        </>
                    )}

                    {user ? (
                        <div className="profile-container" onMouseEnter={() => setShowProfile(true)} onMouseLeave={() => setShowProfile(false)}>
                            <button className="nav-item profile-btn">
                                {user.name.split(' ')[0]} 
                                <span style={{fontSize:'10px', marginLeft:'8px', opacity: 0.7}}>▼</span>
                            </button>
                            
                            <div className={`profile-dropdown ${showProfile ? 'active' : ''}`}>
                                <div style={{padding:'10px', color:'white', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
                                    <strong>{user.name}</strong>
                                    <div style={{fontSize:'0.7rem', color:'#FFD700', textTransform:'uppercase'}}>{user.plan}</div>
                                </div>
                                <button onClick={() => navigate('/subscription')} className="dropdown-item">💎 Membership</button>
                                <button onClick={() => navigate('/settings')} className="dropdown-item">⚙️ Settings</button>
                                <button onClick={handleLogout} className="dropdown-item" style={{color:'#ff6b6b'}}>Logout</button>
                            </div>
                        </div>
                    ) : (
                        <button className="nav-item login-btn" onClick={() => navigate('/auth')}>
                            Sign In
                        </button>
                    )}
                </div>
            </nav>
        </div>
    );
};

export default Navbar;