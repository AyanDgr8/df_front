// src/components/routes/Other/Header/Upload/UploadNew.js

import React, { useState } from "react";
import Papa from 'papaparse';
import { useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';
import "./UploadNew.css";

const UploadNew = () => {
    const [systemHeaders] = useState([
        "first_name", "last_name", "phone_no",
        "whatsapp_num", "email_id", "yt_email_id", 
        "agent_name", "course", "age_group", "gender",
        "mentor", "followup_count", "profession", 
        "investment_trading", "why_choose", "language", 
        "education", "region", "designation",
        "disposition", "comment",
    ]);
    const [fileHeaders, setFileHeaders] = useState([]);
    const [headerMapping, setHeaderMapping] = useState({});
    const [selectedFileName, setSelectedFileName] = useState("");
    const [error, setError] = useState("");
    const [customerData, setCustomerData] = useState([]);
    const [uploadResult, setUploadResult] = useState(null);
    const [showDuplicates, setShowDuplicates] = useState(false);
    const [uploadId, setUploadId] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const navigate = useNavigate();

    // Header mapping from system headers to frontend labels
    const headerLabels = {
        'first_name': 'First Name *',
        'last_name': 'Last Name',
        'phone_no': 'Phone *',
        'whatsapp_num': 'WhatsApp No',
        'email_id': 'Email *',
        'yt_email_id': 'Youtube Email',
        'agent_name': 'Agent Name *',
        'age_group': 'Age Group',
        'mentor': 'Mentor',
        'designation': 'Designation',
        'region': 'Region',
        'language': 'Language',
        'education': 'Education',
        'profession': 'Profession',
        'why_choose': 'Why Choose Us',
        'gender': 'Gender',
        'course': 'Course',
        'investment_trading': 'Investment Trading',
        'followup_count': 'Followup Count',
        'disposition': 'Disposition',
        'comment': 'Comment'
    };

    // Helper function to convert empty values to null
    const convertEmptyToNull = (data) => {
        return data.map(item => {
            return Object.fromEntries(
                Object.entries(item).map(([key, value]) => [key, value === "" ? null : value])
            );
        });
    };

    // Add a function to clean the data before sending
    const cleanCustomerData = (data) => {
        return data.map(row => {
            const cleanedRow = {};
            Object.keys(row).forEach(key => {
                cleanedRow[key] = row[key]?.toString().trim() || null;
            });
            return cleanedRow;
        });
    };

    // Add validation functions
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    const validatePhoneNumber = (phone) => {
        const phoneStr = String(phone);
        return phoneStr.length <= 12 && /^\d+$/.test(phoneStr);
    };

    const validateEmail = (email) => {
        return emailRegex.test(String(email).toLowerCase());
    };

    const validateData = (data) => {
        const errors = [];
        data.forEach((row, index) => {
            const mappedPhone = headerMapping['phone_no'] ? row[headerMapping['phone_no']] : null;
            const mappedEmail = headerMapping['email_id'] ? row[headerMapping['email_id']] : null;

            // Validate phone number
            if (mappedPhone && !validatePhoneNumber(mappedPhone)) {
                errors.push(`Row ${index + 1}: Invalid phone number "${mappedPhone}". Phone numbers must be numeric and maximum 12 digits.`);
            }

            // Validate email
            if (mappedEmail && !validateEmail(mappedEmail)) {
                errors.push(`Row ${index + 1}: Invalid email "${mappedEmail}".`);
            }
        });
        return errors;
    };

    // Handle file selection and parse headers
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file size (50MB limit)
            const maxSize = 50 * 1024 * 1024; // 50MB in bytes
            if (file.size > maxSize) {
                setError(`File size exceeds 50MB limit. Please upload a smaller file.`);
                e.target.value = ''; // Clear the file input
                return;
            }

            // Check file extension
            const fileName = file.name.toLowerCase();
            const validExtensions = ['.xlsx', '.csv'];
            const isValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
            
            if (!isValidExtension) {
                alert('Please upload only .xlsx or .csv files');
                e.target.value = ''; // Clear the file input
                return;
            }
            
            setSelectedFileName(file.name);
            const fileType = file.type;

            const reader = new FileReader();
            reader.onload = (event) => {
                const data = event.target.result;
                if (fileType === "text/csv" || fileName.endsWith('.csv')) {
                    parseCSV(data);
                } else {
                    parseExcel(data);
                }
            };
            if (fileType === "text/csv" || fileName.endsWith('.csv')) {
                reader.readAsText(file);
            } else {
                reader.readAsBinaryString(file);
            }
        }
    };

    // Parse CSV headers
    const parseCSV = (data) => {
        Papa.parse(data, {
            header: true,
            complete: (result) => {
                setFileHeaders(result.meta.fields);
                const modifiedData = convertEmptyToNull(result.data);
                setCustomerData(modifiedData); // Set the customer data here
            }
        });
    };

    // Parse Excel headers
    const parseExcel = (data) => {
        try {
            const workbook = XLSX.read(data, { type: "binary" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
            
            // Check if worksheet is empty or first row is null/undefined
            if (!worksheet || worksheet.length === 0 || !worksheet[0]) {
                alert('Error: The uploaded file contains empty or invalid data. Please ensure the file has valid headers and data.');
                return;
            }

            // Get headers and validate they exist
            const headers = Object.keys(worksheet[0]);
            if (!headers || headers.length === 0) {
                alert('Error: Unable to read file headers. Please check if the file is properly formatted.');
                return;
            }

            setFileHeaders(headers);
            const modifiedData = convertEmptyToNull(worksheet);
            setCustomerData(modifiedData);
        } catch (error) {
            console.error('Error parsing Excel file:', error);
            alert('Error: Unable to process the file. Please ensure the file is not corrupted and contains valid data.');
        }
    };

    // Handle mapping selection change
    const handleMappingChange = (systemHeader, selectedFileHeader) => {
        if (headerMapping[systemHeader]) {
            const previousHeader = headerMapping[systemHeader];
            if (previousHeader === selectedFileHeader) {
                alert("This header is already mapped to another field.");
                return;
            }
        }
        setHeaderMapping(prevMapping => ({
            ...prevMapping,
            [systemHeader]: selectedFileHeader
        }));
    };

    // Function to get available options for the dropdown
    const getAvailableOptions = (systemHeader) => {
        const selectedHeaders = Object.values(headerMapping);
        return fileHeaders.filter(header => !selectedHeaders.includes(header) || header === headerMapping[systemHeader]);
    };

    // Handle file upload
    const handleUpload = async () => {
        try {
            // Validate that all required fields are mapped
            const requiredFields = ["first_name", "phone_no", "email_id", "agent_name"];
            const missingFields = requiredFields.filter(field => !headerMapping[field]);
            
            if (missingFields.length > 0) {
                setError(`Please map the following required fields: ${missingFields.map(field => headerLabels[field] || field).join(", ")}`);
                return;
            }

            // Additional validation to ensure agent_name is not empty in any row
            const rowsWithMissingAgent = customerData
                .map((row, index) => ({
                    row,
                    index: index + 1
                }))
                .filter(({row}) => !row[headerMapping['agent_name']]?.toString().trim());

            if (rowsWithMissingAgent.length > 0) {
                setError(`Agent Name is required but missing in the following rows:\n${
                    rowsWithMissingAgent.map(({index}) => `Row ${index}`).join(", ")
                }`);
                return;
            }

            // Validate data before upload
            const validationErrors = validateData(customerData);
            if (validationErrors.length > 0) {
                setError(`Validation errors found:\n${validationErrors.join("\n")}`);
                return;
            }

            const apiUrl = process.env.REACT_APP_API_URL;
            const response = await fetch(`${apiUrl}/upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    headerMapping,
                    customerData: cleanCustomerData(customerData),
                    fileName: selectedFileName
                })
            });

            const result = await response.json();

            if (!response.ok) {
                if (result.error === 'INVALID_AGENTS') {
                    const errorMessage = result.invalidAgents.map(item => 
                        `Row ${item.rowIndex}: Invalid agent name "${item.agentName}"`
                    ).join('\n');
                    setError(`The following agent names are not valid department admins:\n${errorMessage}`);
                    return;
                }
                throw new Error(result.message || 'Upload failed');
            }

            setUploadResult(result);
            setUploadId(result.uploadId);
            setError("");
        } catch (err) {
            setError(err.message || 'An error occurred during upload');
        }
    };

    // Handle final confirmation
    const handleConfirmation = async (proceed) => {
        if (proceed) {
            setIsUploading(true);
        }
        try {
            if (!uploadId) {
                setError('No upload ID found. Please try uploading again.');
                return;
            }

            const apiUrl = process.env.REACT_APP_API_URL;
            const response = await fetch(`${apiUrl}/upload/confirm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    uploadId,
                    proceed
                }),
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Failed to confirm upload');
            }

            // Show different messages based on proceed value
            if (proceed) {
                alert(`Upload successful!\nTotal Records: ${uploadResult.totalRecords}\nUnique Records: ${uploadResult.uniqueRecords}\nDuplicate Entries: ${uploadResult.duplicateCount}`);
                navigate('/customers');
            } else {
                alert('Upload cancelled by user');
            }

            // Clear the form state
            setSelectedFileName(null);
            setHeaderMapping({});
            setCustomerData([]);
            setUploadResult(null);
            setUploadId(null);
            setShowDuplicates(false);

        } catch (err) {
            setError(err.message || 'An error occurred during confirmation');
        } finally {
            setIsUploading(false);
        }
    };

    const downloadSampleData = () => {
        const link = document.createElement('a');
        link.href = process.env.PUBLIC_URL + '/uploads/Sample_Upload_File.xlsx';
        link.download = 'Sample_Upload_File.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="file-upload-page">
            <div className="upload-header">
                <h2 className="upload_new_headiiii">Upload File </h2>
                <button 
                    className="download-sample-btn"
                    onClick={downloadSampleData}
                >
                    Download Sample Data
                </button>
            </div>
            <div className="file-upload">
                <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".csv,.xlsx"
                    className="file-input"
                />
                {/* {selectedFileName && (
                    <span className="selected-file">Selected file: {selectedFileName}</span>
                )} */}
            </div>
            <div className="containerr">
                <div className="upload-form">
                    {fileHeaders.length > 0 && (
                        <div className="mapping-container">
                            <div className="mapping-rows">
                                {systemHeaders.map((systemHeader) => (
                                    <div key={systemHeader} className="mapping-row">
                                        <div className="system-header">
                                            {headerLabels[systemHeader] || systemHeader}
                                        </div>
                                        <div className="file-header">
                                            <select
                                                value={headerMapping[systemHeader] || ''}
                                                onChange={(e) => handleMappingChange(systemHeader, e.target.value)}
                                                className="header-select"
                                            >
                                                <option value="">Select Column</option>
                                                {getAvailableOptions(systemHeader).map((header) => (
                                                    <option key={header} value={header}>
                                                        {header}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="submit-container">
                                <button 
                                    onClick={handleUpload} 
                                    className="submitt-btnn" 
                                    disabled={!selectedFileName || fileHeaders.length === 0}
                                >
                                    Submit
                                </button>
                            </div>
                        </div>
                    )}

                </div>

                {uploadResult && (
                <div className="upload-result">
                    <h3 className="upload_res_headii">Upload Summary</h3>
                    <p className="upload_res_para">Total Records: {uploadResult.totalRecords || 0}</p>
                    <p className="upload_res_para">Duplicate Entries: {uploadResult.duplicateCount || 0}</p>
                    <p className="upload_res_para">Unique Records: {uploadResult.uniqueRecords || 0}</p>
                    
                    <button 
                        onClick={() => setShowDuplicates(!showDuplicates)}
                        className="btn-secondaryyyy"
                    >
                        {showDuplicates ? 'Hide Duplicates' : 'Show Duplicates'}
                    </button>

                    {showDuplicates && uploadResult.duplicates && uploadResult.duplicates.length > 0 && (
                        <div className="duplicate-records">
                            <table className="duplicate_records_table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Phone</th>
                                        <th>Email</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {uploadResult.duplicates.map((record, index) => (
                                        <tr key={index}>
                                            <td>{`${record[headerMapping['first_name']] || ''} ${record[headerMapping['last_name']] || ''}`}</td>
                                            <td>{record[headerMapping['phone_no']] || ''}</td>
                                            <td>{record[headerMapping['email_id']] || ''}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="confirmation-buttons">
                        <p>Would you like to proceed with uploading {uploadResult.uniqueRecords || 0} unique records?</p>
                        <button 
                            onClick={() => handleConfirmation(true)}
                            className="btn btn-success"
                            disabled={isUploading}
                        >
                            {isUploading ? 'Uploading...' : 'Yes, Upload'}
                        </button>
                        <button 
                            onClick={() => handleConfirmation(false)}
                            className="btn btn-danger"
                            disabled={isUploading}
                        >
                            No, Cancel
                        </button>
                    </div>
                </div>
            )}

            {error && <div className="error-message">{error}</div>}

            </div>
        </div>
    );
};

export default UploadNew;
