// src/components/routes/Other/Popup/Popup.js

import React from 'react';
import './Popup.css';
import { useNavigate } from 'react-router-dom';
import { usePopup } from '../../../../context/PopupContext';

const Popup = () => {
  const { popupMessages, removePopupMessage } = usePopup();
  const navigate = useNavigate();

  const openRecord = (customer) => {
    navigate('/customers/phone/' + customer.phone_no, { state: { customer } });
  };

  return (
    <div className="popup-overlay">
      {popupMessages.map((popup, index) => (
        <div key={index} className="popup-container" onClick={() => openRecord(popup.customer)}>
          <div className="popup-message">
            {popup.message}
          </div>
          <button
            className="close-btn"
            onClick={(e) => { e.stopPropagation(); removePopupMessage(index); }}
          >
            X
          </button>
        </div>
      ))}
    </div>
  );
};

export default Popup;
