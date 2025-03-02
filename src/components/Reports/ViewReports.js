import React, {useState, useEffect, useContext, useRef} from "react";
import axios from "axios";
import {Link, useNavigate, useParams} from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { useLoading } from "../../context/LoadingContext";
import { API_CONFIG } from "../../config";
import "./ViewReports.css";
import DatePicker from "react-datepicker";
import * as XLSX from 'xlsx';
import {NotificationContext} from "../../context/NotificationContext";

const ReportFormPage = () => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const { reportId } = useParams();
    const { showNotification } = useContext(NotificationContext);
    const navigate = useNavigate();

    const [reportDetails, setReportDetails] = useState(null);
    const [formValues, setFormValues] = useState({});
    const [options, setOptions] = useState({});
    const [error, setError] = useState("");

    const [showTable, setShowTable] = useState(false);
    const [tableData, setTableData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [showCsvModal, setShowCsvModal] = useState(false);
    const [csvDelimiter, setCsvDelimiter] = useState(",");
    const [csvFileName, setCsvFileName] = useState("report.csv");

    const [parentChildMap, setParentChildMap] = useState({});
    const [fieldTypes, setFieldTypes] = useState({});
    const notificationShown = useRef(false);

    useEffect(() => {
        if (reportId) fetchReportDetails();
    }, [reportId]);

    useEffect(() => {
        if (reportDetails?.reportName) {
            setCsvFileName(`${reportDetails.reportName}.csv`);
        }
    }, [reportDetails]);

    useEffect(() => {
        areAllFieldsSelected();
    }, [formValues]);

    const mapParameterName = (parameterName) => {
        if (!parameterName) return "";
        if (parameterName.endsWith("SelectOne") || parameterName.endsWith("SelectAll")) {
            const baseName = parameterName.replace("SelectOne", "").replace("SelectAll", "");
            return `R_${baseName.charAt(0).toLowerCase()}${baseName.slice(1)}`;
        }
        return `R_${parameterName.charAt(0).toLowerCase()}${parameterName.slice(1)}`;
    };

    const fetchReportDetails = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/reports/${reportId}`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                },
            });
            const { reportName } = response.data;
            setReportDetails(response.data);

            await fetchParameterList(reportName);
        } catch (err) {
            console.error("Error fetching report details:", err);
            showNotification("Failed to load report details!", 'error');
        } finally {
            stopLoading();
        }
    };

    const fetchParameterList = async (reportName) => {
        startLoading();


        try {
            const response = await axios.get(
                `/fineract-provider/api/v1/runreports/FullParameterList?R_reportListing='${reportName}'&parameterType=true`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    },
                }
            );

            const parameterData = response.data.data || [];
            const parentChildMap = {};
            const initialValues = {};
            const fieldTypes = {};

            parameterData.forEach(({ row }) => {
                const [parameterName, , , fieldType, , , , , parentParameter] = row;

                fieldTypes[parameterName] = fieldType;

                if (parentParameter) {
                    if (!parentChildMap[parentParameter]) parentChildMap[parentParameter] = [];
                    parentChildMap[parentParameter].push(parameterName);
                }

                initialValues[mapParameterName(parameterName)] = "";
            });

            setParentChildMap(parentChildMap);
            setFormValues(initialValues);

            setFieldTypes(fieldTypes);

            parameterData
                .filter(({ row }) => !row[8])
                .forEach(({ row }) => {
                    if (fieldTypes[row[0]] === "select") {
                        fetchOptionsForField(row[0]);
                    }
                });
        } catch (err) {
            console.error("Error fetching parameter list:", err);

            if (err.response && err.response.status === 403 && !notificationShown.current) {
                showNotification("There was an error fetching the report parameters!", "error");
                notificationShown.current = true;
                navigate("/reports/all");
            } else if (!notificationShown.current) {
                showNotification("Failed to load parameter list. Please try refreshing.", "error");
                notificationShown.current = true;
            }
        } finally {
            stopLoading();
        }
    };

    function getColumnIndices(columnHeaders) {
        const ID_ALIASES = ["id", "code"];
        const NAME_ALIASES = ["name", "displayName", "tc", "code_value"];

        let idIndex = -1;
        let nameIndex = -1;

        columnHeaders.forEach((header, idx) => {
            const colName = header.columnName.toLowerCase();

            if (ID_ALIASES.includes(colName) && idIndex === -1) {
                idIndex = idx;
            }
            if (NAME_ALIASES.includes(colName) && nameIndex === -1) {
                nameIndex = idx;
            }
        });

        return { idIndex, nameIndex };
    }

    const fetchOptionsForField = async (parameterName, parentValue = null) => {
        startLoading();
        try {
            let endpoint = `/runreports/${parameterName}?parameterType=true`;
            if (parentValue) {
                const parentKey = mapParameterName(Object.keys(parentChildMap).find(key => parentChildMap[key]?.includes(parameterName)) || "");
                endpoint += `&${parentKey}=${parentValue}`;
            }

            const response = await axios.get(`/fineract-provider/api/v1${endpoint}`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                },
            });

            const { data, columnHeaders } = response.data || {};
            const { idIndex, nameIndex } = getColumnIndices(columnHeaders || []);

            let parsedOptions = (data || []).map((rowObj) => {
                const row = rowObj.row || [];
                return { id: row[idIndex] || "", name: row[nameIndex] || "-" };
            });

            parsedOptions = parsedOptions.map(option =>
                (option.id === -1 || option.id === -10) ? { ...option, name: "All" } : option
            );

            const hasAllOption = parsedOptions.some(option => option.id === -1 || option.id === -10);
            if (!hasAllOption && !parameterName.toLowerCase().includes("office")) {
                parsedOptions.unshift({ id: -1, name: "All" });
            }

            setOptions((prev) => ({
                ...prev,
                [parameterName]: parsedOptions,
            }));

        } catch (err) {
            console.error(`Error fetching options for ${parameterName}:`, err);
            setOptions((prev) => ({
                ...prev,
                [parameterName]: [{ id: -1, name: "All" }],
            }));
        } finally {
            stopLoading();
        }
    };

    const handleParentChange = async (parentField, value) => {
        handleInputChange(parentField, value);

        if (!value) {
            const children = parentChildMap[parentField] || [];
            const clearedValues = children.reduce((acc, child) => {
                acc[child] = "";
                return acc;
            }, {});

            setFormValues((prev) => ({ ...prev, ...clearedValues }));
            return;
        }

        const children = parentChildMap[parentField] || [];
        for (const child of children) {
            await fetchOptionsForField(child, value);
        }
    };

    const handleInputChange = (parameterName, value) => {
        setFormValues((prev) => ({
            ...prev,
            [parameterName]: value,
        }));
    };

    function renderLabel(parameterName) {
        const [labelBase] = parameterName.split("Id");

        const parts = labelBase.split(/(?=[A-Z])/);

        const formattedLabel = parts.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

        return (
            <>
                {formattedLabel.trim()} <span className="required">*</span>
            </>
        );
    }

    const renderField = (param) => {
        const { parameterName, parentParameterName } = param;
        const fieldType = fieldTypes?.[parameterName];

        const isChildField = Object.values(parentChildMap).some(children =>
            children.includes(parameterName)
        );

        if (isChildField && parentParameterName) {
            const parentValue = formValues[mapParameterName(parentParameterName)];
            if (!parentValue) {
                return null;
            }
        }

        switch (fieldType) {
            case "select":
                return (
                    <select
                        value={formValues[parameterName] || ""}
                        onChange={(e) => handleParentChange(parameterName, e.target.value)}
                        className="custom-select modern-input"
                    >
                        <option value="">Select an option</option>
                        {(options[parameterName] || []).map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.name || " "}
                            </option>
                        ))}
                    </select>
                );

            case "date":
                return (
                    <DatePicker
                        selected={formValues[parameterName] ? new Date(formValues[parameterName]) : null}
                        onChange={(date) =>
                            handleInputChange(parameterName, date ? date.toISOString().split("T")[0] : "")
                        }
                        className="custom-date-picker modern-input"
                        placeholderText="Select a date"
                        dateFormat="d MMMM yyyy"
                        showPopperArrow={false}
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                    />
                );

            case "text":
                return (
                    <input
                        type="text"
                        value={formValues[parameterName] || ""}
                        onChange={(e) => handleInputChange(parameterName, e.target.value)}
                        className="custom-text-input modern-input"
                        placeholder="Enter value"
                    />
                );

            default:
                return null;
        }
    };

    const handleRunReport = async () => {
        try {
            startLoading();

            const queryParams = new URLSearchParams();

            Object.entries(formValues).forEach(([key, value]) => {
                if (value !== undefined && value !== "") {
                    const mappedKey = mapParameterName(key);
                    queryParams.append(mappedKey, value === -1 ? "-1" : value);
                }
            });

            const url = `/fineract-provider/api/v1/runreports/${encodeURIComponent(
                reportDetails?.reportName
            )}?${queryParams.toString()}`;

            const response = await axios.get(url, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });

            setTableData({
                columnHeaders: response.data.columnHeaders,
                rows: response.data.data,
            });
            setShowTable(true);
        } catch (err) {
            console.error("Error running report:", err.response?.data || err.message);
            showNotification('There was an error running the report!', 'error');
        } finally {
            stopLoading();
        }
    };

    const handleRunAndDownloadReport = async () => {
        try {
            startLoading();

            const queryParams = new URLSearchParams();

            Object.entries(formValues).forEach(([key, value]) => {
                if (value !== undefined && value !== "") {
                    const mappedKey = mapParameterName(key);
                    queryParams.append(mappedKey, value === -1 ? "-1" : value);
                }
            });

            const url = `/fineract-provider/api/v1/runreports/${encodeURIComponent(
                reportDetails?.reportName
            )}?${queryParams.toString()}`;

            const response = await axios.get(url, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });

            const data = response.data;
            if (!data || !data.data || !data.columnHeaders) {
                throw new Error("Invalid report data format.");
            }

            setTableData({
                columnHeaders: data.columnHeaders,
                rows: data.data,
            });
            setShowTable(true);

            const headers = data.columnHeaders.map((header) => header.columnName);
            const rows = data.data.map((rowObj) =>
                rowObj.row.map((cell) => {
                    if (Array.isArray(cell) && cell.length === 3) {
                        const [year, month, day] = cell;
                        return new Intl.DateTimeFormat("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        }).format(new Date(year, month - 1, day));
                    }
                    return cell || "";
                })
            );

            const sheetData = [headers, ...rows];
            const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

            const fileName = `${reportDetails?.reportName || "report"}.xlsx`;
            XLSX.writeFile(workbook, fileName);
        } catch (err) {
            console.error("Error running and downloading report:", err.message);
            showNotification("Failed to run and download the report! Please try again!", 'error');
        } finally {
            stopLoading();
        }
    };

    const renderTable = () => {
        if (!tableData.columnHeaders || !tableData.rows) return null;

        const totalPages = Math.ceil((tableData.rows || []).length / pageSize);
        const paginatedRows = (tableData.rows || []).slice(
            (currentPage - 1) * pageSize,
            currentPage * pageSize
        );

        const formatDate = (dateArray) => {
            if (Array.isArray(dateArray) && dateArray.length === 3) {
                const [year, month, day] = dateArray;
                return new Intl.DateTimeFormat("en-US", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                }).format(new Date(year, month - 1, day));
            }
            return "";
        };

        return (
            <div className="custom-table-container">
                <div className="table-controls">
                    <div className="page-size-selector">
                        <label>Rows per page:</label>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                </div>
                <table className="custom-table">
                    <thead>
                        <tr>
                            {(tableData.columnHeaders || []).map((header, idx) => (
                                <th key={idx}>{header.columnName || ""}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedRows.map((row, idx) => (
                            <tr key={idx}>
                                {(row.row || []).map((cell, cellIdx) => (
                                    <td key={cellIdx}>
                                        {Array.isArray(cell) && cell.length === 3
                                            ? formatDate(cell)
                                            : Array.isArray(cell)
                                                ? cell.join("-")
                                                : cell || ""}
                                    </td>
                                ))}
                            </tr>
                        ))}
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
        );
    };

    const handleExportCsv = () => {
        if (!csvFileName || !csvDelimiter) return;

        const csvHeaders = tableData.columnHeaders.map((header) => header.columnName).join(csvDelimiter);
        const csvRows = tableData.rows
            .map((row) => row.row.map((cell) => (Array.isArray(cell) ? cell.join("-") : cell || "")).join(csvDelimiter))
            .join("\n");

        const csvContent = [csvHeaders, csvRows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = csvFileName;
        link.click();
        setShowCsvModal(false);
    };

    const handleExportXls = async () => {
        try {
            const queryParams = new URLSearchParams();

            Object.entries(formValues).forEach(([key, value]) => {
                if (value) queryParams.append(mapParameterName(key), value);
            });

            const url = `/fineract-provider/api/v1/runreports/${encodeURIComponent(reportDetails?.reportName)}?${queryParams.toString()}`;

            const response = await axios.get(url, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });

            const data = response.data;
            if (!data || !data.data || !data.columnHeaders) {
                throw new Error("Invalid report data format.");
            }

            const headers = data.columnHeaders.map((header) => header.columnName);
            const rows = data.data.map((rowObj) =>
                rowObj.row.map((cell) => {
                    if (Array.isArray(cell) && cell.length === 3) {
                        const [year, month, day] = cell;
                        return new Intl.DateTimeFormat("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        }).format(new Date(year, month - 1, day));
                    }
                    return cell || "";
                })
            );

            const sheetData = [headers, ...rows];

            const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

            const fileName = `${reportDetails?.reportName || "report"}.xlsx`;
            XLSX.writeFile(workbook, fileName);
        } catch (error) {
            console.error("Error exporting XLSX:", error.message);
            showNotification("Failed to export the report. Please try again or contact support!", 'error');
        }
    };

    const areAllFieldsSelected = () => {
        if (!Array.isArray(reportDetails?.reportParameters)) {
            return false;
        }

        return reportDetails.reportParameters.every((param) => {
            const value = formValues[mapParameterName(param.parameterName)];
            return value !== undefined && value !== "";
        });
    };

    return (
        <div className="custom-page-container neighbor-element">
            <h2 className="page-heading">
                <Link to="/reports/all" className={"breadcrumb-link"}>Reports</Link> . {" "}
                {reportDetails?.reportName || "Report Form"}
            </h2>

            {showTable ? (
                <>
                    <div className="export-controls">
                        <div className="left-section">
                            <button
                                onClick={() => setShowTable(false)}
                                className="custom-toggle-button left-button"
                            >
                                Show Form
                            </button>
                        </div>
                        <div className="right-section">
                            <button
                                onClick={() => setShowCsvModal(true)}
                                className="custom-toggle-button right-button"
                            >
                                Export CSV
                            </button>
                            <button
                                onClick={() => handleExportXls()}
                                className="custom-toggle-button right-button"
                            >
                                Export XLS
                            </button>
                        </div>
                    </div>
                    {renderTable()}
                </>
            ) : (
                <div className="custom-content">
                {error && <p className="error-message">{error}</p>}

                    <form className="custom-report-form">
                        {(reportDetails?.reportParameters || []).map((param) => (
                            <div key={param.id || param.parameterName} className="custom-form-group">
                                <label>{renderLabel(param.parameterName)}</label>
                                {renderField(param)}
                            </div>
                        ))}
                        <div className="collateral-form-row">
                            <div className="custom-form-group">
                                <label>Decimal Places</label>
                                <select
                                    value={formValues.decimalChoice || "1"}
                                onChange={(e) => handleInputChange("decimalChoice", e.target.value)}
                                className="custom-select"
                            >
                                {[0, 1, 2, 3, 4].map((value) => (
                                    <option key={value} value={value}>
                                        {value}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="custom-form-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={!!formValues.exportS3}
                                    onChange={(e) => handleInputChange("exportS3", e.target.checked)}
                                    className="custom-checkbox"
                                />
                                Export output data to S3 repository
                            </label>
                        </div>
                        </div>

                        <div className="custom-form-actions">
                            <button
                                type="button"
                                onClick={() => {
                                    window.history.back();
                                }}
                                className="custom-cancel-button"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleRunReport}
                            >
                                Run Report
                            </button>
                            <button
                                type="button"
                                onClick={handleRunAndDownloadReport}
                            >
                                Run and Download Report
                            </button>
                        </div>
                    </form>
                </div>
            )}
            {showCsvModal && (
                <div className="create-provisioning-criteria-modal-overlay" onClick={() => setShowCsvModal(false)}>
                    <div
                        className="create-provisioning-criteria-modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h4 className="create-modal-title">Export CSV</h4>
                        <div className="create-provisioning-criteria-group">
                            <label className="create-provisioning-criteria-label">
                                Delimiter
                            </label>
                            <select
                                value={csvDelimiter}
                                onChange={(e) => setCsvDelimiter(e.target.value)}
                                className="create-provisioning-criteria-select"
                            >
                                <option value=",">Comma (,)</option>
                                <option value=";">Semicolon (;)</option>
                                <option value="|">Pipe (|)</option>
                                <option value=":">Colon (:)</option>
                                <option value=" ">Space ( )</option>
                            </select>
                        </div>
                        <div className="create-provisioning-criteria-group">
                            <label className="create-provisioning-criteria-label">
                                File Name
                            </label>
                            <input
                                type="text"
                                value={csvFileName}
                                onChange={(e) => setCsvFileName(e.target.value)}
                                className="create-provisioning-criteria-input"
                                placeholder="Enter file name"
                            />
                        </div>
                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                onClick={() => setShowCsvModal(false)}
                                className="create-provisioning-criteria-cancel"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleExportCsv}
                                className="create-provisioning-criteria-confirm"
                                disabled={!csvFileName || !csvDelimiter}
                            >
                                Export
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportFormPage;
