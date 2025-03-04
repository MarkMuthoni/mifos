import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import './ViewHolidays.css';

const ViewHolidays = () => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const [offices, setOffices] = useState([]);
    const [selectedOffice, setSelectedOffice] = useState(1);
    const [holidays, setHolidays] = useState([]);
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [nameFilter, setNameFilter] = useState('');
    const [totalPages, setTotalPages] = useState(1);
    const navigate = useNavigate();


    useEffect(() => {
        fetchOffices();
    }, []);

    useEffect(() => {
        if (offices.length > 0) {
            setSelectedOffice(offices[0].id);
            fetchHolidays(offices[0].id);
        }
    }, [offices]);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredHolidays().length / pageSize));
    }, [holidays, nameFilter, pageSize]);

    const fetchOffices = async () => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/offices`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setOffices(response.data || []);
        } catch (error) {
            console.error('Error fetching offices:', error);
        } finally {
            stopLoading();
        }
    };

    const fetchHolidays = async (officeId) => {
        startLoading();
        try {
            const response = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/holidays?officeId=${officeId}`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            setHolidays(response.data || []);
        } catch (error) {
            console.error('Error fetching holidays:', error);
        } finally {
            stopLoading();
        }
    };

    const handleOfficeChange = (e) => {
        const officeId = Number(e.target.value);
        setSelectedOffice(officeId);
        fetchHolidays(officeId);
    };

    const filteredHolidays = () =>
        holidays.filter((holiday) =>
            holiday.name.toLowerCase().includes(nameFilter.toLowerCase())
        );

    const paginatedData = filteredHolidays().slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const formatDate = (dateArray) => {
        if (!dateArray || dateArray.length !== 3) return ' ';
        const [year, month, day] = dateArray;
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const handleRowClick = (holiday) => {
        navigate(`/holidays/view/${holiday.id}`);
    };

    return (
        <div className="view-holidays">
            <div className="table-controls">
                <div className="filter-container">
                    <div className="filter-item">
                        <label htmlFor="officeFilter" className="office-filter-label">Select Office:</label>
                        <select
                            id="officeFilter"
                            value={selectedOffice}
                            onChange={handleOfficeChange}
                            className="office-filter-select"
                        >
                            {offices.map((office) => (
                                <option key={office.id} value={office.id}>
                                    {office.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-item">
                        <label htmlFor="nameFilter">Filter by Name:</label>
                        <input
                            type="text"
                            id="nameFilter"
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                            placeholder="Enter holiday name..."
                        />
                    </div>
                </div>
                <div className="page-size-selector">
                    <div className="filter-item">
                        <label>Rows per page:</label>
                        <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                </div>
            </div>
            <table className="holidays-table">
                <thead>
                <tr>
                    <th>Holiday Name</th>
                    <th>Description</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Repayments Scheduled To</th>
                    <th>Status</th>
                </tr>
                </thead>
                <tbody>
                {paginatedData.length > 0 ? (
                    paginatedData.map((holiday) => (
                        <tr
                            key={holiday.id}
                            onClick={() => holiday.status.value !== "Deleted" && handleRowClick(holiday)}
                            className={`clickable-row ${holiday.status.value === "Deleted" ? "non-clickable-row" : ""}`}
                        >
                            <td>{holiday.name || ''}</td>
                            <td>{holiday.description || ''}</td>
                            <td>{formatDate(holiday.fromDate)}</td>
                            <td>{formatDate(holiday.toDate)}</td>
                            <td>{formatDate(holiday.repaymentsRescheduledTo)}</td>
                            <td>{holiday.status?.value || ''}</td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="6" className="no-data">No holidays available.</td>
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

export default ViewHolidays;
