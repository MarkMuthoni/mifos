import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import './ViewCurrencyConfiguration.css';

const ViewCurrencyConfiguration = () => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const [currencies, setCurrencies] = useState([]);
    const [nameFilter, setNameFilter] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchCurrencies();
    }, []);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredCurrencies().length / pageSize));
    }, [currencies, nameFilter, pageSize]);

    const fetchCurrencies = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/currencies`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setCurrencies(response.data?.selectedCurrencyOptions || []);
        } catch (error) {
            console.error('Error fetching currencies:', error);
        } finally {
            stopLoading();
        }
    };

    const filteredCurrencies = () =>
        currencies.filter((currency) =>
            currency.name.toLowerCase().includes(nameFilter.toLowerCase())
        );

    const paginatedData = filteredCurrencies().slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    return (
        <div className="view-currency-configuration">
            <div className="table-controls">
                <div className="filter-container">
                    <div className="filter-item">
                        <label htmlFor="nameFilter" className="name-filter-label">Filter by Name:</label>
                        <input
                            type="text"
                            id="nameFilter"
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                            placeholder="Enter currency name..."
                            className="name-filter-input"
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
            <table className="currency-table">
                <thead>
                <tr>
                    <th>Currency Name</th>
                    <th>Currency Code</th>
                </tr>
                </thead>
                <tbody>
                {paginatedData.length > 0 ? (
                    paginatedData.map((currency) => (
                        <tr
                            key={currency.code}
                            className="clickable-row"
                        >
                            <td>{currency.name || ' '}</td>
                            <td>{currency.code || ' '}</td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="2" className="no-data">No currencies available.</td>
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

export default ViewCurrencyConfiguration;
