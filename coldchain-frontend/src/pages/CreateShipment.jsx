import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch } from '../api';
import { useNavigate } from 'react-router-dom';

/* ------------------------------------------------------------------
   Inline styles for location suggestions dropdown
------------------------------------------------------------------ */
const dropdownStyle = {
  position: 'absolute',
  zIndex: 1000,
  background: 'var(--card-bg)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
  maxHeight: '200px',
  overflowY: 'auto',
  width: '100%',
  marginTop: '2px',
};

const dropdownItemStyle = (hovered) => ({
  padding: '0.55rem 0.9rem',
  cursor: 'pointer',
  fontSize: '0.85rem',
  color: 'var(--text-main)',
  background: hovered ? 'var(--primary-color)' : 'transparent',
  borderBottom: '1px solid var(--border-color)',
  transition: 'background 0.15s',
});

/* ------------------------------------------------------------------
   LocationSearch — typeahead using OpenStreetMap Nominatim
------------------------------------------------------------------ */
const LocationSearch = ({ label, value, onChange, error }) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState(-1);
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef(null);
  const wrapperRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keep internal query in sync if parent clears it
  useEffect(() => {
    if (!value) setQuery('');
  }, [value]);

  const search = useCallback((q) => {
    clearTimeout(timeoutRef.current);
    if (q.trim().length < 3) { setSuggestions([]); setOpen(false); return; }
    setLoading(true);
    timeoutRef.current = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=8&accept-language=en`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        const data = await res.json();
        setSuggestions(data);
        setOpen(data.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, []);

  const handleInput = (e) => {
    const q = e.target.value;
    setQuery(q);
    onChange(''); // clear parent value while typing
    search(q);
  };

  const selectItem = (item) => {
    const display = item.display_name.split(',').slice(0, 3).join(',').trim();
    setQuery(display);
    onChange(display);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div className="form-group" ref={wrapperRef} style={{ position: 'relative' }}>
      <label className="form-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className={`form-control${error ? ' input-error' : ''}`}
          value={query}
          onChange={handleInput}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Type to search location..."
          autoComplete="off"
        />
        {loading && (
          <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Searching...
          </span>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <div style={dropdownStyle}>
          {suggestions.map((item, idx) => (
            <div
              key={item.place_id}
              style={dropdownItemStyle(idx === hoveredIdx)}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(-1)}
              onMouseDown={() => selectItem(item)}
            >
              {item.display_name.split(',').slice(0, 4).join(', ')}
            </div>
          ))}
        </div>
      )}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
};

/* ------------------------------------------------------------------
   Main Form
------------------------------------------------------------------ */
const CreateShipment = ({ user }) => {
  const navigate = useNavigate();

  const canCreate = user?.role === 'ADMIN' || user?.role === 'LOGISTICS_MANAGER';

  const [formData, setFormData] = useState({
    shipmentNumber: '',
    productType: 'VACCINE',
    quantity: '',
    originWarehouse: '',
    destinationWarehouse: '',
    expectedDeliveryDate: '',
    price: ''
  });

  const [errors, setErrors] = useState({});
  const [shipNumStatus, setShipNumStatus] = useState(null); // 'checking' | 'ok' | 'taken'
  const [loading, setLoading] = useState(false);
  const shipNumTimer = useRef(null);

  const productRules = {
    VACCINE:       { min: 2,   max: 8   },
    FRESH_FOOD:    { min: 0,   max: 4   },
    FROZEN_FOOD:   { min: -18, max: -15 },
    CHEMICAL:      { min: 15,  max: 25  },
    BLOOD_PRODUCT: { min: 1,   max: 6   },
  };

  /* ---------- Minimum allowed date/time (now) ---------- */
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  /* ---------- Async shipment number uniqueness check ---------- */
  const checkShipmentNumber = useCallback((value) => {
    clearTimeout(shipNumTimer.current);
    if (!value || value.trim().length < 3) { setShipNumStatus(null); return; }
    setShipNumStatus('checking');
    shipNumTimer.current = setTimeout(async () => {
      try {
        const res = await apiFetch('/api/shipments');
        if (res.ok) {
          const all = await res.json();
          const taken = all.some(s => s.shipmentNumber === value.trim());
          setShipNumStatus(taken ? 'taken' : 'ok');
        }
      } catch {
        setShipNumStatus(null);
      }
    }, 500);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field error on change
    setErrors(prev => ({ ...prev, [name]: '' }));
    if (name === 'shipmentNumber') checkShipmentNumber(value);
  };

  /* ---------- Validate all fields ---------- */
  const validate = () => {
    const errs = {};
    const f = formData;

    if (!f.shipmentNumber.trim()) {
      errs.shipmentNumber = 'Shipment number is required.';
    } else if (!/^[A-Za-z0-9\-_]+$/.test(f.shipmentNumber.trim())) {
      errs.shipmentNumber = 'Only letters, numbers, hyphens, underscores allowed.';
    } else if (shipNumStatus === 'taken') {
      errs.shipmentNumber = 'This shipment number already exists. Choose a unique one.';
    }

    if (!f.quantity || isNaN(f.quantity) || parseInt(f.quantity) < 1) {
      errs.quantity = 'Quantity must be a positive whole number.';
    }

    if (!f.originWarehouse.trim()) {
      errs.originWarehouse = 'Origin location is required.';
    }
    if (!f.destinationWarehouse.trim()) {
      errs.destinationWarehouse = 'Destination location is required.';
    }
    if (f.originWarehouse.trim() && f.destinationWarehouse.trim() && f.originWarehouse.trim() === f.destinationWarehouse.trim()) {
      errs.destinationWarehouse = 'Origin and destination cannot be the same.';
    }

    if (f.expectedDeliveryDate) {
      const chosen = new Date(f.expectedDeliveryDate);
      if (chosen <= new Date()) {
        errs.expectedDeliveryDate = 'Delivery date must be in the future.';
      }
    }

    if (f.price !== '' && (isNaN(f.price) || parseFloat(f.price) < 0)) {
      errs.price = 'Price must be a non-negative number.';
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canCreate) return;

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        shipmentNumber: formData.shipmentNumber.trim(),
        quantity: parseInt(formData.quantity),
        price: formData.price !== '' ? parseFloat(formData.price) : null
      };
      if (!payload.expectedDeliveryDate) delete payload.expectedDeliveryDate;
      if (payload.price === null) delete payload.price;

      const res = await apiFetch(`/api/shipments?creatorId=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('✅ Shipment Created Successfully! Status: CREATED');
        navigate('/');
      } else {
        const text = await res.text();
        setErrors({ submit: text || 'Failed to create shipment. Please try again.' });
      }
    } catch {
      setErrors({ submit: 'Cannot connect to server. Is the backend running?' });
    } finally {
      setLoading(false);
    }
  };

  if (!canCreate) {
    return (
      <div className="card" style={{ maxWidth: '500px', margin: '3rem auto', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>Access Denied</h2>
        <p className="text-muted">Only Admins and Logistics Managers can create shipments.</p>
        <button className="btn mt-4" onClick={() => navigate('/')}>Back to Dashboard</button>
      </div>
    );
  }

  const currentRule = productRules[formData.productType];

  return (
    <div className="card" style={{ maxWidth: '680px', margin: '0 auto' }}>
      <h2 className="mb-4">Create New Shipment</h2>

      {errors.submit && (
        <div className="badge badge-danger mb-4" style={{ display: 'block', padding: '0.6rem 1rem', whiteSpace: 'normal', borderRadius: '8px' }}>
          {errors.submit}
        </div>
      )}

      <style>{`
        .input-error { border-color: var(--danger) !important; }
        .field-error { color: var(--danger); font-size: 0.78rem; margin-top: 4px; margin-bottom: 0; }
        .field-ok    { color: #10b981; font-size: 0.78rem; margin-top: 4px; }
        .shipnum-hint { font-size: 0.78rem; margin-top: 4px; }
      `}</style>

      <form onSubmit={handleSubmit} noValidate>

        {/* Shipment Number */}
        <div className="form-group">
          <label className="form-label">Shipment Number <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input
            type="text"
            className={`form-control${errors.shipmentNumber ? ' input-error' : ''}`}
            name="shipmentNumber"
            value={formData.shipmentNumber}
            onChange={handleChange}
            placeholder="e.g. SHP-2024-001"
          />
          {shipNumStatus === 'checking' && <p className="shipnum-hint" style={{ color: 'var(--text-muted)' }}>Checking availability...</p>}
          {shipNumStatus === 'ok'       && !errors.shipmentNumber && <p className="field-ok">Shipment number is available</p>}
          {shipNumStatus === 'taken'    && <p className="field-error">This shipment number is already in use</p>}
          {errors.shipmentNumber && shipNumStatus !== 'taken' && <p className="field-error">{errors.shipmentNumber}</p>}
        </div>

        {/* Product Type */}
        <div className="form-group">
          <label className="form-label">Product Type <span style={{ color: 'var(--danger)' }}>*</span></label>
          <select
            className="form-control"
            name="productType"
            value={formData.productType}
            onChange={handleChange}
          >
            <option value="VACCINE">Vaccine</option>
            <option value="FRESH_FOOD">Fresh Food</option>
            <option value="FROZEN_FOOD">Frozen Food</option>
            <option value="CHEMICAL">Chemical</option>
            <option value="BLOOD_PRODUCT">Blood Product</option>
          </select>
          <small className="text-muted" style={{ display: 'block', marginTop: '0.25rem' }}>
            System Enforced Range: <strong>{currentRule.min}°C to {currentRule.max}°C</strong>
          </small>
        </div>

        {/* Quantity */}
        <div className="form-group">
          <label className="form-label">Quantity <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input
            type="number"
            className={`form-control${errors.quantity ? ' input-error' : ''}`}
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            min="1"
            step="1"
            placeholder="Enter quantity (minimum 1)"
          />
          {errors.quantity && <p className="field-error">{errors.quantity}</p>}
        </div>

        {/* Origin / Destination — Nominatim search */}
        <div className="grid grid-cols-2">
          <LocationSearch
            label={<>Origin Warehouse <span style={{ color: 'var(--danger)' }}>*</span></>}
            value={formData.originWarehouse}
            onChange={(val) => {
              setFormData(prev => ({ ...prev, originWarehouse: val }));
              setErrors(prev => ({ ...prev, originWarehouse: '' }));
            }}
            error={errors.originWarehouse}
          />
          <LocationSearch
            label={<>Destination Warehouse <span style={{ color: 'var(--danger)' }}>*</span></>}
            value={formData.destinationWarehouse}
            onChange={(val) => {
              setFormData(prev => ({ ...prev, destinationWarehouse: val }));
              setErrors(prev => ({ ...prev, destinationWarehouse: '' }));
            }}
            error={errors.destinationWarehouse}
          />
        </div>

        {/* Expected Delivery Date */}
        <div className="form-group">
          <label className="form-label">Expected Delivery Date</label>
          <input
            type="datetime-local"
            className={`form-control${errors.expectedDeliveryDate ? ' input-error' : ''}`}
            name="expectedDeliveryDate"
            value={formData.expectedDeliveryDate}
            onChange={handleChange}
            min={getMinDateTime()}
          />
          {errors.expectedDeliveryDate && <p className="field-error">{errors.expectedDeliveryDate}</p>}
          <small className="text-muted" style={{ display: 'block', marginTop: '0.25rem' }}>
            Past dates cannot be selected
          </small>
        </div>

        {/* Price */}
        <div className="form-group">
          <label className="form-label">Shipment Price (₹)</label>
          <input
            type="number"
            className={`form-control${errors.price ? ' input-error' : ''}`}
            name="price"
            value={formData.price}
            onChange={handleChange}
            min="0"
            step="0.01"
            placeholder="Enter shipment price (optional)"
          />
          {errors.price && <p className="field-error">{errors.price}</p>}
          <small className="text-muted" style={{ display: 'block', marginTop: '0.4rem' }}>
            Revenue will be counted in the dashboard once this shipment is delivered.
          </small>
        </div>

        <button
          type="submit"
          className="btn mt-4"
          disabled={loading || shipNumStatus === 'checking' || shipNumStatus === 'taken'}
          style={{ width: '100%', padding: '0.8rem', fontSize: '1rem' }}
        >
          {loading ? 'Processing...' : 'Create Shipment'}
        </button>
      </form>
    </div>
  );
};

export default CreateShipment;
