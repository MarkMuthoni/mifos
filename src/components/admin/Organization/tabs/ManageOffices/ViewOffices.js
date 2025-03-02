import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import './ViewOffices.css';
import {NotificationContext} from "../../../../../context/NotificationContext";

const ViewOffices = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const [offices, setOffices] = useState([]);
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [nameFilter, setNameFilter] = useState('');
    const [totalPages, setTotalPages] = useState(1);

    const [selectedOffice, setSelectedOffice] = useState(null);
    const [isOfficeModalOpen, setIsOfficeModalOpen] = useState(false);

    useEffect(() => {
        fetchOffices();
    }, []);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredOffices().length / pageSize));
    }, [offices, nameFilter, pageSize]);

    const fetchOffices = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/offices`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setOffices(response.data || []);
        } catch (error) {
            console.error('Error fetching offices:', error);
        } finally {
            stopLoading();
        }
    };

    const filteredOffices = () =>
        offices.filter((office) =>
            office.name.toLowerCase().includes(nameFilter.toLowerCase())
        );

    const paginatedData = filteredOffices().slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handleRowClick = async (office) => {
        startLoading();
        try {
            const response = await axios.get(
                `/fineract-provider/api/v1/offices/${office.id}?template=false`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            setSelectedOffice(response.data);
            setIsOfficeModalOpen(true);
        } catch (error) {
            console.error("Error fetching office details:", error);
        } finally {
            stopLoading();
        }
    };

    const handleOfficeModalSubmit = async (updatedOffice) => {
        startLoading();
        try {
            const response = await axios.put(
                `/fineract-provider/api/v1/offices/${selectedOffice.id}`,
                updatedOffice,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            showNotification("Office updated successfully:", 'success');
            setIsOfficeModalOpen(false);
            fetchOffices();
        } catch (error) {
            console.error("Error updating office:", error);
        } finally {
            stopLoading();
        }
    };

    const OfficeModal = ({ isOpen, onClose, office, onSubmit, offices }) => {
        const [formData, setFormData] = useState({
            name: office?.name || "",
            parentId: office?.parentId || "",
            openingDate: office?.openingDate || "",
            externalId: office?.externalId || "",
        });

        useEffect(() => {
            if (office) {
                setFormData({
                    name: office?.name || "",
                    parentId: office?.parentId || "",
                    openingDate: office?.openingDate || "",
                    externalId: office?.externalId || "",
                });
            }
        }, [office]);

        const handleFieldChange = (field, value) => {
            setFormData((prev) => ({ ...prev, [field]: value }));
        };

        const handleSubmit = () => {
            const transformedData = {
                ...formData,
                dateFormat: "dd MMMM yyyy",
                locale: "en",
                openingDate: new Date(formData.openingDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                }),
            };
            onSubmit(transformedData);
        };

        if (!isOpen) return null;

        return (
            <div className="edit-modal-overlay">
                <div className="edit-modal-content">
                    <h3 className="staged-form-title">Edit Office Details</h3>
                    <div className="staged-form-field">
                        <label>Office Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleFieldChange("name", e.target.value)}
                            className="staged-form-input"
                        />
                    </div>
                    <div className="staged-form-field">
                        <label>Parent Office</label>
                        <select
                            value={formData.parentId}
                            onChange={(e) => handleFieldChange("parentId", e.target.value)}
                            className="staged-form-select"
                        >
                            <option value="">Select Parent Office</option>
                            {offices.map((o) => (
                                <option key={o.id} value={o.id}>
                                    {o.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="staged-form-field">
                        <label>Opened On</label>
                        <input
                            type="date"
                            value={
                                Array.isArray(formData.openingDate)
                                    ? new Date(formData.openingDate[0], formData.openingDate[1] - 1, formData.openingDate[2] + 1)
                                        .toISOString()
                                        .split("T")[0]
                                    : formData.openingDate?.split("T")[0] || ""
                            }
                            onChange={(e) => handleFieldChange("openingDate", e.target.value)}
                            className="staged-form-input"
                        />
                    </div>
                    <div className="staged-form-field">
                        <label>External ID</label>
                        <input
                            type="text"
                            value={formData.externalId}
                            onChange={(e) => handleFieldChange("externalId", e.target.value)}
                            className="staged-form-input"
                        />
                    </div>
                    <div className="modal-actions">
                        <button className="modal-cancel-button" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            className="modal-submit-button"
                            onClick={handleSubmit}
                            disabled={
                                !formData.name || !formData.parentId || !formData.openingDate
                            }
                        >
                            Submit
                        </button>
                    </div>
                </div>
            </div>
        );
    };


    const formatDate = (dateArray) => {
        if (!dateArray || dateArray.length !== 3) return ' ';
        const [year, month, day] = dateArray;

        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="view-offices">
            <div className="table-controls">
                <div className="filter-container">
                    <label htmlFor="nameFilter">Filter by Name:</label>
                    <input
                        type="text"
                        id="nameFilter"
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                        placeholder="Enter office name..."
                    />
                </div>
                <div className="page-size-selector">
                    <label>Rows per page:</label>
                    <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>
            <table className="offices-table">
                <thead>
                <tr>
                    <th>Office Name</th>
                    <th>External ID</th>
                    <th>Parent Office</th>
                    <th>Opened On</th>
                </tr>
                </thead>
                <tbody>
                {paginatedData.length > 0 ? (
                    paginatedData.map((office) => (
                        <tr
                            key={office.id}
                            onClick={() => handleRowClick(office)}
                            className="clickable-row"
                        >
                            <td>{office.name || ''}</td>
                            <td>{office.externalId || ''}</td>
                            <td>{office.parentName || ''}</td>
                            <td>{formatDate(office.openingDate)}</td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="4" className="no-data">No offices available.</td>
                    </tr>
                )}
                </tbody>
            </table>
            {totalPages > 1 && (
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
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                    <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                    >
                        End
                    </button>
                </div>
            )}

            <OfficeModal
                isOpen={isOfficeModalOpen}
                onClose={() => setIsOfficeModalOpen(false)}
                office={selectedOffice}
                onSubmit={handleOfficeModalSubmit}
                offices={offices}
            />
        </div>
    );
};

export default ViewOffices;
