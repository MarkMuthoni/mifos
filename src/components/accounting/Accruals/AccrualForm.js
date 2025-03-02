import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../context/AuthContext';
import { API_CONFIG } from '../../../config';
import './Accruals.css';
import {useNavigate} from "react-router-dom";
import DatePicker from "react-datepicker";
import {NotificationContext} from "../../../context/NotificationContext";

const AccrualForm = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const {showNotification} = useContext(NotificationContext);
    const [accrueUntil, setAccrueUntil] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const selectedDate = new Date(accrueUntil);
        const today = new Date();
        if (selectedDate >= today) {
            showNotification("The selected date must be less than today's date.", 'info');
            return;
        }

        const formattedDate = selectedDate.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });

        const payload = {
            tillDate: formattedDate,
            locale: "en",
            dateFormat: "dd MMMM yyyy",
        };

        try {
            const response = await axios.post(
                `/fineract-provider/api/v1/runaccruals`,
                payload,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            // console.log("Accrual submitted successfully:", response.data);
            showNotification("Accrual submitted successfully!", 'success');
            navigate("/accounting");
        } catch (error) {
            console.error('Error submitting accrual:', error);
        }
    };

    return (
        <form className="accrual-form-container" onSubmit={handleSubmit}>
            <div className="accrual-form-group">
                <label className="accrual-form-label">Accrue Until:</label>
                <DatePicker
                    selected={accrueUntil ? new Date(accrueUntil) : null}
                    onChange={(date) =>
                        setAccrueUntil(date ? date.toISOString().split("T")[0] : "")
                    }
                    className="custom-date-picker"
                    placeholderText="Select a date"
                    dateFormat="yyyy-MM-dd"
                    showPopperArrow={false}
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    maxDate={new Date(new Date().setDate(new Date().getDate() - 1))}
                />
            </div>
            <div className="accrual-form-actions">
                <div className="accrual-form-button accrual-form-submit" onClick={handleSubmit}>Run Periodic Accruals
                </div>
                <div
                    className="accrual-form-button accrual-form-cancel"
                    onClick={() => navigate('/accounting')}
                >
                    Cancel
                </div>
            </div>
        </form>
    );
};

export default AccrualForm;
