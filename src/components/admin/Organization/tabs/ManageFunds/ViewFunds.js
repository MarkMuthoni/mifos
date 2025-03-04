import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import './ViewFunds.css';
import {NotificationContext} from "../../../../../context/NotificationContext";

const ViewFunds = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const [funds, setFunds] = useState([]);
    const [nameFilter, setNameFilter] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState({
        id: null,
        name: '',
        externalId: '',
    });

    useEffect(() => {
        fetchFunds();
    }, []);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredFunds().length / pageSize));
    }, [funds, nameFilter, pageSize]);

    const fetchFunds = async () => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/funds`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setFunds(response.data || []);
        } catch (error) {
            console.error('Error fetching funds:', error);
        } finally {
            stopLoading();
        }
    };

    const filteredFunds = () =>
        funds.filter((fund) =>
            fund.name.toLowerCase().includes(nameFilter.toLowerCase())
        );

    const paginatedData = filteredFunds().slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handleRowClick = (fund) => {
        setModalData({
            id: fund.id,
            name: fund.name,
            externalId: fund.externalId || '',
        });
        setIsModalOpen(true);
    };

    const handleModalChange = (field, value) => {
        setModalData((prev) => ({ ...prev, [field]: value }));
    };

    const handleModalSubmit = async () => {
        const payload = {
            name: modalData.name,
            externalId: modalData.externalId,
        };

        startLoading();
        try {
            await axios.put(`${API_CONFIG.proxy}/fineract-provider/api/v1/funds/${modalData.id}`, payload, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });
            setIsModalOpen(false);
            fetchFunds();
            showNotification("Fund updated successfully!", 'success');
        } catch (error) {
            console.error("Error updating fund:", error);
        } finally {
            stopLoading();
        }
    };

    const isDuplicate = (field, value) => {
        return funds.some(
            (fund) => fund[field] === value && fund.id !== modalData.id
        );
    };

    const duplicateNameMessage = isDuplicate('name', modalData.name)
        ? 'A fund with this name already exists.'
        : '';

    const duplicateExternalIdMessage = isDuplicate('externalId', modalData.externalId)
        ? 'A fund with this External ID already exists.'
        : '';


    return (
        <div className="view-funds">
            <div className="table-controls">
                <div className="filter-container">
                    <div className="filter-item">
                        <label htmlFor="nameFilter" className="name-filter-label">Filter by Name:</label>
                        <input
                            type="text"
                            id="nameFilter"
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                            placeholder="Enter fund name..."
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
            <table className="funds-table">
                <thead>
                <tr>
                    <th>Name</th>
                    <th>External ID</th>
                </tr>
                </thead>
                <tbody>
                {paginatedData.length > 0 ? (
                    paginatedData.map((fund) => (
                        <tr
                            key={fund.id}
                            className="clickable-row"
                            onClick={() => handleRowClick(fund)}
                        >
                            <td>{fund.name || '-'}</td>
                            <td>{fund.externalId || '-'}</td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="2" className="no-data">No funds available.</td>
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
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className="create-modal-title">Edit Fund</h4>
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="fundName" className="create-provisioning-criteria-label">Name</label>
                            <input
                                type="text"
                                id="fundName"
                                value={modalData.name}
                                onChange={(e) => handleModalChange('name', e.target.value)}
                                className="create-provisioning-criteria-input"
                                required
                            />
                            {duplicateNameMessage && (
                                <p className="create-provisioning-criteria-warning">{duplicateNameMessage}</p>
                            )}
                        </div>
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="externalId" className="create-provisioning-criteria-label">External
                                ID</label>
                            <input
                                type="text"
                                id="externalId"
                                value={modalData.externalId}
                                onChange={(e) => handleModalChange('externalId', e.target.value)}
                                className="create-provisioning-criteria-input"
                            />
                            {duplicateExternalIdMessage && (
                                <p className="create-provisioning-criteria-warning">{duplicateExternalIdMessage}</p>
                            )}
                        </div>
                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="create-provisioning-criteria-cancel"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleModalSubmit}
                                className="create-provisioning-criteria-confirm"
                                disabled={
                                    !modalData.name ||
                                    isDuplicate('name', modalData.name) ||
                                    isDuplicate('externalId', modalData.externalId) ||
                                    (modalData.name === funds.find((fund) => fund.id === modalData.id)?.name &&
                                        modalData.externalId === funds.find((fund) => fund.id === modalData.id)?.externalId)
                                }
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

export default ViewFunds;
