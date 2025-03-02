import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import './ViewRoles.css';
import {FiEdit} from "react-icons/fi";
import {NotificationContext} from "../../../../../context/NotificationContext";

const ViewRolesTable = ({ onRowClick}) => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const [roles, setRoles] = useState([]);
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [filter, setFilter] = useState({ name: '', status: '' });
    const [totalPages, setTotalPages] = useState(1);

    const [showEditModal, setShowEditModal] = useState(false);
    const [editRole, setEditRole] = useState(null);
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);

    useEffect(() => {
        fetchRoles();
    }, []);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredRoles().length / pageSize));
    }, [roles, filter, pageSize]);

    const fetchRoles = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/roles`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setRoles(response.data);
        } catch (error) {
            console.error('Error fetching roles:', error);
        } finally {
            stopLoading();
        }
    };

    const filteredRoles = () =>
        roles.filter((role) => {
            const matchesName = role.name
                .toLowerCase()
                .includes(filter.name.toLowerCase());
            const matchesStatus =
                filter.status === '' ||
                (filter.status === 'enabled' && !role.disabled) ||
                (filter.status === 'disabled' && role.disabled);
            return matchesName && matchesStatus;
        });

    const paginatedData = filteredRoles().slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
        setCurrentPage(1);
    };

    const handleEditRole = async (role) => {
        setShowEditModal(true);
        startLoading();

        try {
            const response = await axios.get(
                `/fineract-provider/api/v1/roles/${role.id}/permissions`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            setEditRole(response.data);
            setIsSubmitDisabled(true);
        } catch (error) {
            console.error("Error fetching role details:", error);
        } finally {
            stopLoading();
        }
    };

    const handleFieldChange = (field, value) => {
        setEditRole((prev) => {
            const updated = { ...prev, [field]: value };
            setIsSubmitDisabled(
                updated.description.trim() === "" || JSON.stringify(updated) === JSON.stringify(prev)
            );
            return updated;
        });
    };

    const handleSubmit = async () => {
        if (!editRole || !editRole.description.trim()) {
            showNotification("Description is required!", 'info');
            return;
        }

        startLoading();

        try {
            const payload = { description: editRole.description.trim() };

            await axios.put(
                `/fineract-provider/api/v1/roles/${editRole.id}`,
                payload,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            setShowEditModal(false);
            fetchRoles();
            showNotification("Role Updated!", 'success');
        } catch (error) {
            console.error("Error updating role:", error);
            showNotification("Failed to update role. Please try again!", 'error');
        } finally {
            stopLoading();
        }
    };

    const handleCancel = () => {
        setShowEditModal(false);
        setEditRole(null);
    };


    return (
        <div className="roles-table-container">
            <div className="table-controls">
                <div className="filter-container">
                    <div className="filter-item">
                        <label htmlFor="nameFilter">Filter by Name:</label>
                        <input
                            type="text"
                            id="nameFilter"
                            value={filter.name}
                            onChange={(e) =>
                                setFilter((prev) => ({...prev, name: e.target.value}))
                            }
                            placeholder="Enter role name..."
                        />
                    </div>
                    <div className="filter-item">
                        <label htmlFor="statusFilter">Filter by Status:</label>
                        <select
                            id="statusFilter"
                            value={filter.status}
                            onChange={(e) =>
                                setFilter((prev) => ({...prev, status: e.target.value}))
                            }
                        >
                            <option value="">All</option>
                            <option value="enabled">Enabled</option>
                            <option value="disabled">Disabled</option>
                        </select>
                    </div>
                </div>

                <div className="page-size-selector">
                    <label>Rows per page: </label>
                    <select value={pageSize} onChange={handlePageSizeChange}>
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>
            <table className="roles-table">
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
                </thead>
                <tbody>
                {paginatedData.length > 0 ? (
                    paginatedData.map((role) => (
                        <tr
                            key={role.id}
                            onClick={() => onRowClick(role)}
                            className="clickable-row"
                        >
                            <td>{role.name}</td>
                            <td>{role.description || ''}</td>
                            <td>
                                <div className="indicator-container">
                                    <div
                                        className={`indicator ${!role.disabled ? 'yes' : 'no'}`}
                                    ></div>
                                    <div className="tooltip">
                                        {!role.disabled ? 'Enabled' : 'Disabled'}
                                    </div>
                                </div>
                            </td>
                            <td>
                                {role.id !== 1 && (
                                    <button
                                        className="edit-icon-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditRole(role);
                                        }}
                                    >
                                        <FiEdit style={{fontSize: '20px'}} color={'#156a22'}/>
                                    </button>

                                )}
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="4" className="no-data">No roles available</td>
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
            {showEditModal && editRole && (
                <div className="edit-modal-overlay">
                    <div className="edit-modal-content">
                        <h3 className="staged-form-title">Edit Role</h3>
                        <div className="staged-form-field">
                            <label>Role Name (Read Only)</label>
                            <input
                                type="text"
                                className="staged-form-input"
                                value={editRole.name}
                                disabled
                            />
                        </div>
                        <div className="staged-form-field">
                            <label>Role Description <span className="required">*</span></label>
                            <input
                                type="text"
                                className="staged-form-input"
                                value={editRole.description}
                                onChange={(e) => handleFieldChange("description", e.target.value)}
                                required
                            />
                        </div>
                        <div className="modal-actions">
                            <button className="modal-cancel-button" onClick={handleCancel}>Cancel</button>
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

export default ViewRolesTable;
