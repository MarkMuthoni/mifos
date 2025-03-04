import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API_CONFIG } from "../../../../../config";
import { useLoading } from "../../../../../context/LoadingContext";
import { AuthContext } from "../../../../../context/AuthContext";
import { Link } from "react-router-dom";
import "./SmsService.css";
import {NotificationContext} from "../../../../../context/NotificationContext";

const SmsService = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const [data, setData] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [formValues, setFormValues] = useState({});

    useEffect(() => {
        fetchSmsData();
    }, []);

    const fetchSmsData = async () => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/externalservice/SMS`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });
            setData(response.data || []);
        } catch (error) {
            console.error("Error fetching SMS service data:", error);
            showNotification("Error fetching SMS service data!", 'error');
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
            const payload = { ...formValues };
            const response = await axios.put(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/externalservice/SMS`,
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
            fetchSmsData();
            setEditMode(false);
        } catch (error) {
            console.error("Error updating SMS service data:", error);
            showNotification("Error updating SMS service data!", 'error');
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="sms-service-page neighbor-element">
            <nav className="sms-page-title">
                <Link to="/external-services" className="sms-breadcrumb-link">
                    External Services
                </Link>{" "}
                . SMS Service
            </nav>
            {!editMode ? (
                <>
                    <table className="sms-service-table">
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
                    <button className="sms-edit-button" onClick={handleEdit}>
                        Edit
                    </button>
                </>
            ) : (
                <form className="sms-edit-service-form" onSubmit={handleSubmit}>
                    {data.map((item, index) => (
                        <div key={index} className="sms-form-group">
                            <label htmlFor={item.name} className="sms-form-label">
                                {item.name.replace(/_/g, " ")}
                            </label>
                            <input
                                type="text"
                                id={item.name}
                                name={item.name}
                                className="sms-form-input"
                                value={formValues[item.name] || ""}
                                onChange={handleInputChange}
                            />
                        </div>
                    ))}
                    <div className="sms-form-actions">
                        <button type="submit" className="sms-submit-button">
                            Submit
                        </button>
                        <button type="button" className="sms-cancel-button" onClick={handleCancel}>
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default SmsService;
