import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import './ViewEntityDataTableChecks.css';
import {FaTrash} from "react-icons/fa";
import {NotificationContext} from "../../../../../context/NotificationContext";

const ViewEntityDataTableChecks = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const [dataTableChecks, setDataTableChecks] = useState([]);
    const [entityFilter, setEntityFilter] = useState('');
    const [productFilter, setProductFilter] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchDataTableChecks();
    }, []);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredDataTableChecks().length / pageSize));
    }, [dataTableChecks, entityFilter, productFilter, pageSize]);

    const fetchDataTableChecks = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/entityDatatableChecks?offset=0&limit=-1`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.data && Array.isArray(response.data.pageItems)) {
                setDataTableChecks(response.data.pageItems);
            } else {
                setDataTableChecks([]);
            }
        } catch (error) {
            console.error('Error fetching data table checks:', error);
            setDataTableChecks([]);
        } finally {
            stopLoading();
        }
    };

    const filteredDataTableChecks = () =>
        dataTableChecks.filter((check) => {
            const entity = check.entity || "";
            const productName = check.productName || "";

            return (
                entity.toLowerCase().includes(entityFilter.toLowerCase()) &&
                productName.toLowerCase().includes(productFilter.toLowerCase())
            );
        });

    const paginatedData = filteredDataTableChecks().slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this data table check?")) {
            startLoading();
            try {
                await axios.delete(`/fineract-provider/api/v1/entityDatatableChecks/${id}`, {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                });

                fetchDataTableChecks();
                showNotification("Data table deleted!", 'success');
            } catch (error) {
                console.error("Error deleting data table check:", error);
                showNotification("An error occurred while deleting the data table check!", 'error');
            } finally {
                stopLoading();
            }
        }
    };

    return (
        <div className="view-entity-datatable-checks">
            <div className="table-controls">
                <div className="filter-container">
                    <div className="filter-item">
                        <label htmlFor="entityFilter">Filter by Entity:</label>
                        <input
                            type="text"
                            id="entityFilter"
                            value={entityFilter}
                            onChange={(e) => setEntityFilter(e.target.value)}
                            placeholder="Enter entity name..."
                        />
                    </div>
                    <div className="filter-item">
                        <label htmlFor="productFilter">Filter by Product Name:</label>
                        <input
                            type="text"
                            id="productFilter"
                            value={productFilter}
                            onChange={(e) => setProductFilter(e.target.value)}
                            placeholder="Enter product name..."
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
            <table className="datatable-checks-table">
                <thead>
                <tr>
                    <th>Entity</th>
                    <th>Product Name</th>
                    <th>Data Table</th>
                    <th>Status</th>
                    <th>System Defined</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {paginatedData.length > 0 ? (
                    paginatedData.map((check) => (
                        <tr
                            key={check.id}
                        >
                            <td>{check.entity || 'N/A'}</td>
                            <td>{check.productName || 'N/A'}</td>
                            <td>{check.datatableName || 'N/A'}</td>
                            <td>{check.status.value || 'N/A'}</td>
                            <td>{check.systemDefined ? 'Yes' : 'No'}</td>
                            <td style={{ cursor: "pointer" }}>
                                <FaTrash color="red"
                                         onClick={() => handleDelete(check.id)}
                                         size={20} />
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="6" className="no-data">No data table checks available.</td>
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

export default ViewEntityDataTableChecks;
