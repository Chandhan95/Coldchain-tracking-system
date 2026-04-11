import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const Tracking = () => {
  const { id } = useParams();
  const [readings, setReadings] = useState([]);
  const [shipment, setShipment] = useState(null);

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Polling setup (every 30 seconds to match simulation)
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    
    try {
      // 1. Fetch Shipment Info (Always fetch to update status badge live)
      const shipRes = await fetch(`http://localhost:8082/api/shipments/${id}`);
      if(shipRes.ok) setShipment(await shipRes.json());
      
      // 2. Fetch latest temperature readings
      const tempRes = await fetch(`http://localhost:8082/api/temperature-readings/shipment/${id}`);
      if(tempRes.ok) setReadings(await tempRes.json());

    } catch (err) {
      console.error("Tracking data sync failed");
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
          <h3 style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <span className="live-indicator" style={{width: '10px', height: '10px', backgroundColor: 'var(--danger)', borderRadius: '50%', display: 'inline-block', animation: 'blink 1s infinite'}}></span>
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
              ) : (
                readings.slice(0, 15).map(r => ( // show only last 15
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Tracking;
