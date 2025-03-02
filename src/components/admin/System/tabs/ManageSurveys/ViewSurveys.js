import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import './ViewSurveys.css';

const ViewSurveysTable = () => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const [surveys, setSurveys] = useState([]);
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [filter, setFilter] = useState({ name: '', status: '' });
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchSurveys();
    }, []);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredSurveys().length / pageSize));
    }, [surveys, filter, pageSize]);

    const fetchSurveys = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/surveys`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setSurveys(response.data);
        } catch (error) {
            console.error('Error fetching surveys:', error);
        } finally {
            stopLoading();
        }
    };

    const filteredSurveys = () =>
        surveys.filter((survey) => {
            const matchesName = survey.name
                .toLowerCase()
                .includes(filter.name.toLowerCase());
            const matchesStatus =
                filter.status === '' ||
                (filter.status === 'enabled' && survey.enabled) ||
                (filter.status === 'disabled' && !survey.enabled);
            return matchesName && matchesStatus;
        });

    const paginatedData = filteredSurveys().slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
        setCurrentPage(1);
    };

    const handleRowClick = (survey) => {
        // console.log('Row Data:', survey);
    };

    return (
        <div className="surveys-table-container">
            <div className="table-controls">
                <div className="filter-container">
                    <div className="filter-item">
                        <label htmlFor="nameFilter">Filter by Name:</label>
                        <input
                            type="text"
                            id="nameFilter"
                            value={filter.name}
                            onChange={(e) =>
                                setFilter((prev) => ({ ...prev, name: e.target.value }))
                            }
                            placeholder="Enter survey name..."
                        />
                    </div>
                    <div className="filter-item">
                        <label htmlFor="statusFilter">Filter by Status:</label>
                        <select
                            id="statusFilter"
                            value={filter.status}
                            onChange={(e) =>
                                setFilter((prev) => ({ ...prev, status: e.target.value }))
                            }
                        >
                            <option value="">All</option>
                            <option value="enabled">Enabled</option>
                            <option value="disabled">Disabled</option>
                        </select>
                    </div>
                </div>

                <div className="page-size-selector">
                    <label>Rows per page: </label>
                    <select value={pageSize} onChange={handlePageSizeChange}>
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>
            <table className="surveys-table">
                <thead>
                <tr>
                    <th>Key</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Country Code</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
                </thead>
                <tbody>
                {paginatedData.length > 0 ? (
                    paginatedData.map((survey) => (
                        <tr
                            key={survey.id}
                            onClick={() => handleRowClick(survey)}
                            className="clickable-row"
                        >
                            <td>{survey.key}</td>
                            <td>{survey.name}</td>
                            <td>{survey.description || 'N/A'}</td>
                            <td>{survey.countryCode}</td>
                            <td>
                                <div className="indicator-container">
                                    <div
                                        className={`indicator ${survey.enabled ? 'yes' : 'no'}`}
                                    ></div>
                                    <div className="tooltip">
                                        {survey.enabled ? 'Enabled' : 'Disabled'}
                                    </div>
                                </div>
                            </td>
                            <td>
                                <button className="action-button">Details</button>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="6" className="no-data">No surveys available</td>
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

export default ViewSurveysTable;
