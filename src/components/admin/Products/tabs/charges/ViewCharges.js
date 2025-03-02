import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import './ViewCharges.css';

const ViewCharges = ({ onRowClick }) => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const [charges, setCharges] = useState([]);
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [nameFilter, setNameFilter] = useState('');
    const [appliesToFilter, setAppliesToFilter] = useState('all');
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchCharges();
    }, []);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredCharges().length / pageSize));
    }, [charges, nameFilter, appliesToFilter, pageSize]);

    const fetchCharges = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/charges`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            // console.log(response.data);
            setCharges(response.data || []);
        } catch (error) {
            console.error('Error fetching charges:', error);
        } finally {
            stopLoading();
        }
    };

    const filteredCharges = () =>
        charges.filter((charge) =>
            charge.name.toLowerCase().includes(nameFilter.toLowerCase()) &&
            (appliesToFilter === 'all' || charge.chargeAppliesTo?.id === Number(appliesToFilter))
        );

    const paginatedData = filteredCharges().slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const formatCurrency = (amount, currencySymbol) => {
        if (!amount || !currencySymbol) return '-';
        const formattedAmount = Number(amount).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return `${currencySymbol} ${formattedAmount}`;
    };

    return (
        <div className="view-charges">
            <div className="table-controls">
                <div className="filter-container">
                    <div className="filter-item">
                        <label htmlFor="nameFilter">Filter by Name:</label>
                        <input
                            type="text"
                            id="nameFilter"
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                            placeholder="Enter charge name..."
                        />
                    </div>
                    <div className="filter-item">
                        <label htmlFor="appliesToFilter">Applies To:</label>
                        <select
                            id="appliesToFilter"
                            value={appliesToFilter}
                            onChange={(e) => setAppliesToFilter(e.target.value)}
                        >
                            <option value="all">All</option>
                            <option value="1">Loans</option>
                            <option value="2">Savings</option>
                            <option value="3">Clients</option>
                            <option value="4">Shares</option>
                        </select>
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
            <table className="charges-table">
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Applies To</th>
                    <th>Time</th>
                    <th>Calculation Amount</th>
                    <th>Is Penalty?</th>
                    <th>Is Active?</th>
                </tr>
                </thead>
                <tbody>
                {paginatedData.length > 0 ? (
                    paginatedData.map((charge) => (
                        <tr
                            key={charge.id}
                            onClick={() => onRowClick(charge)}
                            className="clickable-row"
                        >
                            <td>{charge.name || ''}</td>

                            <td>{charge.chargeAppliesTo?.value || ''}</td>

                            <td>{charge.chargeTimeType?.value || ''}</td>

                            <td>
                                {charge.amount
                                    ? formatCurrency(charge.amount, charge.currency?.displaySymbol || '')
                                    : '-'}
                            </td>

                            <td>{charge.penalty ? 'Yes' : 'No'}</td>

                            <td>{charge.active ? 'Yes' : 'No'}</td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="6" className="no-data">No charges available.</td>
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

export default ViewCharges;
