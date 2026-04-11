import React, { useState, useEffect } from 'react';

const ManageAssets = () => {
  const [assets, setAssets] = useState([]);
  const [formData, setFormData] = useState({
    assetCode: '',
    assetType: 'REFRIGERATED_VAN',
    temperatureSetpoint: 4.0,
    currentLocation: 'Hub'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const res = await fetch('http://localhost:8082/api/assets');
      if (res.ok) setAssets(await res.json());
    } catch (err) {
      console.error("Failed to fetch assets");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8082/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert("New asset added to the fleet!");
        setFormData({ assetCode: '', assetType: 'REFRIGERATED_VAN', temperatureSetpoint: 4.0, currentLocation: 'Hub' });
        fetchAssets();
      } else {
        alert("Failed to add asset");
      }
    } catch (err) {
      alert("Error connecting to server");
    }
    setLoading(false);
  };

  const getStatusBadge = (status) => {
    return status === 'AVAILABLE' 
      ? <span className="badge badge-success">AVAILABLE</span>
      : <span className="badge badge-info">IN TRANSIT</span>;
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="card">
        <h2 className="mb-4">Add New Asset</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Asset Code (Unique ID)</label>
            <input 
              type="text" className="form-control" placeholder="e.g. TRUCK-005"
              value={formData.assetCode}
              onChange={e => setFormData({...formData, assetCode: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Asset Type</label>
            <select 
              className="form-control"
              value={formData.assetType}
              onChange={e => setFormData({...formData, assetType: e.target.value})}
            >
              <option value="REFRIGERATED_VAN">Refrigerated Van</option>
              <option value="PORTABLE_COOLER">Portable Cooler</option>
              <option value="COLD_ROOM">Cold Room</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Default Temp Setpoint (°C)</label>
            <input 
              type="number" step="0.1" className="form-control"
              value={formData.temperatureSetpoint}
              onChange={e => setFormData({...formData, temperatureSetpoint: e.target.value})}
              required
            />
          </div>
          <button type="submit" className="btn mt-4" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Adding...' : 'Add to Fleet'}
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
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {assets.map(a => (
                <tr key={a.id}>
                  <td>{a.assetCode}</td>
                  <td>{a.assetType.replace('_', ' ')}</td>
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
