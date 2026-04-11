import React, { useState, useEffect } from 'react';

const ManageUsers = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    email: '',
    role: 'DRIVER'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:8082/api/users');
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch(err) {
       console.error("Failed to fetch users");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('http://localhost:8082/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        alert("User created successfully!");
        setFormData({ name: '', username: '', password: '', email: '', role: 'DRIVER' });
        fetchUsers();
      } else {
        const text = await res.text();
        alert("Failed to create user: " + text);
      }
    } catch(err) {
      alert("Error creating user");
    }
    setLoading(false);
  };

  if (user?.role !== 'ADMIN') {
    return <div className="container mt-4 text-center"><h2>Access Denied</h2><p>Only Admins can view this page.</p></div>;
  }

  return (
    <div className="grid grid-cols-2">
      <div className="card">
        <h2 className="mb-4">Create New User</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input type="text" className="form-control" name="username" value={formData.username} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" name="password" value={formData.password} onChange={handleChange} required />
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
          <button type="submit" className="btn mt-4" style={{width: '100%'}} disabled={loading}>
            {loading ? 'Creating...' : 'Create User'}
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
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.username}</td>
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
