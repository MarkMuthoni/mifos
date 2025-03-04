import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import './ViewEmployees.css';

const ViewEmployees = () => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const [employees, setEmployees] = useState([]);
    const [offices, setOffices] = useState([]);
    const [selectedOffice, setSelectedOffice] = useState('');
    const [nameFilter, setNameFilter] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);

    useEffect(() => {
        fetchOffices();
        fetchEmployees();
    }, []);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredEmployees().length / pageSize));
    }, [employees, nameFilter, selectedOffice, pageSize]);

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

    const fetchEmployees = async () => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/staff?status=all`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setEmployees(response.data || []);
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            stopLoading();
        }
    };

    const handleOfficeChange = (e) => {
        setSelectedOffice(e.target.value);
    };

    const filteredEmployees = () => {
        return employees.filter((employee) => {
            const matchesName = employee.displayName.toLowerCase().includes(nameFilter.toLowerCase());
            const matchesOffice = selectedOffice
                ? employee.officeId === Number(selectedOffice)
                : true;
            return matchesName && matchesOffice;
        });
    };

    const paginatedData = filteredEmployees().slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handleRowClick = async (employee) => {
        startLoading();
        try {
            const response = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/staff/${employee.id}?template=true`,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            setSelectedEmployee(response.data);
            setIsEmployeeModalOpen(true);
        } catch (error) {
            console.error('Error fetching employee details:', error);
        } finally {
            stopLoading();
        }
    };

    const handleEmployeeModalSubmit = async (updatedEmployee) => {
        startLoading();
        try {
            const response = await axios.put(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/staff/${selectedEmployee.id}`,
                updatedEmployee,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            // console.log('Employee updated successfully:', response.data);
            setIsEmployeeModalOpen(false);
            fetchEmployees();
        } catch (error) {
            console.error('Error updating employee:', error);
        } finally {
            stopLoading();
        }
    };

    const EmployeeModal = ({ isOpen, onClose, employee, onSubmit, offices }) => {
        const [formData, setFormData] = useState({});
        const [isChanged, setIsChanged] = useState(false);

        useEffect(() => {
            if (employee) {
                const initialData = {
                    officeId: employee.officeId || '',
                    firstname: employee.firstname || '',
                    lastname: employee.lastname || '',
                    isLoanOfficer: employee.isLoanOfficer || false,
                    mobileNo: employee.mobileNo || '',
                    isActive: employee.isActive || false,
                    joiningDate: employee.joiningDate
                        ? new Date(employee.joiningDate[0], employee.joiningDate[1] - 1, employee.joiningDate[2])
                            .toISOString()
                            .split('T')[0]
                        : '',
                };
                setFormData(initialData);
                setIsChanged(false);
            }
        }, [employee]);

        const handleFieldChange = (field, value) => {
            setFormData((prev) => {
                const updatedData = { ...prev, [field]: value };
                setIsChanged(JSON.stringify(updatedData) !== JSON.stringify(employee));
                return updatedData;
            });
        };

        const handleSubmit = () => {
            const payload = {
                ...formData,
                dateFormat: 'dd MMMM yyyy',
                locale: 'en',
                joiningDate: new Date(formData.joiningDate).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                }),
            };
            onSubmit(payload);
        };

        if (!isOpen) return null;

        return (
            <div className="edit-modal-overlay">
                <div className="edit-modal-content">
                    <h3>Edit Employee Details</h3>
                    <div className="staged-form-field">
                        <label>
                            Office <span className="required">*</span>
                        </label>
                        <select
                            value={formData.officeId}
                            onChange={(e) => handleFieldChange('officeId', e.target.value)}
                            className="staged-form-select"
                        >
                            <option value="">Select Office</option>
                            {offices.map((o) => (
                                <option key={o.id} value={o.id}>
                                    {o.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="staged-form-row">
                        <div className="staged-form-field">
                            <label>
                                First Name <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.firstname}
                                onChange={(e) => handleFieldChange('firstname', e.target.value)}
                                className="staged-form-input"
                            />
                        </div>
                        <div className="staged-form-field">
                            <label>
                                Last Name <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.lastname}
                                onChange={(e) => handleFieldChange('lastname', e.target.value)}
                                className="staged-form-input"
                            />
                        </div>
                    </div>
                    <div className="staged-form-field">
                        <label>
                        <input
                            type="checkbox"
                            checked={formData.isLoanOfficer}
                            onChange={(e) => handleFieldChange('isLoanOfficer', e.target.checked)}
                        />Is Loan Officer</label>
                    </div>
                    <div className="staged-form-field">
                        <label>Mobile Number</label>
                        <input
                            type="text"
                            value={formData.mobileNo}
                            onChange={(e) => handleFieldChange('mobileNo', e.target.value)}
                            className="staged-form-input"
                        />
                    </div>
                    <div className="staged-form-field">
                        <label>
                        <input
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) => handleFieldChange('isActive', e.target.checked)}
                        />Active</label>
                    </div>
                    <div className="staged-form-field">
                        <label>
                            Joining Date <span className="required">*</span>
                        </label>
                        <input
                            type="date"
                            value={formData.joiningDate}
                            onChange={(e) => handleFieldChange('joiningDate', e.target.value)}
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
                            disabled={
                                !isChanged ||
                                !formData.officeId ||
                                !formData.firstname ||
                                !formData.lastname ||
                                !formData.joiningDate
                            }
                        >
                            Submit
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="view-employees">
            <div className="table-controls">
                <div className="filter-container">
                    <div className="filter-item">
                        <label htmlFor="officeFilter" className="office-filter-label">Filter by Office:</label>
                        <select
                            id="officeFilter"
                            value={selectedOffice}
                            onChange={handleOfficeChange}
                            className="office-filter-select"
                        >
                            <option value="">All Offices</option>
                            {offices.map((office) => (
                                <option key={office.id} value={office.id}>
                                    {office.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-item">
                        <label htmlFor="nameFilter" className="name-filter-label">Filter by Name:</label>
                        <input
                            type="text"
                            id="nameFilter"
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                            placeholder="Enter employee name..."
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
            <table className="employees-table">
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Loan Officer</th>
                    <th>Office</th>
                    <th>Status</th>
                    <th>Member Since</th>
                </tr>
                </thead>
                <tbody>
                {paginatedData.length > 0 ? (
                    paginatedData.map((employee) => (
                        <tr
                            key={employee.id}
                            onClick={() => handleRowClick(employee)}
                            className="clickable-row"
                        >
                            <td>{employee.displayName || ' '}</td>
                            <td>{employee.isLoanOfficer ? 'Yes' : 'No'}</td>
                            <td>{offices.find((office) => office.id === employee.officeId)?.name || ' '}</td>
                            <td>{employee.isActive ? 'Active' : 'Inactive'}</td>
                            <td>
                                {employee.joiningDate && employee.joiningDate.length === 3
                                    ? new Date(employee.joiningDate[0], employee.joiningDate[1] - 1, employee.joiningDate[2]).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })
                                    : 'N/A'}
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="5" className="no-data">No employees available.</td>
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

            <EmployeeModal
                isOpen={isEmployeeModalOpen}
                onClose={() => setIsEmployeeModalOpen(false)}
                employee={selectedEmployee}
                onSubmit={handleEmployeeModalSubmit}
                offices={offices}
            />
        </div>
    );
};

export default ViewEmployees;
