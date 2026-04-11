import React, { useState, useEffect } from 'react';

const Compliance = ({ user }) => {
  const [reports, setReports] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const repRes = await fetch('http://localhost:8082/api/compliance/reports');
      if (repRes.ok) setReports(await repRes.json());

      const shipRes = await fetch('http://localhost:8082/api/shipments');
      if (shipRes.ok) setShipments(await shipRes.json());
    } catch(err) {
      console.error("Networking error");
    }
  };

  const generateReport = async () => {
    if (!selectedShipment) {
      alert("Please select a shipment to generate a report for");
      return;
    }
    try {
      const res = await fetch(`http://localhost:8082/api/compliance/report?shipmentId=${selectedShipment}&adminId=${user.id}`, { method: 'POST' });
      if (res.ok) {
         fetchData();
         alert("Report generated successfully!");
      } else {
         const text = await res.text();
         alert("Cannot generate: " + text);
      }
    } catch(err) {
       console.error("Trigger fail", err);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>Compliance Reports</h2>
        <div style={{display:'flex', gap:'1rem'}}>
          <select className="form-control" value={selectedShipment} onChange={e=>setSelectedShipment(e.target.value)}>
            <option value="">-- Target Shipment --</option>
            {shipments.map(s => <option key={s.id} value={s.id}>{s.shipmentNumber}</option>)}
          </select>
          <button onClick={generateReport} className="btn" disabled={!selectedShipment}>Generate New Report</button>
        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Shipment ID</th>
                <th>Product</th>
                <th>Total Readings</th>
                <th>Compliant</th>
                <th>Excursions</th>
                <th>Compliance %</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                 <tr><td colSpan="7" className="text-center">No reports run yet.</td></tr>
              ) : reports.map(r => (
                <tr key={r.id}>
                  <td>{r.shipment?.shipmentNumber}</td>
                  <td>{r.shipment?.productType.replace('_', ' ')}</td>
                  <td>{r.totalReadings}</td>
                  <td>{r.compliantReadings}</td>
                  <td>{r.excursionCount > 0 ? <span className="text-danger">{r.excursionCount}</span> : r.excursionCount}</td>
                  <td>
                    <strong>{r.compliancePercentage}%</strong>
                  </td>
                  <td>
                    {r.compliancePercentage >= 95.0 && r.excursionCount === 0 ? (
                      <span className="badge badge-success">PASSED</span>
                    ) : (
                      <span className="badge badge-danger">FAILED</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="card mt-4">
        <h4>Compliance Rules Reminder</h4>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '1rem', color: 'var(--text-muted)' }}>
          <li>Temperature must be within range for <strong>95%</strong> of readings.</li>
          <li>Any temperature deviation lasting <strong>&gt; 30 minutes</strong> constitutes an EXCURSION status.</li>
          <li>EXCURSION shipments cannot be DELIVERED without compliance review.</li>
        </ul>
      </div>
    </div>
  );
};

export default Compliance;
