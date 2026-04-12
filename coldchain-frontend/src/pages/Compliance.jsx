import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Compliance = ({ user }) => {
  const [reports, setReports] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState('');
  const [generating, setGenerating] = useState(false);
  const canDownloadReports = user?.role === 'ADMIN' || user?.role === 'COMPLIANCE_OFFICER';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const repRes = await apiFetch('/api/compliance/reports');
      if (repRes.ok) setReports(await repRes.json());

      const shipRes = await apiFetch('/api/shipments');
      if (shipRes.ok) setShipments(await shipRes.json());
    } catch(err) {
      console.error('Networking error', err);
    }
  };

  const generateReport = async () => {
    if (!selectedShipment) {
      alert('Please select a shipment to generate a report for');
      return;
    }
    setGenerating(true);
    try {
      const res = await apiFetch(
        `/api/compliance/report?shipmentId=${selectedShipment}&adminId=${user.id}`,
        { method: 'POST' }
      );
      if (res.ok) {
        await fetchData();
        alert('✅ Report generated successfully!');
      } else {
        const text = await res.text();
        alert('Cannot generate: ' + text);
      }
    } catch(err) {
      console.error('Trigger fail', err);
    } finally {
      setGenerating(false);
    }
  };

  /* ===============================================================
     PDF DOWNLOAD — generates a single report per row
  =============================================================== */
  const downloadReportPDF = (report) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    /* ---- Header bar ---- */
    doc.setFillColor(6, 182, 212);          // cyan-500
    doc.rect(0, 0, 210, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('ColdChain Sync', 14, 12);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Compliance Report', 14, 21);

    const now = new Date();
    doc.text(`Generated: ${now.toLocaleString('en-IN')}`, 210 - 14, 21, { align: 'right' });

    /* ---- Shipment Info box ---- */
    doc.setTextColor(30, 30, 30);
    doc.setFillColor(240, 249, 255);
    doc.roundedRect(14, 34, 182, 36, 3, 3, 'F');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Shipment Details', 20, 43);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);

    const ship = report.shipment;
    const rows = [
      ['Shipment #',  ship?.shipmentNumber ?? '—'],
      ['Product',     ship?.productType?.replace(/_/g, ' ') ?? '—'],
      ['Origin',      ship?.originWarehouse ?? '—'],
      ['Destination', ship?.destinationWarehouse ?? '—'],
    ];
    rows.forEach(([key, val], i) => {
      doc.setFont('helvetica', 'bold');
      doc.text(key + ':', 20, 51 + i * 5.5);
      doc.setFont('helvetica', 'normal');
      doc.text(val, 70, 51 + i * 5.5);
    });

    /* ---- Compliance Metrics table ---- */
    const passed = report.compliancePercentage >= 95.0 && report.excursionCount === 0;

    autoTable(doc, {
      startY: 76,
      head: [['Metric', 'Value']],
      body: [
        ['Total Readings',     String(report.totalReadings)],
        ['Compliant Readings', String(report.compliantReadings)],
        ['Excursion Count',    String(report.excursionCount)],
        ['Compliance %',       report.compliancePercentage + '%'],
        ['Required Min Temp',  (ship?.requiredMinTemp ?? 'N/A') + ' °C'],
        ['Required Max Temp',  (ship?.requiredMaxTemp ?? 'N/A') + ' °C'],
        ['Overall Status',     passed ? 'PASSED' : 'FAILED'],
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [6, 182, 212],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: { fontSize: 9.5 },
      columnStyles: { 0: { fontStyle: 'bold' } },
      didParseCell: (data) => {
        // Colour the Overall Status cell BEFORE rendering (no text corruption)
        if (data.section === 'body' && data.row.index === 6 && data.column.index === 1) {
          data.cell.styles.fillColor  = passed ? [16, 185, 129] : [239, 68, 68];
          data.cell.styles.textColor  = [255, 255, 255];
          data.cell.styles.fontStyle  = 'bold';
        }
      },
      margin: { left: 14, right: 14 },
    });

    /* ---- Compliance Rules footer ---- */
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(14, finalY, 182, 28, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Compliance Rules Reminder', 20, finalY + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('- Temperature must remain within range for >= 95% of readings.', 20, finalY + 12);
    doc.text('- Any temperature deviation lasting > 30 minutes = EXCURSION status.', 20, finalY + 18);
    doc.text('- EXCURSION shipments cannot be delivered without compliance review.', 20, finalY + 24);

    /* ---- Page footer ---- */
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`ColdChain Sync — Compliance Report — Page ${i} of ${pageCount}`, 105, 292, { align: 'center' });
    }

    doc.save(`compliance_${ship?.shipmentNumber ?? report.id}_${now.toISOString().slice(0,10)}.pdf`);
  };

  /* ---- Download ALL reports as one PDF ---- */
  const downloadAllReportsPDF = () => {
    if (reports.length === 0) { alert('No reports to download.'); return; }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const now = new Date();

    /* Header */
    doc.setFillColor(6, 182, 212);
    doc.rect(0, 0, 297, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ColdChain Sync — All Compliance Reports', 14, 13);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${now.toLocaleString('en-IN')}`, 297 - 14, 13, { align: 'right' });

    autoTable(doc, {
      startY: 28,
      head: [['Shipment #', 'Product', 'Route', 'Total Readings', 'Compliant', 'Excursions', 'Compliance %', 'Status']],
      body: reports.map(r => {
        const s = r.shipment;
        const passed = r.compliancePercentage >= 95.0 && r.excursionCount === 0;
        return [
          s?.shipmentNumber ?? 'N/A',
          s?.productType?.replace(/_/g, ' ') ?? 'N/A',
          `${s?.originWarehouse ?? 'N/A'} to ${s?.destinationWarehouse ?? 'N/A'}`,
          String(r.totalReadings),
          String(r.compliantReadings),
          String(r.excursionCount),
          r.compliancePercentage + '%',
          passed ? 'PASSED' : 'FAILED',
        ];
      }),
      theme: 'striped',
      headStyles: { fillColor: [6, 182, 212], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8.5 },
      columnStyles: {
        7: { fontStyle: 'bold' }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 7) {
          const val = data.cell.raw;
          data.cell.styles.textColor = val === 'PASSED' ? [16, 185, 129] : [239, 68, 68];
        }
      },
      margin: { left: 14, right: 14 },
    });

    /* Footer */
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('ColdChain Sync — Compliance Summary Report', 148, 202, { align: 'center' });

    doc.save(`compliance_all_reports_${now.toISOString().slice(0,10)}.pdf`);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>Compliance Reports</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {user?.role === 'ADMIN' && (
            <>
              <select
                className="form-control"
                value={selectedShipment}
                onChange={e => setSelectedShipment(e.target.value)}
                style={{ minWidth: '200px' }}
              >
                <option value="">-- Target Shipment --</option>
                {shipments.map(s => (
                  <option key={s.id} value={s.id}>{s.shipmentNumber}</option>
                ))}
              </select>
              <button
                onClick={generateReport}
                className="btn"
                disabled={!selectedShipment || generating}
              >
                {generating ? 'Generating...' : 'Generate Report'}
              </button>
            </>
          )}
          {reports.length > 0 && canDownloadReports && (
            <button
              onClick={downloadAllReportsPDF}
              className="btn btn-secondary"
              style={{ whiteSpace: 'nowrap' }}
            >
              Download All PDF
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Shipment #</th>
                <th>Product</th>
                <th>Route</th>
                <th>Total Readings</th>
                <th>Compliant</th>
                <th>Excursions</th>
                <th>Compliance %</th>
                <th>Status</th>
                {canDownloadReports && <th>Download</th>}
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr><td colSpan={canDownloadReports ? "9" : "8"} className="text-center">No reports run yet.</td></tr>
              ) : reports.map(r => {
                const passed = r.compliancePercentage >= 95.0 && r.excursionCount === 0;
                return (
                  <tr key={r.id}>
                    <td><strong>{r.shipment?.shipmentNumber}</strong></td>
                    <td>{r.shipment?.productType.replace(/_/g, ' ')}</td>
                    <td style={{ fontSize: '0.82rem' }}>{r.shipment?.originWarehouse} → {r.shipment?.destinationWarehouse}</td>
                    <td>{r.totalReadings}</td>
                    <td>{r.compliantReadings}</td>
                    <td>
                      {r.excursionCount > 0
                        ? <span style={{ color: 'var(--danger)', fontWeight: '600' }}>{r.excursionCount}</span>
                        : <span style={{ color: '#10b981' }}>{r.excursionCount}</span>}
                    </td>
                    <td><strong>{r.compliancePercentage}%</strong></td>
                    <td>
                      {passed
                        ? <span className="badge badge-success">PASSED</span>
                        : <span className="badge badge-danger">FAILED</span>}
                    </td>
                    {canDownloadReports && (
                      <td>
                        <button
                          onClick={() => downloadReportPDF(r)}
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                          title="Download this report as PDF"
                        >
                          Download PDF
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
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
