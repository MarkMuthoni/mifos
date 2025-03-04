import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import './ViewCollaterals.css';
import {NotificationContext} from "../../../../../context/NotificationContext";

const ViewCollaterals = ({onRowClick}) => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const [collaterals, setCollaterals] = useState([]);
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [filter, setFilter] = useState('');
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchCollaterals();
    }, []);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredCollaterals().length / pageSize));
    }, [collaterals, filter, pageSize]);

    const fetchCollaterals = async () => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/collateral-management`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setCollaterals(response.data || []);
        } catch (error) {
            console.error('Error fetching collaterals:', error);
            showNotification('Error fetching collaterals:', 'error');
        } finally {
            stopLoading();
        }
    };

    const filteredCollaterals = () =>
        collaterals.filter((collateral) =>
            collateral.name.toLowerCase().includes(filter.toLowerCase())
        );

    const paginatedData = filteredCollaterals().slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const formatCurrency = (amount, currency) => {
        if (!amount || !currency) return '';
        const formattedAmount = Number(amount).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return `${currency} ${formattedAmount}`;
    };

    const formatPercentage = (percentage) => {
        if (!percentage) return '';
        return `${percentage}%`;
    };


    return (
        <div className="view-collaterals">
            <div className="table-controls">
                <div className="filter-container">
                    <label htmlFor="filter">Filter by Name:</label>
                    <input
                        type="text"
                        id="filter"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        placeholder="Enter collateral name..."
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
            <table className="collaterals-table">
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Type/Quality</th>
                    <th>Base Price</th>
                    <th>Base Percentage</th>
                    <th>Unit Type</th>
                </tr>
                </thead>
                <tbody>
                {paginatedData.length > 0 ? (
                    paginatedData.map((collateral) => (
                        <tr
                            key={collateral.id}
                            onClick={() => onRowClick(collateral)}
                            className="clickable-row"
                        >
                            <td>{collateral.name || ''}</td>
                            <td>{collateral.quality || ''}</td>
                            <td>{formatCurrency(collateral.basePrice, collateral.currency)}</td>
                            <td>{formatPercentage(collateral.pctToBase)}</td>
                            <td>{collateral.unitType || ''}</td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="5" className="no-data">No collaterals available.</td>
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

export default ViewCollaterals;
