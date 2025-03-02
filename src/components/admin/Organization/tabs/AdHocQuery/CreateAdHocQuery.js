import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import './CreateAdHocQuery.css';
import {NotificationContext} from "../../../../../context/NotificationContext";

const CreateAdHocQuery = ({ onFormSubmitSuccess }) => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();

    const [name, setName] = useState('');
    const [sqlQuery, setSqlQuery] = useState('');
    const [insertIntoTable, setInsertIntoTable] = useState('');
    const [tableFields, setTableFields] = useState('');
    const [reportRunFrequency, setReportRunFrequency] = useState('');
    const [isActive, setIsActive] = useState(false);
    const [frequencies, setFrequencies] = useState([]);
    const { showNotification } = useContext(NotificationContext);

    useEffect(() => {
        fetchTemplate();
    }, []);

    const fetchTemplate = async () => {
        startLoading();
        try {
            const response = await axios.get(
                `/fineract-provider/api/v1/adhocquery/template`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    },
                }
            );
            setFrequencies(response.data?.reportRunFrequencies || []);
        } catch (error) {
            console.error('Error fetching Ad Hoc Query template:', error);
        } finally {
            stopLoading();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            name,
            sqlQuery,
            insertIntoTable,
            tableFields,
            reportRunFrequency: reportRunFrequency || null,
            isActive,
        };

        startLoading();
        try {
            await axios.post(
                `/fineract-provider/api/v1/adhocquery`,
                payload,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            onFormSubmitSuccess();
            showNotification("Ad Hoc query submitted!", 'success');
        } catch (error) {
            console.error('Error creating Ad Hoc Query:', error);
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="create-adhoc-query-container">
            <form className="create-adhoc-query-form" onSubmit={handleSubmit}>
                <h3 className="create-adhoc-query-title">Create Ad Hoc Query</h3>
                <div className="create-adhoc-query-group">
                    <label htmlFor="name" className="create-adhoc-query-label">
                        Name <span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter query name"
                        className="create-adhoc-query-input"
                        required
                    />
                </div>
                <div className="create-adhoc-query-group">
                    <label htmlFor="sqlQuery" className="create-adhoc-query-label">
                        SQL Query <span className="required">*</span>
                    </label>
                    <textarea
                        id="sqlQuery"
                        value={sqlQuery}
                        onChange={(e) => setSqlQuery(e.target.value)}
                        placeholder="Enter SQL query"
                        className="create-adhoc-query-textarea"
                        required
                    ></textarea>
                </div>
                <div className="create-adhoc-query-group">
                    <label htmlFor="insertIntoTable" className="create-adhoc-query-label">
                        Insert Into Table <span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        id="insertIntoTable"
                        value={insertIntoTable}
                        onChange={(e) => setInsertIntoTable(e.target.value)}
                        placeholder="Enter table name"
                        className="create-adhoc-query-input"
                        required
                    />
                </div>
                <div className="create-adhoc-query-group">
                    <label htmlFor="tableFields" className="create-adhoc-query-label">
                        Table Fields <span className="required">*</span>
                    </label>
                    <textarea
                        id="tableFields"
                        value={tableFields}
                        onChange={(e) => setTableFields(e.target.value)}
                        placeholder="Enter table fields"
                        className="create-adhoc-query-textarea"
                        required
                    ></textarea>
                </div>
                <div className="create-adhoc-query-group">
                    <label htmlFor="reportRunFrequency" className="create-adhoc-query-label">
                        Email Report Run Frequency
                    </label>
                    <select
                        id="reportRunFrequency"
                        value={reportRunFrequency}
                        onChange={(e) => setReportRunFrequency(e.target.value)}
                        className="create-adhoc-query-select"
                    >
                        <option value="">Select frequency</option>
                        {frequencies.map((frequency) => (
                            <option key={frequency.id} value={frequency.value}>
                                {frequency.value}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="create-adhoc-query-group">
                    <label className="create-adhoc-query-label">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                        />{' '}
                        Active
                    </label>
                </div>
                <div className="create-adhoc-query-actions">
                    <button
                        type="submit"
                        className="create-adhoc-query-submit"
                        disabled={!name || !sqlQuery || !insertIntoTable || !tableFields}
                    >
                        Create Ad Hoc Query
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateAdHocQuery;
