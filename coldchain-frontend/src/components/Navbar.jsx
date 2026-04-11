import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const location = useLocation();

  if (!user) return null;

  const role = user.role;
  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar" style={{
      backgroundColor: 'var(--card-bg)',
      padding: '1rem 2rem',
      borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <h1 style={{ fontSize: '1.25rem', color: 'var(--primary-color)', margin: 0 }}>❄️ ColdChain Sync</h1>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/" className={isActive('/')}>Dashboard</Link>
          
          {(role === 'LOGISTICS_MANAGER' || role === 'ADMIN') && (
            <>
              <Link to="/create-shipment" className={isActive('/create-shipment')}>New Shipment</Link>
              <Link to="/assign-asset" className={isActive('/assign-asset')}>Assign Assets</Link>
              <Link to="/assets" className={isActive('/assets')}>Manage Fleet</Link>
            </>
          )}

          {(role === 'DRIVER' || role === 'ADMIN' || role === 'LOGISTICS_MANAGER' || role === 'COMPLIANCE_OFFICER') && (
            <Link to="/alerts" className={isActive('/alerts')}>Alerts</Link>
          )}

          {(role === 'COMPLIANCE_OFFICER' || role === 'ADMIN' || role === 'LOGISTICS_MANAGER') && (
            <Link to="/compliance" className={isActive('/compliance')}>Reports</Link>
          )}

          {role === 'ADMIN' && (
            <Link to="/users" className={isActive('/users')}>Manage Users</Link>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span className="badge badge-secondary">{role.replace('_', ' ')}</span>
        <button onClick={onLogout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
