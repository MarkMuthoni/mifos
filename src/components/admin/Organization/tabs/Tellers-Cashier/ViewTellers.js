import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import './ViewTellers.css';
import {FaEye} from "react-icons/fa";
import {NotificationContext} from "../../../../../context/NotificationContext";

const ViewTellers = ({onViewCashiers}) => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const [tellers, setTellers] = useState([]);
    const [branchFilter, setBranchFilter] = useState('');
    const [nameFilter, setNameFilter] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [originalModalData, setOriginalModalData] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [modalData, setModalData] = useState({
        id: null,
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        status: 300,
        officeName: '',
    });


    useEffect(() => {
        fetchTellers();
    }, []);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredTellers().length / pageSize));
    }, [tellers, branchFilter, nameFilter, pageSize]);

    const fetchTellers = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/tellers`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setTellers(response.data || []);
        } catch (error) {
            console.error('Error fetching tellers:', error);
        } finally {
            stopLoading();
        }
    };

    const filteredTellers = () =>
        tellers.filter((teller) => {
            const matchesBranch = teller.officeName?.toLowerCase().includes(branchFilter.toLowerCase());
            const matchesName = teller.name?.toLowerCase().includes(nameFilter.toLowerCase());
            return matchesBranch && matchesName;
        });

    const paginatedData = filteredTellers().slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handleRowClick = (teller) => {
        setModalData({
            id: teller.id,
            name: teller.name,
            description: teller.description || '',
            startDate: teller.startDate
                ? formatDate(teller.startDate)
                : '',
            endDate: teller.endDate
                ? formatDate(teller.endDate)
                : '',
            status: teller.status === 'ACTIVE' ? 300 : 400,
            officeId: teller.officeId,
            officeName: teller.officeName,
        });
        setOriginalModalData({
            id: teller.id,
            name: teller.name,
            description: teller.description || '',
            startDate: teller.startDate
                ? formatDate(teller.startDate)
                : '',
            endDate: teller.endDate
                ? formatDate(teller.endDate)
                : '',
            status: teller.status === 'ACTIVE' ? 300 : 400,
            officeId: teller.officeId,
            officeName: teller.officeName,
        });
        setIsModalOpen(true);
        setIsEditMode(false);
    };

    const formatDate = (dateArray) => {
        if (!dateArray || !Array.isArray(dateArray)) return '-';
        const [year, month, day] = dateArray;
        return new Date(year, month - 1, day).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const handleEditSubmit = async () => {
        const payload = {
            name: modalData.name,
            description: modalData.description || null,
            startDate: new Date(modalData.startDate).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            }),
            endDate: modalData.endDate
                ? new Date(modalData.endDate).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                })
                : null,
            status: modalData.status,
            officeId: modalData.officeId,
            dateFormat: 'dd MMMM yyyy',
            locale: 'en',
        };

        startLoading();
        try {
            await axios.put(`/fineract-provider/api/v1/tellers/${modalData.id}`, payload, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            fetchTellers();
            setIsModalOpen(false);
            showNotification("Teller updated successfully!", 'success');
        } catch (error) {
            console.error('Error updating teller:', error);
        } finally {
            stopLoading();
        }
    };

    const handleDelete = async () => {
        startLoading();
        try {
            await axios.delete(`/fineract-provider/api/v1/tellers/${modalData.id}`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            fetchTellers();
            setIsModalOpen(false);
            showNotification("Teller deleted successfully!", 'success');
        } catch (error) {
            console.error('Error deleting teller:', error);
        } finally {
            stopLoading();
        }
    };

    const handleViewCashiers = (teller) => {
        onViewCashiers(teller);
    };

    return (
        <div className="view-tellers">
            <div className="table-controls">
                <div className="filter-container">
                    <div className="filter-item">
                        <label htmlFor="branchFilter" className="branch-filter-label">Filter by Branch:</label>
                        <input
                            type="text"
                            id="branchFilter"
                            value={branchFilter}
                            onChange={(e) => setBranchFilter(e.target.value)}
                            placeholder="Enter branch name..."
                            className="branch-filter-input"
                        />
                    </div>
                    <div className="filter-item">
                        <label htmlFor="nameFilter" className="name-filter-label">Filter by Teller Name:</label>
                        <input
                            type="text"
                            id="nameFilter"
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                            placeholder="Enter teller name..."
                            className="name-filter-input"
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
            <table className="tellers-table">
                <thead>
                <tr>
                    <th>Branch</th>
                    <th>Teller Name</th>
                    <th>Status</th>
                    <th>Started On</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {paginatedData.length > 0 ? (
                    paginatedData.map((teller) => (
                        <tr
                            key={teller.id}
                            className="clickable-row"
                            onClick={() => handleRowClick(teller)}
                        >
                            <td>{teller.officeName || ''}</td>
                            <td>{teller.name || ''}</td>
                            <td>{teller.status || ''}</td>
                            <td>{formatDate(teller.startDate)}</td>
                            <td>
                                <FaEye
                                    className="teller-action-button-icon"
                                    color={"#2f770c"}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewCashiers(teller);
                                    }}
                                />
                                <span
                                    className="view-cashiers-label"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewCashiers(teller);
                                    }}
                                >View Cashiers</span>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="5" className="no-data">No tellers available.</td>
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
            {isModalOpen && (
                <div className="teller-modal-overlay">
                    <div className="teller-modal-content">
                        <button
                            className="teller-modal-dismiss"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Close
                        </button>
                        <h4 className="teller-modal-title">
                            {isEditMode ? 'Edit Teller' : 'Teller Details'}
                        </h4>

                        {!isEditMode ? (
                            <table className="teller-details-table">
                                <tbody>
                                <tr>
                                    <td className="teller-details-key">Office</td>
                                    <td className="teller-details-value">{modalData.officeName}</td>
                                </tr>
                                <tr>
                                    <td className="teller-details-key">Name</td>
                                    <td className="teller-details-value">{modalData.name}</td>
                                </tr>
                                <tr>
                                    <td className="teller-details-key">Description</td>
                                    <td className="teller-details-value">{modalData.description || '-'}</td>
                                </tr>
                                <tr>
                                    <td className="teller-details-key">Start Date</td>
                                    <td className="teller-details-value">{modalData.startDate || '-'}</td>
                                </tr>
                                <tr>
                                    <td className="teller-details-key">End Date</td>
                                    <td className="teller-details-value">{modalData.endDate || '-'}</td>
                                </tr>
                                <tr>
                                    <td className="teller-details-key">Status</td>
                                    <td className="teller-details-value">
                                        {modalData.status === 300 ? 'Active' : 'Inactive'}
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        ) : (
                            <>
                                <div className="teller-group">
                                    <label className="teller-label">Office (Read Only)</label>
                                    <input
                                        type="text"
                                        value={modalData.officeName}
                                        readOnly
                                        className="teller-input muted"
                                    />
                                </div>
                                <div className="teller-group">
                                    <label className="teller-label">Name <span>*</span></label>
                                    <input
                                        type="text"
                                        value={modalData.name}
                                        onChange={(e) => setModalData({...modalData, name: e.target.value})}
                                        className="teller-input"
                                    />
                                </div>
                                <div className="teller-group">
                                    <label className="teller-label">Description</label>
                                    <textarea
                                        value={modalData.description}
                                        onChange={(e) => setModalData({...modalData, description: e.target.value})}
                                        className="teller-textarea"
                                    />
                                </div>
                                <div className="teller-row">
                                    <div className="teller-group">
                                        <label className="teller-label">Start Date <span>*</span></label>
                                        <input
                                            type="date"
                                            value={modalData.startDate ? new Date(modalData.startDate).toISOString().split("T")[0] : ""}
                                            min={new Date().toISOString().split("T")[0]}
                                            onChange={(e) =>
                                                setModalData({...modalData, startDate: e.target.value})
                                            }
                                            className="teller-input"
                                        />
                                    </div>
                                    <div className="teller-group">
                                        <label className="teller-label">End Date <span>*</span></label>
                                        <input
                                            type="date"
                                            value={modalData.endDate ? new Date(modalData.endDate).toISOString().split("T")[0] : ""}
                                            min={modalData.startDate ? new Date(modalData.startDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]}
                                            onChange={(e) =>
                                                setModalData({...modalData, endDate: e.target.value})
                                            }
                                            className="teller-input"
                                        />
                                    </div>
                                </div>
                                <div className="teller-group">
                                    <label className="teller-label">Status <span>*</span></label>
                                    <select
                                        value={modalData.status}
                                        onChange={(e) => setModalData({
                                            ...modalData,
                                            status: parseInt(e.target.value, 10)
                                        })}
                                        className="teller-select"
                                    >
                                        <option value={300}>Active</option>
                                        <option value={400}>Inactive</option>
                                    </select>
                                </div>
                            </>
                        )}

                        <div className="teller-modal-actions">
                            {isEditMode ? (
                                <>
                                <button
                                        onClick={handleEditSubmit}
                                        className="teller-modal-submit"
                                        disabled={
                                            JSON.stringify(modalData) === JSON.stringify(originalModalData) ||
                                            !modalData.name ||
                                            !modalData.startDate ||
                                            !modalData.endDate ||
                                            !modalData.status ||
                                            (modalData.endDate && new Date(modalData.endDate) < new Date(modalData.startDate))
                                        }
                                    >
                                        Submit
                                    </button>
                                    <button onClick={() => setIsEditMode(false)} className="teller-modal-cancel">
                                        Stop Editing!
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setIsEditMode(true)} className="teller-modal-edit">
                                        Edit
                                    </button>
                                    <button onClick={handleDelete} className="teller-modal-delete">
                                        Delete Teller
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewTellers;
