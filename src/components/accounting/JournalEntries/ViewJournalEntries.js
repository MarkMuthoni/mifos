import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../context/AuthContext';
import { useLoading } from '../../../context/LoadingContext';
import { API_CONFIG } from '../../../config';
import './ViewJournalEntries.css';

const ViewJournalEntries = () => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const [filters, setFilters] = useState({
        accountName: '',
        office: '',
        transactionDate: '',
        transactionId: '',
    });
    const [entries, setEntries] = useState([]);
    const [offices, setOffices] = useState([]);
    const [accountSuggestions, setAccountSuggestions] = useState([]);
    const [showAccountSuggestions, setShowAccountSuggestions] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [showTransactionTable, setShowTransactionTable] = useState(false);
    const [transactionDetails, setTransactionDetails] = useState(null);
    const [showRevertModal, setShowRevertModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [revertComments, setRevertComments] = useState("");
    const [newTransactionId, setNewTransactionId] = useState("");
    const [transactionId, setTransactionId] = useState("");
    const [revertedTransactions, setRevertedTransactions] = useState({});
    const [isReverted, setIsReverted] = useState(false);

    useEffect(() => {
        fetchEntries();
    }, [filters, currentPage, pageSize]);

    useEffect(() => {
        fetchOffices();
    }, []);

    const fetchOffices = async () => {
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/offices`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setOffices(response.data || []);
        } catch (error) {
            console.error("Error fetching offices:", error);
        }
    };

    const fetchEntries = async () => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/journalentries`, {
                params: {
                    offset: (currentPage - 1) * pageSize,
                    limit: pageSize,
                    accountName: filters.accountName,
                    office: filters.office,
                    transactionDate: filters.transactionDate,
                    transactionId: filters.transactionId,
                },
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });

            const fetchedEntries = response.data.pageItems || [];
            const sortedEntries = fetchedEntries.sort((a, b) => a.id - b.id);

            setEntries(sortedEntries);
            setTotalPages(Math.ceil(response.data.totalFilteredRecords / pageSize));
        } catch (error) {
            console.error("Error fetching journal entries:", error);
        } finally {
            stopLoading();
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleAccountSelect = (name) => {
        setFilters((prev) => ({ ...prev, accountName: name }));
        setShowAccountSuggestions(false);
    };

    const handleAccountNameChange = async (e) => {
        const { value } = e.target;
        setFilters((prev) => ({ ...prev, accountName: value }));
        if (value.length > 2) {
            try {
                const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/glAccounts`, {
                    params: { search: value },
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    },
                });
                setAccountSuggestions(response.data || []);
                setShowAccountSuggestions(true);
            } catch (error) {
                console.error("Error fetching account suggestions:", error);
            }
        } else {
            setShowAccountSuggestions(false);
        }
    };

    const handleSearch = () => {
        setCurrentPage(1);
        fetchEntries();
    };

    const handlePreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

    const formatDate = (dateArray) => {
        const [year, month, day] = dateArray;
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    const formatCurrency = (amount, symbol, decimalPlaces) => {
        return `${symbol}${new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces
        }).format(amount)}`;
    };

    const handleRowClick = async (entryId) => {
        try {
            startLoading();
            const response = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/journalentries?transactionId=${entryId}&transactionDetails=true`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    },
                }
            );
            setTransactionDetails(response.data);
            setTransactionId(entryId);
            setShowSuccessModal(false);
            setShowTransactionTable(true);
        } catch (error) {
            console.error("Error fetching transaction details:", error.response?.data || error.message);
            alert("Failed to fetch transaction details.");
        } finally {
            stopLoading();
        }
    };

    const renderTransactionTable = () => {
        if (!transactionDetails) return null;

        const { pageItems, totalFilteredRecords } = transactionDetails;
        const totalPages = Math.ceil(totalFilteredRecords / pageSize);

        const paginatedItems = pageItems.slice(
            (currentPage - 1) * pageSize,
            currentPage * pageSize
        );

        return (
            <div className="transaction-details-section">
                <div className="transactions-head">
                    <h2>Transaction Details</h2>
                    <button
                        onClick={() => setShowRevertModal(true)}
                        className="revert-button"
                        disabled={revertedTransactions[transactionId] || isReverted}
                    >
                        {revertedTransactions[transactionId] || isReverted
                            ? "Transaction Reverted"
                            : "Revert Transaction"}
                    </button>
                </div>

                <table className="transaction-summary-table">
                    <tbody>
                    <tr>
                        <th>Office</th>
                        <td>{pageItems[0]?.officeName || ""}</td>
                    </tr>
                    <tr>
                        <th>Created By</th>
                        <td>{pageItems[0]?.createdByUserName || ""}</td>
                    </tr>
                    <tr>
                        <th>Transaction Date</th>
                        <td>{pageItems[0]?.transactionDate?.join("-") || ""}</td>
                    </tr>
                    <tr>
                        <th>Submitted On</th>
                        <td>{pageItems[0]?.submittedOnDate?.join("-") || ""}</td>
                    </tr>
                    </tbody>
                </table>

                <table className="transaction-details-table">
                    <thead>
                    <tr>
                        <th>Entry ID</th>
                        <th>Type</th>
                        <th>Account Code</th>
                        <th>Account Name</th>
                        <th>Debit</th>
                        <th>Credit</th>
                    </tr>
                    </thead>
                    <tbody>
                    {paginatedItems.map((item) => (
                        <tr key={item.id}>
                            <td>{item.id}</td>
                            <td>{item.entryType.value}</td>
                            <td>{item.glAccountCode}</td>
                            <td>{item.glAccountName}</td>
                            <td>{item.entryType.value === "DEBIT" ? item.amount : ""}</td>
                            <td>{item.entryType.value === "CREDIT" ? item.amount : ""}</td>
                        </tr>
                    ))}
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

                <button
                    onClick={() => setShowTransactionTable(false)}
                    className="back-to-form-button"
                >
                    Back to Journal Entries
                </button>
            </div>
        );
    };

    const handleRevertTransaction = async () => {
        if (!transactionId) {
            alert("Transaction ID is missing. Unable to revert transaction.");
            return;
        }

        try {
            startLoading();
            const response = await axios.post(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/journalentries/${transactionId}?command=reverse`,
                { comments: revertComments },
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const newId = response.data.transactionId;
            setNewTransactionId(newId);

            setRevertedTransactions((prev) => ({
                ...prev,
                [transactionId]: true,
            }));

            setShowRevertModal(false);
            setShowSuccessModal(true);

            setRevertComments("");
        } catch (error) {
            console.error("Error reverting transaction:", error.response?.data || error.message);
            alert("Failed to revert transaction. Please try again.");
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="view-journal-entries">
            {showTransactionTable ? (
                renderTransactionTable()
            ) : (
                <>
                    <h3 className={'view-journal-entries-title'}>Search Journal Entries</h3>

                    <div className="search-form">
                        <div className="search-field">
                            <input
                                type="text"
                                name="accountName"
                                placeholder="Account Name"
                                value={filters.accountName}
                                onChange={handleAccountNameChange}
                                className="search-input"
                                onFocus={() => setShowAccountSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowAccountSuggestions(false), 200)}
                            />
                            {showAccountSuggestions && (
                                <ul className="suggestions-list">
                                    {accountSuggestions.map((account) => (
                                        <li key={account.id} onClick={() => handleAccountSelect(account.name)}>
                                            {account.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <select
                            name="office"
                            value={filters.office}
                            onChange={handleInputChange}
                            className="search-input"
                        >
                            <option value="">Select Office</option>
                            {offices.map((office) => (
                                <option key={office.id} value={office.name}>{office.name}</option>
                            ))}
                        </select>
                        <input
                            type="date"
                            name="transactionDate"
                            value={filters.transactionDate}
                            onChange={handleInputChange}
                            className="search-input"
                        />
                        <input
                            type="text"
                            name="transactionId"
                            placeholder="Transaction ID"
                            value={filters.transactionId}
                            onChange={handleInputChange}
                            className="search-input"
                        />
                        {/*<button onClick={handleSearch} className="search-button">Search</button>*/}
                    </div>

                    <div className="page-size-selector">
                        <label htmlFor="pageSize">Rows per page: </label>
                        <select
                            id="pageSize"
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="page-size-dropdown"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>

                    <table className="journal-entries-table">
                        <thead>
                        <tr>
                            <th>Entry ID</th>
                            <th>Office</th>
                            <th>Transaction Date</th>
                            <th>Transaction ID</th>
                            <th>Account Name</th>
                            <th>Debit</th>
                            <th>Credit</th>
                        </tr>
                        </thead>
                        <tbody>
                        {entries.length === 0 ? (
                            <tr>
                                <td colSpan="7">No entries found. Please apply filters and search.</td>
                            </tr>
                        ) : (
                            entries.map((entry) => {
                                const isDebit = entry.entryType.value === "DEBIT";
                                const debitAmount = isDebit ? entry.amount : 0;
                                const creditAmount = isDebit ? 0 : entry.amount;

                                const currencySymbol = entry.currency?.displaySymbol || '';
                                const decimalPlaces = entry.currency?.decimalPlaces || 2;

                                return (
                                    <tr key={entry.id} onClick={() => handleRowClick(entry.transactionId)} className="clickable-row">
                                        <td>{entry.id}</td>
                                        <td>{entry.officeName}</td>
                                        <td>{formatDate(entry.transactionDate)}</td>
                                        <td>{entry.transactionId || 'N/A'}</td>
                                        <td>{entry.glAccountName || 'N/A'}</td>
                                        <td>{debitAmount ? formatCurrency(debitAmount, currencySymbol, decimalPlaces) : ''}</td>
                                        <td>{creditAmount ? formatCurrency(creditAmount, currencySymbol, decimalPlaces) : ''}</td>
                                    </tr>
                                );
                            })
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
                                onClick={handlePreviousPage}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>
                            <span>Page {currentPage} of {totalPages}</span>
                            <button
                                className="pagination-button"
                                onClick={handleNextPage}
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
                </>
            )}

            {showRevertModal && (
                <div
                    className="create-provisioning-criteria-modal-overlay"
                    onClick={() => setShowRevertModal(false)}
                >
                    <div
                        className="create-provisioning-criteria-modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h4 className="create-modal-title">Are you sure you want to revert this transaction?</h4>
                        <div className="create-provisioning-criteria-group">
                            <label className="create-provisioning-criteria-label">Comments</label>
                            <textarea
                                value={revertComments}
                                onChange={(e) => setRevertComments(e.target.value)}
                                className="create-provisioning-criteria-input"
                                placeholder="Enter comments"
                            ></textarea>
                        </div>
                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                onClick={() => setShowRevertModal(false)}
                                className="create-provisioning-criteria-cancel"
                            >
                                No
                            </button>
                            <button
                                onClick={handleRevertTransaction}
                                className="create-provisioning-criteria-confirm"
                                disabled={!revertComments.trim()}
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showSuccessModal && (
                <div
                    className="create-provisioning-criteria-modal-overlay"
                >
                    <div
                        className="create-provisioning-criteria-modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h4 className="create-modal-title">Transaction Reverted</h4><br/>
                        <p className="create-provisioning-criteria-label">Success! <br/> A new journal entry has been created to reverse this transaction:</p>
                        <br/><br/>
                        <p className="create-provisioning-criteria-label">
                            <strong>Transaction ID: </strong> {newTransactionId}
                        </p>
                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                onClick={() => setShowSuccessModal(false)}
                                className="create-provisioning-criteria-cancel"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => handleRowClick(newTransactionId)}
                                className="create-provisioning-criteria-confirm"
                            >
                                Redirect to New Transaction
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ViewJournalEntries;
