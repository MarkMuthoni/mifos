import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../../context/AuthContext";
import { useLoading } from "../../../context/LoadingContext";
import { API_CONFIG } from "../../../config";
import {Link, useNavigate, useParams} from "react-router-dom";
import "./AllReports.css";
import {NotificationContext} from "../../../context/NotificationContext";

const ReportsPage = () => {
    const { user, componentVisibility } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const { reportType } = useParams();

    const [activeTab, setActiveTab] = useState("tableReports");
    const [reports, setReports] = useState([]);
    const [nameFilter, setNameFilter] = useState("");
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [categoryFilter, setCategoryFilter] = useState("");
    const [pentahoReports, setPentahoReports] = useState([]);
    const [tableReports, setTableReports] = useState([]);

    const [categories, setCategories] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchReports();
    }, [reportType]);


    useEffect(() => {
        if (reportType === "all") {
            const uniqueCategories = [
                ...new Set(
                    reports
                        .map((report) => report.reportCategory)
                        .filter(
                            (category) =>
                                category &&
                                category !== "NULL" &&
                                category !== "(NULL)"
                        )
                ),
            ];
            setCategories(uniqueCategories);
        }
    }, [reports, reportType]);

    useEffect(() => {
        filteredReports();
        setTotalPages(Math.ceil(filteredReports().length / pageSize));
        setCurrentPage(1);
    }, [reports, pentahoReports, tableReports, categoryFilter, componentVisibility, nameFilter, pageSize, activeTab]);

    const formattedReportType =
        reportType && reportType !== "all"
            ? reportType.toLowerCase() === "savings"
                ? "Savings"
                : reportType.charAt(0).toUpperCase() +
                (reportType.endsWith("s") ? reportType.slice(1, -1) : reportType.slice(1))
            : null;

    const fetchReports = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/reports`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });

            let allReports = response.data || [];

            if (formattedReportType) {
                allReports = allReports.filter((report) => report.reportCategory === formattedReportType);
            }

            const pentaho = allReports.filter(report => report.reportType?.toLowerCase() === "pentaho");
            const table = allReports.filter(report => report.reportType?.toLowerCase() === "table");
            const otherReports = allReports.filter(report => !["pentaho", "table"].includes(report.reportType?.toLowerCase()));

            setReports(otherReports);
            setPentahoReports(pentaho);
            setTableReports(table);
        } catch (error) {
            console.error("Error fetching reports:", error);
            showNotification("Error fetching reports!", 'error');
        } finally {
            stopLoading();
        }
    };

    const filteredReports = () => {
        let data = [];

        if (activeTab === "otherReports") {
            data = reports;
        } else if (activeTab === "pentahoReports" && componentVisibility["pentaho-reports"]) {
            data = pentahoReports;
        } else if (activeTab === "tableReports" && componentVisibility["table-reports"]) {
            data = tableReports;
        }

        return data.filter(
            (report) =>
                report.reportName?.toLowerCase().includes(nameFilter.toLowerCase()) &&
                (reportType === "all"
                    ? categoryFilter === "" || report.reportCategory === categoryFilter
                    : true)
        );
    };

    const paginatedData = filteredReports().slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handleRowClick = (report) => {
        if (!report || !report.id) {
            console.error("Invalid report data:", report);
            return;
        }

        navigate(`/reports/view/${report.id}`);
    };

    return (
        <div className="reports-page neighbor-element">
            <h2 className="page-heading">
                <Link to="/reports" className="breadcrumb-link">Reports</Link> .{" "}
                {reportType.charAt(0).toUpperCase() + reportType.slice(1).toLowerCase()}
            </h2>

            {(componentVisibility['pentaho-reports'] || componentVisibility['table-reports']) && (
                <div className="users-tab-container">
                    {componentVisibility['table-reports'] && (
                        <button
                            className={`users-tab-button ${activeTab === "tableReports" ? "active" : ""}`}
                            onClick={() => setActiveTab("tableReports")}
                        >
                            Standard Reports
                        </button>
                    )}

                    <button
                        className={`users-tab-button ${activeTab === "otherReports" ? "active" : ""}`}
                        onClick={() => setActiveTab("otherReports")}
                    >
                        Other Reports
                    </button>

                    {componentVisibility['pentaho-reports'] && (
                        <button
                            className={`users-tab-button ${activeTab === "pentahoReports" ? "active" : ""}`}
                            onClick={() => setActiveTab("pentahoReports")}
                        >
                            Pentaho Reports
                        </button>
                    )}
                </div>
            )}

            <div className="reports-content">
                <div className="table-controls">
                    <div className="filter-container">
                        <div className="filter-item">
                            <label htmlFor="nameFilter">Filter by Name:</label>
                            <input
                                type="text"
                                id="nameFilter"
                                value={nameFilter}
                                onChange={(e) => setNameFilter(e.target.value)}
                                placeholder="Enter report name..."
                            />
                        </div>
                        {reportType === "all" && (
                            <div className="filter-item">
                                <label htmlFor="categoryFilter">Filter by Category:</label>
                                <select
                                    id="categoryFilter"
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                >
                                    <option value="">All Categories</option>
                                    {categories.map((category, index) => (
                                        <option key={index} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                    <div className="page-size-selector">
                        <label>Rows per page:</label>
                        <select
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                </div>

                <table className="reports-table">
                    <thead>
                    <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Category</th>
                    </tr>
                    </thead>
                    <tbody>
                    {paginatedData.length > 0 ? (
                        paginatedData.map((report) => (
                            <tr
                                key={report.id}
                                onClick={() => handleRowClick(report)}
                                className="clickable-row"
                            >
                                <td>{report.reportName || ""}</td>
                                <td>{report.reportType || ""}</td>
                                <td>{report.reportCategory || ""}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="3" className="no-data">
                                No reports available.
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
        </div>
    );
};

export default ReportsPage;
