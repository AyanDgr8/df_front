// src/components/routes/Other/Header/Download/DownloadFile.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import axios from 'axios';
import './DownloadFile.css';

const DownloadFile = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

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
                
                setUser(userResponse.data);
                console.log('User data:', userResponse.data);
            } catch (error) {
                console.error('Error fetching user data:', error);
                navigate('/login');
            }
        };

        fetchUser();
    }, [navigate]);

    // Filter data when search term changes
    useEffect(() => {
        if (!data.length) {
            setFilteredData([]);
            return;
        }

        if (!searchTerm) {
            setFilteredData(data);
            return;
        }

        const searchTermLower = searchTerm.toLowerCase();
        const filtered = data.filter(item => {
            return (
                (item.c_name?.toLowerCase().includes(searchTermLower)) ||
                (item.mobile?.toString().includes(searchTerm)) ||
                (item.loan_card_no?.toLowerCase().includes(searchTermLower)) ||
                (item.agent_name?.toLowerCase().includes(searchTermLower)) ||
                (item.bank_name?.toLowerCase().includes(searchTermLower))
            );
        });

        setFilteredData(filtered);
    }, [searchTerm, data]);

    const isValidDateRange = () => {
        if (!startDate || !endDate) return false;
        const start = new Date(startDate);
        const end = new Date(endDate);
        return start <= end && !isNaN(start) && !isNaN(end);
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatTableValue = (value) => {
        if (value === null || value === undefined) return '-';
        if (value === '') return '-';
        if (typeof value === 'string' && value.includes('T')) {
            // Format datetime values
            return formatDateTime(value);
        }
        return value;
    };

    const getColumnOrder = () => [
        'loan_card_no','CRN', 'c_name',
        'product', 'bank_name', 'banker_name', 
        'mobile', 'ref_mobile','agent_name', 
        'tl_name', 'fl_supervisor', 'DPD_vintage',
        'POS', 'emi_AMT', 'loan_AMT', 'paid_AMT', 'paid_date',
        'settl_AMT', 'shots', 'resi_address', 'pincode', 'office_address',
        'calling_code', 'calling_feedback', 'field_feedback', 'new_track_no', 'field_code',
        'scheduled_at', 'date_created', 'last_updated'
    ];

    const getColumnHeader = (key) => {
        const headers = {
            'loan_card_no': 'Loan Card No',
            'CRN': 'CRN',
            'c_name': 'Customer Name',
            'product': 'Product',
            'bank_name': 'Bank Name',
            'banker_name': 'Banker Name',
            'mobile': 'Mobile',
            'ref_mobile': 'Ref Mobile',
            'agent_name': 'Agent Name',
            'tl_name': 'TL Name',
            'fl_supervisor': 'FL Supervisor',
            'DPD_vintage': 'DPD Vintage',
            'POS': 'POS',
            'emi_AMT': 'EMI Amount',
            'loan_AMT': 'Loan Amount',
            'paid_AMT': 'Paid Amount',
            'paid_date': 'Paid Date',
            'settl_AMT': 'Settlement Amount',
            'shots': 'Shots',
            'resi_address': 'Residence Address',
            'pincode': 'Pincode',
            'office_address': 'Office Address',
            'calling_code': 'Calling Code',
            'calling_feedback': 'Calling Feedback',
            'field_feedback': 'Field Feedback',
            'new_track_no': 'New Track No',
            'field_code': 'Field Code',
            'scheduled_at': 'Scheduled At',
            'date_created': 'Created Date',
            'last_updated': 'Last Updated'
        };
        return headers[key] || key;
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Set the end time to end of day
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            const apiUrl = process.env.REACT_APP_API_URL;
            const response = await axios.get(`${apiUrl}/customers/date-range`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                params: {
                    startDate: start.toISOString(),
                    endDate: end.toISOString()
                }
            });

            console.log('Response:', response.data);

            if (response.data.success) {
                const records = response.data.data || [];
                setData(records);
                
                if (records.length === 0) {
                    setError('No records found in the selected date range');
                } else {
                    console.log(`Found ${records.length} records between ${start.toLocaleString()} and ${end.toLocaleString()}`);
                }
            } else {
                setError(response.data.message || 'Error fetching data');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setError(error.response?.data?.message || 'Error fetching data');
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (startDate && endDate) {
            fetchData();
        }
    }, [startDate, endDate]); // Re-fetch when dates change

    const handleDateChange = setter => e => {
        setter(e.target.value);
    };

    const handleScheduleddAtClick = (e) => {
        e.preventDefault();
        const now = new Date();
        const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
        e.target.value = localDateTime;
    };

    const handleDownload = () => {
        if (!data.length) {
            setError('No data available to download');
            return;
        }

        try {
            const orderedData = data.map(row => {
                const orderedRow = {};
                getColumnOrder().forEach(key => {
                    orderedRow[getColumnHeader(key)] = formatTableValue(row[key]);
                });
                return orderedRow;
            });

            const ws = XLSX.utils.json_to_sheet(orderedData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Customer Data");
            
            const startStr = startDate.split('T')[0];
            const endStr = endDate.split('T')[0];
            const fileName = `customer_data_${startStr}_to_${endStr}.xlsx`;
            
            XLSX.writeFile(wb, fileName);
        } catch (error) {
            console.error('Error downloading data:', error);
            setError('Error downloading data. Please try again.');
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    // Check if user has permission based on role
    const hasDownloadPermission = user && (
        ['super_admin', 'it_admin', 'business_head', 'team_leader'].includes(user.role) ||
        (user.permissions && user.permissions.download_data)
    );

    if (!hasDownloadPermission) {
        return <div className="error-message">You do not have permission to access this page.</div>;
    }

    return (
        <div className="download-page">
            <h2 className="download-heading">Download Customer Data</h2>
            
            <div className="date-picker-container">
                <div className="date-picker-wrapper">
                    <label htmlFor="start-date">Start Date and Time *</label>
                    <input
                        id="start-date"
                        type="datetime-local"
                        value={startDate}
                        onChange={handleDateChange(setStartDate)}
                        className="datetime-input"
                        required
                    />
                </div>
                <div className="date-picker-wrapper">
                    <label htmlFor="end-date">End Date and Time *</label>
                    <input
                        id="end-date"
                        type="datetime-local"
                        value={endDate}
                        onChange={handleDateChange(setEndDate)}
                        className="datetime-input"
                        required
                    />
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            
            {loading ? (
                <div className="loading-message">Loading data...</div>
            ) : filteredData.length > 0 ? (
                <>
                    {user?.role === 'super_admin' && (
                        <div className="search-container">
                            <input
                                type="text"
                                placeholder="Search by name, mobile, loan card, agent, or bank..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="search-input"
                            />
                        </div>
                    )}
                    <div className="data-table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    {getColumnOrder().map((key) => (
                                        <th key={key}>{getColumnHeader(key)}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((row, index) => (
                                    <tr key={index}>
                                        {getColumnOrder().map((key) => (
                                            <td key={key}>{formatTableValue(row[key])}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="table-info">
                        <span>Total Records: {filteredData.length}</span>
                        {searchTerm && <span> (Filtered from {data.length} records)</span>}
                    </div>
                    <button 
                        className="download-btn" 
                        onClick={handleDownload}
                        disabled={loading}
                    >
                        Download as Excel
                    </button>
                </>
            ) : (
                <div className="no-data-message">
                    {startDate && endDate ? 'No data available for the selected date range.' : 'Please select a date range to view data.'}
                </div>
            )}
        </div>
    );
};

export default DownloadFile;