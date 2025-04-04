// src/components/routes/Forms/CreateForm/CreateForm.js

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "./CreateForm.css";

const CreateForm = () => {
  const { phone_no } = useParams();
  const [newCustomer, setNewCustomer] = useState({
    first_name: '',
    last_name: '',
    course: 'Elite Program',
    age_group: '',
    profession: '',
    investment_trading: 'Investment',
    why_choose: '',
    language: '',
    education: '',
    region: '', 
    designation:'',
    phone_no: '',
    whatsapp_num: '',
    email_id: '',
    yt_email_id: '',
    gender: 'male',
    disposition: 'interested',
    comment: '',
    agent_name: '',
  });

  const [formSuccess, setFormSuccess] = useState(false);
  const navigate = useNavigate();

  // Fetch current user when component mounts
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.REACT_APP_API_URL;
        const response = await axios.get(`${apiUrl}/current-user`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        
        // Set the agent_name to the current user's username
        setNewCustomer(prev => ({
          ...prev,
          agent_name: response.data.username
        }));
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUser();
  }, []);

  // Handle input change
  const handleChange = (e) => {
    setNewCustomer({
      ...newCustomer,
      [e.target.name]: e.target.value,
    });
  };

  // Handle form submission
  const handleAddRecord = async (e) => {
    e.preventDefault();
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const phoneNumber = newCustomer.phone_no;
      
      if (!phoneNumber) {
        alert("Phone number is required");
        return;
      }

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${apiUrl}/customer/new/${phoneNumber}`, 
        newCustomer,
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
      setNewCustomer({
        first_name: '',
        last_name: '',
        course: 'Elite Program',
        age_group: '',
        profession: '',
        investment_trading: 'Investment',
        why_choose: '',
        language: '',
        education: '',
        region: '', 
        designation:'',
        phone_no: '',
        whatsapp_num: '',
        email_id: '',
        yt_email_id: '',
        gender: 'male',
        disposition: 'interested',
        comment: '',
        agent_name: newCustomer.agent_name, // Preserve the agent_name
      });
      navigate("/customers");

    } catch (error) {
      if (error.response && error.response.data) {
        if (error.response.data.errors) {
          // Display each backend error as an alert
          const backendErrors = error.response.data.errors;
          Object.values(backendErrors).forEach((message) => {
            alert(`Error: ${message}`);
          });
        } else {
          // Show the main error message from the backend response, if available
          alert(`${error.response.data.message || "Failed to add record. Please try again."}`);
        }
      } else {
        // Display a generic error if there's no detailed error response
        alert(`Failed to add record: ${error.message}`);
      }
      console.error("Error adding record:", error); // Log the error for debugging
    }
  };

  // // Function to handle navigation to home
  // const handleHomeClick = () => {
  //   navigate('/customers');
  // }

  return (
    <div>
        <h2 className="create_form_headiii">Create New Customer</h2>
        <div className="create-form-container">
          <form onSubmit={handleAddRecord}>
            {/* Your input fields */}
            {[
              { label: "First Name:", name: "first_name",required: true },
              { label: "Last Name:", name: "last_name" },
              { label: "Phone:", name: "phone_no",required: true},
              { label: "WhatsApp:", name: "whatsapp_num" },
              { label: "Email:", name: "email_id" },
              { label: "Youtube Email:", name: "yt_email_id" },
              { label: "Designation:", name: "designation" },
              { label: "Region:", name: "region" },
              { label: "Language:", name: "language" },
              { label: "Education:", name: "education" },
              { label: "Profession:", name: "profession" },
              { label: "Why Choose:", name: "why_choose" },
              { label: "Age Group:", name: "age_group" },
            ].map(({ label, name, type = "text", disabled = false, required = false }) => (
              <div className="label-input" key={name}>
                <label>{label}</label>
                <input
                  type={type}
                  name={name}
                  value={newCustomer[name]}
                  onChange={handleChange}
                  disabled={disabled}
                  required={required} 
                />
              </div>
            ))}

            {/* Gender Dropdown */}
            <div className="label-input">
              <label>Gender:</label>
                <select name="gender" value={newCustomer.gender} onChange={handleChange}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
            </div>

            {/* Course Dropdown */}
            <div className="label-input">
                <label>Course:</label>
                <select name="course" value={newCustomer.course} onChange={handleChange}>
                    <option value="Elite Program">Elite Program</option>
                    <option value="Extra Earners">Extra Earners</option>
                    <option value="Advanced TFL">Advanced TFL</option>
                </select>
            </div>

            {/* Disposition Dropdown */}
            <div className="label-input">
                <label>Disposition:</label>
                <select name="disposition" value={newCustomer.disposition} onChange={handleChange}>
                    <option value="interested">Interested</option>
                    <option value="not interested">Not Interested</option>
                    <option value="needs to call back">Needs to Call Back</option>
                    <option value="switched off">Switched Off</option>
                    <option value="ringing no response">Ringing No Response</option>
                    <option value="follow-up">Follow-Up</option>
                    <option value="invalid number">Invalid Number</option>
                </select>
            </div>

            {/* Investment Trading Dropdown */}
            <div className="label-input">
                <label>Investment Trading:</label>
                <select name="investment_trading" value={newCustomer.investment_trading} onChange={handleChange}>
                    <option value="Investment">Investment</option>
                    <option value="Trading">Trading</option>
                </select>
            </div>

            {/* Comment Section */}
            <div className="label-input comment">
              <label>Comment:</label>
              <div className="textarea-container">
                <textarea
                  name="comment"
                  value={newCustomer.comment}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Enter any additional comments"
                  className="comet"
                />
              </div>
            </div>

            <button type="submit" className="submit-btn">
              Add Customer
            </button>
          </form>
        </div>
      {/* Updated button to navigate to /customers
      <button className="add-home-btn"onClick={handleHomeClick}>Home</button> */}
    </div>
  );
};

export default CreateForm;
