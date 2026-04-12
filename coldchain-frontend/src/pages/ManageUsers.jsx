import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isAlphanumeric = (v) => /^[A-Za-z0-9_]+$/.test(v);

const ManageUsers = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    email: '',
    role: 'DRIVER'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await apiFetch('/api/users');
      if (res.ok) setUsers(await res.json());
    } catch(err) {
      console.error('Failed to fetch users');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
    setSuccessMsg('');
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim() || formData.name.trim().length < 2)
      errs.name = 'Full name must be at least 2 characters.';
    if (!isValidEmail(formData.email))
      errs.email = 'Please enter a valid email address.';
    if (!formData.username.trim() || formData.username.trim().length < 3)
      errs.username = 'Username must be at least 3 characters.';
    else if (!isAlphanumeric(formData.username.trim()))
      errs.username = 'Only letters, numbers, and underscores allowed.';
    if (!formData.password || formData.password.length < 6)
      errs.password = 'Password must be at least 6 characters.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setSuccessMsg('');
    try {
      const res = await apiFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          username: formData.username.trim(),
          password: formData.password,
          role: formData.role
        })
      });

      if (res.ok) {
        setSuccessMsg('✅ User created successfully!');
        setFormData({ name: '', username: '', password: '', email: '', role: 'DRIVER' });
        setErrors({});
        fetchUsers();
      } else {
        const text = await res.text();
        setErrors({ submit: 'Failed to create user: ' + text });
      }
    } catch {
      setErrors({ submit: 'Error connecting to server.' });
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="card" style={{ maxWidth: '500px', margin: '3rem auto', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--danger)' }}>Access Denied</h2>
        <p className="text-muted">Only Admins can view this page.</p>
      </div>
    );
  }

  /* Shared error component */
  const FE = ({ msg }) => msg
    ? <p style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '4px', marginBottom: 0 }}>{msg}</p>
    : null;

  return (
    <div className="grid grid-cols-2">
      <style>{`.form-control.err { border-color: var(--danger) !important; }`}</style>
      <div className="card">
        <h2 className="mb-4">Create New User</h2>

        {errors.submit  && <div className="badge badge-danger mb-4" style={{ display:'block', padding:'0.5rem', whiteSpace:'normal' }}>{errors.submit}</div>}
        {successMsg     && <div className="badge badge-success mb-4" style={{ display:'block', padding:'0.5rem', whiteSpace:'normal' }}>{successMsg}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Full Name <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input type="text" className={`form-control${errors.name ? ' err' : ''}`}
              name="name" value={formData.name} onChange={handleChange} placeholder="e.g. John Smith" />
            <FE msg={errors.name} />
          </div>

          <div className="form-group">
            <label className="form-label">Email <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input type="email" className={`form-control${errors.email ? ' err' : ''}`}
              name="email" value={formData.email} onChange={handleChange} placeholder="user@example.com" />
            <FE msg={errors.email} />
          </div>

          <div className="form-group">
            <label className="form-label">Username <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input type="text" className={`form-control${errors.username ? ' err' : ''}`}
              name="username" value={formData.username} onChange={handleChange} placeholder="min 3 chars, alphanumeric" />
            <FE msg={errors.username} />
          </div>

          <div className="form-group">
            <label className="form-label">Password <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input type="password" className={`form-control${errors.password ? ' err' : ''}`}
              name="password" value={formData.password} onChange={handleChange} placeholder="min 6 characters" />
            <FE msg={errors.password} />
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-control" name="role" value={formData.role} onChange={handleChange}>
              <option value="ADMIN">ADMIN</option>
              <option value="LOGISTICS_MANAGER">LOGISTICS MANAGER</option>
              <option value="WAREHOUSE_STAFF">WAREHOUSE STAFF</option>
              <option value="COMPLIANCE_OFFICER">COMPLIANCE OFFICER</option>
              <option value="DRIVER">DRIVER</option>
            </select>
          </div>

          <button type="submit" className="btn mt-4" style={{ width: '100%' }} disabled={loading}>
            {loading ? '⏳ Creating…' : 'Create User'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 className="mb-4">Existing Users</h3>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0
                ? <tr><td colSpan="4" className="text-center">No users found.</td></tr>
                : users.map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.username}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{u.email}</td>
                  <td><span className="badge badge-secondary">{u.role}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;
