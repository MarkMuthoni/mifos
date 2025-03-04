import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useLoading } from '../../../../../context/LoadingContext';
import { AuthContext } from '../../../../../context/AuthContext';
import './DataTableDetail.css';
import { API_CONFIG } from '../../../../../config';
import { FaCheck, FaTimes } from 'react-icons/fa';
import {NotificationContext} from "../../../../../context/NotificationContext";

const DataTableDetail = ({ dataTable, onCloseTab, tabId }) => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const [tableDetails, setTableDetails] = useState(null);

    useEffect(() => {
        fetchTableDetails();
    }, [dataTable]);

    const fetchTableDetails = async () => {
        startLoading();
        try {
            const response = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/datatables/${encodeURIComponent(dataTable.registeredTableName)}`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            setTableDetails(response.data);
        } catch (err) {
            console.error('Error fetching table details:', err);
        } finally {
            stopLoading();
        }
    };

    const handleDeleteTable = async () => {
        if (!window.confirm(`Are you sure you want to delete the table "${dataTable.registeredTableName}"?`)) {
            return;
        }

        startLoading();
        try {
            await axios.delete(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/datatables/${encodeURIComponent(dataTable.registeredTableName)}`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            onCloseTab(tabId);
            showNotification("Table deleted successfully!", 'success');
        } catch (err) {
            console.error('Error deleting table:', err);
            showNotification('Failed to delete the table. Please try again later!', 'error');
        } finally {
            stopLoading();
        }
    };

    const renderBooleanIndicator = (value) => (
        <span
            className={`boolean-indicator ${value ? 'true' : 'false'}`}
            title={value ? 'Yes' : 'No'}
        >
            {value ? <FaCheck /> : <FaTimes />}
        </span>
    );

    return (
        <div className="data-table-detail-container">
            <div className="data-table-header">
                <h3 className="data-table-title">
                    Associated With {dataTable.applicationTableName}
                </h3>
                <div className="top-right-buttons">
                    <button className="delete-button" onClick={handleDeleteTable}>
                        Delete
                    </button>
                </div>
            </div>

            <>

                <table className="data-table-columns">
                    <thead>
                    <tr>
                        <th>Field Name</th>
                        <th>Type</th>
                        <th>Length</th>
                        <th>Code</th>
                        <th>Mandatory</th>
                        <th>Unique</th>
                        <th>Indexed</th>
                    </tr>
                    </thead>
                    <tbody>
                    {tableDetails?.columnHeaderData?.length > 0 ? (
                        tableDetails.columnHeaderData.map((col, index) => (
                            <tr key={index}>
                                <td>{col.columnName}</td>
                                <td>{col.columnType}</td>
                                <td>{col.columnLength || '0'}</td>
                                <td>{col.columnCode || ''}</td>
                                <td>{renderBooleanIndicator(!col.isColumnNullable)}</td>
                                <td>{renderBooleanIndicator(col.isColumnUnique)}</td>
                                <td>{renderBooleanIndicator(col.isColumnIndexed)}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="7" className="no-data">
                                No column data available.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </>
        </div>
    );
};

export default DataTableDetail;
