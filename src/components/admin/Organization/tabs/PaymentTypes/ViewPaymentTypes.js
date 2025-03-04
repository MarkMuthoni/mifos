import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import { FaEdit, FaTrash } from 'react-icons/fa';
import './ViewPaymentTypes.css';
import {NotificationContext} from "../../../../../context/NotificationContext";

const ViewPaymentTypes = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);

    const { startLoading, stopLoading } = useLoading();
    const [paymentTypes, setPaymentTypes] = useState([]);
    const [nameFilter, setNameFilter] = useState('');
    const [codeFilter, setCodeFilter] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editPaymentType, setEditPaymentType] = useState(null);
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
    const [originalPaymentType, setOriginalPaymentType] = useState(null);


    useEffect(() => {
        fetchPaymentTypes();
    }, []);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredPaymentTypes().length / pageSize));
    }, [paymentTypes, nameFilter, codeFilter, pageSize]);

    const fetchPaymentTypes = async () => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/paymenttypes`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setPaymentTypes(response.data || []);
        } catch (error) {
            console.error('Error fetching payment types:', error);
        } finally {
            stopLoading();
        }
    };

    const filteredPaymentTypes = () =>
        paymentTypes.filter((paymentType) => {
            const matchesName = paymentType.name.toLowerCase().includes(nameFilter.toLowerCase());
            const matchesCode = paymentType.description.toLowerCase().includes(codeFilter.toLowerCase());
            return matchesName && matchesCode;
        });

    const paginatedData = filteredPaymentTypes().slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handleEdit = async (paymentType) => {
        startLoading();
        try {
            const response = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/paymenttypes/${paymentType.id}`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            setEditPaymentType(response.data);
            setOriginalPaymentType(response.data);
            setShowEditModal(true);
        } catch (error) {
            console.error('Error fetching payment type details:', error);
        } finally {
            stopLoading();
        }
    };

    const handleFieldChange = (field, value) => {
        setEditPaymentType((prev) => {
            const updated = { ...prev, [field]: value };
            setIsSubmitDisabled(JSON.stringify(updated) === JSON.stringify(originalPaymentType)); // Compare with original data
            return updated;
        });
    };

    const handleCancel = () => {
        setShowEditModal(false);
        setEditPaymentType(null);
        setIsSubmitDisabled(true);
    };

    const handleSubmit = async () => {
        if (!editPaymentType.name || !editPaymentType.position) {
            showNotification("Payment Type and Position are required!", 'info');
            return;
        }

        startLoading();
        try {
            await axios.put(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/paymenttypes/${editPaymentType.id}`,
                editPaymentType,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            showNotification("Payment Type updated successfully!", 'success');
            setShowEditModal(false);
            setEditPaymentType(null);
            fetchPaymentTypes();
        } catch (error) {
            console.error("Error updating payment type:", error);
            showNotification("Failed to update Payment Type. Please try again!", 'error');
        } finally {
            stopLoading();
        }
    };


    const handleDelete = async (paymentType) => {
        const confirmed = window.confirm(`Are you sure you want to delete "${paymentType.name}"?`);
        if (!confirmed) {
            return;
        }

        startLoading();
        try {
            const response = await axios.delete(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/paymenttypes/${paymentType.id}`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            showNotification("Payment Type deleted!", 'success');
            setPaymentTypes((prev) => prev.filter((type) => type.id !== paymentType.id));
        } catch (error) {
            console.error('Error deleting payment type:', error);
            showNotification('Failed to delete the payment type. Please try again!', 'error');
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="view-payment-types">
            <div className="table-controls">
                <div className="filter-container">
                    <div className="filter-item">
                        <label htmlFor="nameFilter" className="name-filter-label">Filter by Name:</label>
                        <input
                            type="text"
                            id="nameFilter"
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                            placeholder="Enter name..."
                            className="name-filter-input"
                        />
                    </div>
                    <div className="filter-item">
                        <label htmlFor="codeFilter" className="code-filter-label">Filter by Code:</label>
                        <input
                            type="text"
                            id="codeFilter"
                            value={codeFilter}
                            onChange={(e) => setCodeFilter(e.target.value)}
                            placeholder="Enter code..."
                            className="code-filter-input"
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
            <table className="payment-types-table">
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Code</th>
                    <th>System Defined</th>
                    <th>Cash Payment</th>
                    <th>Position</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {paginatedData.length > 0 ? (
                    paginatedData.map((paymentType) => (
                        <tr key={paymentType.id} className="clickable-row">
                            <td>{paymentType.name || ''}</td>
                            <td>{paymentType.description || ''}</td>
                            <td>{paymentType.codeName || ''}</td>
                            <td>{paymentType.isSystemDefined ? 'Yes' : 'No'}</td>
                            <td>{paymentType.isCashPayment ? 'Yes' : 'No'}</td>
                            <td>{paymentType.position || ''}</td>
                            <td>
                                <FaEdit
                                    size={20}
                                    color={"#16730a"}
                                    style={{ cursor: "pointer", marginRight: "10px" }}
                                    // className="action-icon edit-icon"
                                    onClick={() => handleEdit(paymentType)}
                                />
                                <FaTrash
                                    size={20}
                                    color={"#bc1111"}
                                    style={{ cursor: "pointer"}}
                                    onClick={() => handleDelete(paymentType)}
                                />
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="7" className="no-data">No payment types available.</td>
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
            {showEditModal && editPaymentType && (
                <div className="edit-modal-overlay">
                    <div className="edit-modal-content">
                        <h3 className="staged-form-title">Edit Payment Type</h3>
                        <div className="staged-form-field">
                            <label>Payment Type <span className="required">*</span></label>
                            <input
                                type="text"
                                className="staged-form-input"
                                value={editPaymentType.name}
                                onChange={(e) => handleFieldChange('name', e.target.value)}
                                required
                            />
                        </div>
                        <div className="staged-form-field">
                            <label>Description</label>
                            <input
                                type="text"
                                className="staged-form-input"
                                value={editPaymentType.description}
                                onChange={(e) => handleFieldChange('description', e.target.value)}
                            />
                        </div>
                        <div className="form-checkbox-field staged-form-field">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={editPaymentType.isCashPayment}
                                    onChange={(e) => handleFieldChange('isCashPayment', e.target.checked)}
                                />
                                Is Cash Payment
                            </label>
                        </div>
                        <div className="staged-form-field">
                            <label>Position <span className="required">*</span></label>
                            <input
                                type="number"
                                value={editPaymentType.position}
                                onChange={(e) => handleFieldChange('position', e.target.value)}
                                required
                            />
                        </div>
                        <div className="modal-actions">
                            <button className="modal-cancel-button" onClick={handleCancel}>Cancel</button>
                            <button
                                className={"modal-submit-button"}
                                onClick={handleSubmit}
                                disabled={isSubmitDisabled}
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ViewPaymentTypes;
