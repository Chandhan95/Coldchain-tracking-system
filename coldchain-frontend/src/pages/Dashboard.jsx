import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api';
import toast from 'react-hot-toast';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];



/* ================================================================
   Main Dashboard
================================================================ */
const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    activeShipments: 0,
    openAlerts: 0,
    assetsInTransit: 0,
    complianceRate: 100
  });

  const [recentShipments, setRecentShipments] = useState([]);
  const [revenue, setRevenue] = useState(null);

  // Filter state
  const [search, setSearch]       = useState('');
  const [fromDate, setFromDate]   = useState('');
  const [toDate, setToDate]       = useState('');
  const [statusFilter, setStatus]     = useState('ALL');
  const [filterYear, setFilterYear]   = useState('ALL');
  const [filterMonth, setFilterMonth] = useState('ALL');

  const canSeeShipmentFinancials = user?.role === 'ADMIN' || user?.role === 'LOGISTICS_MANAGER';

  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const shipRes = await apiFetch('/api/shipments');
      const shipmentsData = shipRes.ok ? await shipRes.json() : [];
      setRecentShipments(shipmentsData);

      const alertRes = await apiFetch('/api/alerts/open');
      const alertsData = alertRes.ok ? await alertRes.json() : [];

      const active = shipmentsData.filter(s => s.status !== 'DELIVERED' && s.status !== 'CANCELLED').length;
      setStats({
        activeShipments: active,
        openAlerts: alertsData.length,
        assetsInTransit: shipmentsData.filter(s => s.status === 'IN_TRANSIT').length,
        complianceRate: shipmentsData.length === 0 ? 100 : (alertsData.length > 0 ? 98 : 100)
      });

      // (Revenue specific summary API logic has been replaced entirely with inline table)
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    }
  };

  /* ---------- Actions ---------- */
  const handleHandover = async (shipmentId) => {
    try {
      const res = await apiFetch(`/api/shipments/${shipmentId}/handover`, {
        method: 'POST',
        body: JSON.stringify({ handoverType: 'INTERMEDIATE', temperatureAtHandover: 3.5, conditionRemarks: 'Clean transfer' })
      });
      if (res.ok) { toast.success('Handover logged successfully!'); fetchDashboardData(); }
      else toast.error('Handover failed.');
    } catch { toast.error('Error connecting to server.'); }
  };

  const handleArrive = async (shipmentId) => {
    try {
      const res = await apiFetch(`/api/shipments/${shipmentId}/arrive`, { method: 'PUT' });
      if (res.ok) { toast.success('Shipment marked as ARRIVED.'); fetchDashboardData(); }
      else { const t = await res.text(); toast.error('Arrival failed: ' + t); }
    } catch { toast.error('Error connecting to server.'); }
  };

  const handleDeliver = async (shipmentId) => {
    try {
      const res = await apiFetch(`/api/shipments/${shipmentId}/deliver`, { method: 'PUT' });
      if (res.ok) { toast.success('Shipment DELIVERED successfully!'); fetchDashboardData(); }
      else { const t = await res.text(); toast.error('Delivery failed: ' + t); }
    } catch { toast.error('Error connecting to server.'); }
  };

  /* Cancel = mark as CANCELLED (keeps the record) */
  const handleCancel = async (shipmentId, shipmentNumber) => {
    if (!window.confirm(`Cancel shipment ${shipmentNumber}? It will remain visible with status CANCELLED.`)) return;
    try {
      const res = await apiFetch(`/api/shipments/${shipmentId}/cancel`, { method: 'PUT' });
      if (res.ok) { toast.success(`Shipment ${shipmentNumber} cancelled.`); fetchDashboardData(); }
      else { const t = await res.text(); toast.error('Cancel failed: ' + t); }
    } catch { toast.error('Error connecting to server.'); }
  };

  /* Delete = permanently removes from DB (admin only) */
  const handleDelete = async (shipmentId, shipmentNumber) => {
    if (!window.confirm(`PERMANENTLY DELETE shipment ${shipmentNumber}? This cannot be undone.`)) return;
    try {
      const res = await apiFetch(`/api/shipments/${shipmentId}`, { method: 'DELETE' });
      if (res.ok) { toast.success(`Shipment ${shipmentNumber} deleted.`); fetchDashboardData(); }
      else toast.error('Delete failed.');
    } catch { toast.error('Error connecting to server.'); }
  };

  /* ---------- Status badge ---------- */
  const getStatusBadge = (status) => {
    switch (status) {
      case 'CREATED':    return <span className="badge badge-info">CREATED</span>;
      case 'ASSIGNED':   return <span className="badge badge-info" style={{ backgroundColor: '#6366f1' }}>ASSIGNED</span>;
      case 'IN_TRANSIT': return <span className="badge badge-success">IN TRANSIT</span>;
      case 'ARRIVED':    return <span className="badge badge-warning" style={{ backgroundColor: '#f59e0b' }}>ARRIVED</span>;
      case 'DELIVERED':  return <span className="badge badge-secondary">DELIVERED</span>;
      case 'EXCURSION':  return <span className="badge badge-danger">EXCURSION</span>;
      case 'CANCELLED':  return <span className="badge" style={{ backgroundColor: '#6b7280', color: '#fff' }}>CANCELLED</span>;
      default:           return <span className="badge badge-secondary">{status}</span>;
    }
  };

  const formatCurrency = (value) => {
    if (value == null) return '-';
    return '\u20B9' + Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  /* ---------- Client-side filtering ---------- */
  const filtered = recentShipments.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || (
      s.shipmentNumber?.toLowerCase().includes(q) ||
      s.productType?.toLowerCase().includes(q) ||
      s.originWarehouse?.toLowerCase().includes(q) ||
      s.destinationWarehouse?.toLowerCase().includes(q)
    );
    const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const created = s.createdAt ? new Date(s.createdAt) : null;
    const matchFrom = !fromDate || (created && created >= new Date(fromDate));
    const matchTo   = !toDate   || (created && created <= new Date(toDate + 'T23:59:59'));
    const matchYear = filterYear === 'ALL' || (created && created.getFullYear().toString() === filterYear);
    const matchMonth = filterMonth === 'ALL' || (created && created.getMonth().toString() === filterMonth);
    return matchSearch && matchStatus && matchFrom && matchTo && matchYear && matchMonth;
  });

  const uniqueYears = [...new Set(recentShipments.map(s => s.createdAt ? new Date(s.createdAt).getFullYear() : null))].filter(Boolean).sort().reverse();

  const sortedShipments = React.useMemo(() => {
    let sortable = [...filtered];
    if (sortConfig.key) {
      sortable.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        if (sortConfig.key === 'price') {
          aVal = parseFloat(aVal) || 0;
          bVal = parseFloat(bVal) || 0;
        } else if (sortConfig.key === 'createdAt') {
          aVal = new Date(aVal || 0).getTime();
          bVal = new Date(bVal || 0).getTime();
        } else {
          aVal = (aVal || '').toString().toLowerCase();
          bVal = (bVal || '').toString().toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortable;
  }, [filtered, sortConfig]);

  const totalFilteredRevenue = sortedShipments.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return <span style={{ color: '#cbd5e1', marginLeft: '4px', fontSize: '0.75rem' }}>↕</span>;
    return sortConfig.direction === 'asc' 
      ? <span style={{ color: 'var(--primary-color)', marginLeft: '4px', fontSize: '0.8rem' }}>▲</span>
      : <span style={{ color: 'var(--primary-color)', marginLeft: '4px', fontSize: '0.8rem' }}>▼</span>;
  };

  const btnSm = { padding: '0.22rem 0.55rem', fontSize: '0.73rem', marginRight: '0.3rem' };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>Dashboard</h2>
        <p className="text-muted">Welcome back, {user?.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 mb-4">
        <div className="card text-center">
          <h3 className="text-muted" style={{ fontSize: '1rem', fontWeight: '500' }}>Active Shipments</h3>
          <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-color)' }}>{stats.activeShipments}</p>
        </div>
        <div className="card text-center">
          <h3 className="text-muted" style={{ fontSize: '1rem', fontWeight: '500' }}>Open Alerts</h3>
          <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--danger)' }}>{stats.openAlerts}</p>
        </div>
        <div className="card text-center">
          <h3 className="text-muted" style={{ fontSize: '1rem', fontWeight: '500' }}>In Transit</h3>
          <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--success)' }}>{stats.assetsInTransit}</p>
        </div>
        <div className="card text-center">
          <h3 className="text-muted" style={{ fontSize: '1rem', fontWeight: '500' }}>Global Compliance</h3>
          <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-main)' }}>{stats.complianceRate}%</p>
        </div>
      </div>



      {/* Shipments table */}
      <div className="card">
        {/* Header row */}
        <div className="flex justify-between items-center mb-3">
          <h3 style={{ margin: 0 }}>Shipments</h3>
          <button onClick={fetchDashboardData} className="btn btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}>Refresh</button>
        </div>

        {/* Filters row */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'flex-end' }}>
          {/* Search */}
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Search</label>
            <input
              type="text"
              className="form-control"
              placeholder="Shipment #, product, origin..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ fontSize: '0.83rem', padding: '0.35rem 0.6rem' }}
            />
          </div>

          {/* Status */}
          <div style={{ flex: '0 1 150px' }}>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</label>
            <select className="form-control" value={statusFilter} onChange={e => setStatus(e.target.value)} style={{ fontSize: '0.83rem', padding: '0.35rem 0.6rem' }}>
              <option value="ALL">All Statuses</option>
              <option value="CREATED">Created</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="ARRIVED">Arrived</option>
              <option value="DELIVERED">Delivered</option>
              <option value="EXCURSION">Excursion</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* From date */}
          <div style={{ flex: '0 1 155px' }}>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Created From</label>
            <input type="date" className="form-control" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ fontSize: '0.83rem', padding: '0.35rem 0.6rem' }} />
          </div>

          {/* To date */}
          <div style={{ flex: '0 1 155px' }}>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Created To</label>
            <input type="date" className="form-control" value={toDate} onChange={e => setToDate(e.target.value)} style={{ fontSize: '0.83rem', padding: '0.35rem 0.6rem' }} />
          </div>

          {/* Month / Year Filter */}
          <div style={{ flex: '0 1 120px' }}>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Year</label>
            <select className="form-control" value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ fontSize: '0.83rem', padding: '0.35rem 0.6rem' }}>
              <option value="ALL">All Years</option>
              {uniqueYears.map(yr => <option key={yr} value={yr}>{yr}</option>)}
            </select>
          </div>

          <div style={{ flex: '0 1 120px' }}>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Month</label>
            <select className="form-control" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ fontSize: '0.83rem', padding: '0.35rem 0.6rem' }}>
              <option value="ALL">All Months</option>
              {MONTHS.map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
            </select>
          </div>

          {/* Clear */}
          {(search || fromDate || toDate || statusFilter !== 'ALL' || filterYear !== 'ALL' || filterMonth !== 'ALL') && (
            <button
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', alignSelf: 'flex-end' }}
              onClick={() => { setSearch(''); setFromDate(''); setToDate(''); setStatus('ALL'); setFilterYear('ALL'); setFilterMonth('ALL'); }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Result count */}
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          Showing {sortedShipments.length} of {recentShipments.length} shipments
        </p>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th onClick={() => handleSort('shipmentNumber')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>Shipment # {renderSortIcon('shipmentNumber')}</th>
                <th onClick={() => handleSort('productType')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>Product {renderSortIcon('productType')}</th>
                <th onClick={() => handleSort('originWarehouse')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>Origin {renderSortIcon('originWarehouse')}</th>
                <th onClick={() => handleSort('destinationWarehouse')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>Destination {renderSortIcon('destinationWarehouse')}</th>
                <th onClick={() => handleSort('createdAt')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>Created {renderSortIcon('createdAt')}</th>
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>Status {renderSortIcon('status')}</th>
                {canSeeShipmentFinancials && <th onClick={() => handleSort('price')} style={{ cursor: 'pointer', textAlign: 'right', whiteSpace: 'nowrap' }}>Price {renderSortIcon('price')}</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedShipments.length === 0 ? (
                <tr><td colSpan={canSeeShipmentFinancials ? 8 : 7} className="text-center" style={{ color: 'var(--text-muted)' }}>No shipments match your filters.</td></tr>
              ) : sortedShipments.map(s => (
                <tr key={s.id} style={{ opacity: s.status === 'CANCELLED' ? 0.6 : 1 }}>
                  <td style={{ fontWeight: 500 }}>{s.shipmentNumber}</td>
                  <td>{s.productType?.replace(/_/g, ' ')}</td>
                  <td>{s.originWarehouse}</td>
                  <td>{s.destinationWarehouse}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                  </td>
                  <td>{getStatusBadge(s.status)}</td>
                  {canSeeShipmentFinancials && (
                    <td style={{ textAlign: 'right', fontWeight: 600, color: s.price ? '#10b981' : 'var(--text-muted)' }}>
                      {formatCurrency(s.price)}
                    </td>
                  )}
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <Link to={`/tracking/${s.id}`} className="btn btn-secondary" style={btnSm}>View</Link>

                    {(user?.role === 'DRIVER' || user?.role === 'ADMIN') && (s.status === 'IN_TRANSIT' || s.status === 'EXCURSION') && (
                      <button onClick={() => handleArrive(s.id)} className="btn" style={{ ...btnSm, backgroundColor: '#f59e0b', color: 'white', border: 'none' }}>Arrive</button>
                    )}
                    {(user?.role === 'WAREHOUSE_STAFF' || user?.role === 'ADMIN') && s.status === 'ARRIVED' && (
                      <button onClick={() => handleHandover(s.id)} className="btn btn-primary" style={btnSm}>Handover</button>
                    )}
                    {(user?.role === 'WAREHOUSE_STAFF' || user?.role === 'ADMIN') && s.status === 'ARRIVED' && (
                      <button onClick={() => handleDeliver(s.id)} className="btn btn-success" style={btnSm}>Deliver</button>
                    )}

                    {/* Cancel - keeps record, sets status to CANCELLED */}
                    {(user?.role === 'LOGISTICS_MANAGER' || user?.role === 'ADMIN') && s.status !== 'DELIVERED' && s.status !== 'CANCELLED' && (
                      <button onClick={() => handleCancel(s.id, s.shipmentNumber)} style={{ ...btnSm, background: 'transparent', color: '#f59e0b', border: '1px solid #f59e0b', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                    )}

                    {/* Delete - permanently removes (admin only) */}
                    {user?.role === 'ADMIN' && (
                      <button onClick={() => handleDelete(s.id, s.shipmentNumber)} style={{ ...btnSm, background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              {sortedShipments.length > 0 && (
                <tr style={{ background: 'var(--card-bg)', borderTop: '2px solid var(--border-color)' }}>
                  <td colSpan={canSeeShipmentFinancials ? 6 : 7} style={{ textAlign: 'right', fontWeight: 600, padding: '0.75rem', fontSize: '0.85rem' }}>
                    Total for Filtered Shipments:
                  </td>
                  {canSeeShipmentFinancials && (
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#10b981', padding: '0.75rem', fontSize: '1rem' }}>
                      {formatCurrency(totalFilteredRevenue)}
                    </td>
                  )}
                  <td></td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

