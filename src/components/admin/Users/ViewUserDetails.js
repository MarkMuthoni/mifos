import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../../../config';
import { AuthContext } from '../../../context/AuthContext';
import { useLoading } from '../../../context/LoadingContext';
import './ViewUserDetails.css';
import {NotificationContext} from "../../../context/NotificationContext";

const ViewUserDetails = ({ selectedUser, onClose }) => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const [userDetails, setUserDetails] = useState(null);

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({});
    const [officeOptions, setOfficeOptions] = useState([]);
    const [roleOptions, setRoleOptions] = useState([]);
    const [staffOptions, setStaffOptions] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isChangePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
    const [passwordData, setPasswordData] = useState({
        password: '',
        confirmPassword: '',
    });
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

    useEffect(() => {
        if (selectedUser && selectedUser.id) {
            fetchUserDetails();
        }
    }, [selectedUser]);

    const fetchUserDetails = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/users/${selectedUser.id}`, { // Use "selectedUser"
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                },
            });
            setUserDetails({ ...response.data, selectedRoles: response.data.selectedRoles || [] });
        } catch (error) {
            console.error('Error fetching user details:', error.message);
        } finally {
            stopLoading();
        }
    };

    const handleEditClick = async () => {
        startLoading();

        try {
            const userResponse = await axios.get(
                `/fineract-provider/api/v1/users/${userDetails.id}`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const templateResponse = await axios.get(
                `/fineract-provider/api/v1/users/template`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const staffResponse = await axios.get(
                `/fineract-provider/api/v1/staff?officeId=${userResponse.data.officeId}&status=all`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            setEditFormData({
                ...userResponse.data,
                roles: userResponse.data.selectedRoles || [],
                staffId: userResponse.data.staff?.id || "",
            });


            setOfficeOptions(templateResponse.data.allowedOffices);
            setRoleOptions(templateResponse.data.availableRoles);
            setStaffOptions(staffResponse.data);

            setEditModalOpen(true);
        } catch (error) {
            console.error("Error fetching edit data:", error.message);
        } finally {
            stopLoading();
        }
    };

    const handleEditSubmit = async () => {
        setIsSubmitting(true);
        startLoading();
        try {
            const payload = {
                username: editFormData.username.trim(),
                email: editFormData.email.trim(),
                firstname: editFormData.firstname.trim(),
                lastname: editFormData.lastname.trim(),
                officeId: editFormData.officeId,
                passwordNeverExpires: editFormData.passwordNeverExpires,
                roles: editFormData.roles.map((role) => role.id),
                staffId: editFormData.staffId || null,
            };

            await axios.put(`/fineract-provider/api/v1/users/${userDetails.id}`, payload, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });

            fetchUserDetails();

            setEditModalOpen(false);

            showNotification("User details updated successfully!", 'success');
        } catch (error) {
            console.error("Error updating user details:", error.message);
            showNotification("Error updating user details!", 'error');
        } finally {
            setIsSubmitting(false);
            stopLoading();
        }
    };

    const validatePassword = (password) => {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return regex.test(password);
    };

    const handlePasswordSubmit = async () => {
        setIsSubmittingPassword(true);
        startLoading();
        try {
            if (!validatePassword(passwordData.password)) {
                showNotification("Password does not meet the requirements!", 'info');
                return;
            }

            const payload = {
                password: passwordData.password,
                repeatPassword: passwordData.confirmPassword,
                firstname: userDetails.firstname,
            };

            await axios.put(`/fineract-provider/api/v1/users/${userDetails.id}`, payload, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });


            setChangePasswordModalOpen(false);
            showNotification("Password updated successfully!", 'success');
        } catch (error) {
            console.error("Error changing password:", error.message);
            showNotification("Error changing password!", 'error');
        } finally {
            setIsSubmittingPassword(false);
            stopLoading();
        }
    };

    const handleDeleteClick = async () => {
        if (!window.confirm(`Are you sure you want to delete the user "${userDetails.firstname} ${userDetails.lastname}"?`)) {
            return;
        }

        startLoading();
        try {
            await axios.delete(`/fineract-provider/api/v1/users/${userDetails.id}`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                },
            });

            onClose()
        } catch (error) {
            console.error("Error deleting user:", error.message);
            showNotification("An error occurred while deleting the user! Please try again!", 'error');
        } finally {
            stopLoading();
        }
    };

    const isFormValid = () => {
        const mandatoryFieldsFilled =
            editFormData.username.trim() &&
            editFormData.email.trim() &&
            editFormData.firstname.trim() &&
            editFormData.lastname.trim() &&
            editFormData.officeId &&
            editFormData.roles.length > 0;

        const isDataModified =
            editFormData.username !== userDetails.username ||
            editFormData.email !== userDetails.email ||
            editFormData.firstname !== userDetails.firstname ||
            editFormData.lastname !== userDetails.lastname ||
            editFormData.officeId !== userDetails.officeId ||
            editFormData.staffId !== userDetails.staff?.id ||
            editFormData.roles.map((role) => role.id).join(",") !==
            userDetails.selectedRoles.map((role) => role.id).join(",");

        return mandatoryFieldsFilled && isDataModified;
    };

    if (!selectedUser || !selectedUser.id) {
        return <div>No user selected. Please select a user to view details.</div>;
    }

    if (!userDetails) return <div>Loading user details...</div>;

    return (
        <div className="user-details-container">
            <div className="user-details-table-container">
                <div className="user-details-actions">
                    <button className="create-provisioning-criteria-confirm" onClick={() => handleEditClick()}>
                        Edit
                    </button>
                    <button className="create-provisioning-criteria-cancel" onClick={() => handleDeleteClick()}>
                        Delete
                    </button>
                    <button onClick={() => setChangePasswordModalOpen(true)}
                            className="staged-form-modal-button-submit">
                        Change Password
                    </button>
                </div>

                <table className="user-details-table">
                    <tbody>
                    <tr>
                        <td>Login Name</td>
                        <td>{userDetails.username}</td>
                    </tr>
                    <tr>
                        <td>First Name</td>
                        <td>{userDetails.firstname}</td>
                    </tr>
                    <tr>
                        <td>Last Name</td>
                        <td>{userDetails.lastname}</td>
                    </tr>
                    <tr>
                        <td>Email</td>
                        <td>{userDetails.email}</td>
                    </tr>
                    <tr>
                        <td>Office</td>
                        <td>{userDetails.officeName}</td>
                    </tr>
                    <tr>
                        <td>Roles</td>
                        <td>
                            {userDetails.selectedRoles?.length > 0
                                ? userDetails.selectedRoles.map((role) => role.name).join(", ")
                                : "No roles assigned"}
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
            {editModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className="create-modal-title">Edit User</h4>
                        <div className="staged-form-row">
                            <div className="create-provisioning-criteria-group">
                                <label className={"create-provisioning-criteria-label"}
                                >Username <span>*</span></label>
                                <input
                                    type="text"
                                    className={"staged-form-input"}
                                    value={editFormData.username}
                                    onChange={(e) =>
                                        setEditFormData({...editFormData, username: e.target.value})
                                    }
                                />
                            </div>
                            <div className="create-provisioning-criteria-group">
                                <label className={"create-provisioning-criteria-label"}
                                >Email <span>*</span></label>
                                <input
                                    type="text"
                                    className={"staged-form-input"}
                                    value={editFormData.email}
                                    onChange={(e) =>
                                        setEditFormData({...editFormData, email: e.target.value})
                                    }
                                />
                            </div>
                        </div>
                        <div className="staged-form-row">
                            <div className="create-provisioning-criteria-group">
                                <label className={"create-provisioning-criteria-label"}
                                >First Name <span>*</span></label>
                                <input
                                    type="text"
                                    className={"staged-form-input"}
                                    value={editFormData.firstname}
                                    onChange={(e) =>
                                        setEditFormData({...editFormData, firstname: e.target.value})
                                    }
                                />
                            </div>
                            <div className="create-provisioning-criteria-group">
                                <label className={"create-provisioning-criteria-label"}
                                >Last Name <span>*</span></label>
                                <input
                                    type="text"
                                    className={"staged-form-input"}
                                    value={editFormData.lastname}
                                    onChange={(e) =>
                                        setEditFormData({...editFormData, lastname: e.target.value})
                                    }
                                />
                            </div>
                        </div>
                        <div className="staged-form-row">
                            <div className="create-provisioning-criteria-group">
                                <label className={"create-provisioning-criteria-label"}>
                                    <input
                                        type="checkbox"
                                        checked={editFormData.passwordNeverExpires}
                                        onChange={(e) =>
                                            setEditFormData({...editFormData, passwordNeverExpires: e.target.checked})
                                        }
                                    />   Password Never Expires
                                </label>
                            </div>
                            <div className="create-provisioning-criteria-group">
                                <label className={"create-provisioning-criteria-label"}
                                >Office <span>*</span></label>
                                <select
                                    value={editFormData.officeId}
                                    className={"staged-form-select"}
                                    onChange={(e) =>
                                        setEditFormData({...editFormData, officeId: e.target.value})
                                    }
                                >
                                    {officeOptions.map((office) => (
                                        <option key={office.id} value={office.id}>
                                            {office.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="staged-form-row">
                            <div className="create-provisioning-criteria-group">
                                <label className={"create-provisioning-criteria-label"}>Staff</label>
                                <select
                                    value={editFormData.staffId || ""}
                                    className={"staged-form-select"}
                                    onChange={(e) =>
                                        setEditFormData({...editFormData, staffId: e.target.value})
                                    }
                                >
                                    <option value="">None</option>
                                    {staffOptions.map((staff) => (
                                        <option key={staff.id} value={staff.id}>
                                            {staff.displayName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="create-provisioning-criteria-group">
                                <label className={"create-provisioning-criteria-label"}>Roles <span>*</span></label>
                                <div className="user-checkbox-group-container">
                                    {roleOptions.length === 0 ? (
                                        <p>No roles available.</p>
                                    ) : (
                                        <div className="user-checkbox-group">
                                            {roleOptions.map((role) => (
                                                <div key={role.id} className="user-checkbox-item">
                                                    <input
                                                        type="checkbox"
                                                        id={`role-${role.id}`}
                                                        checked={editFormData.roles?.some((r) => r.id === role.id)}
                                                        onChange={(e) => {
                                                            const isChecked = e.target.checked;
                                                            const updatedRoles = isChecked
                                                                ? [...editFormData.roles, {id: role.id}]
                                                                : editFormData.roles.filter((r) => r.id !== role.id);
                                                            setEditFormData({...editFormData, roles: updatedRoles});
                                                        }}
                                                    />
                                                    <label htmlFor={`role-${role.id}`}>{role.name}</label>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button
                                className="create-provisioning-criteria-cancel"
                                onClick={() => setEditModalOpen(false)}>Cancel
                            </button>
                            <button
                                onClick={handleEditSubmit}
                                className="create-provisioning-criteria-confirm"
                                disabled={!isFormValid() || isSubmitting}
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isChangePasswordModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className="create-modal-title">Change Password</h4>
                        <div className="create-provisioning-criteria-group">
                            <label className="create-provisioning-criteria-label">
                                Password <span>*</span>
                            </label>
                            <input
                                type="password"
                                placeholder={"password"}
                                className="staged-form-input"
                                value={passwordData.password}
                                onChange={(e) =>
                                    setPasswordData((prev) => ({ ...prev, password: e.target.value }))
                                }
                            />
                            {passwordData.password && (
                                <ul className="password-validations">
                                    <li
                                        className={
                                            passwordData.password.length >= 8 ? "valid" : "invalid"
                                        }
                                    >
                                        At least 8 characters
                                    </li>
                                    <li
                                        className={
                                            /[A-Z]/.test(passwordData.password) ? "valid" : "invalid"
                                        }
                                    >
                                        At least one uppercase letter
                                    </li>
                                    <li
                                        className={
                                            /[a-z]/.test(passwordData.password) ? "valid" : "invalid"
                                        }
                                    >
                                        At least one lowercase letter
                                    </li>
                                    <li
                                        className={
                                            /\d/.test(passwordData.password) ? "valid" : "invalid"
                                        }
                                    >
                                        At least one number
                                    </li>
                                    <li
                                        className={
                                            /[@$!%*?&]/.test(passwordData.password) ? "valid" : "invalid"
                                        }
                                    >
                                        At least one special character (@, $, !, %, *, ?, &)
                                    </li>
                                </ul>
                            )}
                        </div>
                        <div className="create-provisioning-criteria-group">
                            <label className="create-provisioning-criteria-label">
                                Confirm Password <span>*</span>
                            </label>
                            <input
                                type="password"
                                placeholder={"confirm password"}
                                className="staged-form-input"
                                value={passwordData.confirmPassword}
                                onChange={(e) =>
                                    setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                                }
                            />
                            {passwordData.password &&
                                validatePassword(passwordData.password) &&
                                passwordData.confirmPassword && (
                                    <p
                                        className={
                                            passwordData.password === passwordData.confirmPassword
                                                ? "match-message valid"
                                                : "match-message invalid"
                                        }
                                    >
                                        {passwordData.password === passwordData.confirmPassword
                                            ? "Passwords match"
                                            : "Passwords do not match"}
                                    </p>
                                )}
                        </div>
                        <div className="modal-actions">
                            <button
                                className="create-provisioning-criteria-cancel"
                                onClick={() => setChangePasswordModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="create-provisioning-criteria-confirm"
                                onClick={handlePasswordSubmit}
                                disabled={
                                    isSubmittingPassword ||
                                    !passwordData.password ||
                                    !passwordData.confirmPassword ||
                                    passwordData.password !== passwordData.confirmPassword ||
                                    !validatePassword(passwordData.password)
                                }
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

export default ViewUserDetails;
