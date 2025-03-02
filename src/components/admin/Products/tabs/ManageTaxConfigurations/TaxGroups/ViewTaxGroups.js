import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../../context/AuthContext';
import { useLoading } from '../../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../../config';
import './ViewTaxGroups.css';

const ViewTaxGroups = () => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const [taxGroups, setTaxGroups] = useState([]);
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [nameFilter, setNameFilter] = useState('');
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchTaxGroups();
    }, []);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredGroups().length / pageSize));
    }, [taxGroups, nameFilter, pageSize]);

    const fetchTaxGroups = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/taxes/group`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setTaxGroups(response.data || []);
        } catch (error) {
            console.error('Error fetching tax groups:', error);
        } finally {
            stopLoading();
        }
    };

    const filteredGroups = () =>
        taxGroups.filter((group) =>
            group.name?.toLowerCase().includes(nameFilter.toLowerCase())
        );

    const paginatedData = filteredGroups().slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handleRowClick = (group) => {
        console.log('Selected Tax Group:', group);
    };

    return (
        <div className="view-tax-groups">
            <div className="table-controls">
                <div className="filter-container">
                    <div className="filter-item">
                        <label htmlFor="nameFilter">Filter by Name:</label>
                        <input
                            type="text"
                            id="nameFilter"
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                            placeholder="Search by name..."
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
            <table className="tax-groups-table">
                <thead>
                <tr>
                    <th>Name</th>
                </tr>
                </thead>
                <tbody>
                {paginatedData.length > 0 ? (
                    paginatedData.map((group) => (
                        <tr
                            key={group.id}
                            onClick={() => handleRowClick(group)}
                            className="clickable-row"
                        >
                            <td>{group.name}</td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="1" className="no-data">
                            No tax groups available.
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

export default ViewTaxGroups;
