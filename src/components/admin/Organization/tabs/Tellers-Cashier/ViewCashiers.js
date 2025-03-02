import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_CONFIG } from "../../../../../config";
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import './ViewCashiers.css';

const ViewCashiers = ({ teller, setActiveTab }) => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const [cashiers, setCashiers] = useState([]);
    const [filter, setFilter] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchCashiers();
    }, []);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredCashiers().length / pageSize));
    }, [cashiers, filter, pageSize]);

    const fetchCashiers = async () => {
        startLoading();
        try {
            const response = await axios.get(
                `/fineract-provider/api/v1/tellers/${teller.id}/cashiers`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const fetchedCashiers = response.data?.cashiers || [];
            if (Array.isArray(fetchedCashiers)) {
                setCashiers(fetchedCashiers);
            } else {
                setCashiers([]);
            }
        } catch (error) {
            console.error('Error fetching cashiers:', error);
        } finally {
            stopLoading();
        }
    };

    const filteredCashiers = () =>
        cashiers.filter((cashier) =>
            cashier.name?.toLowerCase().includes(filter.toLowerCase())
        );

    const paginatedData = filteredCashiers().slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    return (
        <div className="view-tellers">
            <div className="cashiers-heading-container">
                <button
                    className="action-button"
                    onClick={() => setActiveTab('viewTellers')}
                >
                    Back to View Tellers
                </button>
                <h3 className="cashiers-heading">Teller: {teller.name} - Cashiers</h3>
            </div>
            <div className="table-controls">
                <div className="filter-container">
                    <div className="filter-item">
                        <label htmlFor="nameFilter" className="name-filter-label">Filter by Cashier Name:</label>
                        <input
                            type="text"
                            placeholder="Filter by Cashier/Staff"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="filter-input"
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
                    <th>Period</th>
                    <th>Cashier/Staff</th>
                    <th>Full Day/Time</th>
                    <th>Vault Actions</th>
                </tr>
                </thead>
                <tbody>
                {paginatedData.length > 0 ? (
                    paginatedData.map((cashier, index) => (
                        <tr key={index}>
                            <td>{cashier.period || '-'}</td>
                            <td>{cashier.name || '-'}</td>
                            <td>{cashier.fullDayTime || '-'}</td>
                            <td>{cashier.vaultActions || '-'}</td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="4" className="no-data">No cashiers available.</td>
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

export default ViewCashiers;
