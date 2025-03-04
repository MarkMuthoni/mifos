import React, { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../../../../context/AuthContext";
import { useLoading } from "../../../../../context/LoadingContext";
import { API_CONFIG } from "../../../../../config";
import "./CreateFund.css";
import {NotificationContext} from "../../../../../context/NotificationContext";

const CreateFund = ({ onFormSubmitSuccess }) => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();

    const [name, setName] = useState("");
    const [externalId, setExternalId] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            name,
            externalId: externalId || null,
        };

        startLoading();
        try {
            await axios.post(`${API_CONFIG.proxy}/fineract-provider/api/v1/funds`, payload, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });

            onFormSubmitSuccess();
            showNotification("Fund created successfully!", 'success');
        } catch (error) {
            console.error("Error creating fund:", error);
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="create-fund-container">
            <form className="create-fund-form" onSubmit={handleSubmit}>
                <h3 className="create-fund-title">Create Fund</h3>

                <div className="create-fund-group">
                    <label htmlFor="name" className="create-fund-label">
                        Name <span className="create-fund-required">*</span>
                    </label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter fund name"
                        className="create-fund-input"
                        required
                    />
                </div>

                <div className="create-fund-group">
                    <label htmlFor="externalId" className="create-fund-label">
                        External ID
                    </label>
                    <input
                        type="text"
                        id="externalId"
                        value={externalId}
                        onChange={(e) => setExternalId(e.target.value)}
                        placeholder="Enter external ID (optional)"
                        className="create-fund-input"
                    />
                </div>

                <div className="create-fund-actions">
                    <button
                        type="submit"
                        className="create-fund-submit"
                        disabled={!name}
                    >
                        Create Fund
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateFund;
