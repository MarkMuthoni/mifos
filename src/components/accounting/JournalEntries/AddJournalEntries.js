import React, { useContext, useEffect, useState } from "react";
import { useLoading } from "../../../context/LoadingContext";
import axios from "axios";
import { API_CONFIG } from "../../../config";
import { AuthContext } from "../../../context/AuthContext";
import DatePicker from "react-datepicker";
import './JournalEntries.css'
import {NotificationContext} from "../../../context/NotificationContext";

const AddJournalEntries = () => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const [currentStage, setCurrentStage] = useState(0);
    const [completedStages, setCompletedStages] = useState(new Set(["Preview"]));
    const [allStagesComplete, setAllStagesComplete] = useState(false);
    const [offices, setOffices] = useState([]);
    const [office, setOffice] = useState("");
    const [routingCode, setRoutingCode] = useState("");
    const [receiptNumber, setReceiptNumber] = useState("");
    const [stages] = useState([
        "Basic Information",
        "Affected GL Entries",
        "Payment Details",
        "Preview",
    ]);
    const [currencies, setCurrencies] = useState([]);
    const [currency, setCurrency] = useState("");
    const [referenceNumber, setReferenceNumber] = useState("");
    const [transactionDate, setTransactionDate] = useState("");
    const [paymentType, setPaymentType] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [chequeNumber, setChequeNumber] = useState("");
    const [bankNumber, setBankNumber] = useState("");
    const [comments, setComments] = useState("");
    const [glAccounts, setGlAccounts] = useState([]);
    const [debits, setDebits] = useState([{ type: "", amount: "" }]);
    const [credits, setCredits] = useState([{ type: "", amount: "" }]);
    const [accountingRules, setAccountingRules] = useState([]);
    const [paymentTypes, setPaymentTypes] = useState([]);
    const [showTransactionTable, setShowTransactionTable] = useState(false);
    const [transactionDetails, setTransactionDetails] = useState(null);
    const [revertedTransactions, setRevertedTransactions] = useState({});
    const isStep1Complete = office && currency && transactionDate;
    const isStep2Complete = () => {
        const allDebitsValid = debits.every((debit) => debit.type && debit.amount && parseFloat(debit.amount) > 0);

        const allCreditsValid = credits.every((credit) => credit.type && credit.amount && parseFloat(credit.amount) > 0);

        const totalDebits = debits.reduce((sum, debit) => sum + parseFloat(debit.amount || 0), 0);
        const totalCredits = credits.reduce((sum, credit) => sum + parseFloat(credit.amount || 0), 0);

        const isBalanced = totalDebits === totalCredits;

        return allDebitsValid && allCreditsValid && isBalanced;
    };
    const usedDebitIds = debits.map((debit) => debit.type);
    const usedCreditIds = credits.map((credit) => credit.type);
    const [showRevertModal, setShowRevertModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [revertComments, setRevertComments] = useState("");
    const [newTransactionId, setNewTransactionId] = useState("");
    const [isReverted, setIsReverted] = useState(false);
    const [transactionId, setTransactionId] = useState("");
    const {showNotification} = useContext(NotificationContext);

    useEffect(() => {
        const fetchData = async () => {
            startLoading();
            try {
                const headers = {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                };

                const [officesResponse, currenciesResponse] = await Promise.all([
                    axios.get(`/fineract-provider/api/v1/offices`, { headers }),
                    axios.get(`/fineract-provider/api/v1/currencies`, { headers }),
                ]);

                setOffices(officesResponse.data);
                setCurrencies(currenciesResponse.data.selectedCurrencyOptions);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                stopLoading();
            }
        };

        fetchData();
    }, [user]);

    useEffect(() => {
        const fetchAccountingRules = async () => {
            startLoading();
            try {
                const headers = {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                };

                const response = await axios.get(
                    `/fineract-provider/api/v1/accountingrules?associations=all`,
                    { headers }
                );
                setAccountingRules(response.data);
            } catch (error) {
                console.error("Error fetching accounting rules:", error);
            } finally {
                stopLoading();
            }
        };

        fetchAccountingRules();
    }, [user]);

    useEffect(() => {
        const fetchGlAccounts = async () => {
            startLoading();
            try {
                const response = await axios.get(
                    `/fineract-provider/api/v1/glaccounts?manualEntriesAllowed=true&usage=1&disabled=false`,
                    {
                        headers: {
                            Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                            'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        },
                    }
                );
                setGlAccounts(response.data.map((account) => ({
                    id: account.id,
                    name: account.name,
                })));
            } catch (error) {
                console.error("Error fetching GL accounts:", error);
            } finally {
                stopLoading();
            }
        };

        fetchGlAccounts();
    }, [user]);

    useEffect(() => {
        setAllStagesComplete(completedStages.size === stages.length - 1);
    }, [completedStages, stages.length]);

    useEffect(() => {
        const fetchPaymentTypes = async () => {
            startLoading();
            try {
                const response = await axios.get(`/fineract-provider/api/v1/paymenttypes`, {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        "Content-Type": "application/json",
                    },
                });
                setPaymentTypes(response.data || []);
            } catch (error) {
                console.error("Error fetching payment types:", error);
            } finally {
                stopLoading();
            }
        };

        fetchPaymentTypes();
    }, [user]);

    const handleNextStage = () => {
        if (currentStage < stages.length - 1) {
            if (currentStage === 1 && !isStep2Complete()) {
                alert("Ensure debits and credits are balanced and valid.");
                return;
            }

            setCompletedStages((prev) => {
                const updatedStages = new Set(prev);
                updatedStages.add(stages[currentStage]);
                updatedStages.add("Preview");
                return updatedStages;
            });
            setCurrentStage((prev) => prev + 1);
        }
    };

    const handleSubmit = async () => {
        const formattedTransactionDate = new Date(transactionDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });

        const payload = {
            officeId: parseInt(office),
            currencyCode: currency,
            referenceNumber: referenceNumber || "",
            transactionDate: formattedTransactionDate,
            paymentTypeId: parseInt(paymentType),
            accountNumber: accountNumber || "",
            bankNumber: bankNumber || "",
            checkNumber: chequeNumber || "",
            routingCode: routingCode || "",
            receiptNumber: receiptNumber || "",
            comments: comments || "",
            debits: debits.map((debit) => ({
                glAccountId: parseInt(debit.type),
                amount: parseFloat(debit.amount),
            })),
            credits: credits.map((credit) => ({
                glAccountId: parseInt(credit.type),
                amount: parseFloat(credit.amount),
            })),
            dateFormat: "dd MMMM yyyy",
            locale: "en",
        };

        try {
            startLoading();
            const response = await axios.post(
                `/fineract-provider/api/v1/journalentries`,
                payload,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const newTransactionId = response.data.transactionId;
            setTransactionId(newTransactionId);
            const transactionResponse = await axios.get(
                `/fineract-provider/api/v1/journalentries?transactionId=${newTransactionId}&transactionDetails=true`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            setTransactionDetails(transactionResponse.data);
            setShowTransactionTable(true);

            setOffice("");
            setCurrency("");
            setReferenceNumber("");
            setTransactionDate("");
            setPaymentType("");
            setAccountNumber("");
            setChequeNumber("");
            setBankNumber("");
            setRoutingCode("");
            setReceiptNumber("");
            setComments("");
            setDebits([{ type: "", amount: "" }]);
            setCredits([{ type: "", amount: "" }]);
            showNotification("Journal entry submitted!", 'success');
        } catch (error) {
            console.error("Error submitting journal entry:", error.response?.data || error.message);
            showNotification("Failed to submit journal entry!", 'error');
        } finally {
            stopLoading();
        }
    };

    const getAvailableOptions = (usedIds) =>
        glAccounts.filter((account) => !usedIds.includes(account.id));

    const handleDebitChange = (index, field, value) => {
        const updatedDebits = [...debits];
        updatedDebits[index][field] = value;
        setDebits(updatedDebits);
    };

    const handleCreditChange = (index, field, value) => {
        const updatedCredits = [...credits];
        updatedCredits[index][field] = value;
        setCredits(updatedCredits);
    };

    const handleAddDebit = () => {
        if (debits.length < 4) {
            setDebits([...debits, { type: "", amount: "" }]);
        }
    };

    const handleAddCredit = () => {
        if (credits.length < 4) {
            setCredits([...credits, { type: "", amount: "" }]);
        }
    };

    const handleRemoveDebit = (index) => {
        setDebits(debits.filter((_, i) => i !== index));
    };

    const handleRemoveCredit = (index) => {
        setCredits(credits.filter((_, i) => i !== index));
    };

    const renderStageTracker = () => {
        const trackerStages = stages;

        return (
            <div className="staged-form-stage-tracker">
                {trackerStages.map((stage, index) => (
                    <div
                        key={stage}
                        className={`staged-form-stage ${
                            index === currentStage
                                ? "staged-form-active"
                                : completedStages.has(stage)
                                    ? "staged-form-completed"
                                    : "staged-form-unvisited"
                        }`}
                        onClick={() => {
                            if (completedStages.has(stage)) {
                                setCurrentStage(index);
                            }
                        }}
                    >
                        <span className="staged-form-stage-circle">{index + 1}</span>
                        <span className="staged-form-stage-label">{stage}</span>
                    </div>
                ))}
            </div>
        );
    };

    const renderStageContent = () => {
        switch (stages[currentStage]) {
            case "Basic Information":
                return (
                    <div className="staged-form-basic-info">
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="office">
                                    Office <span className="staged-form-required">*</span>
                                </label>
                                <select
                                    id="office"
                                    value={office}
                                    onChange={(e) => setOffice(e.target.value)}
                                    className="staged-form-select"
                                    required
                                >
                                    <option value="">-- Select Office --</option>
                                    {offices.map((o) => (
                                        <option key={o.id} value={o.id}>
                                            {o.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="currency">
                                    Currency <span>*</span>
                                </label>
                                <select
                                    id="currency"
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="staged-form-select"
                                    required
                                >
                                    <option value="">-- Select Currency --</option>
                                    {currencies.map((currency) => (
                                        <option key={currency.code} value={currency.code}>
                                            {currency.name} ({currency.displaySymbol})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="referenceNumber">Reference Number</label>
                                <input
                                    id="referenceNumber"
                                    type="text"
                                    value={referenceNumber}
                                    onChange={(e) => setReferenceNumber(e.target.value)}
                                    className="staged-form-input"
                                    placeholder="Enter Reference Number"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="transactionDate">
                                    Transaction Date <span>*</span>
                                </label>
                                <DatePicker
                                    id="transactionDate"
                                    selected={transactionDate ? new Date(transactionDate) : null}
                                    onChange={(date) => setTransactionDate(date.toISOString().split("T")[0])}
                                    className="staged-form-input"
                                    placeholderText="Select Transaction Date"
                                    dateFormat="MMMM d, yyyy"
                                    showPopperArrow={false}
                                    showMonthDropdown
                                    showYearDropdown
                                    dropdownMode="select"
                                />
                            </div>
                        </div>
                    </div>
                );

            case "Affected GL Entries":
                return (
                    <div className="staged-form-affected-entries">
                        <div className="staged-form-add-button">
                            <button
                                type="button"
                                className="add-entry-button"
                                onClick={handleAddDebit}
                                disabled={debits.length >= 4}
                            >
                                Add Debit
                            </button>
                        </div>
                        {debits.map((debit, index) => (
                            <div key={`debit-${index}`} className="staged-form-row">
                                <div className="staged-form-field">
                                    <label>Affected GL Entry (Debit)</label>
                                    <select
                                        value={debit.type}
                                        onChange={(e) => handleDebitChange(index, "type", e.target.value)}
                                        className="staged-form-select"
                                    >
                                        <option value="">-- Select Debit Type --</option>
                                        {getAvailableOptions(usedDebitIds).map((account) => (
                                            <option key={account.id} value={account.id}>
                                                {account.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="staged-form-field">
                                    <label>Debit Amount</label>
                                    <input
                                        type="number"
                                        value={debit.amount}
                                        onChange={(e) => handleDebitChange(index, "amount", e.target.value)}
                                        className="staged-form-input"
                                    />
                                </div>
                                {debits.length > 1 && (
                                    <button
                                        type="button"
                                        className="remove-entry-button"
                                        onClick={() => handleRemoveDebit(index)}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}

                        <div className="staged-form-add-button">
                            <button
                                type="button"
                                className="add-entry-button"
                                onClick={handleAddCredit}
                                disabled={credits.length >= 4}
                            >
                                Add Credit
                            </button>
                        </div>
                        {credits.map((credit, index) => (
                            <div key={`credit-${index}`} className="staged-form-row">
                                <div className="staged-form-field">
                                    <label>Affected GL Entry (Credit)</label>
                                    <select
                                        value={credit.type}
                                        onChange={(e) => handleCreditChange(index, "type", e.target.value)}
                                        className="staged-form-select"
                                    >
                                        <option value="">-- Select Credit Type --</option>
                                        {getAvailableOptions(usedCreditIds).map((account) => (
                                            <option key={account.id} value={account.id}>
                                                {account.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="staged-form-field">
                                    <label>Credit Amount</label>
                                    <input
                                        type="number"
                                        value={credit.amount}
                                        onChange={(e) => handleCreditChange(index, "amount", e.target.value)}
                                        className="staged-form-input"
                                    />
                                </div>
                                {credits.length > 1 && (
                                    <button
                                        type="button"
                                        className="remove-entry-button"
                                        onClick={() => handleRemoveCredit(index)}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                );

            case "Payment Details":
                return (
                    <div className="staged-form-payment-details">
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="paymentType">Payment Type</label>
                                <select
                                    id="paymentType"
                                    value={paymentType}
                                    onChange={(e) => setPaymentType(e.target.value)}
                                    className="staged-form-select"
                                >
                                    <option value="">-- Select Payment Type --</option>
                                    {paymentTypes.map((type) => (
                                        <option key={type.id} value={type.id}>
                                            {type.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="accountNumber">Account Number</label>
                                <input
                                    id="accountNumber"
                                    type="text"
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value)}
                                    className="staged-form-input"
                                    placeholder="Enter Account Number"
                                />
                            </div>
                        </div>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="chequeNumber">Cheque Number</label>
                                <input
                                    id="chequeNumber"
                                    type="text"
                                    value={chequeNumber}
                                    onChange={(e) => setChequeNumber(e.target.value)}
                                    className="staged-form-input"
                                    placeholder="Enter Cheque Number"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="routingCode">Routing Code</label>
                                <input
                                    id="routingCode"
                                    type="text"
                                    value={routingCode}
                                    onChange={(e) => setRoutingCode(e.target.value)}
                                    className="staged-form-input"
                                    placeholder="Enter Routing Code"
                                />
                            </div>
                        </div>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="receiptNumber">Receipt Number</label>
                                <input
                                    id="receiptNumber"
                                    type="text"
                                    value={receiptNumber}
                                    onChange={(e) => setReceiptNumber(e.target.value)}
                                    className="staged-form-input"
                                    placeholder="Enter Receipt Number"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="bankNumber">Bank Number</label>
                                <input
                                    id="bankNumber"
                                    type="text"
                                    value={bankNumber}
                                    onChange={(e) => setBankNumber(e.target.value)}
                                    className="staged-form-input"
                                    placeholder="Enter Bank Number"
                                />
                            </div>
                        </div>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="comments">Comments</label>
                                <textarea
                                    id="comments"
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    className="staged-form-textarea"
                                    placeholder="Enter any comments"
                                ></textarea>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    const renderPreviewSection = () => {
        const getOfficeName = () => {
            const officeObj = offices.find((o) => o.id === parseInt(office));
            return officeObj ? officeObj.name : "";
        };

        const getPaymentTypeName = () => {
            const paymentTypeObj = paymentTypes.find((type) => type.id === parseInt(paymentType));
            return paymentTypeObj ? paymentTypeObj.name : "";
        };

        const getGlEntryName = (id) => {
            const glEntry = glAccounts.find((account) => account.id === parseInt(id));
            return glEntry ? glEntry.name : "";
        };

        const stageData = [
            {
                title: "Basic Information",
                data: {
                    Office: getOfficeName(),
                    Currency: currency || "",
                    "Reference Number": referenceNumber || "",
                    "Transaction Date": transactionDate || "",
                },
            },
            {
                title: "Affected GL Entries",
                data: {
                    Debits: debits.map((debit) => ({
                        "GL Account": getGlEntryName(debit.type),
                        Amount: debit.amount || "",
                    })),
                    Credits: credits.map((credit) => ({
                        "GL Account": getGlEntryName(credit.type),
                        Amount: credit.amount || "",
                    })),
                },
            },
            {
                title: "Payment Details",
                data: {
                    "Payment Type": getPaymentTypeName(),
                    "Account Number": accountNumber || "",
                    "Cheque Number": chequeNumber || "",
                    "Routing Code": routingCode || "",
                    "Receipt Number": receiptNumber || "",
                    "Bank Number": bankNumber || "",
                    Comments: comments || "",
                },
            },
        ];

        return (
            <div className="staged-form-preview-section">
                <h2 className="preview-header">Form Preview</h2>
                {stageData.map(({ title, data }, index) => (
                    <div key={title} className="staged-form-preview-block">
                        <div className="staged-form-preview-header">
                            <h4 className="preview-stage-title">{title}</h4>
                            <button
                                className="staged-form-edit-button"
                                onClick={() => setCurrentStage(index)}
                            >
                                Edit
                            </button>
                        </div>
                        {title === "Affected GL Entries" ? (
                            <div>
                                <h5>Debits</h5>
                                <table style={{ color: "#333" }} className="staged-form-preview-table">
                                    <thead>
                                    <tr>
                                        <th>GL Account</th>
                                        <th>Amount</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {data.Debits.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{item["GL Account"]}</td>
                                            <td>{item.Amount}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                                <h5>Credits</h5>
                                <table style={{ color: "#333" }} className="staged-form-preview-table">
                                    <thead>
                                    <tr>
                                        <th>GL Account</th>
                                        <th>Amount</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {data.Credits.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{item["GL Account"]}</td>
                                            <td>{item.Amount}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : Array.isArray(data) && data.length > 0 ? (
                            <table style={{ color: "#333" }} className="staged-form-preview-table">
                                <thead>
                                <tr>
                                    {Object.keys(data[0]).map((key) => (
                                        <th key={key}>{key}</th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                {data.map((item, idx) => (
                                    <tr key={idx}>
                                        {Object.values(item).map((value, i) => (
                                            <td key={i}>{value || ""}</td>
                                        ))}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="staged-form-preview-table-wrapper">
                                <table style={{ color: "#333" }} className="staged-form-preview-table">
                                    <thead>
                                    <tr>
                                        <th>Field</th>
                                        <th>Value</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {Object.entries(data).map(([key, value]) => (
                                        <tr key={key}>
                                            <td>{key}</td>
                                            <td>{value || ""}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

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

                <div className="table-controls">
                    <div className="page-size-selector">
                        <label>Rows per page:</label>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                </div>

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
                    onClick={() => {
                        setShowTransactionTable(false);
                        setCurrentStage(0);
                    }}
                    className="back-to-form-button"
                >
                    Back to Form
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
                `/fineract-provider/api/v1/journalentries/${transactionId}?command=reverse`,
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

    const fetchTransactionDetails = async (transactionId) => {
        try {
            startLoading();
            const response = await axios.get(
                `/fineract-provider/api/v1/journalentries?transactionId=${transactionId}&transactionDetails=true`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    },
                }
            );
            setTransactionDetails(response.data);
            setTransactionId(transactionId);
            setShowSuccessModal(false);
            setShowTransactionTable(true);
        } catch (error) {
            console.error("Error fetching transaction details:", error.response?.data || error.message);
            alert("Failed to fetch transaction details.");
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="form-container-client">
            {showTransactionTable ? (
                renderTransactionTable()
            ) : (
                <div className="staged-form-add-client">
                    {renderStageTracker()}
                    <div className="staged-form-stage-content">
                    {currentStage === stages.length - 1 ? (
                            renderPreviewSection()
                        ) : (
                            renderStageContent()
                        )}
                    </div>
                    <div className="staged-form-stage-buttons">
                        <button
                            onClick={() => setCurrentStage((prev) => Math.max(prev - 1, 0))}
                            disabled={currentStage === 0}
                            className="staged-form-button-previous"
                        >
                            Previous
                        </button>
                        {currentStage < stages.length - 1 && (
                            <button
                                onClick={handleNextStage}
                                className="staged-form-button-next"
                                disabled={
                                    (currentStage === 0 && !isStep1Complete) ||
                                    (currentStage === 1 && !isStep2Complete)
                                }
                            >
                                Next
                            </button>
                        )}
                        {currentStage === stages.length - 1 && (
                            <button
                                onClick={handleSubmit}
                                className="staged-form-button-next"
                            >
                                Submit
                            </button>
                        )}
                    </div>
                </div>
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
                        <p>Success! <br/> A new journal entry has been created to reverse this transaction:</p>
                        <br/><br/>
                        <p>
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
                                onClick={() => fetchTransactionDetails(newTransactionId)}
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

export default AddJournalEntries;
