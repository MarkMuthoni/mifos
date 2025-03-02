import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import './CreateAccountPreference.css';
import {NotificationContext} from "../../../../../context/NotificationContext";

const AccountNumberPreferenceForm = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const [accountTypeOptions, setAccountTypeOptions] = useState([]);
    const [prefixTypeOptions, setPrefixTypeOptions] = useState([]);
    const [formData, setFormData] = useState({
        accountType: '',
        prefixType: '',
    });

    useEffect(() => {
        fetchTemplate();
    }, []);

    const fetchTemplate = async () => {
        startLoading();
        try {
            const response = await axios.get(
                `/fineract-provider/api/v1/accountnumberformats/template`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            setAccountTypeOptions(response.data.accountTypeOptions || []);
            setPrefixTypeOptions(response.data.prefixTypeOptions || {});
        } catch (error) {
            console.error('Error fetching template data:', error);
        } finally {
            stopLoading();
        }
    };

    const handleAccountTypeChange = (value) => {
        setFormData((prev) => ({ ...prev, accountType: value, prefixType: '' }));
    };

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.accountType || !formData.prefixType) {
            showNotification('Both Account Type and Prefix Type are required!', 'info');
            return;
        }
        startLoading();
        try {
            const payload = {
                accountType: { code: formData.accountType },
                prefixType: { code: formData.prefixType },
            };
            const response = await axios.post(
                `/fineract-provider/api/v1/accountnumberformats`,
                payload,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            if (response.status === 200) {
                showNotification('Account Number Preference created successfully!', 'success');
                setFormData({ accountType: '', prefixType: '' });
            }
        } catch (error) {
            console.error('Error creating account number preference:', error);
            showNotification('Error creating account number preference:', 'error');
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="account-preference-form-container">
            <div className="account-preference-form-group">
                <label htmlFor="account-type" className="account-preference-form-label">
                    Account Type<span>*</span>
                </label>
                <select
                    id="account-type"
                    className="account-preference-form-select"
                    value={formData.accountType}
                    onChange={(e) => handleAccountTypeChange(e.target.value)}
                >
                    <option value="">Select Account Type</option>
                    {accountTypeOptions.map((option) => (
                        <option key={option.code} value={option.code}>
                            {option.value}
                        </option>
                    ))}
                </select>
            </div>
            <div className="account-preference-form-group">
                <label htmlFor="prefix-type" className="account-preference-form-label">
                    Prefix Type
                </label>
                <select
                    id="prefix-type"
                    className="account-preference-form-select"
                    value={formData.prefixType}
                    onChange={(e) => handleInputChange('prefixType', e.target.value)}
                    disabled={!formData.accountType}
                >
                    <option value="">Select Prefix Type</option>
                    {(Array.isArray(prefixTypeOptions[formData.accountType]) ? prefixTypeOptions[formData.accountType] : []).map((option) => (
                        <option key={option.code} value={option.code}>
                            {option.value}
                        </option>
                    ))}
                </select>
            </div>
            <div className="account-preference-form-actions">
                <button
                    className="account-preference-form-submit-button"
                    onClick={handleSubmit}
                    disabled={!formData.accountType}
                >
                    Submit
                </button>
            </div>
        </div>
    );
};

export default AccountNumberPreferenceForm;
