import React, { useState, useContext } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import axios from "axios";
import { AuthContext } from "../../../../../context/AuthContext";
import { useLoading } from "../../../../../context/LoadingContext";
import { API_CONFIG } from "../../../../../config";
import "./CreateFloatingRates.css";
import {NotificationContext} from "../../../../../context/NotificationContext";

const CreateFloatingRate = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();

    const getTomorrowDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split("T")[0];
    };

    const [name, setName] = useState("");
    const [isBaseLendingRate, setIsBaseLendingRate] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [floatingRatePeriods, setFloatingRatePeriods] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalValues, setModalValues] = useState({
        fromDate: getTomorrowDate(),
        interestRate: "",
        isDifferential: false,
    });
    const [currentEditIndex, setCurrentEditIndex] = useState(null);

    const handleModalSubmit = () => {
        if (!modalValues.fromDate || !modalValues.interestRate) return;

        const updatedPeriods = [...floatingRatePeriods];
        if (currentEditIndex !== null) {
            updatedPeriods[currentEditIndex] = modalValues; // Update existing row
        } else {
            updatedPeriods.push(modalValues); // Add new row
        }

        setFloatingRatePeriods(updatedPeriods);

        setModalValues({
            fromDate: getTomorrowDate(),
            interestRate: "",
            isDifferential: false,
        });

        setCurrentEditIndex(null); // Reset edit index
        setShowModal(false); // Close modal
    };

    const handleDelete = (index) => {
        if (window.confirm("Are you sure you want to delete this floating rate period?")) {
            const updatedPeriods = floatingRatePeriods.filter((_, i) => i !== index);
            setFloatingRatePeriods(updatedPeriods);
        }
    };

    const handleEdit = (index) => {
        setModalValues(floatingRatePeriods[index]);
        setCurrentEditIndex(index);
        setShowModal(true);
    };

    const handleSubmit = async () => {
        const payload = {
            name,
            isBaseLendingRate,
            isActive,
            floatingRatePeriods,
        };

        try {
            startLoading();
            await axios.post(`/fineract-provider/api/v1/floatingrates`, payload, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });
            showNotification("Floating Rate created successfully!", 'success');
            setName("");
            setIsBaseLendingRate(false);
            setIsActive(false);
            setFloatingRatePeriods([]);
        } catch (error) {
            console.error("Error creating floating rate:", error);
            showNotification("Error creating floating rate:", 'error');
        } finally {
            stopLoading();
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";

        const date = new Date(dateString);
        const options = { day: "numeric", month: "long", year: "numeric" };
        return date.toLocaleDateString("en-US", options);
    };

    return (
        <div className="create-floating-rate">
            <h3 className="floating-rate-heading">Create Floating Rate</h3>

            <div className="floating-rate-form-group">
                <label htmlFor="name" className="floating-rate-label">
                    Floating Rate Name <span>*</span>
                </label>
                <input
                    type="text"
                    id="name"
                    className="floating-rate-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter floating rate name"
                />
            </div>

            <div className="floating-rate-checkbox-group">
                <label>
                    <input
                        type="checkbox"
                        checked={isBaseLendingRate}
                        onChange={(e) => setIsBaseLendingRate(e.target.checked)}
                    />{" "}
                    Is Base Lending Rate?
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                    />{" "}
                    Active
                </label>
            </div>

            <div className="floating-rate-add-periods">
                <span className="floating-rate-add-description">Add Floating Rate Period:</span>
                <button
                    className="floating-rate-add-button"
                    onClick={() => setShowModal(true)}
                >
                    <span className="floating-rate-add-icon">+</span> Add
                </button>
            </div>

            {floatingRatePeriods.length > 0 && (
                <table className="floating-rate-periods-table">
                    <thead>
                    <tr>
                        <th>From Date</th>
                        <th>Interest Rate</th>
                        <th>Is Differential?</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {floatingRatePeriods.map((period, index) => (
                        <tr key={index}>
                            <td>{formatDate(period.fromDate)}</td>
                            <td>{period.interestRate}%</td>
                            <td>{period.isDifferential ? "Yes" : "No"}</td>
                            <td>
                                <FaEdit
                                    className="floating-rate-action-icon"
                                    onClick={() => handleEdit(index)}
                                    color={"#296724"}
                                />
                                <FaTrash
                                    className="floating-rate-action-icon"
                                    onClick={() => handleDelete(index)}
                                    color={"#ec1b1b"}
                                />
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}

            <div className="floating-rate-actions">
                <button
                    className="floating-rate-submit-button"
                    onClick={handleSubmit}
                    disabled={!name.trim()}
                >
                    Submit
                </button>
            </div>

            {showModal && (
                <div className="floating-rate-modal">
                    <div className="floating-rate-modal-content">
                        <h4 className="floating-rate-modal-heading">
                            {currentEditIndex !== null
                                ? "Edit Floating Rate Period"
                                : "Add Floating Rate Period"}
                        </h4>
                        <div className="floating-rate-modal-form-group">
                            <label className="floating-rate-modal-label">
                                From Date <span>*</span>
                            </label>
                            <input
                                type="date"
                                className="floating-rate-modal-input"
                                value={modalValues.fromDate}
                                min={getTomorrowDate()}
                                onChange={(e) =>
                                    setModalValues((prev) => ({
                                        ...prev,
                                        fromDate: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="floating-rate-modal-form-group">
                            <label className="floating-rate-modal-label">
                                Interest Rate <span>*</span>
                            </label>
                            <input
                                type="number"
                                className="floating-rate-modal-input"
                                value={modalValues.interestRate}
                                onChange={(e) =>
                                    setModalValues((prev) => ({
                                        ...prev,
                                        interestRate: e.target.value,
                                    }))
                                }
                                placeholder="Enter interest rate"
                            />
                        </div>
                        <div className="floating-rate-modal-form-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={modalValues.isDifferential}
                                    onChange={(e) =>
                                        setModalValues((prev) => ({
                                            ...prev,
                                            isDifferential: e.target.checked,
                                        }))
                                    }
                                />{" "}
                                Is Differential?
                            </label>
                        </div>
                        <div className="floating-rate-modal-actions">
                            <button
                                className="floating-rate-modal-cancel-button"
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="floating-rate-modal-add-button"
                                onClick={handleModalSubmit}
                                disabled={
                                    !modalValues.fromDate || !modalValues.interestRate
                                }
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

export default CreateFloatingRate;
