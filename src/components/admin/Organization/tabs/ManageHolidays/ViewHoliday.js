import React, { useState, useEffect, useContext } from "react";
import {useParams, useNavigate, Link} from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../../../../context/AuthContext";
import { useLoading } from "../../../../../context/LoadingContext";
import { API_CONFIG } from "../../../../../config";
import "./ViewHoliday.css";
import {NotificationContext} from "../../../../../context/NotificationContext";

const ViewHoliday = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const navigate = useNavigate();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFields, setEditFields] = useState({
        name: "",
        description: "",
        fromDate: "",
        toDate: "",
        reschedulingType: "",
        reschedulingTypeOptions: [],
        repaymentsRescheduledTo: "",
    });

    const [holidayDetails, setHolidayDetails] = useState(null);

    const fetchEditTemplate = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/holidays/template`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });

            const reschedulingTypeOptions = response.data.map((type) => ({
                value: type.id,
                label: type.value,
            }));

            setEditFields({
                name: holidayDetails.name || "",
                description: holidayDetails.description || "",
                fromDate: holidayDetails.fromDate || [2023, 1, 1],
                toDate: holidayDetails.toDate || [2023, 12, 31],
                reschedulingType: holidayDetails.reschedulingType || "",
                reschedulingTypeOptions,
                repaymentsRescheduledTo:
                    holidayDetails.reschedulingType === 2
                        ? holidayDetails.repaymentsRescheduledTo || ""
                        : "",
            });
        } catch (error) {
            console.error("Error fetching edit template:", error);
        } finally {
            stopLoading();
        }
    };

    useEffect(() => {
        fetchHolidayDetails();
    }, []);

    const fetchHolidayDetails = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/holidays/${id}`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                },
            });
            setHolidayDetails(response.data);
        } catch (error) {
            console.error("Error fetching holiday details:", error);
        } finally {
            stopLoading();
        }
    };

    const handleAction = async (action) => {
        if (action === "activate") {
            const confirmActivate = window.confirm("Are you sure you want to activate this holiday?");
            if (confirmActivate) {
                try {
                    await axios.post(
                        `/fineract-provider/api/v1/holidays/${id}?command=activate`,
                        { command: "activate" },
                        {
                            headers: {
                                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                            },
                        }
                    );
                    fetchHolidayDetails();
                    showNotification("Holiday activated", 'info');
                } catch (error) {
                    console.error("Error activating holiday:", error);
                }
            }
        } else if (action === "edit") {
            setIsEditModalOpen(true);
            await fetchEditTemplate();
        } else if (action === "delete") {
            const confirmDelete = window.confirm("Are you sure you want to delete this holiday?");
            if (confirmDelete) {
                try {
                    await axios.delete(`/fineract-provider/api/v1/holidays/${id}`, {
                        headers: {
                            Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                            'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        },
                    });
                    navigate("/manage-holidays");
                    showNotification("Holiday deleted!", 'error');
                } catch (error) {
                    console.error("Error deleting holiday:", error);
                }
            }
        }
    };

    const formatDate = (dateArray) => {
        if (!dateArray || dateArray.length !== 3) return "";
        const [year, month, day] = dateArray;
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const handleEditSubmit = async () => {
        startLoading();

        try {
            const fromDateValid = Array.isArray(editFields.fromDate)
                ? new Date(editFields.fromDate[0], editFields.fromDate[1] - 1, editFields.fromDate[2] + 1).toISOString()
                : null;

            const toDateValid = Array.isArray(editFields.toDate)
                ? new Date(editFields.toDate[0], editFields.toDate[1] - 1, editFields.toDate[2] + 1).toISOString()
                : null;

            const repaymentsScheduledToValid =
                editFields.reschedulingType === "2" && Array.isArray(editFields.repaymentsRescheduledTo)
                ? new Date(
                    editFields.repaymentsRescheduledTo[0],
                    editFields.repaymentsRescheduledTo[1] - 1,
                    editFields.repaymentsRescheduledTo[2] + 1
                ).toISOString()
                : editFields.repaymentsRescheduledTo;

            await axios.put(
                `/fineract-provider/api/v1/holidays/${id}`,
                {
                    ...editFields,
                    dateFormat: "dd MMMM yyyy",
                    locale: "en",
                    fromDate: fromDateValid,
                    toDate: toDateValid,
                    repaymentsRescheduledTo: repaymentsScheduledToValid || undefined,
                },
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            fetchHolidayDetails();
            setIsEditModalOpen(false);
            showNotification("Holiday updated successfully!", 'info');
        } catch (error) {
            console.error("Error submitting edit:", error);
        } finally {
            stopLoading();
        }
    };


    if (!holidayDetails) {
        return <div className="view-holiday-loading">Ops! Couldn't fetch data!</div>;
    }

    return (
        <div className="view-holiday-container neighbor-element">
            <h2 className="page-heading">
                <Link to="/organization" className="breadcrumb-link">
                    Organization
                </Link>
                <Link to="/manage-holidays" className="breadcrumb-link">
                   . Manage Holidays
                </Link>  {" "}
                . View Holiday
            </h2>
            <table className="view-holiday-table">
                <tbody>
                <tr>
                    <td className="view-holiday-label">Name</td>
                    <td>{holidayDetails.name}</td>
                </tr>
                <tr>
                    <td className="view-holiday-label">Description</td>
                    <td>{holidayDetails.description || ""}</td>
                </tr>
                <tr>
                    <td className="view-holiday-label">From Date</td>
                    <td>{formatDate(holidayDetails.fromDate)}</td>
                </tr>
                <tr>
                    <td className="view-holiday-label">To Date</td>
                    <td>{formatDate(holidayDetails.toDate)}</td>
                </tr>
                <tr>
                    <td className="view-holiday-label">Repayment Scheduled To</td>
                    <td>
                        {holidayDetails.repaymentsRescheduledTo
                            ? formatDate(holidayDetails.repaymentsRescheduledTo)
                            : ""}
                    </td>
                </tr>
                <tr>
                    <td className="view-holiday-label">Status</td>
                    <td>{holidayDetails.status.value}</td>
                </tr>
                </tbody>
            </table>
            <div className="view-holiday-actions">
                <button onClick={() => handleAction("edit")} className="view-holiday-action">
                    Edit
                </button>
                <button onClick={() => handleAction("delete")} className="view-holiday-action">
                    Delete
                </button>
                {holidayDetails.status.value !== "Active" && (
                    <button onClick={() => handleAction("activate")} className="view-holiday-action">
                        Activate
                    </button>
                )}
            </div>
            {isEditModalOpen && (
                <div className="edit-modal-overlay">
                    <div className="edit-modal-content">
                        <h3 className="staged-form-title">Edit Holiday</h3>
                        <div className="staged-form-field">
                            <label>Name</label>
                            <input
                                type="text"
                                className="staged-form-input"
                                value={editFields.name}
                                onChange={(e) =>
                                    setEditFields({...editFields, name: e.target.value})
                                }
                            />
                        </div>
                        <div className="staged-form-field">
                            <label>Description</label>
                            <textarea
                                value={editFields.description}
                                className="staged-form-input"
                                onChange={(e) =>
                                    setEditFields({...editFields, description: e.target.value})
                                }
                            />
                        </div>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label>Repayment Scheduling Type</label>
                                <select
                                    value={editFields.reschedulingType}
                                    className="staged-form-select"
                                    onChange={(e) => {
                                        const selectedType = e.target.value;
                                        setEditFields({
                                            ...editFields,
                                            reschedulingType: selectedType,
                                            repaymentsRescheduledTo:
                                                selectedType === "2"
                                                    ? holidayDetails.repaymentsRescheduledTo || ""
                                                    : "",
                                        });
                                    }}
                                >
                                    <option value="">Select</option>
                                    {editFields.reschedulingTypeOptions &&
                                        editFields.reschedulingTypeOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                </select>
                            </div>
                            {editFields.reschedulingType === "2" && (
                                <div className="staged-form-field">
                                    <label>Repayment Scheduled To</label>
                                    <input
                                        type="date"
                                        className="staged-form-input"
                                        value={
                                            Array.isArray(editFields.repaymentsRescheduledTo)
                                                ? new Date(
                                                    editFields.repaymentsRescheduledTo[0],
                                                    editFields.repaymentsRescheduledTo[1] - 1,
                                                    editFields.repaymentsRescheduledTo[2] + 1
                                                )
                                                    .toISOString()
                                                    .split("T")[0]
                                                : ""
                                        }
                                        onChange={(e) =>
                                            setEditFields({
                                                ...editFields,
                                                repaymentsRescheduledTo: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            )}
                        </div>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label>From Date</label>
                                <input
                                    type="date"
                                    className="staged-form-input"
                                    value={
                                        Array.isArray(editFields.fromDate)
                                            ? new Date(editFields.fromDate[0], editFields.fromDate[1] - 1, editFields.fromDate[2] + 1).toISOString().split("T")[0]
                                            : ""
                                    }
                                    onChange={(e) =>
                                        setEditFields({...editFields, fromDate: e.target.value})
                                    }
                                />
                            </div>

                            <div className="staged-form-field">
                                <label>To Date</label>
                                <input
                                    type="date"
                                    className="staged-form-input"
                                    value={
                                        Array.isArray(editFields.toDate)
                                            ? new Date(editFields.toDate[0], editFields.toDate[1] - 1, editFields.toDate[2] + 1).toISOString().split("T")[0]
                                            : ""
                                    }
                                    onChange={(e) =>
                                        setEditFields({...editFields, toDate: e.target.value})
                                    }
                                />
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button onClick={() => setIsEditModalOpen(false)}
                                    className={"modal-cancel-button"}
                            >Cancel
                            </button>
                            <button
                                onClick={handleEditSubmit}
                                className={"modal-submit-button"}
                                disabled={
                                    editFields.name === holidayDetails.name &&
                                    editFields.description === holidayDetails.description &&
                                    JSON.stringify(editFields.fromDate) === JSON.stringify(holidayDetails.fromDate) &&
                                    JSON.stringify(editFields.toDate) === JSON.stringify(holidayDetails.toDate) &&
                                    editFields.reschedulingType === holidayDetails.reschedulingType
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

export default ViewHoliday;
