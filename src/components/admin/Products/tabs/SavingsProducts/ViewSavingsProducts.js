import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading} from "../../../../../context/LoadingContext";
import { API_CONFIG } from '../../../../../config';
import './ViewSavingsProducts.css';

const ViewSavingsProducts = ({ onRowClick }) => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const [savingsProducts, setSavingsProducts] = useState([]);
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [filter, setFilter] = useState('');
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchSavingsProducts();
    }, []);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredSavingsProducts().length / pageSize));
    }, [savingsProducts, filter, pageSize]);

    const fetchSavingsProducts = async () => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/savingsproducts`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setSavingsProducts(response.data || []);
        } catch (error) {
            console.error('Error fetching savings products:', error);
        } finally {
            stopLoading();
        }
    };

    const handleFilterChange = (e) => {
        setFilter(e.target.value);
        setCurrentPage(1);
    };

    const filteredSavingsProducts = () =>
        savingsProducts.filter((product) =>
            product.name.toLowerCase().includes(filter.toLowerCase())
        );

    const paginatedData = filteredSavingsProducts().slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    return (
        <div className="view-savings-products">
            <div className="table-controls">
                <div className="filter-container">
                    <label htmlFor="filter">Filter by Name:</label>
                    <input
                        type="text"
                        id="filter"
                        value={filter}
                        onChange={handleFilterChange}
                        placeholder="Enter savings product name..."
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
            <table className="savings-products-table">
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Short Name</th>
                    <th>Currency</th>
                    <th>Nominal Interest Rate</th>
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
                            <td>{product.currency?.name || '-'}</td>
                            <td>{product.nominalAnnualInterestRate || '0'}%</td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="5" className="no-data">
                            No savings products available.
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

export default ViewSavingsProducts;
