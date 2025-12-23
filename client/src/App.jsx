import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Home/Navbar';

import AuthPage from './components/Auth/AuthPage';
import AboutPage from './components/Home/AboutPage'; 
import HomePage from './components/Home/HomePage';
import PurchasedPage from './components/Home/PurchasedPage';
import BookDetails from './components/Home/BookDetails';
import BookReader from './components/Home/BookReader';
import ContactPage from './components/Home/ContactPage';
import SettingsPage from './components/Home/SettingsPage';       // Make sure this imports correctly
import SubscriptionPage from './components/Home/SubscriptionPage'; 

function App() {
  return (
    <BrowserRouter>
      <Navbar /> 
      <Routes>
        <Route path="/" element={<AboutPage />} /> {/* Changed to AboutPage as per your request */}
        <Route path="/auth" element={<AuthPage />} />
        
        <Route path="/home" element={<HomePage />} />
        <Route path="/collection" element={<PurchasedPage />} />
        <Route path="/book/:id" element={<BookDetails />} />
        <Route path="/read/:id" element={<BookReader />} />
        <Route path="/contact" element={<ContactPage />} />
        
        {/* ENSURE THESE ARE DIFFERENT */}
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/subscription" element={<SubscriptionPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;