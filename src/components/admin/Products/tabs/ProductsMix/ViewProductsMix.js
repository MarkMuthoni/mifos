import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import './ViewProductsMix.css';
import {NotificationContext} from "../../../../../context/NotificationContext";

const ViewProductsMix = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const [productsMix, setProductsMix] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [restrictedProducts, setRestrictedProducts] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [allowedProducts, setAllowedProducts] = useState([]);
    const [originalRestrictedProducts, setOriginalRestrictedProducts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [filter, setFilter] = useState('');
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchProductsMix();
    }, []);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredProductsMix().length / pageSize));
    }, [productsMix, filter, pageSize]);

    const fetchProductsMix = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/loanproducts?associations=productMixes`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setProductsMix(response.data || []);
        } catch (error) {
            console.error('Error fetching products mix:', error);
        } finally {
            stopLoading();
        }
    };

    const handleRowClick = async (product) => {
        startLoading();
        try {
            const response = await axios.get(
                `/fineract-provider/api/v1/loanproducts/${product.productId}/productmix`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            setSelectedProduct(response.data);
            setRestrictedProducts(response.data.restrictedProducts.map((p) => p.id));
            setOriginalRestrictedProducts(response.data.restrictedProducts.map((p) => p.id));
            setAllowedProducts(response.data.allowedProducts || []);
            setAllProducts([
                ...response.data.allowedProducts,
                ...response.data.restrictedProducts,
            ]);
            setIsModalOpen(true);
        } catch (error) {
            console.error('Error fetching product mix details:', error);
        } finally {
            stopLoading();
        }
    };

    const handleRestrictedProductsChange = (productId) => {
        setRestrictedProducts((prev) =>
            prev.includes(productId)
                ? prev.filter((id) => id !== productId)
                : [...prev, productId]
        );
    };

    const handleModalSubmit = async () => {
        startLoading();
        try {
            const payload = {
                restrictedProducts,
            };
            await axios.put(
                `/fineract-provider/api/v1/loanproducts/${selectedProduct.productId}/productmix`,
                payload,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            showNotification('Product mix updated successfully!', 'success');
            setIsModalOpen(false);
            fetchProductsMix();
        } catch (error) {
            console.error('Error updating product mix:', error);
            showNotification('Error updating product mix!', 'error');
        } finally {
            stopLoading();
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this product mix?')) return;

        startLoading();
        try {
            const payload = {
                changes: { removedProductsForMix: restrictedProducts },
                productId: selectedProduct.productId,
            };
            await axios.delete(
                `/fineract-provider/api/v1/loanproducts/${selectedProduct.productId}/productmix`,
                {
                    data: payload,
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            showNotification('Product mix deleted successfully!', 'success');
            setIsModalOpen(false);
            fetchProductsMix();
        } catch (error) {
            console.error('Error deleting product mix:', error);
            showNotification('Error deleting product mix!', 'error');
        } finally {
            stopLoading();
        }
    };

    const filteredProductsMix = () =>
        productsMix.filter((product) =>
            product.productName?.toLowerCase().includes(filter.toLowerCase())
        );

    const paginatedData = filteredProductsMix().slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const ProductMixModal = ({isOpen, product, restrictedProducts, allProducts, allowedProducts, onRestrictedChange, onSubmit, onDelete, onClose,}) => {
        const isChanged =
            JSON.stringify(restrictedProducts) !== JSON.stringify(originalRestrictedProducts);

        if (!isOpen) return null;

        return (
            <div className="edit-modal-overlay">
                <div className="edit-modal-content">
                    <h3 className={"staged-form-title"}>Edit Product Mix</h3>
                    <div className="staged-form-field">
                        <label>Product</label>
                        <input
                            type="text"
                            value={product.productName}
                            readOnly
                            className="staged-form-input"
                        />
                    </div>
                    <div className="staged-form-field">
                        <label>Restricted Products</label>
                        <div className="checkbox-group">
                            {allProducts.map((p) => (
                                <label key={p.id} className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        checked={restrictedProducts.includes(p.id)}
                                        onChange={() => onRestrictedChange(p.id)}
                                    />
                                    {p.name}
                                </label>
                            ))}
                        </div>
                    </div>
                    <h4>Allowed Products</h4>
                    <div className="staged-form-field">
                        <div className="checkbox-group">
                            {allowedProducts.map((p) => (
                                <label key={p.id} className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        disabled
                                    />
                                    {p.name}
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button className="modal-cancel-button" onClick={onClose}>
                            Cancel
                        </button>
                        <button className="modal-delete-button" onClick={onDelete}>
                            Delete
                        </button>
                        <button
                            className="modal-submit-button"
                            onClick={onSubmit}
                            disabled={!isChanged}
                        >
                            Submit
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="view-products-mix">
            <div className="table-controls">
                <div className="filter-container">
                    <label htmlFor="filter">Filter by Name:</label>
                    <input
                        type="text"
                        id="filter"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        placeholder="Enter product name..."
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
            <table className="products-mix-table">
                <thead>
                <tr>
                    <th>Product Name</th>
                </tr>
                </thead>
                <tbody>
                {paginatedData.length > 0 ? (
                    paginatedData.map((product) => (
                        <tr
                            key={product.productId}
                            onClick={() => handleRowClick(product)}
                            className="clickable-row"
                        >
                            <td>{product.productName}</td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="1" className="no-data">
                            No products mix available.
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

            <ProductMixModal
                isOpen={isModalOpen}
                product={selectedProduct}
                restrictedProducts={restrictedProducts}
                allowedProducts={allowedProducts}
                allProducts={allProducts}
                onRestrictedChange={handleRestrictedProductsChange}
                onSubmit={handleModalSubmit}
                onDelete={handleDelete}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
};

export default ViewProductsMix;
