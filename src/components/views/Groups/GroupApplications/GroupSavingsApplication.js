import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../../../context/AuthContext';
import { useLoading } from '../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../config';
import DatePicker from "react-datepicker";
import {FaPencilAlt, FaTrash} from "react-icons/fa";

const GroupSavingsApplication = () => {
    const { groupId } = useParams();
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();

    const [currentStage, setCurrentStage] = useState('Details');
    const [productOptions, setProductOptions] = useState([]);
    const [savingsTemplate, setSavingsTemplate] = useState(null);
    const [chargeOptions, setChargeOptions] = useState([]);
    const [charges, setCharges] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [submittedOn, setSubmittedOn] = useState('');
    const [selectedCharge, setSelectedCharge] = useState('');


    const stages = ['Details', 'Terms', 'Charges', 'Preview'];

    useEffect(() => {
        const fetchSavingsTemplate = async () => {
            startLoading();
            try {
                const headers = {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                };
                const response = await axios.get(
                    `/fineract-provider/api/v1/savingsaccounts/template?groupId=${groupId}`,
                    { headers }
                );
                setProductOptions(response.data.productOptions || []);
            } catch (error) {
                console.error('Error fetching savings template:', error);
            } finally {
                stopLoading();
            }
        };

        fetchSavingsTemplate();
    }, [groupId, user]);

    const fetchProductDetails = async (productId) => {
        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
            };
            const response = await axios.get(
                `/fineract-provider/api/v1/savingsaccounts/template?groupId=${groupId}&productId=${productId}`,
                { headers }
            );
            setSavingsTemplate(response.data);
            setChargeOptions(response.data.chargeOptions || []);
        } catch (error) {
            console.error('Error fetching product details:', error);
        } finally {
            stopLoading();
        }
    };

    const handleAddCharge = () => {
        if (!selectedCharge) return;

        const chargeData = chargeOptions.find((charge) => charge.id === parseInt(selectedCharge));
        if (chargeData) {
            setCharges((prev) => [
                ...prev,
                {
                    ...chargeData,
                    amount: chargeData.amount || '',
                    date: '',
                    repaymentsEvery: '',
                },
            ]);

            // Remove the added charge from dropdown options
            setChargeOptions((prev) => prev.filter((charge) => charge.id !== parseInt(selectedCharge)));

            setSelectedCharge('');
        }
    };

    const handleChargeFieldUpdate = (index, field, value) => {
        setCharges((prev) =>
            prev.map((charge, i) =>
                i === index ? { ...charge, [field]: value } : charge
            )
        );
    };


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

    const isStageComplete = (stage) => {
        switch (stage) {
            case 'Details':
                return selectedProduct && submittedOn && savingsTemplate?.fieldOfficerId;
            case 'Terms':
                return (
                    savingsTemplate?.nominalAnnualInterestRate &&
                    savingsTemplate?.interestCompoundingPeriodType &&
                    savingsTemplate?.interestPostingPeriodType &&
                    savingsTemplate?.interestCalculationType &&
                    savingsTemplate?.interestCalculationDaysInYearType
                );
            case 'Charges':
                return charges.length > 0;
            case 'Preview':
                return true;
            default:
                return false;
        }
    };

    const renderStageTracker = () => {
        return (
            <div className="staged-form-stage-tracker">
                {stages.map((stage) => (
                    <div
                        key={stage}
                        className={`staged-form-stage ${
                            stage === currentStage
                                ? 'staged-form-active'
                                : isStageComplete(stage)
                                    ? 'staged-form-completed'
                                    : 'staged-form-unvisited'
                        }`}
                        onClick={() => isStageComplete(stage) && setCurrentStage(stage)}
                    >
                        <span className="staged-form-stage-circle">{stages.indexOf(stage) + 1}</span>
                        <span className="staged-form-stage-label">{stage}</span>
                    </div>
                ))}
            </div>
        );
    };

    const renderDetailsStage = () => (
        <div className="stage-details">
            {/* Product Name */}
            <div className="staged-form-row">
                <div className="staged-form-field">
                    <label htmlFor="product">Product Name <span>*</span></label>
                    <select
                        id="product"
                        value={selectedProduct}
                        className="staged-form-select"
                        onChange={(e) => {
                            setSelectedProduct(e.target.value);
                            fetchProductDetails(e.target.value);
                        }}
                        required
                    >
                        <option value="">Select Product</option>
                        {productOptions.map((product) => (
                            <option key={product.id} value={product.id}>
                                {product.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Submitted On */}
                {selectedProduct && (
                    <div className="staged-form-field">
                        <label htmlFor="submittedOn">Submitted On <span>*</span></label>
                        <DatePicker
                            id="submittedOn"
                            selected={submittedOn ? new Date(submittedOn) : null}
                            onChange={(date) => setSubmittedOn(date.toISOString().split('T')[0])}
                            minDate={new Date()}
                            dateFormat="dd MMMM yyyy"
                            className="staged-form-input"
                            placeholderText="Select submission date"
                            required
                        />
                    </div>
                )}
            </div>
            <div className="staged-form-row">
                {savingsTemplate?.fieldOfficerOptions && selectedProduct && (
                    <div className="staged-form-field">
                        <label htmlFor="fieldOfficer">Field Officer</label>
                        <select
                            id="fieldOfficer"
                            className="staged-form-select"
                            onChange={(e) => setSavingsTemplate((prev) => ({ ...prev, fieldOfficerId: e.target.value }))}
                            value={savingsTemplate.fieldOfficerId || ''}
                        >
                            <option value="">Select Field Officer</option>
                            {savingsTemplate.fieldOfficerOptions.map((officer) => (
                                <option key={officer.id} value={officer.id}>
                                    {officer.displayName}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {selectedProduct && (
                    <div className="staged-form-field">
                        <label htmlFor="externalId">External ID</label>
                        <input
                            id="externalId"
                            type="text"
                            className="staged-form-input"
                            value={savingsTemplate?.externalId || ''}
                            onChange={(e) =>
                                setSavingsTemplate((prev) => ({
                                    ...prev,
                                    externalId: e.target.value,
                                }))
                            }
                            placeholder="Enter External ID"
                        />
                    </div>
                )}
            </div>
        </div>
    );

    const renderTermsStage = () => (
        <div className="stage-terms">
            {/* Currency and Decimal Places */}
            <div className="staged-form-row">
                <div className="staged-form-field">
                    <label htmlFor="currency">Currency</label>
                    <input
                        type="text"
                        id="currency"
                        value={savingsTemplate?.currency?.name || ''}
                        readOnly
                        className="staged-form-input"
                    />
                </div>
                <div className="staged-form-field">
                    <label htmlFor="decimalPlaces">Decimal Places</label>
                    <input
                        type="text"
                        id="decimalPlaces"
                        value={savingsTemplate?.currency?.decimalPlaces ?? ''}
                        readOnly
                        className="staged-form-input"
                    />
                </div>
            </div>

            {/* Nominal Annual Interest and Interest Compounding Period */}
            <div className="staged-form-row">
                <div className="staged-form-field">
                    <label htmlFor="nominalAnnualInterest">Nominal Annual Interest <span>*</span></label>
                    <input
                        type="number"
                        id="nominalAnnualInterest"
                        value={savingsTemplate?.nominalAnnualInterestRate || ''}
                        onChange={(e) =>
                            setSavingsTemplate((prev) => ({
                                ...prev,
                                nominalAnnualInterestRate: e.target.value,
                            }))
                        }
                        required
                        className="staged-form-input"
                    />
                </div>
                <div className="staged-form-field">
                    <label htmlFor="interestCompoundingPeriod">Interest Compounding Period <span>*</span></label>
                    <select
                        id="interestCompoundingPeriod"
                        value={savingsTemplate?.interestCompoundingPeriodType?.id || ''}
                        onChange={(e) =>
                            setSavingsTemplate((prev) => ({
                                ...prev,
                                interestCompoundingPeriodType: e.target.value,
                            }))
                        }
                        required
                        className="staged-form-select"
                    >
                        <option value="">Select Period</option>
                        {savingsTemplate?.interestCompoundingPeriodTypeOptions?.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.value}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Interest Posting Period and Interest Calculated Using */}
            <div className="staged-form-row">
                <div className="staged-form-field">
                    <label htmlFor="interestPostingPeriod">Interest Posting Period <span>*</span></label>
                    <select
                        id="interestPostingPeriod"
                        value={savingsTemplate?.interestPostingPeriodType?.id || ''}
                        onChange={(e) =>
                            setSavingsTemplate((prev) => ({
                                ...prev,
                                interestPostingPeriodType: e.target.value,
                            }))
                        }
                        required
                        className="staged-form-select"
                    >
                        <option value="">Select Period</option>
                        {savingsTemplate?.interestPostingPeriodTypeOptions?.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.value}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="staged-form-field">
                    <label htmlFor="interestCalculatedUsing">Interest Calculated Using <span>*</span></label>
                    <select
                        id="interestCalculatedUsing"
                        value={savingsTemplate?.interestCalculationType?.id || ''}
                        onChange={(e) =>
                            setSavingsTemplate((prev) => ({
                                ...prev,
                                interestCalculationType: e.target.value,
                            }))
                        }
                        required
                        className="staged-form-select"
                    >
                        <option value="">Select Calculation</option>
                        {savingsTemplate?.interestCalculationTypeOptions?.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.value}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Days in Year and Minimum Opening Balance */}
            <div className="staged-form-row">
                <div className="staged-form-field">
                    <label htmlFor="daysInYear">Days in Year <span>*</span></label>
                    <select
                        id="daysInYear"
                        value={savingsTemplate?.interestCalculationDaysInYearType?.id || ''}
                        onChange={(e) =>
                            setSavingsTemplate((prev) => ({
                                ...prev,
                                interestCalculationDaysInYearType: e.target.value,
                            }))
                        }
                        required
                        className="staged-form-select"
                    >
                        <option value="">Select Days</option>
                        {savingsTemplate?.interestCalculationDaysInYearTypeOptions?.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.value}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="staged-form-field">
                    <label htmlFor="minimumOpeningBalance">Minimum Opening Balance</label>
                    <input
                        type="number"
                        id="minimumOpeningBalance"
                        value={savingsTemplate?.minRequiredOpeningBalance || ''}
                        onChange={(e) =>
                            setSavingsTemplate((prev) => ({
                                ...prev,
                                minRequiredOpeningBalance: e.target.value,
                            }))
                        }
                        className="staged-form-input"
                    />
                </div>
            </div>

            {/* Apply Withdrawal Fee for Transfers */}
            <div className="staged-form-row">
                <div className="staged-form-field">
                    <label htmlFor="applyWithdrawalFee">
                        <input
                            type="checkbox"
                            id="applyWithdrawalFee"
                            checked={savingsTemplate?.withdrawalFeeForTransfers || false}
                            onChange={(e) =>
                                setSavingsTemplate((prev) => ({
                                    ...prev,
                                    withdrawalFeeForTransfers: e.target.checked,
                                }))
                            }
                        />{' '}
                        Apply Withdrawal Fee for Transfers
                    </label>
                </div>
            </div>

            {/* Lock-in Period Section */}
            <h4>Lock-in Period</h4>
            <div className="staged-form-row">
                <div className="staged-form-field">
                    <label htmlFor="lockInFrequency">Frequency</label>
                    <input
                        type="number"
                        id="lockInFrequency"
                        value={savingsTemplate?.lockinPeriodFrequency || ''}
                        onChange={(e) =>
                            setSavingsTemplate((prev) => ({
                                ...prev,
                                lockinPeriodFrequency: e.target.value,
                            }))
                        }
                        className="staged-form-input"
                    />
                </div>
                <div className="staged-form-field">
                    <label htmlFor="lockInFrequencyType">Type</label>
                    <select
                        id="lockInFrequencyType"
                        value={savingsTemplate?.lockinPeriodFrequencyType || ''}
                        onChange={(e) =>
                            setSavingsTemplate((prev) => ({
                                ...prev,
                                lockinPeriodFrequencyType: e.target.value,
                            }))
                        }
                        className="staged-form-select"
                    >
                        <option value="">Select Type</option>
                        {savingsTemplate?.lockinPeriodFrequencyTypeOptions?.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.value}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Overdraft Section */}
            <h4>Overdraft</h4>
            <div className="staged-form-row">
                <div className="staged-form-field">
                    <label htmlFor="allowOverdraft">
                        <input
                            type="checkbox"
                            id="allowOverdraft"
                            checked={savingsTemplate?.allowOverdraft || false}
                            onChange={(e) =>
                                setSavingsTemplate((prev) => ({
                                    ...prev,
                                    allowOverdraft: e.target.checked,
                                }))
                            }
                        />{' '}
                        Is Overdraft Allowed
                    </label>
                </div>
            </div>
            {savingsTemplate?.allowOverdraft && (
                <div className="staged-form-row">
                    <div className="staged-form-field">
                        <label htmlFor="minimumOverdraftRequired">Minimum Overdraft Required for Interest Calculation</label>
                        <input
                            type="number"
                            id="minimumOverdraftRequired"
                            value={savingsTemplate?.overdraftLimit || ''}
                            onChange={(e) =>
                                setSavingsTemplate((prev) => ({
                                    ...prev,
                                    overdraftLimit: e.target.value,
                                }))
                            }
                            className="staged-form-input"
                        />
                    </div>
                    <div className="staged-form-field">
                        <label htmlFor="nominalOverdraftInterest">Nominal Annual Interest for Overdraft</label>
                        <input
                            type="number"
                            id="nominalOverdraftInterest"
                            value={savingsTemplate?.nominalAnnualInterestRateOverdraft || ''}
                            onChange={(e) =>
                                setSavingsTemplate((prev) => ({
                                    ...prev,
                                    nominalAnnualInterestRateOverdraft: e.target.value,
                                }))
                            }
                            className="staged-form-input"
                        />
                    </div>
                    <div className="staged-form-field">
                        <label htmlFor="maxOverdraftAmount">Maximum Overdraft Amount Limit</label>
                        <input
                            type="number"
                            id="maxOverdraftAmount"
                            value={savingsTemplate?.maxOverdraftAmountLimit || ''}
                            onChange={(e) =>
                                setSavingsTemplate((prev) => ({
                                    ...prev,
                                    maxOverdraftAmountLimit: e.target.value,
                                }))
                            }
                            className="staged-form-input"
                        />
                    </div>
                </div>
            )}

            {/* Enforce Minimum Balance */}
            <div className="staged-form-row">
                <div className="staged-form-field">
                    <label htmlFor="enforceMinimumBalance">
                        <input
                            type="checkbox"
                            id="enforceMinimumBalance"
                            checked={savingsTemplate?.enforceMinRequiredBalance || false}
                            onChange={(e) =>
                                setSavingsTemplate((prev) => ({
                                    ...prev,
                                    enforceMinRequiredBalance: e.target.checked,
                                }))
                            }
                        />{' '}
                        Enforce Minimum Balance
                    </label>
                </div>
                <div className="staged-form-field">
                    <label htmlFor="minimumBalance">Minimum Balance</label>
                    <input
                        type="number"
                        id="minimumBalance"
                        value={savingsTemplate?.minRequiredBalance || ''}
                        onChange={(e) =>
                            setSavingsTemplate((prev) => ({
                                ...prev,
                                minRequiredBalance: e.target.value,
                            }))
                        }
                        className="staged-form-input"
                    />
                </div>
            </div>
        </div>
    );

    const renderChargesStage = () => {
        const handleEditToggle = (index, field) => {
            setCharges((prev) =>
                prev.map((charge, i) =>
                    i === index
                        ? { ...charge, [`isEditing_${field}`]: !charge[`isEditing_${field}`] }
                        : charge
                )
            );
        };

        const handleRemoveCharge = (index) => {
            const removedCharge = charges[index];
            setCharges((prev) => prev.filter((_, i) => i !== index));
            setChargeOptions((prev) => [...prev, removedCharge]); // Re-add charge to dropdown
        };

        return (
            <div className="stage-charges">
                {/* Charge Selection */}
                <div className="staged-form-row">
                    <div className="staged-form-field">
                        <label htmlFor="chargeSelect">Charge</label>
                        <select
                            id="chargeSelect"
                            value={selectedCharge}
                            onChange={(e) => setSelectedCharge(e.target.value)}
                            className="staged-form-select"
                        >
                            <option value="">-- Select a Charge --</option>
                            {chargeOptions.map((charge) => (
                                <option key={charge.id} value={charge.id}>
                                    {charge.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={handleAddCharge}
                        className="staged-form-button-add"
                        disabled={!selectedCharge}
                    >
                        Add
                    </button>
                </div>

                {/* Selected Charges Table */}
                <div className="charges-table-container">
                    <table className="charges-table">
                        <thead>
                        <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Calculation</th>
                            <th>Amount</th>
                            <th>Collected On</th>
                            <th>Date</th>
                            <th>Repayments Every</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {charges.length > 0 ? (
                            charges.map((charge, index) => (
                                <tr key={index}>
                                    <td>{charge.name}</td>
                                    <td>{charge.chargeTimeType?.value || "N/A"}</td>
                                    <td>{charge.chargeCalculationType?.value || "N/A"}</td>
                                    <td>
                                        {charge.isEditing_amount ? (
                                            <>
                                                <input
                                                    type="number"
                                                    value={charge.amount}
                                                    onChange={(e) =>
                                                        handleChargeFieldUpdate(index, "amount", e.target.value)
                                                    }
                                                    className="staged-form-input"
                                                />
                                                <button
                                                    className="staged-form-save-button"
                                                    onClick={() => handleEditToggle(index, "amount")}
                                                >
                                                    Save
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                {charge.amount || "N/A"}{" "}
                                                <FaPencilAlt
                                                    onClick={() => handleEditToggle(index, "amount")}
                                                />
                                            </>
                                        )}
                                    </td>
                                    <td>{charge.chargePaymentMode?.value || "N/A"}</td>
                                    <td>
                                        {charge.isEditing_date ? (
                                            <>
                                                <input
                                                    type="date"
                                                    value={charge.date}
                                                    onChange={(e) =>
                                                        handleChargeFieldUpdate(index, "date", e.target.value)
                                                    }
                                                    className="staged-form-input"
                                                />
                                                <button
                                                    className="staged-form-save-button"
                                                    onClick={() => handleEditToggle(index, "date")}
                                                >
                                                    Save
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                {charge.date || "N/A"}{" "}
                                                <FaPencilAlt
                                                    onClick={() => handleEditToggle(index, "date")}
                                                />
                                            </>
                                        )}
                                    </td>
                                    <td>
                                        {charge.isEditing_repaymentsEvery ? (
                                            <>
                                                <input
                                                    type="text"
                                                    value={charge.repaymentsEvery}
                                                    onChange={(e) =>
                                                        handleChargeFieldUpdate(index, "repaymentsEvery", e.target.value)
                                                    }
                                                    className="staged-form-input"
                                                />
                                                <button
                                                    className="staged-form-save-button"
                                                    onClick={() => handleEditToggle(index, "repaymentsEvery")}
                                                >
                                                    Save
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                {charge.repaymentsEvery || "N/A"}{" "}
                                                <FaPencilAlt
                                                    onClick={() => handleEditToggle(index, "repaymentsEvery")}
                                                />
                                            </>
                                        )}
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => handleRemoveCharge(index)}
                                            className="staged-form-button-delete"
                                        >
                                            <FaTrash/>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                            <td colSpan="8" style={{ textAlign: "center" }}>
                                    No charges selected
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderPreviewSection = () => {
        const stageData = [
            {
                title: "Details",
                data: {
                    "Product Name": selectedProduct ? productOptions.find((product) => product.id === parseInt(selectedProduct))?.name || "N/A" : "N/A",
                    "Submitted On": submittedOn || "N/A",
                    "Field Officer": savingsTemplate?.fieldOfficerOptions?.find((officer) => officer.id === savingsTemplate?.fieldOfficerId)?.displayName || "N/A",
                    "External ID": savingsTemplate?.externalId || "N/A",
                },
            },
            {
                title: "Terms",
                data: {
                    Currency: savingsTemplate?.currency?.name || "N/A",
                    "Decimal Places": savingsTemplate?.currency?.decimalPlaces || "N/A",
                    "Nominal Annual Interest": savingsTemplate?.nominalAnnualInterestRate || "N/A",
                    "Interest Compounding Period":
                        savingsTemplate?.interestCompoundingPeriodTypeOptions?.find(
                            (option) => option.id === savingsTemplate?.interestCompoundingPeriodType
                        )?.value || "N/A",
                    "Interest Posting Period":
                        savingsTemplate?.interestPostingPeriodTypeOptions?.find(
                            (option) => option.id === savingsTemplate?.interestPostingPeriodType
                        )?.value || "N/A",
                    "Interest Calculated Using":
                        savingsTemplate?.interestCalculationTypeOptions?.find(
                            (option) => option.id === savingsTemplate?.interestCalculationType
                        )?.value || "N/A",
                    "Days in Year":
                        savingsTemplate?.interestCalculationDaysInYearTypeOptions?.find(
                            (option) => option.id === savingsTemplate?.interestCalculationDaysInYearType
                        )?.value || "N/A",
                    "Minimum Opening Balance": savingsTemplate?.minRequiredOpeningBalance || "N/A",
                    "Apply Withdrawal Fee for Transfers": savingsTemplate?.withdrawalFeeForTransfers ? "Yes" : "No",
                    "Lock-in Period Frequency": savingsTemplate?.lockinPeriodFrequency || "N/A",
                    "Lock-in Period Type":
                        savingsTemplate?.lockinPeriodFrequencyTypeOptions?.find(
                            (option) => option.id === savingsTemplate?.lockinPeriodFrequencyType
                        )?.value || "N/A",
                    "Overdraft Allowed": savingsTemplate?.allowOverdraft ? "Yes" : "No",
                    "Minimum Overdraft Required for Interest Calculation": savingsTemplate?.overdraftLimit || "N/A",
                    "Nominal Annual Interest for Overdraft": savingsTemplate?.nominalAnnualInterestRateOverdraft || "N/A",
                    "Maximum Overdraft Amount Limit": savingsTemplate?.maxOverdraftAmountLimit || "N/A",
                    "Enforce Minimum Balance": savingsTemplate?.enforceMinRequiredBalance ? "Yes" : "No",
                    "Minimum Balance": savingsTemplate?.minRequiredBalance || "N/A",
                },
            },
            {
                title: "Charges",
                data: charges.map((charge) => ({
                    Name: charge.name || "N/A",
                    Type: charge.type || "N/A",
                    Amount: charge.amount || "N/A",
                    "Collected On": charge.collectedOn || "N/A",
                    Date: charge.date || "N/A",
                    "Repayments Every": charge.repaymentsEvery || "N/A",
                })),
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
                                onClick={() => setCurrentStage(title)}
                            >
                                Edit
                            </button>
                        </div>
                        {data && Object.keys(data).length > 0 ? (
                            Array.isArray(data) ? (
                                <table className="staged-form-preview-table">
                                    <thead>
                                    <tr>
                                        {Object.keys(data[0]).map((key) => (
                                            <th key={key}>{key}</th>
                                        ))}
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {data.map((row, rowIndex) => (
                                        <tr key={rowIndex}>
                                            {Object.values(row).map((value, colIndex) => (
                                                <td key={colIndex}>{value || "N/A"}</td>
                                            ))}
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            ) : (
                                <table className="staged-form-preview-table">
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
                                            <td>{value}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            )
                        ) : (
                            <p className="no-data-message">No data available for this section.</p>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const renderStageContent = () => {
        switch (currentStage) {
            case 'Details':
                return renderDetailsStage();
            case 'Terms':
                return renderTermsStage();
            case 'Charges':
                return renderChargesStage();
            case 'Preview':
                return renderPreviewSection();
            default:
                return null;
        }
    };

    const handleSubmit = async () => {
        try {
            startLoading();
            const submissionData = {
                productName: selectedProduct ? productOptions.find((product) => product.id === parseInt(selectedProduct))?.name : null,
                submittedOn: submittedOn || null,
                fieldOfficerId: savingsTemplate?.fieldOfficerId || null,
                externalId: savingsTemplate?.externalId || null,
                currency: savingsTemplate?.currency?.name || null,
                decimalPlaces: savingsTemplate?.currency?.decimalPlaces || null,
                nominalAnnualInterest: savingsTemplate?.nominalAnnualInterestRate || null,
                interestCompoundingPeriod: savingsTemplate?.interestCompoundingPeriodType || null,
                interestPostingPeriod: savingsTemplate?.interestPostingPeriodType || null,
                interestCalculatedUsing: savingsTemplate?.interestCalculationType || null,
                daysInYear: savingsTemplate?.interestCalculationDaysInYearType || null,
                minimumOpeningBalance: savingsTemplate?.minRequiredOpeningBalance || null,
                applyWithdrawalFeeForTransfers: savingsTemplate?.withdrawalFeeForTransfers || false,
                lockInFrequency: savingsTemplate?.lockinPeriodFrequency || null,
                lockInType: savingsTemplate?.lockinPeriodFrequencyType || null,
                overdraftAllowed: savingsTemplate?.allowOverdraft || false,
                minimumOverdraftRequired: savingsTemplate?.overdraftLimit || null,
                nominalAnnualOverdraftInterest: savingsTemplate?.nominalAnnualInterestRateOverdraft || null,
                maxOverdraftAmountLimit: savingsTemplate?.maxOverdraftAmountLimit || null,
                enforceMinimumBalance: savingsTemplate?.enforceMinRequiredBalance || false,
                minimumBalance: savingsTemplate?.minRequiredBalance || null,
                charges: charges.map((charge) => ({
                    id: charge.id,
                    amount: charge.amount || null,
                    date: charge.date || null,
                    repaymentsEvery: charge.repaymentsEvery || null,
                })),
            };

            console.log("Data ready for submission: ", submissionData);

            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
            };

            await axios.post(`/fineract-provider/api/v1/savingsaccounts`, submissionData, { headers });

            alert("Form submitted successfully!");
        } catch (error) {
            console.error("Error submitting the form: ", error);
            alert("Error occurred while submitting the form. Please try again.");
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="staged-form-create-loan-product">
            {renderStageTracker()}
            <div className="staged-form-stage-content">
                {renderStageContent()}
                <div className="staged-form-stage-buttons">
                    <button
                        onClick={handlePrevious}
                        disabled={currentStage === 'Details'}
                        className="staged-form-button-previous"
                    >
                        Previous
                    </button>
                    {currentStage === 'Preview' ? (
                        <button
                            onClick={handleSubmit}
                            className="staged-form-button-next"
                        >
                            Submit
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            disabled={!isStageComplete(currentStage) || stages.indexOf(currentStage) === stages.length - 1}
                            className="staged-form-button-next"
                        >
                            Next
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GroupSavingsApplication;
