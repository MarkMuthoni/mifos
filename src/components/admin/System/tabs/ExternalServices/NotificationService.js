import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API_CONFIG } from "../../../../../config";
import { useLoading } from "../../../../../context/LoadingContext";
import { AuthContext } from "../../../../../context/AuthContext";
import { Link } from "react-router-dom";
import "./NotificationService.css";
import {NotificationContext} from "../../../../../context/NotificationContext";

const NotificationService = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const [data, setData] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [formValues, setFormValues] = useState({});

    useEffect(() => {
        fetchNotificationData();
    }, []);

    const fetchNotificationData = async () => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/externalservice/NOTIFICATION`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });
            setData(response.data || []);
        } catch (error) {
            console.error("Error fetching notification service data:", error);
            showNotification("Error fetching notification service data:", 'error');
        } finally {
            stopLoading();
        }
    };

    const handleEdit = () => {
        setEditMode(true);
        const initialValues = data.reduce((acc, item) => {
            acc[item.name] = item.value || "";
            return acc;
        }, {});
        setFormValues(initialValues);
    };

    const handleCancel = () => {
        setEditMode(false);
        setFormValues({});
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        startLoading();
        try {
            const response = await axios.put(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/externalservice/NOTIFICATION`,
                formValues,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            showNotification("Updated successfully!", 'success');
            fetchNotificationData();
            setEditMode(false);
        } catch (error) {
            console.error("Error updating notification service data:", error);
            showNotification("Error updating notification service data!", 'error');
        } finally {
            stopLoading();
        }
    };

    const obfuscateServerKey = (key) => {
        if (!key || key.length < 4) return key;
        return `${key.slice(0, 2)}************${key.slice(-2)}`;
    };

    return (
        <div className="notification-service-page neighbor-element">
            <nav className="notification-page-title">
                <Link to="/external-services" className="notification-breadcrumb-link">
                    External Services
                </Link>{" "}
                . Notification Service
            </nav>
            {!editMode ? (
                <>
                    <table className="notification-service-table">
                        <thead>
                        <tr>
                            <th>Name</th>
                            <th>Value</th>
                        </tr>
                        </thead>
                        <tbody>
                        {data.map((item, index) => (
                            <tr key={index}>
                                <td>{item.name.replace(/_/g, " ")}</td>
                                <td>
                                    {item.name === "server_key"
                                        ? obfuscateServerKey(item.value)
                                        : item.value || "N/A"}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    <button className="notification-edit-button" onClick={handleEdit}>
                        Edit
                    </button>
                </>
            ) : (
                <form className="notification-edit-service-form" onSubmit={handleSubmit}>
                    {data.map((item, index) => (
                        <div key={index} className="notification-form-group">
                            <label htmlFor={item.name} className="notification-form-label">
                                {item.name.replace(/_/g, " ")}
                            </label>
                            <input
                                type="text"
                                id={item.name}
                                name={item.name}
                                className="notification-form-input"
                                value={formValues[item.name] || ""}
                                onChange={handleInputChange}
                            />
                        </div>
                    ))}
                    <div className="notification-form-actions">
                        <button type="submit" className="notification-submit-button">
                            Submit
                        </button>
                        <button
                            type="button"
                            className="notification-cancel-button"
                            onClick={handleCancel}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default NotificationService;
