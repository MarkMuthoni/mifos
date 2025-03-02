import React, { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../../../../../context/AuthContext";
import { useLoading } from "../../../../../../context/LoadingContext";
import { API_CONFIG } from "../../../../../../config";
import "./CreateDelinquencyRange.css";
import {NotificationContext} from "../../../../../../context/NotificationContext";

const CreateDelinquencyRange = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const [classification, setClassification] = useState("");
    const [daysFrom, setDaysFrom] = useState("");
    const [daysTill, setDaysTill] = useState("");

    const handleSubmit = async () => {
        if (!classification || !daysFrom || !daysTill) return;

        const payload = {
            classification,
            minimumAgeDays: parseInt(daysFrom, 10),
            maximumAgeDays: parseInt(daysTill, 10),
            locale: "en",
        };

        startLoading();
        try {
            const response = await axios.post(
                `/fineract-provider/api/v1/delinquency/ranges`,
                payload,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            showNotification("Delinquency range created successfully!", 'success');
        } catch (error) {
            console.error("Error creating delinquency range:", error);
            showNotification("Error creating delinquency range:", 'error');
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="create-delinquency-range-form">
            <h3 className="create-delinquency-range-heading">Create Delinquency Range</h3>

            <div className="create-delinquency-range-form-group">
                <label className="create-delinquency-range-label">
                    Classification <span>*</span>
                </label>
                <input
                    type="text"
                    className="create-delinquency-range-input"
                    value={classification}
                    onChange={(e) => setClassification(e.target.value)}
                    placeholder="Enter classification"
                />
            </div>

            <div className="create-delinquency-range-form-group">
                <label className="create-delinquency-range-label">
                    Days From <span>*</span>
                </label>
                <input
                    type="number"
                    className="create-delinquency-range-input"
                    value={daysFrom}
                    onChange={(e) => setDaysFrom(e.target.value)}
                    placeholder="Enter starting day"
                />
            </div>

            <div className="create-delinquency-range-form-group">
                <label className="create-delinquency-range-label">
                    Days Till <span>*</span>
                </label>
                <input
                    type="number"
                    className="create-delinquency-range-input"
                    value={daysTill}
                    onChange={(e) => setDaysTill(e.target.value)}
                    placeholder="Enter ending day"
                />
            </div>

            <div className="create-delinquency-range-actions">
                <button
                    className="create-delinquency-range-button create-delinquency-range-cancel"
                    onClick={() => console.log("Cancelled")}
                >
                    Cancel
                </button>
                <button
                    className="create-delinquency-range-button create-delinquency-range-submit"
                    onClick={handleSubmit}
                    disabled={!classification || !daysFrom || !daysTill}
                >
                    Submit
                </button>
            </div>
        </div>
    );
};

export default CreateDelinquencyRange;
