import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API_CONFIG } from "../../../../../config";
import { useLoading } from "../../../../../context/LoadingContext";
import { AuthContext } from "../../../../../context/AuthContext";
import "./AmazonS3Service.css";
import {Link} from "react-router-dom";
import {NotificationContext} from "../../../../../context/NotificationContext";

const AmazonS3Service = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const [data, setData] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [formValues, setFormValues] = useState({});
    const [submitError, setSubmitError] = useState("");

    useEffect(() => {
        fetchS3Data();
    }, []);

    const fetchS3Data = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/externalservice/S3`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });
            setData(response.data || []);
        } catch (error) {
            console.error("Error fetching S3 data:", error);
            showNotification("Error fetching S3 data!", 'error');
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
        setSubmitError("");
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError("");
        startLoading();
        try {
            await axios.put(
                `/fineract-provider/api/v1/externalservice/S3`,
                formValues,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            showNotification("Submitted successfully!:", 'success');
            setEditMode(false);
            fetchS3Data();
        } catch (error) {
            console.error("Error updating S3 data:", error);
            showNotification("Failed to submit the form. Please try again!", 'error');
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="amazon-s3-service-page neighbor-element">
            <nav className="page-title">
                <Link to="/external-services" className="breadcrumb-link">External Services .</Link> Amazon S3 Service
            </nav>
            {!editMode ? (
                <>
                    <table className="service-table">
                        <thead>
                        <tr>
                            <th>Name</th>
                            <th>Value</th>
                        </tr>
                        </thead>
                        <tbody>
                        {data.length > 0 ? (
                            data.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.name.replace(/_/g, " ")}</td>
                                    <td>{item.value || ""}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="2" className="no-data">
                                    No S3 configurations available
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                    <button className="edit-button" onClick={handleEdit}>
                        Edit
                    </button>
                </>
            ) : (
                <form className="edit-service-form" onSubmit={handleSubmit}>
                    {data.map((item, index) => (
                        <div key={index} className="form-group">
                            <label htmlFor={item.name}>{item.name.replace(/_/g, " ")}</label>
                            <input
                                type="text"
                                id={item.name}
                                name={item.name}
                                value={formValues[item.name] || ""}
                                onChange={handleInputChange}
                                placeholder={`Enter ${item.name.replace(/_/g, " ")}`}
                            />
                        </div>
                    ))}
                    {submitError && <p className="error-message">{submitError}</p>}
                    <div className="form-actions">
                        <button type="submit" className="submit-button">
                            Submit
                        </button>
                        <button type="button" className="cancel-button" onClick={handleCancel}>
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default AmazonS3Service;
