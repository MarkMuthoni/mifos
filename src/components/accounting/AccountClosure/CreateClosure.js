import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../context/AuthContext';
import { useLoading } from '../../../context/LoadingContext';
import { API_CONFIG } from '../../../config';
import './CreateClosure.css';
import DatePicker from "react-datepicker";
import {format} from "date-fns";
import {NotificationContext} from "../../../context/NotificationContext";

const CreateClosure = () => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const [office, setOffice] = useState('');
    const [closingDate, setClosingDate] = useState('');
    const [comments, setComments] = useState('');
    const [offices, setOffices] = useState([]);
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const {showNotification} = useContext(NotificationContext);

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
                    'Content-Type': 'application/json',
                },
            });
            setOffices(response.data || []);
        } catch (error) {
            console.error('Error fetching offices:', error);
        } finally {
            stopLoading();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const errors = {};
        if (!office) errors.office = 'Office is required';
        if (!closingDate) errors.closingDate = 'Closing Date is required';
        setFormErrors(errors);

        if (Object.keys(errors).length === 0) {
            const formattedDate = format(new Date(closingDate), "dd MMMM yyyy");

            const payload = {
                officeId: parseInt(office, 10),
                closingDate: formattedDate,
                comments: comments || "",
                locale: "en",
                dateFormat: "dd MMMM yyyy",
            };

            // console.log("Payload:", payload);

            try {
                const response = await axios.post(`${API_CONFIG.proxy}/fineract-provider/api/v1/glclosures`, payload, {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        "Content-Type": "application/json",
                    },
                });

                // console.log("Response:", response.data);

                setOffice('');
                setClosingDate('');
                setComments('');
                showNotification("Closure creation submitted successfully!", 'success');
            } catch (error) {
                console.error("Error submitting closure:", error.response?.data || error.message);
            }
        }
    };

    return (
        <div className="form-container-client">
            <form onSubmit={handleSubmit} className="staged-form-stage-content">
                <div className="staged-form-row">
                    <div className="staged-form-field">
                        <label className={"create-provisioning-criteria-label"}>Office <span className="staged-form-required">*</span></label>
                        <select
                            value={office}
                            onChange={(e) => setOffice(e.target.value)}
                            className="create-provisioning-criteria-select"
                            required
                        >
                            <option value="">-- Select Office --</option>
                            {offices.map((office) => (
                                <option key={office.id} value={office.id}>
                                    {office.name}
                                </option>
                            ))}
                        </select>
                        {formErrors.office && <span className="error-text">{formErrors.office}</span>}
                    </div>
                    <div className="staged-form-field">
                        <label className={"create-provisioning-criteria-label"}>Closing Date <span className="staged-form-required">*</span></label>
                        <DatePicker
                            selected={closingDate ? new Date(closingDate) : null}
                            onChange={(date) => setClosingDate(date.toISOString().split("T")[0])}
                            className="staged-form-input"
                            placeholderText="Select Closing Date"
                            dateFormat="MMMM d, yyyy"
                            maxDate={new Date()} // Restricts selection to today or earlier
                            showPopperArrow={false}
                            showMonthDropdown
                            showYearDropdown
                            dropdownMode="select"
                        />
                        {formErrors.closingDate && <span className="error-text">{formErrors.closingDate}</span>}
                    </div>

                </div>
                <div className="staged-form-field">
                    <label className={"create-provisioning-criteria-label"}>Comments</label>
                    <textarea
                        rows="3"
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        className="staged-form-input"
                        placeholder="Enter any comments (optional)"
                    ></textarea>
                </div>
                <div className="navigation-buttons">
                    <button
                        type="submit"
                        className="submit-button"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Creating...' : 'Create Closure'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateClosure;
