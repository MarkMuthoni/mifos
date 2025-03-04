import React, {useState, useEffect, useContext} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {AuthContext} from "../../../context/AuthContext";
import {useLoading} from "../../../context/LoadingContext";
import {API_CONFIG} from "../../../config";
import DatePicker from "react-datepicker";
import {NotificationContext} from "../../../context/NotificationContext";

const CreateStandingInstructions = () => {
    const navigate = useNavigate();
    const { clientId } = useParams();
    const [clientData, setClientData] = useState(null);
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
    const [standingInstructionData, setStandingInstructionData] = useState(null);
    const [formFields, setFormFields] = useState({
        name: '',
        applicant: '',
        type: '',
        priority: '',
        status: '',
        fromAccountType: '',
        fromAccount: '',
        toOffice: '',
        beneficiary: '',
        toAccountType: '',
        toAccount: '',
        standingInstructionType: '',
        amount: '',
        validityFrom: '',
        validityTo: '',
        recurrenceType: '',
        interval: '',
        recurrenceFrequency: '',
        onMonthDay: '',
    });
    const { showNotification } = useContext(NotificationContext);

    useEffect(() => {
        const fetchClientData = async () => {
            startLoading();
            try {
                const headers = {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                };

                const response = await axios.get(
                    `${API_CONFIG.proxy}/fineract-provider/api/v1/clients/${clientId}`,
                    { headers }
                );
                setClientData(response.data);

                setFormFields((prevState) => ({
                    ...prevState,
                    applicant: response.data.displayName,
                }));
            } catch (error) {
                console.error('Error fetching client data:', error);
            } finally {
                stopLoading();
            }
        };

        fetchClientData();
    }, []);

    useEffect(() => {
        fetchStandingInstructionData();
    }, []);

    const fetchStandingInstructionData = async () => {
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
            };

            const response = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/standinginstructions/template?fromAccountType=2&fromClientId=${clientId}&fromOfficeId=${user.officeId}`,
                { headers }
            );

            setStandingInstructionData(response.data);
        } catch (error) {
            console.error('Error fetching standing instruction data:', error);
        }
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormFields((prevState) => ({ ...prevState, [id]: value }));
    };

    const handleDateChange = (field, value) => {
        setFormFields((prevState) => ({ ...prevState, [field]: value }));
    };

    const handleSubmit = async () => {
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                'Content-Type': 'application/json',
            };

            await axios.post(`${API_CONFIG.proxy}/fineract-provider/api/v1/standinginstructions`, formFields, { headers });
            navigate("/clients", {
                state: {
                    clientId: clientId,
                    clientName: clientData?.displayName || "Client Details",
                    preventDuplicate: true,
                },
            });
            showNotification("Standing Instructions submitted!", 'success');
        } catch (error) {
            console.error('Error creating standing instructions:', error);
            showNotification('Error creating standing instructions!', 'error');
        }
    };

    useEffect(() => {
        const requiredFields = [
            "name",
            "type",
            "priority",
            "status",
            "fromAccountType",
            "fromAccount",
            "destination",
            "toOffice",
            "beneficiary",
            "toAccountType",
            "toAccount",
            "standingInstructionType",
            "amount",
            "validityFrom",
            "validityTo",
            "recurrenceType",
            "interval",
            "recurrenceFrequency",
            "onMonthDay",
        ];

        const isFormValid = requiredFields.every((field) => formFields[field]);
        setIsSubmitDisabled(!isFormValid);
    }, [formFields]);


    const handleBreadcrumbNavigation = () => {
        navigate("/clients", {
            state: {
                clientId: clientId,
                clientName: clientData?.displayName || "Client Details",
                preventDuplicate: true,
            },
        });
    };

    return (
        <div className="users-page-screen neighbor-element">
            <h2 className="users-page-head">
                <Link to="/dashboard" className="breadcrumb-link">Dashboard</Link>{' '}
                <span
                    className="breadcrumb-link"
                    onClick={handleBreadcrumbNavigation}
                >
                    . {clientData?.displayName || "Client Details"}
                </span>{' '}
                . Create Standing Instructions
            </h2>
            <div className="staged-form-stage-content">
                <div className="staged-form-row">
                    <div className="staged-form-field">
                        <label htmlFor="name">Name <span>*</span></label>
                        <input
                            id="name"
                            type="text"
                            value={formFields.name}
                            onChange={handleInputChange}
                            className="staged-form-input"
                            placeholder="Enter Name"
                            required
                        />
                    </div>
                    <div className="staged-form-field">
                        <label htmlFor="applicant">Applicant (read-only)</label>
                        <input
                            id="applicant"
                            type="text"
                            value={formFields.applicant}
                            className="staged-form-input"
                            readOnly
                        />
                    </div>
                </div>

                <div className="staged-form-row">
                    <div className="staged-form-field">
                        <label htmlFor="type">Type <span>*</span></label>
                        <select
                            id="type"
                            value={formFields.type}
                            onChange={handleInputChange}
                            className="staged-form-select"
                            required
                        >
                            <option value="">-- Select Type --</option>
                            {standingInstructionData?.instructionTypeOptions?.map((option) => (
                                <option key={option.id} value={option.id}>{option.value}</option>
                            ))}
                        </select>
                    </div>
                    <div className="staged-form-field">
                        <label htmlFor="priority">Priority <span>*</span></label>
                        <select
                            id="priority"
                            value={formFields.priority}
                            onChange={handleInputChange}
                            className="staged-form-select"
                            required
                        >
                            <option value="">-- Select Priority --</option>
                            {standingInstructionData?.priorityOptions?.map((option) => (
                                <option key={option.id} value={option.id}>{option.value}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="staged-form-row">
                    <div className="staged-form-field">
                        <label htmlFor="status">Status <span>*</span></label>
                        <select
                            id="status"
                            value={formFields.status}
                            onChange={handleInputChange}
                            className="staged-form-select"
                            required
                        >
                            <option value="">-- Select Status --</option>
                            {standingInstructionData?.statusOptions?.map((option) => (
                                <option key={option.id} value={option.id}>{option.value}</option>
                            ))}
                        </select>
                    </div>
                    <div className="staged-form-field">
                        <label htmlFor="fromAccountType">From Account Type <span>*</span></label>
                        <select
                            id="fromAccountType"
                            value={formFields.fromAccountType}
                            onChange={handleInputChange}
                            className="staged-form-select"
                            required
                        >
                            <option value="">-- Select From Account Type --</option>
                            {standingInstructionData?.fromAccountTypeOptions?.map((option) => (
                                <option key={option.id} value={option.id}>{option.value}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="staged-form-row">
                    <div className="staged-form-field">
                        <label htmlFor="fromAccount">From Account <span>*</span></label>
                        <select
                            id="fromAccount"
                            value={formFields.fromAccount}
                            onChange={handleInputChange}
                            className="staged-form-select"
                            required
                        >
                            <option value="">-- Select From Account --</option>
                            {standingInstructionData?.fromAccountOptions?.map((option) => (
                                <option key={option.id} value={option.id}>
                                    {`${option.productName} - ${option.accountNo}`}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="staged-form-field">
                        <label htmlFor="destination">Destination <span>*</span></label>
                        <select
                            id="destination"
                            value={formFields.destination}
                            onChange={handleInputChange}
                            className="staged-form-select"
                            required
                        >
                            <option value="">-- Select Destination --</option>
                            <option value="ownAccount">Own Account</option>
                            <option value="withinBank">Within Bank</option>
                        </select>
                    </div>

                </div>

                <div className="staged-form-row">
                    <div className="staged-form-field">
                        <label htmlFor="toOffice">To Office <span>*</span></label>
                        <select
                            id="toOffice"
                            value={formFields.toOffice}
                            onChange={handleInputChange}
                            className="staged-form-select"
                            required
                            disabled={!standingInstructionData}
                        >
                            <option value="">-- Select To Office --</option>
                            {standingInstructionData?.toOfficeOptions?.map((option) => (
                                <option key={option.id} value={option.id}>{option.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="staged-form-field">
                        <label htmlFor="beneficiary">Beneficiary <span>*</span></label>
                        <select
                            id="beneficiary"
                            value={formFields.beneficiary}
                            onChange={handleInputChange}
                            className="staged-form-select"
                            required
                        >
                            <option value="">-- Select Beneficiary --</option>
                            {standingInstructionData?.fromClientOptions?.map((option) => (
                                <option key={option.id} value={option.id}>{option.displayName}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="staged-form-row">
                    <div className="staged-form-field">
                        <label htmlFor="toAccountType">To Account Type <span>*</span></label>
                        <select
                            id="toAccountType"
                            value={formFields.toAccountType}
                            onChange={handleInputChange}
                            className="staged-form-select"
                            required
                        >
                            <option value="">-- Select To Account Type --</option>
                            {standingInstructionData?.toAccountTypeOptions?.map((option) => (
                                <option key={option.id} value={option.id}>{option.value}</option>
                            ))}
                        </select>
                    </div>
                    <div className="staged-form-field">
                        <label htmlFor="toAccount">To Account <span>*</span></label>
                        <select
                            id="toAccount"
                            value={formFields.toAccount}
                            onChange={handleInputChange}
                            className="staged-form-select"
                            required
                            disabled={!standingInstructionData}
                        >
                            <option value="">-- Select To Account --</option>
                            {standingInstructionData?.fromAccountOptions?.map((option) => (
                                <option key={option.id} value={option.id}>{option.accountNo}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="staged-form-row">
                    <div className="staged-form-field">
                        <label htmlFor="standingInstructionType">Standing Instruction Type <span>*</span></label>
                        <select
                            id="standingInstructionType"
                            value={formFields.standingInstructionType}
                            onChange={handleInputChange}
                            className="staged-form-select"
                            required
                        >
                            <option value="">-- Select Instruction Type --</option>
                            {standingInstructionData?.instructionTypeOptions?.map((option) => (
                                <option key={option.id} value={option.id}>{option.value}</option>
                            ))}
                        </select>
                    </div>
                    <div className="staged-form-field">
                        <label htmlFor="amount">Amount <span>*</span></label>
                        <input
                            id="amount"
                            type="number"
                            value={formFields.amount}
                            onChange={handleInputChange}
                            className="staged-form-input"
                            placeholder="Enter Amount"
                            required
                        />
                    </div>
                </div>

                <div className="staged-form-row">
                    <div className="staged-form-field">
                        <label htmlFor="validityFrom">Validity From <span>*</span></label>
                        <DatePicker
                            id="validityFrom"
                            selected={formFields.validityFrom}
                            onChange={(date) => handleDateChange("validityFrom", date)}
                            className="staged-form-input"
                            placeholderText="Select Start Date"
                            dateFormat="dd MMMM yyyy"
                            required
                            showMonthDropdown
                            showYearDropdown
                            dropdownMode="select"
                        />
                    </div>
                    <div className="staged-form-field">
                        <label htmlFor="validityTo">Validity To <span>*</span></label>
                        <DatePicker
                            id="validityTo"
                            selected={formFields.validityTo}
                            onChange={(date) => handleDateChange("validityTo", date)}
                            className="staged-form-input"
                            placeholderText="Select End Date"
                            dateFormat="dd MMMM yyyy"
                            required
                            showMonthDropdown
                            showYearDropdown
                            dropdownMode="select"
                        />
                    </div>
                </div>

                <div className="staged-form-row">
                    <div className="staged-form-field">
                        <label htmlFor="recurrenceType">Recurrence Type <span>*</span></label>
                        <select
                            id="recurrenceType"
                            value={formFields.recurrenceType}
                            onChange={handleInputChange}
                            className="staged-form-select"
                            required
                        >
                            <option value="">-- Select Recurrence Type --</option>
                            {standingInstructionData?.recurrenceTypeOptions?.map((option) => (
                                <option key={option.id} value={option.id}>{option.value}</option>
                            ))}
                        </select>
                    </div>
                    <div className="staged-form-field">
                        <label htmlFor="interval">Interval <span>*</span></label>
                        <input
                            id="interval"
                            type="number"
                            value={formFields.interval}
                            onChange={handleInputChange}
                            className="staged-form-input"
                            placeholder="Enter Interval"
                            required
                        />
                    </div>
                </div>

                <div className="staged-form-row">
                    <div className="staged-form-field">
                        <label htmlFor="recurrenceFrequency">Recurrence Frequency <span>*</span></label>
                        <select
                            id="recurrenceFrequency"
                            value={formFields.recurrenceFrequency}
                            onChange={handleInputChange}
                            className="staged-form-select"
                            required
                        >
                            <option value="">-- Select Frequency --</option>
                            {standingInstructionData?.recurrenceFrequencyOptions?.map((option) => (
                                <option key={option.id} value={option.id}>{option.value}</option>
                            ))}
                        </select>
                    </div>
                    <div className="staged-form-field">
                        <label htmlFor="onMonthDay">On Month Day <span>*</span></label>
                        <DatePicker
                            id="onMonthDay"
                            selected={formFields.onMonthDay}
                            onChange={(date) => handleDateChange("onMonthDay", date)}
                            className="staged-form-input"
                            placeholderText="Select Day"
                            dateFormat="dd MMMM yyyy"
                            required
                            showMonthDropdown
                            showYearDropdown
                            dropdownMode="select"
                        />
                    </div>
                </div>

                <div className="staged-form-stage-buttons">
                    <button
                        className="staged-form-button-previous"
                        onClick={handleBreadcrumbNavigation}
                    >
                        Cancel
                    </button>
                    <button
                        className="staged-form-button-next"
                        onClick={handleSubmit}
                        disabled={isSubmitDisabled}
                    >
                        Submit
                    </button>
                </div>

            </div>
        </div>
    );
};

export default CreateStandingInstructions;
