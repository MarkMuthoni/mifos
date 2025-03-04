import React, { useState, useEffect, useContext } from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { API_CONFIG } from '../../../config';
import { useLoading } from '../../../context/LoadingContext';
import { AuthContext } from '../../../context/AuthContext';
import {NotificationContext} from "../../../context/NotificationContext";
import {format} from "date-fns";


const EditClientDetails = () => {
    const { clientId } = useParams();
    const [clientData, setClientData] = useState(null);
    const [originalData, setOriginalData] = useState(null);
    const [isDisabled, setIsDisabled] = useState(true);
    const [templateData, setTemplateData] = useState(null);
    const { startLoading, stopLoading } = useLoading();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const { showNotification } = useContext(NotificationContext);

    // Fetch Client Data and Template Data
    const fetchClientData = async () => {
        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                'Content-Type': 'application/json',
            };

            const [clientResponse, templateResponse] = await Promise.all([
                axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/clients/${clientId}`, { headers }),
                axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/clients/${clientId}?template=true&staffInSelectedOfficeOnly=true`, {
                    headers,
                }),
            ]);

            setClientData(clientResponse.data);
            setOriginalData(clientResponse.data);
            setTemplateData(templateResponse.data);
        } catch (error) {
            console.error('Error fetching client details:', error);
            showNotification('Error fetching client details!', 'error');
        } finally {
            stopLoading();
        }
    };

    const handleBreadcrumbNavigation = () => {
        navigate("/clients", {
            state: {
                clientId: clientId,
                clientName: clientData?.displayName || "Client Details",
                preventDuplicate: true,
            },
        });
    };

    useEffect(() => {
        fetchClientData();
    }, []);

    const handleInputChange = (field, value) => {
        setClientData((prevData) => {
            const updatedData = { ...prevData, [field]: value };

            if ((value === null || value === "") && !Object.hasOwn(originalData, field)) {
                delete updatedData[field];
            }

            return updatedData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                'Content-Type': 'application/json',
            };

            const formattedDateOfBirth = clientData.dateOfBirth ? format(new Date(clientData.dateOfBirth), 'dd MMMM yyyy') : null;

            const cleanedData = {
                firstname: clientData.firstname || "",
                lastname: clientData.lastname || "",
                middlename: clientData.middlename || "",
                externalId: clientData.externalId || "",
                isStaff: clientData.isStaff ?? false,
                staffId: clientData.staffId || null,
                activationDate: clientData.activationDate || "",
                dateOfBirth: formattedDateOfBirth,
                genderId: clientData.gender,
                mobileNo: clientData.mobileNo || "",
                emailAddress: clientData.emailAddress || "",
                clientTypeId: clientData.clientType || "",
                clientClassificationId: clientData.clientClassification || "",
                dateFormat: 'dd MMMM yyyy',
                locale: 'en',
            };

            await axios.put(`${API_CONFIG.proxy}/fineract-provider/api/v1/clients/${clientId}`, cleanedData, { headers });

            showNotification('Client details updated successfully!', 'success');
            navigate('/clients', {
                state: {
                    clientId: clientId,
                    clientName: clientData?.displayName || "Client Details",
                    preventDuplicate: true,
                },
            });
        } catch (error) {
            console.error('Error updating client details:', error);
            showNotification('Failed to update client details!', 'error');
        } finally {
            stopLoading();
        }
    };

    const convertBackendDateToDate = (dateArray) => {
        if (Array.isArray(dateArray) && dateArray.length === 3) {
            const [year, month, day] = dateArray;
            const date = new Date(year, month - 1, day);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
        return null;
    };

    const normalizeData = (data) => {
        return Object.fromEntries(
            Object.entries(data || {}).filter(([_, value]) => value != null)
        );
    };

    const deepEqual = (obj1, obj2) => {
        if (typeof obj1 !== "object" || typeof obj2 !== "object" || obj1 === null || obj2 === null) {
            return obj1 === obj2;
        }

        const normalized1 = normalizeData(obj1);
        const normalized2 = normalizeData(obj2);

        const keys1 = Object.keys(normalized1);
        const keys2 = Object.keys(normalized2);

        if (keys1.length !== keys2.length) return false;

        for (const key of keys1) {
            if (!keys2.includes(key) || !deepEqual(normalized1[key], normalized2[key])) {
                return false;
            }
        }

        return true;
    };

    useEffect(() => {
        if (clientData && originalData) {
            setIsDisabled(deepEqual(clientData, originalData));
        }
    }, [clientData, originalData]);

    if (!clientData || !templateData) {
        return null;
    }

    const { genderOptions, clientTypeOptions, clientClassificationOptions, staffOptions } = templateData;

    return (
        <div className="users-page-screen neighbor-element">
            <h2 className="users-page-head">
                <Link to="/dashboard" className="breadcrumb-link">Dashboard</Link>{' '}
                <span
                    className="breadcrumb-link"
                    onClick={handleBreadcrumbNavigation}
                >
                    . {' '} {clientData?.displayName || "Client Details"}
                </span>{' '}
                . Edit User Info
            </h2>

            {/*<hr/>*/}
            <div className="client-details-container">
                {/* Edit Client Form */}
                <form onSubmit={handleSubmit} className="staged-form-stage-content">
                    {/* Muted Fields */}
                    <div className="staged-form-row">
                        <div className="staged-form-field">
                            <label htmlFor="office">Office (View Only)</label>
                            <input
                                type="text"
                                id="office"
                                value={clientData.officeName || 'N/A'}
                                readOnly
                                className="staged-form-input"
                            />
                        </div>

                        <div className="staged-form-field">
                            <label htmlFor="legalForm">Legal Form (View Only)</label>
                            <input
                                type="text"
                                id="legalForm"
                                value={clientData.legalForm?.value || 'N/A'}
                                readOnly
                                className="staged-form-input"
                            />
                        </div>
                    </div>

                    <div className="staged-form-row">
                        <div className="staged-form-field">
                            <label htmlFor="accountNo">Account No. (View Only)</label>
                            <input
                                type="text"
                                id="accountNo"
                                value={clientData.accountNo || 'N/A'}
                                readOnly
                                className="staged-form-input"
                            />
                        </div>

                        <div className="staged-form-field">
                            <label htmlFor="externalId">External ID</label>
                            <input
                                type="text"
                                id="externalId"
                                value={clientData?.externalId || ''}
                                onChange={(e) => handleInputChange('externalId', e.target.value)}
                                className="staged-form-input"
                            />
                        </div>
                    </div>

                    {/* Editable Fields */}
                    <div className="staged-form-row">
                        <div className="staged-form-field">
                            <label htmlFor="firstname">First Name <span>*</span></label>
                            <input
                                type="text"
                                id="firstname"
                                value={clientData?.firstname || ''}
                                onChange={(e) => handleInputChange('firstname', e.target.value)}
                                required
                                className="staged-form-input"
                            />
                        </div>

                        <div className="staged-form-field">
                            <label htmlFor="middleName">Middle Name</label>
                            <input
                                type="text"
                                id="middleName"
                                value={clientData?.middlename || ''}
                                onChange={(e) => handleInputChange('middleName', e.target.value)}
                                className="staged-form-input"
                            />
                        </div>
                    </div>

                    <div className="staged-form-row">
                        <div className="staged-form-field">
                            <label htmlFor="lastname">Last Name <span>*</span></label>
                            <input
                                type="text"
                                id="lastname"
                                value={clientData?.lastname || ''}
                                onChange={(e) => handleInputChange('lastname', e.target.value)}
                                required
                                className="staged-form-input"
                            />
                        </div>

                        <div className="staged-form-field">
                            <label htmlFor="dateOfBirth">Date of Birth</label>
                            <DatePicker
                                id="dateOfBirth"
                                selected={clientData?.dateOfBirth ? new Date(clientData.dateOfBirth) : convertBackendDateToDate(clientData?.dateOfBirth)}
                                onChange={(date) =>
                                    handleInputChange('dateOfBirth', date
                                        ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0]
                                        : ""
                                    )
                                }
                                dateFormat="MMMM d, yyyy"
                                className="staged-form-input"
                                showPopperArrow={false}
                                showMonthDropdown
                                showYearDropdown
                                dropdownMode="select"
                                maxDate={new Date()}
                            />
                        </div>
                    </div>

                    <div className="staged-form-row">
                        <div className="staged-form-field">
                            <label htmlFor="gender">Gender</label>
                            <select
                                id="gender"
                                value={clientData?.gender?.id || clientData?.gender || ''}
                                onChange={(e) => handleInputChange('gender', e.target.value)}
                                className="staged-form-select"
                            >
                                <option value="">-- Select Gender --</option>
                                {genderOptions?.map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {option.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="staged-form-field">
                            <label htmlFor="staff">Staff</label>
                            <select
                                id="staff"
                                value={clientData?.staffId || ''}
                                onChange={(e) => handleInputChange('staffId', e.target.value)}
                                className="staged-form-select"
                            >
                                <option value="">-- Select Staff --</option>
                                {staffOptions?.map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {option.displayName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="staged-form-field">
                        <label htmlFor="isStaff">
                            <input
                                type="checkbox"
                                id="isStaff"
                                checked={clientData.isStaff || false}
                                onChange={(e) => handleInputChange('isStaff', e.target.checked)}
                                className="staged-form-checkbox"
                            />Is Staff?</label>
                    </div>

                    <div className="staged-form-row">
                        <div className="staged-form-field">
                            <label htmlFor="mobileNumber">Mobile No.</label>
                            <input
                                type="text"
                                id="mobileNumber"
                                value={clientData?.mobileNo || ''}
                                onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                                className="staged-form-input"
                            />
                        </div>

                        <div className="staged-form-field">
                            <label htmlFor="emailAddress">Email Address</label>
                            <input
                                type="email"
                                id="emailAddress"
                                value={clientData?.emailAddress || ''}
                                onChange={(e) => handleInputChange('emailAddress', e.target.value)}
                                className="staged-form-input"
                            />
                        </div>
                    </div>

                    <div className="staged-form-row">
                        <div className="staged-form-field">
                            <label htmlFor="clientType">Client Type</label>
                            <select
                                id="clientType"
                                value={clientData?.clientType?.id || clientData?.clientType || ''}
                                onChange={(e) => handleInputChange('clientType', e.target.value)}
                                className="staged-form-select"
                            >
                                <option value="">-- Select Client Type --</option>
                                {clientTypeOptions?.map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {option.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="staged-form-field">
                            <label htmlFor="clientClassification">Client Classification</label>
                            <select
                                id="clientClassification"
                                value={clientData?.clientClassification?.id || clientData?.clientClassification || ''}
                                onChange={(e) => handleInputChange('clientClassification', e.target.value)}
                                className="staged-form-select"
                            >
                                <option value="">-- Select Classification --</option>
                                {clientClassificationOptions?.map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {option.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="staged-form-row">
                        <div className="staged-form-field">
                            <label htmlFor="submittedOn">Submitted On (View Only)</label>
                            <DatePicker
                                id="submittedOn"
                                selected={clientData?.submittedOnDate
                                    ? new Date(clientData.submittedOnDate)
                                    : convertBackendDateToDate(clientData?.timeline?.submittedOnDate)}
                                onChange={(date) =>
                                    handleInputChange('submittedOnDate', date ? date.toISOString().split('T')[0] : "")
                                }
                                dateFormat="MMMM d, yyyy"
                                className="staged-form-input"
                                showPopperArrow={false}
                                readOnly
                                showMonthDropdown
                                showYearDropdown
                                dropdownMode="select"
                            />
                        </div>

                        <div className="staged-form-field">
                            <label htmlFor="activatedOn">Activated On (View Only)</label>
                            <DatePicker
                                id="activatedOn"
                                selected={clientData?.submittedOnDate
                                    ? new Date(clientData.submittedOnDate)
                                    : convertBackendDateToDate(clientData?.timeline?.submittedOnDate)}
                                onChange={(date) =>
                                    handleInputChange('activatedOnDate', date ? date.toISOString().split('T')[0] : "")
                                }
                                dateFormat="MMMM d, yyyy"
                                className="staged-form-input"
                                showPopperArrow={false}
                                readOnly
                                showMonthDropdown
                                showYearDropdown
                                dropdownMode="select"
                            />
                        </div>
                    </div>

                    <div className="staged-form-stage-buttons">
                        {/* Cancel Button */}
                        <button
                            type="button"
                            className="staged-form-button-previous"
                            onClick={() =>
                                navigate('/clients', {
                                    state: {
                                        clientId: clientId,
                                        clientName: clientData?.displayName || "Client Details",
                                    },
                                })
                            }
                        >
                            Cancel
                        </button>

                        {/* Save Changes Button */}
                        <button
                            type="submit"
                            className="staged-form-button-next"
                            disabled={isDisabled}
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditClientDetails;
