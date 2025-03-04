import React, { useState, useEffect, useContext } from "react";
import { FaTrash } from "react-icons/fa";
import axios from "axios";
import { AuthContext } from "../../../../../../context/AuthContext";
import { useLoading } from "../../../../../../context/LoadingContext";
import { API_CONFIG } from "../../../../../../config";
import "./CreateDelinquencyBucket.css";
import {NotificationContext} from "../../../../../../context/NotificationContext";

const CreateDelinquencyBucket = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const [name, setName] = useState("");
    const [delinquencyRanges, setDelinquencyRanges] = useState([]);
    const [selectedRanges, setSelectedRanges] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedRange, setSelectedRange] = useState("");

    useEffect(() => {
        fetchDelinquencyRanges();
    }, []);

    const fetchDelinquencyRanges = async () => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/delinquency/ranges`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });
            setDelinquencyRanges(response.data || []);
        } catch (error) {
            console.error("Error fetching delinquency ranges:", error);
        } finally {
            stopLoading();
        }
    };

    const handleModalSubmit = () => {
        if (!selectedRange) return;
        const selectedRangeData = delinquencyRanges.find(
            (range) => range.id === parseInt(selectedRange)
        );
        setSelectedRanges([...selectedRanges, selectedRangeData]);
        setSelectedRange("");
        setShowModal(false);
    };

    const handleDelete = (index) => {
        if (window.confirm("Are you sure you want to delete this range?")) {
            const updatedRanges = selectedRanges.filter((_, i) => i !== index);
            setSelectedRanges(updatedRanges);
        }
    };

    const handleSubmit = async () => {
        const payload = {
            name,
            ranges: selectedRanges.map((range) => range.id),
        };

        try {
            startLoading();
            await axios.post(`${API_CONFIG.proxy}/fineract-provider/api/v1/delinquency/buckets`, payload, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });
            showNotification("Delinquency bucket created successfully!", 'success');
            setName("");
            setSelectedRanges([]);
        } catch (error) {
            console.error("Error creating delinquency bucket:", error);
            showNotification("Error creating delinquency bucket:", 'error');
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="create-delinquency-bucket">
            <h3 className="delinquency-bucket-heading">Create Delinquency Bucket</h3>
            <div className="delinquency-bucket-form-group">
                <label htmlFor="name" className="delinquency-bucket-label">Name <span>*</span></label>
                <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="delinquency-bucket-input"
                    placeholder="Enter bucket name"
                />
            </div>
            <div className="delinquency-add-ranges">
                <span className="delinquency-add-description">Add Delinquency Range:</span>
                <button
                    className="delinquency-add-button"
                    onClick={() => setShowModal(true)}
                >
                    <span className="delinquency-add-icon">+</span> Add
                </button>
            </div>
            {selectedRanges.length > 0 && (
                <table className="delinquency-ranges-table">
                    <thead>
                    <tr>
                        <th>Classification</th>
                        <th>Days From</th>
                        <th>Days Till</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {selectedRanges.map((range, index) => (
                        <tr key={index}>
                            <td>{range.classification}</td>
                            <td>{range.minimumAgeDays}</td>
                            <td>{range.maximumAgeDays}</td>
                            <td>
                                <FaTrash color={'#ff0000'}
                                    className="delinquency-action-icon"
                                    onClick={() => handleDelete(index)}
                                />
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
            <div className="delinquency-bucket-actions">
                <button
                    className="delinquency-action-button delinquency-submit-button"
                    onClick={handleSubmit}
                    disabled={!name.trim()}
                >
                    Submit
                </button>
            </div>

            {showModal && (
                <div className="delinquency-modal">
                    <div className="delinquency-modal-content">
                        <h4 className="delinquency-modal-heading">Add Delinquency Range</h4>
                        <div className="delinquency-modal-form-group">
                            <label className="delinquency-modal-label">Select Range:</label>
                            <select
                                value={selectedRange}
                                onChange={(e) => setSelectedRange(e.target.value)}
                                className="delinquency-modal-input"
                            >
                                <option value="">Select Delinquency Range</option>
                                {delinquencyRanges.map((range) => (
                                    <option key={range.id} value={range.id}>
                                        {range.classification} (Days: {range.minimumAgeDays}-{range.maximumAgeDays})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="delinquency-modal-actions">
                            <button
                                className="delinquency-modal-action-button delinquency-modal-cancel-button"
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="delinquency-modal-action-button delinquency-modal-add-button"
                                onClick={handleModalSubmit}
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateDelinquencyBucket;
