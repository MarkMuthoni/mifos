import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import './ViewAdHocQuery.css';

const ViewAdHocQuery = () => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const [queries, setQueries] = useState([]);
    const [nameFilter, setNameFilter] = useState('');
    const [emailFilter, setEmailFilter] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchAdHocQueries();
    }, []);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredQueries().length / pageSize));
    }, [queries, nameFilter, emailFilter, pageSize]);

    const fetchAdHocQueries = async () => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/adhocquery`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setQueries(response.data || []);
        } catch (error) {
            console.error('Error fetching ad hoc queries:', error);
        } finally {
            stopLoading();
        }
    };

    const filteredQueries = () =>
        queries.filter(query =>
            query.name.toLowerCase().includes(nameFilter.toLowerCase()) &&
            query.email.toLowerCase().includes(emailFilter.toLowerCase())
        );

    const paginatedData = filteredQueries().slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handleRowClick = (query) => {
        console.log('Selected Query:', query);
    };

    return (
        <div className="view-adhoc-query">
            <div className="table-controls">
                <div className="filter-container">
                    <div className="filter-item">
                        <label htmlFor="nameFilter" className="name-filter-label">Filter by Name:</label>
                        <input
                            type="text"
                            id="nameFilter"
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                            placeholder="Enter query name..."
                            className="name-filter-input"
                        />
                    </div>
                    <div className="filter-item">
                        <label htmlFor="emailFilter" className="email-filter-label">Filter by Email:</label>
                        <input
                            type="text"
                            id="emailFilter"
                            value={emailFilter}
                            onChange={(e) => setEmailFilter(e.target.value)}
                            placeholder="Enter email..."
                            className="email-filter-input"
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
            <table className="adhoc-query-table">
                <thead>
                <tr>
                    <th>Name</th>
                    <th>SQL Query</th>
                    <th>Table Affected</th>
                    <th>Email</th>
                    <th>Report Run Frequency</th>
                    <th>Status</th>
                    <th>Created By</th>
                </tr>
                </thead>
                <tbody>
                {paginatedData.length > 0 ? (
                    paginatedData.map((query) => (
                        <tr
                            key={query.id}
                            onClick={() => handleRowClick(query)}
                            className="clickable-row"
                        >
                            <td>{query.name || ''}</td>
                            <td>{query.sqlQuery || ''}</td>
                            <td>{query.tableAffected || ''}</td>
                            <td>{query.email || ''}</td>
                            <td>{query.reportRunFrequency || ''}</td>
                            <td>{query.status || ''}</td>
                            <td>{query.createdBy || ''}</td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="7" className="no-data">No ad hoc queries available.</td>
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

export default ViewAdHocQuery;
