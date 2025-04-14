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
    mobile_3: '',
    mobile_4: '',
    mobile_5: '',
    mobile_6: '',
    mobile_7: '',
    mobile_8: '',
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
  const [error, setError] = useState('');
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState(null);
  const [duplicateAction, setDuplicateAction] = useState('skip');
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

  // Validate required fields
  const validateRequiredFields = () => {
    const requiredFields = [
      "loan_card_no", "CRN", "c_name", "product", "bank_name", "banker_name",
      "mobile", "tl_name", "fl_supervisor", "DPD_vintage", "POS", "emi_AMT",
      "loan_AMT", "paid_AMT", "paid_date", "settl_AMT", "shots", 
      "resi_address", "pincode", "office_address", "new_track_no"
    ];

    for (let field of requiredFields) {
      if (!formData[field] || formData[field].trim() === "") {
        setError(`Please fill out the "${field.replace(/_/g, ' ').toUpperCase()}" field.`);
        return false;
      }
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e, action = 'prompt') => {
    e.preventDefault();
    setError('');

    // First validate required fields
    if (!validateRequiredFields()) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found');
        return;
      }

      const apiUrl = process.env.REACT_APP_API_URL;

      const response = await axios.post(
        `${apiUrl}/customers/new`, 
        { ...formData, duplicateAction: action },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      if (response.data.success) {
        console.log(response.data);
        setFormSuccess(true);
        alert("Record added successfully!");
        setFormData({
          loan_card_no: '',
          CRN: '',
          c_name: '',
          product: '',
          bank_name: '',
          banker_name: '',
          mobile: '',
          ref_mobile: '',
          mobile_3: '',
          mobile_4: '',
          mobile_5: '',
          mobile_6: '',
          mobile_7: '',
          mobile_8: '',
          agent_name: formData.agent_name,  // Preserving agent name
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
        navigate('/customers');
      }
    } catch (error) {
      if (error.response?.status === 409) {
        // Handle duplicate record
        setDuplicateInfo(error.response.data);
        setShowDuplicateDialog(true);
      } else {
        console.error('Error adding record:', error);
        setError(error.response?.data?.message || 'Error adding record. Please try again.');
      }
    }
  };

  const handleDuplicateAction = (action) => {
    // Validate required fields again before proceeding with the action
    if (!validateRequiredFields()) {
      return;
    }

    setShowDuplicateDialog(false);
    handleSubmit({ preventDefault: () => {} }, action);
  };

  return (
    <div>
      <h2 className="create_form_headiii">Create New Customer</h2>
      <div className="create-form-container">
        {error && <div className="error-messagee">{error}</div>}
        
        {showDuplicateDialog && duplicateInfo && (
          <div className="duplicate-dialog">
            <h3>Duplicate Record Found</h3>
            <p>
              {duplicateInfo.loan_card_no_exists 
                ? "Loan card number already exists" 
                : "CRN already exists"}
            </p>
            
            <div className="existing-record">
              <h4>Existing Record:</h4>
              <table>
                <thead>
                  <tr>
                    <th>CRN</th>
                    <th>Loan Card No</th>
                    <th>Name</th>
                    <th>Mobile</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{duplicateInfo.existing_record.CRN}</td>
                    <td>{duplicateInfo.existing_record.loan_card_no}</td>
                    <td>{duplicateInfo.existing_record.c_name}</td>
                    <td>{duplicateInfo.existing_record.mobile}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="duplicate-actionss">
              <h4>Choose Action:</h4>
              <div className="action-containerr">
                <select 
                  value={duplicateAction}
                  onChange={(e) => setDuplicateAction(e.target.value)}
                  className="duplicate-action-selectt"
                >
                  <option value="skip">Not Upload Duplicate</option>
                  <option value="append">Append with suffix (__1, __2, etc.)</option>
                  <option value="replace">Replace existing record</option>
                </select>
                <div className="button-group">
                  <button 
                    onClick={() => handleDuplicateAction(duplicateAction)}
                    className="action-buttonnn-continue"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={(e) => handleSubmit(e, 'prompt')} className="create-form">
          {[
            { 
              label: "Loan Card No", name: "loan_card_no", required: true 
            },
            { 
              label: "CRN", name: "CRN",  required: true 
            },
            { 
              label: "Customer Name", name: "c_name", required: true 
            },
            { 
              label: "Product", name: "product", required: true 
            },
            { 
              label: "Bank Name", name: "bank_name", required: true 
            },
            { 
              label: "Banker Name", name: "banker_name", required: true 
            },
            { 
              label: "Mobile", name: "mobile", type: "tel", 
              maxLength: "12", required: true 
            },
            { 
              label: "Ref Mobile", name: "ref_mobile", type: "tel", 
              maxLength: "12",  
            },
            { 
                label: "Mobile 3", name: "mobile_3", type: "tel", 
                maxLength: "12",
            },
            { 
                label: "Mobile 4", name: "mobile_4", type: "tel", 
                maxLength: "12",  
            },
            { 
                label: "Mobile 5", name: "mobile_5", type: "tel", 
                maxLength: "12",  
            },
            { 
                label: "Mobile 6", name: "mobile_6", type: "tel", 
                maxLength: "12",  
            },
            { 
                label: "Mobile 7", name: "mobile_7", type: "tel", 
                maxLength: "12",
            },
            { 
                label: "Mobile 8", name: "mobile_8", type: "tel", 
                maxLength: "12", 
            },
            { 
              label: "TL Name", name: "tl_name", required: true 
            },
            { 
              label: "FM / Supervisor", name: "fl_supervisor", required: true 
            },
            { 
              label: "DPD / Vintage", name: "DPD_vintage", required: true 
            },
            {
              label: "POS", name: "POS", required: true 
            },
            {
              label: "EMI Amount", name: "emi_AMT", required: true 
            },
            {
              label: "Loan Amount", name: "loan_AMT", required: true 
            },  
            {
              label: "Paid Amount", name: "paid_AMT", required: true 
            },
            {
              label: "Paid Date", name: "paid_date", type: "date", required: true 
            },
            {
              label: "Settlement Amount", name: "settl_AMT", required: true 
            },
            {
              label: "Shots", name: "shots", required: true 
            },
            { 
              label: "Resi Address", name: "resi_address", required: true 
            },
            { 
              label: "Pincode", name: "pincode", required: true 
            },
            { 
              label: "Office Address", name: "office_address", required: true 
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

          <button type="submit" className="submit-btn submmit-button">
            Add Customer
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateForm;
