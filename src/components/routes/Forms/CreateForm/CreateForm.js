// src/components/routes/Forms/CreateForm/CreateForm.js

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "./CreateForm.css";

const CreateForm = () => {
  const { mobile } = useParams();
  const [formData, setFormData] = useState({
    loan_card_no: '',
    CRN: '',
    c_name: '',
    product: '',
    bank_name: '',
    banker_name: '',
    mobile: '',
    ref_mobile: '',
    agent_name: '',
    tl_name: '',
    fl_supervisor: '',
    DPD_vintage: '',
    POS: '',
    emi_AMT: '',
    loan_AMT: '',
    paid_AMT: '',
    paid_date: '',
    settl_AMT: '',
    shots: '',
    resi_address: '',
    pincode: '',
    office_address: '',
    new_track_no: '',
    calling_code: 'WN',
    field_code: 'ANF',
    scheduled_at: '',
    calling_feedback: '',
    field_feedback: ''
  });

  const [formSuccess, setFormSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const apiUrl = process.env.REACT_APP_API_URL;
        const response = await axios.get(`${apiUrl}/current-user`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Set agent name in form data
        setFormData(prev => ({
          ...prev,
          agent_name: response.data.name
        }));

      } catch (error) {
        console.error('Error fetching user:', error);
        navigate('/login');
      }
    };

    fetchUser();
  }, [navigate]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle scheduled_at click
  const handleScheduledAtClick = () => {
    // Optional: Add any special handling for the datetime-local input
    console.log('Scheduling a call');
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("Authentication token not found");
        return;
      }

      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await axios.post(
        `${apiUrl}/customers/new`, 
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      console.log(response.data);
      setFormSuccess(true);
      alert("Record added successfully!");
      
      // Reset form
      setFormData({
        ...formData,
        paid_AMT: '',
        paid_date: '',
        settl_AMT: '',
        shots: '',
        new_track_no: '',
        calling_code: 'WN',
        field_code: 'ANF',
        scheduled_at: '',
        calling_feedback: '',
        field_feedback: ''
      });

      // Navigate to list view
      navigate('/customers');

    } catch (error) {
      console.error('Error adding record:', error);
      alert('Error adding record. Please try again.');
    }
  };

  return (
    <div>
      <h2 className="create_form_headiii">Create New Customer</h2>
      <div className="create-form-container">
        <form onSubmit={handleSubmit}>
          {[
            { 
              label: "Loan Card No", name: "loan_card_no", 
            },
            { 
              label: "CRN", name: "CRN",  
            },
            { 
              label: "Customer Name", name: "c_name", 
            },
            { 
              label: "Product", name: "product", 
            },
            { 
              label: "Bank Name", name: "bank_name", 
            },
            { 
              label: "Banker Name", name: "banker_name", 
            },
            { 
              label: "Mobile", name: "mobile", type: "tel", 
              maxLength: "12", 
            },
            { 
              label: "Ref Mobile", name: "ref_mobile", type: "tel", 
              maxLength: "12",  
            },
            { 
              label: "TL Name", name: "tl_name", 
            },
            { 
              label: "FM / Supervisor", name: "fl_supervisor", 
            },
            { 
              label: "DPD / Vintage", name: "DPD_vintage", 
            },
            {
              label: "POS", name: "POS", 
            },
            {
              label: "EMI Amount", name: "emi_AMT", 
            },
            {
              label: "Loan Amount", name: "loan_AMT", 
            },
            {
              label: "Paid Amount", name: "paid_AMT", 
            },
            {
              label: "Paid Date", name: "paid_date", type: "date" 
            },
            {
              label: "Settlement Amount", name: "settl_AMT", 
            },
            {
              label: "Shots", name: "shots", 
            },
            { 
              label: "Resi Address", name: "resi_address",
            },
            { 
              label: "Pincode", name: "pincode", 
            },
            { 
              label: "Office Address", name: "office_address",  
            },
            { 
              label: "New Tracing No", name: "new_track_no",  required: true 
            }
          ].map(({ label, name, type = "text", maxLength, required }) => (
            <div key={name} className="label-input">
              <label>{label}{required && <span className="required"> *</span>}:</label>
              <input
                type={type}
                name={name}
                value={formData[name] || ''}
                onChange={handleInputChange}
                maxLength={maxLength}
              />
            </div>
          ))}

          {/* calling_code Dropdown */}
          <div className="label-input">
            <label>Calling Code:</label>
            <select name="calling_code" value={formData.calling_code} onChange={handleInputChange}>
              <option value="WN">WN</option>
              <option value="NC">NC</option>   
              <option value="CB">CB</option>
              <option value="PTP">PTP</option>
              <option value="RTP">RTP</option>
            </select>
          </div>

          {/* field_code Dropdown */}
          <div className="label-input">
            <label>Field Code:</label>
            <select name="field_code" value={formData.field_code} onChange={handleInputChange}>
              <option value="ANF">ANF</option>
              <option value="SKIP">SKIP</option>   
              <option value="RTP">RTP</option>
              <option value="REVISIT">REVISIT</option>
              <option value="PTP">PTP</option>
            </select>
          </div>

          {/* Schedule Call  */}
          <div className="label-input">
            <label>Schedule Call:</label>
            <input
              type="datetime-local"
              name="scheduled_at"
              value={formData.scheduled_at}
              onChange={handleInputChange}
              onKeyDown={(e) => e.preventDefault()}
              onClick={handleScheduledAtClick}
              style={{ cursor: 'pointer' }}
              className="sche_input"
            />
          </div>

          {/* Calling Feedback Section */}
          <div className="label-input comment">
            <label>Calling Feedback:</label>
            <div className="textarea-container">
              <textarea
                name="calling_feedback"
                value={formData.calling_feedback}
                onChange={handleInputChange}
                rows="6"
                placeholder="Max 1000 characters"
                className="comet"
              />
            </div>
          </div>

          {/* Field Feedback Section */}
          <div className="label-input comment">
            <label>Field Feedback:</label>
            <div className="textarea-container">
              <textarea
                name="field_feedback"
                value={formData.field_feedback}
                onChange={handleInputChange}
                rows="6"
                placeholder="Max 1000 characters"
                className="comet"
              />
            </div>
          </div>

          <button type="submit" className="submit-btn">
            Add Customer
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateForm;
