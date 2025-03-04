import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {useLocation, useNavigate, useParams} from 'react-router-dom';
import { AuthContext } from '../../../../context/AuthContext';
import { useLoading } from '../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../config';
import DatePicker from 'react-datepicker';
import {FaTrash} from "react-icons/fa";
import {NotificationContext} from "../../../../context/NotificationContext";

const SavingsAccount = () => {
    const { clientId } = useParams();
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const navigate = useNavigate();
    const location = useLocation();
    const { isModification, accountId } = location.state || {};

    const [isModifying, setIsModifying] = useState(isModification || false);
    const [account, setAccount] = useState(accountId || null);
    const stages = ["Details", "Terms", "Charges", "Preview"];
    const [currentStage, setCurrentStage] = useState("Details");
    const [completedStages, setCompletedStages] = useState(new Set());
    const [clientData, setClientData] = useState(null);
    const [savingsTemplate, setSavingsTemplate] = useState(null);
    const [chargeOptions, setChargeOptions] = useState([]);
    const [addedCharges, setAddedCharges] = useState([]);
    const [selectedCharge, setSelectedCharge] = useState("");
    const [submittedOn, setSubmittedOn] = useState("");
    const [nominalAnnualInterestRate, setNominalAnnualInterestRate] = useState(0);
    const [interestCompoundingPeriod, setInterestCompoundingPeriod] = useState("");
    const [interestPostingPeriod, setInterestPostingPeriod] = useState("");
    const [interestCalculatedUsing, setInterestCalculatedUsing] = useState("");
    const [daysInYear, setDaysInYear] = useState("");
    const [minimumOpeningBalance, setMinimumOpeningBalance] = useState("");
    const [applyWithdrawalFee, setApplyWithdrawalFee] = useState(false);
    const [lockInFrequency, setLockInFrequency] = useState("");
    const [lockInType, setLockInType] = useState("");
    const [isOverdraftAllowed, setIsOverdraftAllowed] = useState(false);
    const [minimumOverdraftForInterestCalculation, setMinimumOverdraftForInterestCalculation] = useState('');
    const [nominalAnnualInterestForOverdraft, setNominalAnnualInterestForOverdraft] = useState('');
    const [maximumOverdraftAmountLimit, setMaximumOverdraftAmountLimit] = useState('');
    const [enforceMinimumBalance, setEnforceMinimumBalance] = useState(false);
    const [minimumBalance, setMinimumBalance] = useState("");
    const [fieldOfficer, setFieldOfficer] = useState("");
    const [selectedProduct, setSelectedProduct] = useState("");
    const [externalId, setExternalId] = useState("");
    const [modifyData, setModifyData] = useState(null);
    const [currency, setCurrency] = useState('');
    const [decimalPlaces, setDecimalPlaces] = useState('');
    const [officerId, setOfficerId] = useState(null);

    const fetchData = async () => {
        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
            };

            const [
                clientResponse,
                savingsTemplateResponse,
            ] = await Promise.all([
                axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/clients/${clientId}`, { headers }),
                axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/template?clientId=${clientId}`, { headers }),
            ]);

            setClientData(clientResponse.data);
            setOfficerId(clientResponse.data?.staffId);
            setSavingsTemplate(savingsTemplateResponse.data);
        } catch (error) {
            console.error('Error fetching savings account data:', error);
        } finally {
            stopLoading();
        }
    };

    useEffect(() => {
        if (officerId && !fieldOfficer) {
            setFieldOfficer(prev => (officerId));
        }
    }, [officerId]);

    useEffect(() => {
        if (isModifying) {
            const fetchModificationData = async () => {
                startLoading();
                try {
                    const headers = {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    };

                    const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/${account}?template=true&associations=charges`, { headers });
                    setModifyData(response.data);
                } catch (error) {
                    console.error('Error fetching modification data', error);
                }
            };

            fetchModificationData();
        }
    }, [isModifying]);

    useEffect(() => {
        if (modifyData) {
            setExternalId(modifyData?.externalId);
            setSelectedProduct(modifyData?.savingsProductId);
            setDateForSubmittedOn(modifyData?.timeline?.submittedOnDate);
            setFieldOfficer(modifyData?.fieldOfficerId);
            setCurrency(`${modifyData?.currency?.name || ''} - ${modifyData?.currency?.code || ''}`);
            setDecimalPlaces(modifyData?.currency?.decimalPlaces || '');
            setNominalAnnualInterestRate(modifyData?.nominalAnnualInterestRate || '');
            setInterestCompoundingPeriod(modifyData?.interestCompoundingPeriodType?.id || '');
            setInterestPostingPeriod(modifyData?.interestPostingPeriodType?.id || '');
            setInterestCalculatedUsing(modifyData?.interestCalculationType?.id || '');
            setDaysInYear(modifyData?.interestCalculationDaysInYearType?.id || '');
            setMinimumOpeningBalance(modifyData?.minRequiredOpeningBalance || '');
            setApplyWithdrawalFee(modifyData?.withdrawalFeeForTransfers || '');
            setLockInFrequency(modifyData?.lockinPeriodFrequency || '');
            setLockInType(modifyData?.lockinPeriodFrequencyType?.id || '');
            setIsOverdraftAllowed(modifyData?.allowOverdraft || '');
            setMinimumOverdraftForInterestCalculation(modifyData?.minOverdraftForInterestCalculation || '');
            setNominalAnnualInterestForOverdraft(modifyData?.nominalAnnualInterestRateOverdraft || '');
            setMaximumOverdraftAmountLimit(modifyData?.overdraftLimit || '');
            setEnforceMinimumBalance(modifyData?.enforceMinRequiredBalance || '');
            setMinimumBalance(modifyData?.minRequiredBalance || '');
        }
    }, [modifyData]);

    const setDateForSubmittedOn = (submittedOnDate) => {
        if (submittedOnDate && submittedOnDate.length === 3) {
            const [year, month, day] = submittedOnDate;
            setSubmittedOn(new Date(year, month - 1, day));
        } else {
            setSubmittedOn("");
        }
    };

    useEffect(() => {
        const fetchSavingsTemplateData = async () => {
            if (!selectedProduct) return;
            startLoading();

            try {
                const headers = {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                };

                const response = await axios.get(
                    `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/template?clientId=${clientId}&productId=${selectedProduct}`,
                    { headers }
                );

                setSavingsTemplate(response.data);
                setChargeOptions(response.data?.chargeOptions);
            } catch (error) {
                console.error("Error fetching savings template data:", error);
            } finally {
                stopLoading();
            }
        };

        fetchSavingsTemplateData();
    }, [selectedProduct]);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (savingsTemplate) {
            setInterestCompoundingPeriod(savingsTemplate?.interestCompoundingPeriodType?.id || '');
            setInterestPostingPeriod(savingsTemplate?.interestPostingPeriodType?.id || '');
            setInterestCalculatedUsing(savingsTemplate?.interestCalculationType?.id || '');
            setDaysInYear(savingsTemplate?.interestCalculationDaysInYearType?.id || '');
            setCurrency(`${savingsTemplate?.currency?.name || ''} - ${savingsTemplate?.currency?.code || ''}`);
            setDecimalPlaces(savingsTemplate?.currency?.decimalPlaces || '');
        }
    }, [savingsTemplate]);

    const handleNext = () => {
        const currentIndex = stages.indexOf(currentStage);
        if (currentIndex < stages.length - 1) {
            setCompletedStages((prev) => new Set([...prev, currentStage]));
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
        const chargeData = chargeOptions.find(
            (charge) => charge.id === parseInt(selectedCharge, 10)
        );
        if (chargeData) {
            setAddedCharges((prev) => [
                ...prev,
                { ...chargeData, dueDate: '' },
            ]);
            setChargeOptions((prev) =>
                prev.filter((charge) => charge.id !== chargeData.id)
            );
            setSelectedCharge('');
        } else {
            showNotification('Please select a valid charge to add!', 'info');
        }
    };

    const handleRemoveCharge = (index) => {
        const removedCharge = addedCharges[index];
        setAddedCharges((prev) => prev.filter((_, i) => i !== index));
        setChargeOptions((prev) => [...prev, removedCharge]);
    };

    const renderStageContent = () => {
        switch (currentStage) {
            case 'Details':
                return (
                    <div className="stage-details">
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="productName">Product Name <span>*</span></label>
                                <select
                                    id="productName"
                                    value={selectedProduct}
                                    onChange={(e) => {
                                        setSelectedProduct(e.target.value);
                                    }}
                                    className="staged-form-select"
                                    required
                                >
                                    <option value="">-- Select Product --</option>
                                    {savingsTemplate?.productOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {selectedProduct && (
                                <div className="staged-form-field">
                                    <label htmlFor="submittedOn">Submitted On <span>*</span></label>
                                    <DatePicker
                                        id="submittedOn"
                                        selected={submittedOn ? new Date(submittedOn) : null}
                                        onChange={(date) => setSubmittedOn(date ? new Date(date) : "")}
                                        className="staged-form-input"
                                        placeholderText="Select Submission Date"
                                        dateFormat="MMMM d, yyyy"
                                        showMonthDropdown
                                        showYearDropdown
                                        dropdownMode="select"
                                        showPopperArrow={false}
                                        maxDate={new Date()}
                                    />
                                </div>
                            )}
                        </div>

                        {selectedProduct && (
                            <>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="fieldOfficer">Field Officer</label>
                                        <select
                                            id="fieldOfficer"
                                            className="staged-form-select"
                                            value={fieldOfficer || ''}
                                            onChange={(e) => setFieldOfficer(e.target.value)}
                                        >
                                            <option value="">-- Select Field Officer --</option>
                                            {savingsTemplate?.fieldOfficerOptions?.map((officer) => (
                                                <option key={officer.id} value={officer.id}>
                                                    {officer.displayName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="externalId">External ID</label>
                                        <input
                                            type="text"
                                            id="externalId"
                                            value={externalId}
                                            onChange={(e) => setExternalId(e.target.value)}
                                            className="staged-form-input"
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                );
            case 'Terms':
                return (
                    <div className="stage-terms">
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="currency">Currency</label>
                                <input
                                    type="text"
                                    id="currency"
                                    value={currency}
                                    readOnly
                                    className="staged-form-input muted"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="decimalPlaces">Decimal Places</label>
                                <input
                                    type="number"
                                    id="decimalPlaces"
                                    value={decimalPlaces}
                                    readOnly
                                    className="staged-form-input muted"
                                />
                            </div>
                        </div>

                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="nominalAnnualInterestRate">Nominal Annual Interest Rate (%) <span>*</span></label>
                                <input
                                    type="number"
                                    id="nominalAnnualInterestRate"
                                    value={nominalAnnualInterestRate}
                                    onChange={(e) => setNominalAnnualInterestRate(e.target.value)}
                                    required
                                    min={0}
                                    className="staged-form-input"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="interestCompoundingPeriod">Interest Compounding Period <span>*</span></label>
                                <select
                                    id="interestCompoundingPeriod"
                                    value={interestCompoundingPeriod}
                                    onChange={(e) => setInterestCompoundingPeriod(e.target.value)}
                                    required
                                    className="staged-form-select"
                                >
                                    {savingsTemplate?.interestCompoundingPeriodTypeOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="interestPostingPeriod">Interest Posting Period <span>*</span></label>
                                <select
                                    id="interestPostingPeriod"
                                    value={interestPostingPeriod}
                                    onChange={(e) => setInterestPostingPeriod(e.target.value)}
                                    required
                                    className="staged-form-select"
                                >
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
                                    value={interestCalculatedUsing}
                                    onChange={(e) => setInterestCalculatedUsing(e.target.value)}
                                    required
                                    className="staged-form-select"
                                >
                                    {savingsTemplate?.interestCalculationTypeOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="daysInYear">Days in Year <span>*</span></label>
                                <select
                                    id="daysInYear"
                                    value={daysInYear}
                                    onChange={(e) => setDaysInYear(e.target.value)}
                                    required
                                    className="staged-form-select"
                                >
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
                                    value={minimumOpeningBalance}
                                    onChange={(e) => setMinimumOpeningBalance(e.target.value)}
                                    className="staged-form-input"
                                />
                            </div>
                        </div>

                        <div className="staged-form-row">
                            <label htmlFor="applyWithdrawalFee">
                                <input
                                    type="checkbox"
                                    id="applyWithdrawalFee"
                                    checked={applyWithdrawalFee}
                                    onChange={(e) => setApplyWithdrawalFee(e.target.checked)}
                                />{' '}Apply Withdrawal Fee for Transfers
                            </label>
                        </div>

                        <h4>Lock-in Period</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="lockInFrequency">Frequency</label>
                                <input
                                    type="number"
                                    id="lockInFrequency"
                                    value={lockInFrequency}
                                    onChange={(e) => setLockInFrequency(e.target.value)}
                                    className="staged-form-input"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="lockInType">Type</label>
                                <select
                                    id="lockInType"
                                    value={lockInType}
                                    onChange={(e) => setLockInType(e.target.value)}
                                    className="staged-form-select"
                                >
                                    {savingsTemplate?.lockinPeriodFrequencyTypeOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Overdraft Section */}
                        <div className="staged-form-row">
                            <label htmlFor="isOverdraftAllowed">
                                <input
                                    type="checkbox"
                                    id="isOverdraftAllowed"
                                    checked={isOverdraftAllowed}
                                    onChange={(e) => setIsOverdraftAllowed(e.target.checked)}
                                />{' '}
                                Is Overdraft Allowed
                            </label>
                        </div>

                        {/* Conditional Fields for Overdraft */}
                        {isOverdraftAllowed && (
                            <div className="staged-form-row">
                                <div className="staged-form-field">
                                    <label htmlFor="minimumOverdraftForInterestCalculation">
                                        Minimum Overdraft Required for Interest Calculation
                                    </label>
                                    <input
                                        type="number"
                                        id="minimumOverdraftForInterestCalculation"
                                        value={minimumOverdraftForInterestCalculation}
                                        onChange={(e) => setMinimumOverdraftForInterestCalculation(e.target.value)}
                                        required
                                        className="staged-form-input"
                                    />
                                </div>

                                <div className="staged-form-field">
                                    <label htmlFor="nominalAnnualInterestForOverdraft">
                                        Nominal Annual Interest for Overdraft (%)
                                    </label>
                                    <input
                                        type="number"
                                        id="nominalAnnualInterestForOverdraft"
                                        value={nominalAnnualInterestForOverdraft}
                                        onChange={(e) => setNominalAnnualInterestForOverdraft(e.target.value)}
                                        required
                                        className="staged-form-input"
                                    />
                                </div>

                                <div className="staged-form-field">
                                    <label htmlFor="maximumOverdraftAmountLimit">
                                        Maximum Overdraft Amount Limit
                                    </label>
                                    <input
                                        type="number"
                                        id="maximumOverdraftAmountLimit"
                                        value={maximumOverdraftAmountLimit}
                                        onChange={(e) => setMaximumOverdraftAmountLimit(e.target.value)}
                                        required
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
                                        checked={enforceMinimumBalance}
                                        onChange={(e) => setEnforceMinimumBalance(e.target.checked)}
                                    />{' '}
                                    Enforce Minimum Balance
                                </label>
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="minimumBalance">Minimum Balance</label>
                                <input
                                    type="number"
                                    id="minimumBalance"
                                    value={minimumBalance}
                                    onChange={(e) => setMinimumBalance(e.target.value)}
                                    className="staged-form-input"
                                />
                            </div>
                        </div>
                    </div>
                );
            case 'Charges':
                return (
                    <div className="stage-charges">
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
                                    {chargeOptions
                                        .filter((charge) => !addedCharges.some((added) => added.id === charge.id))
                                        .map((charge) => (
                                            <option key={charge.id} value={charge.id}>
                                                {charge.name} - {charge.amount}
                                            </option>
                                        ))}
                                </select>
                            </div>
                            <button
                                onClick={handleAddCharge}
                                className="create-provisioning-criteria-confirm"
                                disabled={!selectedCharge}
                            >
                                Add
                            </button>
                        </div>

                        {addedCharges.length > 0 && (
                            <div className="charges-table-section">
                                <h4>Added Charges</h4>
                                <table className="staged-form-table">
                                    <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Type</th>
                                        <th>Amount</th>
                                        <th>Collected On</th>
                                        <th>Date</th>
                                        <th>Repayments Every</th>
                                        <th>Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {addedCharges.map((charge, index) => (
                                        <tr key={index}>
                                            <td>{charge.name}</td>
                                            <td>{charge.chargeCalculationType.value}</td>
                                            <td>{charge.amount}</td>
                                            <td>{charge.chargeTimeType.value}</td>
                                            <td>
                                                {charge.chargeTimeType?.code === "chargeTimeType.specifiedDueDate" ? (
                                                    <DatePicker
                                                        selected={charge.dueDate ? new Date(charge.dueDate) : null}
                                                        onChange={(date) => {
                                                            const updatedCharges = [...addedCharges];
                                                            updatedCharges[index].dueDate = date.toISOString().split('T')[0];
                                                            setAddedCharges(updatedCharges);
                                                        }}
                                                        className="staged-form-input"
                                                        placeholderText="Select Due Date"
                                                        dateFormat="MMMM d, yyyy"
                                                        showMonthDropdown
                                                        showYearDropdown
                                                        dropdownMode="select"
                                                    />
                                                ) : (
                                                    <>{""}</>
                                                )}
                                            </td>
                                            <td>{charge.repaymentsEvery || 'Not Provided'}</td>
                                            <td>
                                                <button
                                                    className="delete-charge-button"
                                                    style={{border: 'none', cursor: "pointer"}}
                                                    onClick={() => handleRemoveCharge(index)}
                                                >
                                                    <FaTrash size={20} color={'#f00'}/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {addedCharges.length === 0 && (
                            <p className={'no-data'}>No charges added yet. Select a charge and click 'Add' to include it.</p>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    const formatDateForPreview = (date) => {
        return date
            ? new Date(date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
            })
            : "";
    };

    const renderPreviewSection = () => {
        const transformCharges = () =>
            addedCharges.length > 0
                ? addedCharges.map((charge) => ({
                    Name: charge.name || "",
                    Type: charge.chargeCalculationType.value || "",
                    Amount: charge.amount || "",
                    "Collected On": charge.chargeTimeType.value || "",
                    Date: formatDateForPreview(charge.dueDate) || "",
                    "Repayments Every": charge.repaymentsEvery || "",
                }))
                : null;

        const previewData = [
            {
                title: "Details",
                data: {
                    "Product Name": savingsTemplate?.productOptions?.find(
                        (option) => option.id === parseInt(selectedProduct)
                    )?.name || "",
                    "Submitted On": formatDateForPreview(submittedOn) || "",
                    "Field Officer": savingsTemplate?.fieldOfficerOptions?.find(
                        (officer) => officer.id === parseInt(fieldOfficer)
                    )?.displayName || "",
                    "External ID": externalId || "",
                },
            },
            {
                title: "Terms",
                data: {
                    "Currency": savingsTemplate?.currency?.name || "",
                    "Decimal Places": savingsTemplate?.currency?.decimalPlaces || "",
                    "Nominal Annual Interest Rate": nominalAnnualInterestRate,
                    "Interest Compounding Period": savingsTemplate?.interestCompoundingPeriodTypeOptions?.find(
                        (option) => option.id === parseInt(interestCompoundingPeriod)
                    )?.value || "",
                    "Interest Posting Period": savingsTemplate?.interestPostingPeriodTypeOptions?.find(
                        (option) => option.id === parseInt(interestPostingPeriod)
                    )?.value || "",
                    "Interest Calculated Using": savingsTemplate?.interestCalculationTypeOptions?.find(
                        (option) => option.id === parseInt(interestCalculatedUsing)
                    )?.value || "",
                    "Days in Year": savingsTemplate?.interestCalculationDaysInYearTypeOptions?.find(
                        (option) => option.id === parseInt(daysInYear)
                    )?.value || "",
                    "Minimum Opening Balance": minimumOpeningBalance || "",
                    "Apply Withdrawal Fee for Transfers": applyWithdrawalFee ? "Yes" : "No",
                    "Lock-in Period Frequency": lockInFrequency || "",
                    "Lock-in Period Type": savingsTemplate?.lockinPeriodFrequencyTypeOptions?.find(
                        (option) => option.id === parseInt(lockInType)
                    )?.value || "",
                    "Is Overdraft Allowed": isOverdraftAllowed ? "Yes" : "No",
                    ...(isOverdraftAllowed
                        ? {
                            "Minimum Overdraft For Interest Calculation": minimumOverdraftForInterestCalculation || "",
                            "Nominal Annual Interest for Overdraft": nominalAnnualInterestForOverdraft || "",
                            "Maximum Overdraft Amount Limit": maximumOverdraftAmountLimit || "",
                        }
                        : {}),
                    "Enforce Minimum Balance": enforceMinimumBalance ? "Yes" : "No",
                    "Minimum Balance": minimumBalance || "",
                },
            },
            {
                title: "Charges",
                data: transformCharges(),
            },
        ];

        return (
            <div className="staged-form-preview-section">
                {previewData.map(({ title, data }, index) => (
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
                        {data && typeof data === "object" && !Array.isArray(data) ? (
                            <div className="staged-form-preview-table-wrapper">
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
                                            <td>{value || ""}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : Array.isArray(data) && data.length > 0 ? (
                            <table className="staged-form-preview-table">
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
                            <p className="no-data-message">No data available for this section.</p>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const renderStageTracker = () => {
        return (
            <div className="staged-form-stage-tracker">
                {stages.map((stage) => (
                    <div
                        key={stage}
                        className={`staged-form-stage ${
                            currentStage === stage
                                ? "staged-form-active"
                                : completedStages.has(stage) || stage === "Preview"
                                    ? "staged-form-completed"
                                    : "staged-form-unvisited"
                        }`}
                        onClick={() => {
                            if (completedStages.has(stage) || stage === currentStage || stage === "Preview") {
                                setCurrentStage(stage);
                            }
                        }}
                    >
                        <span className="staged-form-stage-circle">{stages.indexOf(stage) + 1}</span>
                        <span className="staged-form-stage-label">{stage}</span>
                    </div>
                ))}
            </div>
        );
    };

    const formatDateForPayload = (date) => {
        return date.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
            })
            .replace(",", "");
    };

    const handleSubmit = async () => {
        try {
            startLoading();

            const payload = {
                ...(isOverdraftAllowed ?? null) && { allowOverdraft: isOverdraftAllowed },
                charges: addedCharges?.map(charge => ({
                    chargeId: charge.id,
                    amount: charge.amount ?? 0,
                    ...(charge.dueDate ? { dueDate: formatDateForPayload(new Date(charge.dueDate)) } : {}),
                })) ?? [],
                ...(clientId ?? null) && { clientId: parseInt(clientId, 10) },
                dateFormat: "dd MMMM yyyy",
                ...(externalId?.trim() ?? "") && { externalId: externalId.trim() },
                enforceMinRequiredBalance: enforceMinimumBalance ?? false,
                ...(fieldOfficer ?? null) && { fieldOfficerId: parseInt(fieldOfficer, 10) },
                ...(daysInYear ?? null) && { interestCalculationDaysInYearType: daysInYear },
                ...(interestCalculatedUsing ?? null) && { interestCalculationType: parseInt(interestCalculatedUsing, 10) },
                ...(interestCompoundingPeriod ?? null) && { interestCompoundingPeriodType: parseInt(interestCompoundingPeriod, 10) },
                ...(interestPostingPeriod ?? null) && { interestPostingPeriodType: parseInt(interestPostingPeriod, 10) },
                ...(lockInFrequency ?? null) && { lockinPeriodFrequency: parseInt(lockInFrequency, 10) },
                ...(lockInType ?? null) && { lockinPeriodFrequencyType: lockInType },
                ...(minimumOverdraftForInterestCalculation ?? null) && { minOverdraftForInterestCalculation: minimumOverdraftForInterestCalculation },
                ...(minimumBalance ?? null) && { minRequiredBalance: minimumBalance },
                ...(minimumOpeningBalance ?? null) && { minRequiredOpeningBalance: minimumOpeningBalance },
                monthDayFormat: "dd MMMM",
                nominalAnnualInterestRate: nominalAnnualInterestRate || 0,
                ...(nominalAnnualInterestForOverdraft ?? null) && { nominalAnnualInterestRateOverdraft: nominalAnnualInterestForOverdraft },
                ...(maximumOverdraftAmountLimit ?? null) && { overdraftLimit: maximumOverdraftAmountLimit },
                ...(selectedProduct ?? null) && { productId: selectedProduct },
                submittedOnDate: formatDateForPayload(submittedOn),
                withdrawalFeeForTransfers: applyWithdrawalFee ?? null,
                locale: "en",
            };

            const endpoint = isModifying
                ? `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/${account}`
                : `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts`;

            const method = isModifying ? "put" : "post";

            const response = await axios({
                method: method,
                url: endpoint,
                data: payload,
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });

            showNotification(isModifying ? "Saving Account modified successfully!" : "Saving Account created successfully!", 'success');
            setIsModifying(false);
            navigate(`/client/${clientId}/savings-account/${response.data.savingsId}`, { state: { account: payload } });
        } catch (error) {
            console.error("Error submitting loan:", error);
            showNotification("Failed to submit the loan. Please try again!", 'error');
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="staged-form-container">
            <div className="staged-form-add-client">
                {renderStageTracker()}
                <div className="staged-form-stage-content">
                    {currentStage === "Preview" ? (
                        renderPreviewSection()
                    ) : (
                        renderStageContent()
                    )}

                    <div className="staged-form-stage-buttons">
                        <button
                            onClick={handlePrevious}
                            className="staged-form-button-previous"
                            disabled={currentStage === "Details"}
                        >
                            Previous
                        </button>
                        <button
                            onClick={currentStage === "Preview" ? handleSubmit : handleNext}
                            className="staged-form-button-next"
                        >
                            {currentStage === "Preview" ? "Submit" : "Next"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SavingsAccount;
