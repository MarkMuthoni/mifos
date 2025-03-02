import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../context/AuthContext';
import { useLoading } from '../../../context/LoadingContext';
import { API_CONFIG } from '../../../config';
import './ViewTemplates.css';

const ViewTemplates = () => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const [templates, setTemplates] = useState([]);
    const [filteredTemplates, setFilteredTemplates] = useState([]);
    const [filters, setFilters] = useState({ name: '' });
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/templates`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });

            // console.log(response.data);
            setTemplates(response.data);
            setFilteredTemplates(response.data);
            setTotalPages(Math.ceil(response.data.length / pageSize));
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            stopLoading();
        }
    };
    useEffect(() => {
        setTotalPages(Math.ceil(filteredTemplates.length / pageSize));
        setCurrentPage(1);
    }, [pageSize, filteredTemplates]);


    const handleFilterChange = (e) => {
        const { value } = e.target;
        setFilters({ name: value });
        const filtered = templates.filter(template =>
            template.name.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredTemplates(filtered);
        setTotalPages(Math.ceil(filtered.length / pageSize));
        setCurrentPage(1);
    };

    const paginateTemplates = (templates) => {
        const start = (currentPage - 1) * pageSize;
        return templates.slice(start, start + pageSize);
    };

    const handlePreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

    return (
        <div className="view-templates">
            <h3 className="view-templates-title">View Templates</h3>

            <div className="templates-controls">
                <div className="templates-filter">
                    <input
                        type="text"
                        placeholder="Filter by Name"
                        value={filters.name}
                        onChange={handleFilterChange}
                        className="templates-search-input"
                    />
                </div>

                <div className="templates-page-size-selector">
                    <label htmlFor="pageSize">Rows per page:</label>
                    <select
                        id="pageSize"
                        onChange={(e) => {
                            setPageSize(Number(e.target.value));
                        }}
                        value={pageSize}
                        className="templates-page-size-dropdown"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>

            </div>

            <table className="templates-table">
                <thead>
                <tr>
                    <th>Entity</th>
                    <th>Type</th>
                    <th>Name</th>
                </tr>
                </thead>
                <tbody>
                {filteredTemplates.length === 0 ? (
                    <tr>
                        <td colSpan="3" className="no-data-message">No templates found.</td>
                    </tr>
                ) : (
                    paginateTemplates(filteredTemplates).map((template) => (
                        <tr
                            key={template.id}
                            className="template-row"
                            onClick={() => console.log('Template ID:', template.id)}
                        >
                            <td>{template.entity}</td>
                            <td>{template.type}</td>
                            <td>{template.name}</td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>

            {totalPages > 1 && (
                <div className="templates-pagination">
                    <button
                        className="templates-pagination-button"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                    >
                        Start
                    </button>
                    <button
                        className="templates-pagination-button"
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button
                        className="templates-pagination-button"
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                    <button
                        className="templates-pagination-button"
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

export default ViewTemplates;
