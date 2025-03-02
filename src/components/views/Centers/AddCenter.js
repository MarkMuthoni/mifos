import React, {useContext, useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import './AddCenter.css';
import { useLoading } from '../../../context/LoadingContext';
import axios from 'axios';
import { API_CONFIG } from '../../../config';
import {AuthContext} from "../../../context/AuthContext";
import DatePicker from "react-datepicker";
import Select from "react-select";
import {NotificationContext} from "../../../context/NotificationContext";


const AddCenterForm = ({ onSuccessfulSubmit }) => {
    const [name, setName] = useState('');
    const [isActive, setIsActive] = useState(false);
    const [externalId, setExternalId] = useState('');
    const [submittedOn, setSubmittedOn] = useState(new Date().toISOString().split('T')[0]);
    const [addedGroups, setAddedGroups] = useState([]);
    const [offices, setOffices] = useState([]);
    const [staffs, setStaffs] = useState([]);
    const [office, setOffice] = useState('');
    const [staff, setStaff] = useState('');
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);

    const [groups, setGroups] = useState([]);

    const navigate = useNavigate();
    const { startLoading, stopLoading } = useLoading();

    const [isStaffDisabled, setIsStaffDisabled] = useState(true);
    const [isGroupDisabled, setIsGroupDisabled] = useState(true);
    const [activationDate, setActivationDate] = useState(null);

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

            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                stopLoading();
            }
        };

        fetchData().then();
        // eslint-disable-next-line
    }, []);

    const handleOfficeChange = async (e) => {
        const selectedOfficeId = e.target.value;
        setOffice(selectedOfficeId);
        setStaff('');
        setGroups([]);
        setAddedGroups([]);
        setStaffs([]);
        setIsStaffDisabled(true);
        setIsGroupDisabled(true);

        if (selectedOfficeId) {
            startLoading();
            try {
                const headers = {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                };

                // Fetch staff for selected office
                const staffResponse = await axios.get(
                    `/fineract-provider/api/v1/centers/template?officeId=${selectedOfficeId}&staffInSelectedOfficeOnly=true`,
                    { headers }
                );
                setStaffs(staffResponse.data.staffOptions || []);
                setIsStaffDisabled(false);

                // Fetch groups for selected office
                const groupResponse = await axios.get(
                    `/fineract-provider/api/v1/groups?officeId=${selectedOfficeId}`,
                    { headers }
                );
                setGroups(groupResponse.data || []);
                setIsGroupDisabled(false);
            } catch (error) {
                console.error('Error fetching staff and groups:', error);
            } finally {
                stopLoading();
            }
        }
    };

    const handleRemoveGroup = (group) => {
        setAddedGroups(addedGroups.filter((g) => g.id !== group.id));
        setGroups([...groups, group]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const today = new Date();
        if (new Date(submittedOn) > today) {
            showNotification("Submitted On Date cannot be in the future!", 'info');
            return;
        }

        if (isActive && (!activationDate || new Date(activationDate) > today)) {
            showNotification("Activation Date must be in the past or today!", 'info');
            return;
        }

        startLoading();

        try {
            const formattedSubmittedOn = submittedOn
                ? new Date(submittedOn).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                })
                : null;

            const formattedActivationDate = activationDate
                ? new Date(activationDate).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                })
                : null;

            const payload = {
                name,
                officeId: parseInt(office),
                staffId: parseInt(staff),
                submittedOnDate: formattedSubmittedOn,
                active: isActive,
                activationDate: formattedActivationDate,
                externalId: externalId || undefined,
                groupMembers: addedGroups.map((group) => group.id),
                dateFormat: "dd MMMM yyyy",
                locale: "en",
            };

            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                'Content-Type': 'application/json',
            };

            await axios.post(`/fineract-provider/api/v1/centers`, payload, { headers });

            setName('');
            setOffice('');
            setStaff('');
            setSubmittedOn(new Date().toISOString().split('T')[0]);
            setActivationDate(null);
            setIsActive(false);
            setExternalId('');
            setAddedGroups([]);
            setGroups([]);
            setStaffs([]);

            showNotification("Center created successfully!", 'success');

            if (onSuccessfulSubmit) {
                onSuccessfulSubmit();
            }
        } catch (error) {
            console.error("Error submitting center data:", error);
            showNotification("There was an error creating the center. Please try again!", 'success');
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="staged-form-add-client">
            <form className="staged-form-stage-content" onSubmit={handleSubmit}>
                <div className="staged-form-row">
                    <div className="staged-form-field">
                        <label htmlFor="name">Name <span>*</span></label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="staged-form-input"
                            placeholder="Enter Center Name"
                            required
                        />
                    </div>
                    <div className="staged-form-field">
                        <label htmlFor="office">Office <span>*</span></label>
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
                </div>

                <div className="staged-form-row">
                    <div className="staged-form-field">
                        <label htmlFor="staff">Staff <span>*</span></label>
                        <select
                            id="staff"
                            value={staff}
                            onChange={(e) => setStaff(e.target.value)}
                            className="staged-form-select"
                            disabled={isStaffDisabled}
                            required
                        >
                            <option value="">-- Select Staff --</option>
                            {staffs.map((staff) => (
                                <option key={staff.id} value={staff.id}>
                                    {staff.displayName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="staged-form-field">
                        <label htmlFor="groupSearch">Add Groups</label>
                        <Select
                            id="groupSearch"
                            options={groups.map((group) => ({
                                value: group.id,
                                label: `${group.name} (${group.accountNo}${group.externalId ? ` - ${group.externalId}` : ""})`,
                            }))}
                            placeholder="Search and select a group"
                            isSearchable
                            onChange={(selected) => {
                                if (selected) {
                                    const group = groups.find((g) => g.id === selected.value);
                                    if (group && !addedGroups.some((g) => g.id === group.id)) {
                                        setAddedGroups([...addedGroups, group]);
                                        setGroups(groups.filter((g) => g.id !== group.id));
                                    }
                                }
                            }}
                            value={null}
                            isClearable
                            isDisabled={isGroupDisabled}
                        />
                    </div>
                </div>

                <div className="staged-form-row">
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
                    <div className="staged-form-field">
                        <label htmlFor="submittedOn">Submitted On</label>
                        <DatePicker
                            id="submittedOn"
                            selected={new Date(submittedOn)}
                            onChange={(date) => setSubmittedOn(date.toISOString().split('T')[0])}
                            className="staged-form-input"
                            placeholderText="Select Date"
                            dateFormat="dd MMMM yyyy"
                            maxDate={new Date()}
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
                            Active
                        </label>
                    </div>
                    {isActive && (
                        <div className="staged-form-field">
                            <label htmlFor="activationDate">Activation Date *</label>
                            <DatePicker
                                id="activationDate"
                                selected={activationDate}
                                onChange={(date) => setActivationDate(date)}
                                className="staged-form-input"
                                placeholderText="Select Activation Date"
                                dateFormat="dd MMMM yyyy"
                                minDate={new Date(submittedOn)}
                                maxDate={new Date()}
                                disabled={!submittedOn}
                                required
                                showMonthDropdown
                                showYearDropdown
                                dropdownMode="select"
                            />
                        </div>
                    )}
                </div>
                {addedGroups.length > 0 && (
                    <div className="added-clients">
                        <h4>Added Groups</h4>
                        <ul>
                            {addedGroups.map((group, index) => (
                                <li key={group.id}>
                                    {group.name} ({group.accountNo}{group.externalId ? ` - ${group.externalId}` : ""})
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveGroup(group)}
                                        className="remove-client-button"
                                    >
                                        Remove
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="staged-form-stage-buttons">
                    <button type="submit" className="staged-form-button-next">
                        Submit
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddCenterForm;
