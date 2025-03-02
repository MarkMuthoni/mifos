import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../../../../context/AuthContext";
import { useLoading } from "../../../../../context/LoadingContext";
import { API_CONFIG } from "../../../../../config";
import {FaEdit, FaTrash} from "react-icons/fa";

const stages = [
    "Details",
    "Currency",
    "Terms",
    "Settings",
    "Market Price",
    "Charges",
    "Accounting",
];

const CreateShareProducts = () => {
    const [currentStage, setCurrentStage] = useState(0);
    const [formData, setFormData] = useState({});
    const [completedStages, setCompletedStages] = useState(new Set());
    const [errors, setErrors] = useState({});
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const [marketPriceData, setMarketPriceData] = useState([]);
    const [modalState, setModalState] = useState({
        isOpen: false,
        type: "",
        data: null,
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                startLoading();

                const shareProductTemplateResponse = await axios.get(
                    `/fineract-provider/api/v1/products/share/template`,
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
                    shareProductTemplate: shareProductTemplateResponse.data,
                }));
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                stopLoading();
            }
        };

        fetchData();
    }, []);

    const openModal = (type, data = null) => {
        setModalState({ isOpen: true, type, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, type: "", data: null });
    };

    const handleSubmitModalData = (newData) => {
        setMarketPriceData((prevData) => {
            const updatedData = [...prevData];
            if (modalState.data?.id) {
                const index = updatedData.findIndex((item) => item.id === modalState.data.id);
                if (index > -1) {
                    updatedData[index] = { ...newData, id: modalState.data.id };
                }
            } else {
                updatedData.push({ ...newData, id: Date.now() });
            }

            setFormData((prev) => ({
                ...prev,
                MarketPrice: updatedData,
            }));
            return updatedData;
        });
        closeModal();
    };

    const handleDeleteEntry = (id) => {
        setMarketPriceData((prevData) => {
            const updatedData = prevData.filter((item) => item.id !== id);

            setFormData((prev) => ({
                ...prev,
                MarketPrice: updatedData,
            }));

            return updatedData;
        });
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
                                    {formData.shareProductTemplate?.currencyOptions?.map((option) => (
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
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="totalNumberOfShares">
                                    Total Number of Shares <span className="staged-form-required">*</span>
                                </label>
                                <input
                                    id="totalNumberOfShares"
                                    type="number"
                                    value={formData.Terms?.totalNumberOfShares || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Terms", "totalNumberOfShares", e.target.value)
                                    }
                                    className="staged-form-input"
                                    required
                                />
                            </div>

                            <div className="staged-form-field">
                                <label htmlFor="sharesToBeIssued">
                                    Shares to be Issued <span className="staged-form-required">*</span>
                                </label>
                                <input
                                    id="sharesToBeIssued"
                                    type="number"
                                    value={formData.Terms?.sharesToBeIssued || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Terms", "sharesToBeIssued", e.target.value)
                                    }
                                    className="staged-form-input"
                                    required
                                />
                            </div>
                        </div>

                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="nominalUnitPrice">
                                    Nominal/Unit Price <span className="staged-form-required">*</span>
                                </label>
                                <input
                                    id="nominalUnitPrice"
                                    type="number"
                                    value={formData.Terms?.nominalUnitPrice || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Terms", "nominalUnitPrice", e.target.value)
                                    }
                                    className="staged-form-input"
                                    required
                                />
                            </div>

                            <div className="staged-form-field">
                                <label htmlFor="capitalValue">
                                    Capital Value
                                </label>
                                <input
                                    id="capitalValue"
                                    type="text"
                                    value={
                                        formData.Terms?.sharesToBeIssued && formData.Terms?.nominalUnitPrice
                                            ? formData.Terms.sharesToBeIssued * formData.Terms.nominalUnitPrice
                                            : ""
                                    }
                                    className="staged-form-input"
                                    readOnly
                                />
                                <small className="staged-form-note">
                                    Shares to be Issued * Nominal Price (Auto-calculated)
                                </small>
                            </div>
                        </div>
                    </div>
                );
            case "Settings":
                return (
                    <div className="staged-form-settings">
                        <h4 className="staged-form-section-title">Shares per Client</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="minimumShares">
                                    Minimum
                                </label>
                                <input
                                    id="minimumShares"
                                    type="number"
                                    value={formData.Settings?.minimumShares || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Settings", "minimumShares", e.target.value)
                                    }
                                    className="staged-form-input"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="defaultShares">
                                    Default <span className="staged-form-required">*</span>
                                </label>
                                <input
                                    id="defaultShares"
                                    type="number"
                                    value={formData.Settings?.defaultShares || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Settings", "defaultShares", e.target.value)
                                    }
                                    className="staged-form-input"
                                    required
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="maximumShares">
                                    Maximum
                                </label>
                                <input
                                    id="maximumShares"
                                    type="number"
                                    value={formData.Settings?.maximumShares || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Settings", "maximumShares", e.target.value)
                                    }
                                    className="staged-form-input"
                                />
                            </div>
                        </div>

                        <h4 className="staged-form-section-title">Minimum Active Period</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="minimumActivePeriodFrequency">
                                    Frequency
                                </label>
                                <input
                                    id="minimumActivePeriodFrequency"
                                    type="number"
                                    value={formData.Settings?.minimumActivePeriodFrequency || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Settings", "minimumActivePeriodFrequency", e.target.value)
                                    }
                                    className="staged-form-input"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="minimumActivePeriodType">
                                    Type
                                </label>
                                <select
                                    id="minimumActivePeriodType"
                                    value={formData.Settings?.minimumActivePeriodType || ""}
                                    onChange={(e) =>
                                        handleFieldChange("Settings", "minimumActivePeriodType", e.target.value)
                                    }
                                    className="staged-form-select"
                                >
                                    <option value="">Select Type</option>
                                    {formData.shareProductTemplate.minimumActivePeriodFrequencyTypeOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

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
                                    {formData.shareProductTemplate.lockinPeriodFrequencyTypeOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="staged-form-field">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={formData.Settings?.allowDividendsForInactiveClients || false}
                                    onChange={(e) =>
                                        handleFieldChange(
                                            "Settings",
                                            "allowDividendsForInactiveClients",
                                            e.target.checked
                                        )
                                    }
                                />
                                Allow dividends for inactive clients
                            </label>
                        </div>
                    </div>
                );
            case "Market Price":
                return (
                    <div className="staged-form-market-price">
                        <div className="staged-form-row">
                            <h4 className="staged-form-section">Market Price</h4>

                            <button
                                className="staged-form-button-add"
                                onClick={() => openModal("marketPrice", {fromDate: "", unitPrice: ""})}
                            >
                                Add
                            </button>
                        </div>
                        {formData.MarketPrice?.length > 0 && (
                            <table className="staged-form-table">
                                <thead>
                                <tr>
                                    <th>From Date</th>
                                    <th>Nominal/Unit Price</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {formData.MarketPrice.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.fromDate}</td>
                                        <td>{Number(item.unitPrice).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                        <td>
                                            <button
                                                className="staged-form-icon-button-edit"
                                                onClick={() => openModal("marketPrice", item)}
                                            >
                                                <FaEdit/>
                                            </button>
                                            <button
                                                className="staged-form-icon-button-delete"
                                                onClick={() => handleDeleteEntry(item.id)}
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
                                    {formData.shareProductTemplate?.chargeOptions
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
                                    const selectedCharge = formData.shareProductTemplate?.chargeOptions?.find(
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
                            {["None", "Cash"].map((option) => (
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
                                        <label htmlFor="shareReference">
                                            Share Reference <span className="staged-form-required">*</span>
                                        </label>
                                        <select
                                            id="shareReference"
                                            value={formData.Accounting?.shareReference || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "shareReference", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Share Reference</option>
                                            {Array.isArray(formData.shareProductTemplate?.accountingMappingOptions) &&
                                                formData.shareProductTemplate.accountingMappingOptions.map((option) => (
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
                                        <label htmlFor="shareSuspenseControl">
                                            Share Suspense Control <span className="staged-form-required">*</span>
                                        </label>
                                        <select
                                            id="shareSuspenseControl"
                                            value={formData.Accounting?.shareSuspenseControl || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "shareSuspenseControl", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Share Suspense Control</option>
                                            {Array.isArray(formData.shareProductTemplate?.accountingMappingOptions) &&
                                                formData.shareProductTemplate.accountingMappingOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        {option.value}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Share Equity Section */}
                                <h5>Share Equity</h5>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="equity">
                                            Equity <span className="staged-form-required">*</span>
                                        </label>
                                        <select
                                            id="equity"
                                            value={formData.Accounting?.equity || ""}
                                            onChange={(e) =>
                                                handleFieldChange("Accounting", "equity", e.target.value)
                                            }
                                            required
                                            className="staged-form-select"
                                        >
                                            <option value="">Select Equity</option>
                                            {Array.isArray(formData.shareProductTemplate?.accountingMappingOptions) &&
                                                formData.shareProductTemplate.accountingMappingOptions.map((option) => (
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
                                            {Array.isArray(formData.shareProductTemplate?.accountingMappingOptions) &&
                                                formData.shareProductTemplate.accountingMappingOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        {option.value}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
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
            { title: "Market Price", data: formData.MarketPrice },
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
            {modalState.isOpen && modalState.type === "marketPrice" && (
                <div className="staged-modal-container">
                    <div className="staged-modal-content">
                        <h3 className="modal-staged-form-title">
                            {modalState.data?.id ? "Edit Market Price Period" : "Add Market Price Period"}
                        </h3>
                        <div className="staged-form-field">
                            <label htmlFor="fromDate">
                                From Date <span className="staged-form-required">*</span>
                            </label>
                            <input
                                id="fromDate"
                                type="date"
                                value={modalState.data?.fromDate || ""}
                                onChange={(e) =>
                                    setModalState((prev) => ({
                                        ...prev,
                                        data: { ...prev.data, fromDate: e.target.value },
                                    }))
                                }
                                required
                            />
                        </div>
                        <div className="staged-form-field">
                            <label htmlFor="unitPrice">
                                Nominal/Unit Price <span className="staged-form-required">*</span>
                            </label>
                            <input
                                id="unitPrice"
                                type="number"
                                min={0}
                                value={modalState.data?.unitPrice || ""}
                                onChange={(e) =>
                                    setModalState((prev) => ({
                                        ...prev,
                                        data: { ...prev.data, unitPrice: e.target.value },
                                    }))
                                }
                                required
                            />
                        </div>
                        <div className="staged-form-modal-buttons">
                            <button onClick={closeModal} className="staged-form-modal-button-cancel">
                                Cancel
                            </button>
                            <button
                                onClick={() => handleSubmitModalData(modalState.data)}
                                className="staged-form-modal-button-submit"
                                disabled={!modalState.data?.fromDate || !modalState.data?.unitPrice}
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

export default CreateShareProducts;
