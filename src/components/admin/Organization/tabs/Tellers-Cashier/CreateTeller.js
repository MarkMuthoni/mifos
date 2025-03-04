import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../../../../context/AuthContext";
import { useLoading } from "../../../../../context/LoadingContext";
import { API_CONFIG } from "../../../../../config";
import "./CreateTeller.css";
import {NotificationContext} from "../../../../../context/NotificationContext";

const CreateTeller = ({ onFormSubmitSuccess }) => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();

    const [tellerName, setTellerName] = useState("");
    const [officeId, setOfficeId] = useState("");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [status, setStatus] = useState(300);
    const [offices, setOffices] = useState([]);

    useEffect(() => {
        fetchOffices();
    }, []);

    const fetchOffices = async () => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/offices`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                },
            });
            setOffices(response.data || []);
        } catch (error) {
            console.error("Error fetching offices:", error);
        } finally {
            stopLoading();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (endDate && new Date(endDate) < new Date(startDate)) {
            showNotification("End Date cannot be earlier than Start Date!", 'info');
            return;
        }

        const payload = {
            name: tellerName,
            officeId: parseInt(officeId, 10),
            description: description || null,
            startDate: new Date(startDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
            }),
            endDate: endDate
                ? new Date(endDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                })
                : null,
            status,
            dateFormat: "dd MMMM yyyy",
            locale: "en",
        };

        startLoading();
        try {
            await axios.post(`${API_CONFIG.proxy}/fineract-provider/api/v1/tellers`, payload, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });

            onFormSubmitSuccess();
            showNotification("Teller created successfully!", 'success');
        } catch (error) {
            console.error("Error creating teller:", error);
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="create-teller-container">
            <form className="create-teller-form" onSubmit={handleSubmit}>
                <h3 className="create-teller-title">Create Teller</h3>
                <div className="create-teller-row">
                    <div className="create-teller-group">
                        <label htmlFor="tellerName" className="create-teller-label">
                            Teller Name <span className="create-teller-required">*</span>
                        </label>
                        <input
                            type="text"
                            id="tellerName"
                            value={tellerName}
                            onChange={(e) => setTellerName(e.target.value)}
                            placeholder="Enter teller name"
                            className="create-teller-input"
                            required
                        />
                    </div>

                    <div className="create-teller-group">
                        <label htmlFor="officeId" className="create-teller-label">
                            Office <span className="create-teller-required">*</span>
                        </label>
                        <select
                            id="officeId"
                            value={officeId}
                            onChange={(e) => setOfficeId(e.target.value)}
                            className="create-teller-select"
                            required
                        >
                            <option value="">Select Office</option>
                            {offices.map((office) => (
                                <option key={office.id} value={office.id}>
                                    {office.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                    <div className="create-teller-group">
                        <label htmlFor="description" className="create-teller-label">
                            Description
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter description (optional)"
                            className="create-teller-textarea"
                        ></textarea>
                    </div>

                    <div className="create-teller-row">
                        <div className="create-teller-group">
                            <label htmlFor="startDate" className="create-teller-label">
                                Start Date <span className="create-teller-required">*</span>
                            </label>
                            <input
                                type="date"
                                id="startDate"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="create-teller-input"
                            />
                        </div>
                        <div className="create-teller-group">
                            <label htmlFor="endDate" className="create-teller-label">
                                End Date
                            </label>
                            <input
                                type="date"
                                id="endDate"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                min={startDate ? new Date(new Date(startDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0] : ""}
                                className="create-teller-input"
                            />
                        </div>
                    </div>

                    <div className="create-teller-group">
                        <label className="create-teller-label">Status<span
                            className="create-teller-required">*</span></label>
                        <div className="create-teller-status">
                            <label>
                                <input
                                    type="radio"
                                    value={300}
                                    checked={status === 300}
                                    onChange={() => setStatus(300)}
                                />{"       "}
                                Active
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    value={400}
                                    checked={status === 400}
                                    onChange={() => setStatus(400)}
                                />{"       "}
                                Inactive
                            </label>
                        </div>
                    </div>

                    <div className="create-teller-actions">
                        <button
                            type="submit"
                            className="create-teller-submit"
                            disabled={!tellerName || !officeId || !startDate || !status}
                        >
                            Create Teller
                        </button>
                    </div>
            </form>
        </div>
);
};

export default CreateTeller;
