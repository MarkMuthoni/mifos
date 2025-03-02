import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import './ViewDataTable.css';

const DataTableView = ({ onRowClick }) => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const [dataTables, setDataTables] = useState([]);
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [filter, setFilter] = useState('');
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchDataTables();
    }, []);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredData().length / pageSize));
    }, [dataTables, filter, pageSize]);

    const fetchDataTables = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/datatables`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setDataTables(response.data);
        } catch (error) {
            console.error('Error fetching data tables:', error);
        } finally {
            stopLoading();
        }
    };

    const handleFilterChange = (e) => {
        setFilter(e.target.value);
        setCurrentPage(1);
    };

    const filteredData = () =>
        dataTables.filter(
            (table) =>
                typeof table.registeredTableName === 'string' &&
                table.registeredTableName.toLowerCase().includes(filter.toLowerCase())
        );

    const paginatedData = filteredData().slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
        setCurrentPage(1);
    };

    return (
        <div className="data-table-container">
            <div className="table-controls">
                <div className="filter-container">
                    <label htmlFor="filter">Filter by Name:</label>
                    <input
                        type="text"
                        id="filter"
                        value={filter}
                        onChange={handleFilterChange}
                        placeholder="Enter data table name..."
                    />
                </div>
                <div className="page-size-selector">
                    <label htmlFor="rows-per-page">Rows per page:</label>
                    <select
                        id="rows-per-page"
                        value={pageSize}
                        onChange={handlePageSizeChange}
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>

            <table className="data-table">
                <thead>
                <tr>
                    <th>Registered Table Name</th>
                    <th>Application Table Name</th>
                </tr>
                </thead>
                <tbody>
                {paginatedData.length > 0 ? (
                    paginatedData.map((dataTable, index) => (
                        <tr
                            key={index}
                            onClick={() => onRowClick(dataTable)}
                            className="clickable-row"
                        >
                            <td>{dataTable.registeredTableName || ''}</td>
                            <td>{dataTable.applicationTableName || ''}</td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="3" className="no-data">No data tables available</td>
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

export default DataTableView;
