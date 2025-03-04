import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../context/AuthContext';
import { useLoading } from '../../../context/LoadingContext';
import { API_CONFIG } from '../../../config';
import './FinancialActivityMappingsTable.css';

const FinancialActivityMappingsTable = () => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const [mappings, setMappings] = useState([]);
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedMapping, setSelectedMapping] = useState(null);
    const [showMappingModal, setShowMappingModal] = useState(false);

    useEffect(() => {
        fetchMappings();
    }, [currentPage, pageSize]);

    const fetchMappings = async () => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/financialactivityaccounts`, {
                params: { offset: (currentPage - 1) * pageSize, limit: pageSize },
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            const fetchedMappings = response.data || [];
            setMappings(fetchedMappings);
            setTotalPages(Math.ceil(fetchedMappings.length / pageSize));
        } catch (error) {
            console.error('Error fetching mappings:', error);
        } finally {
            stopLoading();
        }
    };

    const fetchMappingDetails = async (id) => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/financialactivityaccounts/${id}?template=false`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setSelectedMapping(response.data);
            setShowMappingModal(true);
        } catch (error) {
            console.error('Error fetching mapping details:', error);
        } finally {
            stopLoading();
        }
    };

    const handleRowClick = (mappingId) => {
        fetchMappingDetails(mappingId);
    };

    const handleCloseModal = () => {
        setShowMappingModal(false);
        setSelectedMapping(null);
    };

    return (
        <div className="mappings-table-container">
            <table className="mappings-table">
                <thead>
                <tr>
                    <th>Financial Activity</th>
                    <th>Account Name</th>
                </tr>
                </thead>
                <tbody>
                {mappings.length > 0 ? (
                    mappings.map((mapping) => (
                        <tr
                            key={mapping.id}
                            onClick={() => handleRowClick(mapping.id)}
                            className="clickable-row"
                        >
                            <td>{mapping.financialActivityData?.name || 'N/A'}</td>
                            <td>{mapping.glAccountData?.name || 'N/A'}</td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="2" className="no-data">No mappings available</td>
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
                            disabled={currentPage === totalPages}>Next</button>
                    <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>End</button>
                </div>
            )}

            {showMappingModal && selectedMapping && (
                <div
                    className="create-provisioning-criteria-modal-overlay"
                    onClick={handleCloseModal}
                >
                    <div
                        className="create-provisioning-criteria-modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h4 className="create-modal-title">Mapping Details</h4>
                        <table className="create-provisioning-criteria-table">
                            <tbody>
                            <tr>
                                <td className="create-provisioning-criteria-label">Financial Activity</td>
                                <td>{selectedMapping.financialActivityData?.name || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td className="create-provisioning-criteria-label">Account Type</td>
                                <td>{selectedMapping.financialActivityData?.mappedGLAccountType || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td className="create-provisioning-criteria-label">Account Name</td>
                                <td>{selectedMapping.glAccountData?.name || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td className="create-provisioning-criteria-label">GL Code</td>
                                <td>{selectedMapping.glAccountData?.glCode || 'N/A'}</td>
                            </tr>
                            </tbody>
                        </table>
                        <div className="create-provisioning-criteria-modal-actions">
                            <button className="create-provisioning-criteria-cancel" onClick={handleCloseModal}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinancialActivityMappingsTable;
