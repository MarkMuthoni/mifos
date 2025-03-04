import React, { useState, useEffect, useContext } from "react";
import {Link, useNavigate} from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../../../../context/AuthContext";
import { useLoading } from "../../../../../context/LoadingContext";
import { API_CONFIG } from "../../../../../config";
import "./FundMapping.css";

const FundMapping = () => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [offices, setOffices] = useState([]);
    const [selectedLoanStatuses, setSelectedLoanStatuses] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [selectedOffices, setSelectedOffices] = useState([]);
    const [dateType, setDateType] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [loanOutstandingPercentageChecked, setLoanOutstandingPercentageChecked] = useState(true);
    const [comparisonConditionPercentage, setComparisonConditionPercentage] = useState("between");
    const [percentageValues, setPercentageValues] = useState({ min: "", max: "" });
    const [loanOutstandingAmountChecked, setLoanOutstandingAmountChecked] = useState(true);
    const [comparisonConditionAmount, setComparisonConditionAmount] = useState("between");
    const [amountValues, setAmountValues] = useState({ min: "", max: "" });

    const [tableData, setTableData] = useState([]);
    const [showForm, setShowForm] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        fetchTemplateData();
    }, []);

    const fetchTemplateData = async () => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/search/template`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });
            const data = response.data || {};
            setProducts(data.loanProducts || []);
            setOffices(data.offices || []);
        } catch (error) {
            console.error("Error fetching template data:", error);
        } finally {
            stopLoading();
        }
    };

    const getDefaultDate = () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split("T")[0];
    };

    const isFormValid = () => {
        if (!dateType || !fromDate || !toDate) return false;

        if (loanOutstandingPercentageChecked) {
            if (
                !comparisonConditionPercentage ||
                (comparisonConditionPercentage === "between" &&
                    (!percentageValues.min || !percentageValues.max)) ||
                (comparisonConditionPercentage !== "between" && !percentageValues.min)
            ) {
                return false;
            }
        }

        if (loanOutstandingAmountChecked) {
            if (
                !comparisonConditionAmount ||
                (comparisonConditionAmount === "between" &&
                    (!amountValues.min || !amountValues.max)) ||
                (comparisonConditionAmount !== "between" && !amountValues.min)
            ) {
                return false;
            }
        }

        return true;
    };

    const handleCancel = () => {
        navigate('/organization');
    };

    const handleSubmit = async () => {
        startLoading();
        try {
            const payload = {
                loanStatuses: selectedLoanStatuses,
                products: selectedProducts,
                offices: selectedOffices,
                dateType,
                fromDate,
                toDate,
                loanOutstandingPercentageChecked,
                percentageCondition: comparisonConditionPercentage,
                percentageMin: percentageValues.min || null,
                percentageMax: percentageValues.max || null,
                loanOutstandingAmountChecked,
                amountCondition: comparisonConditionAmount,
                amountMin: amountValues.min || null,
                amountMax: amountValues.max || null,
                locale: "en",
            };

            const response = await axios.post(`${API_CONFIG.proxy}/fineract-provider/api/v1/search/advance`, payload, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });

            setTableData(response.data || []);
            setShowForm(false);
        } catch (error) {
            console.error("Error submitting data:", error);
        } finally {
            stopLoading();
        }
    };

    const handleShowForm = () => {
        setShowForm(true);
    };

    const paginatedData = tableData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handlePageSizeChange = (e) => {
        const newPageSize = Number(e.target.value);
        setPageSize(newPageSize);
        setCurrentPage(1);
    };

    return (
        <div className="fund-mapping-container neighbor-element">
            <h2 className="page-heading">
                <Link to="/organization" className="breadcrumb-link">Organization</Link>{" "}. Fund Mapping
            </h2>

            {showForm ? (
                <form className="fund-mapping-form">
                    <div className="fund-mapping-form-group">
                        <label className="fund-mapping-form-label">Loan Status</label>
                        <div className="fund-mapping-checkbox-group">
                            {[
                                {id: "all", name: "All"},
                                {id: "active", name: "Active"},
                                {id: "overpaid", name: "Overpaid"},
                                {id: "closed_met", name: "Closed (obligations met)"},
                                {id: "closed_written_off", name: "Closed (written-off)"},
                            ].map((status) => (
                                <label key={status.id} className="fund-mapping-checkbox-label">
                                    <input
                                        type="checkbox"
                                        value={status.id}
                                        checked={selectedLoanStatuses.includes(status.id)}
                                        onChange={(e) => {
                                            const {checked, value} = e.target;
                                            setSelectedLoanStatuses((prev) =>
                                                checked ? [...prev, value] : prev.filter((s) => s !== value)
                                            );
                                        }}
                                    />
                                    {status.name}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="fund-mapping-row">
                        <div className="fund-mapping-column">
                            <label className="fund-mapping-form-label">Products</label>
                            <div className="fund-mapping-checkbox-group">
                                {products.map((product) => (
                                    <label key={product.id} className="fund-mapping-checkbox-label">
                                        <input
                                            type="checkbox"
                                            value={product.id}
                                            // checked={selectedProducts.includes(product.id)}
                                            onChange={(e) => {
                                                const {checked, value} = e.target;
                                                setSelectedProducts((prev) =>
                                                    checked ? [...prev, value] : prev.filter((p) => p !== value)
                                                );
                                            }}
                                        />
                                        {product.name}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="fund-mapping-column">
                            <label className="fund-mapping-form-label">Offices</label>
                            <div className="fund-mapping-checkbox-group">
                                {offices.map((office) => (
                                    <label key={office.id} className="fund-mapping-checkbox-label">
                                        <input
                                            type="checkbox"
                                            value={office.id}
                                            // checked={selectedOffices.includes(office.id)}
                                            onChange={(e) => {
                                                const {checked, value} = e.target;
                                                setSelectedOffices((prev) =>
                                                    checked ? [...prev, value] : prev.filter((o) => o !== value)
                                                );
                                            }}
                                        />
                                        {office.name}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="fund-mapping-row">
                        <div className="fund-mapping-column">
                            <label className="fund-mapping-form-label">Date Type</label>
                            <select
                                value={dateType}
                                onChange={(e) => setDateType(e.target.value)}
                                className="fund-mapping-form-select"
                            >
                                <option value="">Select Date Type</option>
                                <option value="disbursement">Disbursement</option>
                                <option value="repayment">Repayment</option>
                            </select>
                        </div>
                        <div className="fund-mapping-column">
                            <label className="fund-mapping-form-label">From Date</label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                max={getDefaultDate()}
                                className="fund-mapping-form-input"
                            />
                        </div>
                        <div className="fund-mapping-column">
                            <label className="fund-mapping-form-label">To Date</label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                max={getDefaultDate()}
                                className="fund-mapping-form-input"
                            />
                        </div>
                    </div>

                    <div className="fund-mapping-checkbox-group">
                        <label>
                            Loan Outstanding Percentage
                            <input
                                type="checkbox"
                                checked={loanOutstandingPercentageChecked}
                                onChange={() =>
                                    setLoanOutstandingPercentageChecked((prevState) => !prevState)
                                }
                            />
                        </label>
                    </div>

                    {loanOutstandingPercentageChecked && (
                        <div className="fund-mapping-row">
                            <div className="fund-mapping-column">
                                <label className="fund-mapping-form-label">Comparison Condition</label>
                                <select
                                    value={comparisonConditionPercentage}
                                    onChange={(e) => setComparisonConditionPercentage(e.target.value)}
                                    className="fund-mapping-form-select"
                                >
                                    <option value="between">Between</option>
                                    <option value="lessOrEqual">Less or Equal To</option>
                                    <option value="greaterOrEqual">Greater or Equal To</option>
                                    <option value="lessThan">Less Than</option>
                                    <option value="greaterThan">Greater Than</option>
                                    <option value="equals">Equals</option>
                                </select>
                            </div>

                            {comparisonConditionPercentage === "between" ? (
                                <>
                                    <div className="fund-mapping-column">
                                        <label className="fund-mapping-form-label">Min Value</label>
                                        <input
                                            type="number"
                                            value={percentageValues.min}
                                            onChange={(e) =>
                                                setPercentageValues({...percentageValues, min: e.target.value})
                                            }
                                            className="fund-mapping-form-input"
                                        />
                                    </div>
                                    <div className="fund-mapping-column">
                                        <label className="fund-mapping-form-label">Max Value</label>
                                        <input
                                            type="number"
                                            value={percentageValues.max}
                                            onChange={(e) =>
                                                setPercentageValues({...percentageValues, max: e.target.value})
                                            }
                                            className="fund-mapping-form-input"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="fund-mapping-column">
                                    <label className="fund-mapping-form-label">Comparison Value</label>
                                    <input
                                        type="number"
                                        value={percentageValues.min}
                                        onChange={(e) =>
                                            setPercentageValues({...percentageValues, min: e.target.value})
                                        }
                                        className="fund-mapping-form-input"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <div className="fund-mapping-checkbox-group">
                        <label>
                            Loan Outstanding Amount
                            <input
                                type="checkbox"
                                checked={loanOutstandingAmountChecked}
                                onChange={() =>
                                    setLoanOutstandingAmountChecked((prevState) => !prevState)
                                }
                            />
                        </label>
                    </div>

                    {loanOutstandingAmountChecked && (
                        <div className="fund-mapping-row">
                            <div className="fund-mapping-column">
                                <label className="fund-mapping-form-label">Comparison Condition</label>
                                <select
                                    value={comparisonConditionAmount}
                                    onChange={(e) => setComparisonConditionAmount(e.target.value)}
                                    className="fund-mapping-form-select"
                                >
                                    <option value="between">Between</option>
                                    <option value="lessOrEqual">Less or Equal To</option>
                                    <option value="greaterOrEqual">Greater or Equal To</option>
                                    <option value="lessThan">Less Than</option>
                                    <option value="greaterThan">Greater Than</option>
                                    <option value="equals">Equals</option>
                                </select>
                            </div>

                            {comparisonConditionAmount === "between" ? (
                                <>
                                    <div className="fund-mapping-column">
                                        <label className="fund-mapping-form-label">Min Value</label>
                                        <input
                                            type="number"
                                            value={amountValues.min}
                                            onChange={(e) =>
                                                setAmountValues({...amountValues, min: e.target.value})
                                            }
                                            className="fund-mapping-form-input"
                                        />
                                    </div>
                                    <div className="fund-mapping-column">
                                        <label className="fund-mapping-form-label">Max Value</label>
                                        <input
                                            type="number"
                                            value={amountValues.max}
                                            onChange={(e) =>
                                                setAmountValues({...amountValues, max: e.target.value})
                                            }
                                            className="fund-mapping-form-input"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="fund-mapping-column">
                                    <label className="fund-mapping-form-label">Comparison Value</label>
                                    <input
                                        type="number"
                                        value={amountValues.min}
                                        onChange={(e) =>
                                            setAmountValues({...amountValues, min: e.target.value})
                                        }
                                        className="fund-mapping-form-input"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <div className="fund-mapping-form-actions">
                        <button
                            type="button"
                            className="fund-mapping-cancel-button"
                            onClick={handleCancel}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="fund-mapping-submit-button"
                            onClick={handleSubmit}
                            disabled={!isFormValid()}
                        >
                            Summary
                        </button>
                    </div>
                </form>
            ) : (
                <div className="fund-mapping-table-container">
                    <button onClick={handleShowForm} className="fund-mapping-show-form-button">
                        Show Form
                    </button>
                    <div className="table-controls">
                        <div className="page-size-selector">
                            <label htmlFor="pageSize">Rows per page:</label>
                            <select
                                id="pageSize"
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
                    <table className="fund-mapping-table">
                        <thead>
                        <tr>
                            <th>Office Name</th>
                            <th>Product Name</th>
                            <th>Count</th>
                            <th>Outstanding</th>
                            <th>Percentage</th>
                        </tr>
                        </thead>
                        <tbody>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((data, index) => (
                                <tr key={index}>
                                    <td>{data.officeName}</td>
                                    <td>{data.productName}</td>
                                    <td>{data.count}</td>
                                    <td>{data.outstanding}</td>
                                    <td>{data.percentage}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="fund-mapping-no-data">
                                    No Data Available
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                    <div className="pagination-controls">
                        {/* Pagination Controls */}
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                        >
                            Start
                        </button>
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>
                        <span>
              Page {currentPage} of {Math.ceil(tableData.length / pageSize)}
            </span>
                        <button
                            onClick={() =>
                                setCurrentPage((prev) =>
                                    Math.min(prev + 1, Math.ceil(tableData.length / pageSize))
                                )
                            }
                            disabled={currentPage === Math.ceil(tableData.length / pageSize)}
                        >
                            Next
                        </button>
                        <button
                            onClick={() => setCurrentPage(Math.ceil(tableData.length / pageSize))}
                            disabled={currentPage === Math.ceil(tableData.length / pageSize)}
                        >
                            End
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FundMapping;
