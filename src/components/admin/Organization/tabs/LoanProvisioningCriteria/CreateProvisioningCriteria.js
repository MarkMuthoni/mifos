import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../../../../context/AuthContext";
import { useLoading } from "../../../../../context/LoadingContext";
import { API_CONFIG } from "../../../../../config";
import { FaEdit } from "react-icons/fa";
import "./CreateProvisioningCriteria.css";
import {NotificationContext} from "../../../../../context/NotificationContext";

const CreateProvisioningCriteria = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();

    const [criteriaName, setCriteriaName] = useState("");
    const [loanProducts, setLoanProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [criteriaDefinitions, setCriteriaDefinitions] = useState([]);
    const [glAccounts, setGlAccounts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState({
        minAge: "",
        maxAge: "",
        percentage: "",
        liabilityAccount: "",
        expenseAccount: "",
        rowIndex: null,
    });

    useEffect(() => {
        fetchTemplateData();
    }, []);

    const fetchTemplateData = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/provisioningcriteria/template`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });
            const { definitions, loanProducts, glAccounts } = response.data;
            setCriteriaDefinitions(definitions || []);
            setLoanProducts(loanProducts || []);
            setGlAccounts(glAccounts || []);
        } catch (error) {
            console.error("Error fetching provisioning criteria template:", error);
        } finally {
            stopLoading();
        }
    };

    const handleProductSelection = (productId) => {
        setSelectedProducts((prev) =>
            prev.includes(productId)
                ? prev.filter((id) => id !== productId)
                : [...prev, productId]
        );
    };

    const handleEditClick = (index) => {
        const criteria = criteriaDefinitions[index];
        setModalData({
            minAge: criteria.minAge || "",
            maxAge: criteria.maxAge || "",
            percentage: criteria.percentage || "",
            liabilityAccount: criteria.liabilityAccount || "",
            expenseAccount: criteria.expenseAccount || "",
            rowIndex: index,
        });
        setIsModalOpen(true);
    };

    const handleModalChange = (field, value) => {
        setModalData((prev) => ({ ...prev, [field]: value }));
    };

    const handleModalSubmit = () => {
        const { rowIndex, minAge, maxAge, percentage, liabilityAccount, expenseAccount } = modalData;
        const updatedDefinitions = [...criteriaDefinitions];
        updatedDefinitions[rowIndex] = {
            ...updatedDefinitions[rowIndex],
            minAge,
            maxAge,
            percentage,
            liabilityAccount,
            expenseAccount,
        };
        setCriteriaDefinitions(updatedDefinitions);
        setIsModalOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            name: criteriaName,
            products: selectedProducts.map((id) => ({ id })),
            criteriaDefinitions,
        };

        startLoading();
        try {
            await axios.post(`/fineract-provider/api/v1/provisioningcriteria`, payload, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });
            showNotification("Provisioning Criteria created successfully!", 'success');
        } catch (error) {
            console.error("Error creating provisioning criteria:", error);
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="create-provisioning-criteria-container">
            <form className="create-provisioning-criteria-form" onSubmit={handleSubmit}>
                <h3 className="create-provisioning-criteria-title">Provisioning Criteria</h3>
                <div className="create-holiday-row">
                    <div className="create-provisioning-criteria-group">
                        <label htmlFor="criteriaName" className="create-provisioning-criteria-label">
                            Provisioning Criteria Name <span className="create-required">*</span>
                        </label>
                        <input
                            type="text"
                            id="criteriaName"
                            value={criteriaName}
                            onChange={(e) => setCriteriaName(e.target.value)}
                            className="create-provisioning-criteria-input"
                            placeholder="Enter criteria name"
                            required
                        />
                    </div>
                    <div className="create-provisioning-criteria-group">
                        <label className="create-provisioning-criteria-label">Selected Products <span
                            className="create-required">*</span></label>
                        <div className="create-provisioning-criteria-grid">
                            {loanProducts.map((product) => (
                                <div key={product.id} className="create-provisioning-criteria-checkbox">
                                    <input
                                        type="checkbox"
                                        id={`product-${product.id}`}
                                        checked={selectedProducts.includes(product.id)}
                                        onChange={() => handleProductSelection(product.id)}
                                        className="create-provisioning-criteria-checkbox-input"
                                    />
                                    <label
                                        htmlFor={`product-${product.id}`}
                                        className="create-provisioning-criteria-checkbox-label"
                                    >
                                        {product.name}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                    <h4 className="create-provisioning-criteria-subtitle">Criteria Definitions</h4>
                    <table className="create-provisioning-criteria-table">
                        <thead>
                        <tr>
                            <th>Category</th>
                            <th>Min Age</th>
                            <th>Max Age</th>
                            <th>Percentage(%)</th>
                            <th>Liability Account</th>
                            <th>Expense Account</th>
                            <th>Action</th>
                        </tr>
                        </thead>
                        <tbody>
                        {criteriaDefinitions.map((definition, index) => (
                            <tr key={definition.categoryId}>
                                <td>{definition.categoryName}</td>
                                <td>{definition.minAge || "0"}</td>
                                <td>{definition.maxAge || "0"}</td>
                                <td>{definition.percentage || "0"}</td>
                                <td>{definition.liabilityAccount || "-"}</td>
                                <td>{definition.expenseAccount || "-"}</td>
                                <td>
                                    <FaEdit
                                        className="create-edit-icon"
                                        color={"#1b9a1c"}
                                        onClick={() => handleEditClick(index)}
                                    />
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    <div className="create-provisioning-criteria-actions">
                        <button
                            type="submit"
                            className="create-provisioning-criteria-submit"
                            disabled={!criteriaName || selectedProducts.length === 0 || criteriaDefinitions.length === 0}
                        >
                            Submit
                        </button>
                    </div>
            </form>
            {isModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className="create-modal-title">Edit Criteria Definition</h4>
                        <div className="create-holiday-row">
                            <div className="create-provisioning-criteria-group">
                                <label htmlFor="minAge" className="create-provisioning-criteria-label">Min Age</label>
                                <input
                                    type="number"
                                    id="minAge"
                                    value={modalData.minAge}
                                    onChange={(e) => handleModalChange("minAge", e.target.value)}
                                    className="create-provisioning-criteria-input"
                                    required
                                />
                            </div>
                            <div className="create-provisioning-criteria-group">
                                <label htmlFor="maxAge" className="create-provisioning-criteria-label">Max Age</label>
                                <input
                                    type="number"
                                    id="maxAge"
                                    value={modalData.maxAge}
                                    onChange={(e) => handleModalChange("maxAge", e.target.value)}
                                    className="create-provisioning-criteria-input"
                                    required
                                />
                            </div>
                        </div>

                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="percentage" className="create-provisioning-criteria-label">Percentage(%)</label>
                            <input
                                type="number"
                                id="percentage"
                                value={modalData.percentage}
                                onChange={(e) => handleModalChange("percentage", e.target.value)}
                                className="create-provisioning-criteria-input"
                                required
                            />
                        </div>
                        <div className="create-holiday-row">
                            <div className="create-provisioning-criteria-group">
                                <label htmlFor="liabilityAccount" className="create-provisioning-criteria-label">Liability Account</label>
                                <select
                                    id="liabilityAccount"
                                    value={modalData.liabilityAccount}
                                    onChange={(e) => handleModalChange("liabilityAccount", e.target.value)}
                                    className="create-provisioning-criteria-select"
                                    required
                                >
                                    <option value="">Select Account</option>
                                    {glAccounts.map((account) => (
                                        <option key={account.id} value={account.id}>
                                            {account.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="create-provisioning-criteria-group">
                                <label htmlFor="expenseAccount" className="create-provisioning-criteria-label">Expense Account</label>
                                <select
                                    id="expenseAccount"
                                    value={modalData.expenseAccount}
                                    onChange={(e) => handleModalChange("expenseAccount", e.target.value)}
                                    className="create-provisioning-criteria-select"
                                    required
                                >
                                    <option value="">Select Account</option>
                                    {glAccounts.map((account) => (
                                        <option key={account.id} value={account.id}>
                                            {account.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="create-provisioning-criteria-cancel"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleModalSubmit}
                                className="create-provisioning-criteria-confirm"
                                disabled={
                                    !modalData.minAge ||
                                    !modalData.maxAge ||
                                    !modalData.percentage ||
                                    !modalData.liabilityAccount ||
                                    !modalData.expenseAccount
                                }
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateProvisioningCriteria;
