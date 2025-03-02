import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import '../styling.css';
import { AuthContext } from '../../../context/AuthContext';
import { useLoading } from '../../../context/LoadingContext';
import { API_CONFIG } from '../../../config';
import {NotificationContext} from "../../../context/NotificationContext";

const Groups = ({ onRowClick }) => {
    const [groups, setGroups] = useState([]);
    const [filteredGroups, setFilteredGroups] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({ searchQuery: '' });
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const { showNotification } = useContext(NotificationContext);

    const fetchGroups = async () => {
        try {
            startLoading();
            const response = await axios.get(`/fineract-provider/api/v1/groups`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setGroups(response.data || []);
        } catch (error) {
            console.error('Error fetching groups:', error);
            showNotification('Error fetching groups!', 'error');
        } finally {
            stopLoading();
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    useEffect(() => {
        const filtered = groups.filter((group) =>
            group.name.toLowerCase().includes(filters.searchQuery.toLowerCase())
        );

        setTotalPages(Math.ceil(filtered.length / pageSize));
        setFilteredGroups(
            filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
        );
    }, [groups, filters, currentPage, pageSize]);

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
                            Search by Group Name:
                        </label>
                        <input
                            type="text"
                            id="searchQuery"
                            name="searchQuery"
                            placeholder="Enter group name"
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
                    {filteredGroups && filteredGroups.length > 0 ? (
                        filteredGroups.map((group) => (
                            <tr key={group.id} onClick={() => onRowClick(group)}>
                                <td>{group.name}</td>
                                <td>{group.accountNo}</td>
                                <td>{group.externalId}</td>
                                <td>
                                    <span className={`status-badge ${getStatusClass(group.status.value)}`}>
                                        {group.status.value}
                                    </span>
                                </td>
                                <td>{group.officeName}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5">No groups found</td>
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

export default Groups;
