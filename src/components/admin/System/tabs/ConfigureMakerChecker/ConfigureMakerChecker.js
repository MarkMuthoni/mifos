import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import { Link } from 'react-router-dom';
import './ConfigureMakerChecker.css';
import {NotificationContext} from "../../../../../context/NotificationContext";

const ConfigureMakerChecker = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const [activities, setActivities] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [editMode, setEditMode] = useState(false);
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [collapsedGroups, setCollapsedGroups] = useState({});

    useEffect(() => {
        fetchPermissions();
    }, []);

    const fetchPermissions = async () => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/permissions?makerCheckerable=true`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setActivities(response.data);
            const initialPermissions = response.data.reduce((acc, activity) => {
                acc[activity.code] = activity.selected;
                return acc;
            }, {});
            setPermissions(initialPermissions);

            const initialCollapsed = response.data.reduce((acc, activity) => {
                const group = activity.grouping || 'Other';
                acc[group] = true;
                return acc;
            }, {});
            setCollapsedGroups(initialCollapsed);
        } catch (error) {
            console.error('Error fetching activities:', error);
            showNotification('Error fetching activities!', 'error');
        } finally {
            stopLoading();
        }
    };

    const togglePermission = (code) => {
        setPermissions((prev) => ({
            ...prev,
            [code]: !prev[code],
        }));
    };

    const toggleGroupCollapse = (group) => {
        setCollapsedGroups((prev) =>
            Object.keys(prev).reduce(
                (acc, key) => ({
                    ...acc,
                    [key]: key === group ? !prev[key] : true,
                }),
                {}
            )
        );
    };

    const handleEdit = () => {
        setEditMode(true);
    };

    const handleCancel = () => {
        fetchPermissions();
        setEditMode(false);
    };

    const handleSubmit = async () => {
        try {
            startLoading();
            const updatedPermissions = Object.entries(permissions).map(([code, enabled]) => ({
                code,
                makerCheckerEnabled: enabled,
            }));

            await axios.put(`${API_CONFIG.proxy}/fineract-provider/api/v1/permissions`, updatedPermissions, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setEditMode(false);
            showNotification("Permissions updated!", 'success')
        } catch (error) {
            console.error('Error updating permissions:', error);
            showNotification('Error updating permissions!', 'error');
        } finally {
            stopLoading();
        }
    };

    const groupPermissions = (activities) => {
        const grouped = activities.reduce((acc, activity) => {
            const group = activity.grouping || 'Other';
            if (!acc[group]) {
                acc[group] = [];
            }
            acc[group].push(activity);
            return acc;
        }, {});
        return grouped;
    };

    const groupedActivities = groupPermissions(activities);
    const paginatedGroups = Object.entries(groupedActivities).slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    return (
        <div className="configure-maker-checker neighbor-element">
            <h2 className="page-heading">
                <Link to="/system" className="breadcrumb-link">System</Link> . Configure Maker Checker Tasks
            </h2>
            <div className="configure-maker-checker-header">
                <div className="table-controls">
                    <label>
                        Rows per page:
                        <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </label>
                </div>
                {editMode ? (
                    <div className="configure-maker-action-buttons">
                        <button className="submit-button" onClick={handleSubmit}>
                            Submit
                        </button>
                        <button className="cancel-button" onClick={handleCancel}>
                            Cancel
                        </button>
                    </div>
                ) : (
                    <button className="edit-button" onClick={handleEdit}>
                        Edit
                    </button>
                )}
            </div>

            <div className="maker-checker-table">
                <div className="table">
                    {paginatedGroups.map(([group, activities]) => (
                        <React.Fragment key={group}>
                            <div
                                className="table-row group-row"
                                onClick={() => toggleGroupCollapse(group)}
                            >
                                <div className="table-cell group-title">
                                    <span>{collapsedGroups[group] ? '+' : '-'}</span>{' '}
                                    {group.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                                </div>
                                <div className="table-cell activity-placeholder"></div>
                            </div>

                            {!collapsedGroups[group] &&
                                activities.map((activity, index) => (
                                    <div className="table-row activity-row" key={activity.code}>
                                        <div className="table-cell group-repeater">
                                            {index === 0 && group.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                                        </div>
                                        <div className="table-cell activity-name">
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={permissions[activity.code] || false}
                                                    disabled={!editMode}
                                                    onChange={() => togglePermission(activity.code)}
                                                />
                                                {activity.actionName
                                                    .toLowerCase()
                                                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                                            </label>
                                        </div>
                                    </div>
                                ))}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            <div className="pagination">
                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                    First
                </button>
                <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    Previous
                </button>
                <span>
                    Page {currentPage} of {Math.ceil(Object.entries(groupedActivities).length / pageSize)}
                </span>
                <button
                    onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(Object.entries(groupedActivities).length / pageSize)))
                    }
                    disabled={currentPage === Math.ceil(Object.entries(groupedActivities).length / pageSize)}
                >
                    Next
                </button>
                <button
                    onClick={() => setCurrentPage(Math.ceil(Object.entries(groupedActivities).length / pageSize))}
                    disabled={currentPage === Math.ceil(Object.entries(groupedActivities).length / pageSize)}
                >
                    Last
                </button>
            </div>
        </div>
    );
};

export default ConfigureMakerChecker;
