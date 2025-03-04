import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../../../../context/AuthContext";
import { useLoading } from "../../../../../context/LoadingContext";
import { API_CONFIG } from "../../../../../config";
import './CreateCharges.css'
import {NotificationContext} from "../../../../../context/NotificationContext";

const CreateChargeForm = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();

    const [chargeAppliesToOptions, setChargeAppliesToOptions] = useState([]);
    const [currencyOptions, setCurrencyOptions] = useState([]);
    const [taxGroupOptions, setTaxGroupOptions] = useState([]);
    const [loanChargeOptions, setLoanChargeOptions] = useState([]);
    const [savingsChargeOptions, setSavingsChargeOptions] = useState([]);
    const [clientChargeOptions, setClientChargeOptions] = useState([]);
    const [shareChargeOptions, setShareChargeOptions] = useState([]);
    const [chargePaymentModeOptions, setChargePaymentModeOptions] = useState([]);
    const [incomeAccountOptions, setIncomeAccountOptions] = useState([]);

    const [selectedChargeAppliesTo, setSelectedChargeAppliesTo] = useState("");
    const [formValues, setFormValues] = useState({
        chargeName: "",
        currency: "",
        chargeTimeType: "",
        chargeCalculationType: "",
        chargePaymentMode: "",
        amount: "",
        taxGroup: "",
        incomeAccount: "",
        isActive: false,
        isPenalty: false,
    });

    useEffect(() => {
        fetchTemplateData();
    }, []);

    const fetchTemplateData = async () => {
        startLoading();
        try {
            const response = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/charges/template`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const data = response.data || {};
            setChargeAppliesToOptions(data.chargeAppliesToOptions || []);
            setCurrencyOptions(data.currencyOptions || []);
            setTaxGroupOptions(data.taxGroupOptions || []);
            setLoanChargeOptions({
                chargeTimeTypeOptions: data.loanChargeTimeTypeOptions || [],
                chargeCalculationTypeOptions:
                    data.loanChargeCalculationTypeOptions || [],
            });
            setSavingsChargeOptions({
                chargeTimeTypeOptions: data.savingsChargeTimeTypeOptions || [],
                chargeCalculationTypeOptions:
                    data.savingsChargeCalculationTypeOptions || [],
            });
            setClientChargeOptions({
                chargeTimeTypeOptions: data.clientChargeTimeTypeOptions || [],
                chargeCalculationTypeOptions:
                    data.clientChargeCalculationTypeOptions || [],
            });
            setShareChargeOptions({
                chargeTimeTypeOptions: data.shareChargeTimeTypeOptions || [],
                chargeCalculationTypeOptions:
                    data.shareChargeCalculationTypeOptions || [],
            });
            setChargePaymentModeOptions(data.chargePaymetModeOptions || []);
            setIncomeAccountOptions(Array.isArray(data.incomeOrLiabilityAccountOptions) ? data.incomeOrLiabilityAccountOptions : []);
        } catch (error) {
            console.error("Error fetching template data:", error);
        } finally {
            stopLoading();
        }
    };

    const handleFieldChange = (field, value) => {
        setFormValues((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleChargeAppliesToChange = (value) => {
        setSelectedChargeAppliesTo(value);
        setFormValues({
            chargeName: "",
            currency: "",
            chargeTimeType: "",
            chargeCalculationType: "",
            chargePaymentMode: "",
            amount: "",
            taxGroup: "",
            incomeAccount: "",
            isActive: false,
            isPenalty: false,
        });
    };

    const isFormValid = () => {
        const {
            chargeName,
            currency,
            chargeTimeType,
            chargeCalculationType,
            amount,
        } = formValues;

        return (
            selectedChargeAppliesTo &&
            chargeName &&
            currency &&
            chargeTimeType &&
            chargeCalculationType &&
            amount
        );
    };

    const handleSubmit = async () => {
        const payload = {
            chargeAppliesTo: selectedChargeAppliesTo,
            ...formValues,
        };

        try {
            startLoading();
            await axios.post(`${API_CONFIG.proxy}/fineract-provider/api/v1/charges`, payload, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });
            showNotification("Charge created successfully!", 'success');
            setSelectedChargeAppliesTo("");
            setFormValues({
                chargeName: "",
                currency: "",
                chargeTimeType: "",
                chargeCalculationType: "",
                chargePaymentMode: "",
                amount: "",
                taxGroup: "",
                incomeAccount: "",
                isActive: false,
                isPenalty: false,
            });
        } catch (error) {
            console.error("Error creating charge:", error);
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="create-charge-page">
            <h3 className="charge-form-heading">Create Charge</h3>

            <div className="charge-form-group charge-applies-to">
                <label htmlFor="charge-applies-to" className="charge-form-label">
                    Charge Applies To <span>*</span>
                </label>
                <select
                    id="charge-applies-to"
                    className="charge-form-select"
                    value={selectedChargeAppliesTo}
                    onChange={(e) => handleChargeAppliesToChange(e.target.value)}
                >
                    <option value="">Select</option>
                    {chargeAppliesToOptions.map((option) => (
                        <option key={option.id} value={option.value}>
                            {option.value}
                        </option>
                    ))}
                </select>
            </div>

            {selectedChargeAppliesTo && (
                <>
                    <div className="charge-form-row">
                        <div className="charge-form-group">
                            <label htmlFor="charge-name" className="charge-form-label">
                                Charge Name <span>*</span>
                            </label>
                            <input
                                id="charge-name"
                                type="text"
                                className="charge-form-input"
                                value={formValues.chargeName}
                                onChange={(e) =>
                                    handleFieldChange("chargeName", e.target.value)
                                }
                                placeholder="Enter charge name"
                            />
                        </div>

                        <div className="charge-form-group">
                            <label htmlFor="currency" className="charge-form-label">
                                Currency <span>*</span>
                            </label>
                            <select
                                id="currency"
                                className="charge-form-select"
                                value={formValues.currency}
                                onChange={(e) =>
                                    handleFieldChange("currency", e.target.value)
                                }
                            >
                                <option value="">Select Currency</option>
                                {currencyOptions.map((option) => (
                                    <option key={option.code} value={option.code}>
                                        {option.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="charge-form-row">
                        <div className="charge-form-group">
                            <label
                                htmlFor="charge-time-type"
                                className="charge-form-label"
                            >
                                Charge Time Type <span>*</span>
                            </label>
                            <select
                                id="charge-time-type"
                                className="charge-form-select"
                                value={formValues.chargeTimeType}
                                onChange={(e) =>
                                    handleFieldChange("chargeTimeType", e.target.value)
                                }
                            >
                                <option value="">Select</option>
                                {(
                                    {
                                        Loan: loanChargeOptions.chargeTimeTypeOptions,
                                        Savings: savingsChargeOptions.chargeTimeTypeOptions,
                                        Client: clientChargeOptions.chargeTimeTypeOptions,
                                        Shares: shareChargeOptions.chargeTimeTypeOptions,
                                    }[selectedChargeAppliesTo] || []
                                ).map((option) => (
                                    <option key={option.id} value={option.value}>
                                        {option.value}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="charge-form-group">
                            <label
                                htmlFor="charge-calculation-type"
                                className="charge-form-label"
                            >
                                Charge Calculation Type <span>*</span>
                            </label>
                            <select
                                id="charge-calculation-type"
                                className="charge-form-select"
                                value={formValues.chargeCalculationType}
                                onChange={(e) =>
                                    handleFieldChange("chargeCalculationType", e.target.value)
                                }
                            >
                                <option value="">Select</option>
                                {(
                                    {
                                        Loan: loanChargeOptions.chargeCalculationTypeOptions,
                                        Savings: savingsChargeOptions.chargeCalculationTypeOptions,
                                        Client: clientChargeOptions.chargeCalculationTypeOptions,
                                        Shares: shareChargeOptions.chargeCalculationTypeOptions,
                                    }[selectedChargeAppliesTo] || []
                                ).map((option) => (
                                    <option key={option.id} value={option.value}>
                                        {option.value}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {selectedChargeAppliesTo !== "Client" && (
                        <div className="charge-form-group">
                            <label
                                htmlFor="charge-payment-mode"
                                className="charge-form-label"
                            >
                                Charge Payment Mode <span>*</span>
                            </label>
                            <select
                                id="charge-payment-mode"
                                className="charge-form-select"
                                value={formValues.chargePaymentMode}
                                onChange={(e) =>
                                    handleFieldChange("chargePaymentMode", e.target.value)
                                }
                            >
                                <option value="">Select</option>
                                {chargePaymentModeOptions.map((option) => (
                                    <option key={option.id} value={option.value}>
                                        {option.value}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {selectedChargeAppliesTo === "Client" && (
                        <div className="charge-form-group">
                            <label htmlFor="income-account" className="charge-form-label">
                                Income from Charge <span>*</span>
                            </label>
                            <select
                                id="income-account"
                                className="charge-form-select"
                                value={formValues.incomeAccount}
                                onChange={(e) =>
                                    handleFieldChange("incomeAccount", e.target.value)
                                }
                            >
                                <option value="">Select</option>
                                {incomeAccountOptions.length > 0 ? (
                                    incomeAccountOptions.map((option) => (
                                        <option key={option.id} value={option.value}>
                                            {option.value}
                                        </option>
                                    ))
                                ) : (
                                    <option disabled>No options available</option>
                                )}
                            </select>
                        </div>
                    )}

                    <div className="charge-form-row">
                        <div className="charge-form-group">
                            <label htmlFor="amount" className="charge-form-label">
                                Amount <span>*</span>
                            </label>
                            <input
                                id="amount"
                                type="number"
                                className="charge-form-input"
                                value={formValues.amount}
                                onChange={(e) =>
                                    handleFieldChange("amount", e.target.value)
                                }
                                placeholder="Enter amount"
                            />
                        </div>

                        <div className="charge-form-group">
                            <label htmlFor="tax-group" className="charge-form-label">
                                Tax Group
                            </label>
                            <select
                                id="tax-group"
                                className="charge-form-select"
                                value={formValues.taxGroup}
                                onChange={(e) =>
                                    handleFieldChange("taxGroup", e.target.value)
                                }
                            >
                                <option value="">Select Tax Group</option>
                                {taxGroupOptions.map((option) => (
                                    <option key={option.id} value={option.value}>
                                        {option.value}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="charge-checkbox-row">
                        <label className="charge-checkbox-label">
                            <input
                                type="checkbox"
                                checked={formValues.isActive}
                                onChange={(e) =>
                                    handleFieldChange("isActive", e.target.checked)
                                }
                            />
                            Active
                        </label>

                        <label className="charge-checkbox-label">
                            <input
                                type="checkbox"
                                checked={formValues.isPenalty}
                                onChange={(e) =>
                                    handleFieldChange("isPenalty", e.target.checked)
                                }
                            />
                            Is Penalty?
                        </label>
                    </div>

                    <div className="charge-form-actions">
                        <button
                            className="charge-submit-button"
                            onClick={handleSubmit}
                            disabled={!isFormValid()}
                        >
                            Submit
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default CreateChargeForm;
