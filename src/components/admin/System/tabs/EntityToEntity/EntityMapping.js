import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import { Link } from 'react-router-dom';
import './EntityMapping.css';
import { FiLink } from 'react-icons/fi';
import {FaEdit, FaTrash} from "react-icons/fa";
import {NotificationContext} from "../../../../../context/NotificationContext";

const EntityMapping = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const [mappings, setMappings] = useState([]);
    const [selectedMapping, setSelectedMapping] = useState(null);
    const [fieldData, setFieldData] = useState({ firstField: [], secondField: [] });
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [formValuesByMapping, setFormValuesByMapping] = useState({});
    const [hasSubmittedByMapping, setHasSubmittedByMapping] = useState({});

    const [mappingDetails, setMappingDetails] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalFormValues, setModalFormValues] = useState({
        startDate: '',
        endDate: '',
    });

    useEffect(() => {
        fetchMappings();
    }, []);

    const fetchMappings = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/entitytoentitymapping`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setMappings(response.data || []);
        } catch (error) {
            console.error('Error fetching entity mappings:', error);
            showNotification('Error fetching entity mappings!', 'error');
        } finally {
            stopLoading();
        }
    };

    const fetchFieldData = async (mappingType) => {
        const parts = mappingType.split('access_to_');

        const firstPart = parts[0].replace(/_/g, '');

        const secondPartRaw = parts[1];
        const secondPart = secondPartRaw.includes('/')
            ? secondPartRaw.split('/').pop()
            : secondPartRaw.replace(/_/g, '');

        try {
            const [firstResponse, secondResponse] = await Promise.all([
                axios.get(`/fineract-provider/api/v1/${firstPart}s`, {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    },
                }),
                axios.get(`/fineract-provider/api/v1/${secondPart}`, {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    },
                }),
            ]);
            setFieldData({
                firstField: firstResponse.data || [],
                secondField: secondResponse.data || [],
            });
        } catch (error) {
            console.error('Error fetching field data:', error);
            showNotification('Error fetching field data!', 'error');
        }
    };

    const handleRowClick = (mapping) => {
        setSelectedMapping(mapping);

        if (!formValuesByMapping[mapping.id]) {
            setFormValuesByMapping((prev) => ({
                ...prev,
                [mapping.id]: { first: '', second: '' },
            }));
        }

        fetchFieldData(mapping.mappingTypes);
    };

    const handleFieldChange = (e) => {
        const { name, value } = e.target;
        if (selectedMapping) {
            setFormValuesByMapping((prev) => ({
                ...prev,
                [selectedMapping.id]: {
                    ...prev[selectedMapping.id],
                    [name]: value,
                },
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const currentFormValues = formValuesByMapping[selectedMapping?.id];
        if (!currentFormValues?.first || !currentFormValues?.second) {
            showNotification('Both fields are mandatory! Please fill them before submitting!', 'info');
            return;
        }

        try {
            startLoading();
            const response = await axios.get(
                `/fineract-provider/api/v1/entitytoentitymapping/${selectedMapping.id}/${currentFormValues.first}/${currentFormValues.second}`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    },
                }
            );
            setMappingDetails((prev) => ({
                ...prev,
                [selectedMapping.id]: response.data || [],
            }));
            setHasSubmittedByMapping((prev) => ({
                ...prev,
                [selectedMapping.id]: true,
            }));
        } catch (error) {
            console.error('Error fetching mapping details:', error);
        } finally {
            stopLoading();
        }
    };

    const paginatedMappings = mappings.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
        setCurrentPage(1);
    };

    const transformMappingType = (mappingType) => {
        const parts = mappingType.split('access_to_');
        return (
            <>
                {parts[0].replace(/_/g, ' ')}
                <FiLink className="mapping-icon" />
                {parts[1].replace(/_/g, ' ')}
            </>
        );
    };

    const transformMappingTypeToTitle = (mappingType) => {
        if (!mappingType) return '';
        const sentenceCase = mappingType
            .replace(/_/g, ' ')
            .toLowerCase()
            .replace(/^\w/, (c) => c.toUpperCase());
        return sentenceCase;
    };

    const handleModalSubmit = async (e) => {
        e.preventDefault();

        if (!modalFormValues.firstEntity || !modalFormValues.secondEntity || !modalFormValues.startDate || !modalFormValues.endDate) {
            showNotification('All fields are mandatory! Please fill them before submitting!', 'info');
            return;
        }

        const payload = {
            fromId: modalFormValues.firstEntity,
            toId: modalFormValues.secondEntity,
            startDate: modalFormValues.startDate,
            endDate: modalFormValues.endDate,
            dateFormat: 'dd MMMM yyyy',
            locale: 'en',
        };

        try {
            startLoading();
            await axios.post(
                `/fineract-provider/api/v1/entitytoentitymapping/${selectedMapping?.id}`,
                payload,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const currentFormValues = formValuesByMapping[selectedMapping?.id];
            const response = await axios.get(
                `/fineract-provider/api/v1/entitytoentitymapping/${selectedMapping.id}/${currentFormValues.first}/${currentFormValues.second}`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    },
                }
            );

            setMappingDetails((prev) => ({
                ...prev,
                [selectedMapping.id]: response.data || [],
            }));

        } catch (error) {
            console.error('Error adding mapping:', error);
            showNotification('Failed to add mapping! Please try again!', 'error');
        } finally {
            stopLoading();
            setIsModalOpen(false);

            setModalFormValues({
                firstEntity: '',
                secondEntity: '',
                startDate: '',
                endDate: '',
            });
        }
    };

    const handleEditClick = (detail) => {
        setModalFormValues({
            firstEntity: detail.office,
            secondEntity: detail.savingProducts,
            startDate: detail.startDate,
            endDate: detail.endDate,
        });
        setIsModalOpen(true);
    };


    return (
        <div className="entity-mapping-page neighbor-element">
            <h2 className="page-heading">
                <Link to="/system" className="breadcrumb-link">System</Link> . Entity to Entity Mapping
            </h2>
            <div className="mapping-controls">
                <div className="page-size-selector">
                    <label>Rows per page:</label>
                    <select value={pageSize} onChange={handlePageSizeChange}>
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>
            <table className="mapping-table">
                <thead>
                <tr>
                    <th>Mapping Between Entities</th>
                </tr>
                </thead>
                <tbody>
                {paginatedMappings.length > 0 ? (
                    paginatedMappings.map((mapping) => (
                        <>
                            <tr
                                key={mapping.id}
                                onClick={() => handleRowClick(mapping)}
                                className={`clickable-row ${
                                    selectedMapping?.id === mapping.id ? 'active-row' : ''
                                }`}
                            >
                                <td>{transformMappingType(mapping.mappingTypes)}</td>
                            </tr>
                            {selectedMapping?.id === mapping.id && (
                                <tr className="entity-mapping-form">
                                    <td colSpan="1">
                                        <div className="entity-mapping-form">
                                            <h3 className="entity-mapping-form-title">
                                                {transformMappingTypeToTitle(mapping.mappingTypes)}
                                            </h3>
                                            <form onSubmit={handleSubmit} className={'entity-form'}>
                                                <div className="entity-mapping-form-row">
                                                    <div className="entity-mapping-form-group">
                                                        <label
                                                            htmlFor="firstField">{selectedMapping?.mappingTypes.split('access_to_')[0].replace(/_/g, ' ') || 'First Entity'}<span>*</span></label>
                                                        <select
                                                            id="firstField"
                                                            name="first"
                                                            value={formValuesByMapping[selectedMapping?.id]?.first || ''}
                                                            onChange={handleFieldChange}
                                                            className="entity-mapping-select"
                                                        >
                                                            <option value="">Select</option>
                                                            <option value="all">All</option>
                                                            {fieldData.firstField.map((item) => (
                                                                <option key={item.id} value={item.id}>
                                                                    {item.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="entity-mapping-form-group">
                                                        <label
                                                            htmlFor="secondField">{selectedMapping?.mappingTypes.split('access_to_')[1]?.replace(/_/g, ' ').split('/').pop() || 'Second Entity'}<span>*</span></label>
                                                        <select
                                                            id="secondField"
                                                            name="second"
                                                            value={formValuesByMapping[selectedMapping?.id]?.second || ''}
                                                            onChange={handleFieldChange}
                                                            className="entity-mapping-select"
                                                        >
                                                            <option value="">Select</option>
                                                            <option value="all">All</option>
                                                            {fieldData.secondField.map((item) => (
                                                                <option key={item.id} value={item.id}>
                                                                    {item.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="form-actions">
                                                    <button
                                                        type="submit"
                                                        className="entity-mapping-submit-button"
                                                        disabled={
                                                            !formValuesByMapping[selectedMapping?.id]?.first ||
                                                            !formValuesByMapping[selectedMapping?.id]?.second ||
                                                            formValuesByMapping[selectedMapping?.id]?.first === "all" ||
                                                            formValuesByMapping[selectedMapping?.id]?.second === "all"
                                                        }
                                                    >
                                                        Submit
                                                    </button>
                                                    {hasSubmittedByMapping[selectedMapping?.id] && (
                                                        <button
                                                            type="button"
                                                            className="add-button"
                                                            onClick={() => {
                                                                setModalFormValues({
                                                                    firstEntity: '',
                                                                    secondEntity: '',
                                                                    startDate: '',
                                                                    endDate: '',
                                                                });
                                                                setIsModalOpen(true);
                                                            }}
                                                        >
                                                            Add
                                                        </button>
                                                    )}
                                                </div>
                                            </form>
                                            {hasSubmittedByMapping[selectedMapping?.id] && (
                                                mappingDetails[selectedMapping?.id] && mappingDetails[selectedMapping?.id].length > 0 ? (
                                                <div className="mapping-details-table">
                                                    <table>
                                                        <thead>
                                                        <tr>
                                                            <th>
                                                                {selectedMapping?.mappingTypes
                                                                    .split('access_to_')[0]
                                                                    .replace(/_/g, ' ') || 'First Entity'}
                                                            </th>
                                                            <th>
                                                                {selectedMapping?.mappingTypes
                                                                    .split('access_to_')[1]
                                                                    ?.replace(/_/g, ' ')
                                                                    .split('/')
                                                                    .pop() || 'Second Entity'}
                                                            </th>
                                                            <th>Start Date</th>
                                                            <th>End Date</th>
                                                            <th>Actions</th>
                                                        </tr>
                                                        </thead>
                                                        <tbody>
                                                        {mappingDetails[selectedMapping.id].map((detail) => (
                                                            <tr key={detail.id}>
                                                                <td>{detail[selectedMapping?.mappingTypes.split('access_to_')[0].replace(/_/g, '')] || ''}</td>
                                                                <td>
                                                                    {detail[
                                                                        selectedMapping?.mappingTypes.split('access_to_')[1]?.replace(/_/g, '').split('/').pop()
                                                                        ] || ''}
                                                                </td>
                                                                <td>{new Date(detail.startDate).toLocaleDateString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric'
                                                                })}</td>
                                                                <td>{new Date(detail.endDate).toLocaleDateString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric'
                                                                })}</td>
                                                                <td>
                                                                    <button className=""
                                                                            onClick={() => handleEditClick(detail)}>
                                                                        <FaEdit color={"#85fb1d"}/>
                                                                    </button>
                                                                    <button className=""
                                                                            onClick={() => console.log('Delete', detail.id)}>
                                                                        <FaTrash color={"#f00"}/>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                ) : (
                                                    <div className="no-data">
                                                        <p>No data available for this mapping. You can add new
                                                            entries.</p>
                                                    </div>
                                                ))}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </>
                    ))
                ) : (
                    <tr>
                        <td colSpan="1" className="no-data">
                            No mappings available
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
            {mappings.length > pageSize && (
                <div className="pagination">
                    <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                        Start
                    </button>
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    <span>
                        Page {currentPage} of {Math.ceil(mappings.length / pageSize)}
                    </span>
                    <button
                        onClick={() =>
                            setCurrentPage((prev) =>
                                Math.min(prev + 1, Math.ceil(mappings.length / pageSize))
                            )
                        }
                        disabled={currentPage === Math.ceil(mappings.length / pageSize)}
                    >
                        Next
                    </button>
                    <button
                        onClick={() => setCurrentPage(Math.ceil(mappings.length / pageSize))}
                        disabled={currentPage === Math.ceil(mappings.length / pageSize)}
                    >
                        End
                    </button>
                </div>
            )}
            {isModalOpen && (
                <div className="edit-modal-overlay">
                    <div className="edit-modal-content">
                        <h3 className={"staged-form-title"}>Add New Mapping</h3>
                        <form
                            onSubmit={(e) => {
                                handleModalSubmit();
                            }}
                        >
                            <div className="staged-form-field">
                                <label>
                                    {selectedMapping?.mappingTypes.split('access_to_')[0].replace(/_/g, ' ') || 'First Entity'}
                                    <span>*</span>
                                </label>
                                <select
                                    value={modalFormValues.firstEntity || ''}
                                    onChange={(e) =>
                                        setModalFormValues((prev) => ({...prev, firstEntity: e.target.value}))
                                    }
                                    className="staged-form-input"
                                >
                                    <option value="">Select</option>
                                    {fieldData.firstField.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="staged-form-field">
                                <label>
                                    {selectedMapping?.mappingTypes.split('access_to_')[1]?.replace(/_/g, ' ').split('/').pop() || 'Second Entity'}
                                    <span>*</span>
                                </label>
                                <select
                                    value={modalFormValues.secondEntity || ''}
                                    onChange={(e) =>
                                        setModalFormValues((prev) => ({...prev, secondEntity: e.target.value}))
                                    }
                                    className="staged-form-input"
                                >
                                    <option value="">Select</option>
                                    {fieldData.secondField.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="staged-form-field">
                                <label>Start Date</label>
                                <input
                                    type="date"
                                    value={modalFormValues.startDate}
                                    onChange={(e) =>
                                        setModalFormValues((prev) => ({
                                            ...prev,
                                            startDate: e.target.value,
                                        }))
                                    }
                                    className="staged-form-input"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label>End Date</label>
                                <input
                                    type="date"
                                    value={modalFormValues.endDate}
                                    onChange={(e) =>
                                        setModalFormValues((prev) => ({
                                            ...prev,
                                            endDate: e.target.value,
                                        }))
                                    }
                                    className="staged-form-input"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className={"cancel-button"} onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className={"entity-mapping-submit-button"}>Add</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EntityMapping;
