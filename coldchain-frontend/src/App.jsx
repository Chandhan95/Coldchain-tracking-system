import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateShipment from './pages/CreateShipment';
import AssignAsset from './pages/AssignAsset';
import Tracking from './pages/Tracking';
import Alerts from './pages/Alerts';
import Compliance from './pages/Compliance';
import ManageUsers from './pages/ManageUsers';
import ManageAssets from './pages/ManageAssets';
import { clearSession, isTokenExpired } from './api';
import { Toaster } from 'react-hot-toast';

function App() {
  const [user, setUser]               = useState(null);
  const [sessionExpired, setExpired]  = useState(false);

  /* Restore session on page load */
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      if (isTokenExpired()) {
        // Token has expired while the tab was closed — clear automatically
        clearSession();
      } else {
        setUser(JSON.parse(storedUser));
      }
    }

    /* Listen for 401 responses from the api helper */
    const handleExpiry = () => {
      setUser(null);
      setExpired(true);
    };
    window.addEventListener('session-expired', handleExpiry);
    return () => window.removeEventListener('session-expired', handleExpiry);
  }, []);

  const handleLogin = ({ token, user: userData }) => {
    localStorage.setItem('jwt_token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setExpired(false);
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setExpired(false);
  };

  if (!user) {
    return (
      <Login
        onLogin={handleLogin}
        sessionExpiredMsg={sessionExpired ? 'Your session has expired. Please sign in again.' : ''}
      />
    );
  }

  return (
    <Router>
      <div className="app-container">
        <Toaster position="top-right" />
        <Navbar user={user} onLogout={handleLogout} />
        <div className="container">
          <Routes>
            <Route path="/"                element={<Dashboard user={user} />} />
            <Route path="/create-shipment" element={<CreateShipment user={user} />} />
            <Route path="/assign-asset"    element={<AssignAsset user={user} />} />
            <Route path="/tracking"        element={<Tracking user={user} />} />
            <Route path="/tracking/:id"    element={<Tracking user={user} />} />
            <Route path="/alerts"          element={<Alerts user={user} />} />
            <Route path="/compliance"      element={<Compliance user={user} />} />
            <Route path="/assets"          element={<ManageAssets user={user} />} />
            <Route path="/users"           element={<ManageUsers user={user} />} />
            <Route path="*"               element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
