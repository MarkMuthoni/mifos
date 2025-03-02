import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { FaTrash, FaEdit } from 'react-icons/fa';
import { API_CONFIG } from '../../../../../config';
import './CreateReport.css';
import {NotificationContext} from "../../../../../context/NotificationContext";

const ReportForm = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();

    const [editParameterIndex, setEditParameterIndex] = useState(null);

    const [allowedReportTypes, setAllowedReportTypes] = useState([]);
    const [allowedReportSubTypes, setAllowedReportSubTypes] = useState([]);
    const [allowedParameters, setAllowedParameters] = useState([]);
    const [formData, setFormData] = useState({
        reportName: '',
        reportType: '',
        reportSubType: '',
        reportCategory: '',
        isUserReport: false,
        description: '',
        sql: '',
        parameters: [],
    });
    const [showParameterModal, setShowParameterModal] = useState(false);
    const [parameterData, setParameterData] = useState({
        parameter: '',
        parameterName: '',
    });

    useEffect(() => {
        fetchReportTemplate();
    }, []);

    const fetchReportTemplate = async () => {
        startLoading();
        try {
            const response = await fetch(`/fineract-provider/api/v1/reports/template`, {
                method: 'GET',
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            setAllowedReportTypes(data.allowedReportTypes);
            setAllowedReportSubTypes(data.allowedReportSubTypes);
            setAllowedParameters(data.allowedParameters);
        } catch (error) {
            console.error('Error fetching report template:', error);
        } finally {
            stopLoading();
        }
    };

    const handleFieldChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleParameterChange = (field, value) => {
        setParameterData((prev) => ({ ...prev, [field]: value }));
    };

    const addOrUpdateParameter = () => {
        if (editParameterIndex !== null) {
            const updatedParameters = [...formData.parameters];
            updatedParameters[editParameterIndex] = { ...parameterData };
            setFormData((prev) => ({ ...prev, parameters: updatedParameters }));
            setEditParameterIndex(null); // Reset editing state
        } else {
            setFormData((prev) => ({
                ...prev,
                parameters: [...prev.parameters, { ...parameterData }],
            }));
        }

        setParameterData({ parameter: '', parameterName: '' });
        setShowParameterModal(false);
    };


    const deleteParameter = (index) => {
        const updatedParameters = [...formData.parameters];
        updatedParameters.splice(index, 1);
        setFormData((prev) => ({ ...prev, parameters: updatedParameters }));
    };

    const handleEditParameter = (index) => {
        const parameterToEdit = formData.parameters[index];
        setParameterData(parameterToEdit);
        setEditParameterIndex(index);
        setShowParameterModal(true);
    };

    const handleSubmit = async () => {
        startLoading();
        try {
            const payload = { ...formData };
            const response = await fetch(`/fineract-provider/api/v1/reports`, {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                showNotification('Report created successfully!', 'success');
                setFormData({
                    reportName: '',
                    reportType: '',
                    reportSubType: '',
                    reportCategory: '',
                    isUserReport: false,
                    description: '',
                    sql: '',
                    parameters: [],
                });
            } else {
                const error = await response.json();
                console.error('Error creating report:', error);
                showNotification('Error creating report!', 'error');
            }
        } catch (error) {
            console.error('Error submitting report form:', error);
            showNotification('Error submitting report form!', 'error');
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="report-form-container">
            <form>
                <div className="report-fields-section">
                    <div className="report-row">
                        <div className="report-field">
                            <label>
                                Report Name <span>*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.reportName}
                                onChange={(e) => handleFieldChange('reportName', e.target.value)}
                                placeholder="Enter report name"
                                required
                            />
                        </div>
                        <div className="report-field">
                            <label>
                                Report Type <span>*</span>
                            </label>
                            <select
                                value={formData.reportType}
                                onChange={(e) => handleFieldChange('reportType', e.target.value)}
                                required
                            >
                                <option value="">Select Type</option>
                                {allowedReportTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="report-field">
                            <label>
                                Report Sub Type
                            </label>
                            <select
                                value={formData.reportSubType}
                                onChange={(e) => handleFieldChange('reportSubType', e.target.value)}
                                disabled={formData.reportType !== 'Chart'}
                            >
                                <option value="">Select Sub Type</option>
                                {allowedReportSubTypes.map((subType) => (
                                    <option key={subType} value={subType}>
                                        {subType}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="report-row">
                        <div className="report-field">
                            <label>
                                Report Category
                            </label>
                            <select
                                value={formData.reportCategory}
                                onChange={(e) => handleFieldChange('reportCategory', e.target.value)}
                            >
                                <option value="">Select Category</option>
                                <option value="Client">Client</option>
                                <option value="Loan">Loan</option>
                                <option value="Savings">Savings</option>
                                <option value="Fund">Fund</option>
                                <option value="Accounting">Accounting</option>
                            </select>
                        </div>
                        <div className="report-field-checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={formData.isUserReport}
                                    onChange={(e) => handleFieldChange('isUserReport', e.target.checked)}
                                />   User Report (UI)
                            </label>
                        </div>
                    </div>

                    <div className="report-field">
                        <label>Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleFieldChange('description', e.target.value)}
                            placeholder="Optional: Add description"
                        />
                    </div>

                    <div className="report-field">
                        <label>
                            SQL <span>*</span>
                        </label>
                        <textarea
                            value={formData.sql}
                            onChange={(e) => handleFieldChange('sql', e.target.value)}
                            placeholder="Enter SQL query"
                            required
                        />
                    </div>
                </div>

                <div className="report-parameters-section">
                    <div className="parameters-header">
                        <h4>Report Parameters</h4>
                        <button
                            type="button"
                            className="add-parameter-button"
                            onClick={() => setShowParameterModal(true)}
                        >
                            Add Report Parameter
                        </button>
                    </div>
                    <table>
                        <thead>
                        <tr>
                            <th>Parameter</th>
                            <th>Parameter Name Passed to Pentaho</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {formData.parameters.map((param, index) => (
                            <tr key={index}>
                                <td>{param.parameter}</td>
                                <td>{param.parameterName}</td>
                                <td>
                                    <button
                                        type="button"
                                        onClick={() => handleEditParameter(index)}
                                        className="edit-parameter-button"
                                    >
                                        <FaEdit/>
                                    </button>
                                    <button
                                        type="button"
                                        className="delete-parameter-button"
                                        onClick={() => deleteParameter(index)}
                                    >
                                        <FaTrash/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                <div className="submit-container">
                    <button
                        type="button"
                        className="submit-button"
                        onClick={handleSubmit}
                        disabled={!formData.reportName || !formData.reportType || !formData.sql}
                    >
                        Submit Report
                    </button>
                </div>
            </form>

            {showParameterModal && (
                <div className="parameter-modal-backdrop" onClick={() => setShowParameterModal(false)}>
                    <div className="parameter-modal" onClick={(e) => e.stopPropagation()}>
                        <h4>Add Report Parameter</h4>
                        <div className="parameter-modal-field">
                            <label>
                                Select Allowed Parameter <span>*</span>
                            </label>
                            <select
                                value={parameterData.parameter}
                                onChange={(e) => handleParameterChange('parameter', e.target.value)}
                                required
                            >
                                <option value="">Select Parameter</option>
                                {allowedParameters.map((param) => (
                                    <option key={param.id} value={param.parameterName}>
                                        {param.parameterName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="parameter-modal-field">
                            <label>
                                Parameter Name Passed to Pentaho <span>*</span>
                            </label>
                            <input
                                type="text"
                                value={parameterData.parameterName}
                                onChange={(e) => handleParameterChange('parameterName', e.target.value)}
                                required
                            />
                        </div>
                        <div className="parameter-modal-actions">
                            <button type="button" onClick={() => setShowParameterModal(false)}>
                                Cancel
                            </button>
                            <button type="button" onClick={addOrUpdateParameter}>
                                {editParameterIndex !== null ? 'Update Parameter' : 'Add Parameter'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportForm;
