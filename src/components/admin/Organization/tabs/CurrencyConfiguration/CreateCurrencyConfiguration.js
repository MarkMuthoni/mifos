import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../../../../context/AuthContext";
import { useLoading } from "../../../../../context/LoadingContext";
import { API_CONFIG } from "../../../../../config";
import { FaTrash } from "react-icons/fa";
import "./CreateCurrencyConfiguration.css";
import {NotificationContext} from "../../../../../context/NotificationContext";

const CreateEditCurrencies = ({ onSuccess }) => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();

    const [currencyOptions, setCurrencyOptions] = useState([]);
    const [selectedCurrencies, setSelectedCurrencies] = useState([]);
    const [availableCurrencies, setAvailableCurrencies] = useState([]);
    const [initialSelectedCurrencies, setInitialSelectedCurrencies] = useState([]);

    useEffect(() => {
        fetchCurrencies();
    }, []);

    const fetchCurrencies = async () => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/currencies`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                },
            });

            const allCurrencies = response.data.currencyOptions || [];
            const currentCurrencies = response.data.selectedCurrencyOptions || [];

            const selectedCodes = currentCurrencies.map((currency) => currency.code);
            const available = allCurrencies.filter((currency) => !selectedCodes.includes(currency.code));

            setCurrencyOptions(allCurrencies);
            setInitialSelectedCurrencies(currentCurrencies);
            setSelectedCurrencies(currentCurrencies);
            setAvailableCurrencies(available);
        } catch (error) {
            console.error("Error fetching currencies:", error);
        } finally {
            stopLoading();
        }
    };

    const handleAddCurrency = (currencyCode) => {
        const addedCurrency = currencyOptions.find((currency) => currency.code === currencyCode);

        setSelectedCurrencies([...selectedCurrencies, addedCurrency]);
        setAvailableCurrencies(availableCurrencies.filter((currency) => currency.code !== currencyCode));
    };

    const handleRemoveCurrency = (currencyCode) => {
        const removedCurrency = selectedCurrencies.find((currency) => currency.code === currencyCode);

        setAvailableCurrencies((prevAvailable) =>
            [...prevAvailable, removedCurrency].sort((a, b) => a.name.localeCompare(b.name))
        );

        setSelectedCurrencies((prevSelected) =>
            prevSelected.filter((currency) => currency.code !== currencyCode)
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            currencies: selectedCurrencies.map((currency) => currency.code),
        };

        startLoading();
        try {
            await axios.put(`${API_CONFIG.proxy}/fineract-provider/api/v1/currencies`, payload, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });

            onSuccess();
            showNotification("Currencies updated!", 'success');
        } catch (error) {
            console.error("Error updating currencies:", error);
        } finally {
            stopLoading();
        }
    };

    const hasChanges = () => {
        const initialCodes = initialSelectedCurrencies.map((currency) => currency.code);
        const currentCodes = selectedCurrencies.map((currency) => currency.code);
        return JSON.stringify(initialCodes.sort()) !== JSON.stringify(currentCodes.sort());
    };

    return (
        <div className="create-edit-currencies-container">
            <form className="create-edit-currencies-form" onSubmit={handleSubmit}>
                <h3 className="create-edit-currencies-title">Manage Currencies</h3>

                <div className="create-edit-currencies-group">
                    <label className="create-edit-currencies-label">Available Currencies</label>
                    <select
                        className="create-edit-currencies-select"
                        onChange={(e) => handleAddCurrency(e.target.value)}
                        value=""
                    >
                        <option value="">-- Add Currency --</option>
                        {availableCurrencies.map((currency, index) => (
                            <option key={index} value={currency.code}>
                                {currency.name} ({currency.code})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="create-edit-currencies-group">
                    <label className="create-edit-currencies-label">Selected Currencies</label>
                    <div className="create-edit-currencies-table-container">
                        <table className="create-edit-currencies-table">
                            <tbody>
                            {selectedCurrencies.map((currency, index) => {
                                if (index % 2 === 0) {
                                    return (
                                        <tr key={index}>
                                            <td className="currency-column">
                                                    <span className="currency-name">
                                                        {currency.name.length > 20
                                                            ? `${currency.name.slice(0, 20)}...`
                                                            : currency.name}
                                                    </span>
                                                <span className="currency-code">({currency.code})</span>
                                                <FaTrash
                                                    className="create-edit-currencies-trash-icon"
                                                    onClick={() => handleRemoveCurrency(currency.code)}
                                                />
                                            </td>
                                            {selectedCurrencies[index + 1] ? (
                                                <td className="currency-column">
                                                        <span className="currency-name">
                                                            {selectedCurrencies[index + 1].name.length > 20
                                                                ? `${selectedCurrencies[index + 1].name.slice(
                                                                    0,
                                                                    20
                                                                )}...`
                                                                : selectedCurrencies[index + 1].name}
                                                        </span>
                                                    <span className="currency-code">
                                                            ({selectedCurrencies[index + 1].code})
                                                        </span>
                                                    <FaTrash
                                                        className="create-edit-currencies-trash-icon"
                                                        onClick={() =>
                                                            handleRemoveCurrency(
                                                                selectedCurrencies[index + 1].code
                                                            )
                                                        }
                                                    />
                                                </td>
                                            ) : (
                                                <td className="currency-column" />
                                            )}
                                        </tr>
                                    );
                                }
                                return null;
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="create-edit-currencies-actions">
                    <button
                        type="submit"
                        className="create-edit-currencies-submit"
                        disabled={!hasChanges()}
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateEditCurrencies;
