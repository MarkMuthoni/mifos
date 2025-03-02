import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../context/AuthContext';
import { useLoading } from '../../../context/LoadingContext';
import { API_CONFIG } from '../../../config';
import './AddFinancialActivityMapping.css';
import {NotificationContext} from "../../../context/NotificationContext";

const AddFinancialActivityMappingForm = () => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const [financialActivity, setFinancialActivity] = useState('');
    const [account, setAccount] = useState('');
    const [financialActivities, setFinancialActivities] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [filteredAccounts, setFilteredAccounts] = useState([]);
    const [mappingDetails, setMappingDetails] = useState(null);
    const [showMappingModal, setShowMappingModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const {showNotification} = useContext(NotificationContext);

    useEffect(() => {
        const fetchTemplateData = async () => {
            startLoading();
            try {
                const response = await axios.get(`/fineract-provider/api/v1/financialactivityaccounts/template`, {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                });

                setFinancialActivities(response.data.financialActivityOptions || []);

                const allAccounts = [
                    ...(response.data.glAccountOptions.assetAccountOptions || []),
                    ...(response.data.glAccountOptions.liabilityAccountOptions || []),
                    ...(response.data.glAccountOptions.equityAccountOptions || []),
                    ...(response.data.glAccountOptions.incomeAccountOptions || []),
                    ...(response.data.glAccountOptions.expenseAccountOptions || []),
                ];

                setAccounts(allAccounts);
            } catch (error) {
                console.error('Error fetching template data:', error);
            } finally {
                stopLoading();
            }
        };
        fetchTemplateData();
    }, [user]);

    useEffect(() => {
        if (financialActivity) {
            const selectedActivity = financialActivities.find((activity) => activity.id === parseInt(financialActivity, 10));
            if (selectedActivity) {
                const mappedType = selectedActivity.mappedGLAccountType;

                const relevantAccounts = accounts.filter((acc) => {
                    if (mappedType === 'ASSET') return acc.glCode.startsWith('1');
                    if (mappedType === 'LIABILITY') return acc.glCode.startsWith('2');
                    if (mappedType === 'EQUITY') return acc.glCode.startsWith('3');
                    if (mappedType === 'INCOME') return acc.glCode.startsWith('4');
                    if (mappedType === 'EXPENSE') return acc.glCode.startsWith('5');
                    return false;
                });

                setFilteredAccounts(relevantAccounts);
            } else {
                setFilteredAccounts([]);
            }
        } else {
            setFilteredAccounts([]);
        }
    }, [financialActivity, financialActivities, accounts]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        startLoading();

        const newMappingData = {
            financialActivityId: parseInt(financialActivity, 10),
            glAccountId: parseInt(account, 10),
        };

        try {
            const response = await axios.post(`/fineract-provider/api/v1/financialactivityaccounts`, newMappingData, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });

            const mappingId = response.data.resourceId;

            const mappingDetailsResponse = await axios.get(
                `/fineract-provider/api/v1/financialactivityaccounts/${mappingId}?template=false`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    },
                }
            );

            setMappingDetails(mappingDetailsResponse.data);
            setShowMappingModal(true);

            setFinancialActivity('');
            setAccount('');
            showNotification("Mapping created successfully!", 'success');
        } catch (error) {
            console.error('Error creating financial activity mapping:', error);
        } finally {
            stopLoading();
        }
    };

    const handleEdit = () => {
        setIsEditMode(true);
        setFinancialActivity(mappingDetails.financialActivityData.id.toString());

        const selectedActivity = financialActivities.find(
            (activity) => activity.id === mappingDetails.financialActivityData.id
        );
        if (selectedActivity) {
            const mappedType = selectedActivity.mappedGLAccountType;

            const relevantAccounts = accounts.filter((acc) => {
                if (mappedType === 'ASSET') return acc.glCode.startsWith('1');
                if (mappedType === 'LIABILITY') return acc.glCode.startsWith('2');
                if (mappedType === 'EQUITY') return acc.glCode.startsWith('3');
                if (mappedType === 'INCOME') return acc.glCode.startsWith('4');
                if (mappedType === 'EXPENSE') return acc.glCode.startsWith('5');
                return false;
            });

            setFilteredAccounts(relevantAccounts);

            const selectedAccount = relevantAccounts.find(
                (acc) => acc.id === mappingDetails.glAccountData.id
            );
            setAccount(selectedAccount ? selectedAccount.id.toString() : '');
        } else {
            setFilteredAccounts([]);
            setAccount('');
        }

        setShowMappingModal(false);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        startLoading();

        const updatedMappingData = {
            financialActivityId: parseInt(financialActivity, 10),
            glAccountId: parseInt(account, 10),
        };

        try {
            await axios.put(`/fineract-provider/api/v1/financialactivityaccounts/${mappingDetails.id}`, updatedMappingData, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });

            const updatedMappingDetailsResponse = await axios.get(
                `/fineract-provider/api/v1/financialactivityaccounts/${mappingDetails.id}?template=false`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    },
                }
            );

            setMappingDetails(updatedMappingDetailsResponse.data);
            setShowMappingModal(true);
            showNotification("Mapping updated!", 'info');
        } catch (error) {
            console.error('Error updating financial activity mapping:', error);
        } finally {
            stopLoading();
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this mapping?')) {
            startLoading();
            try {
                await axios.delete(`/fineract-provider/api/v1/financialactivityaccounts/${mappingDetails.id}`, {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    },
                });
                setShowMappingModal(false);
                setMappingDetails(null);
                resetFormFields();
                showNotification("Mapping deleted!", 'info');
            } catch (error) {
                console.error('Error deleting mapping:', error);
            } finally {
                stopLoading();
            }
        }
    };

    const resetFormFields = () => {
        setFinancialActivity('');
        setAccount('');
        setIsEditMode(false);
        setMappingDetails(null);
    };

    return (
        <div className="form-container-mapping">
            <form onSubmit={isEditMode ? handleEditSubmit : handleSubmit} className="mapping-form">
                <div className="data-table-form-row">
                    <div className="mapping-form-group">
                        <label>Financial Activity <span className="required-asterisk">*</span></label>
                        <select
                            value={financialActivity}
                            onChange={(e) => setFinancialActivity(e.target.value)}
                            required
                        >
                            <option value="">Select Financial Activity</option>
                            {financialActivities.map((activity) => (
                                <option key={activity.id} value={activity.id}>
                                    {activity.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="mapping-form-group">
                        <label>Account <span className="required-asterisk">*</span></label>
                        <select
                            value={account}
                            onChange={(e) => setAccount(e.target.value)}
                            disabled={!financialActivity}
                            required
                        >
                            <option value="">Select Account</option>
                            {filteredAccounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.name} - {acc.glCode}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="mapping-form-button">
                    <button type="submit" className="submit-button-mapping">
                        {isEditMode ? 'Update Mapping' : 'Create Mapping'}
                    </button>
                </div>
            </form>
            {showMappingModal && mappingDetails && (
                <div className="create-provisioning-criteria-modal-overlay" onClick={() => setShowMappingModal(false)}>
                    <div
                        className="create-provisioning-criteria-modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h4 className="create-modal-title">Mapping Details</h4>
                        <div className="create-provisioning-criteria-modal-actions">
                            <button className="create-provisioning-criteria-cancel" onClick={resetFormFields}>
                                Back
                            </button>
                            <button className="create-provisioning-criteria-confirm" onClick={handleEdit}>
                                Edit
                            </button>
                            <button className="create-provisioning-criteria-cancel" onClick={handleDelete}>
                                Delete
                            </button>
                        </div>
                        <table className="create-provisioning-criteria-table">
                            <tbody>
                            <tr>
                                <td className="create-provisioning-criteria-label">Financial Activity</td>
                                <td>{mappingDetails.financialActivityData.name}</td>
                            </tr>
                            <tr>
                                <td className="create-provisioning-criteria-label">Account Type</td>
                                <td>{mappingDetails.financialActivityData.mappedGLAccountType}</td>
                            </tr>
                            <tr>
                                <td className="create-provisioning-criteria-label">Account Name</td>
                                <td>{mappingDetails.glAccountData.name}</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddFinancialActivityMappingForm;
