import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../context/AuthContext';
import { useLoading } from '../../../context/LoadingContext';
import { API_CONFIG } from '../../../config';
import './AddGLAccountForm.css';
import {NotificationContext} from "../../../context/NotificationContext";

const AddAccountForm = () => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const [isEditMode, setIsEditMode] = useState(false);
    const [accountId, setAccountId] = useState(null);

    const [accountType, setAccountType] = useState('');
    const [parent, setParent] = useState('');
    const [glCode, setGlCode] = useState('');
    const [accountName, setAccountName] = useState('');
    const [accountUsage, setAccountUsage] = useState('');
    const [tag, setTag] = useState('');
    const [manualEntriesAllowed, setManualEntriesAllowed] = useState(true);
    const [description, setDescription] = useState('');

    const [accountTypes, setAccountTypes] = useState([]);
    const [parents, setParents] = useState([]);
    const [usageOptions, setUsageOptions] = useState([]);
    const [tags, setTags] = useState([]);

    const [showAccountModal, setShowAccountModal] = useState(false);
    const [accountDetails, setAccountDetails] = useState(null);
    const {showNotification} = useContext(NotificationContext);

    useEffect(() => {
        const fetchTemplateData = async () => {
            startLoading();
            try {
                const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/glaccounts/template?type=0`, {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                });

                setAccountTypes(response.data.accountTypeOptions || []);
                setParents(
                    (response.data.assetHeaderAccountOptions || [])
                        .concat(response.data.liabilityHeaderAccountOptions || [])
                        .concat(response.data.equityHeaderAccountOptions || [])
                        .concat(response.data.incomeHeaderAccountOptions || [])
                );
                setUsageOptions(response.data.usageOptions || []);
                setTags(response.data.allowedIncomeTagOptions || []);
            } catch (error) {
                console.error('Error fetching template data:', error);
            } finally {
                stopLoading();
            }
        };
        fetchTemplateData();
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        startLoading();

        const newAccountData = {
            type: accountType ? parseInt(accountType, 10) : null,
            parentId: parent ? parseInt(parent, 10) : null,
            glCode: glCode.trim(),
            name: accountName.trim(),
            usage: accountUsage ? parseInt(accountUsage, 10) : null,
            tagId: tag ? parseInt(tag, 10) : null,
            manualEntriesAllowed: manualEntriesAllowed,
            description: description.trim(),
        };

        try {
            const response = await axios.post(`${API_CONFIG.proxy}/fineract-provider/api/v1/glaccounts`, newAccountData, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });

            const newId = response.data.resourceId;

            const accountDetailsResponse = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/glaccounts/${newId}?template=true`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    },
                }
            );

            setAccountDetails(accountDetailsResponse.data);
            setShowAccountModal(true);

            setAccountType('');
            setParent('');
            setGlCode('');
            setAccountName('');
            setAccountUsage('');
            setTag('');
            setManualEntriesAllowed(true);
            setDescription('');
            showNotification("GL Account created successfully!", 'success');
        } catch (error) {
            console.error('Error creating account:', error);
        } finally {
            stopLoading();
        }
    };

    const toggleDisable = async () => {
        startLoading();
        try {
            const payload = { disabled: !accountDetails.disabled };
            await axios.put(`${API_CONFIG.proxy}/fineract-provider/api/v1/glaccounts/${accountDetails.id}`, payload, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setAccountDetails((prev) => ({ ...prev, disabled: !prev.disabled }));
        } catch (error) {
            console.error('Error toggling account status:', error);
        } finally {
            stopLoading();
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        startLoading();

        const accountData = {
            type: accountType ? parseInt(accountType, 10) : null,
            parentId: parent ? parseInt(parent, 10) : null,
            glCode: glCode.trim(),
            name: accountName.trim(),
            usage: accountUsage ? parseInt(accountUsage, 10) : null,
            tagId: tag ? parseInt(tag, 10) : null,
            manualEntriesAllowed,
            description: description.trim(),
        };

        try {
            await axios.put(`${API_CONFIG.proxy}/fineract-provider/api/v1/glaccounts/${accountId}`, accountData, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });

            const updatedAccountDetailsResponse = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/glaccounts/${accountId}?template=true`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    },
                }
            );

            setAccountDetails(updatedAccountDetailsResponse.data);
            setShowAccountModal(true);
            showNotification("Account Updated successfully!", 'success');
        } catch (error) {
            console.error('Error updating account:', error);
        } finally {
            stopLoading();
        }
    };

    const handleEdit = () => {
        setIsEditMode(true);
        setAccountId(accountDetails.id);

        setAccountType(accountDetails.type.id);
        setParent(accountDetails.parentId);
        setGlCode(accountDetails.glCode);
        setAccountName(accountDetails.name);
        setAccountUsage(accountDetails.usage.id);
        setTag(accountDetails.tagId?.id || '')
        setManualEntriesAllowed(accountDetails.manualEntriesAllowed);
        setDescription(accountDetails.description);

        setShowAccountModal(false);
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this account?')) {
            startLoading();
            try {
                await axios.delete(`${API_CONFIG.proxy}/fineract-provider/api/v1/glaccounts/${accountDetails.id}`, {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    },
                });
                setShowAccountModal(false);
                showNotification("Account deleted successfully!", 'success');
            } catch (error) {
                console.error('Error deleting account:', error);
            } finally {
                stopLoading();
            }
        }
    };

    const getParentAccountName = (parentId, parents) => {
        const parentAccount = parents.find((parent) => parent.id === parentId);
        return parentAccount ? parentAccount.name : 'None';
    };

    const resetFormFields = () => {
        setAccountType('');
        setParent('');
        setGlCode('');
        setAccountName('');
        setAccountUsage('');
        setTag('');
        setManualEntriesAllowed(true);
        setDescription('');
        setIsEditMode(false);
        setAccountId(null);
    };

    return (
        <div className="form-container-client">
            <form onSubmit={isEditMode ? handleEditSubmit : handleSubmit} className="staged-form-stage-content">
                <div className="staged-form-row">
                    <div className="staged-form-field">
                        <label className="create-provisioning-criteria-label">
                            Account Type <span className="staged-form-required">*</span>
                        </label>
                        <select
                            value={accountType}
                            onChange={(e) => setAccountType(e.target.value)}
                            className="create-provisioning-criteria-select"
                            required
                        >
                            <option value="">Select Account Type</option>
                            {accountTypes.map((type) => (
                                <option key={type.id} value={type.id}>
                                    {type.value}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="staged-form-field">
                        <label className="create-provisioning-criteria-label">
                            Parent
                        </label>
                        <select
                            value={parent}
                            onChange={(e) => setParent(e.target.value)}
                            className="create-provisioning-criteria-select"
                        >
                            <option value="">Select Parent</option>
                            {parents.map((parentOption) => (
                                <option key={parentOption.id} value={parentOption.id}>
                                    {parentOption.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="staged-form-row">
                    <div className="staged-form-field">
                        <label className="create-provisioning-criteria-label">
                            GL Code <span className="staged-form-required">*</span>
                        </label>
                        <input
                            type="text"
                            value={glCode}
                            onChange={(e) => setGlCode(e.target.value)}
                            className="staged-form-input"
                            required
                        />
                    </div>
                    <div className="staged-form-field">
                        <label className="create-provisioning-criteria-label">
                            Account Name <span className="staged-form-required">*</span>
                        </label>
                        <input
                            type="text"
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            className="staged-form-input"
                            required
                        />
                    </div>
                </div>
                <div className="staged-form-row">
                    <div className="staged-form-field">
                        <label className="create-provisioning-criteria-label">
                            Account Usage <span className="staged-form-required">*</span>
                        </label>
                        <select
                            value={accountUsage}
                            onChange={(e) => setAccountUsage(e.target.value)}
                            className="create-provisioning-criteria-select"
                            required
                        >
                            <option value="">Select Usage</option>
                            {usageOptions.map((usage) => (
                                <option key={usage.id} value={usage.id}>
                                    {usage.value}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="staged-form-field">
                        <label className="create-provisioning-criteria-label">
                            Tag
                        </label>
                        <select
                            value={tag}
                            onChange={(e) => setTag(e.target.value)}
                            className="create-provisioning-criteria-select"
                        >
                            <option value="">Select Tag</option>
                            {tags.map((tagOption) => (
                                <option key={tagOption.id} value={tagOption.id}>
                                    {tagOption.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="staged-form-field">
                    <label className="manual-entries-label">
                        <input
                            type="checkbox"
                            checked={manualEntriesAllowed}
                            onChange={(e) => setManualEntriesAllowed(e.target.checked)}
                            className="manual-entries-checkbox"
                        />
                        Manual Entries Allowed
                    </label>
                </div>
                <div className="staged-form-field">
                    <label className="create-provisioning-criteria-label">
                        Description
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="staged-form-input"
                        placeholder="Enter account description here..."
                    ></textarea>
                </div>
                <div className="navigation-buttons">
                    <button type="submit" className="submit-button">
                        {isEditMode ? 'Update Account' : 'Create Account'}
                    </button>
                </div>
            </form>

            {showAccountModal && accountDetails && (
                <div
                    className="create-provisioning-criteria-modal-overlay"
                    onClick={() => setShowAccountModal(false)}
                >
                    <div
                        className="create-provisioning-criteria-modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h4 className="create-modal-title">Account Details</h4>
                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                className="create-provisioning-criteria-cancel"
                                onClick={() => {
                                    setShowAccountModal(false);
                                    resetFormFields();
                                }}
                            >
                                Back
                            </button>
                            <button
                                className="create-provisioning-criteria-confirm"
                                onClick={handleEdit}
                            >
                                Edit
                            </button>
                            <button
                                className="create-provisioning-criteria-toggle"
                                onClick={toggleDisable}
                            >
                                {accountDetails.disabled ? 'Enable' : 'Disable'}
                            </button>
                            <button
                                className="create-provisioning-criteria-cancel"
                                onClick={handleDelete}
                            >
                                Delete
                            </button>
                        </div>
                        <table className="create-provisioning-criteria-table">
                            <tbody>
                            <tr>
                                <td className="create-provisioning-criteria-label">Account Name</td>
                                <td>{accountDetails.name}</td>
                            </tr>
                            <tr>
                                <td className="create-provisioning-criteria-label">Account Type</td>
                                <td>{accountDetails.type.value}</td>
                            </tr>
                            <tr>
                                <td className="create-provisioning-criteria-label">GL Code</td>
                                <td>{accountDetails.glCode}</td>
                            </tr>
                            <tr>
                                <td className="create-provisioning-criteria-label">Parent Account</td>
                                <td>
                                    {getParentAccountName(accountDetails.parentId, parents)}
                                </td>
                            </tr>
                            <tr>
                                <td className="create-provisioning-criteria-label">Account Usage</td>
                                <td>{accountDetails.usage.value}</td>
                            </tr>
                            <tr>
                                <td className="create-provisioning-criteria-label">Manual Entries Allowed</td>
                                <td>{accountDetails.manualEntriesAllowed ? 'Yes' : 'No'}</td>
                            </tr>
                            <tr>
                                <td className="create-provisioning-criteria-label">Description</td>
                                <td>{accountDetails.description}</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddAccountForm;
