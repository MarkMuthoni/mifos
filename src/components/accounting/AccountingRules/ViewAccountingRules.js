import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../context/AuthContext';
import { useLoading } from '../../../context/LoadingContext';
import { API_CONFIG } from '../../../config';
import './ViewAccountingRules.css';

const AccountingRulesTable = () => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const [allAccountingRules, setAllAccountingRules] = useState([]);
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [showRuleModal, setShowRuleModal] = useState(false);
    const [selectedRule, setSelectedRule] = useState(null);

    useEffect(() => {
        fetchAccountingRules();
    }, []);

    useEffect(() => {
        setTotalPages(Math.ceil(allAccountingRules.length / pageSize));
    }, [allAccountingRules, pageSize]);

    const fetchAccountingRules = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/accountingrules`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });

            setAllAccountingRules(response.data);
        } catch (error) {
            console.error('Error fetching accounting rules:', error);
        } finally {
            stopLoading();
        }
    };

    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
        setCurrentPage(1);
    };

    const handleRowClick = async (rule) => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/accountingrules/${rule.id}`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setSelectedRule(response.data);
            setShowRuleModal(true);
        } catch (error) {
            console.error('Error fetching rule details:', error);
        } finally {
            stopLoading();
        }
    };

    const paginatedData = allAccountingRules.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    return (
        <div className="accounting-rules-table-container">
            <div className="page-size-selector">
                <label>Rows per page: </label>
                <select value={pageSize} onChange={handlePageSizeChange}>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                </select>
            </div>
            <table className="accounting-rules-table">
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Office</th>
                    <th>Debit Tags</th>
                    <th>Debit Account</th>
                    <th>Credit Tags</th>
                    <th>Credit Account</th>
                </tr>
                </thead>
                <tbody>
                {paginatedData.length > 0 ? (
                    paginatedData.map((rule) => (
                        <tr
                            key={rule.id}
                            onClick={() => handleRowClick(rule)}
                            className="clickable-row"
                        >
                            <td>{rule.name}</td>
                            <td>{rule.officeName || ''}</td>
                            <td>
                                {Array.isArray(rule.debitAccounts) && rule.debitAccounts.length > 0
                                    ? rule.debitAccounts.map(account => account.name).join(', ')
                                    : ''}
                            </td>
                            <td>
                                {Array.isArray(rule.creditAccounts) && rule.creditAccounts.length > 0
                                    ? rule.creditAccounts.map(account => account.name).join(', ')
                                    : ''}
                            </td>
                            <td>
                                {Array.isArray(rule.debitTags) && rule.debitTags.length > 0
                                    ? rule.debitTags.map(tag => `${tag.tag.name} (${tag.transactionType.value})`).join(', ')
                                    : ''}
                            </td>
                            <td>
                                {Array.isArray(rule.creditTags) && rule.creditTags.length > 0
                                    ? rule.creditTags.map(tag => `${tag.tag.name} (${tag.transactionType.value})`).join(', ')
                                    : ''}
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="6" className="no-data">No accounting rules available</td>
                    </tr>
                )}
                </tbody>
            </table>
            {totalPages > 1 && (
                <div className="pagination">
                    <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>Start</button>
                    <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}>Previous
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}>Next
                    </button>
                    <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>End
                    </button>
                </div>
            )}
            {showRuleModal && selectedRule && (
                <div
                    className="create-provisioning-criteria-modal-overlay"
                    onClick={() => setShowRuleModal(false)}
                >
                    <div
                        className="create-provisioning-criteria-modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h4 className="create-modal-title">Accounting Rule Details</h4>
                        <table className="create-provisioning-criteria-table">
                            <tbody>
                            <tr>
                                <td className="create-provisioning-criteria-label">Name</td>
                                <td>{selectedRule.name}</td>
                            </tr>
                            <tr>
                                <td className="create-provisioning-criteria-label">Office</td>
                                <td>{selectedRule.officeName}</td>
                            </tr>
                            <tr>
                                <td className="create-provisioning-criteria-label">Description</td>
                                <td>{selectedRule.description}</td>
                            </tr>
                            <tr>
                                <td className="create-provisioning-criteria-label">
                                    Multiple Debit Entries Allowed
                                </td>
                                <td>{selectedRule.allowMultipleDebitEntries ? 'Yes' : 'No'}</td>
                            </tr>
                            <tr>
                                <td className="create-provisioning-criteria-label">
                                    Multiple Credit Entries Allowed
                                </td>
                                <td>{selectedRule.allowMultipleCreditEntries ? 'Yes' : 'No'}</td>
                            </tr>
                            </tbody>
                        </table>
                        <table className="create-provisioning-criteria-table">
                            <thead>
                            <tr>
                                <th>Debit Account Name</th>
                                <th>Credit Account Name</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr>
                                <td>{selectedRule.debitAccounts?.[0]?.name || 'N/A'}</td>
                                <td>{selectedRule.creditAccounts?.[0]?.name || 'N/A'}</td>
                            </tr>
                            </tbody>
                        </table>
                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                className="create-provisioning-criteria-cancel"
                                onClick={() => setShowRuleModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountingRulesTable;
