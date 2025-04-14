// src/components/routes/Forms/UseForm/UseForm.js

import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import "./UseForm.css";
import LastChanges from "../LastChange/LastChange";


const UseForm = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { mobile } = useParams();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasDeletePermission, setHasDeletePermission] = useState(false);
    const [error, setError] = useState(null); 
    const [customer, setCustomer] = useState(null);
    const [availableAgents, setAvailableAgents] = useState([]); 
    const alertShownRef = useRef(false); // Use a ref to track if the alert has been shown

    const [formData, setFormData] = useState({
        loan_card_no: '',
        c_name: '',
        product: '',
        CRN: '',
        bank_name: '',
        banker_name: '',
        agent_name: '',
        tl_name: '',
        fl_supervisor: '',
        DPD_vintage: '',
        POS: '',
        emi_AMT: '',
        loan_AMT: '',
        paid_AMT: '',
        paid_date: '',
        settl_AMT: '',
        shots: '',
        resi_address: '',
        pincode: '',
        office_address: '',
        mobile: '',
        ref_mobile: '',
        calling_code: 'WN',
        calling_feedback: '',
        field_feedback: '',
        new_track_no: '',
        field_code: 'ANF',
        scheduled_at: ''
    });

    const [updatedData, setUpdatedData] = useState(formData);

    const validatePhoneNumber = (value) => {
        // Remove any non-digit characters and limit to 12 digits
        return value.replace(/\D/g, '').slice(0, 12);
    };

    const validatePhoneNumberLength = (mobile, ref_mobile) => {
        // Convert to string and handle null/undefined
        const mobileStr = String(mobile || '');
        const refMobileStr = String(ref_mobile || '');
        
        const digitsOnly = mobileStr.replace(/\D/g, '');
        const refDigitsOnly = refMobileStr.replace(/\D/g, '');
        
        return digitsOnly.length >= 9 && digitsOnly.length <= 12 && 
               refDigitsOnly.length >= 9 && refDigitsOnly.length <= 12;
    };

    const validateRequiredFields = () => {
        const requiredFields = ['c_name', 'mobile', 'ref_mobile'];
        const missingFields = requiredFields.filter(field => {
            const value = formData[field];
            return !value || (typeof value === 'string' && !value.trim());
        });
        
        if (missingFields.length > 0) {
            setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
            return false;
        }
        return true;
    };

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            
            // Format as YYYY-MM-DDThh:mm
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        } catch (error) {
            console.error('Error formatting date:', error);
            return '';
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value || ''; // Ensure value is never null
        
        // For phone numbers, only allow digits and limit to 12 digits
        if (name === 'mobile' || name === 'ref_mobile') {
            processedValue = validatePhoneNumber(value || '');
        } 
        // For comment fields, check character limit
        else if ((name === 'calling_feedback' || name === 'field_feedback') && value?.length > 500) {
            alert('Comment cannot exceed 500 characters');
            return;
        }
        // For date fields, ensure proper format
        else if (name === 'scheduled_at' || name === 'paid_date') {
            processedValue = formatDateForInput(value || '');
        }

        setFormData(prev => ({
            ...prev,
            [name]: processedValue
        }));
        setUpdatedData(prev => ({
            ...prev,
            [name]: processedValue
        }));
    };

    const checkForDuplicates = async (updatedFormData) => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.REACT_APP_API_URL;
            
            // Only check for duplicates if these fields have changed
            const fieldsToCheck = {};
            if (updatedFormData.mobile !== customer.mobile) fieldsToCheck.mobile = updatedFormData.mobile;
            if (updatedFormData.ref_mobile !== customer.ref_mobile) fieldsToCheck.ref_mobile = updatedFormData.ref_mobile;

            if (Object.keys(fieldsToCheck).length === 0) return true; // No fields to check

            const response = await axios.post(
                `${apiUrl}/customers/check-duplicates`,
                {
                    ...fieldsToCheck,
                    currentCustomerId: customer.id
                },
                {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.data.duplicates && response.data.duplicates.length > 0) {
                const errorMessages = response.data.duplicates.join('\n');
                alert(`Duplicate values found:\n${errorMessages}`);
                return false;
            }
            return true;
        } catch (error) {
            console.error('Duplicate check error:', error);
            alert(`Error checking for duplicates: ${error.response?.data?.message || error.message}`);
            return false;
        }
    };

    const handleScheduledAtClick = (e) => {
        // Remove readonly temporarily to allow picker to show
        e.target.readOnly = false;
        e.target.showPicker();
        // Add an event listener to make it readonly again after selection
        e.target.addEventListener('blur', function onBlur() {
            e.target.readOnly = true;
            e.target.removeEventListener('blur', onBlur);
        });
    };

    const fetchUser = async () => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.REACT_APP_API_URL;

            // Get user data
            const userResponse = await axios.get(`${apiUrl}/current-user`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            setUser(userResponse.data);
            
            // Get permissions from API response
            const permissions = userResponse.data.permissions || [];
            console.log('Latest user permissions from API:', permissions);
            
            // Check for delete permission
            const hasDeletePerm = Array.isArray(permissions) && permissions.includes('delete_customer');
            console.log('Has delete permission:', hasDeletePerm);
            setHasDeletePermission(hasDeletePerm);

                // Then get the available agents based on user's role
                try {
                    const agentsResponse = await axios.get(`${apiUrl}/players/teams`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    setAvailableAgents(agentsResponse.data);
        } catch (error) {
                    console.error('Error fetching available agents:', error);
                    setError('Failed to fetch available agents');
                }

            } catch (error) {
                console.error('Error in fetchUser:', error);
            setError('Failed to fetch user data');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
        const fetchCustomerData = async () => {
            if (location.state?.customer) {
                setCustomer(location.state.customer);
                setFormData(location.state.customer);
                setLoading(false);
            } else if (mobile) {
                try {
                    const apiUrl = process.env.REACT_APP_API_URL;
                    const token = localStorage.getItem('token');
                    const response = await axios.get(`${apiUrl}/customers/phone/${mobile}`, {
                        headers: { 
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json", 
                        },
                    });
                    if (response.data?.customer) {
                        setCustomer(response.data.customer);
                        setFormData(response.data.customer);
                    } else {
                        navigate(`/customer/new/${mobile}`, { state: { mobile } });
                    }
                } catch (error) {
                    if (!alertShownRef.current && error.response?.status === 404) {
                        alert("Customer not found. Redirecting to create a new customer.");
                        alertShownRef.current = true;
                        navigate(`/customer/new/${mobile}`, { state: { mobile } });
                    } else {
                        console.error(error);
                    }
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchCustomerData();
    }, [mobile]); // Add mobile as dependency since it's used in fetchCustomerData

    const handleDelete = async () => {
        if (!hasDeletePermission) {
            alert("You do not have permission to delete customers.");
            return;
        }
        const confirmDelete = window.confirm("Are you sure you want to delete this customer?");
        if (!confirmDelete) return;

        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.REACT_APP_API_URL;

            await axios.delete(`${apiUrl}/customers/${customer.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            alert("Customer deleted successfully.");
            navigate("/customers");
        } catch (error) {
            if (error.response && error.response.status === 403) {
                alert("You do not have permission to delete customers.");
                // Refresh user data to get latest permissions
                const fetchUser = async () => {
                    try {
                        const token = localStorage.getItem('token');
                        const apiUrl = process.env.REACT_APP_API_URL;

                        // First get the current user's data
                        const userResponse = await axios.get(`${apiUrl}/current-user`, {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        });

                        setUser(userResponse.data);
                        
                        // Get permissions from API response only
                        const permissions = userResponse.data.permissions || [];
                        console.log('Latest user permissions from API:', permissions);
                        
                        // Check if delete_customer permission exists in the array
                        const hasDeletePerm = Array.isArray(permissions) && permissions.includes('delete_customer');
                        console.log('Has delete permission:', hasDeletePerm);
                        setHasDeletePermission(hasDeletePerm);

                        // Then get the available agents based on user's role
                        try {
                            const agentsResponse = await axios.get(`${apiUrl}/players/teams`, {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                }
                            });
                            setAvailableAgents(agentsResponse.data);
                        } catch (error) {
                            console.error('Error fetching available agents:', error);
                            setError('Failed to fetch available agents');
                        }

                    } catch (error) {
                        console.error('Error in fetchUser:', error);
                        setError('Failed to fetch user data');
                        setLoading(false);
                    }
                };
                await fetchUser();
            } else {
                console.error("Error deleting customer:", error);
                alert("Failed to delete customer. Please try again.");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate required fields
        if (!validateRequiredFields()) {
            return;
        }

        // Validate phone number length
        if (!validatePhoneNumberLength(formData.mobile, formData.ref_mobile)) {
            alert('Phone number must be between 9 and 12 digits');
            return;
        }

        // Check for duplicates before proceeding
        const isDuplicatesFree = await checkForDuplicates(formData);
        if (!isDuplicatesFree) {
            return;
        }

        // Track changes
        const changes = Object.keys(formData).reduce((acc, key) => {
            if (formData[key] !== customer[key]) {
                acc.push({
                    field: key,
                    old_value: customer[key],
                    new_value: formData[key],
                });
            }
            return acc;
        }, []);

        if (!changes.length) {
            alert("No changes made.");
            navigate("/customers");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.REACT_APP_API_URL;
            
            // Update customer data
            const response = await axios.put(
                `${apiUrl}/customers/${customer.id}`, 
                formData,
                {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            setCustomer(formData);
            setFormData(formData);
            navigate("/customers");
        } catch (error) {
            console.error('Update error:', error);
            const backendErrors = error.response?.data?.errors;
            if (backendErrors) {
                Object.values(backendErrors).forEach((msg) => alert(`Error: ${msg}`));
            } else {
                alert(`Failed to update record: ${error.response?.data?.message || error.message}`);
            }
        }
    };
    
    if (loading) return <div>Loading customer data...</div>;
    if (!customer) return <div>No customer data found.</div>;

    return (
        <div>
            <div className="header-containerrr">
                <Link to="/customers">
                    <img src="/uploads/house-fill.svg" alt="Home" className="home-icon" />
                </Link>
                <h2 className="list_form_headiii">Edit Customer</h2>
            </div>
            <div className="use-last-container">
                <div className="use-form-container">
                    <form onSubmit={handleSubmit}>
                        {/* Your input fields */}
                        {[
                            { 
                                label: "Loan Card No", name: "loan_card_no", disabled: true
                            },
                            { 
                                label: "CRN", name: "CRN", disabled: true 
                            },
                            { 
                                label: "Customer Name", name: "c_name",disabled: true 
                            },
                            { 
                                label: "Product", name: "product",disabled: true 
                            },
                            { 
                                label: "Bank Name", name: "bank_name", disabled: true 
                            },
                            { 
                                label: "Banker Name", name: "banker_name",disabled: true 
                            },
                            { 
                                label: "Mobile", name: "mobile", type: "tel", 
                                maxLength: "12",disabled: true 
                            },
                            { 
                                label: "Ref Mobile", name: "ref_mobile", type: "tel", 
                                maxLength: "12",disabled: true  
                            },
                            { 
                                label: "Mobile 3", name: "mobile_3", type: "tel", 
                                maxLength: "12",disabled: true  
                            },
                            { 
                                label: "Mobile 4", name: "mobile_4", type: "tel", 
                                maxLength: "12",disabled: true  
                            },
                            { 
                                label: "Mobile 5", name: "mobile_5", type: "tel", 
                                maxLength: "12",disabled: true  
                            },
                            { 
                                label: "Mobile 6", name: "mobile_6", type: "tel", 
                                maxLength: "12",disabled: true  
                            },
                            { 
                                label: "Mobile 7", name: "mobile_7", type: "tel", 
                                maxLength: "12",disabled: true  
                            },
                            { 
                                label: "Mobile 8", name: "mobile_8", type: "tel", 
                                maxLength: "12",disabled: true  
                            },
                            { 
                                label: "TL Name", name: "tl_name", disabled: true 
                            },
                            { 
                                label: "FM / Supervisor", name: "fl_supervisor",disabled: true 
                            },
                            { 
                                label: "DPD / Vintage", name: "DPD_vintage",disabled: true 
                            },
                            {
                                label: "POS", name: "POS",disabled: true 
                            },
                            {
                                label: "EMI Amount", name: "emi_AMT", disabled: true 
                            },
                            {
                                label: "Loan Amount", name: "loan_AMT", disabled: true 
                            },
                            {
                                label: "Paid Amount", name: "paid_AMT", required: true 
                            },
                            {
                                label: "Paid Date", name: "paid_date", type: "date", required: true 
                            },
                            {
                                label: "Settlement Amount", name: "settl_AMT", required: true ,
                            },
                            {
                                label: "Shots", name: "shots", required: true 
                            },
                            { 
                                label: "Resi Address", name: "resi_address",required: true ,disabled: true 
                            },
                            { 
                                label: "Pincode", name: "pincode",required: true ,disabled: true 
                            },
                            { 
                                label: "Office Address", name: "office_address",required: true ,disabled: true 
                            },
                            { 
                                label: "New Tracing No", name: "new_track_no",required: true 
                            },
                        ].map(({ label, name, type = "text", disabled, maxLength, required }) => (
                            <div key={name} className="label-input">
                                <label>{label}{required && <span className="required"> *</span>}:</label>
                                <input
                                    type={type}
                                    name={name}
                                    value={formData[name] || ''}
                                    onChange={handleInputChange}
                                    disabled={disabled}
                                    maxLength={maxLength}
                                />
                            </div>
                        ))}

                        {/* Agent Name Field */}
                        <div className="label-input">
                            <label>Agent Name:</label>
                            <input
                                type="text"
                                name="agent_name"
                                value={formData.agent_name || ''}
                                disabled
                                className="agent-input"
                            />
                        </div>

                        {/* calling_code Dropdown */}
                        <div className="label-input">
                            <label>Calling Code:</label>
                            <select name="calling_code" value={formData.calling_code} onChange={handleInputChange}>
                                <option value="WN">WN</option>
                                <option value="NC">NC</option>   
                                <option value="CB">CB</option>
                                <option value="PTP">PTP</option>
                                <option value="RTP">RTP</option>
                            </select>
                        </div>

                        {/* field_code Dropdown */}
                        <div className="label-input">
                            <label>Field Code:</label>
                            <select name="field_code" value={formData.field_code} onChange={handleInputChange}>
                                <option value="ANF">ANF</option>
                                <option value="SKIP">SKIP</option>   
                                <option value="RTP">RTP</option>
                                <option value="REVISIT">REVISIT</option>
                                <option value="PTP">PTP</option>
                            </select>
                        </div>


                        {/* Schedule Call  */}
                        <div className="label-input">
                            <label>Schedule Call:</label>
                            <input
                                type="datetime-local"
                                name="scheduled_at"
                                value={formData.scheduled_at || ''}
                                onChange={handleInputChange}
                                onKeyDown={(e) => e.preventDefault()}
                                onClick={handleScheduledAtClick}
                                style={{ cursor: 'pointer' }}
                                className="sche_input"
                            />
                        </div>

                        {/* Calling Feedback Section */}
                        <div className="label-input comment">
                            <label>Calling Feedback:</label>
                            <div className="textarea-container">
                                <textarea
                                    name="calling_feedback"
                                    value={formData.calling_feedback || ''}
                                    onChange={handleInputChange}
                                    rows="6"
                                    placeholder="Max 500 characters"
                                    className="comet"
                                />
                            </div>
                        </div>

                        {/* Field Feedback Section */}
                        <div className="label-input comment">
                            <label>Field Feedback:</label>
                            <div className="textarea-container">
                                <textarea
                                    name="field_feedback"
                                    value={formData.field_feedback || ''}
                                    onChange={handleInputChange}
                                    rows="6"
                                    placeholder="Max 500 characters"
                                    className="comet"
                                />
                            </div>
                        </div>

                        <button className="sbt-use-btn" type="submit">Update</button>
                    </form>
                    {hasDeletePermission && (  
                        <button 
                            onClick={handleDelete} 
                            className="add-field-btnnn"
                            aria-label="Delete customer"
                        >
                            Delete Record
                        </button>
                    )}
                </div>

                <div>
                    {/* Pass customerId to LastChanges */}
                    <LastChanges 
                        customerId={customer?.id || ''} 
                        mobile={formData?.mobile || ''}
                    />
                </div>
            </div>

        </div>
    );
};

export default UseForm;