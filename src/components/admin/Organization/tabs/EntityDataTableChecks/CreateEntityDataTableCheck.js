import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../../../../context/AuthContext";
import { useLoading } from "../../../../../context/LoadingContext";
import { API_CONFIG } from "../../../../../config";
import "./CreateEntityDataTableCheck.css";
import {NotificationContext} from "../../../../../context/NotificationContext";

const CreateEntityDataTableCheck = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();

    const [entities, setEntities] = useState([]);
    const [datatables, setDatatables] = useState([]);
    const [statusOptions, setStatusOptions] = useState([]);
    const [selectedEntity, setSelectedEntity] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [selectedDatatable, setSelectedDatatable] = useState("");

    useEffect(() => {
        fetchTemplateData();
    }, []);

    const fetchTemplateData = async () => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/entityDatatableChecks/template`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                },
            });

            const entityNames = response.data.entities.map((entity) =>
                entity.startsWith("m_") ? entity.substring(2) : entity
            );
            setEntities(entityNames);
            setDatatables(response.data.datatables || []);
        } catch (error) {
            console.error("Error fetching template data:", error);
        } finally {
            stopLoading();
        }
    };

    const fetchStatusOptions = async (entity) => {
        startLoading();
        try {
            let statusField;
            switch (entity) {
                case "client":
                    statusField = "statusClient";
                    break;
                case "group":
                    statusField = "statusGroup";
                    break;
                case "loan":
                    statusField = "statusLoans";
                    break;
                case "savings_account":
                    statusField = "statusSavings";
                    break;
                default:
                    statusField = null;
            }

            if (statusField) {
                const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/entityDatatableChecks/template`, {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    },
                });
                setStatusOptions(response.data[statusField] || []);
            } else {
                setStatusOptions([]);
            }
        } catch (error) {
            console.error("Error fetching status options:", error);
        } finally {
            stopLoading();
        }
    };

    const handleEntityChange = (value) => {
        setSelectedEntity(value);
        setSelectedStatus("");
        fetchStatusOptions(value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            entity: `m_${selectedEntity}`,
            status: selectedStatus,
            datatableName: selectedDatatable,
        };

        startLoading();
        try {
            await axios.post(`${API_CONFIG.proxy}/fineract-provider/api/v1/entityDatatableChecks`, payload, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });
            showNotification("Entity Data Table Check created successfully!", 'success');
            setSelectedEntity("");
            setSelectedStatus("");
            setSelectedDatatable("");
        } catch (error) {
            console.error("Error creating Entity Data Table Check:", error);
            showNotification("Error creating Entity Data Table Check:", 'error');
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="create-entity-datatable-check-container">
            <form className="create-entity-datatable-check-form" onSubmit={handleSubmit}>
                <div className="create-holiday-row">
                    <div className="create-entity-datatable-check-group">
                        <label htmlFor="entity" className="create-entity-datatable-check-label">
                            Entity <span className="create-entity-datatable-check-required">*</span>
                        </label>
                        <select
                            id="entity"
                            value={selectedEntity}
                            onChange={(e) => handleEntityChange(e.target.value)}
                            className="create-entity-datatable-check-select"
                            required
                        >
                            <option value="">Select Entity</option>
                            {entities.map((entity, index) => (
                                <option key={index} value={entity}>
                                    {entity.charAt(0).toUpperCase() + entity.slice(1).replaceAll("_", " ")}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="create-entity-datatable-check-group">
                        <label htmlFor="status" className="create-entity-datatable-check-label">
                            Status <span className="create-entity-datatable-check-required">*</span>
                        </label>
                        <select
                            id="status"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="create-entity-datatable-check-select"
                            required
                        >
                            <option value="">Select Status</option>
                            {statusOptions.map((status, index) => (
                                <option key={index} value={status.code}>
                                    {status.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="create-entity-datatable-check-group">
                    <label htmlFor="datatable" className="create-entity-datatable-check-label">
                        Data Table <span className="create-entity-datatable-check-required">*</span>
                    </label>
                    <select
                        id="datatable"
                        value={selectedDatatable}
                        onChange={(e) => setSelectedDatatable(e.target.value)}
                        className="create-entity-datatable-check-select"
                        required
                    >
                        <option value="">Select Data Table</option>
                        {datatables.map((datatable, index) => (
                            <option key={index} value={datatable.dataTableName}>
                                {datatable.dataTableName.charAt(0).toUpperCase() +
                                    datatable.dataTableName.slice(1).replaceAll("_", " ")}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="create-entity-datatable-check-actions">
                    <button
                        type="submit"
                        className="create-entity-datatable-check-submit"
                        disabled={!selectedEntity || !selectedStatus || !selectedDatatable}
                    >
                        Create
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateEntityDataTableCheck;
