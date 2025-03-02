import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import './ViewAccountPreferences.css';
import {NotificationContext} from "../../../../../context/NotificationContext";

const ViewAccountNumberPreferencesTable = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const [preferences, setPreferences] = useState([]);
    const [selectedPreference, setSelectedPreference] = useState(null);
    const [accountTypeOptions, setAccountTypeOptions] = useState([]);
    const [prefixTypeOptions, setPrefixTypeOptions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({});
    const [originalData, setOriginalData] = useState({});
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [filter, setFilter] = useState('');
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchPreferences();
    }, []);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredPreferences().length / pageSize));
    }, [preferences, filter, pageSize]);

    const fetchPreferences = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/accountnumberformats`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setPreferences(response.data || []);
        } catch (error) {
            console.error('Error fetching account number preferences:', error);
        } finally {
            stopLoading();
        }
    };

    const fetchPreferenceDetails = async (preferenceId) => {
        startLoading();
        try {
            const preferenceResponse = await axios.get(
                `/fineract-provider/api/v1/accountnumberformats/${preferenceId}`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            const templateResponse = await axios.get(
                `/fineract-provider/api/v1/accountnumberformats/template`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const preference = preferenceResponse.data;
            setOriginalData(preference);
            setFormData({
                accountType: preference.accountType.value,
                prefixType: preference.prefixType.id,
            });

            setAccountTypeOptions(templateResponse.data.accountTypeOptions || []);
            setPrefixTypeOptions(
                templateResponse.data.prefixTypeOptions[preference.accountType.code] || []
            );

            setSelectedPreference(preference);
            setIsModalOpen(true);
        } catch (error) {
            console.error('Error fetching preference details:', error);
        } finally {
            stopLoading();
        }
    };

    const handleModalChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleModalSubmit = async () => {
        startLoading();
        try {
            const payload = {
                prefixType: formData.prefixType,
            };
            await axios.put(
                `/fineract-provider/api/v1/accountnumberformats/${selectedPreference.id}`,
                payload,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            setIsModalOpen(false);
            fetchPreferences();
            showNotification("Preference updated successfully!", 'success');
        } catch (error) {
            console.error('Error updating preference:', error);
            showNotification('Error updating preference:', 'error');
        } finally {
            stopLoading();
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this preference?')) return;

        startLoading();
        try {
            await axios.delete(
                `/fineract-provider/api/v1/accountnumberformats/${selectedPreference.id}`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            setIsModalOpen(false);
            fetchPreferences();
            showNotification("Preference deleted successfully!", 'info');
        } catch (error) {
            console.error('Error deleting preference:', error);
        } finally {
            stopLoading();
        }
    };

    const filteredPreferences = () =>
        preferences.filter((preference) =>
            preference.accountType?.value?.toLowerCase().includes(filter.toLowerCase())
        );

    const paginatedData = filteredPreferences().slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const isFormChanged = () =>
        JSON.stringify(formData) !==
        JSON.stringify({
            accountType: originalData.accountType?.value,
            prefixType: originalData.prefixType?.id,
        });

    return (
        <div className="preferences-table-container">
            <div className="table-controls">
                <div className="filter-container">
                    <label htmlFor="filter">Filter by Preferences:</label>
                    <input
                        type="text"
                        id="filter"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        placeholder="Enter preference..."
                    />
                </div>
                <div className="page-size-selector">
                    <label>Rows per page: </label>
                    <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>
            <table className="preferences-table">
                <thead>
                <tr>
                    <th>Account Number Preferences</th>
                </tr>
                </thead>
                <tbody>
                {paginatedData.length > 0 ? (
                    paginatedData.map((preference) => (
                        <tr
                            key={preference.id}
                            onClick={() => fetchPreferenceDetails(preference.id)}
                            className="clickable-row"
                        >
                            <td>{preference.accountType?.value || 'N/A'}</td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="1" className="no-data">
                            No preferences available
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
            {totalPages > 1 && (
                <div className="pagination">
                    <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                        Start
                    </button>
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    <span>
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                    <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                    >
                        End
                    </button>
                </div>
            )}

            {isModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className="create-modal-title">Edit Account Number Preference</h4>
                        <div className="create-provisioning-criteria-group">
                            <label className="create-provisioning-criteria-label">Account Type (Read-Only)</label>
                            <input
                                type="text"
                                value={formData.accountType}
                                readOnly
                                disabled
                                className="create-provisioning-criteria-input"
                            />
                        </div>
                        <div className="create-provisioning-criteria-group">
                            <label className="create-provisioning-criteria-label">Prefix Type</label>
                            <select
                                value={formData.prefixType}
                                onChange={(e) =>
                                    handleModalChange('prefixType', e.target.value)
                                }
                                className="create-provisioning-criteria-select"
                            >
                                {prefixTypeOptions.map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {option.value}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="modal-cancel-button"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="create-provisioning-criteria-cancel"
                            >
                                Delete
                            </button>
                            <button
                                onClick={handleModalSubmit}
                                className="create-provisioning-criteria-confirm"
                                disabled={!isFormChanged()}
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewAccountNumberPreferencesTable;
