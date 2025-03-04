import React, { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../../../../context/AuthContext";
import { useLoading } from "../../../../../context/LoadingContext";
import { API_CONFIG } from "../../../../../config";
import "./CreatePaymentType.css";
import {NotificationContext} from "../../../../../context/NotificationContext";

const CreatePaymentType = ({ onFormSubmitSuccess }) => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();

    const [paymentType, setPaymentType] = useState("");
    const [description, setDescription] = useState("");
    const [isCashPayment, setIsCashPayment] = useState(false);
    const [position, setPosition] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            name: paymentType,
            description: description || null,
            isCashPayment,
            position,
        };

        startLoading();
        try {
            await axios.post(`${API_CONFIG.proxy}/fineract-provider/api/v1/paymenttypes`, payload, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });
            onFormSubmitSuccess();
            showNotification("Payment type created successfully!", 'success');
        } catch (error) {
            console.error("Error creating payment type:", error);
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="create-payment-type-container">
            <form className="create-payment-type-form" onSubmit={handleSubmit}>
                <h3 className="create-payment-type-title">Create Payment Type</h3>

                <div className="create-payment-type-group">
                    <label htmlFor="paymentType" className="create-payment-type-label">
                        Payment Type <span className="create-payment-type-required">*</span>
                    </label>
                    <input
                        type="text"
                        id="paymentType"
                        value={paymentType}
                        onChange={(e) => setPaymentType(e.target.value)}
                        placeholder="Enter payment type"
                        className="create-payment-type-input"
                        required
                    />
                </div>

                <div className="create-payment-type-group">
                    <label htmlFor="description" className="create-payment-type-label">
                        Description
                    </label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter description (optional)"
                        className="create-payment-type-textarea"
                    ></textarea>
                </div>

                <div className="create-payment-type-group">
                    <label className="create-payment-type-label">
                        <input
                            type="checkbox"
                            checked={isCashPayment}
                            onChange={(e) => setIsCashPayment(e.target.checked)}
                            className="create-payment-type-checkbox"
                        />
                        Is Cash Payment?
                    </label>
                </div>

                <div className="create-payment-type-group">
                    <label htmlFor="position" className="create-payment-type-label">
                        Position <span className="create-payment-type-required">*</span>
                    </label>
                    <input
                        type="number"
                        id="position"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        placeholder="Enter position"
                        className="create-payment-type-input"
                        required
                    />
                </div>

                <div className="create-payment-type-actions">
                    <button
                        type="submit"
                        className="create-payment-type-submit"
                        disabled={!paymentType || !position}
                    >
                        Create Payment Type
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreatePaymentType;
