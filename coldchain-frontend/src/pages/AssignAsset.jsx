import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';

const AssignAsset = () => {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [assets, setAssets] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const shipRes = await apiFetch('/api/shipments');
      if (shipRes.ok) {
        const all = await shipRes.json();
        setShipments(all.filter(s => s.status === 'CREATED'));
      }
      const assetRes = await apiFetch('/api/assets/available');
      if (assetRes.ok) setAssets(await assetRes.json());

      const driverRes = await apiFetch('/api/users/role/DRIVER/available');
      if (driverRes.ok) setDrivers(await driverRes.json());
    } catch (err) {
      console.error('Failed to fetch data for assignment');
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedShipment || !selectedAsset || !selectedDriver) {
      alert('Please select a shipment, an asset, and a driver');
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch(
        `/api/shipments/${selectedShipment}/assign?assetId=${selectedAsset}&driverId=${selectedDriver}`,
        { method: 'PUT' }
      );
      if (res.ok) { alert('Asset assigned successfully!'); navigate('/'); }
      else { const t = await res.text(); alert('Assignment failed: ' + t); }
    } catch { alert('Error during assignment'); }
    setLoading(false);
  };

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 className="mb-4">Assign Asset to Shipment</h2>
      <form onSubmit={handleAssign}>
        <div className="form-group">
          <label className="form-label">Select Pending Shipment (CREATED status)</label>
          <select className="form-control" value={selectedShipment} onChange={e => setSelectedShipment(e.target.value)} required>
            <option value="" disabled>-- Choose Shipment --</option>
            {shipments.length === 0 && <option value="" disabled>No CREATED shipments available</option>}
            {shipments.map(s => (
              <option key={s.id} value={s.id}>{s.shipmentNumber} - {s.productType.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Select Available Asset</label>
          <select className="form-control" value={selectedAsset} onChange={e => setSelectedAsset(e.target.value)} required>
            <option value="" disabled>-- Choose Asset --</option>
            {assets.length === 0 && <option value="" disabled>No AVAILABLE assets found</option>}
            {assets.map(a => (
              <option key={a.id} value={a.id}>{a.assetCode} - {a.assetType.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Assign Responsible Driver</label>
          <select className="form-control" value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)} required>
            <option value="" disabled>-- Choose Driver --</option>
            {drivers.length === 0 && <option value="" disabled>No DRIVERS registered yet</option>}
            {drivers.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.username})</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn mt-4" style={{ width: '100%' }}
          disabled={loading || shipments.length === 0 || assets.length === 0}>
          {loading ? 'Assigning...' : 'Confirm Assignment'}
        </button>
      </form>
    </div>
  );
};

export default AssignAsset;
