import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API_CONFIG } from "../../../../../config";
import { AuthContext } from "../../../../../context/AuthContext";
import { useLoading } from "../../../../../context/LoadingContext";
import "./AuditTrails.css";
import { saveAs } from "file-saver";
import {Link} from "react-router-dom";
import {NotificationContext} from "../../../../../context/NotificationContext";

const AuditTrails = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const [filters, setFilters] = useState({
        resourceId: "",
        status: "",
        user: "",
        action: "",
        entity: "",
        checker: "",
        maker: "",
        makerFromDate: "",
        makerToDate: "",
        checkerFromDate: "",
        checkerToDate: "",
    });
    const [auditData, setAuditData] = useState([]);
    const [templateData, setTemplateData] = useState({
        actionNames: [],
        appUsers: [],
        entityNames: [],
        statuses: [],
    });
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState(null);

    useEffect(() => {
        fetchTemplateData();
        fetchAuditData();
    }, [filters]);

    useEffect(() => {
        if (auditData.length) {
            setTotalPages(Math.ceil(auditData.length / pageSize));
        }
    }, [auditData, pageSize]);

    const fetchTemplateData = async () => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/audits/searchtemplate`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                },
            });
            setTemplateData(response.data || {});
        } catch (error) {
            console.error("Error fetching template data:", error);
        } finally {
            stopLoading();
        }
    };

    const fetchAuditData = async () => {
        startLoading();
        try {
            const response = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/audits`,
                {
                    params: {
                        offset: 0,
                        limit: -1,
                        sortOrder: "",
                        orderBy: "",
                        paged: true,
                        dateFormat: "dd MMMM yyyy",
                        locale: "en",
                    },
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    },
                }
            );
            setAuditData(response.data.pageItems || []);
            setTotalPages(Math.ceil(response.data.totalFilteredRecords / pageSize));
        } catch (error) {
            console.error("Error fetching audit data:", error);
        } finally {
            stopLoading();
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const paginatedAuditData = () => {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return auditData.slice(startIndex, endIndex);
    };

    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
        setCurrentPage(1);
    };

    const handleRowClick = async (row) => {
        startLoading();
        try {
            const response = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/audits/${row.id}`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    },
                }
            );
            setModalData(response.data);
            setIsModalOpen(true);
        } catch (error) {
            console.error("Error fetching row data:", error);
            showNotification("Error fetching row data!", 'error');
        } finally {
            stopLoading();
        }
    };


    const handleDownloadCSV = async () => {
        try {
            const csvData = auditData.map((item) => ({
                "Trail ID": item.id,
                "Resource ID": item.resourceId,
                Status: item.status || "",
                "Made By": item.maker || "",
                Action: item.actionName || "",
                Entity: item.entityName || "",
                Office: item.office || "",
                "Made Date": item.madeOnDate || "",
                Checker: item.checker || "",
                "Checked Date": item.checkedOnDate || "",
            }));

            const csvContent =
                "data:text/csv;charset=utf-8," +
                [
                    Object.keys(csvData[0]).join(","),
                    ...csvData.map((row) => Object.values(row).join(",")),
                ].join("\n");

            const encodedUri = encodeURI(csvContent);
            saveAs(encodedUri, "Audit_Trails.csv");
        } catch (error) {
            console.error("Error generating CSV:", error);
        }
    };

    return (
        <div className="audit-trails-page neighbor-element">
            <div className="page-header-container">
                <h2 className="page-heading">
                    <Link to="/system" className="breadcrumb-link">System </Link>. Audit Trails
                </h2>
                <button className="download-button" onClick={handleDownloadCSV}>
                    Download CSV
                </button>
            </div>

            <form className="audit-filters-form">
                <div className="audit-form-row">
                    <div className="audit-form-group">
                        <label htmlFor="resourceId" className="audit-form-label">Resource ID</label>
                        <input
                            type="text"
                            id="resourceId"
                            name="resourceId"
                            className="audit-form-input"
                            value={filters.resourceId}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div className="audit-form-group">
                        <label htmlFor="status" className="audit-form-label">Status</label>
                        <select
                            id="status"
                            name="status"
                            className="audit-form-select"
                            value={filters.status}
                            onChange={handleFilterChange}
                        >
                            <option value="">All</option>
                            {templateData.statuses.map((status, index) => (
                                <option key={index} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="audit-form-row">
                    <div className="audit-form-group">
                        <label htmlFor="user" className="audit-form-label">User</label>
                        <select
                            id="user"
                            name="user"
                            className="audit-form-select"
                            value={filters.user}
                            onChange={handleFilterChange}
                        >
                            <option value="">All</option>
                            {templateData.appUsers.map((user) => (
                                <option key={user.id} value={user.username}>
                                    {user.username}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="audit-form-group">
                        <label htmlFor="action" className="audit-form-label">Action</label>
                        <select
                            id="action"
                            name="action"
                            className="audit-form-select"
                            value={filters.action}
                            onChange={handleFilterChange}
                        >
                            <option value="">All</option>
                            {templateData.actionNames.map((action, index) => (
                                <option key={index} value={action}>
                                    {action}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="audit-form-row">
                    <div className="audit-form-group">
                        <label htmlFor="entity" className="audit-form-label">Entity</label>
                        <select
                            id="entity"
                            name="entity"
                            className="audit-form-select"
                            value={filters.entity}
                            onChange={handleFilterChange}
                        >
                            <option value="">All</option>
                            {templateData.entityNames.map((entity, index) => (
                                <option key={index} value={entity}>
                                    {entity}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="audit-form-group">
                        <label htmlFor="checker" className="audit-form-label">Checker</label>
                        <input
                            type="text"
                            id="checker"
                            name="checker"
                            className="audit-form-input"
                            value={filters.checker}
                            onChange={handleFilterChange}
                        />
                    </div>
                </div>
                <div className="audit-form-row">
                    <div className="audit-form-group">
                        <label htmlFor="makerFromDate" className="audit-form-label">Maker From Date</label>
                        <input
                            type="date"
                            id="makerFromDate"
                            name="makerFromDate"
                            className="audit-form-date-input"
                            value={filters.makerFromDate}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div className="audit-form-group">
                        <label htmlFor="makerToDate" className="audit-form-label">Maker To Date</label>
                        <input
                            type="date"
                            id="makerToDate"
                            name="makerToDate"
                            className="audit-form-date-input"
                            value={filters.makerToDate}
                            onChange={handleFilterChange}
                        />
                    </div>
                </div>
                <div className="audit-form-row">
                    <div className="audit-form-group">
                        <label htmlFor="checkerFromDate" className="audit-form-label">Checker From Date</label>
                        <input
                            type="date"
                            id="checkerFromDate"
                            name="checkerFromDate"
                            className="audit-form-date-input"
                            value={filters.checkerFromDate}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div className="audit-form-group">
                        <label htmlFor="checkerToDate" className="audit-form-label">Checker To Date</label>
                        <input
                            type="date"
                            id="checkerToDate"
                            name="checkerToDate"
                            className="audit-form-date-input"
                            value={filters.checkerToDate}
                            onChange={handleFilterChange}
                        />
                    </div>
                </div>
            </form>
            <div className="audit-row-selector">
                <label htmlFor="pageSize" className="row-selector-label">
                    Rows per page:
                </label>
                <select
                    id="pageSize"
                    className="row-selector"
                    value={pageSize}
                    onChange={handlePageSizeChange}
                >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                </select>
            </div>

            <table className="audit-table">
                <thead>
                <tr>
                    <th>Trail ID</th>
                    <th>Resource ID</th>
                    <th>Status</th>
                    <th>Made By</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Office</th>
                    <th>Made Date</th>
                    <th>Checker</th>
                    <th>Checked Date</th>
                </tr>
                </thead>
                <tbody>
                {paginatedAuditData().map((item) => (
                    <tr
                        key={item.id}
                        className="clickable-row"
                        onClick={() => handleRowClick(item)}
                    >
                        <td>{item.id}</td>
                        <td>{item.resourceId}</td>
                        <td>{item.status}</td>
                        <td>{item.maker}</td>
                        <td>{item.actionName}</td>
                        <td>{item.entityName}</td>
                        <td>{item.office}</td>
                        <td>
                            {item.madeOnDate
                                ? new Intl.DateTimeFormat("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                }).format(new Date(item.madeOnDate))
                                : ""}
                        </td>
                        <td>{item.checker}</td>
                        <td>
                            {item.checkedOnDate
                                ? new Intl.DateTimeFormat("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                }).format(new Date(item.checkedOnDate))
                                : ""}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
            <div className="audit-pagination">
                <button
                    className="pagination-button"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                >
                    Start
                </button>
                <button
                    className="pagination-button"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    Previous
                </button>
                <span className="pagination-info">
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    className="pagination-button"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                >
                    Next
                </button>
                <button
                    className="pagination-button"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                >
                    End
                </button>
            </div>

            {isModalOpen && modalData && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <div className="create-holiday-row">
                            <div className="staged-form-field">
                                <h4 className="create-modal-title">Audit Details</h4>
                                <table className="create-provisioning-criteria-table">
                                    <tbody>
                                    <tr>
                                        <td>ID</td>
                                        <td>{modalData.id}</td>
                                    </tr>
                                    <tr>
                                        <td>Status</td>
                                        <td>{modalData.status}</td>
                                    </tr>
                                    <tr>
                                        <td>User</td>
                                        <td>{modalData.maker}</td>
                                    </tr>
                                    <tr>
                                        <td>Action</td>
                                        <td>{modalData.actionName}</td>
                                    </tr>
                                    <tr>
                                        <td>Entity</td>
                                        <td>{modalData.entityName}</td>
                                    </tr>
                                    <tr>
                                        <td>Resource ID</td>
                                        <td>{modalData.resourceId}</td>
                                    </tr>
                                    <tr>
                                        <td>Date</td>
                                        <td>
                                            {modalData.madeOnDate
                                                ? new Intl.DateTimeFormat("en-US", {
                                                    day: "2-digit",
                                                    month: "long",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                    hour12: true,
                                                }).format(new Date(modalData.madeOnDate))
                                                : ""}
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="staged-form-field">
                                <h4 className="create-provisioning-criteria-subtitle">Command Details</h4>
                                <table className="create-provisioning-criteria-table">
                                <thead>
                                <tr>
                                    <th>Command</th>
                                    <th>Command Value</th>
                                </tr>
                                </thead>
                                <tbody>
                                {Object.entries(JSON.parse(modalData.commandAsJson)).map(
                                    ([key, value]) => (
                                        <tr key={key}>
                                            <td>{key}</td>
                                            <td>{value}</td>
                                        </tr>
                                    )
                                )}
                                </tbody>
                            </table>
                            </div>
                        </div>

                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="create-provisioning-criteria-cancel"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditTrails;
