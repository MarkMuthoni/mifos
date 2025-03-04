import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../context/AuthContext';
import { API_CONFIG } from '../../../config';
import { useNavigate } from 'react-router-dom';
import './ProvisioningEntries.css';
import DatePicker from "react-datepicker";
import {NotificationContext} from "../../../context/NotificationContext";

const CreateProvisioningEntryForm = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [provisioningDate, setProvisioningDate] = useState(new Date().toISOString().split('T')[0]);
    const [createJournalEntries, setCreateJournalEntries] = useState(false);
    const {showNotification} = useContext(NotificationContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/provisioningentries`,
                { provisioningDate, createJournalEntries },
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            showNotification("Provisioning entry created successfully!", 'success');
            navigate('/accounting'); // Redirect after successful submission
        } catch (error) {
            showNotification("Error creating provisioning entry:", error);
            console.error('Error creating provisioning entry:', error);
        }
    };

    return (
        <form className="provisioning-form-container" onSubmit={handleSubmit}>
            <h3 className="provisioning-form-title">Create Provisioning Entry</h3>
            <div className="provisioning-form-group">
                <label className="provisioning-form-label">Provisioning Date:</label>
                <DatePicker
                    selected={provisioningDate ? new Date(provisioningDate) : null}
                    onChange={(date) => setProvisioningDate(date ? date.toISOString().split("T")[0] : "")}
                    className="provisioning-form-date-input"
                    placeholderText="Select a date"
                    dateFormat="yyyy-MM-dd"
                    showPopperArrow={false}
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                />
            </div>
            <div className="provisioning-form-group checkbox-group">
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={createJournalEntries}
                        onChange={(e) => setCreateJournalEntries(e.target.checked)}
                        className="provisioning-form-checkbox"
                    />
                    <span className={"span-label"}>Create Journal Entries</span>
                </label>
            </div>
            <div className="provisioning-form-actions">
                <div className="provisioning-form-button provisioning-form-submit" onClick={handleSubmit}>
                    Submit
                </div>
                <div
                    className="provisioning-form-button provisioning-form-cancel"
                    onClick={() => navigate('/accounting')}
                >
                    Cancel
                </div>
            </div>
        </form>
    );
};

export default CreateProvisioningEntryForm;
