import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../../context/AuthContext";
import { useLoading } from "../../../context/LoadingContext";
import { API_CONFIG } from "../../../config";
import { FaInfoCircle, FaCog, FaDownload } from "react-icons/fa";
import { Tooltip as ReactTooltip } from "react-tooltip";
import "./XBRLPage.css";
import {Link} from "react-router-dom";
import DatePicker from "react-datepicker";
import {NotificationContext} from "../../../context/NotificationContext";

const XBRLReports = () => {
    const [taxonomyData, setTaxonomyData] = useState([]);
    const [categories, setCategories] = useState({});
    const [activeTab, setActiveTab] = useState(null);
    const [userInputs, setUserInputs] = useState({});
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportDates, setReportDates] = useState({
        startDate: "",
        endDate: "",
    });
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();

    const fetchXBRLData = async () => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/mixtaxonomy`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });
            const data = response.data || [];
            setTaxonomyData(data);
            categorizeData(data);
        } catch (error) {
            console.error("Error fetching XBRL taxonomy data:", error);
        } finally {
            stopLoading();
        }
    };

    useEffect(() => {
        fetchXBRLData();
    }, []);

    const categorizeData = (data) => {
        const categories = {
            Portfolio: [],
            BalanceSheet: [],
            Incomes: [],
            Expenses: [],
        };

        data.forEach((entry) => {
            if (entry.name.startsWith("Number")) {
                categories.Portfolio.push(entry);
            } else if (
                ["Assets", "Cash", "Deposits", "Equity", "Liabilities"].some(
                    (key) =>
                        entry.name.startsWith(key) || entry.dimension?.includes(key)
                )
            ) {
                categories.BalanceSheet.push(entry);
            } else if (
                [
                    "NetLoanLoss",
                    "NetLoanLossProvisionExpense",
                    "NetOperatingIncomeNetOfTaxExpense",
                ].some((key) => entry.name.includes(key))
            ) {
                categories.Expenses.push(entry);
            } else if (
                [
                    "Revenue",
                    "Impairment",
                    "LoanPortfolioGross",
                    "NetOperatingIncome",
                    "Income",
                    "WriteOffs",
                ].some((key) => entry.name.includes(key))
            ) {
                categories.Incomes.push(entry);
            } else if (
                [
                    "Expense",
                    "Operating",
                    "Employee",
                ].some((key) => entry.name.includes(key))
            ) {
                categories.Expenses.push(entry);
            }
        });

        setCategories(categories);
        setActiveTab("Portfolio");
    };

    const isPastDate = (date) => new Date(date) <= new Date();

    const handleOpenReportModal = () => {
        setShowReportModal(true);
    };

    const handleCloseReportModal = () => {
        setShowReportModal(false);
        setReportDates({ startDate: "", endDate: "" });
    };

    const handleInputChange = (id, value) => {
        setUserInputs((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    const handleRunReport = async () => {
        const { startDate, endDate } = reportDates;

        if (!startDate || !endDate) {
            showNotification("Both Start Date and End Date are required!", 'info');
            return;
        }

        try {
            startLoading();
            const response = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/mixreport`,
                {
                    params: { startDate, endDate },
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            // console.log("Report generated successfully:", response.data);
            showNotification("Report generated successfully!", 'success');
            handleCloseReportModal();
        } catch (error) {
            console.error("Error generating report:", error);
            showNotification("Failed to generate report. Please try again!", 'success');
        } finally {
            stopLoading();
        }
    };

    const handleSaveChanges = async () => {
        const payload = {
            identifier: "default;",
            config: JSON.stringify(userInputs),
        };

        try {
            startLoading();
            const response = await axios.put(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/mixmapping`,
                payload,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            // console.log("Save changes response:", response.data);
            showNotification("Changes saved successfully!", 'success');
        } catch (error) {
            console.error("Error saving changes:", error);
            showNotification("Failed to save changes. Please try again!", 'error');
        } finally {
            stopLoading();
        }
    };

    const isRunReportDisabled =
        !reportDates.startDate ||
        !reportDates.endDate ||
        new Date(reportDates.startDate) > new Date(reportDates.endDate);

    const getDateStringToday = () => {
        const today = new Date();
        return today.toISOString().split("T")[0];
    };

    const getDateStringOneWeekAgo = () => {
        const today = new Date();
        today.setDate(today.getDate() - 7);
        return today.toISOString().split("T")[0];
    };

    return (
        <div className="xbrl-page neighbor-element">
            <h2 className="page-heading">
                <Link to="/reports" className="breadcrumb-link">Reports</Link> . XBRL
            </h2>

            <div className="tabs-container">
                {Object.keys(categories).map((tab) => (
                    <button
                        key={tab}
                        className={`tab-button ${activeTab === tab ? "active" : ""}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="tab-content">
                <table className="xbrl-table">
                    <tbody>
                    {categories[activeTab]?.map((entry) => (
                        <tr key={entry.id}>
                            <td>
                                <FaInfoCircle color={"#261771"}
                                    data-tooltip-id={`tooltip-${entry.id}`}
                                      className="info-icon"
                                />
                                <ReactTooltip
                                    id={`tooltip-${entry.id}`}
                                    className="custom-tooltip"
                                    place="right"
                                    type="dark"
                                    effect="solid" >
                                    {entry.description || "No description available"}
                                </ReactTooltip>
                            </td>
                            <td>{entry.name}</td>
                            <td>{entry.dimension || ""}</td>
                            <td>
                                <input
                                    type="text"
                                    value={userInputs[entry.id] || ""}
                                    onChange={(e) => handleInputChange(entry.id, e.target.value)}
                                    className="xbrl-input"
                                />
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                <div className="xbrl-button-group">
                    <button className="generate-report-button" onClick={handleOpenReportModal}>
                        <FaCog /> Generate Report
                    </button>
                    <button className="xbrl-save-changes-button" onClick={handleSaveChanges}>
                        <FaDownload /> Save Changes
                    </button>
                </div>
            </div>
            {showReportModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h4 className={"staged-form-title"}>Run Report</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="startDate">Start Date</label>
                                <DatePicker
                                    id="startDate"
                                    selected={reportDates.startDate ? new Date(reportDates.startDate) : null}
                                    maxDate={new Date()}
                                    dateFormat="yyyy-MM-dd"
                                    onChange={(date) => {
                                        if (!isPastDate(date)) {
                                            setReportDates((prev) => ({
                                                ...prev,
                                                startDate: getDateStringOneWeekAgo(),
                                            }));
                                        } else {
                                            setReportDates((prev) => ({
                                                ...prev,
                                                startDate: date ? date.toISOString().split("T")[0] : "",
                                            }));
                                        }
                                    }}
                                    placeholderText="Select a start date"
                                    className="custom-date-picker"
                                    isClearable
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="endDate">End Date</label>
                                <DatePicker
                                    id="endDate"
                                    selected={reportDates.endDate ? new Date(reportDates.endDate) : null}
                                    minDate={
                                        reportDates.startDate ? new Date(reportDates.startDate) : undefined
                                    }
                                    maxDate={new Date()}
                                    dateFormat="yyyy-MM-dd"
                                    onChange={(date) => {
                                        if (
                                            date <= new Date(reportDates.startDate) ||
                                            !isPastDate(date)
                                        ) {
                                            setReportDates((prev) => ({
                                                ...prev,
                                                endDate: getDateStringToday(),
                                            }));
                                        } else {
                                            setReportDates((prev) => ({
                                                ...prev,
                                                endDate: date ? date.toISOString().split("T")[0] : "",
                                            }));
                                        }
                                    }}
                                    placeholderText="Select an end date"
                                    className="custom-date-picker"
                                    isClearable
                                />
                            </div>
                        </div>
                        <div className="modal-action-button">
                            <button className="modal-cancel-button" onClick={handleCloseReportModal}>
                                Cancel
                            </button>
                            <button className="modal-submit-button"
                                    onClick={handleRunReport}
                                    disabled={isRunReportDisabled}
                            >
                                Run Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default XBRLReports;
