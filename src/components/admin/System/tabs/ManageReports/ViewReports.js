import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import './ViewReports.css';
import {NotificationContext} from "../../../../../context/NotificationContext";

const ViewReportsTable = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const [reports, setReports] = useState([]);
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [filter, setFilter] = useState({ type: '', name: '', category: '' });
    const [totalPages, setTotalPages] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState(null);
    const [userReportValue, setUserReportValue] = useState(null);
    const [initialUserReportValue, setInitialUserReportValue] = useState(null);

    useEffect(() => {
        fetchReports();
    }, []);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredReports().length / pageSize));
    }, [reports, filter, pageSize]);

    const fetchReports = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/reports`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setReports(response.data);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            stopLoading();
        }
    };

    const filteredReports = () =>
        reports.filter((report) => {
            const matchesType = filter.type
                ? report.reportType?.toLowerCase().includes(filter.type.toLowerCase())
                : true;
            const matchesName = filter.name
                ? report.reportName?.toLowerCase().includes(filter.name.toLowerCase())
                : true;
            const matchesCategory = filter.category
                ? report.reportCategory?.toLowerCase().includes(filter.category.toLowerCase())
                : true;
            return matchesType && matchesName && matchesCategory;
        });

    const paginatedData = filteredReports().slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
        setCurrentPage(1);
    };

    const handleRowClick = async (report) => {
        startLoading();
        try {
            const response = await axios.get(
                `/fineract-provider/api/v1/reports/${report.id}?template=true`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    },
                }
            );
            const data = response.data;
            setModalData(data);
            setUserReportValue(data.useReport);
            setInitialUserReportValue(data.useReport);
            setIsModalOpen(true);
        } catch (error) {
            console.error("Error fetching report details:", error);
        } finally {
            stopLoading();
        }
    };

    const handleSubmit = async () => {
        startLoading();
        try {
            await axios.put(
                `/fineract-provider/api/v1/reports/${modalData.id}`,
                { useReport: userReportValue },
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            setIsModalOpen(false);
            fetchReports();
            showNotification("Report updated successfully!", 'success');
        } catch (error) {
            console.error("Error updating report:", error);
            showNotification("Error updating report!", 'error');
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="reports-table-container">
            <div className="table-controls">
                <div className="filter-container">
                    <div className="filter-item">
                        <label htmlFor="typeFilter">Filter by Report Type:</label>
                        <input
                            type="text"
                            id="typeFilter"
                            value={filter.type}
                            onChange={(e) =>
                                setFilter((prev) => ({ ...prev, type: e.target.value }))
                            }
                            placeholder="Enter report type..."
                        />
                    </div>
                    <div className="filter-item">
                        <label htmlFor="nameFilter">Filter by Report Name:</label>
                        <input
                            type="text"
                            id="nameFilter"
                            value={filter.name}
                            onChange={(e) =>
                                setFilter((prev) => ({ ...prev, name: e.target.value }))
                            }
                            placeholder="Enter report name..."
                        />
                    </div>
                    <div className="filter-item">
                        <label htmlFor="categoryFilter">Filter by Report Category:</label>
                        <input
                            type="text"
                            id="categoryFilter"
                            value={filter.category}
                            onChange={(e) =>
                                setFilter((prev) => ({ ...prev, category: e.target.value }))
                            }
                            placeholder="Enter report category..."
                        />
                    </div>
                </div>
                <div className="page-size-selector">
                    <label>Rows per page: </label>
                    <select value={pageSize} onChange={handlePageSizeChange}>
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
                    <th>Report Name</th>
                    <th>Report Type</th>
                    <th>Report Category</th>
                    <th>Core Report</th>
                    <th>User Report</th>
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
                            <td>{report.reportName || 'N/A'}</td>
                            <td>{report.reportType || 'N/A'}</td>
                            <td>{report.reportCategory || 'N/A'}</td>
                            <td>
                                <div className="indicator-container">
                                    <div
                                        className={`indicator ${
                                            report.coreReport ? 'yes' : 'no'
                                        }`}
                                    ></div>
                                    <div className="tooltip">
                                        {report.coreReport ? 'Core Report: Yes' : 'Core Report: No'}
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className="indicator-container">
                                    <div
                                        className={`indicator ${
                                            report.useReport ? 'yes' : 'no'
                                        }`}
                                    ></div>
                                    <div className="tooltip">
                                        {report.useReport ? 'User Report: Yes' : 'User Report: No'}
                                    </div>
                                </div>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="5" className="no-data">
                            No reports available
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

            {isModalOpen && modalData && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className="create-modal-title">{modalData.reportName}</h4>
                        <div className="create-provisioning-criteria-group">
                            <label className="create-provisioning-criteria-label">Report Type</label>
                            <input
                                type="text"
                                value={modalData.reportType}
                                disabled
                                className="create-provisioning-criteria-input"
                            />
                        </div>
                        <div className="create-provisioning-criteria-group">
                            <label className="create-provisioning-criteria-label">Report Category</label>
                            <input
                                type="text"
                                value={modalData.reportCategory}
                                disabled
                                className="create-provisioning-criteria-input"
                            />
                        </div>
                        <div className="create-provisioning-criteria-group">
                            <label className="create-provisioning-criteria-label">
                            <input
                                type="checkbox"
                                checked={modalData.coreReport}
                                disabled
                                className=""
                            />  Core Report</label>
                        </div>
                        <div className="create-provisioning-criteria-group">
                            <label className="create-provisioning-criteria-label">
                            <input
                                type="checkbox"
                                checked={userReportValue}
                                onChange={(e) => setUserReportValue(e.target.checked)}
                                className=""
                            /> User Report (UI)</label>
                        </div>
                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="create-provisioning-criteria-cancel"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="create-provisioning-criteria-confirm"
                                disabled={userReportValue === initialUserReportValue}
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewReportsTable;
