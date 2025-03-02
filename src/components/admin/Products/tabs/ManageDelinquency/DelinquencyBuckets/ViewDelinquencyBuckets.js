import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../../context/AuthContext';
import { useLoading } from '../../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../../config';
import './ViewDelinquencyBuckets.css';
import { FaTrash } from 'react-icons/fa';
import {NotificationContext} from "../../../../../../context/NotificationContext";

const ViewDelinquencyBuckets = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const [buckets, setBuckets] = useState([]);
    const [ranges, setRanges] = useState([]);
    const [selectedBucket, setSelectedBucket] = useState(null);
    const [bucketRanges, setBucketRanges] = useState([]);
    const [isBucketModalOpen, setIsBucketModalOpen] = useState(false);
    const [isRangeModalOpen, setIsRangeModalOpen] = useState(false);
    const [selectedRange, setSelectedRange] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [nameFilter, setNameFilter] = useState('');
    const [totalPages, setTotalPages] = useState(1);
    const [originalRanges, setOriginalRanges] = useState([]);

    useEffect(() => {
        fetchDelinquencyBuckets();
        fetchDelinquencyRanges();
    }, []);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredBuckets().length / pageSize));
    }, [buckets, nameFilter, pageSize]);

    const fetchDelinquencyBuckets = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/delinquency/buckets`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setBuckets(response.data || []);
        } catch (error) {
            console.error('Error fetching delinquency buckets:', error);
        } finally {
            stopLoading();
        }
    };

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

    const filteredBuckets = () =>
        buckets.filter((bucket) =>
            bucket.name?.toLowerCase().includes(nameFilter.toLowerCase())
        );

    const paginatedData = filteredBuckets().slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handleRowClick = async (bucket) => {
        startLoading();
        try {
            const response = await axios.get(
                `/fineract-provider/api/v1/delinquency/buckets/${bucket.id}`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            setSelectedBucket(response.data);
            setBucketRanges(response.data.ranges || []);
            setOriginalRanges(response.data.ranges.map((range) => range.id));
            setIsBucketModalOpen(true);
        } catch (error) {
            console.error('Error fetching bucket details:', error);
        } finally {
            stopLoading();
        }
    };

    const handleAddRange = () => {
        if (!selectedRange || bucketRanges.find((range) => range.id === parseInt(selectedRange)))
            return;

        const range = ranges.find((range) => range.id === parseInt(selectedRange));
        setBucketRanges((prev) => [...prev, range]);
        setSelectedRange('');
        setIsRangeModalOpen(false);
    };

    const handleRemoveRange = (id) => {
        setBucketRanges((prev) => prev.filter((range) => range.id !== id));
    };

    const handleBucketModalSubmit = async () => {
        startLoading();
        try {
            const payload = {
                name: selectedBucket.name,
                ranges: bucketRanges.map((range) => range.id),
            };
            await axios.put(
                `/fineract-provider/api/v1/delinquency/buckets/${selectedBucket.id}`,
                payload,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            showNotification('Bucket updated successfully!', 'success');
            setIsBucketModalOpen(false);
            fetchDelinquencyBuckets();
        } catch (error) {
            console.error('Error updating bucket:', error);
            showNotification('Error updating bucket:', 'error');
        } finally {
            stopLoading();
        }
    };

    const handleBucketDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this bucket?')) return;

        startLoading();
        try {
            await axios.delete(
                `/fineract-provider/api/v1/delinquency/buckets/${selectedBucket.id}`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            showNotification('Bucket deleted successfully!', 'success');
            setIsBucketModalOpen(false);
            fetchDelinquencyBuckets();
        } catch (error) {
            console.error('Error deleting bucket:', error);
            showNotification('Error deleting bucket:', 'error');
        } finally {
            stopLoading();
        }
    };

    const DelinquencyBucketModal = ({ isOpen, onClose, bucket, ranges, onAddRange, onRemoveRange, onSubmit, onDelete,}) => {
        const isChanged =
            JSON.stringify(bucketRanges.map((r) => r.id)) !== JSON.stringify(originalRanges);

        if (!isOpen) return null;

        return (
            <div className="edit-modal-overlay">
                <div className="edit-modal-content">
                    <h3 className={"staged-form-title"}>Edit Delinquency Bucket</h3>
                    <div className="staged-form-field">
                        <label>Bucket Name</label>
                        <input
                            type="text"
                            value={bucket.name}
                            readOnly
                            className="staged-form-input"
                        />
                    </div>
                    <div className="staged-form-row">
                        <h4>Delinquency Ranges</h4>
                        <button
                            className="modal-submit-button"
                            onClick={() => setIsRangeModalOpen(true)}
                        >
                            Add Range
                        </button>
                    </div>
                    <table className="delinquency-buckets-table">
                        <thead>
                        <tr>
                            <th>Classification</th>
                            <th>Days From</th>
                            <th>Days Till</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {bucketRanges.map((range) => (
                            <tr key={range.id} className={"tax-groups-table-row"}>
                                <td>{range.classification}</td>
                                <td>{range.minimumAgeDays}</td>
                                <td>{range.maximumAgeDays}</td>
                                <td>
                                    <FaTrash
                                        className="delete-icon"
                                        onClick={() => onRemoveRange(range.id)}
                                    />
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    <div className="modal-actions">
                        <button className="modal-cancel-button" onClick={onClose}>
                            Cancel
                        </button>
                        <button className="modal-delete-button" onClick={onDelete}>
                            Delete
                        </button>
                        <button
                            className="modal-submit-button"
                            onClick={onSubmit}
                            disabled={!isChanged}
                        >
                            Submit
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const AddRangeModal = ({isOpen, onClose, ranges, selectedRange, onSelectRange, onAdd}) => {
        if (!isOpen) return null;

        return (
            <div className="edit-modal-overlay">
                <div className="edit-modal-content">
                    <h3 className={"staged-form-title"}>Add Delinquency Range</h3>
                    <div className="staged-form-field">
                        <label>Delinquency Range</label>
                        <select
                            value={selectedRange}
                            onChange={(e) => onSelectRange(e.target.value)}
                            className="staged-form-select"
                        >
                            <option value="">Select Range</option>
                            {ranges.map((range) => (
                                <option key={range.id} value={range.id}>
                                    {range.classification} ({range.minimumAgeDays} -{' '}
                                    {range.maximumAgeDays} days)
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="modal-actions">
                        <button className="modal-cancel-button" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            className="modal-submit-button"
                            onClick={onAdd}
                            disabled={!selectedRange}
                        >
                            Add
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="view-delinquency-buckets">
            <div className="table-controls">
                <div className="filter-container">
                    <div className="filter-item">
                        <label htmlFor="nameFilter">Filter by Name:</label>
                        <input
                            type="text"
                            id="nameFilter"
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                            placeholder="Search by name..."
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
            <table className="delinquency-buckets-table">
                <thead>
                <tr>
                    <th>Name</th>
                </tr>
                </thead>
                <tbody>
                {paginatedData.length > 0 ? (
                    paginatedData.map((bucket) => (
                        <tr
                            key={bucket.id}
                            onClick={() => handleRowClick(bucket)}
                            className="clickable-row"
                        >
                            <td>{bucket.name}</td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="1" className="no-data">
                            No delinquency buckets available.
                        </td>
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

            <DelinquencyBucketModal
                isOpen={isBucketModalOpen}
                onClose={() => setIsBucketModalOpen(false)}
                bucket={selectedBucket}
                ranges={ranges}
                onAddRange={handleAddRange}
                onRemoveRange={handleRemoveRange}
                onSubmit={handleBucketModalSubmit}
                onDelete={handleBucketDelete}
            />

            <AddRangeModal
                isOpen={isRangeModalOpen}
                onClose={() => setIsRangeModalOpen(false)}
                ranges={ranges}
                selectedRange={selectedRange}
                onSelectRange={setSelectedRange}
                onAdd={handleAddRange}
            />
        </div>
    );
};

export default ViewDelinquencyBuckets;
