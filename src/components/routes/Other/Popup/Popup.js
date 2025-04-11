// src/components/routes/Other/Popup/Popup.js

import React, { useEffect, useState } from 'react';
import { usePopup } from '../../../../context/PopupContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Popup.css';

const Popup = () => {
    const { popupMessages, removePopupMessage } = usePopup();
    const navigate = useNavigate();
    const [permissions, setPermissions] = useState({});

    useEffect(() => {
        const fetchUserPermissions = async () => {
            try {
                const token = localStorage.getItem('token');
                const apiUrl = process.env.REACT_APP_API_URL;
                
                const response = await axios.get(`${apiUrl}/current-user`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                const userPermissions = response.data.permissions || [];
                setPermissions(userPermissions.reduce((acc, perm) => ({ ...acc, [perm]: true }), {}));
            } catch (error) {
                console.error('Error fetching permissions:', error);
            }
        };

        fetchUserPermissions();
    }, []);

    const handleRecordClick = (customer, index) => {
        // First remove the popup
        removePopupMessage(index);
        
        // Then navigate to the customer record
        navigate(`/customers/phone/${customer.mobile}`, { 
            state: { 
                customer: customer,
                fromReminder: true,
                permissions: permissions
            },
            replace: true // Use replace to prevent back navigation to popup
        });
    };

    const handleClick = (message, index) => {
        if (message.customer) {
            handleRecordClick(message.customer, index);
        } else if (message.onClick) {
            message.onClick();
            removePopupMessage(index);
        }
    };

    if (popupMessages.length === 0) {
        return null;
    }

    return (
        <div className="popup-container">
            {popupMessages.map((message, index) => (
                <div
                    key={index}
                    className={`popup-message ${message.color || message.priority}`}
                    onClick={() => handleClick(message, index)}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="popup-content">
                        <div className="customer-details">
                            <p><strong>Name:</strong> {message.customer?.c_name}</p>
                            <p><strong>Loan Card:</strong> {message.customer?.loan_card_no}</p>
                            {/* <p><strong>CRN:</strong> {message.customer?.CRN}</p> */}
                            {/* <p><strong>Mobile:</strong> {message.customer?.mobile}</p> */}
                            <p><strong>Agent:</strong> {message.customer?.agent_name || 'Not Assigned'}</p>
                            {message.customer?.team_name && (
                                <p><strong>Team:</strong> {message.customer?.team_name}</p>
                            )}
                        </div>
                        {message.minutesUntil && (
                            <div className="time-info">
                                <p><strong>Scheduled At:</strong> {message.customer?.scheduled_at && new Date(message.customer.scheduled_at).toLocaleString()}</p>
                                <p><strong>Time Until Call:</strong> {message.minutesUntil} minutes</p>
                            </div>
                        )}
                    </div>
                    <button 
                        className="close-button"
                        onClick={(e) => {
                            e.stopPropagation();
                            removePopupMessage(index);
                        }}
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
};

export default Popup;
