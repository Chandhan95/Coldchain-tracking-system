import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';

const ManageAssets = () => {
  const [assets, setAssets] = useState([]);
  const [formData, setFormData] = useState({
    assetCode: '',
    assetType: 'REFRIGERATED_VAN',
    temperatureSetpoint: ''
  });
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const res = await apiFetch('/api/assets');
      if (res.ok) setAssets(await res.json());
    } catch (err) {
      console.error('Failed to fetch assets');
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
    const code = formData.assetCode.trim();
    if (!code) {
      errs.assetCode = 'Asset code is required.';
    } else if (code.length < 3) {
      errs.assetCode = 'Asset code must be at least 3 characters (e.g. TRUCK-001).';
    } else if (!/^[A-Za-z0-9\-_]+$/.test(code)) {
      errs.assetCode = 'Only letters, numbers, hyphens and underscores allowed.';
    }

    const temp = parseFloat(formData.temperatureSetpoint);
    if (formData.temperatureSetpoint === '' || isNaN(temp)) {
      errs.temperatureSetpoint = 'Temperature setpoint is required.';
    } else if (temp < -30 || temp > 50) {
      errs.temperatureSetpoint = 'Temperature must be between -30°C and 50°C.';
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setSuccessMsg('');
    try {
      const payload = {
        assetCode: formData.assetCode.trim(),
        assetType: formData.assetType,
        temperatureSetpoint: parseFloat(formData.temperatureSetpoint),
        currentLocation: 'Hub'
      };

      const res = await apiFetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccessMsg('✅ New asset added to the fleet!');
        setFormData({ assetCode: '', assetType: 'REFRIGERATED_VAN', temperatureSetpoint: '' });
        setErrors({});
        fetchAssets();
      } else {
        const text = await res.text();
        setErrors({ submit: 'Failed to add asset: ' + text });
      }
    } catch {
      setErrors({ submit: 'Error connecting to server.' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) =>
    status === 'AVAILABLE'
      ? <span className="badge badge-success">AVAILABLE</span>
      : <span className="badge badge-info">IN TRANSIT</span>;

  const FE = ({ msg }) => msg
    ? <p style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '4px', marginBottom: 0 }}>{msg}</p>
    : null;

  return (
    <div className="grid grid-cols-2 gap-4">
      <style>{`.form-control.err { border-color: var(--danger) !important; }`}</style>
      <div className="card">
        <h2 className="mb-4">Add New Asset</h2>

        {errors.submit && <div className="badge badge-danger mb-4" style={{ display:'block', padding:'0.5rem', whiteSpace:'normal' }}>{errors.submit}</div>}
        {successMsg    && <div className="badge badge-success mb-4" style={{ display:'block', padding:'0.5rem', whiteSpace:'normal' }}>{successMsg}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Asset Code (Unique ID) <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              type="text"
              name="assetCode"
              className={`form-control${errors.assetCode ? ' err' : ''}`}
              placeholder="e.g. TRUCK-005"
              value={formData.assetCode}
              onChange={handleChange}
            />
            <FE msg={errors.assetCode} />
          </div>

          <div className="form-group">
            <label className="form-label">Asset Type</label>
            <select
              name="assetType"
              className="form-control"
              value={formData.assetType}
              onChange={handleChange}
            >
              <option value="REFRIGERATED_VAN">Refrigerated Van</option>
              <option value="PORTABLE_COOLER">Portable Cooler</option>
              <option value="COLD_ROOM">Cold Room</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Default Temp Setpoint (°C) <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              type="number"
              name="temperatureSetpoint"
              step="0.1"
              min="-30"
              max="50"
              className={`form-control${errors.temperatureSetpoint ? ' err' : ''}`}
              value={formData.temperatureSetpoint}
              onChange={handleChange}
              placeholder="Range: −30 to 50°C"
            />
            <FE msg={errors.temperatureSetpoint} />
            <small className="text-muted" style={{ display:'block', marginTop:'0.25rem' }}>
              Valid range: −30°C to 50°C
            </small>
          </div>

          <button type="submit" className="btn mt-4" style={{ width: '100%' }} disabled={loading}>
            {loading ? '⏳ Adding…' : 'Add to Fleet'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="mb-4">Current Fleet</h2>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Setpoint</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0
                ? <tr><td colSpan="4" className="text-center">No assets yet.</td></tr>
                : assets.map(a => (
                <tr key={a.id}>
                  <td><strong>{a.assetCode}</strong></td>
                  <td>{a.assetType.replace(/_/g, ' ')}</td>
                  <td>{a.temperatureSetpoint != null ? `${a.temperatureSetpoint}°C` : '—'}</td>
                  <td>{getStatusBadge(a.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageAssets;
