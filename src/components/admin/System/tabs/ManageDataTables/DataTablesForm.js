import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import './DataTablesForm.css';
import axios from "axios";
import {FaEdit, FaTrash} from "react-icons/fa";
import {NotificationContext} from "../../../../../context/NotificationContext";

const DataTableForm = ({ setActiveTab }) => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();

    const [originalModalData, setOriginalModalData] = useState(null);

    const [formData, setFormData] = useState({
        datatableName: '',
        apptableName: '',
        entitySubType: '',
        multiRow: false,
        columns: [],
    });
    const [entityOptions] = useState([
        { value: "Client", tableName: "m_client" },
        { value: "Group", tableName: "m_group" },
        { value: "Center", tableName: "m_center" },
        { value: "Office", tableName: "m_office" },
        { value: "Loan Account", tableName: "m_loan" },
        { value: "Saving Account", tableName: "m_savings_account" },
        { value: "Loan Product", tableName: "m_loan_product" },
        { value: "Saving Account Transaction", tableName: "m_savings_transaction" },
        { value: "Savings Product", tableName: "m_savings_product" },
        { value: "Share Product", tableName: "m_share_product" },
    ]);
    const [subTypeOptions] = useState([
        { value: "Savings Product" },
        { value: "Fixed Deposit" },
        { value: "Recurring Deposit" },
    ]);
    const [codeOptions, setCodeOptions] = useState([]);
    const [columns, setColumns] = useState([]);
    const [modalData, setModalData] = useState(null);

    useEffect(() => {
        const fetchCodeOptions = async () => {
            startLoading();
            try {
                const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/codes`, {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        "Content-Type": "application/json",
                    },
                });

                if (Array.isArray(response.data)) {
                    setCodeOptions(response.data);
                } else {
                    console.error("Unexpected response format:", response.data);
                    setCodeOptions([]);
                }
            } catch (error) {
                console.error("Error fetching code options:", error);
                setCodeOptions([]);
            } finally {
                stopLoading();
            }
        };

        fetchCodeOptions();
    }, []);

    const handleFieldChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleAddColumn = () => {
        if (
            modalData &&
            modalData.columnName &&
            modalData.columnType &&
            (modalData.columnType !== "Dropdown" || modalData.columnCode) &&
            (modalData.columnType !== "String" || modalData.columnLength)
        ) {
            if (modalData.id) {
                setColumns((prev) =>
                    prev.map((col) => (col.id === modalData.id ? { ...modalData } : col))
                );
            } else {
                setColumns((prev) => [...prev, { ...modalData, id: Date.now() }]);
            }
            setModalData(null);
        }
    };

    const handleEditColumn = (id) => {
        const columnToEdit = columns.find((column) => column.id === id);
        if (columnToEdit) {
            setModalData({ ...columnToEdit });
            setOriginalModalData({ ...columnToEdit });
        }
    };

    const handleDeleteColumn = (id) => {
        setColumns((prev) => prev.filter((column) => column.id !== id));
    };

    const handleSubmit = async () => {
        const payload = {
            datatableName: formData.datatableName,
            apptableName: formData.apptableName,
            multiRow: formData.multiRow,
            entitySubType: formData.entitySubType || undefined,
            columns: columns.map(({ id, columnName, columnType, mandatory, indexed, columnCode, unique }) => {
                const columnPayload = {
                    name: columnName,
                    type: columnType,
                    mandatory: mandatory || false,
                    indexed: indexed || false,
                    unique: unique || false,
                };

                if (columnType === "Dropdown") {
                    columnPayload.code = columnCode;
                }

                return columnPayload;
            }),
        };

        startLoading();
        try {
            const response = await axios.post(`${API_CONFIG.proxy}/fineract-provider/api/v1/datatables`, payload, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.status === 200) {
                setFormData({
                    datatableName: '',
                    apptableName: '',
                    entitySubType: '',
                    multiRow: false,
                    columns: [],
                });
                setColumns([]);

                setActiveTab('viewTables', { resourceIdentifier: response.data.resourceIdentifier });
            } else {
                console.error("Unexpected response:", response.data);
            }
        } catch (error) {
            console.error("Error creating data table:", error.response?.data || error.message);
            showNotification("Error creating data table!", 'error');
        } finally {
            stopLoading();
        }
    };

    return (
        <>
            <div className="data-table-form-container">
                <div className="data-table-form-section">
                    <div className="data-table-form-row">
                        <div className="data-table-form-field">
                            <label>Data Table Name <span>*</span></label>
                            <input
                                type="text"
                                className="data-table-form-datatable-name"
                                value={formData.datatableName}
                                onChange={(e) => handleFieldChange("datatableName", e.target.value)}
                                required
                            />
                        </div>
                        <div className="data-table-form-field">
                            <label>Entity Type <span>*</span></label>
                            <select
                                className="data-table-form-entity-type"
                                value={entityOptions.find((opt) => opt.tableName === formData.apptableName)?.value || ""}
                                onChange={(e) => {
                                    const selected = entityOptions.find((opt) => opt.value === e.target.value);
                                    handleFieldChange("apptableName", selected?.tableName || "");
                                    handleFieldChange("entitySubType", "");
                                }}
                                required
                            >
                                <option value="">Select Entity</option>
                                {entityOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.value}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {formData.apptableName === "m_savings_product" && (
                        <div className="data-table-form-row">
                            <div className="data-table-form-field">
                                <label>Savings SubType</label>
                                <select
                                    className="data-table-form-subtype"
                                    value={formData.entitySubType}
                                    onChange={(e) => handleFieldChange("entitySubType", e.target.value)}
                                >
                                    <option value="">Select SubType</option>
                                    {subTypeOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {formData.apptableName === "m_client" && (
                        <div className="data-table-form-row">
                            <div className="data-table-form-field">
                                <label>Entity SubType</label>
                                <select
                                    className="data-table-form-subtype"
                                    value={formData.entitySubType}
                                    onChange={(e) => handleFieldChange("entitySubType", e.target.value)}
                                >
                                    <option value="">Select SubType</option>
                                    <option value="Person">Person</option>
                                    <option value="Entity">Entity</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="data-table-form-field">
                        <label>
                            <input
                                type="checkbox"
                                className="data-table-form-multirow"
                                checked={formData.multiRow}
                                onChange={(e) => handleFieldChange("multiRow", e.target.checked)}
                            />
                            Multi Row
                        </label>
                    </div>
                </div>

                <div className="data-table-form-columns-header">
                    <h4 className="data-table-form-columns-title">Columns</h4>
                    <button
                        className="data-table-form-add-column-button"
                        onClick={() => setModalData({})}
                    >
                        Add Column
                    </button>
                </div>
                {columns.length > 0 && (
                    <div className="data-table-form-columns-table-container">
                        <table className="data-table-form-columns-table">
                            <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Length</th>
                                <th>Code</th>
                                <th>Mandatory</th>
                                <th>Unique</th>
                                <th>Indexed</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {columns.map((col) => (
                                <tr key={col.id}>
                                    <td>{col.columnName}</td>
                                    <td>{col.columnType}</td>
                                    <td>{col.columnLength || ""}</td>
                                    <td>{col.columnCode || ""}</td>
                                    <td>
                                        <span
                                            className={`data-table-form-indicator ${
                                                col.mandatory ? "indicator-yes" : "indicator-no"
                                            }`}
                                        >
                                        </span>
                                    </td>
                                    <td>
                                        <span
                                            className={`data-table-form-indicator ${
                                                col.unique ? "indicator-yes" : "indicator-no"
                                            }`}
                                        >
                                        </span>
                                    </td>
                                    <td>
                                        <span
                                            className={`data-table-form-indicator ${
                                                col.indexed ? "indicator-yes" : "indicator-no"
                                            }`}
                                        >
                                        </span>
                                    </td>

                                    <td className="data-table-form-actions">
                                        <button
                                            className="data-table-form-action-button"
                                            onClick={() => handleEditColumn(col.id)}
                                        >
                                            <FaEdit color={'#85d621'}/>
                                        </button>
                                        <button
                                            className="data-table-form-action-button"
                                            onClick={() => handleDeleteColumn(col.id)}
                                        >
                                            <FaTrash color={'#e61f1f'}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="data-table-form-submit-container">
                    <button
                        className="data-table-form-submit-button"
                        onClick={handleSubmit}
                        disabled={!formData.datatableName || !formData.apptableName || columns.length === 0}
                    >
                        Submit
                    </button>
                </div>
            </div>
            {modalData && (
                <div className="data-table-form-modal-backdrop" onClick={() => setModalData(null)}>
                    <div
                        className="data-table-form-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h5>{modalData.id ? "Edit Column" : "Add Column"}</h5>
                        <div className="data-table-form-modal-body">
                            <div className={'data-table-form-field'} >
                                <label htmlFor="">Column Name <span>*</span></label>
                                <input
                                    type="text"
                                    className="data-table-form-modal-column-name"
                                    placeholder="Column Name"
                                    value={modalData.columnName || ""}
                                    onChange={(e) =>
                                        setModalData((prev) => ({
                                            ...prev,
                                            columnName: e.target.value,
                                        }))
                                    }
                                    required
                                />
                            </div>
                            <div className={"data-table-form-field"}>
                                <label htmlFor="">Column Type <span>*</span></label>
                                <select
                                    className="data-table-form-modal-column-type"
                                    value={modalData.columnType || ""}
                                    onChange={(e) =>
                                        setModalData((prev) => ({
                                            ...prev,
                                            columnType: e.target.value,
                                        }))
                                    }
                                    required
                                >
                                    <option value="">Select Type</option>
                                    {[
                                        "Boolean",
                                        "Date",
                                        "Date and Time",
                                        "Decimal",
                                        "Dropdown",
                                        "Number",
                                        "String",
                                        "Text",
                                    ].map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {modalData.columnType === "Dropdown" && (
                                <div className={'data-table-form-field'} >
                                    <label htmlFor="">Column Code <span>*</span></label>
                                    <select
                                        className="data-table-form-modal-column-code"
                                        value={modalData.columnCode || ""}
                                        onChange={(e) =>
                                            setModalData((prev) => ({
                                                ...prev,
                                                columnCode: e.target.value,
                                            }))
                                        }
                                        required
                                    >
                                        <option value="">Select Code</option>
                                        {codeOptions.map((code) => (
                                            <option key={code.id} value={code.name}>
                                                {code.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {modalData.columnType === "String" && (
                                <div className={'data-table-form-field'} >
                                    <label htmlFor="">Column Length <span>*</span></label>
                                    <input
                                        type="number"
                                        className="data-table-form-modal-column-length"
                                        placeholder="Column Length"
                                        value={modalData.columnLength || ""}
                                        onChange={(e) =>
                                            setModalData((prev) => ({
                                                ...prev,
                                                columnLength: e.target.value,
                                            }))
                                        }
                                        required
                                    />
                                </div>
                            )}
                            <div className="data-table-form-modal-checkboxes">
                                <label className="data-table-form-modal-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={modalData.mandatory || false}
                                        onChange={(e) =>
                                            setModalData((prev) => ({
                                                ...prev,
                                                mandatory: e.target.checked,
                                            }))
                                        }
                                    />
                                    Mandatory
                                </label>
                                <label className="data-table-form-modal-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={modalData.unique || false}
                                        disabled={!!modalData.id}
                                        onChange={(e) =>
                                            setModalData((prev) => ({
                                                ...prev,
                                                unique: e.target.checked,
                                            }))
                                        }
                                    />
                                    Unique
                                </label>
                                <label className="data-table-form-modal-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={modalData.indexed || false}
                                        onChange={(e) =>
                                            setModalData((prev) => ({
                                                ...prev,
                                                indexed: e.target.checked,
                                            }))
                                        }
                                    />
                                    Indexed
                                </label>
                            </div>
                        </div>
                        <div className="data-table-form-modal-footer">
                            <button
                                className="data-table-form-modal-cancel-button"
                                onClick={() => setModalData(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="data-table-form-modal-save-button"
                                onClick={handleAddColumn}
                                disabled={
                                    (!modalData.columnName || !modalData.columnType) ||
                                    (modalData.columnType === "Dropdown" && !modalData.columnCode) ||
                                    (modalData.columnType === "String" && !modalData.columnLength) ||
                                    (modalData.id && JSON.stringify(modalData) === JSON.stringify(originalModalData))
                                }
                            >
                                {modalData.id ? "Save Changes" : "Add Column"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default DataTableForm;
