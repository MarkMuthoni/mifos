import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../../context/AuthContext';
import { useLoading } from '../../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../../config';
import './ViewDelinquencyRanges.css';
import {NotificationContext} from "../../../../../../context/NotificationContext";

const ViewDelinquencyRanges = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const [ranges, setRanges] = useState([]);
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [classificationFilter, setClassificationFilter] = useState('');
    const [totalPages, setTotalPages] = useState(1);
    const [selectedRange, setSelectedRange] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchDelinquencyRanges();
    }, []);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredRanges().length / pageSize));
    }, [ranges, classificationFilter, pageSize]);

    const fetchDelinquencyRanges = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/delinquency/ranges`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setRanges(response.data || []);
        } catch (error) {
            console.error('Error fetching delinquency ranges:', error);
        } finally {
            stopLoading();
        }
    };

    const filteredRanges = () =>
        ranges.filter((range) =>
            range.classification?.toLowerCase().includes(classificationFilter.toLowerCase())
        );

    const paginatedData = filteredRanges().slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handleRowClick = async (range) => {
        startLoading();
        try {
            const response = await axios.get(
                `/fineract-provider/api/v1/delinquency/ranges/${range.id}`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            setSelectedRange(response.data);
            setIsModalOpen(true);
        } catch (error) {
            console.error('Error fetching delinquency range details:', error);
        } finally {
            stopLoading();
        }
    };

    const handleModalSubmit = async (updatedRange) => {
        startLoading();
        try {
            const response = await axios.put(
                `/fineract-provider/api/v1/delinquency/ranges/${selectedRange.id}`,
                updatedRange,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            showNotification('Delinquency range updated successfully:', 'success');
            setIsModalOpen(false);
            fetchDelinquencyRanges();
        } catch (error) {
            console.error('Error updating delinquency range:', error);
            showNotification('Error updating delinquency range:', 'error');
        } finally {
            stopLoading();
        }
    };

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this delinquency range?")) {
            startLoading();
            try {
                await axios.delete(
                    `/fineract-provider/api/v1/delinquency/ranges/${selectedRange.id}`,
                    {
                        headers: {
                            Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                            'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );
                showNotification('Delinquency range deleted successfully!', 'success');
                setIsModalOpen(false);
                fetchDelinquencyRanges();
            } catch (error) {
                console.error('Error deleting delinquency range:', error);
                showNotification('Error deleting delinquency range:', 'error');
            } finally {
                stopLoading();
            }
        }
    };

    const DelinquencyModal = ({ isOpen, onClose, range, onSubmit, onDelete }) => {
        const [formData, setFormData] = useState({});
        const [isChanged, setIsChanged] = useState(false);

        useEffect(() => {
            if (range) {
                const initialData = {
                    classification: range.classification || '',
                    minimumAgeDays: range.minimumAgeDays || '',
                    maximumAgeDays: range.maximumAgeDays || '',
                };
                setFormData(initialData);
                setIsChanged(false);
            }
        }, [range]);

        const handleFieldChange = (field, value) => {
            setFormData((prev) => {
                const updatedData = { ...prev, [field]: value };
                setIsChanged(JSON.stringify(updatedData) !== JSON.stringify(range));
                return updatedData;
            });
        };

        const handleSubmit = () => {
            const payload = {
                ...formData,
                locale: 'en',
            };
            onSubmit(payload);
        };

        if (!isOpen) return null;

        return (
            <div className="edit-modal-overlay">
                <div className="edit-modal-content">
                    <h3 className={"staged-form-title"}>Edit Delinquency Range</h3>
                    <div className="staged-form-field">
                        <label>
                            Classification <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.classification}
                            onChange={(e) => handleFieldChange('classification', e.target.value)}
                            className="staged-form-input"
                        />
                    </div>
                    <div className="staged-form-field">
                        <label>
                            Days From <span className="required">*</span>
                        </label>
                        <input
                            type="number"
                            value={formData.minimumAgeDays}
                            onChange={(e) => handleFieldChange('minimumAgeDays', e.target.value)}
                            className="staged-form-input"
                        />
                    </div>
                    <div className="staged-form-field">
                        <label>Days Till</label>
                        <input
                            type="number"
                            value={formData.maximumAgeDays}
                            onChange={(e) => handleFieldChange('maximumAgeDays', e.target.value)}
                            className="staged-form-input"
                        />
                    </div>
                    <div className="modal-actions">
                        <button className="modal-cancel-button" onClick={onClose}>
                            Cancel
                        </button>
                        <button className="modal-delete-button" onClick={onDelete}>
                            Delete
                        </button>
                        <button
                            className="modal-submit-button"
                            onClick={handleSubmit}
                            disabled={
                                !isChanged ||
                                !formData.classification ||
                                !formData.minimumAgeDays
                            }
                        >
                            Submit
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="view-delinquency-ranges">
            <div className="table-controls">
                <div className="filter-container">
                    <div className="filter-item">
                        <label htmlFor="classificationFilter">Filter by Classification:</label>
                        <input
                            type="text"
                            id="classificationFilter"
                            value={classificationFilter}
                            onChange={(e) => setClassificationFilter(e.target.value)}
                            placeholder="Search by classification..."
                        />
                    </div>
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
            <table className="delinquency-ranges-table">
                <thead>
                <tr>
                    <th>Classification</th>
                    <th>Days From</th>
                    <th>Days Till</th>
                </tr>
                </thead>
                <tbody>
                {paginatedData.length > 0 ? (
                    paginatedData.map((range) => (
                        <tr
                            key={range.id}
                            onClick={() => handleRowClick(range)}
                            className="clickable-row"
                        >
                            <td>{range.classification}</td>
                            <td>{range.minimumAgeDays}</td>
                            <td>{range.maximumAgeDays}</td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="3" className="no-data">No delinquency ranges available.</td>
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

            <DelinquencyModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                range={selectedRange}
                onSubmit={handleModalSubmit}
                onDelete={handleDelete}
            />
        </div>
    );
};

export default ViewDelinquencyRanges;
