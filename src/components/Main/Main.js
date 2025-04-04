// src/components/Main/Main.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './Main.css';
import Afirst from '../routes/Afirst/Afirst';
import Landing from '../routes/Landing/Landing';
import { PopupProvider, usePopup } from '../../context/PopupContext'; // Import PopupContext
import Popup from '../routes/Other/Popup/Popup';

const Main = () => {
    return (
        <Router>
            {/* Wrap the entire app with PopupProvider to provide context */}
            <PopupProvider>
                <PopupWrapper /> 
                <Routes>
                    {/* Route to the Landing component at the root path */}
                    <Route path="/" element={<Landing />} />
                    {/* Add a route for the Afirst component */}
                    <Route path="*" element={<Afirst />} />
                </Routes>
            </PopupProvider>
        </Router>
    );
};

// Component to manage Popup display
const PopupWrapper = () => {
    const { popupMessages } = usePopup(); // Get the popup messages from context
  
    return (
        <>
            {popupMessages.length > 0 && <Popup />} {/* Show popup only if there are messages */}
        </>
    );
};

export default Main;
