// src/components/routes/Other/Header/Header.js

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import FileUpload from './Upload/FileUpload';
import DownloadData from './Download/DownloadData';
import "./Header.css";

const Header = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [username, setUsername] = useState('');
    const [userRole, setUserRole] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate(); 

    const fetchUser = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setIsLoading(false);
                return;
            }

            const apiUrl = process.env.REACT_APP_API_URL;
            const response = await axios.get(`${apiUrl}/current-user`, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            
            setUsername(response.data.username);
            setUserRole(response.data.role);
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Initial fetch on mount
    useEffect(() => {
        fetchUser();
    }, []);

    // Re-fetch when token changes
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUser();
        } else {
            setUsername('');
            setUserRole('');
        }
    }, [localStorage.getItem('token')]);

    const handleSearch = () => {
        if (!searchQuery.trim()) {
            alert("Please enter a search term."); 
            return;
        }

        try {
            const searchTerm = encodeURIComponent(searchQuery.trim());
            navigate(`/customers/search?query=${searchTerm}`);
            setSearchQuery('');
        } catch (error) {
            console.error('Error in search:', error);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleLogout = async () => {
        const confirmLogout = window.confirm("Are you sure you want to log out?");
        if (confirmLogout) {
            try {
                const token = localStorage.getItem("token");
                const apiUrl = process.env.REACT_APP_API_URL;
    
                const response = await fetch(`${apiUrl}/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    localStorage.removeItem("token");
                    setUsername('');
                    setUserRole('');
                    navigate("/login");
                } else {
                    alert("Error during logout, please try again.");
                }
            } catch (error) {
                console.error("Logout error:", error);
                alert("Failed to logout. Please try again later.");
            }
        }
    };

    const isLoggedIn = !!localStorage.getItem("token");

    return (
        <div className="header-container">
            <Link to="/customers">
                <img 
                    src="/uploads/logo.webp"
                    className="logo"
                    alt="Company Logo"
                    aria-label="Logo"
                />
            </Link>
            <div className="header-right">
                {isLoggedIn ? (
                    <>
                        {userRole !== 'MIS' && (
                            <div className="header-search">
                                <input
                                    type="text"
                                    className="form-control form-cont"
                                    aria-label="Search input"
                                    placeholder="Search"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                                <img 
                                    src="/uploads/search.svg"
                                    className="srch-icon"
                                    alt="search-icon"
                                    onClick={handleSearch}
                                    style={{ cursor: 'pointer' }}
                                />
                            </div>
                        )}
                        
                        <div className="file-upload-section">
                            <FileUpload />
                        </div>

                        <div className="download-section">
                            <DownloadData /> 
                        </div>
                        <div className="profile-section">
                            <img 
                                src="/uploads/fundfloat.webp"
                                className="pro-icon"
                                alt="profile icon"
                                aria-label="Profile"
                                onClick={handleLogout}
                            />
                            <span onClick={handleLogout} style={{ cursor: 'pointer', fontSize: '0.85rem', color: '#666' }}>Logout</span>
                            {!isLoading && username && (
                                <span style={{ fontSize: '0.85rem', color: '#666', marginTop: '-2.5px'  }}>
                                    {username}
                                </span>
                            )}
                        </div>
                    </>
                ) : (
                    <Link to="/login">
                        <img 
                            src="/uploads/profile.svg"
                            className="pro-icon"
                            alt="profile icon"
                            aria-label="Profile"
                        />
                    </Link>
                )}
            </div>
        </div>
    );
};

export default Header;
