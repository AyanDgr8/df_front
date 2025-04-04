// src/components/routes/Other/Header/DownloadData.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const DownloadData = () => {
    const navigate = useNavigate();
    const [canDownload, setCanDownload] = useState(false);
    
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem('token');
                const apiUrl = process.env.REACT_APP_API_URL;
                const userResponse = await axios.get(`${apiUrl}/current-user`, {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });
                
                setCanDownload(userResponse.data.role === 'Super_Admin' || userResponse.data.role === 'Department_Admin');
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchUser();
    }, []);

    const handleDownloadClick = () => {
        navigate("/download-data");
    };

    if (!canDownload) return null;

    return (
        <div className="download-section">
            <img 
                src="/uploads/download.svg"
                className="download-icon"
                alt="download icon"
                aria-label="Download data"
                onClick={handleDownloadClick}
            />
            <span className="download-text" onClick={handleDownloadClick}>Download Data</span>
        </div>
    );
};

export default DownloadData;