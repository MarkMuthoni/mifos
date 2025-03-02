import React, {useContext, useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import './AddGroup.css';
import { useLoading } from '../../../context/LoadingContext';
import axios from 'axios';
import { API_CONFIG } from '../../../config';
import {AuthContext} from "../../../context/AuthContext";
import DatePicker from "react-datepicker";
import Select from "react-select"
import { format } from 'date-fns';

const AddGroupForm = () => {
    const [name, setName] = useState("");
    const [isActive, setIsActive] = useState(false);
    const [clients, setClients] = useState([]);
    const [addedClients, setAddedClients] = useState([]);
    const [externalId, setExternalId] = useState("");
    const [submittedOn, setSubmittedOn] = useState(new Date().toISOString().split("T")[0]);
    const [offices, setOffices] = useState([]);
    const [staffs, setStaffs] = useState([]);
    const [office, setOffice] = useState("");
    const [staff, setStaff] = useState("");
    const [activatedOn, setActivatedOn] = useState(null);

    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const { startLoading, stopLoading } = useLoading();

    useEffect(() => {
        const fetchData = async () => {
            startLoading();

            try {
                const headers = {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                };

                const officeResponse = await axios.get(`/fineract-provider/api/v1/offices`, { headers });
                setOffices(officeResponse.data);

                const clientResponse = await axios.get(`/fineract-provider/api/v1/clients`, { headers });
                setClients(clientResponse.data.pageItems || []);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                stopLoading();
            }
        };

        fetchData().then();
        // eslint-disable-next-line
    }, []);

    const isFormComplete = office && name && staff && (!isActive || (isActive && activatedOn));

    const handleSubmit = async (e) => {
        e.preventDefault();
        startLoading();

        try {
            const formattedActivationDate = isActive && activatedOn
                ? format(new Date(activatedOn), "dd MMMM yyyy")
                : undefined;

            const formattedSubmittedOnDate = submittedOn
                ? format(new Date(submittedOn), "dd MMMM yyyy")
                : undefined;

            const payload = {
                name,
                officeId: parseInt(office),
                submittedOnDate: formattedSubmittedOnDate,
                staffId: parseInt(staff),
                externalId: externalId || undefined,
                active: isActive,
                activationDate: formattedActivationDate,
                clientMembers: addedClients.map(client => ({ id: client.value })),
                dateFormat: "dd MMMM yyyy",
                locale: "en",
            };

            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                'Content-Type': 'application/json',
            };

            const response = await axios.post(`/fineract-provider/api/v1/groups`, payload, { headers });

            const groupId = response.data.groupId;
            navigate('/groups', {
                state: {
                    groupId: groupId,
                    groupName: name || "Group Details",
                    preventDuplicate: true,
                },
            });
        } catch (error) {
            console.error('Error creating group:', error);
        } finally {
            stopLoading();
        }
    };

    const handleOfficeChange = async (e) => {
        const selectedOfficeId = e.target.value;
        setOffice(selectedOfficeId);
        setStaff('');
        setStaffs([]);

        if (selectedOfficeId) {
            try {
                const headers = {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                };

                const response = await axios.get(
                    `/fineract-provider/api/v1/groups/template?officeId=${selectedOfficeId}&staffInSelectedOfficeOnly=true`,
                    { headers }
                );
                setStaffs(response.data.staffOptions || []);
            } catch (error) {
                console.error('Error fetching staff for selected office:', error);
            }
        }
    };


    const handleAddClient = (selectedOption) => {
        const clientId = selectedOption.value;
        const client = clients.find((c) => c.id === clientId);

        if (client && !addedClients.some((c) => c.id === clientId)) {
            setAddedClients([...addedClients, client]);
        }
    };

    const handleRemoveClient = (index) => {
        setAddedClients(addedClients.filter((_, i) => i !== index));
    };

    return (
        <div className="staged-form-add-client">
            <form className="staged-form-stage-content">
                <div className="staged-form-row">
                    <div className="staged-form-field">
                        <label htmlFor="office">Office *</label>
                        <select
                            id="office"
                            value={office}
                            onChange={handleOfficeChange}
                            className="staged-form-select"
                            required
                        >
                            <option value="">-- Select Office --</option>
                            {offices.map((office) => (
                                <option key={office.id} value={office.id}>
                                    {office.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="staged-form-field">
                        <label htmlFor="staff">Staff *</label>
                        <select
                            id="staff"
                            value={staff}
                            onChange={(e) => setStaff(e.target.value)}
                            className="staged-form-select"
                            disabled={!office || staffs.length === 0}
                            required
                        >
                            <option value="">-- Select Staff --</option>
                            {staffs.map((staffOption) => (
                                <option key={staffOption.id} value={staffOption.id}>
                                    {staffOption.displayName}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="staged-form-row">
                    <div className="staged-form-field">
                        <label htmlFor="name">Name *</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="staged-form-input"
                            placeholder="Enter Group Name"
                            required
                        />
                    </div>
                    <div className="staged-form-field">
                        <label htmlFor="externalId">External ID</label>
                        <input
                            id="externalId"
                            type="text"
                            value={externalId}
                            onChange={(e) => setExternalId(e.target.value)}
                            className="staged-form-input"
                            placeholder="Enter External ID"
                        />
                    </div>
                </div>

                <div className="staged-form-row">
                    <div className="staged-form-field">
                        <label htmlFor="clientSearch">Add Clients</label>
                        <Select
                            id="clientSearch"
                            options={clients.map((client) => ({
                                value: client.id,
                                label: `${client.displayName} (${client.accountNo})`,
                            }))}
                            placeholder="Search and select a client"
                            isSearchable
                            onChange={(selected) => {
                                if (selected) {
                                    handleAddClient(selected);
                                }
                            }}
                            value={null}
                            isClearable
                        />
                    </div>
                    <div className="staged-form-field">
                        <label htmlFor="submittedOn">Submitted On</label>
                        <DatePicker
                            id="submittedOn"
                            selected={new Date(submittedOn)}
                            onChange={(date) => setSubmittedOn(date.toISOString().split('T')[0])}
                            className="staged-form-input"
                            placeholderText="Select Date"
                            dateFormat="dd MMMM yyyy"
                            showMonthDropdown
                            showYearDropdown
                            dropdownMode="select"
                        />
                    </div>
                </div>

                <div className="staged-form-row">
                    <div className="staged-form-field">
                        <label htmlFor="isActive">
                            <input
                                id="isActive"
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="staged-checkbox-input"
                            />
                            Activate
                        </label>
                    </div>
                    {isActive && (
                        <div className="staged-form-field">
                            <label htmlFor="activatedOn">Activated On *</label>
                            <DatePicker
                                id="activatedOn"
                                selected={activatedOn}
                                onChange={(date) => setActivatedOn(date)}
                                className="staged-form-input"
                                placeholderText="Select Activation Date"
                                dateFormat="dd MMMM yyyy"
                                required
                                showMonthDropdown
                                showYearDropdown
                                dropdownMode="select"
                            />
                        </div>
                    )}
                </div>

                {addedClients.length > 0 && (
                        <div className="added-clients">
                            <h4>Added Clients</h4>
                            <ul>
                                {addedClients.map((client, index) => (
                                    <li key={client.id}>
                                        {client.displayName} ({client.accountNo})
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveClient(index)}
                            className="remove-client-button"
                        >
                            Remove
                        </button>
                    </li>
                ))}
                        </ul>
                    </div>
                )}

                {/* Buttons */}
                <div className="staged-form-stage-buttons">
                    <button
                        type="submit"
                        className="staged-form-button-next"
                        onClick={handleSubmit}
                        disabled={!isFormComplete}
                    >
                        Submit
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddGroupForm;
