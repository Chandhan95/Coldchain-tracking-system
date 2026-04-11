import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('LOGISTICS_MANAGER');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      const response = await fetch('http://localhost:8082/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        const user = await response.json();
        onLogin(user);
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('Could not connect to the backend server');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      const response = await fetch('http://localhost:8082/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, username, password, role })
      });

      if (response.ok) {
        setSuccessMsg('Registration successful! You can now log in.');
        setIsLogin(true);
      } else {
        const errText = await response.text();
        setError(`Registration failed: ${errText}`);
      }
    } catch (err) {
      setError('Could not connect to the backend server');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="text-center mb-4">
          <h2 style={{ color: 'var(--primary-color)' }}>❄️ ColdChain Sync</h2>
          <p className="text-muted mt-2">{isLogin ? 'Sign in to your account' : 'Register a new account'}</p>
        </div>
        
        {error && <div className="badge badge-danger mb-4" style={{ display: 'block', padding: '0.5rem', whiteSpace: 'normal' }}>{error}</div>}
        {successMsg && <div className="badge badge-success mb-4" style={{ display: 'block', padding: '0.5rem', whiteSpace: 'normal' }}>{successMsg}</div>}

        <form onSubmit={isLogin ? handleLogin : handleRegister}>
          {!isLogin && (
            <>
              <div className="form-group mb-3">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="form-group mb-3">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="form-group mb-3">
                <label className="form-label">Your Role</label>
                <select className="form-control" value={role} onChange={e=>setRole(e.target.value)}>
                    <option value="LOGISTICS_MANAGER">Logistics Manager</option>
                    <option value="WAREHOUSE_STAFF">Warehouse Staff</option>
                    <option value="DRIVER">Driver</option>
                    <option value="COMPLIANCE_OFFICER">Compliance Officer</option>
                </select>
              </div>
            </>
          )}

          <div className="form-group mb-3">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="form-control" 
              value={username} 
              onChange={e => setUsername(e.target.value)}
              required 
            />
          </div>
          <div className="form-group mb-3">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              required 
            />
          </div>
          
          <button type="submit" className="btn mt-4" style={{ width: '100%' }}>
            {isLogin ? 'Sign In' : 'Register Account'}
          </button>
        </form>

        <div className="text-center mt-4" style={{ fontSize: '0.85rem', color: 'var(--primary-color)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => {setIsLogin(!isLogin); setError(''); setSuccessMsg('');}}>
          {isLogin ? 'Need an account? Register here.' : 'Already have an account? Sign in.'}
        </div>
      </div>
    </div>
  );
};

export default Login;
