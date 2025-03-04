import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import './RoleDetailTab.css';
import { API_CONFIG } from '../../../../../config';
import {NotificationContext} from "../../../../../context/NotificationContext";

const RoleDetailTab = ({ role, onClose}) => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const [permissions, setPermissions] = useState([]);
    const [collapsedGroups, setCollapsedGroups] = useState({});
    const [selectedPermissions, setSelectedPermissions] = useState({});
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchRoleDetails();
    }, []);

    const fetchRoleDetails = async () => {
        startLoading();
        try {
            const response = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/roles/${role.id}/permissions`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const permissionData = response.data.permissionUsageData || [];
            setPermissions(permissionData);

            const initialCollapsed = permissionData.reduce((acc, perm) => {
                const group = perm.grouping || 'Other';
                acc[group] = true;
                return acc;
            }, {});

            setCollapsedGroups(initialCollapsed);

            const initialSelections = permissionData.reduce((acc, perm) => {
                acc[perm.code] = perm.selected || false;
                return acc;
            }, {});
            setSelectedPermissions(initialSelections);
        } catch (error) {
            console.error('Error fetching permissions:', error);
        } finally {
            stopLoading();
        }
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

    const groupPermissions = (permissions) => {
        return permissions.reduce((acc, perm) => {
            const group = perm.grouping || 'Other';
            if (!acc[group]) {
                acc[group] = [];
            }
            acc[group].push(perm);
            return acc;
        }, {});
    };

    const handlePermissionToggle = (code) => {
        setSelectedPermissions((prev) => ({
            ...prev,
            [code]: !prev[code],
        }));
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancelEditing = () => {
        setIsEditing(false);
        fetchRoleDetails();
    };

    const handleSubmit = async () => {
        try {
            startLoading();

            const payload = {
                permissions: Object.keys(selectedPermissions).reduce((acc, code) => {
                    acc[code] = selectedPermissions[code];
                    return acc;
                }, {}),
            };

            await axios.put(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/roles/${role.id}/permissions`,
                payload,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            setIsEditing(false);
            fetchRoleDetails();
            showNotification("Permissions updated successfully!", 'success');
        } catch (error) {
            console.error('Error updating permissions:', error);
            showNotification('Failed to update permissions! Please try again!', 'error');
        } finally {
            stopLoading();
        }
    };

    const handleEnableDisableRole = async () => {
        const action = role.disabled ? 'enable' : 'disable';
        if (!window.confirm(`Are you sure you want to ${action} this role?`)) {
            return;
        }
        try {
            startLoading();
            await axios.post(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/roles/${role.id}?command=${action}`,
                {},
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            setIsEditing(false);
            setPermissions([]);
            onClose();
            showNotification(`Permision ${action} successfully!`, 'success');
        } catch (error) {
            console.error(`Error ${role.disabled ? 'enabling' : 'disabling'} the role:`, error);
            showNotification(`Failed to ${action} the role. Please try again!`, 'error');
        } finally {
            stopLoading();
        }
    };

    const groupedPermissions = groupPermissions(permissions);

    const handleToggleGroupPermissions = (group, selectAll) => {
        const updatedPermissions = { ...selectedPermissions };

        groupedPermissions[group].forEach((perm) => {
            updatedPermissions[perm.code] = selectAll;
        });

        setSelectedPermissions(updatedPermissions);
    };

    const handleDeleteRole = async () => {
        if (!window.confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
            return;
        }

        try {
            startLoading();
            await axios.delete(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/roles/${role.id}`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            onClose();
            showNotification("Role deleted successfully!", 'success');
        } catch (error) {
            console.error('Error deleting role:', error);
            showNotification('Failed to delete the role. Please try again!', 'error');
        } finally {
            stopLoading();
        }
    };

    const splitIntoRows = (permissions, itemsPerRow) => {
        const rows = [];
        for (let i = 0; i < permissions.length; i += itemsPerRow) {
            rows.push(permissions.slice(i, i + itemsPerRow));
        }
        return rows;
    };

    return (
        <div className="role-detail-tab">
            <div>
                <div className="roles-top-right-button">
                    {isEditing ? (
                        <>
                            <button className="submit-button" onClick={handleSubmit}>Submit</button>
                            <button className="cancel-button" onClick={handleCancelEditing}>Stop Editing!</button>
                        </>
                    ) : (
                        <>
                            <button className="role-edit-button" onClick={handleEdit}>Edit Role</button>
                            <button className="submit-button" onClick={handleEnableDisableRole}>
                                {role.disabled ? 'Enable Role' : 'Disable Role'}
                            </button>
                            <button className="cancel-button"  onClick={handleDeleteRole}>
                                Delete Role
                            </button>
                        </>
                    )}
                </div>
            </div>
            <div className="role-header">
                <div className="role-header-item">
                    <strong className="role-header-label">Role:</strong>
                    <span className="role-header-value">{role.name}</span>
                </div>
                <div className="role-header-item">
                    <strong className="role-header-label">Description:</strong>
                    <span className="role-header-value">{role.description}</span>
                </div>
            </div>
            <div className="maker-checker-table">
                <div className="table">
                    {Object.entries(groupedPermissions).map(([group, perms]) => (
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
                                {isEditing && !collapsedGroups[group] && (
                                    <div className="table-cell group-actions">
                                        <button
                                            className="group-action-button enable-role"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleGroupPermissions(group, true);
                                            }}
                                        >
                                            Select All
                                        </button>
                                        <button
                                            className="group-action-button disable-role"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleGroupPermissions(group, false);
                                            }}
                                        >
                                            Deselect All
                                        </button>
                                    </div>
                                )}
                            </div>
                            {!collapsedGroups[group] &&
                                splitIntoRows(perms, 3).map((row, rowIndex) => (
                                    <div className="table-row permission-row" key={`row-${group}-${rowIndex}`}>
                                        {row.map((perm) => (
                                            <div className="table-cell permission-cell" key={perm.code}>
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        disabled={!isEditing}
                                                        checked={selectedPermissions[perm.code] || false}
                                                        onChange={() => handlePermissionToggle(perm.code)}
                                                    />
                                                    {perm.code
                                                        ? perm.code.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
                                                        : 'Unknown Code'}
                                                </label>
                                            </div>
                                        ))}
                                        {Array.from({ length: 3 - row.length }).map((_, i) => (
                                            <div className="table-cell permission-cell empty-cell" key={`empty-${rowIndex}-${i}`} />
                                        ))}
                                    </div>
                                ))}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RoleDetailTab;
