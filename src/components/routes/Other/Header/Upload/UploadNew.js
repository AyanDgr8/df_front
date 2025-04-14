// src/components/routes/Other/Header/Upload/UploadNew.js

import React, { useState, useEffect } from "react";
import Papa from 'papaparse';
import { useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';
import axios from 'axios';
import "./UploadNew.css";

const UploadNew = () => {
    const [systemHeaders] = useState([
        "c_name", "loan_card_no",  "CRN", "agent_name","mobile",
        "product",  "bank_name", "banker_name",  "tl_name", 
        "fl_supervisor", "DPD_vintage", "POS", "emi_AMT", 
        "loan_AMT", "paid_AMT", "paid_date", "settl_AMT", 
        "shots", "resi_address", "pincode", "office_address", 
        "ref_mobile", "mobile_3", "mobile_4", "mobile_5", "mobile_6", "mobile_7", "mobile_8", 
        "calling_code", "calling_feedback", 
        "field_feedback", "new_track_no", "field_code"
    ]);
    const [fileHeaders, setFileHeaders] = useState([]);
    const [headerMapping, setHeaderMapping] = useState({});
    const [selectedFileName, setSelectedFileName] = useState("");
    const [error, setError] = useState("");
    const [customerData, setCustomerData] = useState([]);
    const [uploadResult, setUploadResult] = useState(null);
    const [uploadId, setUploadId] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [duplicateActions, setDuplicateActions] = useState({});
    const navigate = useNavigate();

    // Header mapping from system headers to frontend labels
    const headerLabels = {
        'c_name': 'Customer Name *',
        'loan_card_no': 'Loan Card No *',
        'CRN': 'CRN *',
        'agent_name': 'Agent Name *',
        'mobile': 'Mobile *',
        'product': 'Product',
        'bank_name': 'Bank Name',
        'banker_name': 'Banker Name',
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
        'resi_address': 'Residential Address',
        'pincode': 'Pincode',
        'office_address': 'Office Address',
        'ref_mobile': 'Reference Mobile',
        'mobile_3': 'Mobile 3',
        'mobile_4': 'Mobile 4',
        'mobile_5': 'Mobile 5',
        'mobile_6': 'Mobile 6',
        'mobile_7': 'Mobile 7',
        'mobile_8': 'Mobile 8',
        'calling_code': 'Calling Code',
        'calling_feedback': 'Calling Feedback',
        'field_feedback': 'Field Feedback',
        'new_track_no': 'New Track No',
        'field_code': 'Field Code'
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
            const mappedPhone = headerMapping['mobile'] ? row[headerMapping['mobile']] : null;

            // Validate phone number
            if (mappedPhone && !validatePhoneNumber(mappedPhone)) {
                errors.push(`Row ${index + 1}: Invalid phone number "${mappedPhone}". Phone numbers must be numeric and maximum 12 digits.`);
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
            const validExtensions = ['.xlsx', '.csv', '.xls'];
            const isValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
            
            if (!isValidExtension) {
                alert('Please upload only .xlsx, .xls or .csv files');
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
        setIsUploading(true);
        setError(null);
        
        try {
            // Validate that all required fields are mapped
            const requiredFields = ["c_name", "mobile", "agent_name"];
            const missingFields = requiredFields.filter(field => !headerMapping[field]);
            
            if (missingFields.length > 0) {
                setError(`Please map the following required fields: ${missingFields.map(field => headerLabels[field] || field).join(", ")}`);
                return;
            }

            // Additional validation to ensure required fields are not empty in any row
            const rowsWithMissingData = customerData
                .map((row, index) => ({
                    row,
                    index: index + 1,
                    missingFields: requiredFields.filter(field => 
                        !row[headerMapping[field]]?.toString().trim()
                    )
                }))
                .filter(({missingFields}) => missingFields.length > 0);

            if (rowsWithMissingData.length > 0) {
                const errorMessages = rowsWithMissingData.map(({index, missingFields}) => 
                    `Row ${index}: Missing ${missingFields.map(field => headerLabels[field]).join(", ")}`
                );
                setError(`Required fields missing in some rows:\n${errorMessages.join("\n")}`);
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

            // Clear any existing error
            setError(null);

            if (!response.ok) {
                if (result.error === 'INVALID_AGENTS') {
                    const errorMessage = result.invalidAgents.map(item => 
                        `Row ${item.rowIndex}: Invalid agent name "${item.agentName}"`
                    ).join('\n');
                    setError(`The following agent names are not valid:\n${errorMessage}`);
                    return;
                }
                throw new Error(result.message || 'Upload failed');
            }

            // Set upload result regardless of duplicates
            setUploadResult({
                totalRecords: result.totalRecords,
                duplicateCount: result.duplicateCount,
                uniqueRecords: result.uniqueRecords,
                duplicates: result.duplicates || [],
                uploadId: result.uploadId
            });
            setUploadId(result.uploadId);
            
            // Show warning if there are no unique records, but don't treat it as an error
            if (result.uniqueRecords === 0 && result.duplicateCount > 0) {
                setError('Note: All records are duplicates. Please select how you want to handle each duplicate record.');
            } else if (result.uniqueRecords === 0 && result.duplicateCount === 0) {
                setError('No records to process. Please check your data.');
            }

        } catch (error) {
            console.error('Upload error:', error);
            setError(error.message || 'Failed to upload file');
        } finally {
            setIsUploading(false);
        }
    };

    // Handle final confirmation
    const handleConfirmation = async (proceed) => {
        if (!proceed) {
            setUploadResult(null);
            return;
        }

        setIsUploading(true);
        setError("");

        const apiUrl = process.env.REACT_APP_API_URL;
        const token = localStorage.getItem('token');

        if (!token) {
            setError('Authentication required. Please login again.');
            setIsUploading(false);
            navigate('/customers');
            return;
        }

        try {
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };

            const response = await axios.post(`${apiUrl}/upload/confirm`, {
                uploadId: uploadResult.uploadId,
                proceed,
                duplicateActions
            }, config);

            if (response.data.success) {
                setUploadResult(null);
                navigate('/customers');
            } else {
                setError(response.data.message || 'Failed to complete upload');
            }
        } catch (error) {
            if (error.response?.status === 403) {
                setError('Session expired. Please login again.');
                navigate('/customers');
            } else {
                setError(error.response?.data?.message || 'Failed to complete upload');
            }
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
                    accept=".csv,.xlsx,.xls"
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

                    {uploadResult.duplicates && uploadResult.duplicates.length > 0 && (
                        <div className="duplicate-records">
                            <table className="duplicate-records-table">
                                <thead>
                                    <tr>
                                        <th>Status</th>
                                        <th>CRN</th>
                                        <th>Loan Card No</th>
                                        <th>Name</th>
                                        <th>Mobile</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {uploadResult.duplicates.map((record, index) => (
                                        <>
                                            <tr key={`new-${index}`} className="new-record">
                                                <td className="duplicate-status-new">New Record</td>
                                                <td>{record.new_record[headerMapping['CRN']] || ''}</td>
                                                <td>{record.new_record[headerMapping['loan_card_no']] || ''}</td>
                                                <td>{record.new_record[headerMapping['c_name']] || ''}</td>
                                                <td>{record.new_record[headerMapping['mobile']] || ''}</td>
                                                <td rowSpan="2" className="action-cell">
                                                    <select 
                                                        value={duplicateActions[index] || 'skip'} 
                                                        onChange={(e) => {
                                                            setDuplicateActions(prev => ({
                                                                ...prev,
                                                                [index]: e.target.value
                                                            }));
                                                        }}
                                                        className="duplicate-action-select"
                                                    >
                                                        <option value="skip">Do not upload</option>
                                                        <option value="append">Append with suffix (__1, __2, etc.)</option>
                                                        <option value="replace">Replace existing record</option>
                                                    </select>
                                                </td>
                                            </tr>
                                            <tr key={`existing-${index}`} className="existing-record">
                                                <td className="duplicate-status-existing">Existing Record</td>
                                                <td>{record.existing_record.CRN || ''}</td>
                                                <td>{record.existing_record.loan_card_no || ''}</td>
                                                <td>{record.existing_record.c_name || ''}</td>
                                                <td>{record.existing_record.mobile || ''}</td>
                                            </tr>
                                        </>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="confirmation-buttons">
                        {(() => {
                            // Calculate records to be processed
                            const uniqueCount = uploadResult.uniqueRecords || 0;
                            const duplicateActionsCount = Object.values(duplicateActions).reduce((acc, action) => {
                                if (action === 'append' || action === 'replace') {
                                    return acc + 1;
                                }
                                return acc;
                            }, 0);
                            const totalToProcess = uniqueCount + duplicateActionsCount;

                            // Generate appropriate message
                            let message = totalToProcess > 0 ? 
                                `Would you like to proceed with processing ${totalToProcess} record${totalToProcess !== 1 ? 's' : ''}?` :
                                'Please select actions for duplicate records to proceed.';

                            return <p>{message}</p>;
                        })()}
                        <button 
                            onClick={() => handleConfirmation(true)}
                            className="btn btn-success"
                            disabled={isUploading || (uploadResult.uniqueRecords === 0 && 
                                Object.values(duplicateActions).every(action => !action || action === 'skip'))}
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

            {error && (
                <div className="error-messagee">
                    {error}
                </div>
            )}
            </div>
        </div>
    );
};

export default UploadNew;