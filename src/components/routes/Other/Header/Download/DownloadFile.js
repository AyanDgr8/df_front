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
    const navigate = useNavigate();

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
        'C_unique_id', 'first_name', 'last_name', 'phone_no', 
        'whatsapp_num', 'email_id', 'yt_email_id', 'gender', 
        'age_group', 'agent_name', 'course', 'profession', 
        'education', 'designation', 
        'region', 'language',  'investment_trading', 
        'why_choose', 'disposition', 'mentor',
        'followup_count',
        'comment', 'scheduled_at', 'date_created', 'last_updated'
    ];

    const getColumnHeader = (key) => {
        const headers = {
            'C_unique_id': 'Customer ID',
            'first_name': 'First Name',
            'last_name': 'Last Name',
            'phone_no': 'Phone Number',
            'whatsapp_num': 'WhatsApp Number',
            'email_id': 'Email',
            'yt_email_id': 'YouTube Email',
            'gender': 'Gender',
            'age_group': 'Age Group',
            'agent_name': 'Agent Name',
            'profession': 'Profession',
            'education': 'Education',
            'designation': 'Designation',
            'region': 'Region',
            'language': 'Language',
            'course': 'Course',
            'investment_trading': 'Investment Trading',
            'why_choose': 'Why Choose',
            'disposition': 'Disposition',
            'followup_count': 'Followup Count',
            'mentor': 'Mentor',
            'comment': 'Comment',
            'scheduled_at': 'Scheduled At',
            'date_created': 'Created Date',
            'last_updated': 'Last Updated'
        };
        return headers[key] || key;
    };

    const fetchData = async () => {
        if (!isValidDateRange()) return;

        try {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');
            const apiUrl = process.env.REACT_APP_API_URL;

            // Format dates in the consistent format
            const formattedStartDate = formatDateTime(startDate);
            const formattedEndDate = formatDateTime(endDate);

            console.log('Sending dates:', { formattedStartDate, formattedEndDate });

            const response = await axios.get(`${apiUrl}/download-data`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    startDate: formattedStartDate,
                    endDate: formattedEndDate
                }
            });

            if (response.status !== 200 || !response.data) {
                throw new Error(response.data?.message || 'Failed to fetch data');
            }

            if (!Array.isArray(response.data) || response.data.length === 0) {
                console.log('No data returned from backend');
                setError('No data found for the selected date range');
                setData([]);
                return;
            }

            // Format the response data using the same date format
            const formattedData = response.data.map(row => ({
                ...row,
                date_created: formatDateTime(row.date_created),
                last_updated: formatDateTime(row.last_updated),
                scheduled_at: formatDateTime(row.scheduled_at)
            }));

            setData(formattedData);
            setError('');
        } catch (error) {
            console.error('Error fetching data:', error);
            setError(error.response?.data?.message || error.message || 'Error fetching data. Please try again.');
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (startDate && endDate) {
            fetchData();
        }
    }, [startDate, endDate]);

    const handleDateChange = (setter) => (e) => {
        setter(e.target.value);
        setError('');
    };

    const handleScheduleddAtClick = (e) => {
        // Remove readonly temporarily to allow picker to show
        e.target.readOnly = false;
        e.target.showPicker();
        // Add an event listener to make it readonly again after selection
        e.target.addEventListener('blur', function onBlur() {
            e.target.readOnly = true;
            e.target.removeEventListener('blur', onBlur);
        });
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
                        onClick={handleScheduleddAtClick}
                        onKeyDown={(e) => e.preventDefault()}
                        style={{ cursor: 'pointer' }}
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
                        onClick={handleScheduleddAtClick}
                        onKeyDown={(e) => e.preventDefault()}
                        style={{ cursor: 'pointer' }}
                    />
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            
            {loading ? (
                <div className="loading-message">Loading data...</div>
            ) : data.length > 0 ? (
                <>
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
                                {data.map((row, index) => (
                                    <tr key={index}>
                                        {getColumnOrder().map((key) => (
                                            <td key={key}>{formatTableValue(row[key])}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <button 
                        className="download-btn" 
                        onClick={handleDownload}
                        disabled={loading}
                    >
                        Download as Excel
                    </button>
                </>
            ) : null}
        </div>
    );
};

export default DownloadFile;