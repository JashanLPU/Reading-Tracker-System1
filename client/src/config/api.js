// Automatically detects if we are in production (Vercel) or development (Localhost)
const isProduction = import.meta.env.MODE === 'production';

// If on Vercel, use the environment variable. If local, use localhost:5000.
const API_URL = isProduction 
    ? import.meta.env.VITE_BACKEND_URL 
    : "http://localhost:5000";

export default API_URL;