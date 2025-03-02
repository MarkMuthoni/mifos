import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../../../../../context/AuthContext";
import { useLoading } from "../../../../../../context/LoadingContext";
import { API_CONFIG } from "../../../../../../config";
import "./CreateTaxComponent.css";

const CreateTaxComponent = () => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();

    const [name, setName] = useState("");
    const [percentage, setPercentage] = useState("");
    const [debitAccountType, setDebitAccountType] = useState("");
    const [creditAccountType, setCreditAccountType] = useState("");
    const [startDate, setStartDate] = useState("");
    const [accountTypeOptions, setAccountTypeOptions] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [createdComponent, setCreatedComponent] = useState(null);

    useEffect(() => {
        fetchTemplate();
    }, []);

    const fetchTemplate = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/taxes/component/template`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });
            setAccountTypeOptions(response.data?.glAccountTypeOptions || []);
        } catch (error) {
            console.error("Error fetching template:", error);
        } finally {
            stopLoading();
        }
    };

    const handleSubmit = async () => {
        if (!name || !percentage || !debitAccountType || !creditAccountType || !startDate) return;

        const payload = {
            name,
            percentage,
            debitAccountType,
            creditAccountType,
            startDate,
        };

        startLoading();
        try {
            const response = await axios.post(`/fineract-provider/api/v1/taxes/component`, payload, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });

            // Fetch the newly created component details
            const newComponentResponse = await axios.get(
                `/fineract-provider/api/v1/taxes/component/${response.data.id}`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            setCreatedComponent(newComponentResponse.data);
            setShowModal(true);
        } catch (error) {
            console.error("Error creating tax component:", error);
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="create-tax-component-form">
            <h3 className="create-tax-component-heading">Create Tax Component</h3>

            <div className="create-tax-component-form-group">
                <label className="create-tax-component-label">Name <span>*</span></label>
                <input
                    type="text"
                    className="create-tax-component-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter component name"
                />
            </div>

            <div className="create-tax-component-form-group">
                <label className="create-tax-component-label">Percentage <span>*</span></label>
                <input
                    type="number"
                    className="create-tax-component-input"
                    value={percentage}
                    onChange={(e) => setPercentage(e.target.value)}
                    placeholder="Enter percentage"
                />
            </div>

            <div className="create-tax-component-form-group">
                <label className="create-tax-component-label">Debit Account Type:</label>
                <select
                    className="create-tax-component-select"
                    value={debitAccountType}
                    onChange={(e) => setDebitAccountType(e.target.value)}
                >
                    <option value="">Select Debit Account Type</option>
                    {accountTypeOptions.map((option) => (
                        <option key={option.id} value={option.value}>
                            {option.value}
                        </option>
                    ))}
                </select>
            </div>

            <div className="create-tax-component-form-group">
                <label className="create-tax-component-label">Credit Account Type:</label>
                <select
                    className="create-tax-component-select"
                    value={creditAccountType}
                    onChange={(e) => setCreditAccountType(e.target.value)}
                >
                    <option value="">Select Credit Account Type</option>
                    {accountTypeOptions.map((option) => (
                        <option key={option.id} value={option.value}>
                            {option.value}
                        </option>
                    ))}
                </select>
            </div>

            <div className="create-tax-component-form-group">
                <label className="create-tax-component-label">Start Date <span>*</span></label>
                <input
                    type="date"
                    className="create-tax-component-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />
            </div>

            <div className="create-tax-component-actions">
                <button
                    className="create-tax-component-button create-tax-component-cancel"
                    onClick={() => console.log("Cancelled")}
                >
                    Cancel
                </button>
                <button
                    className="create-tax-component-button create-tax-component-submit"
                    onClick={handleSubmit}
                    disabled={
                        !name || !percentage || !debitAccountType || !creditAccountType || !startDate
                    }
                >
                    Submit
                </button>
            </div>

            {showModal && createdComponent && (
                <div className="tax-component-modal">
                    <div className="tax-component-modal-content">
                        <h4 className="tax-component-modal-heading">Component Created</h4>
                        <p>
                            <strong>Name:</strong> {createdComponent.name}
                        </p>
                        <p>
                            <strong>Percentage:</strong> {createdComponent.percentage}%
                        </p>
                        <p>
                            <strong>Debit Account Type:</strong> {createdComponent.debitAccountType}
                        </p>
                        <p>
                            <strong>Credit Account Type:</strong> {createdComponent.creditAccountType}
                        </p>
                        <p>
                            <strong>Start Date:</strong> {createdComponent.startDate}
                        </p>
                        <div className="tax-component-modal-actions">
                            <button
                                className="tax-component-modal-button"
                                onClick={() => setShowModal(false)}
                            >
                                Back to Form
                            </button>
                            <button
                                className="tax-component-modal-button tax-component-modal-edit"
                                onClick={() => console.log("Edit Component")}
                            >
                                Edit Component
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateTaxComponent;
