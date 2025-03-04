import React, { useState, useEffect, useContext } from 'react';
import {Link, useNavigate} from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import './StandingInstructionsHistory.css';

const StandingInstructionsHistory = () => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const navigate = useNavigate();

    const [transferTypeOptions, setTransferTypeOptions] = useState([]);
    const [accountTypeOptions, setAccountTypeOptions] = useState([]);
    const [fromAccountId, setFromAccountId] = useState('');
    const [transferType, setTransferType] = useState('');
    const [accountType, setAccountType] = useState('');
    const [clientName, setClientName] = useState('');
    const [clientId, setClientId] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [isFormValid, setIsFormValid] = useState(false);

    const [showForm, setShowForm] = useState(true);
    const [results, setResults] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        fetchTemplate();
    }, []);

    useEffect(() => {
        validateForm();
    }, [transferType, accountType, clientName, clientId, fromDate, toDate]);

    const fetchTemplate = async () => {
        startLoading();
        try {
            const response = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/standinginstructions/template`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            const data = response.data || {};
            setTransferTypeOptions(data.transferTypeOptions || []);
            setAccountTypeOptions(data.fromAccountTypeOptions || []);
        } catch (error) {
            console.error('Error fetching template:', error);
        } finally {
            stopLoading();
        }
    };

    const validateForm = () => {
        const isDateValid = (date) => {
            const today = new Date();
            const inputDate = new Date(date);
            return !date || inputDate <= today;
        };

        setIsFormValid(
            (!fromDate || isDateValid(fromDate)) &&
            (!toDate || isDateValid(toDate)) &&
            (!fromDate || !toDate || new Date(fromDate) <= new Date(toDate))
        );
    };

    const handleCancel = () => {
        navigate('/organization');
    };

    const handleSearch = async () => {
        startLoading();
        try {
            const params = {
                transferType: transferType || null,
                fromAccountType: accountType || null,
                clientName: clientName.trim() || null,
                clientId: clientId.trim() || null,
                fromDate: fromDate || null,
                toDate: toDate || null,
                dateFormat: 'dd MMMM yyyy',
                locale: 'en',
            };

            const filteredParams = Object.fromEntries(
                Object.entries(params).filter(([_, value]) => value !== null)
            );

            const query = new URLSearchParams(filteredParams).toString();

            const response = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/standinginstructionrunhistory?${query}`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const data = response.data || [];
            setResults(Array.isArray(data) ? data : []);
            setShowForm(false);
        } catch (error) {
            console.error('Error fetching standing instructions:', error);
        } finally {
            stopLoading();
        }
    };

    const getDefaultDate = () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
    };

    const handleShowForm = () => {
        setShowForm(true);
    };

    const paginatedResults = Array.isArray(results)
        ? results.slice((currentPage - 1) * pageSize, currentPage * pageSize)
        : [];

    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
        setCurrentPage(1);
    };

    const totalPages = Math.ceil(results.length / pageSize);

    return (
        <div className="standing-instructions-history-container neighbor-element">
            <h2 className="page-heading">
                <Link to="/organization" className="breadcrumb-link">Organization</Link> . Standing Instructions History
            </h2>
            {showForm ? (
                <div className="standing-instructions-history-form-container">
                    <div className="standing-instructions-history-form">
                        <div className="standing-instructions-history-form-group">
                            <label htmlFor="clientName" className="standing-instructions-history-form-label">
                                Client Name
                            </label>
                            <input
                                type="text"
                                id="clientName"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                className="standing-instructions-history-form-input"
                                placeholder="Enter client name"
                            />
                        </div>
                        <div className="standing-instructions-history-form-group">
                            <label htmlFor="clientId" className="standing-instructions-history-form-label">
                                Client ID
                            </label>
                            <input
                                type="text"
                                id="clientId"
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                className="standing-instructions-history-form-input"
                                placeholder="Enter client ID"
                            />
                        </div>
                        <div className="standing-instructions-history-form-group">
                            <label htmlFor="transferType" className="standing-instructions-history-form-label">
                                Transfer Type
                            </label>
                            <select
                                id="transferType"
                                value={transferType}
                                onChange={(e) => setTransferType(e.target.value)}
                                className="standing-instructions-history-form-select"
                            >
                                <option value="">Select Transfer Type</option>
                                {transferTypeOptions.map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {option.value}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="standing-instructions-history-form-group">
                            <label htmlFor="accountType" className="standing-instructions-history-form-label">
                                Account Type
                            </label>
                            <select
                                id="accountType"
                                value={accountType}
                                onChange={(e) => setAccountType(e.target.value)}
                                className="standing-instructions-history-form-select"
                            >
                                <option value="">Select Account Type</option>
                                {accountTypeOptions.map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {option.value}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {accountType && (
                            <div className="standing-instructions-history-form-group">
                                <label htmlFor="fromAccountId" className="standing-instructions-history-form-label">
                                    From Account ID
                                </label>
                                <input
                                    type="text"
                                    id="fromAccountId"
                                    value={fromAccountId}
                                    onChange={(e) => setFromAccountId(e.target.value)}
                                    className="standing-instructions-history-form-input"
                                    placeholder="Enter account ID"
                                />
                            </div>
                        )}
                        <div className="standing-instructions-history-form-group">
                            <label htmlFor="fromDate" className="standing-instructions-history-form-label">
                                From Date
                            </label>
                            <input
                                type="date"
                                id="fromDate"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                max={getDefaultDate()}
                                className="standing-instructions-history-form-input"
                            />
                        </div>
                        <div className="standing-instructions-history-form-group">
                            <label htmlFor="toDate" className="standing-instructions-history-form-label">
                                To Date
                            </label>
                            <input
                                type="date"
                                id="toDate"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                max={getDefaultDate()}
                                className="standing-instructions-history-form-input"
                            />
                        </div>
                        <div className="standing-instructions-history-form-actions">
                            <button
                                className="standing-instructions-history-cancel-button"
                                onClick={handleCancel}
                            >
                                Cancel
                            </button>
                            <button
                                className="standing-instructions-history-search-button"
                                onClick={handleSearch}
                                disabled={!isFormValid}
                            >
                                Search Instructions
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div>
                    <button className="show-form-button" onClick={handleShowForm}>
                        Show Form
                    </button>
                    <div className="table-controls">
                        <div className="page-size-selector">
                            <label htmlFor="pageSize">Rows per page:</label>
                            <select
                                id="pageSize"
                                value={pageSize}
                                onChange={handlePageSizeChange}
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </div>
                    <table className="standing-instructions-table">
                        <thead>
                        <tr>
                            <th>From Client</th>
                            <th>From Account</th>
                            <th>To Client</th>
                            <th>To Account</th>
                            <th>Execution Time</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Error Log</th>
                        </tr>
                        </thead>
                        <tbody>
                        {paginatedResults.length > 0 ? (
                            paginatedResults.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.fromClient || ''}</td>
                                    <td>{item.fromAccount || ''}</td>
                                    <td>{item.toClient || ''}</td>
                                    <td>{item.toAccount || ''}</td>
                                    <td>{item.executionTime || ''}</td>
                                    <td>{item.amount || ''}</td>
                                    <td>{item.status || ''}</td>
                                    <td>{item.errorLog || ''}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" className="no-data">No data available</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                    {totalPages > 1 && (
                        <div className="pagination">
                            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                                Start
                            </button>
                            <button
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>
                            <span>
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                            >
                                End
                            </button>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
};

export default StandingInstructionsHistory;
