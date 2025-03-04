import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import './ViewProvisioningCriteria.css';

const ViewProvisioningCriteria = () => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const [criteria, setCriteria] = useState([]);
    const [nameFilter, setNameFilter] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchProvisioningCriteria();
    }, []);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredCriteria().length / pageSize));
    }, [criteria, nameFilter, pageSize]);

    const fetchProvisioningCriteria = async () => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/provisioningcriteria`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setCriteria(response.data || []);
        } catch (error) {
            console.error('Error fetching provisioning criteria:', error);
        } finally {
            stopLoading();
        }
    };

    const filteredCriteria = () =>
        criteria.filter((item) =>
            item.name.toLowerCase().includes(nameFilter.toLowerCase())
        );

    const paginatedData = filteredCriteria().slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handleRowClick = (item) => {
        console.log('Row clicked:', item);
    };

    return (
        <div className="view-provisioning-criteria">
            <div className="table-controls">
                <div className="filter-container">
                    <label htmlFor="nameFilter">Filter by Name:</label>
                    <input
                        type="text"
                        id="nameFilter"
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                        placeholder="Enter criteria name..."
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
            <table className="provisioning-criteria-table">
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Created By</th>
                </tr>
                </thead>
                <tbody>
                {paginatedData.length > 0 ? (
                    paginatedData.map((item) => (
                        <tr
                            key={item.id}
                            className="clickable-row"
                            onClick={() => handleRowClick(item)}
                        >
                            <td>{item.name || '-'}</td>
                            <td>{item.createdBy || '-'}</td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="2" className="no-data">No provisioning criteria available.</td>
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

export default ViewProvisioningCriteria;
