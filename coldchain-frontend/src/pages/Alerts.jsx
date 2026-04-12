import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';

const Alerts = ({ user }) => {
  const [alerts, setAlerts] = useState([]);
  const role = user?.role;

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await apiFetch('/api/alerts/open');
      if (res.ok) {
        setAlerts(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch alerts");
    }
  };

  const handleAction = async (id, action) => {
    try {
      const endpoint = action === 'acknowledge'
        ? `/api/alerts/${id}/acknowledge?userId=${user.id}`
        : `/api/alerts/${id}/resolve`;
      const res = await apiFetch(endpoint, { method: 'PUT' });
      if (res.ok) {
         fetchAlerts(); // refresh
      } else {
         alert("Failed to update alert");
      }
    } catch (err) {
       console.error("Action failed", err);
    }
  };

  const getSeverityBadge = (severity) => {
    if (severity === 'SEVERE') return <span className="badge badge-danger">SEVERE</span>;
    if (severity === 'CRITICAL') return <span className="badge badge-warning" style={{ backgroundColor: 'orange', color: 'white' }}>CRITICAL</span>;
    return <span className="badge badge-warning">WARNING</span>;
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="mb-0">Active Alerts</h2>
        <button onClick={fetchAlerts} className="btn btn-secondary">Refresh</button>
      </div>
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Shipment</th>
              <th>Time Triggered</th>
              <th>Type</th>
              <th>Severity</th>
              <th>Duration (min)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {alerts.length === 0 ? (
              <tr><td colSpan="7" className="text-center">No active alerts</td></tr>
            ) : (
              alerts.map(a => (
                <tr key={a.id} style={{ backgroundColor: a.resolutionStatus === 'OPEN' ? '#fff1f2' : 'transparent' }}>
                  <td>{a.shipment?.shipmentNumber}</td>
                  <td>{new Date(a.triggeredAt).toLocaleString()}</td>
                  <td>{a.alertType.replace('_', ' ')}</td>
                  <td>{getSeverityBadge(a.severity)}</td>
                  <td>{a.durationMinutes}</td>
                  <td><strong>{a.resolutionStatus}</strong></td>
                  <td>
                    {a.resolutionStatus === 'OPEN' && (role === 'DRIVER' || role === 'ADMIN') && (
                      <button onClick={() => handleAction(a.id, 'acknowledge')} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                        Acknowledge
                      </button>
                    )}
                    {a.resolutionStatus === 'ACKNOWLEDGED' && (role === 'COMPLIANCE_OFFICER' || role === 'ADMIN') && (
                      <button onClick={() => handleAction(a.id, 'resolve')} className="btn btn-success" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                        Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Alerts;
