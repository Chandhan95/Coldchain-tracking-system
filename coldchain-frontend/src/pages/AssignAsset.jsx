import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AssignAsset = () => {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [assets, setAssets] = useState([]);
  
  const [selectedShipment, setSelectedShipment] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch only CREATED shipments manually here
      const shipRes = await fetch('http://localhost:8082/api/shipments');
      if (shipRes.ok) {
        const allShipments = await shipRes.json();
        setShipments(allShipments.filter(s => s.status === 'CREATED'));
      }

      // Fetch Available assets
      const assetRes = await fetch('http://localhost:8082/api/assets/available');
      if (assetRes.ok) {
        setAssets(await assetRes.json());
      }

      // Fetch Available Drivers
      const driverRes = await fetch('http://localhost:8082/api/users/role/DRIVER/available');
      if (driverRes.ok) {
        setDrivers(await driverRes.json());
      }
    } catch (err) {
      console.error("Failed to fetch data for assignment");
    }
  }

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedShipment || !selectedAsset || !selectedDriver) {
      alert('Please select a shipment, an asset, and a driver');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8082/api/shipments/${selectedShipment}/assign?assetId=${selectedAsset}&driverId=${selectedDriver}`, {
        method: 'PUT'
      });

      if (res.ok) {
        alert(`Asset assigned successfully!`);
        navigate('/');
      } else {
        const text = await res.text();
        alert('Assignment failed: ' + text);
      }
    } catch(err) {
      alert('Error during assignment');
    }
    setLoading(false);
  };

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 className="mb-4">Assign Asset to Shipment</h2>
      <form onSubmit={handleAssign}>
        <div className="form-group">
          <label className="form-label">Select Pending Shipment (CREATED status)</label>
          <select 
            className="form-control" 
            value={selectedShipment} 
            onChange={e => setSelectedShipment(e.target.value)}
            required
          >
            <option value="" disabled>-- Choose Shipment --</option>
            {shipments.length === 0 && <option value="" disabled>No CREATED shipments available</option>}
            {shipments.map(s => (
              <option key={s.id} value={s.id}>{s.shipmentNumber} - {s.productType.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Select Available Asset</label>
          <select 
            className="form-control" 
            value={selectedAsset} 
            onChange={e => setSelectedAsset(e.target.value)}
            required
          >
            <option value="" disabled>-- Choose Asset --</option>
            {assets.length === 0 && <option value="" disabled>No AVAILABLE assets found</option>}
            {assets.map(a => (
              <option key={a.id} value={a.id}>{a.assetCode} - {a.assetType.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Assign Responsible Driver</label>
          <select 
            className="form-control" 
            value={selectedDriver} 
            onChange={e => setSelectedDriver(e.target.value)}
            required
          >
            <option value="" disabled>-- Choose Driver --</option>
            {drivers.length === 0 && <option value="" disabled>No DRIVERS registered yet</option>}
            {drivers.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.username})</option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn mt-4" style={{ width: '100%' }} disabled={loading || shipments.length===0 || assets.length===0}>
          {loading ? 'Assigning...' : 'Confirm Assignment'}
        </button>
      </form>
    </div>
  );
};

export default AssignAsset;
