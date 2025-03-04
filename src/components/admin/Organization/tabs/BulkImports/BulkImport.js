import React, {useState, useEffect, useContext} from 'react';
import {Link, useParams} from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import './BulkImport.css';
import {FaDownload, FaUpload} from "react-icons/fa";
import {FaArrowRotateRight} from "react-icons/fa6";
import {NotificationContext} from "../../../../../context/NotificationContext";

const BulkImport = () => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();

    const { entityType } = useParams();
    const [offices, setOffices] = useState([]);
    const [staff, setStaff] = useState([]);
    const [selectedOffice, setSelectedOffice] = useState('');
    const [selectedStaff, setSelectedStaff] = useState('');
    const [legalForm, setLegalForm] = useState('');
    const [file, setFile] = useState(null);
    const [uploadHistory, setUploadHistory] = useState([]);
    const { showNotification } = useContext(NotificationContext);

    const entityConfig = {
        offices: { title: 'Office' },
        users: { title: 'User', fields: ['office', 'staff'] },
        groups: { title: 'Group', fields: ['office', 'staff'] },
        loanaccounts: { title: 'Loan Account', fields: ['office', 'staff'] },
        savingsaccounts: { title: 'Savings Account', fields: ['office', 'staff'] },
        fixeddepositaccounts: { title: 'Fixed Deposit Account', fields: ['office', 'staff'] },
        chartofaccounts: { title: 'Chart of Accounts', fields: ['office', 'staff'] },
        centers: { title: 'Center', fields: ['office', 'staff'] },
        clients: { title: 'Client', fields: ['office', 'staff', 'legalForm'] },
        employees: { title: 'Employee', fields: ['office'] },
        loanrepayments: { title: 'Loan Repayment', fields: ['office'] },
        savingstransactions: { title: 'Savings Transaction', fields: ['office'] },
        fixeddeposittransactions: { title: 'Fixed Deposit Transaction', fields: ['office'] },
        recurringdeposittransactions: { title: 'Recurring Deposit Transaction', fields: ['office'] },
        journalentries: { title: 'Journal Entry', fields: ['office'] },
        guarantors: { title: 'Guarantor', fields: ['office'] },
    };

    // console.log(entityType)
    const config = entityConfig[entityType.toLowerCase()] || { title: 'Import' };

    useEffect(() => {
        const fetchOffices = async () => {
            startLoading();
            try {
                const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/offices`, {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                });
                setOffices(response.data);
            } catch (error) {
                console.error('Error fetching offices:', error);
            } finally {
                stopLoading();
            }
        };
        fetchOffices();
    }, []);

    useEffect(() => {
        if (selectedOffice) {
            const fetchStaff = async () => {
                startLoading();
                try {
                    const response = await axios.get(
                        `${API_CONFIG.proxy}/fineract-provider/api/v1/staff?officeId=${selectedOffice}`,
                        {
                            headers: {
                                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                                'Content-Type': 'application/json',
                            },
                        }
                    );
                    setStaff(response.data);
                } catch (error) {
                    console.error('Error fetching staff:', error);
                } finally {
                    stopLoading();
                }
            };
            fetchStaff();
        }
    }, [selectedOffice]);

    useEffect(() => {
        const fetchUploadHistory = async () => {
            startLoading();
            try {
                const response = await axios.get(
                    `${API_CONFIG.proxy}/fineract-provider/api/v1/imports?entityType=${entityType}`,
                    {
                        headers: {
                            Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                            'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );
                setUploadHistory(response.data);
            } catch (error) {
                console.error('Error fetching upload history:', error);
            } finally {
                stopLoading();
            }
        };
        fetchUploadHistory();
    }, [entityType]);

    const handleFileUpload = async () => {
        if (!file) {
            showNotification('Please select a file before uploading!', 'info');
            return;
        }
        startLoading();
        try {
            const formData = new FormData();
            formData.append('file', file);

            await axios.post(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/imports/upload?entityType=${entityType}`,
                formData,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            showNotification('File uploaded successfully!', 'success');
            setFile(null);
        } catch (error) {
            console.error('Error uploading file:', error);
            showNotification('Failed to upload file!', 'error');
        } finally {
            stopLoading();
        }
    };

    const handleDownloadTemplate = async () => {
        const endpoint = `${API_CONFIG.proxy}/fineract-provider/api/v1/${entityType}/downloadtemplate`;
        const params = {
            tenantIdentifier: 'default',
            locale: 'en',
            dateFormat: 'dd MMMM yyyy',
        };

        try {
            startLoading();

            const response = await axios.get(endpoint, {
                params,
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            const contentDisposition = response.headers['content-disposition'];
            const filename = contentDisposition
                ? contentDisposition.split('filename=')[1]
                : `${entityType}-template.xlsx`;

            link.setAttribute('download', filename.replace(/"/g, ''));
            document.body.appendChild(link);
            link.click();
            link.remove();

        } catch (error) {
            console.error('Error downloading template:', error);
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="bulk-import-page neighbor-element">
            <h2 className="page-heading">
                <Link to="/organization" className="breadcrumb-link">Organization </Link><Link to="/bulk-imports" className="breadcrumb-link">. Bulk Imports </Link> . {config.title} Import
            </h2>
            <div className="bulk-import-form-container">
                <div className="bulk-import-download-form">
                    <h3 className="bulk-import-download-title">{config.title} Template</h3>
                    <div className="bulk-import-form-fields">
                        {config.fields?.includes('office') && (
                            <div className="bulk-import-form-group">
                                <label className="bulk-import-label">Office</label>
                                <select
                                    className="bulk-import-select"
                                    value={selectedOffice}
                                    onChange={(e) => setSelectedOffice(e.target.value)}
                                >
                                    <option value="">Select Office</option>
                                    {offices.map((office) => (
                                        <option key={office.id} value={office.id}>
                                            {office.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {config.fields?.includes('staff') && (
                            <div className="bulk-import-form-group">
                                <label className="bulk-import-label">Staff</label>
                                <select
                                    className="bulk-import-select"
                                    value={selectedStaff}
                                    onChange={(e) => setSelectedStaff(e.target.value)}
                                    disabled={!selectedOffice}
                                >
                                    <option value="">Select Staff</option>
                                    {staff.map((member) => (
                                        <option key={member.id} value={member.id}>
                                            {member.displayName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {config.fields?.includes('legalForm') && (
                            <div className="bulk-import-form-group">
                                <label className="bulk-import-label">Legal Form</label>
                                <select
                                    className="bulk-import-select"
                                    value={legalForm}
                                    onChange={(e) => setLegalForm(e.target.value)}
                                >
                                    <option value="">Select Legal Form</option>
                                    <option value="Entity">Entity</option>
                                    <option value="Person">Person</option>
                                </select>
                            </div>
                        )}
                    </div>
                    <button
                        className="bulk-import-download-button"
                        onClick={handleDownloadTemplate}
                    >
                        <FaDownload className="icon"/> Download Template
                    </button>
                </div>

                <div className="bulk-import-upload-form">
                    <h3 className="bulk-import-upload-title">Upload {config.title}</h3>
                    <div className="bulk-import-form-group">
                        <label className="bulk-import-label">Select File</label>
                        <input
                            className="bulk-import-file-input"
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={(e) => setFile(e.target.files[0])}
                        />
                    </div>
                    <button
                        className="bulk-import-upload-button"
                        onClick={handleFileUpload}
                        disabled={!file}
                    >
                        <FaUpload className="icon"/> Upload
                    </button>
                </div>
            </div>

            <div className="bulk-import-table-section">
                <div className="bulk-import-header">
                    <h3 className="bulk-import-table-title">Documents</h3>
                    <button
                        className="bulk-import-refresh-button"
                        // onClick={handleFileUpload}
                        // disabled={!file}
                    >
                        <FaArrowRotateRight className="icon"/> Refresh
                    </button>
                </div>
                <table className="bulk-import-table">
                    <thead>
                    <tr>
                        <th>Name</th>
                        <th>Import Time</th>
                        <th>End Time</th>
                        <th>Completed</th>
                        <th>Total Records</th>
                        <th>Success Count</th>
                        <th>Failure Count</th>
                        <th>Download</th>
                    </tr>
                    </thead>
                    <tbody>
                    {uploadHistory.length > 0 ? (
                        uploadHistory.map((entry, index) => (
                            <tr key={index}>
                                <td>{entry.name}</td>
                                <td>{entry.importTime}</td>
                                <td>{entry.endTime}</td>
                                <td>{entry.completed ? 'Yes' : 'No'}</td>
                                <td>{entry.totalRecords}</td>
                                <td>{entry.successCount}</td>
                                <td>{entry.failureCount}</td>
                                <td>
                                    <button className="bulk-import-download-btn">Download</button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="8" className="no-data">Ops! No Uploaded documents!</td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BulkImport;
