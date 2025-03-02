import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../../../context/AuthContext";
import { useLoading } from "../../../../../context/LoadingContext";
import { API_CONFIG } from "../../../../../config";
import "./CreateHoliday.css";

const CreateHoliday = () => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [repaymentType, setRepaymentType] = useState("");
    const [description, setDescription] = useState("");
    const [repaymentScheduledTo, setRepaymentScheduledTo] = useState("");
    const [offices, setOffices] = useState([]);
    const [selectedOffices, setSelectedOffices] = useState([]);
    const [repaymentTypes, setRepaymentTypes] = useState([]);

    useEffect(() => {
        fetchTemplateData();
    }, []);

    const fetchTemplateData = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/holidays/template`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                },
            });
            setRepaymentTypes(response.data || []);
            fetchOffices();
        } catch (error) {
            console.error("Error fetching repayment types:", error);
        }
    };

    const fetchOffices = async () => {
        try {
            const response = await axios.get(`/fineract-provider/api/v1/offices`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                },
            });
            setOffices(response.data || []);
        } catch (error) {
            console.error("Error fetching offices:", error);
        } finally {
            stopLoading();
        }
    };

    const handleOfficeSelection = (officeId) => {
        let updatedSelection = new Set(selectedOffices);

        if (updatedSelection.has(officeId)) {
            updatedSelection.delete(officeId);
            const childOffices = offices.filter((office) => office.parentId === officeId);
            childOffices.forEach((child) => updatedSelection.delete(child.id));
        } else {
            updatedSelection.add(officeId);
            const childOffices = offices.filter((office) => office.parentId === officeId);
            childOffices.forEach((child) => updatedSelection.add(child.id));
        }

        setSelectedOffices([...updatedSelection]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formatDateForPayload = (date) => {
            const parsedDate = new Date(date);
            return parsedDate.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
            });
        };

        const payload = {
            name,
            description,
            fromDate: formatDateForPayload(fromDate),
            toDate: formatDateForPayload(toDate),
            repaymentsRescheduledTo: repaymentType === "2" ? formatDateForPayload(repaymentScheduledTo) : null,
            reschedulingType: parseInt(repaymentType, 10),
            offices: selectedOffices.map((id) => ({ officeId: id })),
            dateFormat: "dd MMMM yyyy",
            locale: "en",
        };

        startLoading();
        try {
            const response = await axios.post(`/fineract-provider/api/v1/holidays`, payload, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });
            const holidayId = response.data.resourceId;
            navigate(`/holidays/view/${holidayId}`);
        } catch (error) {
            console.error("Error creating holiday:", error);
        } finally {
            stopLoading();
        }
    };

    const getDefaultDate = () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split("T")[0];
    };

    return (
        <div className="create-holiday-container">
            <form className="create-holiday-form" onSubmit={handleSubmit}>
                <h3 className="create-holiday-title">Create New Holiday</h3>
                <div className="create-holiday-group">
                    <label htmlFor="name" className="create-holiday-label">
                        Name <span className="create-holiday-required">*</span>
                    </label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter holiday name"
                        className="create-holiday-input"
                        required
                    />
                </div>
                <div className="create-holiday-row">
                    <div className="create-holiday-group">
                        <label htmlFor="fromDate" className="create-holiday-label">
                            From Date <span className="create-holiday-required">*</span>
                        </label>
                        <input
                            type="date"
                            id="fromDate"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            max={getDefaultDate()}
                            className="create-holiday-input"
                            required
                        />
                    </div>
                    <div className="create-holiday-group">
                        <label htmlFor="toDate" className="create-holiday-label">
                            To Date <span className="create-holiday-required">*</span>
                        </label>
                        <input
                            type="date"
                            id="toDate"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            max={getDefaultDate()}
                            className="create-holiday-input"
                            required
                        />
                    </div>
                </div>
                <div className="create-holiday-group">
                    <label htmlFor="repaymentType" className="create-holiday-label">
                        Repayment Scheduling Type <span className="create-holiday-required">*</span>
                    </label>
                    <select
                        id="repaymentType"
                        value={repaymentType}
                        onChange={(e) => setRepaymentType(e.target.value)}
                        className="create-holiday-select"
                        required
                    >
                        <option value="">Select Type</option>
                        {repaymentTypes.map((type) => (
                            <option key={type.id} value={type.id}>
                                {type.value}
                            </option>
                        ))}
                    </select>
                </div>
                {repaymentType === "2" && (
                    <div className="create-holiday-group">
                        <label htmlFor="repaymentScheduledTo" className="create-holiday-label">
                            Repayment Scheduled To <span className="create-holiday-required">*</span>
                        </label>
                        <input
                            type="date"
                            id="repaymentScheduledTo"
                            value={repaymentScheduledTo}
                            onChange={(e) => setRepaymentScheduledTo(e.target.value)}
                            max={getDefaultDate()}
                            className="create-holiday-input"
                            required
                        />
                    </div>
                )}
                <div className="create-holiday-group">
                    <label htmlFor="description" className="create-holiday-label">
                        Description
                    </label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter description"
                        className="create-holiday-textarea"
                    />
                </div>
                <div className="create-holiday-group">
                    <label className="create-holiday-label">Select Applicable Offices</label>
                    <div className="create-holiday-office-grid">
                        {offices.map((office) => (
                            <div key={office.id} className="create-holiday-office-checkbox">
                                <input
                                    type="checkbox"
                                    id={`office-${office.id}`}
                                    checked={selectedOffices.includes(office.id)}
                                    onChange={() => handleOfficeSelection(office.id)}
                                    className="create-holiday-checkbox"
                                />
                                <label htmlFor={`office-${office.id}`} className="create-holiday-checkbox-label">
                                    {office.name}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="create-holiday-actions">
                    <button type="submit" className="create-holiday-submit">
                        Create Holiday
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateHoliday;
