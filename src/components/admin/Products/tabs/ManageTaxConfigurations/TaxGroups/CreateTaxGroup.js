import React, { useState, useEffect, useContext } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import axios from "axios";
import { AuthContext } from "../../../../../../context/AuthContext";
import { useLoading } from "../../../../../../context/LoadingContext";
import { API_CONFIG } from "../../../../../../config";
import "./CreateTaxGroup.css";
import {NotificationContext} from "../../../../../../context/NotificationContext";

const CreateTaxGroup = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const [name, setName] = useState("");
    const [taxComponents, setTaxComponents] = useState([]);
    const [selectedComponents, setSelectedComponents] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentEditIndex, setCurrentEditIndex] = useState(null);
    const [formValues, setFormValues] = useState({ component: "", startDate: "" });

    useEffect(() => {
        fetchTaxComponents();
    }, []);

    const fetchTaxComponents = async () => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/taxes/group/template`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });
            setTaxComponents(response.data?.components || []);
        } catch (error) {
            console.error("Error fetching tax components:", error);
        } finally {
            stopLoading();
        }
    };

    const handleModalOpen = () => {
        setFormValues({ component: "", startDate: "" });
        setCurrentEditIndex(null);
        setShowModal(true);
    };

    const handleModalSubmit = () => {
        // if (!formValues.component || !formValues.startDate) return;

        if (currentEditIndex !== null) {
            const updatedComponents = [...selectedComponents];
            updatedComponents[currentEditIndex] = formValues;
            setSelectedComponents(updatedComponents);
        } else {
            setSelectedComponents([...selectedComponents, formValues]);
        }

        setShowModal(false);
    };

    const handleDelete = (index) => {
        if (window.confirm("Are you sure you want to delete this tax component?")) {
            const updatedComponents = selectedComponents.filter((_, i) => i !== index);
            setSelectedComponents(updatedComponents);
        }
    };

    const handleEdit = (index) => {
        setFormValues(selectedComponents[index]);
        setCurrentEditIndex(index);
        setShowModal(true);
    };

    const handleSubmit = async () => {
        const payload = {
            name,
            components: selectedComponents.map((c) => ({
                taxComponent: c.component,
                startDate: c.startDate,
            })),
        };

        try {
            startLoading();
            await axios.post(`${API_CONFIG.proxy}/fineract-provider/api/v1/taxes/group`, payload, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });
            showNotification("Tax group created successfully!", 'success');
            setName("");
            setSelectedComponents([]);
        } catch (error) {
            console.error("Error creating tax group:", error);
            showNotification("Error creating tax group:", 'error');
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="create-tax-group">
            <h3 className="tax-group-heading">Create Tax Group</h3>
            <div className="tax-group-form-group">
                <label htmlFor="name" className="tax-group-label">Name:</label>
                <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="tax-group-input"
                    placeholder="Enter tax group name"
                />
            </div>
            <div className="tax-add-components">
                <span className="tax-add-description">Add Tax Component:</span>
                <button className="tax-add-button" onClick={handleModalOpen}>
                    <span className="tax-add-icon">+</span> Add
                </button>
            </div>
            {selectedComponents.length > 0 && (
                <table className="tax-add-components-table">
                    <thead>
                    <tr>
                        <th>Name</th>
                        <th>Start Date</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {selectedComponents.map((component, index) => (
                        <tr key={index}>
                            <td>{component.component}</td>
                            <td>{component.startDate}</td>
                            <td className="tax-components-actions">
                        <span
                            className="tax-action-icon"
                            onClick={() => handleEdit(index)}
                        >
                            <FaEdit color={'#2ecc71'} />
                        </span>
                                <span
                                    className="tax-action-icon"
                                    onClick={() => handleDelete(index)}
                                >
                            <FaTrash color={'#e74c3c'} />
                        </span>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
            <div className="tax-form-actions">
                <button
                    className="tax-action-button tax-cancel-button"
                    onClick={() => console.log("Cancelled")}
                >
                    Cancel
                </button>
                <button
                    className="tax-action-button tax-submit-button"
                    onClick={handleSubmit}
                    disabled={!name.trim()}
                >
                    Submit
                </button>
            </div>

            {showModal && (
                <div className="tax-modal">
                    <div className="tax-modal-content">
                        <h4 className="tax-modal-heading">Add Tax Component</h4>
                        <div className="tax-modal-form-group">
                            <label className="tax-modal-label">Tax Component:</label>
                            <select
                                value={formValues.component}
                                onChange={(e) =>
                                    setFormValues((prev) => ({ ...prev, component: e.target.value }))
                                }
                                className="tax-modal-input"
                            >
                                <option value="">Select Component</option>
                                {taxComponents.map((comp, index) => (
                                    <option key={index} value={comp.name}>
                                        {comp.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="tax-modal-form-group">
                            <label className="tax-modal-label">Start Date:</label>
                            <input
                                type="date"
                                value={formValues.startDate}
                                onChange={(e) =>
                                    setFormValues((prev) => ({ ...prev, startDate: e.target.value }))
                                }
                                className="tax-modal-input"
                            />
                        </div>
                        <div className="tax-modal-actions">
                            <button
                                className="tax-modal-action-button tax-modal-cancel-button"
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="tax-modal-action-button tax-modal-add-button"
                                onClick={handleModalSubmit}
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateTaxGroup;
