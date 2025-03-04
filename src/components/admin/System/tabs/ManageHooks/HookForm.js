import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import { FaTrash } from 'react-icons/fa';
import './HookForm.css';
import {NotificationContext} from "../../../../../context/NotificationContext";

const HookForm = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();

    const [hookTemplates, setHookTemplates] = useState([]);
    const [groupings, setGroupings] = useState([]);
    const [formData, setFormData] = useState({
        hookTemplate: '',
        displayName: '',
        isActive: false,
        contentType: '',
        payloadUrl: '',
        phoneNumber: '',
        smsProvider: '',
        smsProviderAccountId: '',
        smsProviderToken: '',
        events: [],
    });

    const [showEventModal, setShowEventModal] = useState(false);
    const [eventData, setEventData] = useState({
        grouping: '',
        entity: '',
        action: '',
    });
    const [filteredEntities, setFilteredEntities] = useState([]);
    const [filteredActions, setFilteredActions] = useState([]);

    useEffect(() => {
        fetchHookTemplate();
    }, []);

    const fetchHookTemplate = async () => {
        startLoading();
        try {
            const response = await fetch(`${API_CONFIG.proxy}/fineract-provider/api/v1/hooks/template`, {
                method: 'GET',
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            setHookTemplates(data.templates);
            setGroupings(data.groupings);
        } catch (error) {
            console.error('Error fetching hook templates:', error);
        } finally {
            stopLoading();
        }
    };

    const handleFieldChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
            ...(field === 'hookTemplate' && {
                contentType: '',
                payloadUrl: '',
                phoneNumber: '',
                smsProvider: '',
                smsProviderAccountId: '',
                smsProviderToken: '',
            }),
        }));
    };

    const handleEventChange = (field, value) => {
        setEventData((prev) => ({ ...prev, [field]: value }));

        if (field === 'grouping') {
            const selectedGrouping = groupings.find((group) => group.name === value);
            setFilteredEntities(selectedGrouping ? selectedGrouping.entities : []);
            setEventData((prev) => ({ ...prev, entity: '', action: '' }));
            setFilteredActions([]);
        } else if (field === 'entity') {
            const selectedEntity = filteredEntities.find((entity) => entity.name === value);
            setFilteredActions(selectedEntity ? selectedEntity.actions : []);
            setEventData((prev) => ({ ...prev, action: '' }));
        }
    };

    const addEvent = () => {
        setFormData((prev) => ({
            ...prev,
            events: [...prev.events, { entity: eventData.entity, action: eventData.action }],
        }));
        setShowEventModal(false);
        setEventData({ grouping: '', entity: '', action: '' });
    };

    const deleteEvent = (index) => {
        const updatedEvents = [...formData.events];
        updatedEvents.splice(index, 1);
        setFormData((prev) => ({ ...prev, events: updatedEvents }));
    };

    const handleSubmit = async () => {
        startLoading();
        try {
            let payload = {
                hookTemplate: formData.hookTemplate,
                displayName: formData.displayName,
                isActive: formData.isActive,
                events: formData.events,
            };

            if (formData.hookTemplate === 'Web') {
                payload = {
                    ...payload,
                    contentType: formData.contentType,
                    payloadUrl: formData.payloadUrl,
                };
            } else if (formData.hookTemplate === 'SMS Bridge') {
                payload = {
                    ...payload,
                    payloadUrl: formData.payloadUrl,
                    phoneNumber: formData.phoneNumber,
                    smsProvider: formData.smsProvider,
                    smsProviderAccountId: formData.smsProviderAccountId,
                    smsProviderToken: formData.smsProviderToken,
                };
            } else if (formData.hookTemplate === 'Message Gateway') {
                payload = {
                    ...payload,
                    payloadUrl: formData.payloadUrl,
                };
            } else if (formData.hookTemplate === 'Elastic Search') {
                payload = {
                    ...payload,
                    payloadUrl: formData.payloadUrl,
                };
            }

            const response = await fetch(`${API_CONFIG.proxy}/fineract-provider/api/v1/hooks`, {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                showNotification('Hook created successfully!', 'success');
                setFormData({
                    hookTemplate: '',
                    displayName: '',
                    isActive: false,
                    contentType: '',
                    payloadUrl: '',
                    phoneNumber: '',
                    smsProvider: '',
                    smsProviderAccountId: '',
                    smsProviderToken: '',
                    events: [],
                });
            } else {
                const error = await response.json();
                console.error('Error creating hook:', error);
                showNotification('Failed to create hook. Please check your input!', 'error');
            }
        } catch (error) {
            console.error('Error submitting hook form:', error);
            showNotification('An unexpected error occurred. Please try again!', 'error');
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="hook-form-container">
            <form>
                <div className="hook-form-fields">
                    <div className="hook-row">
                        <div className="hook-field">
                            <label>
                                Hook Template <span>*</span>
                            </label>
                            <select
                                value={formData.hookTemplate}
                                onChange={(e) => handleFieldChange('hookTemplate', e.target.value)}
                                required
                            >
                                <option value="">Select Template</option>
                                {hookTemplates.map((template) => (
                                    <option key={template.id} value={template.name}>
                                        {template.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="hook-field">
                            <label>
                                Display Name <span>*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.displayName}
                                onChange={(e) => handleFieldChange('displayName', e.target.value)}
                                placeholder="Enter display name"
                                required
                            />
                        </div>
                    </div>
                    <div className="hook-row">
                        <div className="hook-field">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => handleFieldChange('isActive', e.target.checked)}
                                /> Is Active
                            </label>
                        </div>
                    </div>
                    {formData.hookTemplate === 'Web' && (
                        <div className="hook-row">
                            <div className="hook-field">
                                <label>
                                    Content Type <span>*</span>
                                </label>
                                <select
                                    value={formData.contentType}
                                    onChange={(e) => handleFieldChange('contentType', e.target.value)}
                                    required
                                >
                                    <option value="">Select Content Type</option>
                                    <option value="json">JSON</option>
                                    <option value="form">Form</option>
                                </select>
                            </div>
                            <div className="hook-field">
                                <label>
                                    Payload URL <span>*</span>
                                </label>
                                <input
                                    type="url"
                                    value={formData.payloadUrl}
                                    onChange={(e) => handleFieldChange('payloadUrl', e.target.value)}
                                    placeholder="Enter Payload URL"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {formData.hookTemplate === 'SMS Bridge' && (
                        <>
                            <div className="hook-row">
                                <div className="hook-field">
                                    <label>
                                        Phone Number <span>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={10}
                                        value={formData.phoneNumber}
                                        onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
                                        placeholder="Enter phone number"
                                        required
                                    />
                                </div>
                                <div className="hook-field">
                                    <label>
                                        Payload URL <span>*</span>
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.payloadUrl}
                                        onChange={(e) => handleFieldChange('payloadUrl', e.target.value)}
                                        placeholder="Enter Payload URL"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="hook-row">
                                <div className="hook-field">
                                    <label>
                                        SMS Provider <span>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.smsProvider}
                                        onChange={(e) => handleFieldChange('smsProvider', e.target.value)}
                                        placeholder="Enter SMS provider"
                                        required
                                    />
                                </div>
                                <div className="hook-field">
                                    <label>
                                        SMS Provider Account ID <span>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.smsProviderAccountId}
                                        onChange={(e) =>
                                            handleFieldChange('smsProviderAccountId', e.target.value)
                                        }
                                        placeholder="Enter account ID"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="hook-row">
                                <div className="hook-field">
                                    <label>
                                        SMS Provider Token <span>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.smsProviderToken}
                                        onChange={(e) =>
                                            handleFieldChange('smsProviderToken', e.target.value)
                                        }
                                        placeholder="Enter provider token"
                                        required
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {formData.hookTemplate === 'Message Gateway' && (
                        <div className="hook-row">
                            <div className="hook-field">
                                <label>
                                    Payload URL <span>*</span>
                                </label>
                                <input
                                    type="url"
                                    value={formData.payloadUrl}
                                    onChange={(e) => handleFieldChange('payloadUrl', e.target.value)}
                                    placeholder="Enter Payload URL"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {formData.hookTemplate === 'Elastic Search' && (
                        <div className="hook-row">
                            <div className="hook-field">
                                <label>
                                    Payload URL <span>*</span>
                                </label>
                                <input
                                    type="url"
                                    value={formData.payloadUrl}
                                    onChange={(e) => handleFieldChange('payloadUrl', e.target.value)}
                                    placeholder="Enter Payload URL"
                                    required
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="hook-events-section">
                    <div className="hook-events-header">
                        <h4>Events</h4>
                        <button
                            type="button"
                            className="hook-add-event-button"
                            onClick={() => setShowEventModal(true)}
                        >
                            Add Event
                        </button>
                    </div>
                    <table>
                        <thead>
                        <tr>
                            <th>Entity Name</th>
                            <th>Action Name</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {formData.events.map((event, index) => (
                            <tr key={index}>
                                <td>{event.entity}</td>
                                <td>{event.action}</td>
                                <td>
                                    <button
                                        type="button"
                                        onClick={() => deleteEvent(index)}
                                        className="delete-event-button"
                                    >
                                        <FaTrash/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                <div className="hook-submit-container">
                    <button
                        type="button"
                        className="hook-submit-button"
                        onClick={handleSubmit}
                        disabled={
                            !formData.hookTemplate ||
                            !formData.displayName ||
                            (formData.hookTemplate === 'Web' &&
                                (!formData.contentType || !formData.payloadUrl)) ||
                            (formData.hookTemplate === 'SMS Bridge' &&
                                (!formData.phoneNumber ||
                                    !formData.payloadUrl ||
                                    !formData.smsProvider ||
                                    !formData.smsProviderAccountId ||
                                    !formData.smsProviderToken)) ||
                            (formData.hookTemplate === 'Message Gateway' && !formData.payloadUrl) ||
                            (formData.hookTemplate === 'Elastic Search' && !formData.payloadUrl)
                        }
                    >
                        Submit Hook
                    </button>
                </div>
            </form>

            {showEventModal && (
                <div className="hook-modal-backdrop" onClick={() => setShowEventModal(false)}>
                    <div className="hook-modal" onClick={(e) => e.stopPropagation()}>
                        <h4>Add Event</h4>
                        <div className="hook-modal-field">
                            <label>
                                Select Grouping <span>*</span>
                            </label>
                            <select
                                value={eventData.grouping}
                                onChange={(e) => handleEventChange('grouping', e.target.value)}
                                required
                            >
                            <option value="">Select Grouping</option>
                                {groupings.map((group) => (
                                    <option key={group.name} value={group.name}>
                                        {group.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="hook-modal-field">
                            <label>
                                Select Entity <span>*</span>
                            </label>
                            <select
                                value={eventData.entity}
                                onChange={(e) => handleEventChange('entity', e.target.value)}
                                required
                                disabled={!filteredEntities.length}
                            >
                                <option value="">Select Entity</option>
                                {filteredEntities.map((entity) => (
                                    <option key={entity.name} value={entity.name}>
                                        {entity.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="hook-modal-field">
                            <label>
                                Select Action <span>*</span>
                            </label>
                            <select
                                value={eventData.action}
                                onChange={(e) => handleEventChange('action', e.target.value)}
                                required
                                disabled={!filteredActions.length}
                            >
                                <option value="">Select Action</option>
                                {filteredActions.map((action, index) => (
                                    <option key={index} value={action}>
                                        {action}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="hook-modal-actions">
                            <button type="button" onClick={() => setShowEventModal(false)}>
                                Cancel
                            </button>
                            <button type="button" onClick={addEvent}>
                                Add Event
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HookForm;
