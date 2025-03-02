import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import './ViewSMSCampaigns.css';

const ViewSMSCampaigns = () => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const [campaigns, setCampaigns] = useState([]);
    const [nameFilter, setNameFilter] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchSMSCampaigns();
    }, []);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredCampaigns().length / pageSize));
    }, [campaigns, nameFilter, pageSize]);

    const fetchSMSCampaigns = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/smscampaigns`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });

            const responseData = response.data || [];
            setCampaigns(Array.isArray(responseData) ? responseData : []);
        } catch (error) {
            console.error('Error fetching SMS campaigns:', error);
            setCampaigns([]);
        } finally {
            stopLoading();
        }
    };

    const filteredCampaigns = () =>
        campaigns.filter((campaign) =>
            campaign.name.toLowerCase().includes(nameFilter.toLowerCase())
        );

    const paginatedData = filteredCampaigns().slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handleRowClick = (campaign) => {
        console.log('Selected Campaign:', campaign);
    };

    return (
        <div className="view-sms-campaigns">
            <div className="table-controls">
                <div className="filter-container">
                    <div className="filter-item">
                        <label htmlFor="nameFilter" className="name-filter-label">Filter by Name:</label>
                        <input
                            type="text"
                            id="nameFilter"
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                            placeholder="Enter campaign name..."
                            className="name-filter-input"
                        />
                    </div>
                </div>
                <div className="page-size-selector">
                    <label>Rows per page:</label>
                    <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>
            <table className="sms-campaigns-table">
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Template Message</th>
                    <th>Campaign Type</th>
                    <th>Trigger Type</th>
                    <th>Status</th>
                    <th>Approved By</th>
                </tr>
                </thead>
                <tbody>
                {paginatedData.length > 0 ? (
                    paginatedData.map((campaign) => (
                        <tr
                            key={campaign.id}
                            onClick={() => handleRowClick(campaign)}
                            className="clickable-row"
                        >
                            <td>{campaign.name || ''}</td>
                            <td>{campaign.templateMessage || ''}</td>
                            <td>{campaign.campaignType || ''}</td>
                            <td>{campaign.triggerType || ''}</td>
                            <td>{campaign.status || ''}</td>
                            <td>{campaign.approvedBy || ''}</td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="6" className="no-data">No SMS campaigns available.</td>
                    </tr>
                )}
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

export default ViewSMSCampaigns;
