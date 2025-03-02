import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {useLoading} from "../context/LoadingContext";
import {AuthContext} from "../context/AuthContext";
import {API_CONFIG} from "../config";
import {Link} from "react-router-dom";
import {NotificationContext} from "../context/NotificationContext";


const CollectionSheet = () => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const { showNotification } = useContext(NotificationContext);

    const [offices, setOffices] = useState([]);
    const [staff, setStaff] = useState([]);
    const [selectedOffice, setSelectedOffice] = useState("");
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedStaff, setSelectedStaff] = useState("");
    const [collectionSheetData, setCollectionSheetData] = useState(null);
    const [activeTab, setActiveTab] = useState("dueCollections");
    const [showForm, setShowForm] = useState(true);
    const [loanPage, setLoanPage] = useState(1);
    const [loanPageSize, setLoanPageSize] = useState(10);
    const [loanFilter, setLoanFilter] = useState("");

    const [savingsPage, setSavingsPage] = useState(1);
    const [savingsPageSize, setSavingsPageSize] = useState(10);
    const [savingsFilter, setSavingsFilter] = useState("");

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [paymentType, setPaymentType] = useState("");
    const [receiptNumber, setReceiptNumber] = useState("");
    const [paymentAmount, setPaymentAmount] = useState("");
    const [savedPayments, setSavedPayments] = useState({});

    useEffect(() => {
        // Reset the paymentAmount when selectedPayment changes
        if (selectedPayment) {
            setPaymentAmount("");
        }
    }, [selectedPayment]);

    const openPaymentModal = (item, type) => {
        setSelectedPayment({ ...item, type });
        setShowPaymentModal(true);
        setPaymentType("");
        setReceiptNumber("");
    };

    const closePaymentModal = () => {
        setShowPaymentModal(false);
        setSelectedPayment(null);
    };

    const handleSavePayment = () => {
        if (!paymentType || !receiptNumber || !paymentAmount) {
            showNotification("Please fill in all required fields: payment type, receipt number, and amount!", "info");
            return;
        }

        const paymentData = {
            loanId: selectedPayment.type === "loan" ? selectedPayment.accountId : null,
            savingId: selectedPayment.type === "saving" ? selectedPayment.accountId : null,
            transactionAmount: parseFloat(paymentAmount),
            paymentType,
            receiptNumber,
        };

        setSavedPayments(prev => ({
            ...prev,
            [selectedPayment.accountId]: paymentData
        }));

        showNotification("Payment Saved!", "success");
        closePaymentModal();
    };

    useEffect(() => {
        setLoanPage(1);
        setSavingsPage(1);
    }, [activeTab]);

    useEffect(() => {
        fetchOffices();
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        if (selectedOffice) {
            fetchStaff(selectedOffice);
        } else {
            setStaff([]);
        }
        // eslint-disable-next-line
    }, [selectedOffice]);

    const fetchOffices = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/offices`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    "Fineract-Platform-TenantId": `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });
            setOffices(response.data || []);
        } catch (error) {
            console.error("Error fetching offices:", error);
        } finally {
            stopLoading();
        }
    };

    const fetchStaff = async (officeId) => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/staff?officeId=${officeId}&status=all`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    "Fineract-Platform-TenantId": `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });
            setStaff(response.data || []);
        } catch (error) {
            console.error("Error fetching staff:", error);
        } finally {
            stopLoading();
        }
    };

    const isDateValid = (date) => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate());
        return date && date <= yesterday;
    };

    const handleSubmit = async () => {
        if (!selectedOffice || !isDateValid(selectedDate)) return;

        startLoading();
        const formattedDate = new Date(selectedDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });

        const payload = {
            officeId: selectedOffice,
            transactionDate: formattedDate,
            staffId: selectedStaff || null,
            dateFormat: "dd MMMM yyyy",
            locale: "en",
        };

        try {
            const response = await axios.post(
                `/fineract-provider/api/v1/collectionsheet?command=generateCollectionSheet`,
                payload,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        "Fineract-Platform-TenantId": `${API_CONFIG.tenantId}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const data = response.data;

            const allClientsEmpty = data?.clients?.every(client =>
                (!client.loans || client.loans.length === 0) &&
                (!client.savings || client.savings.length === 0)
            );

            if (!data || !data.clients || data.clients.length === 0 || allClientsEmpty) {
                showNotification(
                    "No repayments and disbursals are available for the selected options!",
                    "info"
                );
                setCollectionSheetData(null);
                setShowForm(true);
            } else {
                setCollectionSheetData(data);
                setShowForm(false);
            }
        } catch (err) {
            console.error("Error fetching collection sheet:", err);
            showNotification("Failed to fetch collection sheet! Please try again!", "error");
        } finally {
            stopLoading();
            setSelectedOffice(null);
            setSelectedStaff(null);
        }
    };

    const filteredLoans = collectionSheetData?.clients
        .filter(client => client.loans && client.loans.length > 0) // Only clients with loans
        .flatMap(client =>
            client.loans
                .filter(loan =>
                    loan.accountId.includes(loanFilter) ||
                    loan.productShortName.toLowerCase().includes(loanFilter.toLowerCase()) ||
                    client.clientName.toLowerCase().includes(loanFilter.toLowerCase())
                )
                .map(loan => ({ ...loan, clientName: client.clientName }))
        ) || [];

    const filteredSavings = collectionSheetData?.clients
        .filter(client => client.savings && client.savings.length > 0) // Only clients with savings
        .flatMap(client =>
            client.savings
                .filter(saving =>
                    saving.accountId.includes(savingsFilter) ||
                    saving.productName.toLowerCase().includes(savingsFilter.toLowerCase()) ||
                    client.clientName.toLowerCase().includes(savingsFilter.toLowerCase())
                )
                .map(saving => ({ ...saving, clientName: client.clientName }))
        ) || [];

    const totalLoanPages = Math.ceil(filteredLoans.length / loanPageSize);
    const totalSavingsPages = Math.ceil(filteredSavings.length / savingsPageSize);

    const paginatedLoans = filteredLoans.slice((loanPage - 1) * loanPageSize, loanPage * loanPageSize);
    const paginatedSavings = filteredSavings.slice((savingsPage - 1) * savingsPageSize, savingsPage * savingsPageSize);

    const handleSave = async () => {
        const formattedDate = new Date(selectedDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });

        const bulkRepaymentTransactions = Object.values(savedPayments).filter(p => p.loanId !== null);

        const payload = {
            dateFormat: "dd MMMM yyyy",
            locale: "en",
            transactionDate: formattedDate,
            bulkRepaymentTransactions,
        };

        try {
            startLoading();
            await axios.post(`/fineract-provider/api/v1/collectionsheet?command=saveCollectionSheet`, payload, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    "Fineract-Platform-TenantId": `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });
            showNotification("Collection Sheet Submitted Successfully!", "success");
            setShowForm(true);
        } catch (err) {
            console.error("Error submitting collection sheet:", err);
            showNotification("Failed to submit collection sheet! Please try again.", "error");
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="custom-page-container neighbor-element">
            <h2 className="page-heading">
                <Link to="/dashboard" className={"breadcrumb-link"}>Dashboard</Link> . {" "}
                Individual Collection Sheet
            </h2>
            {showForm ? (
                <div className="custom-content">
                    <div className="custom-report-form">
                        <div className="staged-form-field">
                            <label>Branch Office <span>*</span></label>
                            <select value={selectedOffice}
                                    className="staged-form-select"
                                    onChange={(e) => setSelectedOffice(e.target.value)}>
                                <option value="">Select an office</option>
                                {offices.map((office) => (
                                    <option key={office.id} value={office.id}>
                                        {office.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="staged-form-field">
                            <label>Repayment Date <span>*</span></label>
                            <DatePicker
                                selected={selectedDate}
                                onChange={(date) => setSelectedDate(date)}
                                placeholderText="Select Repayment Date"
                                className="staged-form-input"
                                dateFormat="d MMMM yyyy"
                                showPopperArrow={false}
                                maxDate={new Date(new Date().setDate(new Date().getDate()))}
                                showMonthDropdown
                                showYearDropdown
                                dropdownMode="select"
                            />
                        </div>

                        <div className="staged-form-field">
                            <label>Staff</label>
                            <select
                                className="staged-form-select"
                                value={selectedStaff}
                                onChange={(e) => setSelectedStaff(e.target.value)}
                            >
                                <option value="">Select staff</option>
                                {staff.map((staff) => (
                                    <option key={staff.id} value={staff.id}>
                                        {staff.displayName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            className="create-provisioning-criteria-confirm"
                            onClick={handleSubmit}
                            disabled={!selectedOffice || !isDateValid(selectedDate)}
                        >
                            Collection Sheet
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <button
                        className="create-provisioning-criteria-confirm"
                        onClick={() => setShowForm(true)}
                    >
                        Show Form
                    </button>
                    <div className="users-tab-container">
                        <button
                            className={`users-tab-button ${activeTab === 'dueCollections' ? 'active' : ''}`}
                            onClick={() => setActiveTab('dueCollections')}
                        >
                            Due Collections
                        </button>
                        <button
                            className={`users-tab-button ${activeTab === 'dueSavingsCollections' ? 'active' : ''}`}
                            onClick={() => setActiveTab('dueSavingsCollections')}
                        >
                            Due Savings Collections
                        </button>
                    </div>
                    <div className="users-tab-content">
                        {activeTab === 'dueCollections' && (
                            <>
                                <div className="table-controls">
                                    <div className="filters-container">
                                        <div className="filter-group">
                                            <label>Filter by Loan Account, Client Name, or Product Name: </label>
                                            <input
                                                type="text"
                                                placeholder="Filter by Loan Account, Client Name, or Product Name"
                                                value={loanFilter}
                                                onChange={(e) => setLoanFilter(e.target.value)}
                                                className="filter-input"
                                            />
                                        </div>
                                    </div>

                                    <div className="page-size-selector">
                                        <label htmlFor="loanPageSize">Rows per page: </label>
                                        <select id="loanPageSize" value={loanPageSize} onChange={(e) => {
                                            setLoanPageSize(Number(e.target.value));
                                            setLoanPage(1);
                                        }} className="page-size-dropdown">
                                            <option value={5}>5</option>
                                            <option value={10}>10</option>
                                            <option value={20}>20</option>
                                            <option value={50}>50</option>
                                            <option value={100}>100</option>
                                        </select>
                                    </div>
                                </div>
                                {paginatedLoans.length > 0 && (
                                    <table className="users-table">
                                        <thead>
                                        <tr>
                                            <th>Loan Account</th>
                                            <th>Product Name</th>
                                            <th>Client Name</th>
                                            <th>Total Due</th>
                                            <th>Charges</th>
                                            <th>Actions</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {paginatedLoans.map((loan) => (
                                            <tr key={loan?.loanId}>
                                                <td>{loan?.accountId}</td>
                                                <td>{loan?.productShortName}</td>
                                                <td>{loan?.clientName}</td>
                                                <td>{loan?.totalDue.toFixed(2)} {loan?.currency?.displaySymbol}</td>
                                                <td>{(loan?.feeDue + loan?.interestDue).toFixed(2)} {loan?.currency.displaySymbol}</td>
                                                <td>
                                                    <button onClick={() => openPaymentModal(loan, "loan")}
                                                            style={{
                                                                backgroundColor: "#17a2b8",
                                                                color: "#ffffff",
                                                                border: "none",
                                                                padding: "8px 12px",
                                                                borderRadius: "4px",
                                                                cursor: "pointer",
                                                                fontSize: "14px",
                                                                fontWeight: "bold"
                                                            }}
                                                    >Add Payment
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                )}

                                {totalLoanPages > 1 && paginatedLoans.length > 0 && (
                                    <div className="pagination">
                                        <button
                                            className="pagination-button"
                                            onClick={() => setLoanPage(1)} disabled={loanPage === 1}>Start
                                        </button>
                                        <button
                                            className="pagination-button"
                                            onClick={() => setLoanPage(prev => Math.max(prev - 1, 1))}
                                            disabled={loanPage === 1}>Previous
                                        </button>
                                        <span>Page {loanPage} of {totalLoanPages}</span>
                                        <button
                                            className="pagination-button"
                                            onClick={() => setLoanPage(prev => Math.min(prev + 1, totalLoanPages))}
                                            disabled={loanPage === totalLoanPages}>Next
                                        </button>
                                        <button
                                            className="pagination-button"
                                            onClick={() => setLoanPage(totalLoanPages)}
                                            disabled={loanPage === totalLoanPages}>End
                                        </button>
                                    </div>
                                )}

                                <div className="submit-button-container">
                                    <button onClick={handleSave} className="submit-button">
                                        Submit Collection Sheet
                                    </button>
                                </div>
                            </>
                        )}

                        {activeTab === 'dueSavingsCollections' && (
                            <>
                                <div className="table-controls">
                                    <div className="filters-container">
                                        <div className="filter-group">
                                            <label>Filter by Deposit Account, Client Name, or Product Name: </label>
                                            <input type="text"
                                                   placeholder="Filter by Deposit Account, Client Name, or Product Name"
                                                   value={savingsFilter}
                                                   onChange={(e) => setSavingsFilter(e.target.value)}
                                                   className="filter-input"/>
                                        </div>
                                    </div>
                                    <div className="page-size-selector">
                                        <label htmlFor="savingsPageSize">Rows per page: </label>
                                        <select id="savingsPageSize" value={savingsPageSize} onChange={(e) => {
                                            setSavingsPageSize(Number(e.target.value));
                                            setSavingsPage(1);
                                        }} className="page-size-dropdown">
                                            <option value={5}>5</option>
                                            <option value={10}>10</option>
                                            <option value={20}>20</option>
                                            <option value={50}>50</option>
                                            <option value={100}>100</option>
                                        </select>
                                    </div>
                                </div>

                                {paginatedSavings.length > 0 && (
                                    <table className="users-table">
                                        <thead>
                                        <tr>
                                            <th>Deposit Account</th>
                                            <th>Product Name</th>
                                            <th>Client Name</th>
                                            <th>Total Due</th>
                                            <th>Actions</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {paginatedSavings.map((saving) => (
                                            <tr key={saving?.savingsId}>
                                                <td>{saving?.accountId}</td>
                                                <td>{saving?.productName}</td>
                                                <td>{saving?.clientName}</td>
                                                <td>{saving?.dueAmount.toFixed(2)} {saving?.currency.displaySymbol}</td>
                                                <td>
                                                    <button
                                                        style={{
                                                            backgroundColor: "#17a2b8",
                                                            color: "#ffffff",
                                                            border: "none",
                                                            padding: "8px 12px",
                                                            borderRadius: "4px",
                                                            cursor: "pointer",
                                                            fontSize: "14px",
                                                            fontWeight: "bold"
                                                        }}
                                                        onClick={() => openPaymentModal(saving, "saving")}>Add Payment
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                )}
                                {totalSavingsPages > 1 && paginatedSavings.length > 0 && (
                                    <div className="pagination">
                                        <button
                                            className="pagination-button"
                                            onClick={() => setSavingsPage(1)} disabled={savingsPage === 1}>Start
                                        </button>
                                        <button
                                            className="pagination-button"
                                            onClick={() => setSavingsPage(prev => Math.max(prev - 1, 1))}
                                            disabled={savingsPage === 1}>Previous
                                        </button>
                                        <span>Page {savingsPage} of {totalSavingsPages}</span>
                                        <button
                                            className="pagination-button"
                                            onClick={() => setSavingsPage(prev => Math.min(prev + 1, totalSavingsPages))}
                                            disabled={savingsPage === totalSavingsPages}>Next
                                        </button>
                                        <button
                                            className="pagination-button"
                                            onClick={() => setSavingsPage(totalSavingsPages)}
                                            disabled={savingsPage === totalSavingsPages}>End
                                        </button>
                                    </div>
                                )}

                                <div className="submit-button-container">
                                    <button onClick={handleSave} className="submit-button">
                                        Submit Collection Sheet
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}
            {showPaymentModal && selectedPayment && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h3 className="create-modal-title">Payment
                            for {selectedPayment.type === "loan" ? "Loan" : "Saving"} account
                            Id: {selectedPayment.accountId}</h3>

                        <div className="create-provisioning-criteria-group">
                            <label className="create-provisioning-criteria-label">Payment Type <span>*</span></label>
                            <select
                                value={paymentType}
                                className="create-provisioning-criteria-input"
                                onChange={(e) => setPaymentType(e.target.value)}>
                                <option value="">Select Payment Type</option>
                                {collectionSheetData.paymentTypeOptions.map(option => (
                                    <option key={option.id} value={option.name}>{option.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="create-provisioning-criteria-group">
                            <label className="create-provisioning-criteria-label">Receipt Number <span>*</span></label>
                            <input type="text"
                                   value={receiptNumber}
                                   className="create-provisioning-criteria-input"
                                   onChange={(e) => setReceiptNumber(e.target.value)}/>
                        </div>

                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="paymentAmount" className="create-provisioning-criteria-label">
                                Amount <span>*</span>
                            </label>
                            <input
                                type="number"
                                id="paymentAmount"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
                                min="0"
                                className="create-provisioning-criteria-input"
                                step="10"
                            />
                        </div>

                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                className="create-provisioning-criteria-cancel"
                                onClick={closePaymentModal}>Cancel
                            </button>
                            <button
                                className="create-provisioning-criteria-confirm"
                                onClick={handleSavePayment}>Save Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default CollectionSheet;
