import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../../../../../config';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import './ViewJobDetails.css';
import {NotificationContext} from "../../../../../context/NotificationContext";

const ViewJobDetails = ({ job }) => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const [jobDetails, setJobDetails] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyData, setHistoryData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage] = useState(10);
    // const [totalPages, setTotalPages] = useState(1);
    const [editData, setEditData] = useState({
        displayName: '',
        cronExpression: '',
        active: false,
    });

    useEffect(() => {
        fetchJobDetails();
    }, [job.jobId]);

    const fetchJobDetails = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/jobs/${job.jobId}`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                },
            });
            setJobDetails(response.data);
            setEditData({
                displayName: response.data.displayName,
                cronExpression: response.data.cronExpression,
                active: response.data.active,
            });
        } catch (error) {
            console.error('Error fetching job details:', error.message);
        } finally {
            stopLoading();
        }
    };

    const fetchJobHistory = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/jobs/${job.jobId}/runhistory`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                },
            });
            setHistoryData(response.data.pageItems);
        } catch (error) {
            console.error('Error fetching job history:', error.message);
        } finally {
            stopLoading();
        }
    };

    const handleEditSubmit = async () => {
        startLoading();
        try {
            const payload = {
                displayName: editData.displayName,
                cronExpression: editData.cronExpression,
                active: editData.active,
            };
            await axios.put(`/fineract-provider/api/v1/jobs/${job.jobId}`, payload, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                },
            });
            fetchJobDetails();
            setIsEditModalOpen(false);
            showNotification("Job details updated successfully!", 'success');
        } catch (error) {
            console.error('Error updating job details:', error.message);
            showNotification('Error updating job details:', 'error');
        } finally {
            stopLoading();
        }
    };


    if (!jobDetails) return <div>Loading job details...</div>;

    const paginatedHistory = historyData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const totalPages = Math.ceil(historyData.length / rowsPerPage);

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };


    return (
        <div className="job-details-container">
            <div className="job-details-actions">
                <button onClick={() => setIsEditModalOpen(true)}>Edit</button>
                <button onClick={() => { setIsHistoryModalOpen(true); fetchJobHistory(); }}>
                    View History
                </button>
            </div>
            <h3 className="job-details-title">{jobDetails.displayName}</h3>
            <table className="job-details-table">
                <tbody>
                <tr>
                    <td>Job Name</td>
                    <td>{jobDetails.displayName}</td>
                </tr>
                <tr>
                    <td>Cron Expression</td>
                    <td>{jobDetails.cronExpression}</td>
                </tr>
                <tr>
                    <td>Is Active Job?</td>
                    <td>{jobDetails.active ? 'Yes' : 'No'}</td>
                </tr>
                <tr>
                    <td>Follow</td>
                    <td>
                        <a
                            href="https://crontab.guru/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Click here to Generate Cron Expression
                        </a>
                    </td>
                </tr>
                </tbody>
            </table>

            {isEditModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className={"create-modal-title"}>Edit Job</h4>
                        <div className={"create-provisioning-criteria-group"}>
                            <label className={"create-provisioning-criteria-label"}>
                                Job Name <span>*</span>
                            </label>
                            <input
                                type="text"
                                className={"staged-form-input"}
                                value={editData.displayName}
                                onChange={(e) =>
                                    setEditData((prev) => ({ ...prev, displayName: e.target.value }))
                                }
                            />
                        </div>
                        <div className={"create-provisioning-criteria-group"}>
                            <label className={"create-provisioning-criteria-label"}>
                                Cron Expression <span>*</span>
                            </label>
                            <input
                                type="text"
                                value={editData.cronExpression}
                                className={"staged-form-input"}
                                onChange={(e) =>
                                    setEditData((prev) => ({ ...prev, cronExpression: e.target.value }))
                                }
                            />
                        </div>
                        <div>
                            <label className={"create-provisioning-criteria-label"}>
                                <input
                                    type="checkbox"
                                    checked={editData.active}
                                    onChange={(e) =>
                                        setEditData((prev) => ({ ...prev, active: e.target.checked }))
                                    }
                                />   Is Active Job?
                            </label>
                        </div>
                        <div className="modal-actions">
                            <button
                                className="create-provisioning-criteria-cancel"
                                onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                            <button
                                onClick={handleEditSubmit}
                                className="create-provisioning-criteria-confirm"
                                disabled={
                                    !editData.displayName ||
                                    !editData.cronExpression ||
                                    (editData.displayName === jobDetails.displayName &&
                                        editData.cronExpression === jobDetails.cronExpression &&
                                        editData.active === jobDetails.active)
                                }
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isHistoryModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className={"create-modal-title"}>Job History</h4>
                        <table className="history-table">
                            <thead>
                            <tr>
                                <th>Version</th>
                                <th>Start Time</th>
                                <th>End Time</th>
                                <th>Status</th>
                                <th>Run Type</th>
                                <th>Error Log</th>
                            </tr>
                            </thead>
                            <tbody>
                            {paginatedHistory.map((history, index) => (
                                <tr key={index}>
                                    <td>{history.version}</td>
                                    <td>{new Date(history.jobRunStartTime).toLocaleString()}</td>
                                    <td>{new Date(history.jobRunEndTime).toLocaleString()}</td>
                                    <td>{history.status}</td>
                                    <td>{history.triggerType}</td>
                                    <td>{history.errorLog || ' '}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        <div className={"staged-form-row"}>
                            <button
                                className="create-provisioning-criteria-cancel"
                                onClick={() => setIsHistoryModalOpen(false)}>Close
                            </button>
                            <div className="pagination-controls">
                                <button
                                    className="pagination-button"
                                    onClick={() => handlePageChange(1)}
                                    disabled={currentPage === 1}
                                >
                                    First
                                </button>
                                <button
                                    className="pagination-button"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </button>
                                <span>
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    className="pagination-button"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </button>
                                <button
                                    className="pagination-button"
                                    onClick={() => handlePageChange(totalPages)}
                                    disabled={currentPage === totalPages}
                                >
                                    Last
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewJobDetails;
