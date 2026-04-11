import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateShipment = ({ user }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    shipmentNumber: '',
    productType: 'VACCINE',
    quantity: '',
    originWarehouse: '',
    destinationWarehouse: '',
    expectedDeliveryDate: ''
  });
  
  const [loading, setLoading] = useState(false);

  const productRules = {
    'VACCINE': { min: 2, max: 8 },
    'FRESH_FOOD': { min: 0, max: 4 },
    'FROZEN_FOOD': { min: -18, max: -15 },
    'CHEMICAL': { min: 15, max: 25 },
    'BLOOD_PRODUCT': { min: 1, max: 6 }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
          ...formData,
          quantity: parseInt(formData.quantity)
      };
      
      // If expectedDeliveryDate is empty, remove it so Spring doesn't crash on parsing
      if (!payload.expectedDeliveryDate) {
          delete payload.expectedDeliveryDate;
      }

      const res = await fetch(`http://localhost:8082/api/shipments?creatorId=${user.id}`, { 
        method: 'POST', 
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload) 
      });
      
      if(res.ok) {
          alert('Shipment Created Successfully! Status: CREATED');
          navigate('/');
      } else {
          alert('Failed to create shipment.');
      }
    } catch(err) {
      alert("Cannot connect to server");
    } finally {
      setLoading(false);
    }
  };

  const currentRule = productRules[formData.productType];

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 className="mb-4">Create New Shipment</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Shipment Number</label>
          <input 
            type="text" 
            className="form-control" 
            name="shipmentNumber" 
            value={formData.shipmentNumber} 
            onChange={handleChange} 
            required 
            placeholder="e.g. SHP-2023-001"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Product Type</label>
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

        <div className="form-group">
          <label className="form-label">Quantity</label>
          <input 
            type="number" 
            className="form-control" 
            name="quantity" 
            value={formData.quantity} 
            onChange={handleChange} 
            required
            min="1"
          />
        </div>

        <div className="grid grid-cols-2">
          <div className="form-group">
            <label className="form-label">Origin Warehouse</label>
            <input 
              type="text" 
              className="form-control" 
              name="originWarehouse" 
              value={formData.originWarehouse} 
              onChange={handleChange} 
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Destination Warehouse</label>
            <input 
              type="text" 
              className="form-control" 
              name="destinationWarehouse" 
              value={formData.destinationWarehouse} 
              onChange={handleChange} 
              required
            />
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">Expected Delivery Date (Optional)</label>
          <input 
            type="datetime-local" 
            className="form-control" 
            name="expectedDeliveryDate" 
            value={formData.expectedDeliveryDate} 
            onChange={handleChange} 
          />
        </div>

        <button type="submit" className="btn mt-4" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Processing...' : 'Create Shipment'}
        </button>
      </form>
    </div>
  );
};

export default CreateShipment;
