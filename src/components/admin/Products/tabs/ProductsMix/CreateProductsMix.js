import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../../../../context/AuthContext";
import { useLoading } from "../../../../../context/LoadingContext";
import { API_CONFIG } from "../../../../../config";
import "./CreateProductsMix.css";
import {NotificationContext} from "../../../../../context/NotificationContext";

const CreateProductsMix = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();

    const [products, setProducts] = useState([]);
    const [allowedProducts, setAllowedProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState("");
    const [restrictedProducts, setRestrictedProducts] = useState([]);
    const [selectedRestrictedProducts, setSelectedRestrictedProducts] = useState([]);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        startLoading();
        try {
            const response = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/loanproducts/template?isProductMixTemplate=true`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            setProducts(response.data?.productOptions || []);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            stopLoading();
        }
    };

    const fetchAllowedProducts = async (productId) => {
        startLoading();
        try {
            const response = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/loanproducts/${productId}/productmix?template=true`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            setAllowedProducts(response.data?.allowedProducts || []);
        } catch (error) {
            console.error("Error fetching allowed products:", error);
        } finally {
            stopLoading();
        }
    };

    const handleProductChange = (productId) => {
        setSelectedProduct(productId);
        setSelectedRestrictedProducts([]);
        fetchAllowedProducts(productId);
    };

    const handleSubmit = async () => {
        const payload = {
            restrictedProducts: selectedRestrictedProducts.map(Number),
        };

        try {
            startLoading();
            await axios.post(`${API_CONFIG.proxy}/fineract-provider/api/v1/loanproducts/${selectedProduct}/productmix`, payload, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });
            showNotification("Products Mix created successfully!, 'success");
            setSelectedProduct("");
            setSelectedRestrictedProducts([]);
            setAllowedProducts([]);
        } catch (error) {
            console.error("Error creating products mix:", error);
            showNotification("Error creating products mix:", 'error');
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="create-products-mix">
            <h3 className="products-mix-heading">Create Products Mix</h3>

            <div className="products-mix-form-group">
                <label htmlFor="product" className="products-mix-label">
                    Product <span>*</span>
                </label>
                <select
                    id="product"
                    value={selectedProduct}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className="products-mix-select"
                >
                    <option value="">Select a Product</option>
                    {products.map((product) => (
                        <option key={product.id} value={product.id}>
                            {product.name}
                        </option>
                    ))}
                </select>
            </div>

            {selectedProduct && (
                <div className="products-mix-form-group">
                    <label htmlFor="restricted-products" className="products-mix-label">
                        Restricted Products <span>*</span>
                    </label>
                    <div id="restricted-products" className="products-mix-checkbox-group">
                        {allowedProducts.map((product) => (
                            <div key={product.id} className="products-mix-checkbox-item">
                                <label htmlFor={`product-${product.id}`} className="products-mix-label">
                                <input
                                    type="checkbox"
                                    id={`product-${product.id}`}
                                    value={product.id}
                                    checked={selectedRestrictedProducts.includes(product.id.toString())}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setSelectedRestrictedProducts((prev) =>
                                            e.target.checked
                                                ? [...prev, value]
                                                : prev.filter((id) => id !== value)
                                        );
                                    }}
                                    className="products-mix-checkbox-input"
                                />

                                    {product.name}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="products-mix-actions">
                <button
                    className="products-mix-cancel-button"
                    onClick={() => {
                        setSelectedProduct("");
                        setSelectedRestrictedProducts([]);
                        setAllowedProducts([]);
                    }}
                >
                    Cancel
                </button>
                <button
                    className="products-mix-submit-button"
                    onClick={handleSubmit}
                    disabled={!selectedProduct || selectedRestrictedProducts.length === 0}
                >
                    Submit
                </button>
            </div>
        </div>
    );
};

export default CreateProductsMix;
