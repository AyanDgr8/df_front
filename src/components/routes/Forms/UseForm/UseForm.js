// src/components/routes/Forms/UseForm/UseForm.js

import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import "./UseForm.css";
import LastChanges from "../LastChange/LastChange";


const UseForm = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { phone_no } = useParams();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isSuper, setIsSuper] = useState(false);
    const [error, setError] = useState(null); 
    const [customer, setCustomer] = useState(null);
    const [availableAgents, setAvailableAgents] = useState([]); 
    const alertShownRef = useRef(false); // Use a ref to track if the alert has been shown

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        course: '',
        age_group: '',
        profession: '',
        investment_trading: '',
        why_choose: '',
        language: '',
        education: '',
        region: '', 
        designation:'',
        phone_no: '',
        whatsapp_num: '',
        email_id: '',
        yt_email_id: '',
        gender: '',
        disposition: '',
        mentor: '',
        comment: '',
        scheduled_at: '',
        agent_name: '',
        followup_count: '',
    });

    const [updatedData, setUpdatedData] = useState(formData);

    const validatePhoneNumber = (value) => {
        // Remove any non-digit characters and limit to 12 digits
        return value.replace(/\D/g, '').slice(0, 12);
    };

    const validateAgeGroup = (value) => {
        // Remove non-digits and limit to 2 digits
        return value.replace(/\D/g, '').slice(0, 2);
    };

    const validatePhoneNumberLength = (phoneNumber) => {
        const digitsOnly = phoneNumber.replace(/\D/g, '');
        return digitsOnly.length >= 9 && digitsOnly.length <= 12;
    };

    const validateRequiredFields = () => {
        const requiredFields = ['first_name', 'phone_no', 'email_id'];
        const missingFields = requiredFields.filter(field => !formData[field]?.trim());
        
        if (missingFields.length > 0) {
            const fieldNames = missingFields.map(field => 
                field.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')
            ).join(', ');
            alert(`Please fill in the required fields: ${fieldNames}`);
            return false;
        }
        return true;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // For phone numbers, only allow digits and limit to 12 digits
        if (name === 'phone_no' || name === 'whatsapp_num') {
            const validatedValue = validatePhoneNumber(value);
            setFormData(prev => ({
                ...prev,
                [name]: validatedValue
            }));
            setUpdatedData(prev => ({
                ...prev,
                [name]: validatedValue
            }));
        } 
        // For age_group, limit to 2 digits
        else if (name === 'age_group') {
            const validatedValue = validateAgeGroup(value);
            setFormData(prev => ({
                ...prev,
                [name]: validatedValue
            }));
            setUpdatedData(prev => ({
                ...prev,
                [name]: validatedValue
            }));
        }
        // For comment field, check character limit
        else if (name === 'comment') {
            if (value.length > 1000) {
                alert('Comment cannot exceed 1000 characters');
                return;
            }
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
            setUpdatedData(prev => ({
                ...prev,
                [name]: value
            }));
        }
        else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
            setUpdatedData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const checkForDuplicates = async (updatedFormData) => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.REACT_APP_API_URL;
            
            // Only check for duplicates if these fields have changed
            const fieldsToCheck = {};
            if (updatedFormData.phone_no !== customer.phone_no) fieldsToCheck.phone_no = updatedFormData.phone_no;
            if (updatedFormData.whatsapp_num !== customer.whatsapp_num) fieldsToCheck.whatsapp_num = updatedFormData.whatsapp_num;
            if (updatedFormData.email_id !== customer.email_id) fieldsToCheck.email_id = updatedFormData.email_id;

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
                console.log(userResponse.data); // Log user data
                setUser(userResponse.data);
                
                // Check if the user is an admin (check both role and isAdmin flag)
                const isAdminUser = userResponse.data.role === 'Super_Admin' || userResponse.data.role === 'Department_Admin' || userResponse.data.isAdmin;

                setIsAdmin(isAdminUser);
                console.log("Is admin:", isAdminUser);

                // If user is admin, fetch available agents
                if (isAdminUser) {
                    try {
                        const agentsResponse = await axios.get(`${apiUrl}/users`, {
                            headers: { 
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json", 
                            },
                        });
                        console.log("Available agents:", agentsResponse.data);
                        setAvailableAgents(agentsResponse.data); // Updated to use direct response data
                    } catch (error) {
                        console.error('Error fetching available agents:', error);
                    }
                }
            } catch (error) {
                setError('Failed to fetch user data.');
                console.error('Error fetching user data:', error);
            }
        };

        fetchUser();
    }, []);

    useEffect(() => {
        const fetchCustomerData = async () => {
            if (location.state?.customer) {
                setCustomer(location.state.customer);
                setFormData(location.state.customer);
                setLoading(false);
            } else if (phone_no) {
                try {
                    const apiUrl = process.env.REACT_APP_API_URL;
                    const token = localStorage.getItem('token');
                    const response = await axios.get(`${apiUrl}/customers/phone/${phone_no}`, {
                        headers: { 
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json", 
                        },
                    });
                    if (response.data?.customer) {
                        setCustomer(response.data.customer);
                        setFormData(response.data.customer);
                    } else {
                        navigate(`/customer/new/${phone_no}`, { state: { phone_no } });
                    }
                } catch (error) {
                    if (!alertShownRef.current && error.response?.status === 404) {
                        alert("Customer not found. Redirecting to create a new customer.");
                        alertShownRef.current = true;
                        navigate(`/customer/new/${phone_no}`, { state: { phone_no } });
                    } else {
                        console.error(error);
                    }
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchCustomerData();
    }, [location.state?.customer, phone_no, navigate]);


    const handleDelete = async () => {
        if (!isAdmin) {
            alert("You do not have permission to delete customers.");
            return;
        }
        const confirmDelete = window.confirm("Are you sure you want to delete this customer?");
        if (!confirmDelete) return;

        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.REACT_APP_API_URL;

            await axios.delete(`${apiUrl}/customer/${customer.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            alert("Customer deleted successfully.");
            navigate("/customers");
        } catch (error) {
            console.error("Error deleting customer:", error);
            alert("Failed to delete customer. Please try again.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate required fields
        if (!validateRequiredFields()) {
            return;
        }

        // Validate phone number length
        if (!validatePhoneNumberLength(formData.phone_no)) {
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

            // Log the changes
            await axios.post(
                `${apiUrl}/customers/log-change`,
                {
                    customerId: customer.id,
                    C_unique_id: customer.C_unique_id,
                    changes: changes.map(change => ({
                        field: change.field,
                        old_value: change.old_value || null,
                        new_value: change.new_value || null
                    }))
                },
                {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log('Changes logged:', changes);
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
                                label: "First Name", 
                                name: "first_name",
                                required: true 
                            },
                            { label: "Last Name", name: "last_name" },
                            { 
                                label: "Phone", 
                                name: "phone_no", 
                                type: "tel", 
                                disabled: !isAdmin, 
                                maxLength: "12",
                                required: true 
                            },
                            { label: "WhatsApp No", name: "whatsapp_num", type: "tel", maxLength: "12" },
                            { 
                                label: "Email", 
                                name: "email_id",
                                type: "email",
                                required: true
                            },
                            { label: "Youtube Email", name: "yt_email_id", type: "email" },
                            { label: "Age Group", name: "age_group", maxLength: "2" },
                            { label: "Mentor", name: "mentor" },
                            { label: "Designation", name: "designation" },
                            { label: "Region", name: "region" },
                            { label: "Language", name: "language" },
                            { label: "Education", name: "education" },
                            { label: "Profession"  , name: "profession" },
                            { label: "Why Choose Us", name: "why_choose" },
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

                        {/* Gender Dropdown */}
                        <div className="label-input">
                            <label>Gender:</label>
                            <select name="gender" value={formData.gender} onChange={handleInputChange}>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {/* Agent Name Dropdown - Only visible to admin */}
                        {isAdmin && (
                            <div className="label-input">
                                <label>Assign Agent<span className="required"> *</span>:</label>
                                <select 
                                    name="agent_name" 
                                    value={formData.agent_name || ''} 
                                    onChange={handleInputChange}
                                >
                                    {/* <option value="">Select Agent</option> */}
                                    {availableAgents.map((agent) => (
                                        <option key={agent.id} value={agent.username}>
                                            {agent.username}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {!isAdmin && formData.agent_name && (
                            <div className="label-input">
                                <label>Assigned Agent:</label>
                                <input
                                    type="text"
                                    value={formData.agent_name || ''}
                                    disabled
                                    className="agent-input"
                                />
                            </div>
                        )}

                        {/* Disposition Dropdown */}
                        <div className="label-input">
                            <label>Disposition:</label>
                            <select name="disposition" value={formData.disposition} onChange={handleInputChange}>
                                <option value="interested">Interested</option>
                                <option value="not interested">Not Interested</option>
                                <option value="needs to call back">Needs to Call Back</option>
                                <option value="switched off">Switched Off</option>
                                <option value="ringing no response">Ringing No Response</option>
                                <option value="follow-up">Follow-Up</option>
                                <option value="invalid number">Invalid Number</option>
                                <option value="whatsapp number">Whatsapp Number</option>
                                <option value="converted">Converted</option>
                                <option value="referral">Referral</option>
                            </select>
                        </div>

                        {/* Investment Trading Dropdown */}
                        <div className="label-input">
                            <label>Investment Trading:</label>
                            <select name="investment_trading" value={formData.investment_trading} onChange={handleInputChange}>
                                <option value="investment">Investment</option>
                                <option value="trading">Trading</option>
                            </select>
                        </div>

                        {/* Course Dropdown */}
                        <div className="label-input">
                            <label>Course:</label>
                            <select name="course" value={formData.course} onChange={handleInputChange}>
                                <option value="elite_program">Elite Program</option>
                                <option value="extra_earners">Extra Earners</option>
                                <option value="advanced_TFL">Advanced TFL</option>
                            </select>
                        </div>

                        {/* Follow-up Dropdown */}
                        <div className="label-input">
                            <label>Follow-Up:</label>
                            <select name="followup_count" value={formData.followup_count} onChange={handleInputChange}>
                                <option value="followup-1">Followup 1</option>
                                <option value="followup-2">Followup 2</option>
                                <option value="followup-3">Followup 3</option>
                                <option value="followup-4">Followup 4</option>
                                <option value="followup-5">Followup 5</option>
                            </select>
                        </div>

                        {/* Schedule Call  */}
                        <div className="label-input">
                            <label>Schedule Call:</label>
                            <input
                                type="datetime-local"
                                name="scheduled_at"
                                value={formData.scheduled_at}
                                onChange={handleInputChange}
                                onKeyDown={(e) => e.preventDefault()}
                                onClick={handleScheduledAtClick}
                                style={{ cursor: 'pointer' }}
                                className="sche_input"
                            />
                        </div>

                        {/* Comment Section */}
                        <div className="label-input comment">
                            <label>Comment:</label>
                            <div className="textarea-container">
                                <textarea
                                    name="comment"
                                    value={formData.comment}
                                    onChange={handleInputChange}
                                    rows="6"
                                    placeholder="Max 1000 characters"
                                    className="comet"
                                />
                            </div>
                        </div>

                        <button className="sbt-use-btn" type="submit">Update</button>
                    </form>
                    {/* {isAdmin && (  
                        <button 
                            onClick={handleDelete} 
                            className="add-field-btnnnn"
                            aria-label="Delete customer"
                        >
                            Delete Record
                        </button>
                    )} */}
                </div>

                <div>
                    {/* Pass customerId to LastChanges */}
                    <LastChanges customerId={customer.id} originalData={customer} updatedData={updatedData} />
                </div>
            </div>

        </div>
    );
};

export default UseForm;