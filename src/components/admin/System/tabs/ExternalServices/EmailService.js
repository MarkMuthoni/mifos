import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API_CONFIG } from "../../../../../config";
import { useLoading } from "../../../../../context/LoadingContext";
import { AuthContext } from "../../../../../context/AuthContext";
import { Link } from "react-router-dom";
import "./EmailService.css";
import {NotificationContext} from "../../../../../context/NotificationContext";

const EmailService = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const [data, setData] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [formValues, setFormValues] = useState({});

    useEffect(() => {
        fetchEmailData();
    }, []);

    const fetchEmailData = async () => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/externalservice/SMTP`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });
            setData(response.data || []);
        } catch (error) {
            console.error("Error fetching email service data:", error);
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
        const { name, value, type, checked } = e.target;
        setFormValues((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        startLoading();
        try {
            const payload = {
                ...formValues,
                useTLS: formValues.useTLS === true || formValues.useTLS === "true",
            };

            const response = await axios.put(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/externalservice/SMTP`,
                payload,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            showNotification("Updated successfully!", 'success');
            fetchEmailData();
            setEditMode(false);
        } catch (error) {
            console.error("Error updating email service data:", error);
            showNotification("Error updating email service data!", 'error');
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="email-service-page neighbor-element">
            <nav className="email-page-title">
                <Link to="/external-services" className="email-breadcrumb-link">
                    External Services
                </Link>{" "}
                . Email Service
            </nav>
            {!editMode ? (
                <>
                    <table className="email-service-table">
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
                                <td>{item.value || ""}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    <button className="email-edit-button" onClick={handleEdit}>
                        Edit
                    </button>
                </>
            ) : (
                <form className="email-edit-service-form" onSubmit={handleSubmit}>
                    {data.map((item, index) => (
                        <div key={index} className="email-form-group">
                            <label htmlFor={item.name} className="email-form-label">
                                {item.name.replace(/_/g, " ")}
                            </label>
                            {item.name === "useTLS" ? (
                                <input
                                    type="checkbox"
                                    id={item.name}
                                    name={item.name}
                                    className="email-checkbox-input"
                                    checked={formValues[item.name] === true || formValues[item.name] === "true"}
                                    onChange={handleInputChange}
                                />
                            ) : item.name === "password" ? (
                                <input
                                    type="password"
                                    id={item.name}
                                    name={item.name}
                                    className="email-form-input"
                                    value={formValues[item.name] || ""}
                                    onChange={handleInputChange}
                                />
                            ) : (
                                <input
                                    type="text"
                                    id={item.name}
                                    name={item.name}
                                    className="email-form-input"
                                    value={formValues[item.name] || ""}
                                    onChange={handleInputChange}
                                />
                            )}
                        </div>
                    ))}
                    <div className="email-form-actions">
                        <button type="submit" className="email-submit-button">
                            Submit
                        </button>
                        <button type="button" className="email-cancel-button" onClick={handleCancel}>
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default EmailService;
