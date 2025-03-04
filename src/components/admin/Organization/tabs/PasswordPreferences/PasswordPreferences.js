import React, { useState, useEffect, useContext } from 'react';
import {Link, useNavigate} from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import './PasswordPreferences.css';
import {NotificationContext} from "../../../../../context/NotificationContext";

const PasswordPreferences = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const [preferences, setPreferences] = useState([]);
    const [selectedPreference, setSelectedPreference] = useState(null);
    const [initialPreference, setInitialPreference] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPasswordPreferences();
    }, []);

    const fetchPasswordPreferences = async () => {
        startLoading();
        try {
            const response = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/passwordpreferences/template`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            const preferencesData = response.data || [];
            setPreferences(preferencesData);
            const activePreference = preferencesData.find((p) => p.active);
            if (activePreference) {
                setSelectedPreference(activePreference.id);
                setInitialPreference(activePreference.id);
            }
        } catch (error) {
            console.error('Error fetching password preferences:', error);
        } finally {
            stopLoading();
        }
    };

    const handlePreferenceChange = (id) => {
        setSelectedPreference(id);
    };

    const handleCancel = () => {
        navigate('/organization');
    };

    const handleSubmit = async () => {
        startLoading();
        try {
            const payload = { validationPolicyId: selectedPreference };
            await axios.put(`${API_CONFIG.proxy}/fineract-provider/api/v1/passwordpreferences`, payload, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            showNotification('Password preference updated successfully!', 'success');
            navigate('/organization');
        } catch (error) {
            console.error('Error updating password preference:', error);
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="password-preferences-screen neighbor-element">
            <h2 className="page-heading">
                <Link to="/organization" className="breadcrumb-link">Organization</Link> . Password Preferences
            </h2>
            <div className="preferences-form-container">
                <fieldset className="preferences-fieldset">
                    <legend>Select a Password Policy</legend>
                    {preferences.map((preference) => (
                        <div key={preference.id} className="preferences-option">
                            <input
                                type="radio"
                                id={`preference-${preference.id}`}
                                name="passwordPreference"
                                value={preference.id}
                                checked={selectedPreference === preference.id}
                                onChange={() => handlePreferenceChange(preference.id)}
                            />
                            <label htmlFor={`preference-${preference.id}`}>
                                {preference.description}
                            </label>
                        </div>
                    ))}
                </fieldset>
                <div className="preferences-actions">
                    <button className="preferences-cancel-btn" onClick={handleCancel}>
                        Cancel
                    </button>
                    <button
                        className="preferences-submit-btn"
                        onClick={handleSubmit}
                        disabled={selectedPreference === initialPreference}
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PasswordPreferences;
