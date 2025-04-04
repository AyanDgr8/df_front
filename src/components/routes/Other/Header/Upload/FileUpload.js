// src/components/routes/Other/Header/Upload/FileUpload.js

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const FileUpload = () => {
    const navigate = useNavigate();
    const [canUpload, setCanUpload] = useState(false);
    
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
                
                // Only allow Super_Admin and MIS roles to see file upload
                setCanUpload(userResponse.data.role === 'Super_Admin' || userResponse.data.role === 'MIS');
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchUser();
    }, []);
    
    const handleFileUploadClick = () => {
        navigate("/upload-customer-data");
    };

    // Only render if user has upload permission
    if (!canUpload) return null;

    return (
        <div className="file-upload-section">
            <img 
                src="/uploads/file.svg"
                className="file-icon"
                alt="file upload icon"
                aria-label="Upload file"
                onClick={handleFileUploadClick}
            />
            <span className="file-upl" onClick={handleFileUploadClick}>File Upload</span>
        </div>
    );
};

export default FileUpload;