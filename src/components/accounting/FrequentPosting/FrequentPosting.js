import React, {useContext, useEffect, useState} from 'react';
import {Link} from "react-router-dom";
import {useLoading} from "../../../context/LoadingContext";
import axios from "axios";
import {API_CONFIG} from "../../../config";
import {AuthContext} from "../../../context/AuthContext";
import DatePicker from "react-datepicker";
import {format} from "date-fns";
import {NotificationContext} from "../../../context/NotificationContext";

const FrequentPostingForm = () => {
    const { user } = useContext(AuthContext);

    const [currentStage, setCurrentStage] = useState(0);
    const [completedStages, setCompletedStages] = useState(new Set(["Preview"]));
    const [allStagesComplete, setAllStagesComplete] = useState(false);

    const [offices, setOffices] = useState([]);
    const [office, setOffice] = useState('');
    const [routingCode, setRoutingCode] = useState('');
    const [receiptNumber, setReceiptNumber] = useState('');
    const [stages] = useState(["Basic Information", "Payment Details", "Preview"]);

    const [accountingRule, setAccountingRule] = useState('');
    const [currency, setCurrency] = useState('');
    const [referenceNumber, setReferenceNumber] = useState('');

    const [accountingRules, setAccountingRules] = useState([]);
    const [currencies, setCurrencies] = useState([]);
    const [paymentTypes, setPaymentTypes] = useState([]);

    const [transactionDate, setTransactionDate] = useState('');
    const [paymentType, setPaymentType] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [chequeNumber, setChequeNumber] = useState('');
    const [bankNumber, setBankNumber] = useState('');
    const [comments, setComments] = useState('');
    const { startLoading, stopLoading } = useLoading();
    const {showNotification} = useContext(NotificationContext);

    const isStep1Complete = office && accountingRule && currency && transactionDate;
    const isStep2Complete =  paymentType;

    useEffect(() => {
        const fetchData = async () => {
            startLoading();
            try {
                const headers = {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                };

                const [officesResponse, accountingRulesResponse, currenciesResponse, paymentTypesResponse] = await Promise.all([
                    axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/offices`, { headers }),
                    axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/accountingrules?associations=all`, { headers }),
                    axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/currencies`, { headers }),
                    axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/paymenttypes`, { headers }),
                ]);

                setOffices(officesResponse.data);
                setAccountingRules(accountingRulesResponse.data);
                setCurrencies(currenciesResponse.data.selectedCurrencyOptions);
                setPaymentTypes(paymentTypesResponse.data);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                stopLoading();
            }
        };

        fetchData();
    }, [user]);

    useEffect(() => {
        setAllStagesComplete(completedStages.size === stages.length - 1);
    }, [completedStages, stages.length]);

    const handleNextStage = () => {
        if (currentStage < stages.length - 1) {
            setCompletedStages((prev) => {
                const updatedStages = new Set(prev);
                updatedStages.add(stages[currentStage]);
                updatedStages.add("Preview");
                return updatedStages;
            });
            setCurrentStage((prev) => prev + 1);
        }
    };

    const handleSubmit = async (e) => {
        startLoading();
        e.preventDefault();

        const formattedDate = format(new Date(transactionDate), "dd MMMM yyyy");

        const payload = {
            accountNumber: accountNumber,
            accountingRule: parseFloat(accountingRule),
            bankNumber: bankNumber,
            checkNumber: chequeNumber,
            comments: comments,
            dateFormat: "dd MMMM yyyy",
            locale: 'en',
            credits: [],
            debits: [],
            currencyCode: currency,
            officeId: parseInt(office),
            paymentTypeId: parseInt(paymentType),
            receiptNumber: receiptNumber,
            referenceNumber: referenceNumber,
            routingCode: routingCode,
            transactionDate: formattedDate,
        }

        try {
            const response = await axios.post(`${API_CONFIG.proxy}/fineract-provider/api/v1/journalentries`, payload,{
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });
            showNotification("Transaction Posted!", 'success');
        } catch (error) {
            console.error("Error creating journal entry:", error);
        } finally {
            stopLoading();
        }
        // console.log({
        //     office,
        //     accountingRule,
        //     currency,
        //     referenceNumber,
        //     transactionDate,
        //     paymentType,
        //     accountNumber,
        //     chequeNumber,
        //     routingCode,
        //     receiptNumber,
        //     bankNumber,
        //     comments,
        // });
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
                                <label htmlFor="accountingRule">
                                    Accounting Rules <span>*</span>
                                </label>
                                <select
                                    id="accountingRule"
                                    value={accountingRule}
                                    onChange={(e) => setAccountingRule(e.target.value)}
                                    className="staged-form-select"
                                    required
                                >
                                    <option value="">-- Select Rule --</option>
                                    {accountingRules.map((rule) => (
                                        <option key={rule.id} value={rule.id}>
                                            {rule.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="staged-form-row">
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
                                        <option key={type.id} value={type.name}>
                                            {type.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="staged-form-field">
                                <label>Bank Number</label>
                                <input
                                    type="text"
                                    value={bankNumber}
                                    onChange={(e) => setBankNumber(e.target.value)}
                                    className="staged-form-input"
                                />
                            </div>
                        </div>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label>Account Number</label>
                                <input
                                    type="text"
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value)}
                                    className="staged-form-input"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label>Cheque Number</label>
                                <input
                                    type="text"
                                    value={chequeNumber}
                                    onChange={(e) => setChequeNumber(e.target.value)}
                                    className="staged-form-input"
                                />
                            </div>
                        </div>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label>Routing Code</label>
                                <input
                                    type="text"
                                    value={routingCode}
                                    onChange={(e) => setRoutingCode(e.target.value)}
                                    className="staged-form-input"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label>Receipt Number</label>
                                <input
                                    type="text"
                                    value={receiptNumber}
                                    onChange={(e) => setReceiptNumber(e.target.value)}
                                    className="staged-form-input"
                                />
                            </div>
                        </div>
                        <div className="staged-form-field">
                            <label>Comments</label>
                            <textarea
                                rows="3"
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                className="staged-form-textarea"
                            ></textarea>
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
            return officeObj ? officeObj.name : "N/A";
        };

        const stageData = [
            {
                title: "Basic Information",
                data: {
                    Office: getOfficeName(),
                    "Accounting Rule": accountingRule || "N/A",
                    Currency: currency || "N/A",
                    "Reference Number": referenceNumber || "N/A",
                    "Transaction Date": transactionDate || "N/A",
                },
            },
            {
                title: "Payment Details",
                data: {
                    "Payment Type": paymentType || "N/A",
                    "Account Number": accountNumber || "N/A",
                    "Cheque Number": chequeNumber || "N/A",
                    "Routing Code": routingCode || "N/A",
                    "Receipt Number": receiptNumber || "N/A",
                    "Bank Number": bankNumber || "N/A",
                    Comments: comments || "N/A",
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
                        {data && typeof data === "object" && !Array.isArray(data) ? (
                            <div className="staged-form-preview-table-wrapper">
                                <table style={{color: '#333'}} className="staged-form-preview-table">
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
                                            <td>{value || "N/A"}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : Array.isArray(data) && data.length > 0 ? (
                            <table style={{color: '#333'}}  className="staged-form-preview-table">
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
                                            <td key={i}>{value || "N/A"}</td>
                                        ))}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="no-data-message">No data available for this section.</p>
                        )}
                    </div>
                ))}
            </div>
        );
    };


    return (
        <div className="journal-entries-screen neighbor-element">
            <div className="form-container-client">
                <h2>
                    <Link to="/accounting" className="breadcrumb-link">Accounting</Link> . Frequent Posting
                </h2>

                <div className="staged-form-add-client">
                    {renderStageTracker()}
                    <div className="staged-form-stage-content">
                        {currentStage === stages.length - 1 ? (
                            renderPreviewSection()
                        ) : (
                            renderStageContent()
                        )}

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
                                    disabled={!allStagesComplete}
                                >
                                    Submit
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default FrequentPostingForm;
