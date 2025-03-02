import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../../../../context/AuthContext";
import { useLoading } from "../../../../../context/LoadingContext";
import { API_CONFIG } from "../../../../../config";
import {FaEdit, FaEye, FaEyeSlash, FaTrash} from "react-icons/fa";

const stages = [
    "Details",
    "Currency",
    "Terms",
    "Settings",
    "Interest Rate Chart",
    "Charges",
    "Accounting",
];

const CreateFixedDepositProducts = () => {
    const [currentStage, setCurrentStage] = useState(0);
    const [formData, setFormData] = useState({});
    const [completedStages, setCompletedStages] = useState(new Set());
    const [errors, setErrors] = useState({});
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const [interestRateCharts, setInterestRateCharts] = useState([
        { id: Date.now(), name: "", fromDate: "", endDate: "", description: "", isPrimaryGroupingByAmount: false, slabs: [] },
    ]);

    const [slabModal, setSlabModal] = useState({
        isOpen: false,
        chartId: null,
        data: null,
    });

    const [incentiveModal, setIncentiveModal] = useState({
        isOpen: false,
        chartId: null,
        slabId: null,
        data: null,
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                startLoading();

                const fixedDepositProductTemplateResponse = await axios.get(
                    `/fineract-provider/api/v1/fixeddepositproducts/template`,
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
                    fixedDepositProductTemplate: fixedDepositProductTemplateResponse.data,
                }));
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                stopLoading();
            }
        };

        fetchData();
    }, []);

    const handleChartChange = (chartId, field, value) => {
        setInterestRateCharts((prev) =>
            prev.map((chart) => (chart.id === chartId ? { ...chart, [field]: value } : chart))
        );
    };

    const handleDeleteChart = (chartId) => {
        setInterestRateCharts((prev) => prev.filter((chart) => chart.id !== chartId));
    };

    const openSlabModal = (chartId, slab = null) => {
        setSlabModal({ isOpen: true, chartId, data: slab || { periodType: "", periodFrom: "", periodTo: "", amountRangeFrom: "", amountRangeTo: "", interest: "", description: "" } });
    };

    const closeSlabModal = () => {
        setSlabModal({ isOpen: false, chartId: null, data: null });
    };

    const handleSlabSubmit = (chartId, slab) => {
        setInterestRateCharts((prev) =>
            prev.map((chart) =>
                chart.id === chartId
                    ? {
                        ...chart,
                        slabs: slab.id
                            ? chart.slabs.map((s) => (s.id === slab.id ? { ...slab, incentivesVisible: s.incentivesVisible ?? false } : s))
                            : [...chart.slabs, { ...slab, id: Date.now(), incentivesVisible: false }],
                    }
                    : chart
            )
        );
        closeSlabModal();
    };

    const handleDeleteSlab = (chartId, slabId) => {
        setInterestRateCharts((prev) =>
            prev.map((chart) =>
                chart.id === chartId ? { ...chart, slabs: chart.slabs.filter((slab) => slab.id !== slabId) } : chart
            )
        );
    };

    const openIncentiveModal = (chartId, slabId, incentive = null) => {
        setIncentiveModal({
            isOpen: true,
            chartId,
            slabId,
            data: incentive || {
                entityType: "",
                attributeName: "",
                conditionType: "",
                attributeValue: "",
                incentiveType: "",
                interest: "",
                value: "",
            },
        });
    };

    const closeIncentiveModal = () => {
        setIncentiveModal({ isOpen: false, chartId: null, slabId: null, data: null });
    };

    const handleIncentiveSubmit = (chartId, slabId, incentiveData) => {
        setInterestRateCharts((prevCharts) =>
            prevCharts.map((chart) => {
                if (chart.id === chartId) {
                    const updatedSlabs = chart.slabs.map((slab) => {
                        if (slab.id === slabId) {
                            const updatedIncentives = slab.incentives ? [...slab.incentives] : [];
                            const backendChartTemplate = formData.fixedDepositProductTemplate.chartTemplate;

                            const resolvedIncentiveData = {
                                ...incentiveData,
                                attributeName: backendChartTemplate.attributeNameOptions?.find(
                                    (opt) => opt.value === incentiveData.attribute
                                )?.value || incentiveData.attribute,
                                conditionType: backendChartTemplate.conditionTypeOptions?.find(
                                    (opt) => opt.value === incentiveData.condition
                                )?.value || incentiveData.condition,
                                incentiveType: backendChartTemplate.incentiveTypeOptions?.find(
                                    (opt) => opt.value === incentiveData.type
                                )?.value || incentiveData.type,
                            };

                            if (incentiveData.id) {
                                const index = updatedIncentives.findIndex((item) => item.id === incentiveData.id);
                                if (index > -1) {
                                    updatedIncentives[index] = resolvedIncentiveData;
                                }
                            } else {
                                updatedIncentives.push({ ...resolvedIncentiveData, id: Date.now() });
                            }

                            return { ...slab, incentives: updatedIncentives };
                        }
                        return slab;
                    });

                    return { ...chart, slabs: updatedSlabs };
                }
                return chart;
            })
        );
        closeIncentiveModal();
    };

    const handleDeleteIncentive = (chartId, slabId, incentiveId) => {
        setInterestRateCharts((prev) =>
            prev.map((chart) =>
                chart.id === chartId
                    ? {
                        ...chart,
                        slabs: chart.slabs.map((slab) =>
                            slab.id === slabId
                                ? { ...slab, incentives: slab.incentives.filter((incentive) => incentive.id !== incentiveId) }
                                : slab
                        ),
                    }
                    : chart
            )
        );
    };

    const handleAddAdvancedRule = (type) => {
        // console.log('Add Advanced Rule')
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

    const handleNext = () => {
        setCompletedStages((prev) => new Set([...prev, stages[currentStage]]));
        setCurrentStage((prev) => prev + 1);
    };

    const handlePrevious = () => {
        setCurrentStage((prev) => prev - 1);
    };

    const handlePreview = () => {
        console.log("Preview Data:", formData);
    };

    const allStagesComplete = stages.every((stage) => completedStages.has(stage));

    const SlabModal = ({ modalData, onClose, onSubmit, backendOptions }) => {
        const [formData, setFormData] = useState(modalData);

        const handleInputChange = (field, value) => {
            setFormData((prev) => ({ ...prev, [field]: value }));
        };

        const isSubmitDisabled = !formData.periodType || !formData.periodFrom || !formData.amountRangeFrom || !formData.interest;

        return (
            <div className="staged-modal-container">
                <div className="staged-modal-content">
                    <h3 className="modal-staged-form-title">{modalData.id ? "Edit Slab" : "Add Slab"}</h3>

                    <div className="staged-form-field">
                        <label htmlFor="periodType">Period Type <span className="staged-form-required">*</span></label>
                        <select
                            id="periodType"
                            value={formData.periodType}
                            onChange={(e) => handleInputChange("periodType", e.target.value)}
                            className="staged-form-select"
                            required
                        >
                            <option value="">Select Period Type</option>
                            {backendOptions.periodFrequencyTypeOptions.map((option) => (
                                <option key={option.id} value={option.value}>
                                    {option.value}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="staged-form-row">
                        <div className="staged-form-field">
                            <label htmlFor="periodFrom">Period From <span className="staged-form-required">*</span></label>
                            <input
                                id="periodFrom"
                                type="number"
                                value={formData.periodFrom}
                                onChange={(e) => handleInputChange("periodFrom", e.target.value)}
                                className="staged-form-input"
                                required
                            />
                        </div>
                        <div className="staged-form-field">
                            <label htmlFor="periodTo">Period To</label>
                            <input
                                id="periodTo"
                                type="number"
                                value={formData.periodTo}
                                onChange={(e) => handleInputChange("periodTo", e.target.value)}
                                className="staged-form-input"
                            />
                        </div>
                    </div>

                    <div className="staged-form-row">
                        <div className="staged-form-field">
                            <label htmlFor="amountRangeFrom">Amount Range From <span className="staged-form-required">*</span></label>
                            <input
                                id="amountRangeFrom"
                                type="number"
                                value={formData.amountRangeFrom}
                                onChange={(e) => handleInputChange("amountRangeFrom", e.target.value)}
                                className="staged-form-input"
                                required
                            />
                        </div>
                        <div className="staged-form-field">
                            <label htmlFor="amountRangeTo">Amount Range To</label>
                            <input
                                id="amountRangeTo"
                                type="number"
                                value={formData.amountRangeTo}
                                onChange={(e) => handleInputChange("amountRangeTo", e.target.value)}
                                className="staged-form-input"
                            />
                        </div>
                    </div>

                    <div className="staged-form-field">
                        <label htmlFor="interest">Interest (%) <span className="staged-form-required">*</span></label>
                        <input
                            id="interest"
                            type="number"
                            value={formData.interest}
                            onChange={(e) => handleInputChange("interest", e.target.value)}
                            className="staged-form-input"
                            required
                        />
                    </div>

                    <div className="staged-form-field">
                        <label htmlFor="description">Description</label>
                        <input
                            id="description"
                            value={formData.description}
                            onChange={(e) => handleInputChange("description", e.target.value)}
                            className="staged-form-input"
                        />
                    </div>

                    <div className="staged-form-modal-buttons">
                        <button onClick={onClose} className="staged-form-modal-button-cancel">Cancel</button>
                        <button
                            onClick={() => onSubmit(formData)}
                            className="staged-form-modal-button-submit"
                            disabled={isSubmitDisabled}
                        >
                            {modalData.id ? "Save Changes" : "Add"}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const IncentiveModal = ({ modalData, onClose, onSubmit, backendOptions }) => {
        const [formData, setFormData] = useState(modalData);

        useEffect(() => {
            setFormData(modalData);
        }, [modalData]);

        const handleInputChange = (field, value) => {
            setFormData((prev) => ({ ...prev, [field]: value }));
        };

        const isSubmitDisabled =
            !formData.entityType || !formData.attribute || !formData.condition || !formData.type || !formData.interest || !formData.value;

        const renderValueField = () => {
            const selectedAttribute = backendOptions.chartTemplate.attributeNameOptions?.find(
                (option) => option.value === formData.attribute
            );

            if (selectedAttribute?.value === "age") {
                return (
                    <input
                        id="value"
                        type="number"
                        value={formData.value || ""}
                        onChange={(e) => handleInputChange("value", e.target.value)}
                        className="staged-form-input"
                        required
                    />
                );
            }

            return (
                <select
                    id="value"
                    value={formData.value || ""}
                    onChange={(e) => handleInputChange("value", e.target.value)}
                    className="staged-form-select"
                    required
                >
                    <option value="">Select Value</option>
                    {Array.isArray(backendOptions.chartTemplate.clientTypeOptions) &&
                        backendOptions.chartTemplate.clientTypeOptions.map((option) => (
                            <option key={option.id} value={option.value}>
                                {option.value}
                            </option>
                        ))}
                </select>
            );
        };

        return (
            <div className="staged-modal-container">
                <div className="staged-modal-content">
                    <h3 className="modal-staged-form-title">{modalData.id ? "Edit Incentive" : "Add Incentive"}</h3>

                    <div className="staged-form-field">
                        <label htmlFor="entityType">Entity Type <span className="staged-form-required">*</span></label>
                        <select
                            id="entityType"
                            value={formData.entityType || ""}
                            onChange={(e) => handleInputChange("entityType", e.target.value)}
                            className="staged-form-select"
                            required
                        >
                            <option value="">Select Entity Type</option>
                            {Array.isArray(backendOptions.chartTemplate.entityTypeOptions) &&
                                backendOptions.chartTemplate.entityTypeOptions.map((option) => (
                                    <option key={option.id} value={option.value}>
                                        {option.value}
                                    </option>
                                ))}
                        </select>
                    </div>

                    <div className="staged-form-field">
                        <label htmlFor="attribute">Attribute <span className="staged-form-required">*</span></label>
                        <select
                            id="attribute"
                            value={formData.attribute}
                            onChange={(e) => handleInputChange("attribute", e.target.value)}
                            className="staged-form-select"
                            required
                        >
                            <option value="">Select Attribute</option>
                            {Array.isArray(backendOptions.chartTemplate.attributeNameOptions) &&
                                backendOptions.chartTemplate.attributeNameOptions.map((option) => (
                                    <option key={option.id} value={option.value}>
                                        {option.value}
                                    </option>
                                ))}
                        </select>
                    </div>

                    <div className="staged-form-field">
                        <label htmlFor="condition">Condition <span className="staged-form-required">*</span></label>
                        <select
                            id="condition"
                            value={formData.condition}
                            onChange={(e) => handleInputChange("condition", e.target.value)}
                            className="staged-form-select"
                            required
                        >
                            <option value="">Select Condition</option>
                            {Array.isArray(backendOptions.chartTemplate.conditionTypeOptions) &&
                                backendOptions.chartTemplate.conditionTypeOptions.map((option) => (
                                    <option key={option.id} value={option.value}>
                                        {option.value}
                                    </option>
                                ))}
                        </select>
                    </div>

                    {formData.attribute && (
                        <div className="staged-form-field">
                            <label htmlFor="value">Value <span className="staged-form-required">*</span></label>
                            {renderValueField()}
                        </div>
                    )}

                    <div className="staged-form-field">
                        <label htmlFor="type">Type <span className="staged-form-required">*</span></label>
                        <select
                            id="type"
                            value={formData.type}
                            onChange={(e) => handleInputChange("type", e.target.value)}
                            className="staged-form-select"
                            required
                        >
                            <option value="">Select Type</option>
                            {Array.isArray(backendOptions.chartTemplate.incentiveTypeOptions) &&
                                backendOptions.chartTemplate.incentiveTypeOptions.map((option) => (
                                    <option key={option.id} value={option.value}>
                                        {option.value}
                                    </option>
                                ))}
                        </select>
                    </div>

                    <div className="staged-form-field">
                        <label htmlFor="interest">Interest (%) <span className="staged-form-required">*</span></label>
                        <input
                            id="interest"
                            type="number"
                            value={formData.interest}
                            onChange={(e) => handleInputChange("interest", e.target.value)}
                            className="staged-form-input"
                            required
                        />
                    </div>

                    <div className="staged-form-modal-buttons">
                        <button onClick={onClose} className="staged-form-modal-button-cancel">Cancel</button>
                        <button
                            onClick={() => onSubmit(formData)}
                            className="staged-form-modal-button-submit"
                            disabled={isSubmitDisabled}
                        >
                            {modalData.id ? "Save Changes" : "Add"}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const toggleIncentivesView = (chartId, slabId) => {
        setInterestRateCharts((prev) =>
            prev.map((chart) =>
                chart.id === chartId
                    ? {
                        ...chart,
                        slabs: chart.slabs.map((slab) =>
                            slab.id === slabId
                                ? {...slab, incentivesVisible: !slab.incentivesVisible}
                                : slab
                        ),
                    }
                    : chart
            )
        );
    };

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
                                    {formData.fixedDepositProductTemplate?.currencyOptions?.map((option) => (
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
                        </div>
                    </div>
                );
            case "Terms":
                return (
                    <div className="staged-form-terms">
                        <h4 className="staged-form-section-title">Deposit Amount</h4>

                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="minimumDeposit">
                                    Minimum
                                </label>
                                <input
                                    id="minimumDeposit"
                                    type="number"
                                    value={formData.Settings?.minimumDeposit || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Terms", "minimumDeposit", e.target.value)
                                    }
                                    className="staged-form-input"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="defaultDeposit">
                                    Default <span className="staged-form-required">*</span>
                                </label>
                                <input
                                    id="defaultDeposit"
                                    type="number"
                                    value={formData.Settings?.defaultDeposit || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Terms", "defaultDeposit", e.target.value)
                                    }
                                    className="staged-form-input"
                                    required
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="maximumDeposit">
                                    Maximum
                                </label>
                                <input
                                    id="maximumDeposit"
                                    type="number"
                                    value={formData.Settings?.maximumDeposit || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Terms", "maximumDeposit", e.target.value)
                                    }
                                    className="staged-form-input"
                                />
                            </div>
                        </div>

                        <div className="staged-form-row">
                            {/* Interest Compounding Period */}
                            <div className="staged-form-field">
                                <label htmlFor="interestCompoundingPeriod">
                                    Interest Compounding Period <span className="staged-form-required">*</span>
                                </label>
                                <select
                                    id="interestCompoundingPeriod"
                                    value={formData.Terms?.interestCompoundingPeriod || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Terms", "interestCompoundingPeriod", e.target.value)
                                    }
                                    className="staged-form-select"
                                    required
                                >
                                    <option value="">Select Compounding Period</option>
                                    {formData.fixedDepositProductTemplate?.interestCompoundingPeriodTypeOptions?.map(
                                        (option) => (
                                            <option key={option.id} value={option.id}>
                                                {option.value}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            {/* Interest Posting Period */}
                            <div className="staged-form-field">
                                <label htmlFor="interestPostingPeriod">
                                    Interest Posting Period <span className="staged-form-required">*</span>
                                </label>
                                <select
                                    id="interestPostingPeriod"
                                    value={formData.Terms?.interestPostingPeriod || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Terms", "interestPostingPeriod", e.target.value)
                                    }
                                    className="staged-form-select"
                                    required
                                >
                                    <option value="">Select Posting Period</option>
                                    {formData.fixedDepositProductTemplate?.interestPostingPeriodTypeOptions?.map(
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
                            {/* Interest Calculated Using */}
                            <div className="staged-form-field">
                                <label htmlFor="interestCalculationType">
                                    Interest Calculated Using <span className="staged-form-required">*</span>
                                </label>
                                <select
                                    id="interestCalculationType"
                                    value={formData.Terms?.interestCalculationType || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Terms", "interestCalculationType", e.target.value)
                                    }
                                    className="staged-form-select"
                                    required
                                >
                                    <option value="">Select Calculation Type</option>
                                    {formData.fixedDepositProductTemplate?.interestCalculationTypeOptions?.map(
                                        (option) => (
                                            <option key={option.id} value={option.id}>
                                                {option.value}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            {/* Days in Year */}
                            <div className="staged-form-field">
                                <label htmlFor="daysInYear">
                                    Days in Year <span className="staged-form-required">*</span>
                                </label>
                                <select
                                    id="daysInYear"
                                    value={formData.Terms?.daysInYear || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Terms", "daysInYear", e.target.value)
                                    }
                                    className="staged-form-select"
                                    required
                                >
                                    <option value="">Select Days in Year</option>
                                    {formData.fixedDepositProductTemplate?.interestCalculationDaysInYearTypeOptions?.map(
                                        (option) => (
                                            <option key={option.id} value={option.id}>
                                                {option.value}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>
                        </div>
                    </div>
                );
            case "Settings":
                return (
                    <div className="staged-form-settings">
                        {/* Lock-in Period Section */}
                        <h4 className="staged-form-section-title">Lock-in Period</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="lockInPeriodFrequency">
                                    Frequency
                                </label>
                                <input
                                    id="lockInPeriodFrequency"
                                    type="number"
                                    value={formData.Settings?.lockInPeriodFrequency || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Settings", "lockInPeriodFrequency", e.target.value)
                                    }
                                    className="staged-form-input"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="lockInPeriodType">
                                    Type
                                </label>
                                <select
                                    id="lockInPeriodType"
                                    value={formData.Settings?.lockInPeriodType || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Settings", "lockInPeriodType", e.target.value)
                                    }
                                    className="staged-form-select"
                                >
                                    <option value="">Select Type</option>
                                    {formData.fixedDepositProductTemplate.lockinPeriodFrequencyTypeOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Minimum Deposit Term Section */}
                        <h4 className="staged-form-section-title">Minimum Deposit Term</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="minimumDepositTermFrequency">
                                    Frequency <span className="staged-form-required">*</span>
                                </label>
                                <input
                                    id="minimumDepositTermFrequency"
                                    type="number"
                                    value={formData.Settings?.minimumDepositTermFrequency || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Settings", "minimumDepositTermFrequency", e.target.value)
                                    }
                                    className="staged-form-input"
                                    required
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="minimumDepositTermType">
                                    Frequency Type <span className="staged-form-required">*</span>
                                </label>
                                <select
                                    id="minimumDepositTermType"
                                    value={formData.Settings?.minimumDepositTermType || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Settings", "minimumDepositTermType", e.target.value)
                                    }
                                    className="staged-form-select"
                                    required
                                >
                                    <option value="">Select Type</option>
                                    {formData.fixedDepositProductTemplate.periodFrequencyTypeOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* And Thereafter, in Multiples of Section */}
                        <h4 className="staged-form-section-title">And Thereafter, in Multiples of</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="multiplesFrequency">
                                    Frequency
                                </label>
                                <input
                                    id="multiplesFrequency"
                                    type="number"
                                    value={formData.Settings?.multiplesFrequency || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Settings", "multiplesFrequency", e.target.value)
                                    }
                                    className="staged-form-input"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="multiplesType">
                                    Type
                                </label>
                                <select
                                    id="multiplesType"
                                    value={formData.Settings?.multiplesType || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Settings", "multiplesType", e.target.value)
                                    }
                                    className="staged-form-select"
                                >
                                    <option value="">Select Type</option>
                                    {formData.fixedDepositProductTemplate.periodFrequencyTypeOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Maximum Deposit Term Section */}
                        <h4 className="staged-form-section-title">Maximum Deposit Term</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="maximumDepositTermFrequency">
                                    Frequency
                                </label>
                                <input
                                    id="maximumDepositTermFrequency"
                                    type="number"
                                    value={formData.Settings?.maximumDepositTermFrequency || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Settings", "maximumDepositTermFrequency", e.target.value)
                                    }
                                    className="staged-form-input"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="maximumDepositTermType">
                                    Type
                                </label>
                                <select
                                    id="maximumDepositTermType"
                                    value={formData.Settings?.maximumDepositTermType || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Settings", "maximumDepositTermType", e.target.value)
                                    }
                                    className="staged-form-select"
                                >
                                    <option value="">Select Type</option>
                                    {formData.fixedDepositProductTemplate.periodFrequencyTypeOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* For Pre-Mature Closure Section */}
                        <h4 className="staged-form-section-title">For Pre-Mature Closure</h4>
                        <div className="staged-form-field">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={formData.Settings?.applyPenalInterest || false}
                                    onChange={(e) =>
                                        handleFieldChange("Settings", "applyPenalInterest", e.target.checked)
                                    }
                                />
                                Apply Penal Interest (less)
                            </label>
                        </div>

                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="penalInterest">
                                    Penal Interest (%)
                                </label>
                                <input
                                    id="penalInterest"
                                    type="number"
                                    value={formData.Settings?.penalInterest || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Settings", "penalInterest", e.target.value)
                                    }
                                    className="staged-form-input"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="penalPeriod">
                                    Period
                                </label>
                                <select
                                    id="penalPeriod"
                                    value={formData.Settings?.penalPeriod || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Settings", "penalPeriod", e.target.value)
                                    }
                                    className="staged-form-select"
                                >
                                    <option value="">Select Period</option>
                                    {formData.fixedDepositProductTemplate.preClosurePenalInterestOnTypeOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Withhold Tax Section */}
                        <h4 className="staged-form-section-title">Tax Settings</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={formData.Settings?.isWithholdTaxApplicable || false}
                                        onChange={(e) =>
                                            handleFieldChange("Settings", "isWithholdTaxApplicable", e.target.checked)
                                        }
                                    />
                                    Is Withhold Tax Applicable
                                </label>
                            </div>
                            {formData.Settings?.isWithholdTaxApplicable && (
                                <div className="staged-form-field">
                                    <label htmlFor="taxGroup">
                                        Tax Group <span className="staged-form-required">*</span>
                                    </label>
                                    <select
                                        id="taxGroup"
                                        value={formData.Settings?.taxGroup || ""}
                                        onChange={(e) =>
                                            handleFieldChange("Settings", "taxGroup", e.target.value)
                                        }
                                        className="staged-form-select"
                                        required
                                    >
                                        <option value="">Select Tax Group</option>
                                        {formData.fixedDepositProductTemplate.taxGroupOptions?.map((option) => (
                                            <option key={option.id} value={option.id}>
                                                {option.value}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case "Interest Rate Chart":
                return (
                    <div className="staged-form-interest-rate-chart">
                        <div className="staged-form-row">
                            <h4 className="staged-form-section">Interest Rate Chart</h4>
                            <button
                                className="staged-form-button-add"
                                onClick={() =>
                                    setInterestRateCharts((prev) => [
                                        ...prev,
                                        { id: Date.now(), name: "", fromDate: "", endDate: "", description: "", slabs: [] },
                                    ])
                                }
                            >
                                Add Chart
                            </button>
                        </div>

                        {interestRateCharts.map((chart) => (
                            <div key={chart.id} className="interest-rate-chart-form">
                                <button
                                    className="staged-form-icon-button-delete chart-delete-button"
                                    onClick={() => handleDeleteChart(chart.id)}
                                >
                                    <FaTrash />
                                </button>

                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor={`name-${chart.id}`}>Name <span className="staged-form-required">*</span></label>
                                        <input
                                            id={`name-${chart.id}`}
                                            type="text"
                                            value={chart.name}
                                            onChange={(e) => handleChartChange(chart.id, "name", e.target.value)}
                                            className="staged-form-input"
                                            required
                                        />
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor={`fromDate-${chart.id}`}>From Date <span className="staged-form-required">*</span></label>
                                        <input
                                            id={`fromDate-${chart.id}`}
                                            type="date"
                                            value={chart.fromDate}
                                            onChange={(e) => handleChartChange(chart.id, "fromDate", e.target.value)}
                                            className="staged-form-input"
                                            required
                                        />
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor={`endDate-${chart.id}`}>End Date</label>
                                        <input
                                            id={`endDate-${chart.id}`}
                                            type="date"
                                            value={chart.endDate}
                                            onChange={(e) => handleChartChange(chart.id, "endDate", e.target.value)}
                                            className="staged-form-input"
                                        />
                                    </div>
                                </div>

                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor={`description-${chart.id}`}>
                                            Description <span className="staged-form-required">*</span>
                                        </label>
                                        <input
                                            id={`description-${chart.id}`}
                                            type="text"
                                            value={chart.description}
                                            onChange={(e) => handleChartChange(chart.id, "description", e.target.value)}
                                            className="staged-form-input"
                                            required
                                        />
                                    </div>
                                    <div className="staged-form-field">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={chart.isPrimaryGroupingByAmount || false}
                                                onChange={(e) =>
                                                    handleChartChange(chart.id, "isPrimaryGroupingByAmount", e.target.checked)
                                                }
                                            />
                                            Is primary grouping by amount?
                                        </label>
                                    </div>
                                </div>

                                <button
                                    className="staged-form-button-add"
                                    onClick={() => openSlabModal(chart.id)}
                                >
                                    Add Slab
                                </button>

                                {chart.slabs.length === 0 && (
                                    <p className="staged-form-note">It is required to add at least one slab.</p>
                                )}

                                {chart.slabs.length > 0 && (
                                    <table className="staged-form-table">
                                        <thead>
                                        <tr>
                                            <th>Amount Range</th>
                                            <th>Period</th>
                                            <th>Interest</th>
                                            <th>Description</th>
                                            <th>Actions</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {chart.slabs.map((slab) => (
                                            <React.Fragment key={slab.id}>
                                                <tr>
                                                    <td>{`${slab.amountRangeFrom} - ${slab.amountRangeTo}`}</td>
                                                    <td>{`${slab.periodFrom} - ${slab.periodTo} (${slab.periodType})`}</td>
                                                    <td>{`${slab.interest}%`}</td>
                                                    <td>{slab.description || "N/A"}</td>
                                                    <td>
                                                        <button
                                                            className="staged-form-icon-button-edit"
                                                            onClick={() => openSlabModal(chart.id, slab)}
                                                        >
                                                            <FaEdit/>
                                                        </button>
                                                        <button
                                                            className="staged-form-icon-button-delete"
                                                            onClick={() => handleDeleteSlab(chart.id, slab.id)}
                                                        >
                                                            <FaTrash/>
                                                        </button>
                                                        <button
                                                            className="staged-form-icon-button-view"
                                                            onClick={() => toggleIncentivesView(chart.id, slab.id)}
                                                        >
                                                            {slab.incentivesVisible ? (
                                                                <>
                                                                    <FaEyeSlash/> Hide Incentives
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <FaEye/> View Incentives
                                                                </>
                                                            )}
                                                        </button>
                                                    </td>
                                                </tr>
                                                {slab.incentivesVisible && (
                                                    <tr>
                                                        <td colSpan="5">
                                                            <div className="incentives-section">
                                                                <h5>Incentives</h5>
                                                                {Array.isArray(slab.incentives) && slab.incentives.length > 0 ? (
                                                                    <table className="staged-form-table">
                                                                        <thead>
                                                                        <tr>
                                                                            <th>Entity Type</th>
                                                                            <th>Attribute Name</th>
                                                                            <th>Attribute Value</th>
                                                                            <th>Condition Type</th>
                                                                            <th>Incentive Type</th>
                                                                            <th>Interest</th>
                                                                            <th>Actions</th>
                                                                        </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                        {slab.incentives.map((incentive) => (
                                                                            <tr key={incentive.id}>
                                                                                <td>{incentive.entityType || ""}</td>
                                                                                <td>{incentive.attributeName || ""}</td>
                                                                                <td>{incentive.value || ""}</td>
                                                                                <td>{incentive.conditionType || ""}</td>
                                                                                <td>{incentive.incentiveType || ""}</td>
                                                                                <td>{`${incentive.interest || 0}%`}</td>
                                                                                <td>
                                                                                    <button
                                                                                        className="staged-form-icon-button-edit"
                                                                                        onClick={() =>
                                                                                            openIncentiveModal(chart.id, slab.id, incentive)
                                                                                        }
                                                                                    >
                                                                                        <FaEdit/>
                                                                                    </button>
                                                                                    <button
                                                                                        className="staged-form-icon-button-delete"
                                                                                        onClick={() =>
                                                                                            handleDeleteIncentive(chart.id, slab.id, incentive.id)
                                                                                        }
                                                                                    >
                                                                                        <FaTrash/>
                                                                                    </button>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                        </tbody>
                                                                    </table>
                                                                ) : (
                                                                    <p className={"no-data"}>No incentives available for this slab.</p>
                                                                )}
                                                                <button
                                                                    className="staged-form-button-add"
                                                                    onClick={() => openIncentiveModal(chart.id, slab.id)}
                                                                >
                                                                    Add Incentive
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        ))}

                        {slabModal.isOpen && (
                            <SlabModal
                                modalData={slabModal.data}
                                onClose={closeSlabModal}
                                onSubmit={(data) => handleSlabSubmit(slabModal.chartId, data)}
                                backendOptions={formData.fixedDepositProductTemplate}
                            />
                        )}

                        {incentiveModal.isOpen && (
                            <IncentiveModal
                                modalData={incentiveModal.data}
                                onClose={closeIncentiveModal}
                                onSubmit={(data) => handleIncentiveSubmit(incentiveModal.chartId, incentiveModal.slabId, data)}
                                backendOptions={formData.fixedDepositProductTemplate}
                            />
                        )}
                    </div>
                );
            case "Charges":
                return (
                    <div className="staged-form-charges">
                        <h4 className="staged-form-section-title">Charges</h4>

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
                                    {formData.fixedDepositProductTemplate?.chargeOptions
                                        ?.filter(
                                            (option) =>
                                                !formData.Charges?.selectedCharges?.some(
                                                    (item) => item.id === option.id
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
                                    const selectedChargeId = parseInt(formData.Charges?.selectedCharge, 10);
                                    const selectedCharge = formData.fixedDepositProductTemplate?.chargeOptions?.find(
                                        (charge) => charge.id === selectedChargeId
                                    );
                                    if (selectedCharge) {
                                        setFormData((prevData) => ({
                                            ...prevData,
                                            Charges: {
                                                ...prevData.Charges,
                                                selectedCharges: [
                                                    ...(prevData.Charges?.selectedCharges || []),
                                                    selectedCharge,
                                                ],
                                                selectedCharge: "",
                                            },
                                        }));
                                    }
                                }}
                                disabled={!formData.Charges?.selectedCharge}
                            >
                                Add
                            </button>
                        </div>

                        {formData.Charges?.selectedCharges?.length > 0 && (
                            <table className="staged-form-table">
                                <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Collected On</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {formData.Charges.selectedCharges.map((charge) => (
                                    <tr key={charge.id}>
                                        <td>{charge.name}</td>
                                        <td>{charge.chargeCalculationType.value}</td>
                                        <td>
                                            {new Intl.NumberFormat('en-US', {
                                                style: 'currency',
                                                currency: charge.currency.displaySymbol,
                                                minimumFractionDigits: charge.currency.decimalPlaces,
                                            }).format(charge.amount)}
                                        </td>
                                        <td>{charge.chargeTimeType.value}</td>
                                        <td>
                                            <button
                                                className="staged-form-icon-button-delete"
                                                onClick={() => {
                                                    setFormData((prevData) => ({
                                                        ...prevData,
                                                        Charges: {
                                                            ...prevData.Charges,
                                                            selectedCharges: prevData.Charges.selectedCharges.filter(
                                                                (item) => item.id !== charge.id
                                                            ),
                                                        },
                                                    }));
                                                }}
                                            >
                                                <FaTrash/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
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
                            {["None", "Cash", "Accrual (periodic)"].map((option) => (
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

                        {formData.Accounting?.selectedOption === "Cash" && (
                            <>
                                {/* Assets Section */}
                                <h5>Assets</h5>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="savingsReference">
                                            Savings Reference <span className="staged-form-required">*</span>
                                        </label>
                                        <select
                                            id="savingsReference"
                                            value={formData.Accounting?.savingsReference || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "savingsReference", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Savings Reference</option>
                                            {Array.isArray(formData.savingsProductTemplate?.accountingMappingOptions) &&
                                                formData.savingsProductTemplate.accountingMappingOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        {option.value}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Liabilities Section */}
                                <h5>Liabilities</h5>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="savingsControl">
                                            Savings Control <span className="staged-form-required">*</span>
                                        </label>
                                        <select
                                            id="savingsControl"
                                            value={formData.Accounting?.savingsControl || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "savingsControl", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Savings Control</option>
                                            {Array.isArray(formData.savingsProductTemplate?.accountingMappingOptions) &&
                                                formData.savingsProductTemplate.accountingMappingOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        {option.value}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="savingsTransferInSuspense">
                                            Savings Transfer in Suspense <span className="staged-form-required">*</span>
                                        </label>
                                        <select
                                            id="savingsTransferInSuspense"
                                            value={formData.Accounting?.savingsTransferInSuspense || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "savingsTransferInSuspense", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Savings Transfer in Suspense</option>
                                            {Array.isArray(formData.savingsProductTemplate?.accountingMappingOptions) &&
                                                formData.savingsProductTemplate.accountingMappingOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        {option.value}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Expenses Section */}
                                <h5>Expenses</h5>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="interestOnSavings">
                                            Interest on Savings <span className="staged-form-required">*</span>
                                        </label>
                                        <select
                                            id="interestOnSavings"
                                            value={formData.Accounting?.interestOnSavings || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "interestOnSavings", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Interest on Savings</option>
                                            {Array.isArray(formData.savingsProductTemplate?.accountingMappingOptions) &&
                                                formData.savingsProductTemplate.accountingMappingOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        {option.value}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Income Section */}
                                <h5>Income</h5>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="incomeFromFees">
                                            Income from Fees <span className="staged-form-required">*</span>
                                        </label>
                                        <select
                                            id="incomeFromFees"
                                            value={formData.Accounting?.incomeFromFees || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "incomeFromFees", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Income from Fees</option>
                                            {Array.isArray(formData.savingsProductTemplate?.accountingMappingOptions) &&
                                                formData.savingsProductTemplate.accountingMappingOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        {option.value}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="incomeFromPenalties">
                                            Income from Penalties <span className="staged-form-required">*</span>
                                        </label>
                                        <select
                                            id="incomeFromPenalties"
                                            value={formData.Accounting?.incomeFromPenalties || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "incomeFromPenalties", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Income from Penalties</option>
                                            {Array.isArray(formData.savingsProductTemplate?.accountingMappingOptions) &&
                                                formData.savingsProductTemplate.accountingMappingOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        {option.value}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Advanced Accounting Rules */}
                                <h5>Advanced Accounting Rules</h5>
                                <div className="staged-form-field">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={formData.Accounting?.advancedAccountingRules || false}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "advancedAccountingRules", e.target.checked)
                                            }
                                        />
                                        Advanced Accounting Rules
                                    </label>
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
                        {formData.Accounting?.selectedOption === "Accrual (periodic)" && (
                            <>
                                {/* Assets Section */}
                                <h5>Assets</h5>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="savingsReference">
                                            Savings Reference <span className="staged-form-required">*</span>
                                        </label>
                                        <select
                                            id="savingsReference"
                                            value={formData.Accounting?.savingsReference || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "savingsReference", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Savings Reference</option>
                                            {Array.isArray(formData.savingsProductTemplate?.accountingMappingOptions) &&
                                                formData.savingsProductTemplate.accountingMappingOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        {option.value}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="feesReceivable">
                                            Fees Receivable <span className="staged-form-required">*</span>
                                        </label>
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
                                            {Array.isArray(formData.savingsProductTemplate?.accountingMappingOptions) &&
                                                formData.savingsProductTemplate.accountingMappingOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        {option.value}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="penaltiesReceivable">
                                            Penalties Receivable <span className="staged-form-required">*</span>
                                        </label>
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
                                            {Array.isArray(formData.savingsProductTemplate?.accountingMappingOptions) &&
                                                formData.savingsProductTemplate.accountingMappingOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        {option.value}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Liabilities Section */}
                                <h5>Liabilities</h5>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="savingsControl">
                                            Savings Control <span className="staged-form-required">*</span>
                                        </label>
                                        <select
                                            id="savingsControl"
                                            value={formData.Accounting?.savingsControl || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "savingsControl", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Savings Control</option>
                                            {Array.isArray(formData.savingsProductTemplate?.accountingMappingOptions) &&
                                                formData.savingsProductTemplate.accountingMappingOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        {option.value}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="savingsTransferInSuspense">
                                            Savings Transfer in Suspense <span className="staged-form-required">*</span>
                                        </label>
                                        <select
                                            id="savingsTransferInSuspense"
                                            value={formData.Accounting?.savingsTransferInSuspense || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "savingsTransferInSuspense", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Savings Transfer in Suspense</option>
                                            {Array.isArray(formData.savingsProductTemplate?.accountingMappingOptions) &&
                                                formData.savingsProductTemplate.accountingMappingOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        {option.value}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="interestPayable">
                                            Interest Payable <span className="staged-form-required">*</span>
                                        </label>
                                        <select
                                            id="interestPayable"
                                            value={formData.Accounting?.interestPayable || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "interestPayable", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Interest Payable</option>
                                            {Array.isArray(formData.savingsProductTemplate?.accountingMappingOptions) &&
                                                formData.savingsProductTemplate.accountingMappingOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        {option.value}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Expenses Section */}
                                <h5>Expenses</h5>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="interestOnSavings">
                                            Interest on Savings <span className="staged-form-required">*</span>
                                        </label>
                                        <select
                                            id="interestOnSavings"
                                            value={formData.Accounting?.interestOnSavings || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "interestOnSavings", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Interest on Savings</option>
                                            {Array.isArray(formData.savingsProductTemplate?.accountingMappingOptions) &&
                                                formData.savingsProductTemplate.accountingMappingOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        {option.value}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Income Section */}
                                <h5>Income</h5>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="incomeFromFees">
                                            Income from Fees <span className="staged-form-required">*</span>
                                        </label>
                                        <select
                                            id="incomeFromFees"
                                            value={formData.Accounting?.incomeFromFees || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "incomeFromFees", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Income from Fees</option>
                                            {Array.isArray(formData.savingsProductTemplate?.accountingMappingOptions) &&
                                                formData.savingsProductTemplate.accountingMappingOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        {option.value}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="incomeFromPenalties">
                                            Income from Penalties <span className="staged-form-required">*</span>
                                        </label>
                                        <select
                                            id="incomeFromPenalties"
                                            value={formData.Accounting?.incomeFromPenalties || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "incomeFromPenalties", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Income from Penalties</option>
                                            {Array.isArray(formData.savingsProductTemplate?.accountingMappingOptions) &&
                                                formData.savingsProductTemplate.accountingMappingOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        {option.value}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Advanced Accounting Rules */}
                                <h5>Advanced Accounting Rules</h5>
                                <div className="staged-form-field">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={formData.Accounting?.advancedAccountingRules || false}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "advancedAccountingRules", e.target.checked)
                                            }
                                        />
                                        Advanced Accounting Rules
                                    </label>
                                </div>
                                {formData.Accounting?.advancedAccountingRules && (
                                    <>
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
                                if (completedStages.has(stage)) {
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

    const renderPreviewSection = () => {
        const stageData = [
            { title: "Details", data: formData.Details },
            { title: "Currency", data: formData.Currency },
            { title: "Terms", data: formData.Terms },
            { title: "Settings", data: formData.Settings },
            { title: "Interest Rate Chart", data: formData.InterestRateChart },
            { title: "Charges", data: formData.Charges },
            { title: "Accounting", data: formData.Accounting },
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
                        {Array.isArray(data) && data.length > 0 ? (
                            <table className="staged-form-preview-table">
                                <thead>
                                <tr>
                                    {Object.keys(data[0])
                                        .filter((key) => key !== "id")
                                        .map((key) => (
                                            <th key={key}>{key}</th>
                                        ))}
                                </tr>
                                </thead>
                                <tbody>
                                {data.map((item, i) => (
                                    <tr key={i}>
                                        {Object.entries(item)
                                            .filter(([key]) => key !== "id")
                                            .map(([key, value], j) => (
                                                <td key={j}>
                                                    {typeof value === "object"
                                                        ? JSON.stringify(value)
                                                        : value}
                                                </td>
                                            ))}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        ) : data && Object.keys(data).length > 0 ? (
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
                                                : value || "N/A"}
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
            {renderStageTracker()}
            <div className="staged-form-stage-content">
                {currentStage === stages.length && allStagesComplete ? (
                    renderPreviewSection()
                ) : (
                    renderStageContent()
                )}
            </div>
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
                    >
                        Next
                    </button>
                )}
                {currentStage === stages.length && (
                    <button
                        onClick={handlePreview}
                        className="staged-form-button-preview"
                        disabled={!allStagesComplete}
                    >
                        Submit
                    </button>
                )}
            </div>
        </div>
    );

};

export default CreateFixedDepositProducts;
