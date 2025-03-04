import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading} from "../../../../../context/LoadingContext";
import { API_CONFIG } from '../../../../../config';
import './ViewLoanProducts.css';

const ViewLoanProducts = ({ onRowClick }) => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const [loanProducts, setLoanProducts] = useState([]);
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [filter, setFilter] = useState('');
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchLoanProducts();
    }, []);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredLoanProducts().length / pageSize));
    }, [loanProducts, filter, pageSize]);

    const fetchLoanProducts = async () => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/loanproducts`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setLoanProducts(response.data || []);
        } catch (error) {
            console.error('Error fetching loan products:', error);
        } finally {
            stopLoading();
        }
    };

    const handleFilterChange = (e) => {
        setFilter(e.target.value);
        setCurrentPage(1);
    };

    const filteredLoanProducts = () =>
        loanProducts.filter((product) =>
            product.name.toLowerCase().includes(filter.toLowerCase())
        );

    const paginatedData = filteredLoanProducts().slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    return (
        <div className="view-loan-products">
            <div className="table-controls">
                <div className="filter-container">
                    <label htmlFor="filter">Filter by Name:</label>
                    <input
                        type="text"
                        id="filter"
                        value={filter}
                        onChange={handleFilterChange}
                        placeholder="Enter loan product name..."
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
            <table className="loan-products-table">
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Short Name</th>
                    <th>Status</th>
                    <th>Expiry</th>
                    <th>Include in Borrower Cycle</th>
                </tr>
                </thead>
                <tbody>
                {paginatedData.length > 0 ? (
                    paginatedData.map((product) => (
                        <tr
                            key={product.id}
                            onClick={() => onRowClick(product)}
                            className="clickable-row"
                        >
                            <td>{product.name}</td>
                            <td>{product.shortName}</td>
                            <td>
                                <span
                                    className={`status-badge ${
                                        product.status === "loanProduct.active" ? "status-active" : "status-inactive"
                                    }`}
                                >
                                    {product.status === "loanProduct.active" ? "Active" : "Inactive"}
                                </span>
                            </td>
                            <td>
                                {product.closeDate
                                    ? new Date(product.closeDate).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: '2-digit',
                                    })
                                    : ' '}
                            </td>
                            <td>{product.includeInBorrowerCycle ? 'Yes' : 'No'}</td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="5" className="no-data">
                            No loan products available.
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

export default ViewLoanProducts;
