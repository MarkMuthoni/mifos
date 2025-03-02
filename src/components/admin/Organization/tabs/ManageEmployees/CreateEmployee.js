import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../../../../context/AuthContext";
import { useLoading } from "../../../../../context/LoadingContext";
import { API_CONFIG } from "../../../../../config";
import {NotificationContext} from "../../../../../context/NotificationContext";

const CreateEmployee = ({ onFormSubmitSuccess }) => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();

    const [offices, setOffices] = useState([]);
    const [officeId, setOfficeId] = useState("");
    const [firstname, setFirstname] = useState("");
    const [lastname, setLastname] = useState("");
    const [isLoanOfficer, setIsLoanOfficer] = useState(false);
    const [mobileNo, setMobileNo] = useState("");
    const [joiningDate, setJoiningDate] = useState("");

    useEffect(() => {
        fetchOffices();
    }, []);

    const fetchOffices = async () => {
        startLoading();
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

    const getDefaultDate = () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split("T")[0];
    };

    const formatDateForPayload = (date) => {
        const parsedDate = new Date(date);
        return parsedDate.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            officeId: parseInt(officeId, 10),
            firstname,
            lastname,
            isLoanOfficer,
            mobileNo: mobileNo || null,
            joiningDate: formatDateForPayload(joiningDate),
            dateFormat: "dd MMMM yyyy",
            locale: "en",
        };

        startLoading();
        try {
            await axios.post(`/fineract-provider/api/v1/staff`, payload, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });
            if (onFormSubmitSuccess) {
                onFormSubmitSuccess();
            }
            showNotification("Employee created successfully!", 'success');
        } catch (error) {
            console.error("Error creating employee:", error);
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="create-holiday-container">
            <form className="create-holiday-form" onSubmit={handleSubmit}>
                <h3 className="create-holiday-title">Create Employee</h3>
                <div className="create-holiday-group">
                    <label htmlFor="office" className="create-holiday-label">
                        Office <span className="create-holiday-required">*</span>
                    </label>
                    <select
                        id="office"
                        value={officeId}
                        onChange={(e) => setOfficeId(e.target.value)}
                        className="create-holiday-select"
                        required
                    >
                        <option value="">Select Office</option>
                        {offices.map((office) => (
                            <option key={office.id} value={office.id}>
                                {office.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="create-holiday-row">
                    <div className="create-holiday-group">
                        <label htmlFor="firstname" className="create-holiday-label">
                            First Name <span className="create-holiday-required">*</span>
                        </label>
                        <input
                            type="text"
                            id="firstname"
                            value={firstname}
                            onChange={(e) => setFirstname(e.target.value)}
                            placeholder="Enter first name"
                            className="create-holiday-input"
                            required
                        />
                    </div>
                    <div className="create-holiday-group">
                        <label htmlFor="lastname" className="create-holiday-label">
                            Last Name <span className="create-holiday-required">*</span>
                        </label>
                        <input
                            type="text"
                            id="lastname"
                            value={lastname}
                            onChange={(e) => setLastname(e.target.value)}
                            placeholder="Enter last name"
                            className="create-holiday-input"
                            required
                        />
                    </div>
                </div>

                <div className="create-holiday-group">
                    <label htmlFor="isLoanOfficer" className="create-holiday-label">
                        <input
                            type="checkbox"
                            id="isLoanOfficer"
                            checked={isLoanOfficer}
                            onChange={(e) => setIsLoanOfficer(e.target.checked)}
                            className="create-holiday-checkbox"
                        /> {"   "}
                        Is Loan Officer
                    </label>
                </div>
                <div className="create-holiday-row">
                    <div className="create-holiday-group">
                        <label htmlFor="mobileNo" className="create-holiday-label">
                            Mobile Number for SMS
                        </label>
                        <input
                            type="tel"
                            id="mobileNo"
                            value={mobileNo}
                            onChange={(e) => setMobileNo(e.target.value)}
                            className="create-holiday-input"
                            placeholder="Enter mobile number"
                        />
                    </div>
                    <div className="create-holiday-group">
                        <label htmlFor="joiningDate" className="create-holiday-label">
                            Joining Date <span className="create-holiday-required">*</span>
                        </label>
                        <input
                            type="date"
                            id="joiningDate"
                            value={joiningDate}
                            onChange={(e) => setJoiningDate(e.target.value)}
                            max={getDefaultDate()}
                            className="create-holiday-input"
                            required
                        />
                    </div>
                </div>
                    <div className="create-holiday-actions">
                        <button type="submit" className="create-holiday-submit">
                            Create Employee
                        </button>
                    </div>
            </form>
        </div>
);
};

export default CreateEmployee;
