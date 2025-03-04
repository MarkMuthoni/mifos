import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../context/AuthContext';
import { useLoading } from '../../../context/LoadingContext';
import { API_CONFIG } from '../../../config';
import './ViewChartOfAccounts.css';
import {NotificationContext} from "../../../context/NotificationContext";

const ChartOfAccountsTable = () => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const [allAccounts, setAllAccounts] = useState([]);
    const [displayedAccounts, setDisplayedAccounts] = useState([]);
    const [filters, setFilters] = useState({ account: '', glCode: '', accountType: '' });
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [showAccountModal, setShowAccountModal] = useState(false);
    const [accountDetails, setAccountDetails] = useState(null);
    const [parents, setParents] = useState([]);
    const {showNotification} = useContext(NotificationContext);

    useEffect(() => {
        fetchAccounts();
    }, [filters]);

    useEffect(() => {
        paginateData();
    }, [allAccounts, currentPage, pageSize]);

    const fetchAccounts = async () => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/glaccounts`, {
                params: filters,
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });

            const accountsData = response.data;
            setAllAccounts(accountsData);
            setTotalPages(Math.ceil(accountsData.length / pageSize));
            setCurrentPage(1);
        } catch (error) {
            console.error('Error fetching chart of accounts:', error);
        } finally {
            stopLoading();
        }
    };

    const paginateData = () => {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        setDisplayedAccounts(allAccounts.slice(startIndex, endIndex));
    };

    const handleInputChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setCurrentPage(1);
    };

    const handlePageSizeChange = (e) => {
        const newPageSize = Number(e.target.value);
        setPageSize(newPageSize);
        setTotalPages(Math.ceil(allAccounts.length / newPageSize));
        setCurrentPage(1);
    };

    const handleRowClick = async (id) => {
        startLoading();
        try {
            const accountDetailsResponse = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/glaccounts/${id}?template=true`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    },
                }
            );

            setAccountDetails(accountDetailsResponse.data);

            const { assetHeaderAccountOptions, liabilityHeaderAccountOptions, equityHeaderAccountOptions, incomeHeaderAccountOptions } =
                accountDetailsResponse.data;

            setParents([
                ...(assetHeaderAccountOptions || []),
                ...(liabilityHeaderAccountOptions || []),
                ...(equityHeaderAccountOptions || []),
                ...(incomeHeaderAccountOptions || []),
            ]);

            setShowAccountModal(true);
        } catch (error) {
            console.error('Error fetching account details:', error);
        } finally {
            stopLoading();
        }
    };

    const toggleDisable = async () => {
        startLoading();
        try {
            const payload = { disabled: !accountDetails.disabled };
            await axios.put(`${API_CONFIG.proxy}/fineract-provider/api/v1/glaccounts/${accountDetails.id}`, payload, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setAccountDetails((prev) => ({ ...prev, disabled: !prev.disabled }));
        } catch (error) {
            console.error('Error toggling account status:', error);
        } finally {
            stopLoading();
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this account?')) {
            startLoading();
            try {
                await axios.delete(`${API_CONFIG.proxy}/fineract-provider/api/v1/glaccounts/${accountDetails.id}`, {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    },
                });
                setShowAccountModal(false);
                showNotification('Account deleted successfully!', 'success');
            } catch (error) {
                console.error('Error deleting account:', error);
            } finally {
                stopLoading();
            }
        }
    };

    const getParentAccountName = (parentId, parents) => {
        const parentAccount = parents.find((parent) => parent.id === parentId);
        return parentAccount ? parentAccount.name : 'None';
    };

    const resetFormFields = () => {
        setAccountDetails(null);
        setParents([]);
    };

    return (
        <div className="view-chart-accounts-container">
            <div className="controls-row">
                <div className="page-size-selector">
                    <label>Rows per page: </label>
                    <select value={pageSize} onChange={handlePageSizeChange}>
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>
            <div className="filter-row">
                <input
                    type="text"
                    name="account"
                    placeholder="Filter by Account"
                    onChange={handleInputChange}
                    className="filter-input"
                />
                <input
                    type="text"
                    name="glCode"
                    placeholder="Filter by GL Code"
                    onChange={handleInputChange}
                    className="filter-input"
                />
                <select name="accountType" onChange={handleInputChange} className="filter-select">
                    <option value="">Filter by Account Type</option>
                    <option value="ASSET">Assets</option>
                    <option value="LIABILITY">Liabilities</option>
                    <option value="EQUITY">Equity</option>
                    <option value="EXPENSE">Expenses</option>
                    <option value="INCOME">Income</option>
                </select>
            </div>
            <table className="chart-accounts-table">
                <thead>
                <tr>
                    <th>Account</th>
                    <th>GL Code</th>
                    <th>Account Type</th>
                    <th>Disabled?</th>
                    <th>Are Manual Entries Allowed?</th>
                    <th>Used As</th>
                </tr>
                </thead>
                <tbody>
                {displayedAccounts.length > 0 ? (
                    displayedAccounts.map((account) => (
                        <tr key={account.id} onClick={() => handleRowClick(account.id)} className="clickable-row">
                            <td>{account.name}</td>
                            <td>{account.glCode}</td>
                            <td>{account.type?.value || 'N/A'}</td>
                            <td>{account.disabled ? 'Yes' : 'No'}</td>
                            <td>{account.manualEntriesAllowed ? 'Yes' : 'No'}</td>
                            <td>{account.usage?.value || 'N/A'}</td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="6" className="no-data">No accounts available</td>
                    </tr>
                )}
                </tbody>
            </table>
            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="pagination-button"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                    >
                        Start
                    </button>
                    <button
                        className="pagination-button"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button
                        className="pagination-button"
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                    <button
                        className="pagination-button"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                    >
                        End
                    </button>
                </div>
            )}
            {showAccountModal && accountDetails && (
                <div
                    className="create-provisioning-criteria-modal-overlay"
                    onClick={() => {
                        setShowAccountModal(false);
                        resetFormFields();
                    }}
                >
                    <div
                        className="create-provisioning-criteria-modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h4 className="create-modal-title">Account Details</h4>
                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                className="create-provisioning-criteria-cancel"
                                onClick={() => {
                                    setShowAccountModal(false);
                                    resetFormFields();
                                }}
                            >
                                Back
                            </button>
                            <button
                                className="create-provisioning-criteria-toggle"
                                onClick={toggleDisable}
                            >
                                {accountDetails.disabled ? 'Enable' : 'Disable'}
                            </button>
                            <button
                                className="create-provisioning-criteria-cancel"
                                onClick={handleDelete}
                            >
                                Delete
                            </button>
                        </div>
                        <table className="create-provisioning-criteria-table">
                            <tbody>
                            <tr>
                                <td className="create-provisioning-criteria-label">Account Name</td>
                                <td>{accountDetails.name}</td>
                            </tr>
                            <tr>
                                <td className="create-provisioning-criteria-label">Account Type</td>
                                <td>{accountDetails.type.value}</td>
                            </tr>
                            <tr>
                                <td className="create-provisioning-criteria-label">GL Code</td>
                                <td>{accountDetails.glCode}</td>
                            </tr>
                            <tr>
                                <td className="create-provisioning-criteria-label">Parent Account</td>
                                <td>
                                    {getParentAccountName(accountDetails.parentId, parents)}
                                </td>
                            </tr>
                            <tr>
                                <td className="create-provisioning-criteria-label">Account Usage</td>
                                <td>{accountDetails.usage.value}</td>
                            </tr>
                            <tr>
                                <td className="create-provisioning-criteria-label">Manual Entries Allowed</td>
                                <td>{accountDetails.manualEntriesAllowed ? 'Yes' : 'No'}</td>
                            </tr>
                            <tr>
                                <td className="create-provisioning-criteria-label">Description</td>
                                <td>{accountDetails.description}</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChartOfAccountsTable;
