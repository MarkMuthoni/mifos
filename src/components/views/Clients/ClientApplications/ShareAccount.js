import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../../../context/AuthContext';
import { useLoading } from '../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../config';
import DatePicker from "react-datepicker";

const ShareAccount = () => {
    const { clientId } = useParams();
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();

    const [currentStage, setCurrentStage] = useState('Details');
    const [clientData, setClientData] = useState(null);
    const [shareTemplate, setShareTemplate] = useState(null);
    const [currencyOptions, setCurrencyOptions] = useState([]);
    const [savingsAccountOptions, setSavingsAccountOptions] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [submittedOn, setSubmittedOn] = useState('');
    const [applicationDate, setApplicationDate] = useState('');
    const [allowDividends, setAllowDividends] = useState(false);
    const [currency, setCurrency] = useState('');
    const [currentPrice, setCurrentPrice] = useState('');
    const [totalShares, setTotalShares] = useState('');
    const [defaultSavings, setDefaultSavings] = useState('');
    const [minFrequency, setMinFrequency] = useState('');
    const [minType, setMinType] = useState('');
    const [lockFrequency, setLockFrequency] = useState('');
    const [lockType, setLockType] = useState('');
    const [selectedCharge, setSelectedCharge] = useState('');
    const [selectedCharges, setSelectedCharges] = useState([]);
    const [chargeOptions, setChargeOptions] = useState([]);
    const [typeOptions, setTypeOptions] = useState([]);

    const stages = ['Details', 'Terms', 'Charges'];

    const fetchData = async () => {
        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
            };

            const [clientResponse, shareTemplateResponse] = await Promise.all([
                axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/clients/${clientId}`, { headers }),
                axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/accounts/share/template?clientId=${clientId}`, { headers }),
            ]);

            setClientData(clientResponse.data);
            setShareTemplate(shareTemplateResponse.data);

            setCurrencyOptions(shareTemplateResponse.data.currencyOptions || []);
            setSavingsAccountOptions(shareTemplateResponse.data.savingsAccounts || []);
            setChargeOptions(shareTemplateResponse.data.chargeOptions || []);
            setTypeOptions(shareTemplateResponse.data.minimumActivePeriodFrequencyTypeOptions || []);
        } catch (error) {
            console.error("Error fetching share account data:", error);
        } finally {
            stopLoading();
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleNext = () => {
        const currentIndex = stages.indexOf(currentStage);
        if (currentIndex < stages.length - 1) {
            setCurrentStage(stages[currentIndex + 1]);
        }
    };

    const handlePrevious = () => {
        const currentIndex = stages.indexOf(currentStage);
        if (currentIndex > 0) {
            setCurrentStage(stages[currentIndex - 1]);
        }
    };

    const handleAddCharge = () => {
        if (!selectedCharge) {
            alert('Please select a charge to add.');
            return;
        }
        const charge = chargeOptions.find((c) => c.id === selectedCharge);
        if (charge) {
            setSelectedCharges((prev) => [...prev, charge]);
        }
    };

    const handleRemoveCharge = (index) => {
        setSelectedCharges((prev) => prev.filter((_, i) => i !== index));
    };

    const renderStageTracker = () => {
        return (
            <div className="staged-form-stage-tracker">
                {stages.map((stage, index) => (
                    <div
                        key={stage}
                        className={`staged-form-stage ${
                            index === stages.indexOf(currentStage)
                                ? "staged-form-active"
                                : index < stages.indexOf(currentStage)
                                    ? "staged-form-completed"
                                    : "staged-form-unvisited"
                        }`}
                        onClick={() => {
                            if (index <= stages.indexOf(currentStage)) {
                                setCurrentStage(stage);
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
        switch (currentStage) {
            case 'Details':
                return (
                    <div className="stage-details">
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="productName">
                                    Product Name <span>*</span>
                                </label>
                                <select
                                    id="productName"
                                    value={selectedProduct || ''}
                                    onChange={(e) => setSelectedProduct(e.target.value)}
                                    className="staged-form-select"
                                    required
                                >
                                    <option value="">-- Select Product --</option>
                                    {shareTemplate?.productOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="submittedOn">
                                    Submitted On <span>*</span>
                                </label>
                                <DatePicker
                                    id="submittedOn"
                                    selected={submittedOn ? new Date(submittedOn) : null}
                                    onChange={(date) =>
                                        setSubmittedOn(date.toISOString().split('T')[0])
                                    }
                                    className="staged-form-input"
                                    placeholderText="Select Submission Date"
                                    dateFormat="MMMM d, yyyy"
                                    showMonthDropdown
                                    showYearDropdown
                                    dropdownMode="select"
                                    required
                                />
                            </div>
                        </div>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="externalId">External ID</label>
                                <input
                                    type="text"
                                    id="externalId"
                                    value={clientData?.externalId || ''}
                                    readOnly
                                    className="staged-form-input"
                                />
                            </div>
                        </div>
                    </div>
                );
            case 'Terms':
                return (
                    <div className="stage-terms">
                        {/* Currency and Current Price */}
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="currency">Currency</label>
                                <select
                                    id="currency"
                                    value={currency || ''}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="staged-form-select"
                                    required
                                >
                                    <option value="">-- Select Currency --</option>
                                    {currencyOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="currentPrice">Current Price</label>
                                <input
                                    type="text"
                                    id="currentPrice"
                                    value={currentPrice || ''}
                                    onChange={(e) => setCurrentPrice(e.target.value)}
                                    className="staged-form-input"
                                />
                            </div>
                        </div>

                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="totalShares">Total Number of Shares *</label>
                                <input
                                    type="number"
                                    id="totalShares"
                                    value={totalShares || ''}
                                    onChange={(e) => setTotalShares(e.target.value)}
                                    required
                                    className="staged-form-input"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="defaultSavings">Default Savings Account *</label>
                                <select
                                    id="defaultSavings"
                                    value={defaultSavings || ''}
                                    onChange={(e) => setDefaultSavings(e.target.value)}
                                    className="staged-form-select"
                                    required
                                >
                                    <option value="">-- Select Savings Account --</option>
                                    {savingsAccountOptions?.map((account) => (
                                        <option key={account.id} value={account.id}>
                                            {account.productName} - {account.accountNo}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="applicationDate">Application Date *</label>
                                <DatePicker
                                    id="applicationDate"
                                    selected={applicationDate ? new Date(applicationDate) : null}
                                    onChange={(date) => setApplicationDate(date.toISOString().split('T')[0])}
                                    className="staged-form-input"
                                    placeholderText="Select Application Date"
                                    dateFormat="MMMM d, yyyy"
                                    showPopperArrow={false}
                                    showMonthDropdown
                                    showYearDropdown
                                    dropdownMode="select"
                                    required
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="allowDividends">
                                    <input
                                        type="checkbox"
                                        id="allowDividends"
                                        checked={allowDividends || false}
                                        onChange={(e) => setAllowDividends(e.target.checked)}
                                    />{' '}
                                    Allow dividends for inactive clients
                                </label>
                            </div>
                        </div>

                        <h4>Minimum Active Period</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="minFrequency">Frequency</label>
                                <input
                                    type="number"
                                    id="minFrequency"
                                    value={minFrequency || ''}
                                    onChange={(e) => setMinFrequency(e.target.value)}
                                    className="staged-form-input"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="minType">Type</label>
                                <select
                                    id="minType"
                                    value={minType || ''}
                                    onChange={(e) => setMinType(e.target.value)}
                                    className="staged-form-select"
                                >
                                    <option value="">-- Select Type --</option>
                                    {typeOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <h4>Lock-in Period</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="lockFrequency">Frequency</label>
                                <input
                                    type="number"
                                    id="lockFrequency"
                                    value={lockFrequency || ''}
                                    onChange={(e) => setLockFrequency(e.target.value)}
                                    className="staged-form-input"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="lockType">Type</label>
                                <select
                                    id="lockType"
                                    value={lockType || ''}
                                    onChange={(e) => setLockType(e.target.value)}
                                    className="staged-form-select"
                                >
                                    <option value="">-- Select Type --</option>
                                    {typeOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                );
            case 'Charges':
                return (
                    <div className="stage-charges">
                        <div className="form-group">
                            <label htmlFor="chargeSelect">Charge</label>
                            <select
                                id="chargeSelect"
                                value={selectedCharge}
                                onChange={(e) => setSelectedCharge(e.target.value)}
                                className="form-control"
                            >
                                <option value="">-- Select a Charge --</option>
                                {chargeOptions?.map((charge) => (
                                    <option key={charge.id} value={charge.id}>
                                        {charge.name} - {charge.amount} {charge.currency?.code}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={handleAddCharge}
                                className="add-charge-button"
                            >
                                Add
                            </button>
                        </div>

                        <div className="added-charges-section">
                            <h4>Selected Charges</h4>
                            {selectedCharges?.length > 0 ? (
                                <table className="charges-table">
                                    <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Amount</th>
                                        <th>Currency</th>
                                        <th>Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {selectedCharges.map((charge, index) => (
                                        <tr key={index}>
                                            <td>{charge.name}</td>
                                            <td>{charge.amount}</td>
                                            <td>{charge.currency?.code}</td>
                                            <td>
                                                <button
                                                    onClick={() => handleRemoveCharge(index)}
                                                    className="remove-charge-button"
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p>No charges selected.</p>
                            )}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    if (!clientData || !shareTemplate) {
        return <div>Loading...</div>;
    }

    return (
        <div className="staged-form-add-client">
            {renderStageTracker()}
            <div className="staged-form-stage-content">
                {renderStageContent()}

                <div className="staged-form-stage-buttons">
                    <button
                        onClick={handlePrevious}
                        className="staged-form-button-previous"
                        disabled={currentStage === 'Details'}
                    >
                        Previous
                    </button>
                    <button
                        onClick={handleNext}
                        className="staged-form-button-next"
                        disabled={currentStage === 'Charges'}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareAccount;
