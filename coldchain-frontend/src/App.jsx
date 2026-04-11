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

function App() {
  const [user, setUser] = useState(null);

  // Simple mock authentication check on load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="app-container">
        <Navbar user={user} onLogout={handleLogout} />
        <div className="container">
          <Routes>
            <Route path="/" element={<Dashboard user={user} />} />
            <Route path="/create-shipment" element={<CreateShipment user={user} />} />
            <Route path="/assign-asset" element={<AssignAsset user={user} />} />
            <Route path="/tracking" element={<Tracking user={user} />} />
            <Route path="/tracking/:id" element={<Tracking user={user} />} />
            <Route path="/alerts" element={<Alerts user={user} />} />
            <Route path="/compliance" element={<Compliance user={user} />} />
            <Route path="/assets" element={<ManageAssets user={user} />} />
            <Route path="/users" element={<ManageUsers user={user} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
