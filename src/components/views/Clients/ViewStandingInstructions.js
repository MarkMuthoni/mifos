import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext';
import { useLoading } from '../../../context/LoadingContext';
import { API_CONFIG } from '../../../config';
import { FaEdit, FaTrash, FaEye } from 'react-icons/fa';

const ViewStandingInstructions = () => {
    const { clientId } = useParams();
    const [clientData, setClientData] = useState(null);
    const [standingInstructionsTemplate, setStandingInstructionsTemplate] = useState(null);
    const [standingInstructions, setStandingInstructions] = useState([]);
    const [filteredInstructions, setFilteredInstructions] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        searchQuery: '',
        instructionType: '',
        clientName: '',
    });
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();

    // Fetch client details
    useEffect(() => {
        const fetchClientData = async () => {
            startLoading();
            try {
                const headers = {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                };
                const response = await axios.get(`/fineract-provider/api/v1/clients/${clientId}`, { headers });
                setClientData(response.data);
            } catch (error) {
                console.error('Error fetching client data:', error);
            } finally {
                stopLoading();
            }
        };

        fetchClientData();
    }, []);

    useEffect(() => {
        const fetchStandingInstructionsTemplate = async () => {
            startLoading();
            try {
                const headers = {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                };
                const response = await axios.get(
                    `/fineract-provider/api/v1/standinginstructions/template?fromAccountType=2&fromClientId=${clientId}&fromOfficeId=${user.officeId}`,
                    { headers }
                );
                setStandingInstructionsTemplate(response.data);
            } catch (error) {
                console.error('Error fetching standing instructions template:', error);
            } finally {
                stopLoading();
            }
        };

        fetchStandingInstructionsTemplate();
    }, []);

    // Fetch standing instructions
    useEffect(() => {
        const fetchStandingInstructions = async () => {
            startLoading();
            try {
                const headers = {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                };
                const response = await axios.get(
                    `/fineract-provider/api/v1/standinginstructions?clientId=${clientId}`,
                    { headers }
                );
                setStandingInstructions(response.data.pageItems || []);
                setFilteredInstructions(response.data.pageItems || []);
            } catch (error) {
                console.error('Error fetching standing instructions:', error);
            } finally {
                stopLoading();
            }
        };

        fetchStandingInstructions();
    }, []);

    // Filter logic
    useEffect(() => {
        const filtered = standingInstructions.filter((instruction) => {
            const matchesQuery = instruction.name.toLowerCase().includes(filters.searchQuery.toLowerCase());
            const matchesType = filters.instructionType
                ? instruction.instructionType?.value === filters.instructionType
                : true;
            const matchesClient = filters.clientName
                ? instruction.fromClient?.displayName.toLowerCase().includes(filters.clientName.toLowerCase())
                : true;

            return matchesQuery && matchesType && matchesClient;
        });

        setFilteredInstructions(filtered);
        setTotalPages(Math.ceil(filtered.length / pageSize));
        setCurrentPage(1);
    }, [standingInstructions, filters, pageSize]);

    const currentPageData = filteredInstructions.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    // Pagination handlers
    const handlePreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    const handlePageSizeChange = (e) => setPageSize(Number(e.target.value));

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleBreadcrumbNavigation = () => {
        navigate("/clients", {
            state: {
                clientId: clientId,
                clientName: clientData?.displayName || "Client Details",
                preventDuplicate: true,
            },
        });
    };

    return (
        <div className="users-page-screen neighbor-element">
            <h2 className="users-page-head">
                <Link to="/dashboard" className="breadcrumb-link">Dashboard</Link>{' '}
                <span
                    className="breadcrumb-link"
                    onClick={handleBreadcrumbNavigation}
                >
                    . {clientData?.displayName || "Client Details"}
                </span>{' '}
                . View Standing Instructions
            </h2>

            <div className="table-controls">
                <div className="filters-container">
                    <div className="filter-group">
                        <label htmlFor="searchQuery" className="filter-label">Search by Instruction Name:</label>
                        <input
                            type="text"
                            id="searchQuery"
                            name="searchQuery"
                            placeholder="Enter instruction name"
                            className="filter-input"
                            value={filters.searchQuery}
                            onChange={handleFilterChange}
                        />
                    </div>

                    <div className="filter-group">
                        <label htmlFor="clientName" className="filter-label">Filter by Client Name:</label>
                        <input
                            type="text"
                            id="clientName"
                            name="clientName"
                            placeholder="Enter client name"
                            className="filter-input"
                            value={filters.clientName}
                            onChange={handleFilterChange}
                        />
                    </div>
                </div>
                <div className="filter-group">
                    <label htmlFor="pageSize" className="filter-label">Rows per page:</label>
                    <select
                        id="pageSize"
                        value={pageSize}
                        onChange={handlePageSizeChange}
                        className="filter-dropdown"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>

            <div className="client-table">
                <table>
                    <thead>
                    <tr>
                        <th>Client</th>
                        <th>From Account</th>
                        <th>Beneficiary</th>
                        <th>To Account</th>
                        <th>Amount</th>
                        <th>Validity</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {currentPageData && currentPageData.length > 0 ? (
                        currentPageData.map((instruction) => (
                            <tr key={instruction.id}>
                                <td>{instruction.fromClient.displayName}</td>
                                <td>{`${instruction.fromAccountType.value} - ${instruction.fromAccount.accountNo}`}</td>
                                <td>{instruction.toClient.displayName}</td>
                                <td>{`${instruction.toAccountType.value} - ${instruction.toAccount.accountNo}`}</td>
                                <td>
                                    {instruction.instructionType?.value || ''}
                                </td>
                                <td>
                                    {instruction.validFrom
                                        ? `From ${instruction.validFrom[2]} ${new Date(
                                            instruction.validFrom[0],
                                            instruction.validFrom[1] - 1
                                        ).toLocaleString('default', {month: 'long'})}, ${instruction.validFrom[0]}`
                                        : 'N/A'}
                                </td>
                                <td>
                                    <FaEye
                                        color="#0e158e"
                                        title="View"
                                        style={{marginRight: '20px', fontSize: '20px', cursor: 'pointer'}}
                                    />
                                    <FaEdit
                                        color="#3caa22"
                                        title="Edit"
                                        style={{fontSize: '20px', marginRight: '20px', cursor: 'pointer'}}
                                    />
                                    <FaTrash
                                        color="#d11a2a"
                                        title="Delete"
                                        style={{fontSize: '20px', cursor: 'pointer'}}
                                    />
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="7" className={"no-data"}>No instructions found</td>
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

export default ViewStandingInstructions;
