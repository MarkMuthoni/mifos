import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import './ManageInvestors.css';

const ManageInvestors = () => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();

    const [searchText, setSearchText] = useState('');
    const [effectiveDateFrom, setEffectiveDateFrom] = useState('');
    const [effectiveDateTo, setEffectiveDateTo] = useState('');
    const [settlementDateFrom, setSettlementDateFrom] = useState('');
    const [settlementDateTo, setSettlementDateTo] = useState('');
    const [tableData, setTableData] = useState([]);

    const handleSearch = async () => {
        startLoading();
        try {
            const payload = {
                searchText,
                effectiveDateFrom,
                effectiveDateTo,
                settlementDateFrom,
                settlementDateTo,
            };

            const response = await axios.post(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/search/advance`,
                payload,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            setTableData(response.data || []);
        } catch (error) {
            console.error('Error fetching investors:', error);
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="manage-investors-container neighbor-element">
            <h2 className="page-heading">
                <Link to="/organization" className="breadcrumb-link"> Organization </Link>{' '}. Manage Investors
            </h2>

            <div className="manage-investors-form-container">
                <form className="manage-investors-form" onSubmit={(e) => e.preventDefault()}>
                    <div className="manage-investors-row">
                        <label className="manage-investors-label">
                            Search by Text
                            <input
                                type="text"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                className="manage-investors-input"
                                placeholder="Enter text to search"
                            />
                        </label>
                    </div>

                    <div className="manage-investors-row">
                        <label className="manage-investors-label">
                            Effective Date From
                            <input
                                type="date"
                                value={effectiveDateFrom}
                                onChange={(e) => setEffectiveDateFrom(e.target.value)}
                                className="manage-investors-input"
                            />
                        </label>
                        <label className="manage-investors-label">
                            Effective Date To
                            <input
                                type="date"
                                value={effectiveDateTo}
                                onChange={(e) => setEffectiveDateTo(e.target.value)}
                                className="manage-investors-input"
                            />
                        </label>
                    </div>

                    <div className="manage-investors-row">
                        <label className="manage-investors-label">
                            Settlement Date From
                            <input
                                type="date"
                                value={settlementDateFrom}
                                onChange={(e) => setSettlementDateFrom(e.target.value)}
                                className="manage-investors-input"
                            />
                        </label>
                        <label className="manage-investors-label">
                            Settlement Date To
                            <input
                                type="date"
                                value={settlementDateTo}
                                onChange={(e) => setSettlementDateTo(e.target.value)}
                                className="manage-investors-input"
                            />
                        </label>
                    </div>

                    <button
                        type="button"
                        className="manage-investors-button"
                        onClick={handleSearch}
                    >
                        Search
                    </button>
                </form>
            </div>

            <table className="manage-investors-table">
                <thead>
                <tr>
                    <th>Investor Name</th>
                    <th>Effective Date</th>
                    <th>Settlement Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                </tr>
                </thead>
                <tbody>
                {tableData.length > 0 ? (
                    tableData.map((item, index) => (
                        <tr key={index}>
                            <td>{item.investorName}</td>
                            <td>{item.effectiveDate}</td>
                            <td>{item.settlementDate}</td>
                            <td>{item.amount}</td>
                            <td>{item.status}</td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="5" className="manage-investors-no-data">
                            No data to display
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
        </div>
    );
};

export default ManageInvestors;
