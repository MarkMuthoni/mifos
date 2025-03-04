import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import './ViewFloatingRates.css';
import {NotificationContext} from "../../../../../context/NotificationContext";

const ViewFloatingRates = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const [floatingRates, setFloatingRates] = useState([]);
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [nameFilter, setNameFilter] = useState('');
    const [createdByFilter, setCreatedByFilter] = useState('');
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchFloatingRates();
    }, []);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredRates().length / pageSize));
    }, [floatingRates, nameFilter, createdByFilter, pageSize]);

    const fetchFloatingRates = async () => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/floatingrates`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setFloatingRates(response.data || []);
        } catch (error) {
            console.error('Error fetching floating rates:', error);
            showNotification('Error fetching floating rates:', 'error');
        } finally {
            stopLoading();
        }
    };

    const filteredRates = () =>
        floatingRates.filter(
            (rate) =>
                rate.name?.toLowerCase().includes(nameFilter.toLowerCase()) &&
                rate.createdBy?.toLowerCase().includes(createdByFilter.toLowerCase())
        );

    const paginatedData = filteredRates().slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handleRowClick = (rate) => {
        // console.log('Selected Floating Rate:', rate);
    };

    return (
        <div className="view-floating-rates">
            <div className="table-controls">
                <div className="filter-container">
                    <div className="filter-item">
                        <label htmlFor="nameFilter">Filter by Name:</label>
                        <input
                            type="text"
                            id="nameFilter"
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                            placeholder="search by name..."
                        />
                        </div>
                    <div className="filter-item">
                        <label htmlFor="createdByFilter">Filter by Created By:</label>
                        <input
                            type="text"
                            id="createdByFilter"
                            value={createdByFilter}
                            onChange={(e) => setCreatedByFilter(e.target.value)}
                            placeholder="search by creator..."
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
            <table className="floating-rates-table">
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Created By</th>
                    <th>Is Base Lending Rate?</th>
                    <th>Active</th>
                </tr>
                </thead>
                <tbody>
                {paginatedData.length > 0 ? (
                    paginatedData.map((rate) => (
                        <tr
                            key={rate.id}
                            onClick={() => handleRowClick(rate)}
                            className="clickable-row"
                        >
                            <td>{rate.name}</td>
                            <td>{rate.createdBy || 'N/A'}</td>
                            <td>{rate.isBaseLendingRate ? 'Yes' : 'No'}</td>
                            <td>{rate.active ? 'Yes' : 'No'}</td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="4" className="no-data">No floating rates available.</td>
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
        </div>
    );
};

export default ViewFloatingRates;
