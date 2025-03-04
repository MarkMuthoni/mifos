import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import { Link } from 'react-router-dom';
import { FiEdit } from 'react-icons/fi';
import './Configuration.css';
import {NotificationContext} from "../../../../../context/NotificationContext";

const ConfigurationPage = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const [configurations, setConfigurations] = useState([]);
    const [filter, setFilter] = useState({ name: '', status: '' });
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const [showEditModal, setShowEditModal] = useState(false);
    const [editConfig, setEditConfig] = useState(null);
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);


    useEffect(() => {
        fetchConfigurations();
    }, []);

    const fetchConfigurations = async () => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/configurations`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setConfigurations(
                Array.isArray(response.data?.globalConfiguration) ? response.data.globalConfiguration : []
            );
            // console.log(response.data);
            // console.log('Global Config:',response.data.globalConfiguration);
        } catch (error) {
            console.error('Error fetching configurations:', error);
            showNotification('Error fetching configurations!', 'error');
            setConfigurations([]);
        } finally {
            stopLoading();
        }
    };

    const handleToggle = async (id, currentStatus) => {
        const updatedStatus = !currentStatus;
        const payload = {
            enabled: updatedStatus,
        };

        setConfigurations((prev) =>
            prev.map((config) =>
                config.id === id ? { ...config, enabled: updatedStatus } : config
            )
        );

        try {
            startLoading();
            await axios.put(`${API_CONFIG.proxy}/fineract-provider/api/v1/configurations/${id}`, payload, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            showNotification(`Status for configuration ID ${id} updated successfully!`, 'success');
        } catch (error) {
            console.error(`Failed to update status for configuration ID ${id}:`, error);
            showNotification(`Failed to update status for configuration ID ${id}!`, 'error');

            setConfigurations((prev) =>
                prev.map((config) =>
                    config.id === id ? { ...config, enabled: currentStatus } : config
                )
            );
        } finally {
            stopLoading();
        }
    };

    const filteredConfigurations = () => {
        if (!Array.isArray(configurations)) {
            return [];
        }
        return configurations.filter((config) => {
            const matchesName = filter.name
                ? config.name?.toLowerCase().includes(filter.name.toLowerCase())
                : true;
            const matchesStatus =
                filter.status === 'enabled'
                    ? config.enabled
                    : filter.status === 'disabled'
                        ? !config.enabled
                        : true;
            return matchesName && matchesStatus;
        });
    };

    const paginatedConfigurations = Array.isArray(filteredConfigurations())
        ? filteredConfigurations().slice((currentPage - 1) * pageSize, currentPage * pageSize)
        : [];

    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
        setCurrentPage(1);
    };

    const handleEdit = async (config) => {
        setShowEditModal(true);
        startLoading();

        try {
            const response = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/configurations/${config.id}`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            setEditConfig(response.data);
            setIsSubmitDisabled(true);
        } catch (error) {
            console.error("Error fetching configuration details:", error);
            showNotification("Failed to fetch configuration details. Please try again!", 'error');
        } finally {
            stopLoading();
        }
    };

    const handleFieldChange = (field, value) => {
        setEditConfig((prev) => {
            const updated = { ...prev, [field]: value };
            setIsSubmitDisabled(
                JSON.stringify(updated) === JSON.stringify(prev)
            );
            return updated;
        });
    };

    const handleSubmit = async () => {
        if (!editConfig) return;

        startLoading();

        try {
            const payload = {
                value: editConfig.value,
            };

            await axios.put(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/configurations/${editConfig.id}`,
                payload,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            showNotification("Configuration updated successfully!", 'success');
            setShowEditModal(false);
            fetchConfigurations();
        } catch (error) {
            console.error("Error updating configuration:", error);
            showNotification("Failed to update configuration! Please try again!", 'error');
        } finally {
            stopLoading();
        }
    };

    const handleCancel = () => {
        setShowEditModal(false);
        setEditConfig(null);
    };

    return (
        <div className="configuration-page neighbor-element">
            <h2 className="page-heading">
                <Link to="/system" className="breadcrumb-link">System</Link> . Configuration
            </h2>
            <div className="config-controls">
                <div className="filter-container">
                    <div className="filter-item">
                        <label htmlFor="nameFilter">Filter by Name:</label>
                        <input
                            type="text"
                            id="nameFilter"
                            value={filter.name}
                            onChange={(e) =>
                                setFilter((prev) => ({ ...prev, name: e.target.value }))
                            }
                            placeholder="Enter configuration name..."
                        />
                    </div>
                    <div className="filter-item">
                        <label htmlFor="statusFilter">Filter by Status:</label>
                        <select
                            id="statusFilter"
                            value={filter.status}
                            onChange={(e) =>
                                setFilter((prev) => ({ ...prev, status: e.target.value }))
                            }
                        >
                            <option value="">All</option>
                            <option value="enabled">Enabled</option>
                            <option value="disabled">Disabled</option>
                        </select>
                    </div>
                </div>
                <div className="page-size-selector">
                    <label>Rows per page:</label>
                    <select value={pageSize} onChange={handlePageSizeChange}>
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>
            <table className="config-table">
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Value</th>
                    <th>String Value</th>
                    <th>Date Value</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {paginatedConfigurations.length > 0 ? (
                    paginatedConfigurations.map((config) => (
                        <tr key={config.id}>
                            <td>{config.name}</td>
                            <td>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={config.enabled}
                                        onChange={() => handleToggle(config.id, config.enabled)}
                                    />
                                    <span className="slider"></span>
                                </label>
                            </td>
                            <td>{config.value}</td>
                            <td>{config.stringValue || ' '}</td>
                            <td>{config.dateValue || ' '}</td>
                            <td>
                                <button
                                    className="edit-icon-button"
                                    onClick={() => handleEdit(config)}
                                >
                                    <FiEdit className="edit-icon"/>
                                </button>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="6" className="no-data">
                            No configurations available
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
            {filteredConfigurations().length > pageSize && (
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
                        Page {currentPage} of {Math.ceil(filteredConfigurations().length / pageSize)}
                    </span>
                    <button
                        onClick={() =>
                            setCurrentPage((prev) =>
                                Math.min(prev + 1, Math.ceil(filteredConfigurations().length / pageSize))
                            )
                        }
                        disabled={currentPage === Math.ceil(filteredConfigurations().length / pageSize)}
                    >
                        Next
                    </button>
                    <button
                        onClick={() =>
                            setCurrentPage(Math.ceil(filteredConfigurations().length / pageSize))
                        }
                        disabled={currentPage === Math.ceil(filteredConfigurations().length / pageSize)}
                    >
                        End
                    </button>
                </div>
            )}

            {showEditModal && editConfig && (
                <div className="edit-modal-overlay">
                    <div className="edit-modal-content">
                        <h3 className="staged-form-title">Edit Configuration</h3>
                        <div className="staged-form-field">
                            <label>Configuration Name (Read Only)</label>
                            <input
                                type="text"
                                className="staged-form-input"
                                value={editConfig.name}
                                readOnly
                                disabled
                            />
                        </div>
                        <div className="staged-form-field">
                            <label>Description (Read Only)</label>
                            <input
                                type="text"
                                className="staged-form-input"
                                value={editConfig.description || ""}
                                readOnly
                                disabled
                            />
                        </div>
                        <div className="staged-form-field">
                            <label>Number Value</label>
                            <input
                                type="number"
                                className="staged-form-input"
                                value={editConfig.value || ""}
                                onChange={(e) => handleFieldChange("value", e.target.value)}
                            />
                        </div>
                        <div className="staged-form-field">
                            <label>Date Value</label>
                            <input
                                type="date"
                                className="staged-form-input"
                                value={editConfig.dateValue || ""}
                                max={new Date().toISOString().split("T")[0]}
                                onChange={(e) => handleFieldChange("dateValue", e.target.value)}
                            />
                        </div>
                        <div className="modal-actions">
                            <button className="modal-cancel-button" onClick={handleCancel}>
                                Cancel
                            </button>
                            <button
                                className="modal-submit-button"
                                onClick={handleSubmit}
                                disabled={isSubmitDisabled}
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

export default ConfigurationPage;
