import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import './ViewCodesTable.css';

const CodeTableView = ({ onRowClick }) => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const [codes, setCodes] = useState([]);
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [filter, setFilter] = useState('');
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchCodes();
    }, []);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredCodes().length / pageSize));
    }, [codes, filter, pageSize]);

    const fetchCodes = async () => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/codes`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setCodes(response.data);
        } catch (error) {
            console.error('Error fetching codes:', error);
        } finally {
            stopLoading();
        }
    };

    const handleFilterChange = (e) => {
        setFilter(e.target.value);
        setCurrentPage(1);
    };

    const filteredCodes = () =>
        codes.filter((code) =>
            code.name.toLowerCase().includes(filter.toLowerCase())
        );

    const paginatedData = filteredCodes().slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
        setCurrentPage(1);
    };

    return (
        <div className="code-table-container">
            <div className="table-controls">
                <div className="filter-container">
                    <label htmlFor="filter">Filter by Code Name:</label>
                    <input
                        type="text"
                        id="filter"
                        value={filter}
                        onChange={handleFilterChange}
                        placeholder="Enter code name..."
                    />
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
            <table className="code-table">
                <thead>
                <tr>
                    <th>Code Name</th>
                    <th>System Defined</th>
                </tr>
                </thead>
                <tbody>
                {paginatedData.length > 0 ? (
                    paginatedData.map((code) => (
                        <tr
                            key={code.id}
                            onClick={() => onRowClick(code)}
                            className="clickable-row"
                        >
                            <td>{code.name}</td>
                            <td>
                                <div className="indicator-container">
                                    <div
                                        className={`indicator ${code.systemDefined ? 'yes' : 'no'}`}
                                    ></div>
                                    <div className="tooltip">
                                        {code.systemDefined ? 'System Defined: Yes' : 'System Defined: No'}
                                    </div>
                                </div>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="2" className="no-data">No codes available</td>
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

export default CodeTableView;
