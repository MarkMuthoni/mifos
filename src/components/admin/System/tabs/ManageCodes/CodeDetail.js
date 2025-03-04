import React, {useState, useEffect, useContext} from 'react';
import axios from 'axios';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import { AuthContext } from '../../../../../context/AuthContext';
import './CodeDetail.css';
import {FaEdit, FaTrash} from "react-icons/fa";
import {NotificationContext} from "../../../../../context/NotificationContext";

const CodeDetail = ({ code }) => {
    const codeId = code.id;
    const codeName = code.name;
    const { startLoading, stopLoading } = useLoading();
    const [codeValues, setCodeValues] = useState([]);
    const [newCodeValue, setNewCodeValue] = useState({ name: '', description: '', position: '', isActive: false });
    const [editingIndex, setEditingIndex] = useState(null);
    const [originalValues, setOriginalValues] = useState([]);
    const [errors, setErrors] = useState({});
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);

    useEffect(() => {
        fetchCodeValues();
    }, [codeId]);


    const fetchCodeValues = async () => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/codes/${codeId}/codevalues`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setCodeValues(response.data || []);
            setOriginalValues(response.data || []);
        } catch (error) {
            console.error('Error fetching code values:', error);
        } finally {
            stopLoading();
        }
    };

    const handleAddCodeValue = async (index) => {
        startLoading();
        try {
            const value = codeValues[index];
            const payload = {
                name: value.name.trim(),
                description: value.description?.trim() || null,
                position: Number(value.position),
                isActive: Boolean(value.isActive),
            };

            await axios.post(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/codes/${codeId}/codevalues`,
                payload,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            setNewCodeValue({ name: '', description: '', position: '', isActive: false });
            fetchCodeValues();
            showNotification("Code values added successfully!", 'success');
        } catch (error) {
            console.error('Error adding code value:', error);
            showNotification('Error adding code value!', 'error');
        } finally {
            stopLoading();
        }
    };

    const handleEditCodeValue = async (index) => {
        const value = codeValues[index];
        startLoading();
        try {
            await axios.put(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/codes/${codeId}/codevalues/${value.id}`,
                {
                    name: value.name,
                    description: value.description,
                    position: Number(value.position),
                    isActive: value.isActive,
                },
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            setEditingIndex(null);
            fetchCodeValues();
            showNotification("Code value updated successfully!", 'success');
        } catch (error) {
            console.error('Error updating code value:', error);
            showNotification('Error updating code value!', 'error');
        } finally {
            stopLoading();
        }
    };

    const handleDeleteCodeValue = async (id) => {
        if (!window.confirm('Are you sure you want to delete this value?')) return;
        startLoading();
        try {
            await axios.delete(`${API_CONFIG.proxy}/fineract-provider/api/v1/codes/${codeId}/codevalues/${id}`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            fetchCodeValues();
            showNotification("Code value deleted successfully!", 'success');
        } catch (error) {
            console.error('Error deleting code value:', error);
            showNotification('Error deleting code value!', 'error');
        } finally {
            stopLoading();
        }
    };

    const validateInput = (index, field, value) => {
        const rowErrors = errors[index] || {};

        if (field === 'name') {
            const enteredName = value?.trim().toLowerCase() || '';
            if (!enteredName) {
                rowErrors.name = 'Name is required.';
            } else if (
                codeValues.some(
                    (existingValue, i) =>
                        i !== index &&
                        existingValue.name &&
                        existingValue.name.trim().toLowerCase() === enteredName
                )
            ) {
                rowErrors.name = 'Duplicate name is not allowed.';
            } else {
                delete rowErrors.name;
            }
        }

        if (field === 'position') {
            const enteredPosition = value ? Number(value.trim()) : null;
            if (!value?.trim()) {
                rowErrors.position = 'Position is required.';
            } else if (
                codeValues.some(
                    (existingValue, i) =>
                        i !== index &&
                        existingValue.position === enteredPosition
                )
            ) {
                rowErrors.position = 'Duplicate position is not allowed.';
            } else {
                delete rowErrors.position;
            }
        }

        setErrors((prev) => ({ ...prev, [index]: rowErrors }));
    };

    const formatCodeName = (name) => {
        return name
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/_/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase()
            .replace(/(^\w|\s\w)/g, (match) => match.toUpperCase());
    };

    return (
        <div className="code-detail-container">
            <div className="code-value-header">
                <h3 className={'page-title'}>{formatCodeName(codeName)}</h3>
                <button
                    className="add-value-button"
                    onClick={() => setCodeValues((prev) => [...prev, {isNew: true}])}
                >
                    Add Code Value
                </button>
            </div>
            <div className="code-values-list">
                {codeValues.length === 0 ? (
                    <p className={"no-data"}>No values added for this code.</p>
                ) : (
                    codeValues.map((value, index) => (
                        <div key={index} className="code-value-row">
                            <div className="field-container">
                                <label className="field-label">
                                    Name <span className="mandatory">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="field"
                                    value={value.name || ''}
                                    disabled={!value.isNew && editingIndex !== index}
                                    onChange={(e) => {
                                        const inputValue = e.target.value;
                                        setCodeValues((prev) =>
                                            prev.map((v, i) => (i === index ? {...v, name: inputValue} : v))
                                        );
                                        validateInput(index, 'name', inputValue);
                                    }}
                                />
                                {errors[index]?.name && <p className="error-message">{errors[index].name}</p>}
                            </div>
                            <div className="field-container">
                                <label className="field-label">Description</label>
                                <input
                                    type="text"
                                    className="field"
                                    value={value.description || ''}
                                    disabled={!value.isNew && editingIndex !== index}
                                    onChange={(e) =>
                                        setCodeValues((prev) =>
                                            prev.map((v, i) => (i === index ? {...v, description: e.target.value} : v))
                                        )
                                    }
                                />
                            </div>
                            <div className="field-container">
                                <label className="field-label">
                                    Position <span className="mandatory">*</span>
                                </label>
                                <input
                                    type="number"
                                    className="field"
                                    value={value.position || ''}
                                    disabled={!value.isNew && editingIndex !== index}
                                    onChange={(e) => {
                                        const inputValue = e.target.value;
                                        setCodeValues((prev) =>
                                            prev.map((v, i) => (i === index ? {...v, position: inputValue} : v))
                                        );
                                        validateInput(index, 'position', inputValue);
                                    }}
                                />
                                {errors[index]?.position && <p className="error-message">{errors[index].position}</p>}
                            </div>
                            <div className="checkbox-container">
                                <label className="checkbox-label"><input
                                    type="checkbox"
                                    checked={value.active}
                                    disabled={!value.isNew && editingIndex !== index}
                                    onChange={(e) =>
                                        setCodeValues((prev) =>
                                            prev.map((v, i) => (i === index ? {...v, isActive: e.target.checked} : v))
                                        )
                                    }
                                />
                                    Active</label>
                            </div>
                            <div className="buttons">
                                {value.isNew ? (
                                    <>
                                        <button
                                            className="add-value-confirm"
                                            onClick={() => {
                                                if (!Object.keys(errors[index] || {}).length) handleAddCodeValue(index);
                                            }}
                                            disabled={
                                                !value.name?.trim() ||
                                                !String(value.position)?.trim() ||
                                                errors[index]?.name ||
                                                errors[index]?.position
                                            }
                                        >
                                            Add
                                        </button>
                                        <div
                                            className="cancel-add-value"
                                            onClick={() => setCodeValues((prev) => prev.filter((_, i) => i !== index))}
                                        >
                                            cancel
                                        </div>
                                    </>
                                ) : editingIndex === index ? (
                                    <>
                                        <button
                                            className="save-value"
                                            onClick={() => handleEditCodeValue(index)}
                                            disabled={
                                                !value.name.trim() ||
                                                !String(value.position).trim() ||
                                                errors[index]?.name ||
                                                errors[index]?.position ||
                                                (originalValues[index].name.trim().toLowerCase() === value.name.trim().toLowerCase() &&
                                                    originalValues[index].position === value.position &&
                                                    originalValues[index].isActive === value.isActive &&
                                                    originalValues[index].description === value.description)
                                            }
                                        >
                                            save
                                        </button>
                                        <div
                                            className="cancel-edit"
                                            onClick={() => {
                                                setCodeValues(originalValues);
                                                setEditingIndex(null);
                                            }}
                                        >
                                            cancel
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div
                                            className="edit-value"
                                            onClick={() => setEditingIndex(index)}
                                        >
                                            <FaEdit color={'#499e18'}/>
                                        </div>
                                        <div
                                            className="delete-value"
                                            onClick={() => handleDeleteCodeValue(value.id)}
                                        >
                                            <FaTrash color={'#ff0000'}/>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CodeDetail;
