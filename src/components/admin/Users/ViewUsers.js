import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../context/AuthContext';
import { useLoading } from '../../../context/LoadingContext';
import { API_CONFIG } from '../../../config';
import './ViewUsers.css';

const ViewUsers = ({ onRowClick }) => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const [filters, setFilters] = useState({ firstName: '', email: '' });
    const [allUsers, setAllUsers] = useState([]);
    const [users, setUsers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/users`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });

            setAllUsers(response.data || []);
            setTotalPages(Math.ceil(response.data.length / pageSize));
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            stopLoading();
        }
    };

    useEffect(() => {
        setTotalPages(Math.ceil(allUsers.length / pageSize));
        setCurrentPage(1);
    }, [allUsers, pageSize]);

    useEffect(() => {
        const filteredUsers = allUsers.filter((user) => {
            const matchesFirstName = filters.firstName
                ? user.firstname?.toLowerCase().includes(filters.firstName.toLowerCase())
                : true;

            const matchesEmail = filters.email
                ? user.email?.toLowerCase().includes(filters.email.toLowerCase())
                : true;

            return matchesFirstName && matchesEmail;
        });

        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        setUsers(filteredUsers.slice(startIndex, endIndex));
        setTotalPages(Math.ceil(filteredUsers.length / pageSize));
    }, [allUsers, filters, currentPage, pageSize]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({
            ...prev,
            [name]: value,
        }));
        setCurrentPage(1);
    };

    const handleRowClick = (user) => {
        onRowClick(user)
    };

    const handlePreviousPage = () => setCurrentPage((prev) =>
        Math.max(prev - 1, 1));
    const handleNextPage = () => setCurrentPage((prev) =>
        Math.min(prev + 1, totalPages));

    return (
        <div className="view-users">
            <div className="table-controls">
                <div className="filters-container">
                    <div className="filter-group">
                        <label htmlFor="firstName">First Name:</label>
                        <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            placeholder="Search by First Name"
                            value={filters.firstName}
                            onChange={handleFilterChange}
                            className="filter-input"
                        />
                    </div>
                    <div className="filter-group">
                        <label htmlFor="email">Email:</label>
                        <input
                            type="text"
                            id="email"
                            name="email"
                            placeholder="Search by Email"
                            value={filters.email}
                            onChange={handleFilterChange}
                            className="filter-input"
                        />
                    </div>
                </div>

                <div className="page-size-selector">
                    <label htmlFor="pageSize">Rows per page: </label>
                    <select
                        id="pageSize"
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                        className="page-size-dropdown"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
            </div>
            <table className="users-table">
                <thead>
                <tr>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Email</th>
                    <th>Office</th>
                </tr>
                </thead>
                <tbody>
                {users.length === 0 ? (
                    <tr>
                        <td colSpan="4">No users found. Please apply filters and search.</td>
                    </tr>
                ) : (
                    users.map((user) => (
                        <tr
                            key={user.id}
                            className="clickable-row"
                            onClick={() => handleRowClick(user)}
                        >
                            <td>{user.firstname || ''}</td>
                            <td>{user.lastname || ''}</td>
                            <td>{user.email || ''}</td>
                            <td>{user.officeName || ''}</td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>

            {totalPages > 1 && (
                <div className="pagination">
                    <button className="pagination-button" onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}>
                        Start
                    </button>
                    <button className="pagination-button" onClick={handlePreviousPage} disabled={currentPage === 1}>
                        Previous
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button className="pagination-button" onClick={handleNextPage}
                            disabled={currentPage === totalPages}>
                        Next
                    </button>
                    <button className="pagination-button" onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}>
                        End
                    </button>
                </div>
            )}
        </div>
    );
};

export default ViewUsers;
