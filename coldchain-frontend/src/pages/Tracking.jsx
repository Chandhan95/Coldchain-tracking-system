import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../api';
import toast from 'react-hot-toast';

const Tracking = ({ user }) => {
  const { id } = useParams();
  const [readings, setReadings] = useState([]);
  const [shipment, setShipment] = useState(null);
  const [latestReadingId, setLatestReadingId] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    try {
      const shipRes = await apiFetch(`/api/shipments/${id}`);
      if (shipRes.ok) setShipment(await shipRes.json());

      const tempRes = await apiFetch(`/api/temperature-readings/shipment/${id}`);
      if (tempRes.ok) {
        const data = await tempRes.json();
        setReadings(data);
        
        if (data.length > 0) {
          const latest = data[0];
          setLatestReadingId(prevId => {
            if (latest.id !== prevId) {
              if (!latest.isCompliant) {
                toast.error(`Excursion Detected! Temp is ${latest.temperature} \u00B0C`, { duration: 5000, style: { border: '2px solid red' } });
              } else if (user?.role === 'DRIVER') {
                toast.success(`Temp logged: ${latest.temperature} \u00B0C`, { duration: 3000, icon: '🌡️' });
              }
            }
            return latest.id;
          });
        }
      }
    } catch (err) {
      console.error('Tracking data sync failed');
    }
  };

  if (!shipment) return <div className="container mt-4"><h3>Select a shipment from dashboard to track.</h3></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>Live Tracking: {shipment.shipmentNumber}</h2>
        <span className="badge badge-success">{shipment.status}</span>
      </div>

      <div className="grid grid-cols-2 mb-4">
        <div className="card">
          <h4>Shipment Info</h4>
          <p className="mt-4"><strong>Product:</strong> {shipment.productType}</p>
          <p><strong>Required Range:</strong> {shipment.requiredMinTemp}°C to {shipment.requiredMaxTemp}°C</p>
        </div>
        <div className="card text-center flex-col justify-center items-center">
          <h4>Current Temp</h4>
          {readings.length > 0 ? (
            <div style={{ marginTop: '1rem', fontSize: '3rem', fontWeight: 'bold', color: readings[0].isCompliant ? 'var(--success)' : 'var(--danger)' }}>
              {readings[0].temperature}°C
            </div>
          ) : (
            <p className="text-muted mt-4">Waiting for IoT hardware sync...</p>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--danger)', borderRadius: '50%', display: 'inline-block', animation: 'blink 1s infinite' }}></span>
            Live Temperature Log (Updates every 30s)
          </h3>
        </div>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Temperature</th>
                <th>Location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {readings.length === 0 ? (
                <tr><td colSpan="4" className="text-center">No data transmitted yet</td></tr>
              ) : readings.slice(0, 15).map(r => (
                <tr key={r.id}>
                  <td>{new Date(r.timestamp).toLocaleTimeString()}</td>
                  <td>{r.temperature}°C</td>
                  <td>Lat: {r.latitude}, Lng: {r.longitude}</td>
                  <td>
                    {r.isCompliant
                      ? <span className="text-success">OK</span>
                      : <span className="text-danger">EXCURSION</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Tracking;
