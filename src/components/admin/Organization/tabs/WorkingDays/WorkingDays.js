import React, { useState, useEffect, useContext } from 'react';
import {Link, useNavigate} from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import './WorkingDays.css';
import {NotificationContext} from "../../../../../context/NotificationContext";

const WorkingDays = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const navigate = useNavigate();

    const [workingDays, setWorkingDays] = useState([]);
    const [repaymentOptions, setRepaymentOptions] = useState([]);
    const [selectedDays, setSelectedDays] = useState([]);
    const [selectedRepaymentOption, setSelectedRepaymentOption] = useState(null);
    const [extendTerm, setExtendTerm] = useState(false);
    const [initialState, setInitialState] = useState({});
    const [isModified, setIsModified] = useState(false);

    useEffect(() => {
        fetchWorkingDays();
    }, []);

    const fetchWorkingDays = async () => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/workingdays`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = response.data;
            const recurrenceDays = (data.recurrence || '').split('BYDAY=')[1]?.split(',') || [];
            setWorkingDays(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']);
            setSelectedDays(recurrenceDays);
            setRepaymentOptions(data.repaymentRescheduleOptions || []);
            setSelectedRepaymentOption(data.repaymentRescheduleType?.id || null);
            setExtendTerm(data.extendTermForDailyRepayments || false);

            setInitialState({
                selectedDays: recurrenceDays,
                selectedRepaymentOption: data.repaymentRescheduleType?.id,
                extendTerm: data.extendTermForDailyRepayments,
            });
        } catch (error) {
            console.error('Error fetching working days:', error);
        } finally {
            stopLoading();
        }
    };

    const handleDayToggle = (day) => {
        setSelectedDays((prev) =>
            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
        );
    };

    const handleRepaymentChange = (optionId) => {
        setSelectedRepaymentOption(optionId);
    };

    const handleExtendTermToggle = () => {
        setExtendTerm((prev) => !prev);
    };

    useEffect(() => {
        setIsModified(
            JSON.stringify(initialState) !==
            JSON.stringify({
                selectedDays,
                selectedRepaymentOption,
                extendTerm,
            })
        );
    }, [selectedDays, selectedRepaymentOption, extendTerm]);

    const handleCancel = () => {
        navigate('/organization');
    };

    const handleSubmit = async () => {
        startLoading();
        try {
            const payload = {
                recurrence: `FREQ=WEEKLY;INTERVAL=1;BYDAY=${selectedDays.join(',')},`,
                repaymentRescheduleType: selectedRepaymentOption,
                extendTermForDailyRepayments: extendTerm,
                locale: 'en',
            };

            await axios.put(`${API_CONFIG.proxy}/fineract-provider/api/v1/workingdays`, payload, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });

            showNotification('Working days updated successfully!', 'success');
            navigate('/organization');
        } catch (error) {
            console.error('Error updating working days:', error);
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="working-days-container neighbor-element">
            <h2 className="page-heading">
                <Link to="/organization" className="breadcrumb-link">Organization</Link> . Working Days
            </h2>
            <div className="working-days-form">
                <fieldset className="working-days-fieldset">
                    <legend className="working-days-legend">Select Working Days</legend>
                    <div className="working-days-checkboxes">
                        {workingDays.map((day) => (
                            <label key={day} className="working-days-checkbox">
                                <input
                                    type="checkbox"
                                    checked={selectedDays.includes(day)}
                                    onChange={() => handleDayToggle(day)}
                                />
                                {day}
                            </label>
                        ))}
                    </div>
                </fieldset>

                <div className="working-days-form-group">
                    <label htmlFor="repaymentOptions" className="working-days-label">Payments Due on Non-Working Days</label>
                    <select
                        id="repaymentOptions"
                        value={selectedRepaymentOption || ''}
                        onChange={(e) => handleRepaymentChange(Number(e.target.value))}
                        className="working-days-select"
                    >
                        <option value="">Select an option</option>
                        {repaymentOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.value}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="working-days-checkbox-group">
                    <label className="working-days-checkbox-label">
                        <input
                            type="checkbox"
                            checked={extendTerm}
                            onChange={handleExtendTermToggle}
                        />
                        Extend the term for loans following a daily repayment schedule
                    </label>
                </div>

                <div className="working-days-actions">
                    <button className="working-days-cancel-button" onClick={handleCancel}>
                        Cancel
                    </button>
                    <button
                        className="working-days-submit-button"
                        onClick={handleSubmit}
                        disabled={!isModified}
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WorkingDays;
