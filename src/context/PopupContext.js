// src/context/PopupContext.js

import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const PopupContext = createContext();

export const PopupProvider = ({ children }) => {
  const [popupMessages, setPopupMessages] = useState([]);
  const [shownMessages, setShownMessages] = useState(new Set());

  const addPopupMessage = (message, customer) => {
    setPopupMessages((prevMessages) => {
      // Check if this specific message has already been shown
      const existingMessageIndex = prevMessages.findIndex(popup => popup.message === message);
      if (existingMessageIndex !== -1) {
        // If it exists, just return the previous state (no need to add again)
        return prevMessages;
      } else {
        // Otherwise, add the new message
        return [...prevMessages, { message, customer }];
      }
    });
  };

  const removePopupMessage = (index) => {
    setPopupMessages((prevMessages) => prevMessages.filter((_, i) => i !== index));
  };

  const fetchReminders = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const token = localStorage.getItem('token'); // Get authentication token

      if (!token) {
        console.warn("No authentication token found");
        return [];
      }

      const response = await axios.get(`${apiUrl}/customers/reminders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching reminders:", error);
      if (error.response?.status === 401) {
        // Handle unauthorized access
        return [];
      }
      return [];
    }
  };

  useEffect(() => {
    const checkReminders = async () => {
      const reminders = await fetchReminders();
      const now = new Date();

      reminders.forEach((reminder) => {
        const scheduledTime = new Date(reminder.scheduled_at);
        const timeDiff = scheduledTime - now;

        if (timeDiff > 0 && timeDiff <= 60000) {
          const message = `Call scheduled for ${reminder.first_name} ${reminder.last_name} at ${scheduledTime.toLocaleString()}`;

          // Check if the message has already been shown
          if (!shownMessages.has(message)) {
            // Create a new Set to trigger re-render
            const updatedShownMessages = new Set(shownMessages);
            updatedShownMessages.add(message);
            setShownMessages(updatedShownMessages); // Update the state
            
            addPopupMessage(message, reminder); // Add the new message to the popup
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 10000);
    return () => clearInterval(interval);
  }, [shownMessages]);

  return (
    <PopupContext.Provider value={{ popupMessages, removePopupMessage }}>
      {children}
    </PopupContext.Provider>
  );
};

export const usePopup = () => useContext(PopupContext);