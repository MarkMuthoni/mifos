import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../../../../context/AuthContext";
import { useLoading } from "../../../../../context/LoadingContext";
import { API_CONFIG } from "../../../../../config";
import "./CreateLoanProducts.css";
import {FaEdit, FaTrash} from "react-icons/fa";
import DatePicker from "react-datepicker";
import {NotificationContext} from "../../../../../context/NotificationContext";

const stages = [
    "Details",
    "Currency",
    "Settings",
    "Terms",
    "Charges",
    "Accounting",
];

const CreateLoanProducts = ({ onSuccess, productToEdit }) => {
    const [currentStage, setCurrentStage] = useState(0);
    const [formData, setFormData] = useState({});
    const [completedStages, setCompletedStages] = useState(new Set());
    const [errors, setErrors] = useState({});
    const [isNextDisabled, setIsNextDisabled] = useState(true);
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
    const [modalState, setModalState] = useState({
        isOpen: false,
        type: "",
        data: null,
    });
    const [loanCycleData, setLoanCycleData] = useState({
        principal: [],
        repayments: [],
        interest: [],
    });

    useEffect(() => {
        if (productToEdit) {

            setFormData({
                Details: {
                    productName: productToEdit.name,
                    description: productToEdit.description,
                    fund: productToEdit.fundId,
                    shortName: productToEdit.shortName,
                    startDate: productToEdit.startDate,
                    closeDate: productToEdit.closeDate,
                    includeInCustomerLoanCounter: productToEdit.includeInBorrowerCycle,
                },
                Currency: {
                    currency: productToEdit.currency.code,
                    decimalPlaces: productToEdit.currency.decimalPlaces,
                    currencyMultiples: productToEdit.currency.inMultiplesOf,
                    installmentMultiples: productToEdit.installmentAmountInMultiplesOf,
                },
                Settings: {
                    amortization: productToEdit.amortizationType.id,
                    interestMethod: productToEdit.interestMethod,
                    interestCalculationPeriod: productToEdit.interestCalculationPeriod,
                    isEqualAmortization: productToEdit.isEqualAmortization,
                    calculateInterestForExactDays: productToEdit.calculateInterestForExactDays,
                    loanScheduleType: productToEdit.loanScheduleType,
                    repaymentStrategy: productToEdit.repaymentStrategy,
                    enableMultipleDisbursals: productToEdit.multiDisburseLoan,
                    maxTrancheCount: productToEdit.maxTrancheCount,
                    maxOutstandingBalance: productToEdit.maxOutstandingBalance,
                    disallowExpectedDisbursements: productToEdit.disallowExpectedDisbursements,
                    enableDownPayment: productToEdit.enableDownPayment,
                    downPaymentPercentage: productToEdit.disbursedAmountPercentageForDownPayment,
                    enableAutoRepaymentForDownPayment: productToEdit.enableAutoRepaymentForDownPayment,
                    gracePrincipalPayment: productToEdit.graceOnPrincipalPayment,
                    graceInterestPayment: productToEdit.graceOnInterestPayment,
                    delinquencyBucket: productToEdit.delinquencyBucket,
                    enableInstallmentLevelDelinquency: productToEdit.enableInstallmentLevelDelinquency,
                    interestFreePeriod: productToEdit.interestFreePeriod,
                    arrearsTolerance: productToEdit.inArrearsTolerance,
                    daysInYear: productToEdit.daysInYear,
                    daysInMonth: productToEdit.daysInMonth,
                    allowFixingInstallmentAmount: productToEdit.allowFixingInstallmentAmount,
                    onArrearsAging: productToEdit.onArrearsAging,
                    overdueDays: productToEdit.overdueDays,
                    accountMovesOutOfNPA: productToEdit.accountMovesOutOfNPAOnlyOnArrearsCompletion,
                    principalThreshold: productToEdit.principalThreshold,
                    variableInstallments: productToEdit.allowVariableInstallments,
                    topUpLoans: productToEdit.topUpLoans,
                    minGap: productToEdit.minimumGap,
                    maxGap: productToEdit.maximumGap,
                    recalculateInterest: productToEdit.recalculateInterest,
                    preClosureRule: productToEdit.preClosureRule,
                    advancePaymentType: productToEdit.advancePaymentType,
                    compoundingOn: productToEdit.compoundingOn,
                    frequency: productToEdit.frequency,
                    arrearsRecognitionBasedOnOriginalSchedule: productToEdit.arrearsRecognitionBasedOnOriginalSchedule,
                    placeGuaranteeFundsOnHold: productToEdit.holdGuaranteeFunds,
                    mandatoryGuarantee: productToEdit.mandatoryGuarantee,
                    minOwnFunds: productToEdit.minOwnFunds,
                    minGuarantorFunds: productToEdit.minGuarantorFunds,
                },
                Terms: {
                    principalDefault: productToEdit.principal,
                    principalMin: productToEdit.minPrincipal,
                    principalMax: productToEdit.maxPrincipal,
                    allowApprovalAboveLoanAmount: productToEdit.allowApprovalAboveLoanAmount,
                    overAmountCalcType: productToEdit.overAmountCalcType,
                    overAmount: productToEdit.overAmount,
                    installmentDayCalcFrom: productToEdit.repaymentStartDateType.id,
                    nominalInterestDefault: productToEdit.interestRatePerPeriod,
                    repaymentDefault: productToEdit.numberOfRepayments,
                    repaymentMin: productToEdit.minNumberOfRepayments,
                    repaymentMax: productToEdit.maxNumberOfRepayments,
                    frequency: productToEdit.repaymentEvery,
                    frequencyType: productToEdit.repaymentFrequencyType.id,
                    isZeroInterestRate: productToEdit.isZeroInterestRate,
                    isLinkedToFloatingRate: productToEdit.isLinkedToFloatingRate,
                },
                Charges: productToEdit.charges || [],
                Accounting: {
                    selectedOption: productToEdit.accountingRule,
                    fundSource: productToEdit?.accountingMappings?.fundSourceAccount.id,
                    loanPortfolio: productToEdit?.accountingMappings?.loanPortfolioAccount.id,
                    transferSuspense: productToEdit?.accountingMappings?.transferSuspense,
                    incomeInterest: productToEdit?.accountingMappings?.interestOnLoanAccount.id,
                    incomeFees: productToEdit?.accountingMappings?.incomeFromFeeAccount.id,
                    incomePenalties: productToEdit?.accountingMappings?.incomeFromPenaltyAccount.id,
                    incomeRecovery: productToEdit?.accountingMappings?.incomeFromRecoveryAccount.id,
                    incomeChargeOffInterest: productToEdit?.accountingMappings?.incomeFromChargeOffInterestAccount.id,
                    incomeChargeOffFees: productToEdit?.accountingMappings?.incomeFromChargeOffFeesAccount.id,
                    incomeChargeOffPenalty: productToEdit?.accountingMappings?.incomeFromChargeOffPenaltyAccount.id,
                    incomeGoodwillCreditInterest: productToEdit?.accountingMappings?.incomeFromGoodwillCreditInterestAccount.id,
                    incomeGoodwillCreditFees: productToEdit?.accountingMappings?.incomeFromGoodwillCreditFeesAccount.id,
                    incomeGoodwillCreditPenalty: productToEdit?.accountingMappings?.incomeFromGoodwillCreditPenaltyAccount.id,
                    lossesWrittenOff: productToEdit?.accountingMappings?.writeOffAccount.id,
                    goodwillCreditExpenses: productToEdit?.accountingMappings?.goodwillCreditAccount.id,
                    overpaymentLiability: productToEdit?.accountingMappings?.overpaymentLiabilityAccount.id,
                },
            });

            setLoanCycleData({
                principal: productToEdit.loanCyclePrincipalVariations || [],
                repayments: productToEdit.loanCycleRepaymentVariations || [],
                interest: productToEdit.loanCycleInterestVariations || [],
            });
        }
    }, [productToEdit]);

    useEffect(() => {
        if (modalState.isOpen) {
            const { condition, loanCycle, default: defaultValue } = modalState.data || {};
            const hasRequiredFields =
                condition &&
                loanCycle !== undefined &&
                loanCycle !== "" &&
                defaultValue !== undefined &&
                defaultValue !== "";
            setIsSubmitDisabled(!hasRequiredFields);
        }
    }, [modalState.isOpen, modalState.data]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                startLoading();

                const loanProductTemplateResponse = await axios.get(
                    `${API_CONFIG.proxy}/fineract-provider/api/v1/loanproducts/template`,
                    {
                        headers: {
                            Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                            'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                const globalConfigResponse = await axios.get(
                    `${API_CONFIG.proxy}/fineract-provider/api/v1/configurations`,
                    {
                        headers: {
                            Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                            'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                setFormData((prevData) => ({
                    ...prevData,
                    loanProductTemplate: loanProductTemplateResponse.data,
                    globalConfiguration: globalConfigResponse.data.globalConfiguration,
                }));
            } catch (error) {
                console.error("Error fetching data:", error);
                showNotification("Error fetching data:", 'error');
            } finally {
                stopLoading();
            }
        };

        fetchData();
    }, []);

    const handleEditCycle = (type, index) => {
        const itemToEdit = loanCycleData[type][index];
        if (!itemToEdit) {
            console.warn(`No item found at index ${index} for type ${type}`);
            return;
        }
        openModal(type, itemToEdit);
    };

    const handleDeleteCycle = (type, id) => {
        const keyMap = {
            principal: "principal",
            repayments: "repayments",
            interest: "interest",
        };
        const dataKey = keyMap[type];

        if (!dataKey) {
            console.warn(`Unknown type: ${type}`);
            return;
        }

        if (window.confirm("Are you sure you want to delete this item?")) {
            setLoanCycleData((prevData) => ({
                ...prevData,
                [dataKey]: prevData[dataKey].filter((item) => item.id !== id),
            }));
        }
    };

    const handleFieldChange = (stage, field, value) => {
        setFormData((prev) => ({
            ...prev,
            [stage]: {
                ...prev[stage],
                [field]: value,
            },
        }));

        if (errors[stage]?.[field]) {
            setErrors((prev) => ({
                ...prev,
                [stage]: {
                    ...prev[stage],
                    [field]: false,
                },
            }));
        }
    };

    const handleAddAdvancedRule = (type) => {
        // console.log('Add Advanced Rule')
    };

    const handleNext = () => {
        setCompletedStages((prev) => new Set([...prev, stages[currentStage]]));
        setCurrentStage((prev) => prev + 1);
    };

    const handlePrevious = () => {
        setCurrentStage((prev) => prev - 1);
    };

    const handleSubmit = async () => {
        try {
            const {
                Details = {},
                Currency = {},
                Settings = {},
                Terms = {},
                Charges = [],
                Accounting = {},
            } = formData;

            const accountingRuleOption = formData?.loanProductTemplate?.accountingRuleOptions?.find(
                (f) => f.value === Accounting.selectedOption?.toUpperCase()
            );

            const accountingRuleId = accountingRuleOption?.id;

            const payload = {
                "accountMovesOutOfNPAOnlyOnArrearsCompletion": formData.Settings?.accountMovesOutOfNPA || false,
                "accountingRule": accountingRuleId || '',
                "allowApprovedDisbursedAmountsOverApplied": formData.Terms?.allowApprovalAboveLoanAmount || false,
                "allowAttributeOverrides": {
                    "amortizationType": true,
                    "graceOnArrearsAgeing": true,
                    "graceOnPrincipalAndInterestPayment": true,
                    "inArrearsTolerance": true,
                    "interestCalculationPeriodType": true,
                    "interestType": true,
                    "repaymentEvery": true,
                    "transactionProcessingStrategyCode": true
                },
                "allowPartialPeriodInterestCalcualtion": false,
                "allowVariableInstallments": formData.Settings?.variableInstallments || false,
                "amortizationType": parseInt(formData.Settings?.amortization),
                "canDefineInstallmentAmount": formData.Settings?.allowFixingInstallmentAmount || false,
                "canUseForTopup": formData.Settings?.topUpLoans || false,
                "charges": loanCycleData.charges?.map((charge) => ({
                    chargeId: parseInt(charge.charge),
                })) || [],
                "closeDate": formatDateForPreview(formData.Details?.closeDate),
                "currencyCode": formData?.Currency?.currency,
                "dateFormat": "dd MMMM yyyy",
                "daysInMonthType": parseInt(formData.Settings?.daysInMonth),
                "daysInYearType": parseInt(formData.Settings?.daysInYear),
                "delinquencyBucketId": parseInt(formData.Settings?.delinquencyBucket),
                "description": formData.Details?.description || '',
                "digitsAfterDecimal": formData.Currency?.decimalPlaces || '',
                "disallowExpectedDisbursements": formData.Settings?.disallowExpectedDisbursements || false,
                "disbursedAmountPercentageForDownPayment": formData.Settings?.downPaymentPercentage || "",
                "dueDaysForRepaymentEvent": formData.Settings?.dueDaysForRepayment || "",
                "enableAutoRepaymentForDownPayment": formData.Settings?.enableAutoRepaymentForDownPayment || false,
                "enableDownPayment": formData.Settings?.enableDownPayment || false,
                "enableInstallmentLevelDelinquency": formData.Settings?.enableInstallmentLevelDelinquency || false,
                "fundId": parseInt(formData.Details.fund, 10),
                "fundSourceAccountId": parseInt(formData.Accounting.fundSource, 10) || '',
                "goodwillCreditAccountId": parseInt(formData.Accounting.goodwillCreditExpenses, 10),
                "graceOnInterestPayment": formData.Settings?.graceInterestPayment || "",
                "graceOnPrincipalPayment": formData.Settings?.gracePrincipalPayment || "",
                "holdGuaranteeFunds": formData.Settings?.placeGuaranteeFundsOnHold,
                "inArrearsTolerance": formData.Settings?.arrearsTolerance || "",
                "inMultiplesOf": formData.Currency?.currencyMultiples || '',
                "includeInBorrowerCycle": formData.Details.includeInCustomerLoanCounter || false,
                "incomeFromChargeOffFeesAccountId": parseInt(formData.Accounting.incomeChargeOffFees, 10),
                "incomeFromChargeOffInterestAccountId": parseInt(formData.Accounting.incomeChargeOffInterest, 10),
                "incomeFromChargeOffPenaltyAccountId": parseInt(formData.Accounting.incomeChargeOffPenalty, 10),
                "incomeFromFeeAccountId": parseInt(formData.Accounting.incomeFees, 10),
                "incomeFromGoodwillCreditFeesAccountId": parseInt(formData.Accounting.incomeGoodwillCreditFees, 10),
                "incomeFromGoodwillCreditInterestAccountId": parseInt(formData.Accounting.incomeGoodwillCreditInterest, 10),
                "incomeFromGoodwillCreditPenaltyAccountId": parseInt(formData.Accounting.incomeGoodwillCreditPenalty, 10),
                "incomeFromPenaltyAccountId": parseInt(formData.Accounting.incomePenalties, 10),
                "incomeFromRecoveryAccountId": parseInt(formData.Accounting.incomeRecovery, 10),
                "installmentAmountInMultiplesOf": formData.Currency?.installmentMultiples || '',
                "interestCalculationPeriodType": parseInt(formData.Settings?.interestCalculationPeriod),
                "interestOnLoanAccountId": parseInt(formData.Accounting?.incomeInterest),
                "interestRateFrequencyType": parseInt(formData.Terms?.frequency),
                "interestRatePerPeriod": formData.Terms?.nominalInterestDefault || "",
                "interestRecalculationCompoundingMethod": parseInt(formData.Settings?.compoundingOn),
                "isEqualAmortization": formData.Settings?.isEqualAmortization || false,
                "isInterestRecalculationEnabled": formData.Settings?.recalculateInterest || false,
                "isLinkedToFloatingInterestRates": formData.Terms?.isLinkedToFloatingRates || false,
                "loanPortfolioAccountId": parseInt(formData.Accounting.loanPortfolio, 10),
                "loanScheduleType": formData.Settings?.loanScheduleType,
                "locale": "en",
                "maxInterestRatePerPeriod": formData.Terms?.nominalInterestMax || "",
                "maxNumberOfRepayments": formData.Terms?.repaymentMax || "",
                "maxPrincipal": formData.Terms?.principalMax || "",
                "maxTrancheCount": formData.Settings?.maxTrancheCount || "",
                "minInterestRatePerPeriod": formData.Terms?.nominalInterestMin || "",
                "minNumberOfRepayments": formData.Terms?.repaymentMin || "",
                "minPrincipal": formData.Terms?.principalMin || "",
                "minimumDaysBetweenDisbursalAndFirstRepayment": formData.Terms?.minDaysDisbursalToRepayment || "",
                "multiDisburseLoan": formData.Settings?.enableMultipleDisbursals || '',
                "name": formData?.Details?.productName || '',
                "numberOfRepayments": formData.Terms?.repaymentDefault || "",
                "outstandingLoanBalance": formData.Settings?.maxOutstandingBalance || "",
                "overAppliedCalculationType": formData.Terms?.overAmountCalcType,
                "overAppliedNumber": formData.Terms?.overAmount || "",
                "overDueDaysForRepaymentEvent": formData.Settings?.overDueDaysForRepayment || "",
                "overdueDaysForNPA": formData.Settings?.overdueDays || "",
                "overpaymentLiabilityAccountId": parseInt(formData.Accounting.overpaymentLiability, 10),
                "preClosureInterestCalculationStrategy": parseInt(formData.Settings?.preClosureRule),
                "principal": formData.Terms?.principalDefault,
                "principalThresholdForLastInstallment": formData.Settings?.principalThreshold || "",
                "repaymentEvery": formData.Terms?.frequencyRepaid || "",
                "repaymentFrequencyType": parseInt(formData.Terms?.frequencyType),
                "repaymentStartDateType": parseInt(formData.Terms?.installmentDayCalcFrom),
                "rescheduleStrategyMethod": parseInt(formData.Settings?.repaymentStrategy),
                "shortName": formData.Details?.shortName || '',
                "startDate": formatDateForPreview(formData.Details?.startDate),
                "transactionProcessingStrategyCode": formData.Settings?.repaymentStrategy || "",
                "interestType": 0,
                "writeOffAccountId": 25,
                "transfersInSuspenseAccountId": 1,
                "receivableInterestAccountId": 1,
                "receivableFeeAccountId": 1,
                "receivablePenaltyAccountId": 2,
            }

            const method = productToEdit ? 'put' : 'post';
            const url = productToEdit
                ? `${API_CONFIG.proxy}/fineract-provider/api/v1/loanproducts/${productToEdit.id}`
                : `${API_CONFIG.proxy}/fineract-provider/api/v1/loanproducts`;

            const response = await axios[method](url, payload, {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.status === 200 || response.status === 201) {
                showNotification(`Loan Product ${productToEdit ? 'Updated' : 'Created'} Successfully!`, 'success');

                const productName = formData?.Details?.productName || 'Loan Product';

                setFormData({
                    Details: {},
                    Currency: {},
                    Settings: {},
                    Terms: {},
                    Charges: [],
                    Accounting: {},
                });

                const {resourceId} = response.data;
                onSuccess({
                    id: resourceId,
                    name: productName,
                });
            } else {
                throw new Error("Unexpected response status");
            }
        } catch (error) {
            console.error("Error in handleSubmit:", error);
            showNotification(
                error.response?.data?.defaultUserMessage ||
                "An unexpected error occurred.", 'error'
            );
        }
    };

    const openModal = (type, data = null) => {
        setModalState({ isOpen: true, type, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, type: "", data: null });
    };

    const handleSubmitModalData = (newData) => {
        setLoanCycleData((prevData) => {
            if (!modalState.type) {
                console.warn("modalState.type is not defined");
                return prevData;
            }

            const updatedData = Array.isArray(prevData[modalState.type])
                ? [...prevData[modalState.type]]
                : [];

            if (modalState.data?.id) {
                const index = updatedData.findIndex((item) => item.id === modalState.data.id);
                if (index > -1) {
                    updatedData[index] = { ...newData, id: modalState.data.id };
                } else {
                    console.warn("No matching item found for editing");
                }
            } else {
                const newItem = { ...newData, id: Date.now() };
                updatedData.push(newItem);
            }

            return { ...prevData, [modalState.type]: updatedData };
        });

        closeModal();
    };

    const allStagesComplete = stages.every((stage) => completedStages.has(stage));

    const renderStageContent = () => {
        switch (stages[currentStage]) {
            case "Details":
                return (
                    <div className="staged-form-details">
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="productName">
                                    Product Name <span className="staged-form-required">*</span>
                                </label>
                                <input
                                    id="productName"
                                    type="text"
                                    value={formData.Details?.productName || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Details", "productName", e.target.value)
                                    }
                                    className={`staged-form-input ${
                                        errors.Details?.productName ? "staged-form-error" : ""
                                    }`}
                                    required
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="shortName">
                                    Short Name <span className="staged-form-required">*</span>
                                </label>
                                <input
                                    id="shortName"
                                    type="text"
                                    value={formData.Details?.shortName || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Details", "shortName", e.target.value)
                                    }
                                    className={`staged-form-input ${
                                        errors.Details?.shortName ? "staged-form-error" : ""
                                    }`}
                                    required
                                />
                            </div>
                        </div>

                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="fund">Fund</label>
                                <select
                                    id="fund"
                                    value={formData.Details?.fund || ""}
                                    onChange={(e) => handleFieldChange("Details", "fund", e.target.value)}
                                    className="staged-form-select"
                                >
                                    <option value="">Select Fund</option>
                                    {formData.loanProductTemplate?.fundOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="staged-form-field">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={formData.Details?.includeInCustomerLoanCounter || false}
                                        onChange={(e) =>
                                            handleFieldChange(
                                                "Details",
                                                "includeInCustomerLoanCounter",
                                                e.target.checked
                                            )
                                        }
                                    />
                                    Include in Customer Loan Counter
                                </label>
                            </div>
                        </div>

                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="startDate">Start Date</label>
                                <DatePicker
                                    id="startDate"
                                    selected={formData.Details?.startDate ? new Date(formData.Details.startDate) : null}
                                    onChange={(date) => handleFieldChange("Details", "startDate", date ? date.toISOString().split('T')[0] : "")}
                                    dateFormat="yyyy-MM-dd"
                                    className="staged-form-input"
                                    placeholderText="Select Start Date"
                                    showMonthDropdown
                                    showYearDropdown
                                    dropdownMode="select"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="closeDate">Close Date</label>
                                <DatePicker
                                    id="closeDate"
                                    selected={formData.Details?.closeDate ? new Date(formData.Details.closeDate) : null}
                                    onChange={(date) => handleFieldChange("Details", "closeDate", date ? date.toISOString().split('T')[0] : "")}
                                    dateFormat="yyyy-MM-dd"
                                    className="staged-form-input"
                                    placeholderText="Select Close Date"
                                    showMonthDropdown
                                    showYearDropdown
                                    dropdownMode="select"
                                />
                            </div>
                        </div>

                        <div className="staged-form-field">
                            <label htmlFor="description">Description</label>
                            <textarea
                                id="description"
                                value={formData.Details?.description || ""}
                                onChange={(e) =>
                                    handleFieldChange("Details", "description", e.target.value)
                                }
                                className="staged-form-textarea"
                            ></textarea>
                        </div>
                    </div>
                );
            case "Currency":
                return (
                    <div className="staged-form-currency">
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="currency">
                                    Currency <span className="staged-form-required">*</span>
                                </label>
                                <select
                                    id="currency"
                                    name="currency"
                                    value={formData.Currency?.currency || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Currency", "currency", e.target.value)
                                    }
                                    className={`staged-form-select ${
                                        errors.Currency?.currency ? "staged-form-error" : ""
                                    }`}
                                    required
                                >
                                    <option value="">Select Currency</option>
                                    {formData.loanProductTemplate?.currencyOptions?.map((option) => (
                                        <option key={option.code} value={option.code}>
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="decimalPlaces">
                                    Decimal Places <span className="staged-form-required">*</span>
                                </label>
                                <input
                                    id="decimalPlaces"
                                    name="decimalPlaces"
                                    type="number"
                                    min="0"
                                    max="5"
                                    value={formData.Currency?.decimalPlaces || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Currency", "decimalPlaces", e.target.value)
                                    }
                                    className={`staged-form-input ${
                                        errors.Currency?.decimalPlaces ? "staged-form-error" : ""
                                    }`}
                                    required
                                />
                            </div>
                        </div>

                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="currencyMultiples">
                                    Currency in Multiples Of
                                </label>
                                <input
                                    id="currencyMultiples"
                                    name="currencyMultiples"
                                    type="number"
                                    min="0"
                                    value={formData.Currency?.currencyMultiples || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Currency", "currencyMultiples", e.target.value)
                                    }
                                    className="staged-form-input"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="installmentMultiples">
                                    Installment in Multiples Of
                                </label>
                                <input
                                    id="installmentMultiples"
                                    name="installmentMultiples"
                                    type="number"
                                    min="0"
                                    value={formData.Currency?.installmentMultiples || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Currency", "installmentMultiples", e.target.value)
                                    }
                                    className="staged-form-input"
                                />
                            </div>
                        </div>
                    </div>
                );
            case "Settings":
                return (
                    <div className="staged-form-settings">
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="amortization">
                                    Amortization <span className="staged-form-required">*</span>
                                </label>
                                <select
                                    id="amortization"
                                    value={formData.Settings?.amortization || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Settings", "amortization", e.target.value)
                                    }
                                    className="staged-form-select"
                                    required
                                >
                                    <option value="">Select Amortization</option>
                                    {formData.loanProductTemplate?.amortizationTypeOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="interestMethod">
                                    Interest Method <span className="staged-form-required">*</span>
                                </label>
                                <select
                                    id="interestMethod"
                                    value={formData.Settings?.interestMethod || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Settings", "interestMethod", e.target.value)
                                    }
                                    className="staged-form-select"
                                    required
                                >
                                    <option value="">Select Interest Method</option>
                                    {formData.loanProductTemplate?.interestTypeOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="interestCalculationPeriod">
                                    Interest Calculation Period{" "}
                                    <span className="staged-form-required">*</span>
                                </label>
                                <select
                                    id="interestCalculationPeriod"
                                    value={formData.Settings?.interestCalculationPeriod || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Settings", "interestCalculationPeriod", e.target.value)
                                    }
                                    className="staged-form-select"
                                    required
                                >
                                    <option value="">Select Calculation Period</option>
                                    {formData.loanProductTemplate?.interestCalculationPeriodTypeOptions?.map(
                                        (option) => (
                                            <option key={option.id} value={option.id}>
                                                {option.value}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>
                        </div>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={formData.Settings?.isEqualAmortization || false}
                                        onChange={(e) =>
                                            handleFieldChange("Settings", "isEqualAmortization", e.target.checked)
                                        }
                                    />
                                    Is Equal Amortization?
                                </label>
                            </div>
                            <div className="staged-form-field">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={
                                            formData.Settings?.calculateInterestForExactDays || false
                                        }
                                        onChange={(e) =>
                                            handleFieldChange(
                                                "Settings",
                                                "calculateInterestForExactDays",
                                                e.target.checked
                                            )
                                        }
                                    />
                                    Calculate Interest for Exact Days in Partial Period
                                </label>
                            </div>
                        </div>

                        {/* Loan Schedule Section */}
                        <h4 className="staged-form-section-title">Loan Schedule</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="loanScheduleType">
                                    Loan Schedule Type <span className="staged-form-required">*</span>
                                </label>
                                <select
                                    id="loanScheduleType"
                                    value={formData.Settings?.loanScheduleType || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Settings", "loanScheduleType", e.target.value)
                                    }
                                    className="staged-form-select"
                                    required
                                >
                                    <option value="">Select Loan Schedule Type</option>
                                    {formData.loanProductTemplate?.loanScheduleTypeOptions?.map((option) => (
                                        <option key={option.id} value={option.code}>
                                            {option.value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="repaymentStrategy">
                                    Repayment Strategy <span className="staged-form-required">*</span>
                                </label>
                                <select
                                    id="repaymentStrategy"
                                    value={formData.Settings?.repaymentStrategy || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Settings", "repaymentStrategy", e.target.value)
                                    }
                                    className="staged-form-select"
                                    required
                                >
                                    <option value="">Select Repayment Strategy</option>
                                    {formData.loanProductTemplate?.transactionProcessingStrategyOptions?.map((option) => (
                                        <option key={option.id} value={option.code}>
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Loan Tranche Details Section */}
                        <h4 className="staged-form-section-title">Loan Tranche Details</h4>
                        {/* Enable Multiple Disbursals */}
                        <div className="staged-form-field">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={formData.Settings?.enableMultipleDisbursals || false}
                                    onChange={(e) =>
                                        handleFieldChange("Settings", "enableMultipleDisbursals", e.target.checked)
                                    }
                                />
                                Enable Multiple Disbursals
                            </label>
                        </div>
                        {formData.Settings?.enableMultipleDisbursals && (
                            <>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="maxTrancheCount">
                                            Maximum Tranche Count <span className="staged-form-required">*</span>
                                        </label>
                                        <input
                                            id="maxTrancheCount"
                                            type="number"
                                            min={1}
                                            value={formData.Settings?.maxTrancheCount || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Settings", "maxTrancheCount", e.target.value)
                                            }
                                            className="staged-form-input"
                                            required
                                        />
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="maxOutstandingBalance">
                                            Maximum Allowed Outstanding Balance <span className="staged-form-required">*</span>
                                        </label>
                                        <input
                                            id="maxOutstandingBalance"
                                            type="number"
                                            min={1}
                                            value={formData.Settings?.maxOutstandingBalance || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Settings", "maxOutstandingBalance", e.target.value)
                                            }
                                            className="staged-form-input"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="staged-form-field">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={formData.Settings?.disallowExpectedDisbursements || false}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    "Settings",
                                                    "disallowExpectedDisbursements",
                                                    e.target.checked
                                                )
                                            }
                                        />
                                        Disallow Expected Disbursements
                                    </label>
                                </div>
                            </>
                        )}
                        <h4 className="staged-form-section-title">Down Payment</h4>
                        {/* Enable Down Payment */}
                        <div className="staged-form-field">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={formData.Settings?.enableDownPayment || false}
                                    onChange={(e) =>
                                        handleFieldChange("Settings", "enableDownPayment", e.target.checked)
                                    }
                                />
                                Enable Down Payment
                            </label>
                        </div>
                        {formData.Settings?.enableDownPayment && (
                            <>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="downPaymentPercentage">
                                            Disbursed Amount Percentage Down Payment (%){" "}
                                            <span className="staged-form-required">*</span>
                                        </label>
                                        <input
                                            id="downPaymentPercentage"
                                            type="number"
                                            min={0}
                                            value={formData.Settings?.downPaymentPercentage || ""}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    "Settings",
                                                    "downPaymentPercentage",
                                                    e.target.value
                                                )
                                            }
                                            className="staged-form-input"
                                            required
                                        />
                                    </div>
                                    <div className="staged-form-field">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={
                                                    formData.Settings?.enableAutoRepaymentForDownPayment || false
                                                }
                                                onChange={(e) =>
                                                    handleFieldChange(
                                                        "Settings",
                                                        "enableAutoRepaymentForDownPayment",
                                                        e.target.checked
                                                    )
                                                }
                                            />
                                            Enable Auto Repayment for Down Payment
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Moratorium Section */}
                        <h4 className="staged-form-section-title">Moratorium</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="gracePrincipalPayment">Grace on Principal Payment</label>
                                <input
                                    id="gracePrincipalPayment"
                                    type="number" min={0}
                                    value={formData.Settings?.gracePrincipalPayment || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Settings", "gracePrincipalPayment", e.target.value)
                                    }
                                    className="staged-form-input"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="graceInterestPayment">Grace on Interest Payment</label>
                                <input
                                    id="graceInterestPayment"
                                    type="number" min={0}
                                    value={formData.Settings?.graceInterestPayment || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Settings", "graceInterestPayment", e.target.value)
                                    }
                                    className="staged-form-input"
                                />
                            </div>
                        </div>
                        {/* Delinquency Section */}
                        <h4 className="staged-form-section-title">Delinquency</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="delinquencyBucket">Delinquency Bucket</label>
                                <select
                                    id="delinquencyBucket"
                                    value={formData.Settings?.delinquencyBucket || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Settings", "delinquencyBucket", e.target.value)
                                    }
                                    className="staged-form-select"
                                >
                                    <option value="">Select Delinquency Bucket</option>
                                    {formData.loanProductTemplate?.delinquencyBucketOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {formData.Settings?.delinquencyBucket && (
                                <div className="staged-form-field">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={formData.Settings?.enableInstallmentLevelDelinquency || false}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    "Settings",
                                                    "enableInstallmentLevelDelinquency",
                                                    e.target.checked
                                                )
                                            }
                                        />
                                        Enable Installment Level Delinquency
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Interest Free Period Section */}
                        <h4 className="staged-form-section-title">Interest Free Period</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="interestFreePeriod">Interest Free Period</label>
                                <input
                                    id="interestFreePeriod"
                                    type="number" min={0}
                                    value={formData.Settings?.interestFreePeriod || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Settings", "interestFreePeriod", e.target.value)
                                    }
                                    className="staged-form-input"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="arrearsTolerance">Arrears Tolerance</label>
                                <input
                                    id="arrearsTolerance"
                                    type="number" min={0}
                                    value={formData.Settings?.arrearsTolerance || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Settings", "arrearsTolerance", e.target.value)
                                    }
                                    className="staged-form-input"
                                />
                            </div>
                        </div>

                        {/* Days in Year/Month Section */}
                        <h4 className="staged-form-section-title">Days in Year/Month</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="daysInYear">
                                    Days in Year <span className="staged-form-required">*</span>
                                </label>
                                <select
                                    id="daysInYear"
                                    value={formData.Settings?.daysInYear || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Settings", "daysInYear", e.target.value)
                                    }
                                    className="staged-form-select"
                                    required
                                >
                                    <option value="">Select Days in Year</option>
                                    {formData.loanProductTemplate?.daysInYearTypeOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="daysInMonth">
                                    Days in Month <span className="staged-form-required">*</span>
                                </label>
                                <select
                                    id="daysInMonth"
                                    value={formData.Settings?.daysInMonth || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Settings", "daysInMonth", e.target.value)
                                    }
                                    className="staged-form-select"
                                    required
                                >
                                    <option value="">Select Days in Month</option>
                                    {formData.loanProductTemplate?.daysInMonthTypeOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={formData.Settings?.allowFixingInstallmentAmount || false}
                                        onChange={(e) =>
                                            handleFieldChange(
                                                "Settings",
                                                "allowFixingInstallmentAmount",
                                                e.target.checked
                                            )
                                        }
                                    />
                                    Allow Fixing of the Installment Amount
                                </label>
                            </div>
                        </div>

                        {/* Overdue and NPA Settings */}
                        <h4 className="staged-form-section-title">Overdue and NPA (Non-Performing Assets) Settings</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="onArrearsAging">
                                    Number of Days a Loan May Be Overdue Before Moving into Arrears
                                </label>
                                <input
                                    id="onArrearsAging"
                                    type="number" min={0}
                                    value={formData.Settings?.onArrearsAging || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Settings", "onArrearsAging", e.target.value)
                                    }
                                    className="staged-form-input"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="overdueDays">
                                    Maximum Number of Days a Loan May Be Overdue Before Becoming NPA
                                </label>
                                <input
                                    id="overdueDays"
                                    type="number" min={0}
                                    value={formData.Settings?.overdueDays || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Settings", "overdueDays", e.target.value)
                                    }
                                    className="staged-form-input"
                                />
                            </div>
                        </div>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={formData.Settings?.accountMovesOutOfNPA || false}
                                        onChange={(e) =>
                                            handleFieldChange("Settings", "accountMovesOutOfNPA", e.target.checked)
                                        }
                                    />
                                    Account Moves Out of NPA Only After All Arrears Have Been Cleared
                                </label>
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="principalThreshold">
                                    Principal Threshold (%) for Last Installment <span>*</span>
                                </label>
                                <input
                                    id="principalThreshold"
                                    type="number" min={0}
                                    value={formData.Settings?.principalThreshold || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Settings", "principalThreshold", e.target.value)
                                    }
                                    className="staged-form-input"
                                />
                            </div>
                        </div>

                        {/* Variable Installments */}
                        <h4 className="staged-form-section-title">Variable Installments</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={formData.Settings?.variableInstallments || false}
                                        onChange={(e) =>
                                            handleFieldChange("Settings", "variableInstallments", e.target.checked)
                                        }
                                    />
                                    Are Variable Installments Allowed?
                                </label>
                            </div>
                            <div className="staged-form-field">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={formData.Settings?.topUpLoans || false}
                                        onChange={(e) =>
                                            handleFieldChange("Settings", "topUpLoans", e.target.checked)
                                        }
                                    />
                                    Allowed to Be Used for Providing Top Up Loans
                                </label>
                            </div>
                        </div>
                        {formData.Settings?.variableInstallments && (
                            <div className="staged-form-row">
                                <div className="staged-form-field">
                                    <label htmlFor="minGap">
                                        Minimum Gap Between Installments <span className="staged-form-required">*</span>
                                    </label>
                                    <input
                                        id="minGap"
                                        type="number"
                                        min={1}
                                        value={formData.Settings?.minGap || ""}
                                        onChange={(e) =>
                                            handleFieldChange("Settings", "minGap", e.target.value)
                                        }
                                        className="staged-form-input"
                                        required
                                    />
                                </div>
                                <div className="staged-form-field">
                                    <label htmlFor="maxGap">
                                        Maximum Gap Between Installments <span className="staged-form-required">*</span>
                                    </label>
                                    <input
                                        id="maxGap"
                                        type="number"
                                        min={1}
                                        value={formData.Settings?.maxGap || ""}
                                        onChange={(e) =>
                                            handleFieldChange("Settings", "maxGap", e.target.value)
                                        }
                                        className="staged-form-input"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {/* Interest Recalculation */}
                        <h4 className="staged-form-section-title">Interest Recalculation</h4>
                        {/* Recalculate Interest */}
                        <div className="staged-form-field">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={formData.Settings?.recalculateInterest || false}
                                    onChange={(e) =>
                                        handleFieldChange("Settings", "recalculateInterest", e.target.checked)
                                    }
                                />
                                Recalculate Interest
                            </label>
                        </div>
                        {formData.Settings?.recalculateInterest && (
                            <>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="preClosureRule">
                                            Pre-Closure Interest Calculation Rule{" "}
                                            <span className="staged-form-required">*</span>
                                        </label>
                                        <select
                                            id="preClosureRule"
                                            value={formData.Settings?.preClosureRule || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Settings", "preClosureRule", e.target.value)
                                            }
                                            className="staged-form-select"
                                            required
                                        >
                                            {formData.loanProductTemplate?.preClosureInterestCalculationStrategyOptions.map(
                                                (option) => (
                                                    <option key={option.id} value={option.id}>
                                                        {option.value}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="advancePaymentType">
                                            Advance Payment Adjustment Type{" "}
                                            <span className="staged-form-required">*</span>
                                        </label>
                                        <select
                                            id="advancePaymentType"
                                            value={formData.Settings?.advancePaymentType || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Settings", "advancePaymentType", e.target.value)
                                            }
                                            className="staged-form-select"
                                            required
                                        >
                                            {formData.loanProductTemplate?.rescheduleStrategyTypeOptions.map(
                                                (option) => (
                                                    <option key={option.id} value={option.id}>
                                                        {option.value}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>
                                </div>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="compoundingOn">
                                            Interest Recalculation Compounding On{" "}
                                            <span className="staged-form-required">*</span>
                                        </label>
                                        <select
                                            id="compoundingOn"
                                            value={formData.Settings?.compoundingOn || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Settings", "compoundingOn", e.target.value)
                                            }
                                            className="staged-form-select"
                                            required
                                        >
                                            {formData.loanProductTemplate?.interestRecalculationCompoundingTypeOptions.map(
                                                (option) => (
                                                    <option key={option.id} value={option.id}>
                                                        {option.value}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="frequency">
                                            Frequency for Recalculating Outstanding Principal{" "}
                                            <span className="staged-form-required">*</span>
                                        </label>
                                        <select
                                            id="frequency"
                                            value={formData.Settings?.frequency || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Settings", "frequency", e.target.value)
                                            }
                                            className="staged-form-select"
                                            required
                                        >
                                            {formData.loanProductTemplate?.interestRecalculationFrequencyTypeOptions.map(
                                                (option) => (
                                                    <option key={option.id} value={option.id}>
                                                        {option.value}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>
                                </div>
                                <div className="staged-form-field">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={
                                                formData.Settings?.arrearsRecognitionBasedOnOriginalSchedule || false
                                            }
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    "Settings",
                                                    "arrearsRecognitionBasedOnOriginalSchedule",
                                                    e.target.checked
                                                )
                                            }
                                        />
                                        Is Arrears Recognition Based on Original Schedule?
                                    </label>
                                </div>
                            </>
                        )}

                        {/* Guarantee Requirements */}
                        <h4 className="staged-form-section-title">Guarantee Requirements</h4>
                        {/* Place Guarantee Funds On-Hold */}
                        <div className="staged-form-field">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={formData.Settings?.placeGuaranteeFundsOnHold || false}
                                    onChange={(e) =>
                                        handleFieldChange(
                                            "Settings",
                                            "placeGuaranteeFundsOnHold",
                                            e.target.checked
                                        )
                                    }
                                />
                                Place Guarantee Funds On-Hold
                            </label>
                        </div>
                        {formData.Settings?.placeGuaranteeFundsOnHold && (
                            <div className="staged-form-row">
                                <div className="staged-form-field">
                                    <label htmlFor="mandatoryGuarantee">
                                        Mandatory Guarantee (%) <span className="staged-form-required">*</span>
                                    </label>
                                    <input
                                        id="mandatoryGuarantee"
                                        type="number"
                                        min={0}
                                        value={formData.Settings?.mandatoryGuarantee || ""}
                                        onChange={(e) =>
                                            handleFieldChange("Settings", "mandatoryGuarantee", e.target.value)
                                        }
                                        className="staged-form-input"
                                        required
                                    />
                                </div>
                                <div className="staged-form-field">
                                    <label htmlFor="minOwnFunds">
                                        Minimum Guarantee from Own Funds (%){" "}
                                        <span className="staged-form-required">*</span>
                                    </label>
                                    <input
                                        id="minOwnFunds"
                                        type="number"
                                        min={0}
                                        value={formData.Settings?.minOwnFunds || ""}
                                        onChange={(e) =>
                                            handleFieldChange("Settings", "minOwnFunds", e.target.value)
                                        }
                                        className="staged-form-input"
                                        required
                                    />
                                </div>
                                <div className="staged-form-field">
                                    <label htmlFor="minGuarantorFunds">
                                        Minimum Guarantee from Guarantor Funds (%){" "}
                                        <span className="staged-form-required">*</span>
                                    </label>
                                    <input
                                        id="minGuarantorFunds"
                                        type="number"
                                        min={0}
                                        value={formData.Settings?.minGuarantorFunds || ""}
                                        onChange={(e) =>
                                            handleFieldChange("Settings", "minGuarantorFunds", e.target.value)
                                        }
                                        className="staged-form-input"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {/* Event Settings */}
                        <h4 className="staged-form-section-title">Event Settings</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={formData.Settings?.useGlobalRepaymentEventConfig || false}
                                        onChange={(e) =>
                                            handleFieldChange(
                                                "Settings",
                                                "useGlobalRepaymentEventConfig",
                                                e.target.checked
                                            )
                                        }
                                    />
                                    Use the Global Configurations Values for the Repayment Event (Notifications)
                                </label>
                            </div>
                        </div>
                        {!formData.Settings?.useGlobalRepaymentEventConfig && (
                            <div className="staged-form-row">
                                <div className="staged-form-field">
                                    <label htmlFor="dueDaysForRepayment">
                                        Due Days for Repayment Event
                                    </label>
                                    <input
                                        id="dueDaysForRepayment"
                                        type="number" min={0}
                                        value={formData.Settings?.dueDaysForRepayment || ""}
                                        onChange={(e) =>
                                            handleFieldChange("Settings", "dueDaysForRepayment", e.target.value)
                                        }
                                        className="staged-form-input"
                                    />
                                </div>
                                <div className="staged-form-field">
                                    <label htmlFor="overDueDaysForRepayment">
                                        Overdue Days for Repayment Event
                                    </label>
                                    <input
                                        id="overDueDaysForRepayment"
                                        type="number" min={0}
                                        value={formData.Settings?.overDueDaysForRepayment || ""}
                                        onChange={(e) =>
                                            handleFieldChange("Settings", "overDueDaysForRepayment", e.target.value)
                                        }
                                        className="staged-form-input"
                                    />
                                </div>
                            </div>
                        )}
                        {/* Configurable Terms and Settings */}
                        <h4 className="staged-form-section-title">Configurable Terms and Settings</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={formData.Settings?.allowOverridingTerms}
                                        onChange={(e) =>
                                            handleFieldChange("Settings", "allowOverridingTerms", e.target.checked)
                                        }
                                    />
                                    Allow Overriding Select Terms and Settings in Loan Accounts
                                </label>
                            </div>
                        </div>
                        {formData.Settings?.allowOverridingTerms && (
                            <>
                                {/* Row 1: Amortization and Interest Method */}
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={formData.Settings?.overrideAmortization ?? true} // Default to checked
                                                onChange={(e) =>
                                                    handleFieldChange("Settings", "overrideAmortization", e.target.checked)
                                                }
                                            />
                                            Amortization
                                        </label>
                                    </div>
                                    <div className="staged-form-field">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={formData.Settings?.overrideInterestMethod ?? true} // Default to checked
                                                onChange={(e) =>
                                                    handleFieldChange("Settings", "overrideInterestMethod", e.target.checked)
                                                }
                                            />
                                            Interest Method
                                        </label>
                                    </div>
                                </div>

                                {/* Row 2: Repayment Strategy and Interest Calculation Period */}
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={formData.Settings?.overrideRepaymentStrategy ?? true} // Default to checked
                                                onChange={(e) =>
                                                    handleFieldChange("Settings", "overrideRepaymentStrategy", e.target.checked)
                                                }
                                            />
                                            Repayment Strategy
                                        </label>
                                    </div>
                                    <div className="staged-form-field">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={formData.Settings?.overrideInterestCalculationPeriod ?? true} // Default to checked
                                                onChange={(e) =>
                                                    handleFieldChange("Settings", "overrideInterestCalculationPeriod", e.target.checked)
                                                }
                                            />
                                            Interest Calculation Period
                                        </label>
                                    </div>
                                </div>

                                {/* Row 3: Arrears Tolerance and Repaid Every */}
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={formData.Settings?.overrideArrearsTolerance ?? true} // Default to checked
                                                onChange={(e) =>
                                                    handleFieldChange("Settings", "overrideArrearsTolerance", e.target.checked)
                                                }
                                            />
                                            Arrears Tolerance
                                        </label>
                                    </div>
                                    <div className="staged-form-field">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={formData.Settings?.overrideRepaidEvery ?? true} // Default to checked
                                                onChange={(e) =>
                                                    handleFieldChange("Settings", "overrideRepaidEvery", e.target.checked)
                                                }
                                            />
                                            Repaid Every
                                        </label>
                                    </div>
                                </div>

                                {/* Row 4: Moratorium and Overdue Days */}
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={formData.Settings?.overrideMoratorium ?? true} // Default to checked
                                                onChange={(e) =>
                                                    handleFieldChange("Settings", "overrideMoratorium", e.target.checked)
                                                }
                                            />
                                            Moratorium
                                        </label>
                                    </div>
                                    <div className="staged-form-field">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={formData.Settings?.overrideOverdueDays ?? true} // Default to checked
                                                onChange={(e) =>
                                                    handleFieldChange("Settings", "overrideOverdueDays", e.target.checked)
                                                }
                                            />
                                            Number of Days a Loan May Be Overdue Before Moving Into Arrears
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                );
            case "Terms":
                return (
                    <div className="staged-form-terms">
                        {/* Principal Section */}
                        <h4 className="staged-form-section-title">Principal</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="principalMin">Minimum</label>
                                <input
                                    id="principalMin"
                                    type="number"
                                    value={formData.Terms?.principalMin || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Terms", "principalMin", e.target.value)
                                    }
                                    className="staged-form-input"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="principalDefault">
                                    Default <span className="staged-form-required">*</span>
                                </label>
                                <input
                                    id="principalDefault"
                                    type="number"
                                    value={formData.Terms?.principalDefault || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Terms", "principalDefault", e.target.value)
                                    }
                                    className={`staged-form-input ${
                                        errors.Terms?.principalDefault ? "staged-form-error" : ""
                                    }`}
                                    required
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="principalMax">Maximum</label>
                                <input
                                    id="principalMax"
                                    type="number"
                                    value={formData.Terms?.principalMax || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Terms", "principalMax", e.target.value)
                                    }
                                    className="staged-form-input"
                                />
                            </div>
                        </div>

                        {/* Allow Approval/Disbursal Above Loan Amount */}
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={formData.Terms?.allowApprovalAboveLoanAmount || false}
                                        onChange={(e) =>
                                            handleFieldChange(
                                                "Terms",
                                                "allowApprovalAboveLoanAmount",
                                                e.target.checked
                                            )
                                        }
                                    />
                                    Allow Approval/Disbursal Above Loan Applied Amount
                                </label>
                            </div>
                        </div>

                        {/* Over Amount Fields */}
                        {formData.Terms?.allowApprovalAboveLoanAmount && (
                            <div className="staged-form-row">
                                <div className="staged-form-field">
                                    <label htmlFor="overAmountCalcType">
                                        Over Amount Calculation Type{" "}
                                        <span className="staged-form-required">*</span>
                                    </label>
                                    <select
                                        id="overAmountCalcType"
                                        value={formData.Terms?.overAmountCalcType || ""}
                                        onChange={(e) =>
                                            handleFieldChange("Terms", "overAmountCalcType", e.target.value)
                                        }
                                        className="staged-form-select"
                                        required
                                    >
                                        <option value="">Select Calculation Type</option>
                                        <option value="percentage">Percentage</option>
                                        <option value="fixed">Fixed Amount</option>
                                    </select>
                                </div>
                                <div className="staged-form-field">
                                    <label htmlFor="overAmount">
                                        Over Amount <span className="staged-form-required">*</span>
                                    </label>
                                    <input
                                        id="overAmount"
                                        type="number"
                                        value={formData.Terms?.overAmount || ""}
                                        onChange={(e) =>
                                            handleFieldChange("Terms", "overAmount", e.target.value)
                                        }
                                        className={`staged-form-input ${
                                            errors.Terms?.overAmount ? "staged-form-error" : ""
                                        }`}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {/* Installment Day Calculation */}
                        <h4 className="staged-form-section-title">Installment Day Calculation</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="installmentDayCalcFrom">
                                    Installment Day Calculation From{" "}
                                    <span className="staged-form-required">*</span>
                                </label>
                                <select
                                    id="installmentDayCalcFrom"
                                    value={formData.Terms?.installmentDayCalcFrom || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Terms", "installmentDayCalcFrom", e.target.value)
                                    }
                                    className="staged-form-select"
                                    required
                                >
                                    <option value="">Select Option</option>
                                    {formData.loanProductTemplate?.repaymentStartDateTypeOptions?.map(
                                        (option) => (
                                            <option key={option.id} value={option.id}>
                                                {option.value}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>
                        </div>
                        {/* Number of Repayments */}
                        <h4 className="staged-form-section-title">Number of Repayments</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="repaymentMin">Minimum</label>
                                <input
                                    id="repaymentMin"
                                    type="number"
                                    value={formData.Terms?.repaymentMin || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Terms", "repaymentMin", e.target.value)
                                    }
                                    className="staged-form-input"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="repaymentDefault">
                                    Default <span className="staged-form-required">*</span>
                                </label>
                                <input
                                    id="repaymentDefault"
                                    type="number"
                                    value={formData.Terms?.repaymentDefault || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Terms", "repaymentDefault", e.target.value)
                                    }
                                    className={`staged-form-input ${
                                        errors.Terms?.repaymentDefault ? "staged-form-error" : ""
                                    }`}
                                    required
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="repaymentMax">Maximum</label>
                                <input
                                    id="repaymentMax"
                                    type="number"
                                    value={formData.Terms?.repaymentMax || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Terms", "repaymentMax", e.target.value)
                                    }
                                    className="staged-form-input"
                                />
                            </div>
                        </div>

                        {/* Interest Rates Section */}
                        <h4 className="staged-form-section-title">Interest Rates</h4>
                        <div className="staged-form-row">
                            {/* Is Zero Interest Rate? */}
                            {!formData.Terms?.isLinkedToFloatingRates && (
                                <div className="staged-form-field">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={formData.Terms?.isZeroInterestRate || false}
                                            onChange={(e) => {
                                                const isChecked = e.target.checked;
                                                handleFieldChange("Terms", "isZeroInterestRate", isChecked);
                                                if (isChecked) {
                                                    // Nullify values for floating interest and nominal interest rates
                                                    handleFieldChange("Terms", "isLinkedToFloatingRates", false);
                                                    handleFieldChange("Terms", "floatingRate", "");
                                                    handleFieldChange("Terms", "differentialRate", "");
                                                    handleFieldChange("Terms", "isFloatingCalcAllowed", false);
                                                    handleFieldChange("Terms", "floatingMin", "");
                                                    handleFieldChange("Terms", "floatingDefault", "");
                                                    handleFieldChange("Terms", "floatingMax", "");
                                                } else {
                                                    // Nullify nominal interest rate when unchecked
                                                    handleFieldChange("Terms", "nominalInterestMin", "");
                                                    handleFieldChange("Terms", "nominalInterestDefault", "");
                                                    handleFieldChange("Terms", "nominalInterestMax", "");
                                                }
                                            }}
                                        />
                                        Is Zero Interest Rate?
                                    </label>
                                </div>
                            )}

                            {/* Is Linked to Floating Interest Rates */}
                            {!formData.Terms?.isZeroInterestRate && (
                                <div className="staged-form-field">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={formData.Terms?.isLinkedToFloatingRates || false}
                                            onChange={(e) => {
                                                const isChecked = e.target.checked;
                                                handleFieldChange("Terms", "isLinkedToFloatingRates", isChecked);
                                                if (isChecked) {
                                                    // Nullify values for nominal interest rates
                                                    handleFieldChange("Terms", "nominalInterestMin", "");
                                                    handleFieldChange("Terms", "nominalInterestDefault", "");
                                                    handleFieldChange("Terms", "nominalInterestMax", "");
                                                } else {
                                                    // Nullify floating interest values when unchecked
                                                    handleFieldChange("Terms", "floatingRate", "");
                                                    handleFieldChange("Terms", "differentialRate", "");
                                                    handleFieldChange("Terms", "isFloatingCalcAllowed", false);
                                                    handleFieldChange("Terms", "floatingMin", "");
                                                    handleFieldChange("Terms", "floatingDefault", "");
                                                    handleFieldChange("Terms", "floatingMax", "");
                                                }
                                            }}
                                        />
                                        Is Linked to Floating Interest Rates?
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Nominal Interest Rate Logic */}
                        {!formData.Terms?.isZeroInterestRate &&
                            !formData.Terms?.isLinkedToFloatingRates && (
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="nominalInterestMin">Minimum</label>
                                        <input
                                            id="nominalInterestMin"
                                            type="number"
                                            value={formData.Terms?.nominalInterestMin || ""}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    "Terms",
                                                    "nominalInterestMin",
                                                    e.target.value
                                                )
                                            }
                                            className="staged-form-input"
                                        />
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="nominalInterestDefault">
                                            Default <span className="staged-form-required">*</span>
                                        </label>
                                        <input
                                            id="nominalInterestDefault"
                                            type="number"
                                            value={formData.Terms?.nominalInterestDefault || ""}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    "Terms",
                                                    "nominalInterestDefault",
                                                    e.target.value
                                                )
                                            }
                                            className={`staged-form-input ${
                                                errors.Terms?.nominalInterestDefault ? "staged-form-error" : ""
                                            }`}
                                            required
                                        />
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="nominalInterestMax">Maximum</label>
                                        <input
                                            id="nominalInterestMax"
                                            type="number"
                                            value={formData.Terms?.nominalInterestMax || ""}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    "Terms",
                                                    "nominalInterestMax",
                                                    e.target.value
                                                )
                                            }
                                            className="staged-form-input"
                                        />
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="frequency">
                                            Frequency <span className="staged-form-required">*</span>
                                        </label>
                                        <select
                                            id="frequency"
                                            value={formData.Terms?.frequency || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Terms", "frequency", e.target.value)
                                            }
                                            className="staged-form-select"
                                            required
                                        >
                                            <option value="">Select Frequency</option>
                                            {formData.loanProductTemplate?.interestRateFrequencyTypeOptions?.map((option) => (
                                                <option key={option.id} value={option.id}>
                                                    {option.value}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                        {/* Floating Interest Rate Logic */}
                        {formData.Terms?.isLinkedToFloatingRates && (
                            <>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="floatingRate">Floating Rate</label>
                                        <select
                                            id="floatingRate"
                                            value={formData.Terms?.floatingRate || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Terms", "floatingRate", e.target.value)
                                            }
                                            className="staged-form-select"
                                            required
                                        >
                                            <option value="">Select Floating Rate</option>
                                            {formData.loanProductTemplate?.floatingRateOptions?.map((option) => (
                                                <option key={option.id} value={option.id}>
                                                    {option.value}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="differentialRate">
                                            Differential Rate <span className="staged-form-required">*</span>
                                        </label>
                                        <input
                                            id="differentialRate"
                                            type="number"
                                            value={formData.Terms?.differentialRate || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Terms", "differentialRate", e.target.value)
                                            }
                                            className={`staged-form-input ${
                                                errors.Terms?.differentialRate ? "staged-form-error" : ""
                                            }`}
                                            required
                                        />
                                    </div>
                                    <div className="staged-form-field">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={formData.Terms?.isFloatingCalcAllowed || false}
                                                onChange={(e) =>
                                                    handleFieldChange(
                                                        "Terms",
                                                        "isFloatingCalcAllowed",
                                                        e.target.checked
                                                    )
                                                }
                                            />
                                            Is Floating Calculation Allowed?
                                        </label>
                                    </div>
                                </div>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="floatingMin">
                                            Minimum <span className="staged-form-required">*</span>
                                        </label>
                                        <input
                                            id="floatingMin"
                                            type="number"
                                            value={formData.Terms?.floatingMin || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Terms", "floatingMin", e.target.value)
                                            }
                                            className="staged-form-input"
                                            required
                                        />
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="floatingDefault">
                                            Default <span className="staged-form-required">*</span>
                                        </label>
                                        <input
                                            id="floatingDefault"
                                            type="number"
                                            value={formData.Terms?.floatingDefault || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Terms", "floatingDefault", e.target.value)
                                            }
                                            className={`staged-form-input ${
                                                errors.Terms?.floatingDefault ? "staged-form-error" : ""
                                            }`}
                                            required
                                        />
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="floatingMax">
                                            Maximum <span className="staged-form-required">*</span>
                                        </label>
                                        <input
                                            id="floatingMax"
                                            type="number"
                                            value={formData.Terms?.floatingMax || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Terms", "floatingMax", e.target.value)
                                            }
                                            className="staged-form-input"
                                            required
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                        {/* Variations Section */}
                        <h4 className="staged-form-section-title">Variations</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={formData.Terms?.termsVaryByLoanCycle || false}
                                        onChange={(e) => {
                                            const isChecked = e.target.checked;
                                            handleFieldChange("Terms", "termsVaryByLoanCycle", isChecked);

                                            if (!isChecked) {
                                                // Clear loan cycle data if unchecked
                                                setLoanCycleData({
                                                    principal: [],
                                                    repayments: [],
                                                    interest: [],
                                                });
                                            }
                                        }}
                                    />
                                    Terms Vary Based on Loan Cycle
                                </label>
                            </div>
                        </div>
                        {formData.Terms?.termsVaryByLoanCycle && (
                            <>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="principal">Principal by Loan Cycle</label>
                                    </div>
                                    <button
                                        onClick={() => openModal("principal")}
                                        className="staged-form-button-add"
                                    >
                                        Add
                                    </button>
                                </div>
                                {loanCycleData.principal?.length > 0 && (
                                    <table className="staged-form-table">
                                        <thead>
                                        <tr>
                                            <th>Condition</th>
                                            <th>Loan Cycle</th>
                                            <th>Minimum</th>
                                            <th>Default</th>
                                            <th>Maximum</th>
                                            <th>Actions</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {loanCycleData.principal.map((item, index) => {
                                            const conditionValue =
                                                formData.loanProductTemplate?.valueConditionTypeOptions?.find(
                                                    (option) => option.id.toString() === item.condition.toString()
                                                )?.value || "Unknown Condition";

                                            return (
                                                <tr key={item.id}>
                                                    <td>{conditionValue}</td>
                                                    <td>{item.loanCycle}</td>
                                                    <td>{item.min}</td>
                                                    <td>{item.default}</td>
                                                    <td>{item.max}</td>
                                                    <td>
                                                        <button
                                                            className="staged-form-icon-button-edit"
                                                            onClick={() => handleEditCycle("principal", index)}
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button
                                                            className="staged-form-icon-button-delete"
                                                            onClick={() => handleDeleteCycle("principal", item.id)}
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        </tbody>
                                    </table>
                                )}
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="repayments">Number of Repayments by Loan Cycle</label>
                                    </div>
                                    <button
                                        onClick={() => openModal("repayments")}
                                        className="staged-form-button-add"
                                    >
                                        Add
                                    </button>
                                </div>
                                {loanCycleData.repayments?.length > 0 && (
                                    <table className="staged-form-table">
                                        <thead>
                                        <tr>
                                            <th>Condition</th>
                                            <th>Loan Cycle</th>
                                            <th>Minimum</th>
                                            <th>Default</th>
                                            <th>Maximum</th>
                                            <th>Actions</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {loanCycleData.repayments.map((item, index) => {
                                            const conditionValue =
                                                formData.loanProductTemplate?.valueConditionTypeOptions?.find(
                                                    (option) => option.id.toString() === item.condition.toString()
                                                )?.value || "Unknown Condition";

                                            return (
                                                <tr key={item.id}>
                                                    <td>{conditionValue}</td>
                                                    <td>{item.loanCycle}</td>
                                                    <td>{item.min}</td>
                                                    <td>{item.default}</td>
                                                    <td>{item.max}</td>
                                                    <td>
                                                        <button
                                                            className="staged-form-icon-button-edit"
                                                            onClick={() => handleEditCycle("repayments", index)}
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button
                                                            className="staged-form-icon-button-delete"
                                                            onClick={() => handleDeleteCycle("repayments", item.id)}
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        </tbody>
                                    </table>
                                )}


                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="interest">Nominal Interest Rate by Loan Cycle</label>
                                    </div>
                                    <button
                                        onClick={() => openModal("interest")}
                                        className="staged-form-button-add"
                                    >
                                        Add
                                    </button>
                                </div>
                                {loanCycleData.interest?.length > 0 && (
                                    <table className="staged-form-table">
                                        <thead>
                                        <tr>
                                            <th>Condition</th>
                                            <th>Loan Cycle</th>
                                            <th>Minimum</th>
                                            <th>Default</th>
                                            <th>Maximum</th>
                                            <th>Actions</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {loanCycleData.interest.map((item, index) => {
                                            const conditionValue =
                                                formData.loanProductTemplate?.valueConditionTypeOptions?.find(
                                                    (option) => option.id.toString() === item.condition.toString()
                                                )?.value || "Unknown Condition"; // Fallback to "Unknown Condition"

                                            return (
                                                <tr key={item.id}>
                                                    <td>{conditionValue}</td>
                                                    <td>{item.loanCycle}</td>
                                                    <td>{item.min}</td>
                                                    <td>{item.default}</td>
                                                    <td>{item.max}</td>
                                                    <td>
                                                        <button
                                                            className="staged-form-icon-button-edit"
                                                            onClick={() => handleEditCycle("interest", index)}
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button
                                                            className="staged-form-icon-button-delete"
                                                            onClick={() => handleDeleteCycle("interest", item.id)}
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        </tbody>
                                    </table>
                                )}

                            </>
                        )}


                        {/* Repaid Every Section */}
                        <h4 className="staged-form-section-title">Repaid Every</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="frequencyRepaid">
                                    Frequency <span className="staged-form-required">*</span>
                                </label>
                                <input
                                    id="frequencyRepaid"
                                    type="number"
                                    value={formData.Terms?.frequencyRepaid || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Terms", "frequencyRepaid", e.target.value)
                                    }
                                    className={`staged-form-input ${
                                        errors.Terms?.frequencyRepaid ? "staged-form-error" : ""
                                    }`}
                                    required
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="frequencyType">
                                    Frequency Type <span className="staged-form-required">*</span>
                                </label>
                                <select
                                    id="frequencyType"
                                    value={formData.Terms?.frequencyType || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Terms", "frequencyType", e.target.value)
                                    }
                                    className="staged-form-select"
                                    required
                                >
                                    <option value="">Select Type</option>
                                    {formData.loanProductTemplate?.repaymentFrequencyTypeOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Minimum Days Between Disbursal and First Repayment Date */}
                        <div className="staged-form-field">
                            <label htmlFor="minDaysDisbursalToRepayment">
                                Minimum Days Between Disbursal and First Repayment Date
                            </label>
                            <input
                                id="minDaysDisbursalToRepayment"
                                type="number"
                                value={formData.Terms?.minDaysDisbursalToRepayment || ""}
                                onChange={(e) =>
                                    handleFieldChange("Terms", "minDaysDisbursalToRepayment", e.target.value)
                                }
                                className="staged-form-input"
                            />
                        </div>
                    </div>
                );
            case "Charges":
                return (
                    <div className="staged-form-charges">
                        <h4 className="staged-form-section-title">Charges</h4>

                        {/* Regular Charges */}
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="charge">Charge</label>
                                <select
                                    id="charge"
                                    value={formData.Charges?.selectedCharge || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Charges", "selectedCharge", e.target.value)
                                    }
                                    className="staged-form-select"
                                >
                                    <option value="">Select Charge</option>
                                    {formData.loanProductTemplate?.chargeOptions
                                        ?.filter(
                                            (option) =>
                                                !loanCycleData.charges?.some(
                                                    (item) => parseInt(item.charge) === option.id
                                                )
                                        )
                                        .map((option) => (
                                            <option key={option.id} value={option.id}>
                                                {option.name}
                                            </option>
                                        ))}
                                </select>

                            </div>
                            <button
                                className="staged-form-button-add"
                                onClick={() => {
                                    if (formData.Charges?.selectedCharge) {
                                        setLoanCycleData((prevData) => ({
                                            ...prevData,
                                            charges: [
                                                ...(prevData.charges || []),
                                                {id: Date.now(), charge: formData.Charges.selectedCharge},
                                            ],
                                        }));
                                        handleFieldChange("Charges", "selectedCharge", "");
                                    }
                                }}
                                disabled={!formData.Charges?.selectedCharge}
                            >
                                Add
                            </button>
                        </div>
                        {loanCycleData.charges?.length > 0 && (
                            <table className="staged-form-table">
                                <thead>
                                <tr>
                                    <th>Charge</th>
                                    <th>Calculation Type</th>
                                    <th>Payment Mode</th>
                                    <th>Charge Time Type</th>
                                    <th>Currency</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {loanCycleData.charges.map((item, index) => {
                                    const chargeValue = formData.loanProductTemplate?.chargeOptions?.find(
                                        (option) => option.id === parseInt(item.charge)
                                    )?.name || item.charge;
                                    const calculationType = formData.loanProductTemplate?.chargeOptions?.find(
                                        (option) => option.id === parseInt(item.charge)
                                    )?.chargeCalculationType.value || item.charge;
                                    const paymentMode = formData.loanProductTemplate?.chargeOptions?.find(
                                        (option) => option.id === parseInt(item.charge)
                                    )?.chargePaymentMode.value || item.charge;
                                    const chargeTimeType = formData.loanProductTemplate?.chargeOptions?.find(
                                        (option) => option.id === parseInt(item.charge)
                                    )?.chargeTimeType.value || item.charge;
                                    const currency = formData.loanProductTemplate?.chargeOptions?.find(
                                        (option) => option.id === parseInt(item.charge)
                                    )?.currency.name || item.charge;

                                    return (
                                        <tr key={item.id}>
                                            <td>{chargeValue}</td>
                                            <td>{calculationType}</td>
                                            <td>{paymentMode}</td>
                                            <td>{chargeTimeType}</td>
                                            <td>{currency}</td>
                                            <td>
                                                <button
                                                    className="staged-form-icon-button-delete"
                                                    onClick={() => {
                                                        setLoanCycleData((prevData) => ({
                                                            ...prevData,
                                                            charges: prevData.charges.filter((_, i) => i !== index),
                                                        }));
                                                    }}
                                                >
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        )}

                        {/* Overdue Charges */}
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="overdueCharge">Overdue Charges</label>
                                <select
                                    id="overdueCharge"
                                    value={formData.Charges?.selectedOverdueCharge || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Charges", "selectedOverdueCharge", e.target.value)
                                    }
                                    className="staged-form-select"
                                >
                                    <option value="">Select Overdue Charge</option>
                                    {formData.loanProductTemplate?.overdueChargeOptions
                                        ?.filter(
                                            (option) =>
                                                !loanCycleData.overdueCharges?.some(
                                                    (item) => parseInt(item.overdueCharge) === option.id
                                                )
                                        )
                                        .map((option) => (
                                            <option key={option.id} value={option.id}>
                                                {option.name}
                                            </option>
                                        ))}
                                </select>
                            </div>
                            <button
                                className="staged-form-button-add"
                                onClick={() => {
                                    if (formData.Charges?.selectedOverdueCharge) {
                                        setLoanCycleData((prevData) => ({
                                            ...prevData,
                                            overdueCharges: [
                                                ...(prevData.overdueCharges || []),
                                                {
                                                    id: Date.now(),
                                                    overdueCharge: formData.Charges.selectedOverdueCharge,
                                                },
                                            ],
                                        }));
                                        handleFieldChange("Charges", "selectedOverdueCharge", "");
                                    }
                                }}
                                disabled={!formData.Charges?.selectedOverdueCharge}
                            >
                                Add
                            </button>
                        </div>
                        {loanCycleData.overdueCharges?.length > 0 && (
                            <table className="staged-form-table">
                                <thead>
                                <tr>
                                    <th>Overdue Charge</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {loanCycleData.overdueCharges.map((item, index) => {
                                    const overdueChargeValue = formData.loanProductTemplate?.overdueChargeOptions?.find(
                                        (option) => option.id === parseInt(item.overdueCharge)
                                    )?.value || item.overdueCharge;

                                    return (
                                        <tr key={item.id}>
                                            <td>{overdueChargeValue}</td>
                                            <td>
                                                <button
                                                    className="staged-form-icon-button-delete"
                                                    onClick={() => {
                                                        setLoanCycleData((prevData) => ({
                                                            ...prevData,
                                                            overdueCharges: prevData.overdueCharges.filter((_, i) => i !== index),
                                                        }));
                                                    }}
                                                >
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        )}
                    </div>
                );
            case "Accounting":
                return (
                    <div className="staged-form-accounting">
                        <h4 className="staged-form-section-title">Accounting</h4>
                        {/* Radio Buttons for Selection */}
                        <div className="staged-form-radio-group">
                            {["None", "Cash Based", "Accrual Periodic", "Accrual Upfront"].map((option) => (
                                <label key={option} className="staged-form-radio-option">
                                    <input
                                        type="radio"
                                        name="accountingOption"
                                        value={option}
                                        checked={formData.Accounting?.selectedOption === option}
                                        onChange={(e) =>
                                            handleFieldChange("Accounting", "selectedOption", e.target.value)
                                        }
                                    />
                                    {option}
                                </label>
                            ))}
                        </div>

                        {/* Render Fields Based on Selected Option */}
                        {formData.Accounting?.selectedOption === "Cash Based" && (
                            <>
                                <h5>Assets / Liabilities</h5>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="fundSource">Fund Source</label>
                                        <select
                                            id="fundSource"
                                            value={formData.Accounting?.fundSource || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "fundSource", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Fund Source</option>
                                            {[
                                                ...(Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.assetAccountOptions)
                                                    ? formData.loanProductTemplate.accountingMappingOptions.assetAccountOptions
                                                    : []),
                                                ...(Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.liabilityAccountOptions)
                                                    ? formData.loanProductTemplate.accountingMappingOptions.liabilityAccountOptions
                                                    : [])
                                            ].map((option) => (
                                                <option key={option.id} value={option.id}>
                                                    ({option.glCode})---{option.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Assets Section */}
                                <h5>Assets</h5>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="loanPortfolio">Loan Portfolio</label>
                                        <select
                                            id="loanPortfolio"
                                            value={formData.Accounting?.loanPortfolio || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "loanPortfolio", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Loan Portfolio</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.assetAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.assetAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="transferSuspense">Transfer in Suspense</label>
                                        <select
                                            id="transferSuspense"
                                            value={formData.Accounting?.transferSuspense || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "transferSuspense", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Transfer in Suspense</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.assetAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.assetAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Income Section */}
                                <h5>Income</h5>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="incomeInterest">Income from Interest</label>
                                        <select
                                            id="incomeInterest"
                                            value={formData.Accounting?.incomeInterest || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "incomeInterest", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Income from Interest</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="incomeFees">Income from Fees</label>
                                        <select
                                            id="incomeFees"
                                            value={formData.Accounting?.incomeFees || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "incomeFees", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Income from Fees</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="incomePenalties">Income from Penalties</label>
                                        <select
                                            id="incomePenalties"
                                            value={formData.Accounting?.incomePenalties || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "incomePenalties", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Income from Penalties</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="incomeRecovery">Income from Recovery Repayments</label>
                                        <select
                                            id="incomeRecovery"
                                            value={formData.Accounting?.incomeRecovery || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "incomeRecovery", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Income from Recovery Repayments</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="incomeChargeOffInterest">Income from Charge-Off Interest</label>
                                        <select
                                            id="incomeChargeOffInterest"
                                            value={formData.Accounting?.incomeChargeOffInterest || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "incomeChargeOffInterest", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Income from Charge-Off Interest</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="incomeChargeOffFees">Income from Charge-Off Fees</label>
                                        <select
                                            id="incomeChargeOffFees"
                                            value={formData.Accounting?.incomeChargeOffFees || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "incomeChargeOffFees", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Income from Charge-Off Fees</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="incomeChargeOffPenalty">Income from Charge-Off Penalty</label>
                                        <select
                                            id="incomeChargeOffPenalty"
                                            value={formData.Accounting?.incomeChargeOffPenalty || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "incomeChargeOffPenalty", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Income from Charge-Off Penalty</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="incomeGoodwillCreditInterest">
                                            Income from Goodwill Credit Interest
                                        </label>
                                        <select
                                            id="incomeGoodwillCreditInterest"
                                            value={formData.Accounting?.incomeGoodwillCreditInterest || ""}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    "Accounting",
                                                    "incomeGoodwillCreditInterest",
                                                    e.target.value
                                                )
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Income from Goodwill Credit Interest</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="incomeGoodwillCreditFees">Income from Goodwill Credit
                                            Fees</label>
                                        <select
                                            id="incomeGoodwillCreditFees"
                                            value={formData.Accounting?.incomeGoodwillCreditFees || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "incomeGoodwillCreditFees", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Income from Goodwill Credit Fees</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="incomeGoodwillCreditPenalty">
                                            Income from Goodwill Credit Penalty
                                        </label>
                                        <select
                                            id="incomeGoodwillCreditPenalty"
                                            value={formData.Accounting?.incomeGoodwillCreditPenalty || ""}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    "Accounting",
                                                    "incomeGoodwillCreditPenalty",
                                                    e.target.value
                                                )
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Income from Goodwill Credit Penalty</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Expenses Section */}
                                <h5>Expenses</h5>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="lossesWrittenOff">Losses Written Off</label>
                                        <select
                                            id="lossesWrittenOff"
                                            value={formData.Accounting?.lossesWrittenOff || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "lossesWrittenOff", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Losses Written Off</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.expenseAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.expenseAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="goodwillCreditExpenses">Goodwill Credit Expenses</label>
                                        <select
                                            id="goodwillCreditExpenses"
                                            value={formData.Accounting?.goodwillCreditExpenses || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "goodwillCreditExpenses", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Goodwill Credit Expenses</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.expenseAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.expenseAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="chargeOffExpense">Charge-Off Expense</label>
                                        <select
                                            id="chargeOffExpense"
                                            value={formData.Accounting?.chargeOffExpense || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "chargeOffExpense", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Charge-Off Expense</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.expenseAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.expenseAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="chargeOffFraudExpense">Charge-Off Fraud Expense</label>
                                        <select
                                            id="chargeOffFraudExpense"
                                            value={formData.Accounting?.chargeOffFraudExpense || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "chargeOffFraudExpense", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Charge-Off Fraud Expense</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.expenseAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.expenseAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>

                                <h5>Liabilities</h5>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="overpaymentLiability">Overpayment Liability</label>
                                        <select
                                            id="overpaymentLiability"
                                            value={formData.Accounting?.overpaymentLiability || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "overpaymentLiability", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Overpayment Liability</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.liabilityAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.liabilityAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={formData.Accounting?.advancedAccountingRules || false}
                                                onChange={(e) =>
                                                    handleFieldChange(
                                                        "Accounting",
                                                        "advancedAccountingRules",
                                                        e.target.checked
                                                    )
                                                }
                                            />
                                            Advanced Accounting Rules
                                        </label>
                                    </div>
                                </div>
                                {formData.Accounting?.advancedAccountingRules && (
                                    <>
                                        <h5>Advanced Accounting Rules</h5>
                                        <div className="staged-form-row">
                                            <button
                                                className="staged-form-button-add"
                                                onClick={() => handleAddAdvancedRule("fundSources")}
                                            >
                                                Configure Fund Sources for Payment Channels
                                            </button>
                                        </div>
                                        <div className="staged-form-row">
                                            <button
                                                className="staged-form-button-add"
                                                onClick={() => handleAddAdvancedRule("mapFees")}
                                            >
                                                Map Fees to Specific Income Accounts
                                            </button>
                                        </div>
                                        <div className="staged-form-row">
                                            <button
                                                className="staged-form-button-add"
                                                onClick={() => handleAddAdvancedRule("mapPenalties")}
                                            >
                                                Map Penalties to Specific Income Accounts
                                            </button>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                        {/* Accrual (periodic) */}
                        {formData.Accounting?.selectedOption === "Accrual Periodic" && (
                            <>
                                {/* Assets / Liabilities Section */}
                                <h5>Assets / Liabilities</h5>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="fundSource">Fund Source</label>
                                        <select
                                            id="fundSource"
                                            value={formData.Accounting?.fundSource || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "fundSource", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Fund Source</option>
                                            {[
                                                ...(Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.assetAccountOptions)
                                                    ? formData.loanProductTemplate.accountingMappingOptions.assetAccountOptions
                                                    : []),
                                                ...(Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.liabilityAccountOptions)
                                                    ? formData.loanProductTemplate.accountingMappingOptions.liabilityAccountOptions
                                                    : [])
                                            ].map((option) => (
                                                <option key={option.id} value={option.id}>
                                                    ({option.glCode})---{option.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <h5>Assets</h5>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="loanPortfolio">Loan Portfolio</label>
                                        <select
                                            id="loanPortfolio"
                                            value={formData.Accounting?.loanPortfolio || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "loanPortfolio", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Loan Portfolio</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.assetAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.assetAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="transferSuspense">Transfer in Suspense</label>
                                        <select
                                            id="transferSuspense"
                                            value={formData.Accounting?.transferSuspense || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "transferSuspense", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Transfer in Suspense</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.assetAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.assetAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="interestReceivable">Interest Receivable</label>
                                        <select
                                            id="interestReceivable"
                                            value={formData.Accounting?.interestReceivable || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "interestReceivable", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Interest Receivable</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.assetAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.assetAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="feesReceivable">Fees Receivable</label>
                                        <select
                                            id="feesReceivable"
                                            value={formData.Accounting?.feesReceivable || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "feesReceivable", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Fees Receivable</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.assetAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.assetAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="penaltiesReceivable">Penalties Receivable</label>
                                        <select
                                            id="penaltiesReceivable"
                                            value={formData.Accounting?.penaltiesReceivable || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "penaltiesReceivable", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Penalties Receivable</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.assetAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.assetAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Income Section */}
                                <h5>Income</h5>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="incomeInterest">Income from Interest</label>
                                        <select
                                            id="incomeInterest"
                                            value={formData.Accounting?.incomeInterest || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "incomeInterest", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Income from Interest</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="incomeFees">Income from Fees</label>
                                        <select
                                            id="incomeFees"
                                            value={formData.Accounting?.incomeFees || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "incomeFees", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Income from Fees</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="incomePenalties">Income from Penalties</label>
                                        <select
                                            id="incomePenalties"
                                            value={formData.Accounting?.incomePenalties || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "incomePenalties", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Income from Penalties</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="incomeRecovery">Income from Recovery Repayments</label>
                                        <select
                                            id="incomeRecovery"
                                            value={formData.Accounting?.incomeRecovery || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "incomeRecovery", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Income from Recovery Repayments</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="incomeChargeOffInterest">Income from Charge-Off Interest</label>
                                        <select
                                            id="incomeChargeOffInterest"
                                            value={formData.Accounting?.incomeChargeOffInterest || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "incomeChargeOffInterest", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Income from Charge-Off Interest</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="incomeChargeOffFees">Income from Charge-Off Fees</label>
                                        <select
                                            id="incomeChargeOffFees"
                                            value={formData.Accounting?.incomeChargeOffFees || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "incomeChargeOffFees", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Income from Charge-Off Fees</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="incomeChargeOffPenalty">Income from Charge-Off Penalty</label>
                                        <select
                                            id="incomeChargeOffPenalty"
                                            value={formData.Accounting?.incomeChargeOffPenalty || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "incomeChargeOffPenalty", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Income from Charge-Off Penalty</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="incomeGoodwillCreditInterest">
                                            Income from Goodwill Credit Interest
                                        </label>
                                        <select
                                            id="incomeGoodwillCreditInterest"
                                            value={formData.Accounting?.incomeGoodwillCreditInterest || ""}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    "Accounting",
                                                    "incomeGoodwillCreditInterest",
                                                    e.target.value
                                                )
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Income from Goodwill Credit Interest</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="incomeGoodwillCreditFees">Income from Goodwill Credit Fees</label>
                                        <select
                                            id="incomeGoodwillCreditFees"
                                            value={formData.Accounting?.incomeGoodwillCreditFees || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "incomeGoodwillCreditFees", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Income from Goodwill Credit Fees</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="incomeGoodwillCreditPenalty">
                                            Income from Goodwill Credit Penalty
                                        </label>
                                        <select
                                            id="incomeGoodwillCreditPenalty"
                                            value={formData.Accounting?.incomeGoodwillCreditPenalty || ""}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    "Accounting",
                                                    "incomeGoodwillCreditPenalty",
                                                    e.target.value
                                                )
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Income from Goodwill Credit Penalty</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Expenses Section */}
                                <h5>Expenses</h5>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="lossesWrittenOff">Losses Written Off</label>
                                        <select
                                            id="lossesWrittenOff"
                                            value={formData.Accounting?.lossesWrittenOff || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "lossesWrittenOff", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Losses Written Off</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.expenseAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.expenseAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="goodwillCreditExpenses">Goodwill Credit Expenses</label>
                                        <select
                                            id="goodwillCreditExpenses"
                                            value={formData.Accounting?.goodwillCreditExpenses || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "goodwillCreditExpenses", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Goodwill Credit Expenses</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.expenseAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.expenseAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="chargeOffExpense">Charge-Off Expense</label>
                                        <select
                                            id="chargeOffExpense"
                                            value={formData.Accounting?.chargeOffExpense || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "chargeOffExpense", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Charge-Off Expense</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.expenseAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.expenseAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="chargeOffFraudExpense">Charge-Off Fraud Expense</label>
                                        <select
                                            id="chargeOffFraudExpense"
                                            value={formData.Accounting?.chargeOffFraudExpense || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "chargeOffFraudExpense", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Charge-Off Fraud Expense</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.expenseAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.expenseAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>

                                <h5>Liabilities</h5>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="overpaymentLiability">Overpayment Liability</label>
                                        <select
                                            id="overpaymentLiability"
                                            value={formData.Accounting?.overpaymentLiability || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "overpaymentLiability", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Overpayment Liability</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.liabilityAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.liabilityAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={formData.Accounting?.advancedAccountingRules || false}
                                                onChange={(e) =>
                                                    handleFieldChange(
                                                        "Accounting",
                                                        "advancedAccountingRules",
                                                        e.target.checked
                                                    )
                                                }
                                            />
                                            Advanced Accounting Rules
                                        </label>
                                    </div>
                                </div>
                                {formData.Accounting?.advancedAccountingRules && (
                                    <>
                                        <h5>Advanced Accounting Rules</h5>
                                        <div className="staged-form-row">
                                            <button
                                                className="staged-form-button-add"
                                                onClick={() => handleAddAdvancedRule("fundSources")}
                                            >
                                                Configure Fund Sources for Payment Channels
                                            </button>
                                        </div>
                                        <div className="staged-form-row">
                                            <button
                                                className="staged-form-button-add"
                                                onClick={() => handleAddAdvancedRule("mapFees")}
                                            >
                                                Map Fees to Specific Income Accounts
                                            </button>
                                        </div>
                                        <div className="staged-form-row">
                                            <button
                                                className="staged-form-button-add"
                                                onClick={() => handleAddAdvancedRule("mapPenalties")}
                                            >
                                                Map Penalties to Specific Income Accounts
                                            </button>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                        {/* Accrual (upfront) */}
                        {formData.Accounting?.selectedOption === "Accrual Upfront" && (
                            <>
                                <h4>Assets / Liabilities</h4>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="fundSource">Fund Source</label>
                                        <select
                                            id="fundSource"
                                            value={formData.Accounting?.fundSource || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "fundSource", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Fund Source</option>
                                            <option value="">Select Fund Source</option>
                                            {[
                                                ...(Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.assetAccountOptions)
                                                    ? formData.loanProductTemplate.accountingMappingOptions.assetAccountOptions
                                                    : []),
                                                ...(Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.liabilityAccountOptions)
                                                    ? formData.loanProductTemplate.accountingMappingOptions.liabilityAccountOptions
                                                    : [])
                                            ].map((option) => (
                                                <option key={option.id} value={option.id}>
                                                    ({option.glCode})---{option.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <h4>Assets</h4>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="loanPortfolio">Loan Portfolio</label>
                                        <select
                                            id="loanPortfolio"
                                            value={formData.Accounting?.loanPortfolio || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "loanPortfolio", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Loan Portfolio</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.assetAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.assetAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="transferSuspense">Transfer in Suspense</label>
                                        <select
                                            id="transferSuspense"
                                            value={formData.Accounting?.transferSuspense || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "transferSuspense", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Transfer in Suspense</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.assetAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.assetAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="interestReceivable">Interest Receivable</label>
                                        <select
                                            id="interestReceivable"
                                            value={formData.Accounting?.interestReceivable || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "interestReceivable", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Interest Receivable</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.assetAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.assetAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="feesReceivable">Fees Receivable</label>
                                        <select
                                            id="feesReceivable"
                                            value={formData.Accounting?.feesReceivable || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "feesReceivable", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Fees Receivable</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.assetAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.assetAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="penaltiesReceivable">Penalties Receivable</label>
                                        <select
                                            id="penaltiesReceivable"
                                            value={formData.Accounting?.penaltiesReceivable || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "penaltiesReceivable", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Penalties Receivable</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.assetAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.assetAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Income Section */}
                                <h5>Income</h5>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="incomeInterest">Income from Interest</label>
                                        <select
                                            id="incomeInterest"
                                            value={formData.Accounting?.incomeInterest || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "incomeInterest", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Income from Interest</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="incomeFees">Income from Fees</label>
                                        <select
                                            id="incomeFees"
                                            value={formData.Accounting?.incomeFees || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "incomeFees", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Income from Fees</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="incomePenalties">Income from Penalties</label>
                                        <select
                                            id="incomePenalties"
                                            value={formData.Accounting?.incomePenalties || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "incomePenalties", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Income from Penalties</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="incomeRecovery">Income from Recovery Repayments</label>
                                        <select
                                            id="incomeRecovery"
                                            value={formData.Accounting?.incomeRecovery || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "incomeRecovery", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Income from Recovery Repayments</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="incomeChargeOffInterest">Income from Charge-Off Interest</label>
                                        <select
                                            id="incomeChargeOffInterest"
                                            value={formData.Accounting?.incomeChargeOffInterest || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "incomeChargeOffInterest", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Income from Charge-Off Interest</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="incomeChargeOffFees">Income from Charge-Off Fees</label>
                                        <select
                                            id="incomeChargeOffFees"
                                            value={formData.Accounting?.incomeChargeOffFees || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "incomeChargeOffFees", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Income from Charge-Off Fees</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="incomeChargeOffPenalty">Income from Charge-Off Penalty</label>
                                        <select
                                            id="incomeChargeOffPenalty"
                                            value={formData.Accounting?.incomeChargeOffPenalty || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "incomeChargeOffPenalty", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Income from Charge-Off Penalty</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="incomeGoodwillCreditInterest">
                                            Income from Goodwill Credit Interest
                                        </label>
                                        <select
                                            id="incomeGoodwillCreditInterest"
                                            value={formData.Accounting?.incomeGoodwillCreditInterest || ""}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    "Accounting",
                                                    "incomeGoodwillCreditInterest",
                                                    e.target.value
                                                )
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Income from Goodwill Credit Interest</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="incomeGoodwillCreditFees">Income from Goodwill Credit Fees</label>
                                        <select
                                            id="incomeGoodwillCreditFees"
                                            value={formData.Accounting?.incomeGoodwillCreditFees || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "incomeGoodwillCreditFees", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Income from Goodwill Credit Fees</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="incomeGoodwillCreditPenalty">
                                            Income from Goodwill Credit Penalty
                                        </label>
                                        <select
                                            id="incomeGoodwillCreditPenalty"
                                            value={formData.Accounting?.incomeGoodwillCreditPenalty || ""}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    "Accounting",
                                                    "incomeGoodwillCreditPenalty",
                                                    e.target.value
                                                )
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Income from Goodwill Credit Penalty</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Expenses Section */}
                                <h5>Expenses</h5>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="lossesWrittenOff">Losses Written Off</label>
                                        <select
                                            id="lossesWrittenOff"
                                            value={formData.Accounting?.lossesWrittenOff || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "lossesWrittenOff", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Losses Written Off</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.expenseAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.expenseAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="goodwillCreditExpenses">Goodwill Credit Expenses</label>
                                        <select
                                            id="goodwillCreditExpenses"
                                            value={formData.Accounting?.goodwillCreditExpenses || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "goodwillCreditExpenses", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Goodwill Credit Expenses</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.expenseAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.expenseAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="chargeOffExpense">Charge-Off Expense</label>
                                        <select
                                            id="chargeOffExpense"
                                            value={formData.Accounting?.chargeOffExpense || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "chargeOffExpense", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Charge-Off Expense</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.expenseAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.expenseAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="chargeOffFraudExpense">Charge-Off Fraud Expense</label>
                                        <select
                                            id="chargeOffFraudExpense"
                                            value={formData.Accounting?.chargeOffFraudExpense || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "chargeOffFraudExpense", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Charge-Off Fraud Expense</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.expenseAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.expenseAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>


                                <h4>Liabilities</h4>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="overpaymentLiability">Overpayment Liability</label>
                                        <select
                                            id="overpaymentLiability"
                                            value={formData.Accounting?.overpaymentLiability || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "overpaymentLiability", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Overpayment Liability</option>
                                            {Array.isArray(formData.loanProductTemplate?.accountingMappingOptions?.liabilityAccountOptions) &&
                                                formData.loanProductTemplate?.accountingMappingOptions?.liabilityAccountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        ({option.glCode})---{option.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={formData.Accounting?.advancedAccountingRules || false}
                                                onChange={(e) =>
                                                    handleFieldChange(
                                                        "Accounting",
                                                        "advancedAccountingRules",
                                                        e.target.checked
                                                    )
                                                }
                                            />
                                            Advanced Accounting Rules
                                        </label>
                                    </div>
                                </div>
                                {formData.Accounting?.advancedAccountingRules && (
                                    <>
                                        <h5>Advanced Accounting Rules</h5>
                                        <div className="staged-form-row">
                                            <button
                                                className="staged-form-button-add"
                                                onClick={() => handleAddAdvancedRule("fundSources")}
                                            >
                                                Configure Fund Sources for Payment Channels
                                            </button>
                                        </div>
                                        <div className="staged-form-row">
                                            <button
                                                className="staged-form-button-add"
                                                onClick={() => handleAddAdvancedRule("mapFees")}
                                            >
                                                Map Fees to Specific Income Accounts
                                            </button>
                                        </div>
                                        <div className="staged-form-row">
                                            <button
                                                className="staged-form-button-add"
                                                onClick={() => handleAddAdvancedRule("mapPenalties")}
                                            >
                                                Map Penalties to Specific Income Accounts
                                            </button>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    const renderStageTracker = () => {
        const trackerStages = allStagesComplete
            ? [...stages, "Preview"]
            : stages;

        return (
            <div className="staged-form-stage-tracker">
                {trackerStages.map((stage, index) => (
                    <React.Fragment key={stage}>
                    <div
                            className={`staged-form-stage ${
                                index === currentStage
                                    ? "staged-form-active"
                                    : completedStages.has(stage)
                                        ? "staged-form-completed"
                                        : "staged-form-unvisited"
                            }`}
                            onClick={() => {
                                if (stage === "Preview" || completedStages.has(stage)) {
                                    setCurrentStage(index);
                                }
                            }}
                        >
                            <span className="staged-form-stage-circle">{index + 1}</span>
                            <span className="staged-form-stage-label">{stage}</span>
                        </div>
                    </React.Fragment>
                ))}
            </div>
        );
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
        const stageData = [
            { title: "Details", data: {
                "Product Name": formData?.Details?.productName,
                "Short Name": formData?.Details?.shortName,
                "Fund": formData?.Details?.fund
                    ? formData?.loanProductTemplate?.fundOptions?.find(f => f.id === parseInt(formData?.Details?.fund, 10))?.name
                    : '',
                "Include In Customer Loan Counter": formData?.Details?.includeInCustomerLoanCounter
                    ? 'Yes'
                    : 'No',
                "Start Date": formatDateForPreview(formData?.Details?.startDate),
                "Close Date": formatDateForPreview(formData?.Details?.closeDate),
                "Description": formData?.Details?.description
                },
            },
            { title: "Currency", data: {
                    "Currency": formData?.Currency?.currency
                        ? formData?.loanProductTemplate?.currencyOptions.find(f => f.code === formData?.Currency?.currency)?.name
                        : '',
                    "Currency In Multiples Of": formData?.Currency?.currencyMultiples,
                    "Decimal Place": formData?.Currency?.decimalPlaces,
                    "Installment In Multiples Of": formData?.Currency?.installmentMultiples,
                },
            },
            {
                title: "Settings",
                data: {
                    Amortization: formData?.loanProductTemplate?.amortizationTypeOptions?.find(
                        (option) => option.id === parseInt(formData.Settings?.amortization)
                    )?.value || "",
                    "Interest Method": formData?.loanProductTemplate?.interestTypeOptions?.find(
                        (option) => option.id === parseInt(formData?.Settings?.interestMethod)
                    )?.value || "",
                    "Interest Calculation Period": formData?.loanProductTemplate?.interestCalculationPeriodTypeOptions?.find(
                        (option) => option.id === parseInt(formData?.Settings?.interestCalculationPeriod)
                    )?.value || "",
                    "Is Equal Amortization": formData?.Settings?.isEqualAmortization ? "Yes" : "No",
                    "Calculate Interest for Exact Days": formData?.Settings?.calculateInterestForExactDays
                        ? "Yes"
                        : "No",
                    "Loan Schedule Type": formData?.loanProductTemplate?.loanScheduleTypeOptions?.find(
                        (option) => option.code === formData?.Settings?.loanScheduleType
                    )?.value || "",
                    "Repayment Strategy": formData?.loanProductTemplate?.transactionProcessingStrategyOptions?.find(
                        (option) => option.code === formData?.Settings?.repaymentStrategy
                    )?.name || "",
                    "Enable Multiple Disbursals": formData?.Settings?.enableMultipleDisbursals ? "Yes" : "No",
                    "Maximum Tranche Count": formData?.Settings?.maxTrancheCount || "",
                    "Maximum Outstanding Balance": formData?.Settings?.maxOutstandingBalance || "",
                    "Disallow Expected Disbursements": formData?.Settings?.disallowExpectedDisbursements
                        ? "Yes"
                        : "No",
                    "Enable Down Payment": formData?.Settings?.enableDownPayment ? "Yes" : "No",
                    "Down Payment Percentage": formData?.Settings?.downPaymentPercentage || "",
                    "Enable Auto Repayment for Down Payment": formData?.Settings?.enableAutoRepaymentForDownPayment
                        ? "Yes"
                        : "No",
                    "Grace on Principal Payment": formData?.Settings?.gracePrincipalPayment || "",
                    "Grace on Interest Payment": formData?.Settings?.graceInterestPayment || "",
                    "Delinquency Bucket": formData?.loanProductTemplate?.delinquencyBucketOptions?.find(
                        (option) => option.id === parseInt(formData?.Settings?.delinquencyBucket)
                    )?.name || "",
                    "Enable Installment Level Delinquency": formData?.Settings?.enableInstallmentLevelDelinquency
                        ? "Yes"
                        : "No",
                    "Interest Free Period": formData?.Settings?.interestFreePeriod || "",
                    "Arrears Tolerance": formData?.Settings?.arrearsTolerance || "",
                    "Days in Year": formData?.loanProductTemplate?.daysInYearTypeOptions?.find(
                        (option) => option.id === parseInt(formData?.Settings?.daysInYear)
                    )?.value || "",
                    "Days in Month": formData?.loanProductTemplate?.daysInMonthTypeOptions?.find(
                        (option) => option.id === parseInt(formData?.Settings?.daysInMonth)
                    )?.value || "",
                    "Allow Fixing of Installment Amount": formData?.Settings?.allowFixingInstallmentAmount
                        ? "Yes"
                        : "No",
                    "Number of Days a Loan May Be Overdue Before Moving into Arrears":
                        formData?.Settings?.onArrearsAging || "",
                    "Maximum Days Before Becoming NPA": formData?.Settings?.overdueDays || "",
                    "Account Moves Out of NPA Only After All Arrears Cleared":
                        formData?.Settings?.accountMovesOutOfNPA ? "Yes" : "No",
                    "Principal Threshold for Last Installment": formData?.Settings?.principalThreshold || "",
                    "Variable Installments Allowed": formData?.Settings?.variableInstallments ? "Yes" : "No",
                    "Allowed for Top Up Loans": formData?.Settings?.topUpLoans ? "Yes" : "No",
                    "Minimum Gap Between Installments": formData?.Settings?.minGap || "",
                    "Maximum Gap Between Installments": formData?.Settings?.maxGap || "",
                    "Recalculate Interest": formData?.Settings?.recalculateInterest ? "Yes" : "No",
                    "Pre-Closure Interest Calculation Rule": formData?.loanProductTemplate?.preClosureInterestCalculationStrategyOptions?.find(
                        (option) => option.id === parseInt(formData?.Settings?.preClosureRule)
                    )?.value || "",
                    "Advance Payment Adjustment Type": formData?.loanProductTemplate?.rescheduleStrategyTypeOptions?.find(
                        (option) => option.id === parseInt(formData?.Settings?.advancePaymentType)
                    )?.value || "",
                    "Interest Recalculation Compounding On": formData?.loanProductTemplate?.interestRecalculationCompoundingTypeOptions?.find(
                        (option) => option.id === parseInt(formData?.Settings?.compoundingOn)
                    )?.value || "",
                    "Frequency for Recalculating Outstanding Principal": formData?.loanProductTemplate?.interestRecalculationFrequencyTypeOptions?.find(
                        (option) => option.id === parseInt(formData?.Settings?.frequency)
                    )?.value || "",
                    "Arrears Recognition Based on Original Schedule":
                        formData?.Settings?.arrearsRecognitionBasedOnOriginalSchedule ? "Yes" : "No",
                    "Place Guarantee Funds On-Hold": formData?.Settings?.placeGuaranteeFundsOnHold ? "Yes" : "No",
                    "Mandatory Guarantee (%)": formData?.Settings?.mandatoryGuarantee || "",
                    "Minimum Guarantee from Own Funds (%)": formData?.Settings?.minOwnFunds || "",
                    "Minimum Guarantee from Guarantor Funds (%)": formData?.Settings?.minGuarantorFunds || "",
                    "Use Global Config for Repayment Event Notifications":
                        formData?.Settings?.useGlobalRepaymentEventConfig ? "Yes" : "No",
                    "Due Days for Repayment Event": formData?.Settings?.dueDaysForRepayment || "",
                    "Overdue Days for Repayment Event": formData?.Settings?.overDueDaysForRepayment || "",
                    "Allow Overriding Terms and Settings": formData?.Settings?.allowOverridingTerms ? "Yes" : "No",
                },
            },
            {
                title: "Terms",
                data: {
                    "Minimum Principal": formData?.Terms?.principalMin || "",
                    "Default Principal": formData?.Terms?.principalDefault || "",
                    "Maximum Principal": formData?.Terms?.principalMax || "",
                    "Allow Approval Above Loan Amount": formData?.Terms?.allowApprovalAboveLoanAmount ? "Yes" : "No",
                    ...(formData?.Terms?.allowApprovalAboveLoanAmount
                        ? {
                            "Over Amount Calculation Type":
                                formData?.Terms?.overAmountCalcType === "percentage"
                                    ? "Percentage"
                                    : formData?.Terms?.overAmountCalcType === "fixed"
                                        ? "Fixed Amount"
                                        : "",
                            "Over Amount": formData?.Terms?.overAmount || "",
                        }
                        : {}),
                    "Installment Day Calculation From":
                        formData?.loanProductTemplate?.repaymentStartDateTypeOptions?.find(
                            (option) => option.id === parseInt(formData?.Terms?.installmentDayCalcFrom)
                        )?.value || "",
                    "Minimum Repayments": formData?.Terms?.repaymentMin || "",
                    "Default Repayments": formData?.Terms?.repaymentDefault || "",
                    "Maximum Repayments": formData?.Terms?.repaymentMax || "",
                    "Is Zero Interest Rate": formData?.Terms?.isZeroInterestRate ? "Yes" : "No",
                    "Is Linked to Floating Rates": formData?.Terms?.isLinkedToFloatingRates ? "Yes" : "No",
                    ...(formData?.Terms?.isLinkedToFloatingRates
                        ? {
                            "Floating Rate":
                                formData?.loanProductTemplate?.floatingRateOptions?.find(
                                    (option) => option.id === parseInt(formData?.Terms?.floatingRate)
                                )?.value || "",
                            "Differential Rate": formData?.Terms?.differentialRate || "",
                            "Floating Calculation Allowed": formData?.Terms?.isFloatingCalcAllowed ? "Yes" : "No",
                            "Floating Minimum": formData?.Terms?.floatingMin || "",
                            "Floating Default": formData?.Terms?.floatingDefault || "",
                            "Floating Maximum": formData?.Terms?.floatingMax || "",
                        }
                        : {}),
                    ...(formData?.Terms?.isZeroInterestRate || formData?.Terms?.isLinkedToFloatingRates
                        ? {}
                        : {
                            "Nominal Interest Minimum": formData?.Terms?.nominalInterestMin || "",
                            "Nominal Interest Default": formData?.Terms?.nominalInterestDefault || "",
                            "Nominal Interest Maximum": formData?.Terms?.nominalInterestMax || "",
                            "Frequency":
                                formData?.loanProductTemplate?.interestRateFrequencyTypeOptions?.find(
                                    (option) => option.id === parseInt(formData?.Terms?.frequency)
                                )?.value || "",
                        }),
                    "Repayment Frequency": formData?.Terms?.frequencyRepaid || "",
                    "Repayment Frequency Type":
                        formData?.loanProductTemplate?.repaymentFrequencyTypeOptions?.find(
                            (option) => option.id === parseInt(formData?.Terms?.frequencyType)
                        )?.value || "",
                    "Minimum Days Between Disbursal and First Repayment Date":
                        formData?.Terms?.minDaysDisbursalToRepayment || "",
                },
            },
            {
                title: "Charges",
                data: {
                    Charges: loanCycleData?.charges?.map((item) => {
                        const chargeOption = formData?.loanProductTemplate?.chargeOptions?.find(
                            (option) => option.id === parseInt(item?.charge)
                        );
                        return chargeOption ? chargeOption.name : "";
                    }) || [],
                    OverdueCharges: loanCycleData.overdueCharges?.map((item) => {
                        const overdueChargeOption = formData?.loanProductTemplate?.overdueChargeOptions?.find(
                            (option) => option.id === parseInt(item?.overdueCharge)
                        );
                        return overdueChargeOption ? overdueChargeOption.name : "";
                    }) || [],
                },
            },
            { title: "Accounting", data: {
                "Selected Option": formData?.Accounting?.selectedOption,
                "Fund Source" : formData?.Accounting?.fundSource,
                "Loan Portfolio": formData?.Accounting?.loanPortfolio
                    ? formData?.loanProductTemplate?.accountingMappingOptions?.assetAccountOptions.find(f => f.id === parseInt(formData?.Accounting?.loanPortfolio, 10))?.name
                    : '',
                "Transfer Suspense": formData?.Accounting?.transferSuspense
                    ? formData?.loanProductTemplate?.accountingMappingOptions?.assetAccountOptions.find(f => f.id === parseInt(formData.Accounting.transferSuspense, 10))?.name
                    : '',
                "Penalties Receivable": formData?.Accounting?.penaltiesReceivable
                    ? formData?.loanProductTemplate?.accountingMappingOptions?.assetAccountOptions.find(f => f.id === parseInt(formData.Accounting.penaltiesReceivable, 10))?.name
                    : '',
                "Interest Receivable": formData?.Accounting?.interestReceivable
                    ? formData?.loanProductTemplate?.accountingMappingOptions?.assetAccountOptions.find(f => f.id === parseInt(formData.Accounting.interestReceivable, 10))?.name
                    : '',
                "Fees Receivable": formData?.Accounting?.feesReceivable
                    ? formData?.loanProductTemplate?.accountingMappingOptions?.assetAccountOptions.find(f => f.id === parseInt(formData.Accounting.feesReceivable, 10))?.name
                    : '',
                "Income Charge Off Fees": formData?.Accounting?.incomeChargeOffFees
                    ? formData?.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.find(f => f.id === parseInt(formData.Accounting.incomeChargeOffFees, 10))?.name
                    : '',
                "Income Charge off Interest": formData?.Accounting?.incomeChargeOffInterest
                    ? formData?.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.find(f => f.id === parseInt(formData.Accounting.incomeChargeOffInterest, 10))?.name
                    : '',
                "Income Charge Off Penalty": formData?.Accounting?.incomeChargeOffPenalty
                    ? formData?.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.find(f => f.id === parseInt(formData.Accounting.incomeChargeOffPenalty, 10))?.name
                    : '',
                "Income Fees": formData?.Accounting?.incomeFees
                    ? formData?.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.find(f => f.id === parseInt(formData.Accounting.incomeFees, 10))?.name
                    : '',
                "Income Goodwill Credit Fees": formData?.Accounting?.incomeGoodwillCreditFees
                    ? formData?.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.find(f => f.id === parseInt(formData.Accounting.incomeGoodwillCreditFees, 10))?.name
                    : '',
                "Income Goodwill Credit Interest": formData.Accounting.incomeGoodwillCreditInterest
                    ? formData?.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.find(f => f.id === parseInt(formData.Accounting.incomeGoodwillCreditInterest, 10))?.name
                    : '',
                "Income Goodwill Credit Penalty": formData.Accounting.incomeGoodwillCreditPenalty
                    ? formData?.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.find(f => f.id === parseInt(formData.Accounting.incomeGoodwillCreditPenalty, 10))?.name
                    : '',
                "Income Interest": formData.Accounting.incomeInterest
                    ? formData?.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.find(f => f.id === parseInt(formData.Accounting.incomeInterest, 10))?.name
                    : '',
                "Income Penalties": formData.Accounting.incomePenalties
                    ? formData?.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.find(f => f.id === parseInt(formData.Accounting.incomePenalties, 10))?.name
                    : '',
                "Income Recovery": formData.Accounting.incomeRecovery
                    ? formData?.loanProductTemplate?.accountingMappingOptions?.incomeAccountOptions.find(f => f.id === parseInt(formData.Accounting.incomeRecovery, 10))?.name
                    : '',
                "Charge Off Expense": formData.Accounting.chargeOffExpense
                    ? formData?.loanProductTemplate?.accountingMappingOptions?.expenseAccountOptions.find(f => f.id === parseInt(formData.Accounting.chargeOffExpense, 10))?.name
                    : '',
                "Charge Off Fraud Expense": formData.Accounting.chargeOffFraudExpense
                    ? formData?.loanProductTemplate?.accountingMappingOptions?.expenseAccountOptions.find(f => f.id === parseInt(formData.Accounting.chargeOffFraudExpense, 10))?.name
                    : '',
                "Goodwill Credit Expenses": formData.Accounting.goodwillCreditExpenses
                    ? formData?.loanProductTemplate?.accountingMappingOptions?.expenseAccountOptions.find(f => f.id === parseInt(formData.Accounting.goodwillCreditExpenses, 10))?.name
                    : '',
                "OverPayment Liability": formData.Accounting.overpaymentLiability
                    ? formData?.loanProductTemplate?.accountingMappingOptions?.liabilityAccountOptions.find(f => f.id === parseInt(formData.Accounting.overpaymentLiability, 10))?.name
                    : '',
                "Advanced Accounting Rules": formData.Accounting.advancedAccountingRules
                    ? "Yes"
                    : "No",
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
                        {data && Object.keys(data).length > 0 ? (
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
                                        <td>
                                            {Array.isArray(value)
                                                ? value
                                                    .map((item) =>
                                                        typeof item === "object"
                                                            ? JSON.stringify(item)
                                                            : item
                                                    )
                                                    .join(", ")
                                                : value || ""}
                                        </td>
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
        <div className="staged-form-create-loan-product">

            <div className="staged-form-stage-content">
                {renderStageTracker()}
                {currentStage === stages.length && allStagesComplete ? (
                    renderPreviewSection()
                ) : (
                    renderStageContent()
                )}
                <div className="staged-form-stage-buttons">
                    <button onClick={handlePrevious}
                            disabled={currentStage === 0}
                            className="staged-form-button-previous">
                        Previous
                    </button>
                    {currentStage < stages.length && (
                        <button
                            onClick={handleNext}
                            className="staged-form-button-next"
                            disabled={!isNextDisabled}
                        >
                            Next
                        </button>
                    )}
                    {currentStage === stages.length && (
                        <button
                            onClick={handleSubmit}
                            className="staged-form-button-preview"
                            disabled={!allStagesComplete}
                        >
                            {productToEdit ? 'Update' : 'Submit'}
                        </button>
                    )}
                </div>
            </div>
            {modalState.isOpen && (
                <div className="staged-modal-container">
                    <div className="staged-modal-content">
                        <h3 className="modal-staged-form-title">
                            {`${
                                modalState.type.charAt(0).toUpperCase() + modalState.type.slice(1)
                            } by Loan Cycle`}
                        </h3>

                        {/* Fields */}
                        <div className="staged-form-field">
                            <label htmlFor="condition">Condition <span>*</span></label>
                            <select
                                id="condition"
                                value={modalState.data?.condition || ""}
                                onChange={(e) =>
                                    setModalState((prev) => ({
                                        ...prev,
                                        data: { ...prev.data, condition: e.target.value },
                                    }))
                                }
                                required
                            >
                                <option value="">Select Condition</option>
                                {formData.loanProductTemplate?.valueConditionTypeOptions?.map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {option.value}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="staged-form-field">
                            <label htmlFor="loanCycle">Loan Cycle <span>*</span></label>
                            <input
                                id="loanCycle"
                                type="number"
                                min={0}
                                value={modalState.data?.loanCycle || ""}
                                onChange={(e) =>
                                    setModalState((prev) => ({
                                        ...prev,
                                        data: { ...prev.data, loanCycle: e.target.value },
                                    }))
                                }
                                required
                            />
                        </div>
                        <div className="staged-form-field">
                            <label htmlFor="min">Minimum</label>
                            <input
                                id="min"
                                type="number"
                                min={0}
                                value={modalState.data?.min || ""}
                                onChange={(e) =>
                                    setModalState((prev) => ({
                                        ...prev,
                                        data: { ...prev.data, min: e.target.value },
                                    }))
                                }
                            />
                        </div>
                        <div className="staged-form-field">
                            <label htmlFor="default">Default <span>*</span></label>
                            <input
                                id="default"
                                type="number"
                                min={0}
                                value={modalState.data?.default || ""}
                                onChange={(e) =>
                                    setModalState((prev) => ({
                                        ...prev,
                                        data: { ...prev.data, default: e.target.value },
                                    }))
                                }
                                required
                            />
                        </div>
                        <div className="staged-form-field">
                            <label htmlFor="max">Maximum</label>
                            <input
                                id="max"
                                type="number"
                                min={0}
                                value={modalState.data?.max || ""}
                                onChange={(e) =>
                                    setModalState((prev) => ({
                                        ...prev,
                                        data: { ...prev.data, max: e.target.value },
                                    }))
                                }
                            />
                        </div>

                        {/* Buttons */}
                        <div className="staged-form-modal-buttons">
                            <button onClick={closeModal} className="staged-form-modal-button-cancel">
                                Cancel
                            </button>
                            <button
                                onClick={() => handleSubmitModalData(modalState.data)}
                                className="staged-form-modal-button-submit"
                                disabled={isSubmitDisabled}
                            >
                                {modalState.data?.id ? "Save Changes" : "Add"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

};

export default CreateLoanProducts;
