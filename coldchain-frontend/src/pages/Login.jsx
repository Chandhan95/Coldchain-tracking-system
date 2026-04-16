import React, { useState } from 'react';

/* ---------- tiny helpers ---------- */
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isAlphanumeric = (v) => /^[A-Za-z0-9_]+$/.test(v);

const PasswordStrength = ({ password }) => {
  if (!password) return null;
  let strength = 0;
  if (password.length >= 6) strength++;
  if (password.length >= 10) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const colors  = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#059669'];

  return (
    <div style={{ marginTop: '6px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '3px' }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{
            height: '4px', flex: 1, borderRadius: '2px',
            background: i <= strength ? colors[strength] : 'var(--border-color)',
            transition: 'background 0.3s'
          }} />
        ))}
      </div>
      <span style={{ fontSize: '0.73rem', color: colors[strength] }}>{labels[strength]}</span>
    </div>
  );
};

const Login = ({ onLogin, sessionExpiredMsg }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('LOGISTICS_MANAGER');
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  /* ---------- Login validation ---------- */
  const validateLogin = () => {
    const errs = {};
    if (!username.trim()) errs.username = 'Username is required.';
    if (!password)        errs.password = 'Password is required.';
    return errs;
  };

  /* ---------- Register validation ---------- */
  const validateRegister = () => {
    const errs = {};
    if (!name.trim() || name.trim().length < 2)
      errs.name = 'Full name must be at least 2 characters.';
    if (!isValidEmail(email))
      errs.email = 'Please enter a valid email address.';
    if (!username.trim() || username.trim().length < 3)
      errs.username = 'Username must be at least 3 characters.';
    if (!isAlphanumeric(username.trim()))
      errs.username = 'Username can only contain letters, numbers, and underscores.';
    if (!password || password.length < 6)
      errs.password = 'Password must be at least 6 characters.';
    return errs;
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setSuccessMsg('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const errs = validateLogin();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setErrors({});
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082'}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });
      if (response.ok) {
        onLogin(await response.json());
      } else {
        setErrors({ submit: 'Invalid username or password.' });
      }
    } catch {
      setErrors({ submit: 'Could not connect to the backend server.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const errs = validateRegister();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setErrors({});
    setSuccessMsg('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082'}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), username: username.trim(), password, role })
      });
      if (response.ok) {
        setSuccessMsg('✅ Registration successful! You can now log in.');
        setIsLogin(true);
        setName(''); setEmail(''); setUsername(''); setPassword('');
      } else {
        const errText = await response.text();
        setErrors({ submit: `Registration failed: ${errText}` });
      }
    } catch {
      setErrors({ submit: 'Could not connect to the backend server.' });
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Shared field-error style ---------- */
  const FE = ({ msg }) => msg ? <p style={{ color: 'var(--danger)', fontSize: '0.77rem', marginTop: '4px', marginBottom: 0 }}>{msg}</p> : null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)' }}>
      <style>{`
        .form-control.err { border-color: var(--danger) !important; }
      `}</style>
      <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
        <div className="text-center mb-4">
          <h2 style={{ color: 'var(--primary-color)' }}>❄️ ColdChain Sync</h2>
          <p className="text-muted mt-2">{isLogin ? 'Sign in to your account' : 'Register a new account'}</p>
        </div>

        {sessionExpiredMsg && <div className="badge badge-warning mb-4" style={{ display: 'block', padding: '0.5rem', whiteSpace: 'normal', background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' }}>{sessionExpiredMsg}</div>}
        {errors.submit  && <div className="badge badge-danger mb-4"  style={{ display: 'block', padding: '0.5rem', whiteSpace: 'normal' }}>{errors.submit}</div>}
        {successMsg     && <div className="badge badge-success mb-4" style={{ display: 'block', padding: '0.5rem', whiteSpace: 'normal' }}>{successMsg}</div>}

        <form onSubmit={isLogin ? handleLogin : handleRegister} noValidate>
          {!isLogin && (
            <>
              <div className="form-group mb-3">
                <label className="form-label">Full Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input type="text" className={`form-control${errors.name ? ' err' : ''}`}
                  value={name} onChange={e => { setName(e.target.value); setErrors(p => ({...p, name:''})); }} />
                <FE msg={errors.name} />
              </div>
              <div className="form-group mb-3">
                <label className="form-label">Email <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input type="email" className={`form-control${errors.email ? ' err' : ''}`}
                  value={email} onChange={e => { setEmail(e.target.value); setErrors(p => ({...p, email:''})); }} />
                <FE msg={errors.email} />
              </div>
              <div className="form-group mb-3">
                <label className="form-label">Your Role</label>
                <select className="form-control" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="LOGISTICS_MANAGER">Logistics Manager</option>
                  <option value="WAREHOUSE_STAFF">Warehouse Staff</option>
                  <option value="DRIVER">Driver</option>
                  <option value="COMPLIANCE_OFFICER">Compliance Officer</option>
                </select>
              </div>
            </>
          )}

          <div className="form-group mb-3">
            <label className="form-label">Username <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input type="text" className={`form-control${errors.username ? ' err' : ''}`}
              value={username}
              onChange={e => { setUsername(e.target.value); setErrors(p => ({...p, username:''})); }}
              autoComplete="username"
            />
            <FE msg={errors.username} />
          </div>

          <div className="form-group mb-3">
            <label className="form-label">Password <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input type="password" className={`form-control${errors.password ? ' err' : ''}`}
              value={password}
              onChange={e => { setPassword(e.target.value); setErrors(p => ({...p, password:''})); }}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
            {!isLogin && <PasswordStrength password={password} />}
            <FE msg={errors.password} />
          </div>

          <button type="submit" className="btn mt-4" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Register Account')}
          </button>
        </form>

        <div className="text-center mt-4"
          style={{ fontSize: '0.85rem', color: 'var(--primary-color)', cursor: 'pointer', textDecoration: 'underline' }}
          onClick={switchMode}>
          {isLogin ? 'Need an account? Register here.' : 'Already have an account? Sign in.'}
        </div>
      </div>
    </div>
  );
};

export default Login;
