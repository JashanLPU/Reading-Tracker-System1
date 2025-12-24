import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Subscription.css';
import videoBg from '../../background.mp4';
import API from "../../config/api";

const SubscriptionPage = () => {
    const navigate = useNavigate();
    const [currentPlan, setCurrentPlan] = useState('Novice'); 

    useEffect(() => {
        // Check both simple key and full user object
        const user = JSON.parse(localStorage.getItem("user"));
        if (user && user.planType) {
            setCurrentPlan(user.planType);
        } else {
            const plan = localStorage.getItem("userPlan");
            if (plan) setCurrentPlan(plan);
        }
    }, []);

    const loadRazorpay = (src) => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = src;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleSubscribe = async (amount, planName) => {
        const res = await loadRazorpay("https://checkout.razorpay.com/v1/checkout.js");
        if (!res) { alert("Razorpay failed to load"); return; }

        try {
            // 1. Create Order
            const orderData = await axios.post(`${API}/create-order`, { amount: amount * 100 });
            
            // 2. Open Payment
            const options = {
                key: "rzp_test_Ruf0QnWdRTCqcs", 
                amount: orderData.data.amount,
                currency: "INR",
                name: "StoryVerse",
                description: `Membership: ${planName}`,
                order_id: orderData.data.id,
                
                handler: async function (response) {
                    const userId = localStorage.getItem("userId");
                    
                    // 3. Verify on Backend
                    // FIXED: Used backticks ` ` instead of quotes " "
                    const verifyRes = await axios.post(`${API}/verify-membership`, {
                        userId: userId,
                        planType: planName,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_signature: response.razorpay_signature
                    });
                    
                    if (verifyRes.data.status === "ok") {
                        // 4. Update Local State (CRITICAL FIX)
                        localStorage.setItem("userPlan", planName);
                        localStorage.setItem("isMember", "true");

                        // Update the Main User Object too (so the UI updates instantly)
                        const currentUser = JSON.parse(localStorage.getItem("user"));
                        if (currentUser) {
                            currentUser.isMember = true;
                            currentUser.planType = planName;
                            localStorage.setItem("user", JSON.stringify(currentUser));
                        }
                        
                        alert(`Welcome to Eternity! You are now a ${planName}.`);
                        navigate('/home');
                        window.location.reload();
                    } else {
                        alert("Payment Verification Failed on Server");
                    }
                },
                theme: { color: "#FFD700" }
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) { 
            console.error(err);
            alert("Payment initiation failed. See console for details."); 
        }
    };

    return (
        <div className="sub-page-wrapper">
            <video className="bg-video-fixed" autoPlay muted loop playsInline>
                <source src={videoBg} type="video/mp4" />
            </video>

            <div className="sub-header">
                <h1 className="cinematic-title">Unlock The Archives</h1>
                <p className="sub-subtitle">Choose your legacy in the StoryVerse.</p>
            </div>

            <div className="pricing-grid">
                
                {/* PLAN 1: SCHOLAR */}
                <div className={`pricing-card glass-panel ${currentPlan === 'Scholar' ? 'active-plan' : ''}`}>
                    <div className="card-badge">Monthly</div>
                    <h2 className="plan-name">Grand Scholar</h2>
                    <div className="plan-price">
                        <span className="currency">₹</span>299<span className="period">/mo</span>
                    </div>
                    
                    <ul className="feature-list">
                        <li>✦ Unlimited Reading</li>
                        <li>✦ Cloud Bookmarks</li>
                        <li>✦ Priority Support</li>
                        <li>✦ No Ad Interruptions</li>
                    </ul>

                    {currentPlan === 'Scholar' ? (
                        <button className="btn-plan disabled">✅ Current Plan</button>
                    ) : currentPlan === 'Keeper' ? (
                        <button className="btn-plan disabled">Included</button>
                    ) : (
                        <button className="btn-plan" onClick={() => handleSubscribe(299, 'Scholar')}>
                            Subscribe Now
                        </button>
                    )}
                </div>

                {/* PLAN 2: KEEPER (Featured) */}
                <div className={`pricing-card glass-panel featured ${currentPlan === 'Keeper' ? 'active-plan' : ''}`}>
                    <div className="best-value-ribbon">BEST VALUE</div>
                    <div className="card-badge gold">Lifetime</div>
                    <h2 className="plan-name">Keeper of Time</h2>
                    <div className="plan-price">
                        <span className="currency">₹</span>4,999<span className="period">/once</span>
                    </div>
                    
                    <ul className="feature-list">
                        <li>✦ <strong>Everything in Scholar</strong></li>
                        <li>✦ Lifetime Access</li>
                        <li>✦ Early Access to New Books</li>
                        <li>✦ "Keeper" Profile Badge</li>
                        <li>✦ Download Offline Editions</li>
                    </ul>

                    {currentPlan === 'Keeper' ? (
                        <button className="btn-plan gold-btn disabled">✅ You Own Eternity</button>
                    ) : (
                        <button className="btn-plan gold-btn" onClick={() => handleSubscribe(4999, 'Keeper')}>
                            Claim Eternity
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};

export default SubscriptionPage;