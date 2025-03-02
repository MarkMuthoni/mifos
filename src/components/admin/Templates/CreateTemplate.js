import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './CreateTemplate.css';
import { useLoading } from '../../../context/LoadingContext';
import { API_CONFIG } from '../../../config';
import { AuthContext } from '../../../context/AuthContext';
import { FaPlus, FaMinus } from 'react-icons/fa';
import {NotificationContext} from "../../../context/NotificationContext";

const CreateTemplateForm = () => {
    const [step, setStep] = useState(1);
    const [entityOptions, setEntityOptions] = useState([]);
    const [typeOptions, setTypeOptions] = useState([]);
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const [templateForm, setTemplateForm] = useState({
        entity: '',
        type: '',
        name: '',
        mapper: [{ key: '', value: '' }],
        content: ''
    });
    const [currentStage, setCurrentStage] = useState(0);
    const [completedStages, setCompletedStages] = useState(new Set());
    const [isStep1Valid, setIsStep1Valid] = useState(false);
    const [isStep2Valid, setIsStep2Valid] = useState(false);

    const [stages] = useState([
        "Basic Information",
        "Advanced Options",
        "Template Content",
        "Preview"
    ]);

    const fetchTemplateOptions = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/templates/template`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });

            setEntityOptions(response.data.entities || []);
            setTypeOptions(response.data.types || []);
        } catch (error) {
            console.error('Error fetching template options:', error);
        } finally {
            stopLoading();
        }
    };

    const validateStep1 = () => {
        const { entity, type, name } = templateForm;
        setIsStep1Valid(entity && type && name.trim() !== "");
    };

    const validateStep2 = () => {
        setIsStep2Valid(templateForm.mapper.length > 0);
    };

    useEffect(() => {
        validateStep1();
    }, [templateForm.entity, templateForm.type, templateForm.name]);

    useEffect(() => {
        validateStep2();
    }, [templateForm.mapper]);

    useEffect(() => {
        fetchTemplateOptions();
    }, []);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setTemplateForm({ ...templateForm, [name]: value });
    };

    const addMapperRow = () => {
        if (templateForm.mapper.length < 5) {
            setTemplateForm({
                ...templateForm,
                mapper: [...templateForm.mapper, { key: '', value: '' }]
            });
        }
    };

    const removeMapperRow = (index) => {
        if (templateForm.mapper.length > 1) {
            const newMapper = [...templateForm.mapper];
            newMapper.splice(index, 1);
            setTemplateForm({ ...templateForm, mapper: newMapper });
        }
    };

    const handleMapperChange = (index, field, value) => {
        const newMapper = [...templateForm.mapper];
        newMapper[index][field] = value;
        setTemplateForm({ ...templateForm, mapper: newMapper });
    };

    const handleNextStage = () => {
        if (currentStage < stages.length - 1) {
            if (
                (currentStage === 0 && isStep1Valid) ||
                (currentStage === 1) ||
                (currentStage === 2)
            ) {
                setCompletedStages((prev) => {
                    const updatedStages = new Set(prev);
                    updatedStages.add(stages[currentStage]);
                    return updatedStages;
                });
                setCurrentStage((prev) => prev + 1);
            }
        }
    };

    const handleSubmitTemplate = async () => {
        try {
            const payload = { ...templateForm };
            const response = await axios.post(`/fineract-provider/api/v1/templates`, payload, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.status === 200) {
                showNotification("Template successfully created!", 'success');
                setCurrentStage(0);
                setCompletedStages(new Set());
                setTemplateForm({
                    entity: "",
                    type: "",
                    name: "",
                    mapper: [{ key: "", value: "" }],
                    content: "",
                });
            }
        } catch (error) {
            console.error("Error submitting template:", error);
            showNotification("An error occurred. Please try again!", 'error');
        }
    };

    const renderStageTracker = () => (
        <div className="staged-form-stage-tracker">
            {stages.map((stage, index) => {
                const isCompleted =
                    (index === 0 && isStep1Valid) ||
                    (index === 1 && isStep2Valid) ||
                    (index < currentStage && completedStages.has(stage));

                return (
                    <div
                        key={stage}
                        className={`staged-form-stage ${
                            index === currentStage
                                ? "staged-form-active"
                                : isCompleted
                                    ? "staged-form-completed"
                                    : "staged-form-unvisited"
                        }`}
                        onClick={() => {
                            if (isCompleted || index === currentStage) {
                                setCurrentStage(index);
                            }
                        }}
                    >
                        <span className="staged-form-stage-circle">{index + 1}</span>
                        <span className="staged-form-stage-label">{stage}</span>
                    </div>
                );
            })}
        </div>
    );

    const renderStageContent = () => {
        if (stages[currentStage] === "Preview") {
            return renderPreviewSection();
        }

        switch (stages[currentStage]) {
            case "Basic Information":
                return (
                    <div className="staged-form-basic-info">
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label>
                                    Entity <span className="staged-form-required">*</span>
                                </label>
                                <select
                                    name="entity"
                                    value={templateForm.entity}
                                    onChange={handleFormChange}
                                    required
                                    className="staged-form-select"
                                >
                                    <option value="">Select Entity</option>
                                    {entityOptions.map((entity) => (
                                        <option key={entity.id} value={entity.id}>
                                            {entity.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="staged-form-field">
                                <label>
                                    Type <span className="staged-form-required">*</span>
                                </label>
                                <select
                                    name="type"
                                    value={templateForm.type}
                                    onChange={handleFormChange}
                                    required
                                    className="staged-form-select"
                                >
                                    <option value="">Select Type</option>
                                    {typeOptions.map((type) => (
                                        <option key={type.id} value={type.id}>
                                            {type.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label>
                                    Template Name <span className="staged-form-required">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={templateForm.name}
                                    onChange={handleFormChange}
                                    required
                                    className="staged-form-input"
                                    placeholder="Enter template name"
                                />
                            </div>
                        </div>
                    </div>
                );
            case "Advanced Options":
                return (
                    <div className="staged-form-advanced-options">
                        <h3 className="staged-form-section-title">Advanced Options (Add Mappers)</h3>
                        {templateForm.mapper.map((mapper, index) => (
                            <div key={index} className="staged-form-row">
                                {/* Mapper Key Field */}
                                <div className="staged-form-field">
                                    <label>
                                        Mapper Key
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter Mapper Key"
                                        value={mapper.key}
                                        onChange={(e) =>
                                            handleMapperChange(index, "key", e.target.value)
                                        }
                                        className="staged-form-input"
                                        required
                                    />
                                </div>
                                {/* Mapper Value Field */}
                                <div className="staged-form-field">
                                    <label>
                                        Mapper Value
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter Mapper Value"
                                        value={mapper.value}
                                        onChange={(e) =>
                                            handleMapperChange(index, "value", e.target.value)
                                        }
                                        className="staged-form-input"
                                        required
                                    />
                                </div>
                                {/* Add/Remove Mapper Actions */}
                                <div className="staged-form-field mapper-actions">
                                    {index === 0 && templateForm.mapper.length < 5 && (
                                        <FaPlus
                                            style={{cursor: 'pointer'}}
                                            className="mapper-add-icon"
                                            onClick={addMapperRow}
                                        />
                                    )}
                                    {index > 0 && (
                                        <FaMinus
                                            style={{cursor: 'pointer'}}
                                            className="mapper-remove-icon"
                                            onClick={() => removeMapperRow(index)}
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case "Template Content":
                return (
                    <div className="staged-form-template-content">
                        <h3 className="staged-form-section-title">Template Content</h3>
                        <div className="staged-form-row">
                            <div className="staged-form-field full-width">
                                <label>
                                    Content <span className="staged-form-required">*</span>
                                </label>
                                <ReactQuill
                                    value={templateForm.content}
                                    onChange={(content) =>
                                        setTemplateForm({ ...templateForm, content })
                                    }
                                    theme="snow"
                                    className="staged-form-quill-editor"
                                />
                                {templateForm.content.trim() === "" && (
                                    <p className="error-message">Content cannot be empty</p>
                                )}
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    const renderPreviewSection = () => {
        const getEntityName = () => {
            const entityObj = entityOptions.find((entity) => entity.id === parseInt(templateForm.entity));
            return entityObj ? entityObj.name : "N/A";
        };

        const getTypeName = () => {
            const typeObj = typeOptions.find((type) => type.id === parseInt(templateForm.type));
            return typeObj ? typeObj.name : "N/A";
        };

        const stageData = [
            {
                title: "Basic Information",
                data: {
                    Entity: getEntityName(),
                    Type: getTypeName(),
                    "Template Name": templateForm.name || "N/A",
                },
            },
            {
                title: "Advanced Options",
                data: {
                    Mapper: templateForm.mapper.length
                        ? templateForm.mapper
                            .map((mapper) => `${mapper.key || "N/A"}: ${mapper.value || "N/A"}`)
                            .join(", ")
                        : "N/A",
                },
            },
            {
                title: "Template Content",
                data: {
                    Content: templateForm.content || "N/A",
                },
            },
        ];

        return (
            <div className="staged-form-preview-section">
                <h2 className="preview-header">Form Preview</h2>
                {stageData.map(({ title, data }) => (
                    <div key={title} className="staged-form-preview-block">
                        <div className="staged-form-preview-header">
                            <h4 className="preview-stage-title">{title}</h4>
                            <button
                                className="staged-form-edit-button"
                                onClick={() => setCurrentStage(stages.indexOf(title))}
                            >
                                Edit
                            </button>
                        </div>
                        <div className="staged-form-preview-table-wrapper">
                            <table className="staged-form-preview-table">
                                <thead>
                                <tr>
                                    <th>Field</th>
                                    <th>Value</th>
                                </tr>
                                </thead>
                                <tbody>
                                {Object.entries(data).map(([key, value]) => (
                                    <tr key={key}>
                                        <td>{key}</td>
                                        <td>{value}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="form-container-create-template">
            <div className="staged-form-create-template">
                {renderStageTracker()}

                <div className="staged-form-stage-content">
                    {renderStageContent()}

                    <div className="staged-form-stage-buttons">
                        <button
                            onClick={() => setCurrentStage((prev) => Math.max(prev - 1, 0))}
                            disabled={currentStage === 0}
                            className="staged-form-button-previous"
                        >
                            Previous
                        </button>

                        {currentStage < stages.length - 1 && (
                            <button
                                onClick={handleNextStage}
                                className="staged-form-button-next"
                                disabled={
                                    (currentStage === stages.indexOf("Basic Information") && !isStep1Valid) ||
                                    (currentStage === stages.indexOf("Advanced Options") && templateForm.mapper.length === 0)
                                }
                            >
                                Next
                            </button>
                        )}

                        {stages[currentStage] === "Preview" && (
                            <button
                                type="button"
                                onClick={handleSubmitTemplate}
                                className="staged-form-button-next"
                            >
                                Submit
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateTemplateForm;
