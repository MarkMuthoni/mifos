import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import '../styling.css';
import { AuthContext } from '../../../context/AuthContext';
import { useLoading } from '../../../context/LoadingContext';
import { API_CONFIG } from '../../../config';

const Centers = ({ onRowClick }) => {
    const [centers, setCenters] = useState([]);
    const [currentPageData, setCurrentPageData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({ searchQuery: '' });
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();

    const fetchCenters = async () => {
        try {
            startLoading();
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/centers`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setCenters(response.data || []);
        } catch (error) {
            console.error('Error fetching centers:', error);
        } finally {
            stopLoading();
        }
    };

    useEffect(() => {
        fetchCenters();
    }, []);

    useEffect(() => {
        const filteredCenters = centers.filter((center) =>
            center.name.toLowerCase().includes(filters.searchQuery.toLowerCase())
        );

        setTotalPages(Math.ceil(filteredCenters.length / pageSize));
        setCurrentPageData(
            filteredCenters.slice((currentPage - 1) * pageSize, currentPage * pageSize)
        );
    }, [centers, filters, currentPage, pageSize]);

    const handlePreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    const handlePageSizeChange = (e) => setPageSize(Number(e.target.value));

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'status-active';
            case 'inactive':
                return 'status-inactive';
            default:
                return 'status-default';
        }
    };

    return (
        <div className="view-layout navbar-spacing">
            <div className="table-controls">
                <div className="filters-container">
                    <div className="filter-group">
                        <label htmlFor="searchQuery" className="filter-label">
                            Search by Center Name:
                        </label>
                        <input
                            type="text"
                            id="searchQuery"
                            name="searchQuery"
                            placeholder="Enter center name"
                            className="filter-input"
                            value={filters.searchQuery}
                            onChange={handleFilterChange}
                        />
                    </div>
                </div>
                <div className="filter-group">
                    <label htmlFor="pageSize" className="filter-label">
                        Rows per page:
                    </label>
                    <select
                        id="pageSize"
                        value={pageSize}
                        onChange={handlePageSizeChange}
                        className="filter-dropdown"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>

            <div className="client-table">
                <table>
                    <thead>
                    <tr>
                        <th>Name</th>
                        <th>Account Number</th>
                        <th>External ID</th>
                        <th>Status</th>
                        <th>Office</th>
                    </tr>
                    </thead>
                    <tbody>
                    {currentPageData && currentPageData.length > 0 ? (
                        currentPageData.map((center) => (
                            <tr key={center.id} onClick={() => onRowClick(center)}>
                                <td>{center.name}</td>
                                <td>{center.accountNo}</td>
                                <td>{center.externalId}</td>
                                <td>
                                    <span className={`status-badge ${getStatusClass(center.status.value)}`}>
                                        {center.status.value}
                                    </span>
                                </td>
                                <td>{center.officeName}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5">No centers found</td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="pagination-button"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                    >
                        Start
                    </button>
                    <button
                        className="pagination-button"
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button
                        className="pagination-button"
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                    <button
                        className="pagination-button"
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

export default Centers;
