import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../../context/AuthContext';
import { useLoading } from '../../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../../config';
import './ViewTaxComponents.css';

const ViewTaxComponents = () => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const [taxComponents, setTaxComponents] = useState([]);
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [nameFilter, setNameFilter] = useState('');
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchTaxComponents();
    }, []);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredComponents().length / pageSize));
    }, [taxComponents, nameFilter, pageSize]);

    const fetchTaxComponents = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/taxes/component`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setTaxComponents(response.data || []);
        } catch (error) {
            console.error('Error fetching tax components:', error);
        } finally {
            stopLoading();
        }
    };

    const handleRowClick = async (component) => {
        startLoading();
        try {
            const response = await axios.get(
                `/fineract-provider/api/v1/taxes/component/${component.id}`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            setSelectedComponent(response.data);
            setIsModalOpen(true);
        } catch (error) {
            console.error('Error fetching tax component details:', error);
        } finally {
            stopLoading();
        }
    };

    const handleModalSubmit = async (updatedComponent) => {
        startLoading();
        try {
            const payload = {
                name: updatedComponent.name,
                percentage: updatedComponent.percentage,
                startDate: new Date(updatedComponent.startDate).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                }),
                dateFormat: 'dd MMMM yyyy',
                locale: 'en',
            };
            await axios.put(
                `/fineract-provider/api/v1/taxes/component/${selectedComponent.id}`,
                payload,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            // console.log('Tax component updated successfully.');
            setIsModalOpen(false);
            fetchTaxComponents();
        } catch (error) {
            console.error('Error updating tax component:', error);
        } finally {
            stopLoading();
        }
    };

    const filteredComponents = () =>
        taxComponents.filter((component) =>
            component.name?.toLowerCase().includes(nameFilter.toLowerCase())
        );

    const paginatedData = filteredComponents().slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const formatDate = (dateArray) => {
        if (!dateArray || dateArray.length !== 3) return '';
        const [year, month, day] = dateArray;
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const TaxComponentModal = ({ isOpen, component, onSubmit, onClose }) => {
        const [formData, setFormData] = useState({});
        const [isChanged, setIsChanged] = useState(false);

        useEffect(() => {
            if (component) {
                const initialData = {
                    name: component.name || '',
                    percentage: component.percentage || 0,
                    startDate: component.startDate
                        ? new Date(
                            component.startDate[0],
                            component.startDate[1] - 1,
                            component.startDate[2]
                        )
                            .toISOString()
                            .split('T')[0]
                        : '',
                };
                setFormData(initialData);
                setIsChanged(false);
            }
        }, [component]);

        const handleFieldChange = (field, value) => {
            setFormData((prev) => {
                const updatedData = { ...prev, [field]: value };
                setIsChanged(JSON.stringify(updatedData) !== JSON.stringify(component));
                return updatedData;
            });
        };

        const handleSubmit = () => {
            onSubmit(formData);
        };

        if (!isOpen) return null;

        return (
            <div className="edit-modal-overlay">
                <div className="edit-modal-content">
                    <h3 className={"staged-form-title"}>Edit Tax Component</h3>
                    <div className="staged-form-field">
                        <label>Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleFieldChange('name', e.target.value)}
                            className="staged-form-input"
                        />
                    </div>
                    <div className="staged-form-field">
                        <label>Percentage</label>
                        <input
                            type="number"
                            value={formData.percentage}
                            onChange={(e) => handleFieldChange('percentage', e.target.value)}
                            className="staged-form-input"
                        />
                    </div>
                    <div className="staged-form-field">
                        <label>Start Date</label>
                        <input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => handleFieldChange('startDate', e.target.value)}
                            className="staged-form-input"
                        />
                    </div>
                    <div className="modal-actions">
                        <button className="modal-cancel-button" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            className="modal-submit-button"
                            onClick={handleSubmit}
                            disabled={!isChanged}
                        >
                            Submit
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="view-tax-components">
            <div className="table-controls">
                <div className="filter-container">
                    <div className="filter-item">
                        <label htmlFor="nameFilter">Filter by Name:</label>
                        <input
                            type="text"
                            id="nameFilter"
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                            placeholder="Search by name..."
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
            <table className="tax-components-table">
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Percentage %</th>
                    <th>Start Date</th>
                </tr>
                </thead>
                <tbody>
                {paginatedData.length > 0 ? (
                    paginatedData.map((component) => (
                        <tr
                            key={component.id}
                            onClick={() => handleRowClick(component)}
                            className="clickable-row"
                        >
                            <td>{component.name}</td>
                            <td>{component.percentage || '0'}%</td>
                            <td>{formatDate(component.startDate)}</td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="3" className="no-data">
                            No tax components available.
                        </td>
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

            <TaxComponentModal
                isOpen={isModalOpen}
                component={selectedComponent}
                onSubmit={handleModalSubmit}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
};

export default ViewTaxComponents;
