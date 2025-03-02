import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../../context/AuthContext";
import { useLoading } from "../../../context/LoadingContext";
import { API_CONFIG } from "../../../config";
import "./AccountClosure.css";
import { format } from "date-fns";
import {FaEdit, FaTrash, FaTrashAlt} from "react-icons/fa";
import {NotificationContext} from "../../../context/NotificationContext";

const AccountClosure = () => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const [closures, setClosures] = useState([]);
    const [offices, setOffices] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedClosure, setSelectedClosure] = useState(null);
    const [comments, setComments] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const {showNotification} = useContext(NotificationContext);

    useEffect(() => {
        fetchClosures();
        fetchOffices();
    }, [currentPage, pageSize]);

    const fetchClosures = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/glclosures`, {
                params: {
                    offset: (currentPage - 1) * pageSize,
                    limit: pageSize,
                },
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });

            const closuresData = response.data.pageItems || response.data;
            setClosures(closuresData);
            setTotalPages(Math.ceil(response.data.totalFilteredRecords / pageSize));
        } catch (error) {
            console.error("Error fetching closures:", error);
        } finally {
            stopLoading();
        }
    };

    const fetchOffices = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/offices`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });
            setOffices(response.data || []);
        } catch (error) {
            console.error("Error fetching offices:", error);
        } finally {
            stopLoading();
        }
    };

    const formatDate = (dateArray) => {
        if (!dateArray || dateArray.length !== 3) return "N/A";
        return format(new Date(dateArray[0], dateArray[1] - 1, dateArray[2]), "dd MMMM yyyy");
    };

    const handleEdit = (closure) => {
        setSelectedClosure(closure);
        setComments(closure.comments || "");
        setShowModal(true);
    };

    const handleUpdate = async () => {
        if (!selectedClosure) return;

        startLoading();
        try {
            const response = await axios.put(
                `/fineract-provider/api/v1/glclosures/${selectedClosure.id}`,
                { comments },
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            // console.log("Closure updated:", response.data);
            setShowModal(false);
            showNotification("Closure Updated!", 'success');
            fetchClosures();
        } catch (error) {
            console.error("Error updating closure:", error);
        } finally {
            stopLoading();
        }
    };

    const handleDelete = async (closure) => {
        if (!window.confirm("Are you sure you want to delete this closure?")) return;

        startLoading();
        try {
            await axios.delete(`/fineract-provider/api/v1/glclosures/${closure.id}`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });
            // console.log("Closure deleted");
            showNotification("Closure Deleted!", 'success');
            fetchClosures();
        } catch (error) {
            console.error("Error deleting closure:", error);
        } finally {
            stopLoading();
        }
    };

    const handlePreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

    return (
        <div className="account-closure-container">
            <table className="account-closure-table">
                <thead>
                <tr>
                    <th>#</th>
                    <th>Office</th>
                    <th>Account Closure Date</th>
                    <th>Created By</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {closures.length > 0 ? (
                    closures.map((closure, index) => (
                        <tr key={closure.id} onClick={() => handleEdit(closure)}>
                            <td>{index + 1 + (currentPage - 1) * pageSize}</td>
                            <td>{closure.officeName}</td>
                            <td>{formatDate(closure.closingDate)}</td>
                            <td>{closure.createdByUsername}</td>
                            <td style={{display: "flex", flexDirection: 'row', justifyContent: 'space-around'}}>
                                <FaEdit
                                    title="Edit"
                                    size={20}
                                    color={"#0d681e"}
                                    style={{marginRight: "20px", cursor: 'pointer'}}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEdit(closure);
                                    }}
                                />
                                <FaTrash
                                    className="action-icon delete-icon"
                                    title="Delete"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(closure);
                                    }}
                                />
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="5" className="no-data">
                            No data available
                        </td>
                    </tr>
                )}
                </tbody>
            </table>

            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="pagination-button"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                    >
                        Start
                    </button>
                    <button
                        className="pagination-button"
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    <span>
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        className="pagination-button"
                        onClick={handleNextPage}
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
            )}

            {showModal && selectedClosure && (
                <div
                    className="create-provisioning-criteria-modal-overlay"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="create-provisioning-criteria-modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h4 className="create-modal-title">Edit Closure</h4>
                        <div className="create-holiday-row">
                            <div className="create-provisioning-criteria-group">
                                <label className="create-provisioning-criteria-label">Office</label>
                                <input
                                    type="text"
                                    value={selectedClosure.officeName}
                                    className="create-provisioning-criteria-input"
                                    disabled
                                />
                            </div>
                            <div className="create-provisioning-criteria-group">
                                <label className="create-provisioning-criteria-label">
                                    Closure Date
                                </label>
                                <input
                                    type="text"
                                    value={formatDate(selectedClosure.closingDate)}
                                    className="create-provisioning-criteria-input"
                                    disabled
                                />
                            </div>
                        </div>
                        <div className="create-holiday-row">
                            <div className="create-provisioning-criteria-group full-width">
                                <label className="create-provisioning-criteria-label">
                                    Comments
                                </label>
                                <textarea
                                    rows="3"
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    className="create-provisioning-criteria-textarea"
                                ></textarea>
                            </div>
                        </div>
                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                onClick={() => setShowModal(false)}
                                className="create-provisioning-criteria-cancel"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdate}
                                className="create-provisioning-criteria-confirm"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountClosure;
