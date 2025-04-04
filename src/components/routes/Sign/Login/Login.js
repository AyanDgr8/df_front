// src/components/routes/Sign/Login/Login.js

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./Login.css";

const Login = () => {
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        // Clear error when user starts typing
        setError(null);
    };

    // Function to validate form inputs
    const validateForm = () => {
        const { email, password } = formData;
        if (!email || !password ) {
            setError('Please fill in all the required fields');
            return false;
        }
        if (password.length < 8) {
            setError('Please enter a password with a minimum length of 8 characters');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation checks
        if (!validateForm()) return;

        // Disable the submit button to prevent multiple submissions
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        
        try {
            // Clear any existing tokens first
            localStorage.removeItem('token');
            
            const apiUrl = process.env.REACT_APP_API_URL;
            const response = await axios.post(`${apiUrl}/login`, formData);
            
            if (response.data && response.data.token) {
                // Store the token immediately
                localStorage.setItem('token', response.data.token);
                navigate("/customers");
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error("Error during login:", error);
            if (error.response?.data?.status === 'pending') {
                setError('Your registration is pending approval. Please wait for the department admin to approve your account.');
            } else if (error.response?.data?.status === 'rejected') {
                setError('Your registration has been rejected. Please contact your department administrator.');
            } else {
                setError(error.response?.data?.message || "Login failed. Please try again.");
            }
            submitButton.disabled = false;
        }
    };

    return (
        <div className="login-page">
            <h2 className="login-headi">Login</h2>
            <div className="login-container">
                <div className="login-left">
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit}>
                        <label>Email</label>
                        <input 
                            type="email"    
                            name="email" 
                            placeholder="Enter email"
                            value={formData.email} 
                            onChange={handleInputChange} 
                            required 
                        />
                        
                        <label>Password</label>
                        <input 
                            type="password" 
                            name="password" 
                            placeholder="Enter password"
                            value={formData.password} 
                            onChange={handleInputChange} 
                            required 
                        />
                        
                        <button type="submit">Login</button>
                        <div className="forgot-password-link">
                            <Link to="/forgot-password">Forgot Password</Link>
                        </div>
                        <div className="regis">
                            <h6 className="head2">Not a registered user?</h6>
                            <Link to="/register" className="register-link">
                                Register
                            </Link>
                        </div>
                    </form>
                </div>

                <div className="login-right">
                    <img
                        src="/uploads/sign.webp"
                        className="sign-icon"
                        alt="sing icon"
                        aria-label="sign"
                    />
                </div>
            </div>
        </div>
    );
};

export default Login;
