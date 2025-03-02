import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import '../styling.css';
import { AuthContext } from '../../../context/AuthContext';
import { useLoading } from '../../../context/LoadingContext';
import { API_CONFIG } from '../../../config';
import {NotificationContext} from "../../../context/NotificationContext";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const Clients = ({ onRowClick }) => {
    const [clients, setClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({ searchQuery: '', office: '' });
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const { showNotification } = useContext(NotificationContext);
    const [offices, setOffices] = useState([]);

    const exportToExcel = () => {
        if (filteredClients.length === 0) {
            showNotification('No data to export!', 'warning');
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(
            filteredClients.map(client => ({
                Name: client.displayName,
                "Account Number": client.accountNo,
                "National ID/Passport": client.externalId,
                Status: client.status?.value || '',
                Branch: client.officeName,
                "Mobile Number": client.mobileNo,
                "Loan Officer": client.staffName,
                "Activation Date": client.timeline?.activatedOnDate
                    ? `${client.timeline.activatedOnDate[2]}-${client.timeline.activatedOnDate[1]}-${client.timeline.activatedOnDate[0]}`
                    : "N/A"
            }))
        );

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients');

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array'});
        const excelData = new Blob([excelBuffer], {type: 'application/octet-stream'});

        saveAs(excelData, 'Clients_List.xlsx');
    }

    const fetchClients = async () => {
        try {
            startLoading();
            const response = await axios.get(`/fineract-provider/api/v1/clients`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setClients(response.data.pageItems || []);
            setFilteredClients(response.data.pageItems || []);
        } catch (error) {
            console.error('Error fetching clients:', error);
            showNotification('Error fetching clients!', 'error');
        } finally {
            stopLoading();
        }
    };

    const fetchOffices = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/offices`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantID': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setOffices(response.data || []);
        } catch (error) {
            console.error('Error fetching offices:', error);
            showNotification("Error fetching offices!", 'error');
        } finally {
            stopLoading();
        }
    }

    useEffect(() => {
        fetchClients();
        fetchOffices();
    }, []);

    useEffect(() => {
        let filtered = clients.filter((client) =>
            client.displayName.toLowerCase().includes(filters.searchQuery.toLowerCase())
        );

        if (filters.office) {
            filtered = filtered.filter(client => client.officeName === filters.office);
        }

        setFilteredClients(filtered);
        setTotalPages(Math.ceil(filtered.length / pageSize));
        setCurrentPage(1);
    }, [clients, filters, pageSize]);

    const currentPageData = filteredClients.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handlePreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    const handlePageSizeChange = (e) => setPageSize(Number(e.target.value));

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'status-active';
            case 'inactive':
                return 'status-inactive';
            default:
                return 'status-default';
        }
    };

    return (
        <div className="view-layout navbar-spacing">
            <div className="table-controls">
                <div className="filters-container">
                    <div className="filter-group">
                        <label htmlFor="officeFilter" className="filter-label">
                            Filter by Branch:
                        </label>
                        <select
                            id="officeFilter"
                            name="office"
                            className="filter-input"
                            value={filters.office}
                            onChange={handleFilterChange}
                        >
                            {offices.map(office => (
                                <option key={office.id} value={office.name}>
                                    {office.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label htmlFor="searchQuery" className="filter-label">
                            Search by Client Name:
                        </label>
                        <input
                            type="text"
                            id="searchQuery"
                            name="searchQuery"
                            placeholder="Enter client name"
                            className="filter-input"
                            value={filters.searchQuery}
                            onChange={handleFilterChange}
                        />
                    </div>
                </div>
                <div className="filters-container">
                    <div className="filter-group">
                        <label htmlFor="pageSize" className="filter-label">
                            Rows per page:
                        </label>
                        <select
                            id="pageSize"
                            value={pageSize}
                            onChange={handlePageSizeChange}
                            className="filter-input"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={500}>500</option>
                        </select>
                    </div>
                    <div className="export-container">
                        <button onClick={exportToExcel} className="export-button">
                            Export Excel
                        </button>
                    </div>
                </div>
            </div>

            <div className="client-table">
                <table>
                    <thead>
                    <tr>
                    <th>Name</th>
                        <th>Account Number</th>
                        <th>Mobile Number</th>
                        <th>National ID/Passport</th>
                        <th>Status</th>
                        <th>Branch</th>
                        <th>Loan Officer</th>
                    </tr>
                    </thead>
                    <tbody>
                    {currentPageData && currentPageData.length > 0 ? (
                        currentPageData.map((client) => (
                            <tr key={client.id} onClick={() => onRowClick(client)}>
                                <td>{client.displayName}</td>
                                <td>{client.accountNo}</td>
                                <td>{client.mobileNo}</td>
                                <td>{client.externalId}</td>
                                <td>
                                    <span className={`status-badge ${getStatusClass(client.status.value)}`}>
                                        {client.status.value}
                                    </span>
                                </td>
                                <td>{client.officeName}</td>
                                <td>{client.staffName}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="7">No clients found</td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="pagination-button"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                    >
                        Start
                    </button>
                    <button
                        className="pagination-button"
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button
                        className="pagination-button"
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                    <button
                        className="pagination-button"
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

export default Clients;
