import axios from 'axios';

const api = axios.create({
  // baseURL: 'http://localhost:5000/api', // points to your Express backend
  baseURL: '/api',
});

// ── Request interceptor ───────────────────────────────────────────────────────
// Runs before EVERY request your app makes
// Automatically attaches the JWT token from localStorage to the Authorization header
// This means you never manually add "Bearer token" in each component
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;