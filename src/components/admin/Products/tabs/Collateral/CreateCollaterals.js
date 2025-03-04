import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../../../../context/AuthContext";
import { useLoading } from "../../../../../context/LoadingContext";
import { API_CONFIG } from "../../../../../config";
import "./CreateCollaterals.css";
import {NotificationContext} from "../../../../../context/NotificationContext";

const CreateCollateral = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();

    const [name, setName] = useState("");
    const [quality, setQuality] = useState("");
    const [unitType, setUnitType] = useState("");
    const [basePrice, setBasePrice] = useState("");
    const [pctToBase, setPctToBase] = useState("");
    const [currency, setCurrency] = useState("");
    const [currencyOptions, setCurrencyOptions] = useState([]);

    useEffect(() => {
        fetchTemplateData();
    }, []);

    const fetchTemplateData = async () => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/collateral-management/template`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });
            setCurrencyOptions(response.data || []);
        } catch (error) {
            console.error("Error fetching template data:", error);
            showNotification("Error fetching template data:", 'error');
        } finally {
            stopLoading();
        }
    };

    const handleSubmit = async () => {
        if (!name || !quality || !unitType || !basePrice || !pctToBase || !currency) return;

        const payload = {
            name,
            quality,
            unitType,
            basePrice,
            pctToBase,
            currency,
            locale: "en",
        };

        try {
            startLoading();
            await axios.post(`${API_CONFIG.proxy}/fineract-provider/api/v1/collateral-management`, payload, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });
            showNotification("Collateral created successfully!", 'success');
            setName("");
            setQuality("");
            setUnitType("");
            setBasePrice("");
            setPctToBase("");
            setCurrency("");
        } catch (error) {
            console.error("Error creating collateral:", error);
            showNotification("Error creating collateral:", 'error');
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="create-collateral-form">
            <h3 className="collateral-form-heading">Create Collateral</h3>
            <div className="collateral-form-row">
                <div className="collateral-form-group">
                    <label htmlFor="name" className="collateral-label">
                        Name <span>*</span>
                    </label>
                    <input
                        type="text"
                        id="name"
                        className="collateral-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter collateral name"
                    />
                </div>
                <div className="collateral-form-group">
                    <label htmlFor="quality" className="collateral-label">
                        Type/Quality <span>*</span>
                    </label>
                    <input
                        type="text"
                        id="quality"
                        className="collateral-input"
                        value={quality}
                        onChange={(e) => setQuality(e.target.value)}
                        placeholder="Enter type/quality"
                    />
                </div>
            </div>
            <div className="collateral-form-row">
                <div className="collateral-form-group">
                    <label htmlFor="unitType" className="collateral-label">
                        Unit Type <span>*</span>
                    </label>
                    <input
                        type="text"
                        id="unitType"
                        className="collateral-input"
                        value={unitType}
                        onChange={(e) => setUnitType(e.target.value)}
                        placeholder="Enter unit type"
                    />
                </div>
                <div className="collateral-form-group">
                    <label htmlFor="basePrice" className="collateral-label">
                        Base Price <span>*</span>
                    </label>
                    <input
                        type="number"
                        id="basePrice"
                        className="collateral-input"
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value)}
                        placeholder="Enter base price"
                    />
                </div>
            </div>
            <div className="collateral-form-row">
                <div className="collateral-form-group">
                    <label htmlFor="pctToBase" className="collateral-label">
                        Percentage to Base <span>*</span>
                    </label>
                    <input
                        type="number"
                        id="pctToBase"
                        className="collateral-input"
                        value={pctToBase}
                        onChange={(e) => setPctToBase(e.target.value)}
                        placeholder="Enter percentage to base"
                    />
                </div>
                <div className="collateral-form-group">
                    <label htmlFor="currency" className="collateral-label">
                        Currency <span>*</span>
                    </label>
                    <select
                        id="currency"
                        className="collateral-select"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                    >
                        <option value="">Select Currency</option>
                        {currencyOptions.map((option) => (
                            <option key={option.code} value={option.code}>
                                {option.name} ({option.code})
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="collateral-actions">
                <button
                    className="collateral-submit-button"
                    onClick={handleSubmit}
                    disabled={!name || !quality || !unitType || !basePrice || !pctToBase || !currency}
                >
                    Submit
                </button>
            </div>
        </div>
    );
};

export default CreateCollateral;
