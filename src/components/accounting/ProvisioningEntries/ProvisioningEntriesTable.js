import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../context/AuthContext';
import { useLoading } from '../../../context/LoadingContext';
import { API_CONFIG } from '../../../config';
import './ProvisioningEntriesTable.css';

const ProvisioningEntriesTable = () => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const [entries, setEntries] = useState([]);
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchProvisioningEntries();
    }, [currentPage, pageSize]);

    const fetchProvisioningEntries = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/provisioningentries`, {
                params: {
                    dateFormat: 'dd MMMM yyyy',
                    limit: pageSize,
                    locale: 'en',
                    offset: (currentPage - 1) * pageSize
                },
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            const fetchedEntries = response.data.pageItems || [];
            setEntries(fetchedEntries);
            setTotalPages(Math.ceil(response.data.totalFilteredRecords / pageSize));
        } catch (error) {
            console.error('Error fetching provisioning entries:', error);
        } finally {
            stopLoading();
        }
    };

    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
        setCurrentPage(1);
    };

    const handleRowClick = (entry) => {
        console.log("Provisioning Entry Data:", entry);
        // Future functionality for a detailed view can be added here
    };

    return (
        <div className="provisioning-table-container">
            <div className="page-size-selector">
                <label>Rows per page:</label>
                <select value={pageSize} onChange={handlePageSizeChange}>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                </select>
            </div>
            <table className="provisioning-table">
                <thead>
                <tr>
                    <th>Created By</th>
                    <th>Created On</th>
                    <th>Journal Entry Created</th>
                    <th>View Report</th>
                    <th>Recreate Provisioning</th>
                    <th>View Journal Entries</th>
                </tr>
                </thead>
                <tbody>
                {entries.length > 0 ? (
                    entries.map((entry) => (
                        <tr
                            key={entry.id}
                            onClick={() => handleRowClick(entry)}
                            className="clickable-row"
                        >
                            <td>{entry.createdBy || 'N/A'}</td>
                            <td>{entry.createdOn || 'N/A'}</td>
                            <td>{entry.journalEntryCreated ? 'Yes' : 'No'}</td>
                            <td><button className="provisioning-action-button">View Report</button></td>
                            <td><button className="provisioning-action-button">Recreate Provisioning</button></td>
                            <td><button className="provisioning-action-button">View Journal Entries</button></td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="6" className="no-data">No provisioning entries available</td>
                    </tr>
                )}
                </tbody>
            </table>
            {totalPages > 1 && (
                <div className="pagination">
                    <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>Start</button>
                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}>Previous
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}>Next
                    </button>
                    <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>End</button>
                </div>
            )}
        </div>
    );
};

export default ProvisioningEntriesTable;
