// src/components/routes/Forms/LastChange/LastChanges.js

import React, { useState, useEffect } from "react";
import axios from "axios"; // Import axios for making API requests
import "./LastChange.css";

const LastChanges = ({ customerId, phone_no }) => {
  const [changes, setChanges] = useState([]);

  useEffect(() => {
    const fetchChangeHistory = async () => {
      if (!customerId) {
        console.error("No customerId provided."); // Keep this for debugging
        return; // Exit if customerId is not provided
      }

      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.REACT_APP_API_URL; // Get the base URL from the environment variable
        const response = await axios.get(
          `${apiUrl}/customers/log-change/${customerId}`,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log('Change history response:', response.data); // Log the entire response to see its structure
        setChanges(response.data.changeHistory); // Assuming the response structure includes changeHistory
      } catch (error) {
        console.error("Error fetching change history:", error);
        if (error.response?.status === 403) {
          console.error("Authorization error:", error.response.data);
        }
      }
    };

    fetchChangeHistory();
  }, [customerId]); // Fetch history whenever customerId changes
  
  useEffect(() => {
    const makeUpdates = async () => {
      if (!phone_no) {
        console.error("No phone_no provided."); // Keep this for debugging
        return; // Exit if customerId is not provided
      }
      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.REACT_APP_API_URL; // Get the base URL from the environment variable
        const response = await axios.patch(
          `${apiUrl}/customers/phone/${phone_no}/updates`,
          {},
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log('Updates response:', response.data); // Log the entire response to see its structure
        setChanges(response.data.changeHistory); // Assuming the response structure includes changeHistory
      } catch (error) {
        console.error("Error updating history:", error);
        if (error.response?.status === 403) {
          console.error("Authorization error:", error.response.data);
        }
      }
    };

    makeUpdates();
  }, [phone_no]); 

  // Field name mapping
  const fieldLabels = {
    'first_name': 'First Name',
    'last_name': 'Last Name',
    'phone_no': 'Phone',
    'whatsapp_num': 'WhatsApp No',
    'email_id': 'Email',
    'yt_email_id': 'Youtube Email',
    'age_group': 'Age',
    'mentor': 'Mentor',
    'designation': 'Designation',
    'region': 'Region',
    'language': 'Language',
    'education': 'Education',
    'profession': 'Profession',
    'why_choose': 'Why Choose Us',
    'gender': 'Gender',
    'agent_name': 'Assigned Agent',
    'investment_trading': 'Investment Trading',
    'followup_count': 'Followup Count',
    'disposition': 'Disposition',
    'course': 'Course',
    'scheduled_at': 'Call Scheduler',
    'comment': 'Comment', 

  };

  return (
    <div className="last-changes-container">
        <div className="last-headi">Update History</div>
        {changes.length > 0 ? (
            changes.map((change, index) => (
            <p className="changes-content" key={index}>
              <strong>{change.changed_by}</strong> updated <strong>{fieldLabels[change.field] || change.field},</strong>{" "}
              from <em>{change.old_value || "N/A"}</em>{" "}
              <strong>to</strong> <em>{change.new_value || "N/A"}</em> {" "}
              <strong>at</strong> {new Date(change.changed_at).toLocaleString('en-GB', { 
              day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' 
              })} {" "}
            </p>
            ))
        ) : (
            <p>No changes detected.</p>
        )}
    </div> 
  );
};

export default LastChanges;
