import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import './ViewHooks.css';

const ViewHooksTable = () => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const [hooks, setHooks] = useState([]);
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [filter, setFilter] = useState({ name: '', status: '' });
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchHooks();
    }, []);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredHooks().length / pageSize));
    }, [hooks, filter, pageSize]);

    const fetchHooks = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/hooks`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setHooks(response.data);
        } catch (error) {
            console.error('Error fetching hooks:', error);
        } finally {
            stopLoading();
        }
    };

    const filteredHooks = () =>
        hooks.filter((hook) => {
            const matchesName = hook.name
                .toLowerCase()
                .includes(filter.name.toLowerCase());
            const matchesStatus =
                filter.status === '' || filter.status === hook.status.toLowerCase();
            return matchesName && matchesStatus;
        });

    const paginatedData = filteredHooks().slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
        setCurrentPage(1);
    };

    const handleRowClick = (hook) => {
        // console.log('Row Data:', hook);
    };

    return (
        <div className="hooks-table-container">
            <div className="table-controls">
                <div className="filter-container">
                    <div className="filter-item">
                        <label htmlFor="nameFilter">Filter by Name:</label>
                        <input
                            type="text"
                            id="nameFilter"
                            value={filter.name}
                            onChange={(e) =>
                                setFilter((prev) => ({ ...prev, name: e.target.value }))
                            }
                            placeholder="Enter hook name..."
                        />
                    </div>
                    <div className="filter-item">
                        <label htmlFor="statusFilter">Filter by Status:</label>
                        <select
                            id="statusFilter"
                            value={filter.status}
                            onChange={(e) =>
                                setFilter((prev) => ({ ...prev, status: e.target.value }))
                            }
                        >
                            <option value="">All</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                <div className="page-size-selector">
                    <label>Rows per page: </label>
                    <select value={pageSize} onChange={handlePageSizeChange}>
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>
            <table className="hooks-table">
                <thead>
                <tr>
                    <th>Hook Template</th>
                    <th>Hook Name</th>
                    <th>Status</th>
                </tr>
                </thead>
                <tbody>
                {paginatedData.length > 0 ? (
                    paginatedData.map((hook) => (
                        <tr
                            key={hook.id}
                            onClick={() => handleRowClick(hook)}
                            className="clickable-row"
                        >
                            <td>{hook.template}</td>
                            <td>{hook.name}</td>
                            <td>
                                <div className="indicator-container">
                                    <div
                                        className={`indicator ${
                                            hook.status === 'enabled' ? 'yes' : 'no'
                                        }`}
                                    ></div>
                                    <div className="tooltip">
                                        {hook.status.charAt(0).toUpperCase() +
                                            hook.status.slice(1)}
                                    </div>
                                </div>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="3" className="no-data">
                            No hooks available
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
        </div>
    );
};

export default ViewHooksTable;
