import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import '@/App.css';
import LandingPage from '@/pages/LandingPage';
import AuthPage from '@/pages/AuthPage';
import Dashboard from '@/pages/Dashboard';
import EventDetail from '@/pages/EventDetail';
import MyEvents from '@/pages/MyEvents';
import Connections from '@/pages/Connections';
import Messages from '@/pages/Messages';
import Profile from '@/pages/Profile';
import { Toaster } from '@/components/ui/sonner';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-xl text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
          <Route path="/auth" element={user ? <Navigate to="/dashboard" /> : <AuthPage setUser={setUser} />} />
          <Route path="/dashboard" element={user ? <Dashboard user={user} setUser={setUser} /> : <Navigate to="/auth" />} />
          <Route path="/events/:id" element={user ? <EventDetail user={user} setUser={setUser} /> : <Navigate to="/auth" />} />
          <Route path="/my-events" element={user ? <MyEvents user={user} setUser={setUser} /> : <Navigate to="/auth" />} />
          <Route path="/connections" element={user ? <Connections user={user} setUser={setUser} /> : <Navigate to="/auth" />} />
          <Route path="/messages" element={user ? <Messages user={user} setUser={setUser} /> : <Navigate to="/auth" />} />
          <Route path="/messages/:userId" element={user ? <Messages user={user} setUser={setUser} /> : <Navigate to="/auth" />} />
          <Route path="/profile" element={user ? <Profile user={user} setUser={setUser} /> : <Navigate to="/auth" />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;