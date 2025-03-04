import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import './BulkLoanReassignment.css';
import DatePicker from "react-datepicker";
import {NotificationContext} from "../../../../../context/NotificationContext";

const BulkLoanReassignment = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const navigate = useNavigate();

    const [offices, setOffices] = useState([]);
    const [loanOfficers, setLoanOfficers] = useState([]);
    const [fromLoanOfficer, setFromLoanOfficer] = useState('');
    const [toLoanOfficer, setToLoanOfficer] = useState('');
    const [selectedOffice, setSelectedOffice] = useState('');
    const [assignmentDate, setAssignmentDate] = useState(getDefaultDate());
    const [clientLoans, setClientLoans] = useState([]);
    const [groupLoans, setGroupLoans] = useState([]);
    const [savingsAccounts, setSavingsAccounts] = useState([]);
    const [isFormValid, setIsFormValid] = useState(false);

    const [activeTab, setActiveTab] = useState('clientLoans');
    const [clientPage, setClientPage] = useState(1);
    const [clientItemsPerPage, setClientItemsPerPage] = useState(10);
    const [groupPage, setGroupPage] = useState(1);
    const [groupItemsPerPage, setGroupItemsPerPage] = useState(10);
    const [savingsPage, setSavingsPage] = useState(1);
    const [savingsItemsPerPage, setSavingsItemsPerPage] = useState(10);

    const [selectedClientLoans, setSelectedClientLoans] = useState([]);
    const [selectedGroupLoans, setSelectedGroupLoans] = useState([]);
    const [selectedSavingsAccounts, setSelectedSavingsAccounts] = useState([]);
    const [selectedClientIds, setSelectedClientIds] = useState([]);

    const [reassignmentType, setReassignmentType] = useState('client');
    const [selectAllClients, setSelectAllClients] = useState(false);
    const [groupedClientAccounts, setGroupedClientAccounts] = useState([]);

    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchOffices();
    }, []);

    useEffect(() => {
        const hasSelectedAccounts =
            (reassignmentType === 'client' && (selectedClientLoans.length > 0 || selectedSavingsAccounts.length > 0)) ||
            (reassignmentType === 'loans' && (selectedClientLoans.length > 0 || selectedGroupLoans.length > 0)) ||
            (reassignmentType === 'savings' && selectedSavingsAccounts.length > 0);

        setIsFormValid(
            selectedOffice &&
            fromLoanOfficer &&
            toLoanOfficer &&
            assignmentDate &&
            hasSelectedAccounts
        );
    }, [selectedOffice, fromLoanOfficer, toLoanOfficer, assignmentDate, reassignmentType, selectedClientLoans, selectedGroupLoans, selectedSavingsAccounts]);

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

    const fetchLoanOfficers = async (officeId) => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/staff?officeId=${officeId}`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setLoanOfficers(response.data || []);
        } catch (error) {
            console.error('Error fetching loan officers:', error);
        } finally {
            stopLoading();
        }
    };

    const fetchSavingsAccounts = async (officerId) => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts`, {  // Removed officerId from URL
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });

            const allSavingsAccounts = response.data.pageItems || [];
            // console.log(`Total savings accounts fetched:`, allSavingsAccounts.length);

            setSavingsAccounts(allSavingsAccounts);
            return allSavingsAccounts;
        } catch (error) {
            console.error('Error fetching savings accounts:', error);
            return [];
        } finally {
            stopLoading();
        }
    };

    const fetchLoans = async (officerId) => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/loans`, {  // Removed officerId from URL
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });

            const allLoans = response.data.pageItems || [];
            // console.log(`Total loans fetched:`, allLoans.length);

            setClientLoans(allLoans.filter(loan => loan.loanType?.value === 'Individual'));
            setGroupLoans(allLoans.filter(loan => loan.loanType?.value === 'Group'));

            return allLoans;
        } catch (error) {
            console.error('Error fetching loans:', error);
            return [];
        } finally {
            stopLoading();
        }
    };

    const handleOfficeChange = (e) => {
        const selectedOfficeId = e.target.value;
        setSelectedOffice(selectedOfficeId);
        setLoanOfficers([]);
        setFromLoanOfficer('');
        setToLoanOfficer('');
        setClientLoans([]);
        setGroupLoans([]);
        if (selectedOfficeId) {
            fetchLoanOfficers(selectedOfficeId);
        }
    };

    const fetchAndGroupAccounts = async (officerId) => {
        const savingsAccounts = await fetchSavingsAccounts(officerId);
        const loans = await fetchLoans(officerId);

        const groupedClients = {};

        savingsAccounts.forEach((account) => {
            const isAssignedToOfficer = account.fieldOfficerId === Number(officerId);

            if (isAssignedToOfficer || !groupedClients[account.clientId]) {
                if (!groupedClients[account.clientId]) {
                    groupedClients[account.clientId] = {
                        clientId: account.clientId,
                        clientName: account.clientName,
                        savingsAccounts: 0,
                        loanAccounts: 0,
                        savingsAccountIds: [],
                        loanAccountIds: [],
                        unassignedSavings: 0,
                        savingsAssignedToOthers: 0,
                        unassignedLoans: 0,
                        loansAssignedToOthers: 0,
                    };
                }

                if (!account.fieldOfficerId) {
                    groupedClients[account.clientId].unassignedSavings += 1;
                    groupedClients[account.clientId].savingsAccountIds.push(account.id);
                } else if (account.fieldOfficerId !== Number(officerId)) {
                    groupedClients[account.clientId].savingsAssignedToOthers += 1;
                    groupedClients[account.clientId].savingsAccountIds.push(account.id);
                } else {
                    groupedClients[account.clientId].savingsAccounts += 1;
                    groupedClients[account.clientId].savingsAccountIds.push(account.id);
                }
            }
        });

        loans.forEach((loan) => {
            const isAssignedToOfficer = loan.loanOfficerId === Number(officerId);

            if (isAssignedToOfficer || groupedClients[loan.clientId]) {
                if (!groupedClients[loan.clientId]) {
                    groupedClients[loan.clientId] = {
                        clientId: loan.clientId,
                        clientName: loan.clientName,
                        savingsAccounts: 0,
                        loanAccounts: 0,
                        savingsAccountIds: [],
                        loanAccountIds: [],
                        unassignedSavings: 0,
                        savingsAssignedToOthers: 0,
                        unassignedLoans: 0,
                        loansAssignedToOthers: 0,
                    };
                }

                if (!loan.loanOfficerId) {
                    groupedClients[loan.clientId].unassignedLoans += 1;
                    groupedClients[loan.clientId].loanAccountIds.push(loan.id);
                } else if (loan.loanOfficerId !== Number(officerId)) {
                    groupedClients[loan.clientId].loansAssignedToOthers += 1;
                    groupedClients[loan.clientId].loanAccountIds.push(loan.id);
                } else {
                    groupedClients[loan.clientId].loanAccounts += 1;
                    groupedClients[loan.clientId].loanAccountIds.push(loan.id);
                }
            }
        });

        const groupedData = Object.values(groupedClients).filter(client =>
            client.savingsAccounts > 0 || client.loanAccounts > 0
        );

        setGroupedClientAccounts(groupedData);
    };

    const handleFromLoanOfficerChange = (e) => {
        const officerId = e.target.value;
        setFromLoanOfficer(officerId);
        setToLoanOfficer('');
        setClientLoans([]);
        setGroupLoans([]);
        if (officerId) {
            console.log(officerId);
            fetchAndGroupAccounts(officerId);
        }
    };

    const handleCancel = () => {
        navigate('/organization');
    };

    const handleSubmit = async () => {
        startLoading();
        try {
            const formattedAssignmentDate = new Date(assignmentDate).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            });

            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                'Content-Type': 'application/json',
            };

            for (const clientId of selectedClientIds) {
                const clientPayload = { staffId: toLoanOfficer };
                await axios.post(
                    `${API_CONFIG.proxy}/fineract-provider/api/v1/clients/${clientId}?command=assignStaff`,
                    clientPayload,
                    {headers}
                );
            }

            for (const loanId of [...selectedClientLoans, ...selectedGroupLoans]) {
                const loanPayload = {
                    fromLoanOfficerId: fromLoanOfficer || null,
                    toLoanOfficerId: toLoanOfficer,
                    assignmentDate: formattedAssignmentDate,
                    locale: 'en',
                    dateFormat: 'dd MMMM yyyy',
                };

                await axios.post(
                    `${API_CONFIG.proxy}/fineract-provider/api/v1/loans/${loanId}?command=assignLoanOfficer`,
                    loanPayload,
                    {headers}
                );
            }

            for (const savingsId of selectedSavingsAccounts) {
                const savingsPayload = {
                    fromSavingsOfficerId: fromLoanOfficer || null,
                    toSavingsOfficerId: toLoanOfficer,
                    assignmentDate: formattedAssignmentDate,
                    locale: 'en',
                    dateFormat: 'dd MMMM yyyy',
                };

                const unassignedSavingsPayload = {
                    fromSavingsOfficerId: null,
                    toSavingsOfficerId: toLoanOfficer,
                    assignmentDate: formattedAssignmentDate,
                    locale: 'en',
                    dateFormat: 'dd MMMM yyyy',
                };

                try {
                    await axios.post(
                        `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/${savingsId}?command=assignSavingsOfficer`,
                        savingsPayload,
                        {headers}
                    );
                } catch (error) {
                    console.warn(`Failed to assign savings account ${savingsId}. Checking if unassigned...`);

                    const { data: account } = await axios.get(
                        `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/${savingsId}`,
                        {headers}
                    );

                    if (!account.fieldOfficerId) {
                        // Try direct assignment if the account is unassigned
                        try {
                            await axios.post(
                                `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/${savingsId}?command=assignSavingsOfficer`,
                                unassignedSavingsPayload,
                                {headers}
                            );
                            // console.log(`Direct assignment successful for savings account ${savingsId}`);
                        } catch (directAssignError) {
                            console.error(`Direct assignment failed for unassigned savings account ${savingsId}:`, directAssignError);
                        }
                    } else {
                        // Proceed with unassigning and reassigning
                        const unassignPayload = {
                            locale: 'en',
                            dateFormat: 'dd MMMM yyyy',
                            unassignedDate: formattedAssignmentDate,
                        };

                        try {
                            await axios.post(
                                `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/${savingsId}?command=unassignSavingsOfficer`,
                                unassignPayload,
                                {headers}
                            );

                            await axios.post(
                                `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/${savingsId}?command=assignSavingsOfficer`,
                                unassignedSavingsPayload,
                                {headers}
                            );

                            // console.log(`Successfully unassigned and reassigned savings account ${savingsId}`);
                        } catch (unassignError) {
                            console.error(`Failed to unassign and reassign savings account ${savingsId}:`, unassignError);
                        }
                    }
                }
            }

            showNotification('Bulk reassignment successful!', 'success');
            navigate('/organization');
        } catch (error) {
            console.error('Error submitting reassignment:', error);
            showNotification('Failed to reassign accounts. Please try again!', 'error');
        } finally {
            stopLoading();
        }
    };

    const handleClientItemsPerPageChange = (e) => {
        setClientItemsPerPage(parseInt(e.target.value, 10));
        setClientPage(1);
    };

    const handleGroupItemsPerPageChange = (e) => {
        setGroupItemsPerPage(parseInt(e.target.value, 10));
        setGroupPage(1);
    };

    const getPaginatedItems = (items, page, itemsPerPage) => {
        const startIndex = (page - 1) * itemsPerPage;
        return items.slice(startIndex, startIndex + itemsPerPage);
    };

    function getDefaultDate() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }

    const handleSelectAllGroupLoans = (e) => {
        if (e.target.checked) {
            setSelectedGroupLoans(groupLoans.map((loan) => loan.id));
        } else {
            setSelectedGroupLoans([]);
        }
    };

    const handleGroupLoanSelect = (loanId) => {
        setSelectedGroupLoans((prev) =>
            prev.includes(loanId) ? prev.filter((id) => id !== loanId) : [...prev, loanId]
        );
    };

    const handleSelectAllClients = (e) => {
        if (e.target.checked) {
            setSelectedClientLoans(groupedClientAccounts.flatMap(client => client.loanAccountIds));
            setSelectedSavingsAccounts(groupedClientAccounts.flatMap(client => client.savingsAccountIds));
            setSelectedClientIds(groupedClientAccounts.map(client => client.clientId));
        } else {
            setSelectedClientLoans([]);
            setSelectedSavingsAccounts([]);
            setSelectedClientIds([]);
        }
    };

    const handleClientSelect = (clientId) => {
        const client = groupedClientAccounts.find(client => client.clientId === clientId);
        const isSelected = selectedClientIds.includes(clientId);

        if (isSelected) {
            // Deselect client and their accounts
            setSelectedClientLoans(prevLoans =>
                prevLoans.filter(id => !client.loanAccountIds.includes(id))
            );
            setSelectedSavingsAccounts(prevSavings =>
                prevSavings.filter(id => !client.savingsAccountIds.includes(id))
            );
            setSelectedClientIds(prevClientIds =>
                prevClientIds.filter(id => id !== clientId)
            );
        } else {
            // Select client and their accounts
            setSelectedClientLoans(prevLoans =>
                [...prevLoans, ...client.loanAccountIds]
            );
            setSelectedSavingsAccounts(prevSavings =>
                [...prevSavings, ...client.savingsAccountIds]
            );
            setSelectedClientIds(prevClientIds =>
                [...prevClientIds, clientId]
            );
        }
    };

    useEffect(() => {
        const clientSelectAllCheckbox = document.getElementById('select-all-clients');
        if (clientSelectAllCheckbox) {
            const totalClientLoans = groupedClientAccounts.flatMap(client => client.loanAccountIds);
            const totalClientSavings = groupedClientAccounts.flatMap(client => client.savingsAccountIds);

            clientSelectAllCheckbox.indeterminate =
                (selectedClientLoans.length > 0 && selectedClientLoans.length < totalClientLoans.length) ||
                (selectedSavingsAccounts.length > 0 && selectedSavingsAccounts.length < totalClientSavings.length);
        }
    }, [selectedClientLoans, selectedSavingsAccounts, groupedClientAccounts]);

    useEffect(() => {
        if (reassignmentType === 'client') {
            setSelectAllClients(true);
            setActiveTab('clientLoansSavings');
            setSelectedClientIds(groupedClientAccounts.map(client => client.clientId));
            setSelectedClientLoans(groupedClientAccounts.flatMap(client => client.loanAccountIds));
            setSelectedSavingsAccounts(groupedClientAccounts.flatMap(client => client.savingsAccountIds));
        } else if (reassignmentType === 'group') {
            setActiveTab('groupLoans')
        }
    }, [reassignmentType, groupedClientAccounts]);

    const handleConfirm = () => {
        setShowModal(false);
        handleSubmit();
    };

    return (
        <div className="bulk-loan-reassignment-page neighbor-element">
            <h2 className="page-heading">
                <Link to="/organization" className="breadcrumb-link">Organization</Link> . Bulk Loan Reassignment
            </h2>
            <div className="bulk-loan-reassignment-form-container">
                <div className="bulk-loan-reassignment-field">
                    <label htmlFor="officeSelect" className="bulk-loan-reassignment-label">Office <span>*</span></label>
                    <select
                        id="officeSelect"
                        value={selectedOffice}
                        onChange={handleOfficeChange}
                        className="bulk-loan-reassignment-select"
                    >
                        <option value="">Select Office </option>
                        {offices.map((office) => (
                            <option key={office.id} value={office.id}>
                                {office.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="staged-form-row">
                    <div className="bulk-loan-reassignment-field">
                        <label htmlFor="fromLoanOfficerSelect" className="bulk-loan-reassignment-label">From Loan
                            Officer <span>*</span></label>
                        <select
                            id="fromLoanOfficerSelect"
                            value={fromLoanOfficer}
                            onChange={handleFromLoanOfficerChange}
                            className="bulk-loan-reassignment-select"
                            disabled={!loanOfficers.length}
                        >
                            <option value="">Select From Loan Officer</option>
                            {loanOfficers.map((officer) => (
                                <option key={officer.id} value={officer.id}>
                                    {officer.displayName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="bulk-loan-reassignment-field">
                        <label htmlFor="toLoanOfficerSelect" className="bulk-loan-reassignment-label">To Loan
                            Officer <span>*</span></label>
                        <select
                            id="toLoanOfficerSelect"
                            value={toLoanOfficer}
                            onChange={(e) => setToLoanOfficer(e.target.value)}
                            className="bulk-loan-reassignment-select"
                            disabled={!fromLoanOfficer}
                        >
                            <option value="">Select To Loan Officer</option>
                            {loanOfficers
                                .filter((officer) => officer.id !== parseInt(fromLoanOfficer))
                                .map((officer) => (
                                    <option key={officer.id} value={officer.id}>
                                        {officer.displayName}
                                    </option>
                                ))}
                        </select>
                    </div>
                </div>

                <div className="bulk-loan-reassignment-field">
                    <label htmlFor="assignmentDate" className="bulk-loan-reassignment-label">Assignment
                        Date <span>*</span></label>
                    <DatePicker
                        id="assignmentDate"
                        selected={assignmentDate ? new Date(assignmentDate) : null}
                        onChange={(date) => setAssignmentDate(date.toISOString().split('T')[0])}
                        maxDate={new Date()}
                        placeholderText="Select assignment date"
                        dateFormat="dd MMMM yyyy"
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        className="bulk-loan-reassignment-input"
                    />
                </div>

                {fromLoanOfficer && (
                    <div className="bulk-loan-reassignment-field">
                        <label className="bulk-loan-reassignment-label">Reassignment Type</label>
                        <div className="checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={reassignmentType === 'client'}
                                    onChange={() => setReassignmentType('client')}
                                />
                                Client Reassignment (Loans & Savings)
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={reassignmentType === 'group'}
                                    onChange={() => setReassignmentType('group')}
                                />
                                Group Reassignment (Loans Only)
                            </label>
                        </div>
                    </div>
                )}

                {fromLoanOfficer && reassignmentType === 'client' && (
                    <div className="bulk-loan-reassignment-field">
                        <label>
                            <input
                                type="checkbox"
                                checked={selectAllClients}
                                onChange={(e) => {
                                    setSelectAllClients(e.target.checked);
                                    if (e.target.checked) {
                                        setSelectedClientLoans(clientLoans.map((loan) => loan.id));
                                        setSelectedSavingsAccounts(savingsAccounts.map((savings) => savings.id));
                                    } else {
                                        setSelectedClientLoans([]);
                                        setSelectedSavingsAccounts([]);
                                    }
                                }}
                            />
                            Select All Clients
                        </label>
                    </div>
                )}

                <div className="bulk-loan-reassignment-actions">
                    <button
                        className="bulk-loan-reassignment-cancel-btn"
                        onClick={handleCancel}
                    >
                        Cancel
                    </button>
                    <button
                        className="bulk-loan-reassignment-submit-btn"
                        onClick={() => setShowModal(true)}
                        disabled={!isFormValid}
                    >
                        Submit
                    </button>
                </div>
            </div>
            {fromLoanOfficer && reassignmentType && (
                <div className="tabs-container" style={{ marginTop: '40px' }}>
                    {reassignmentType === 'client' && (
                        <button
                            className={`tab-button ${activeTab === 'clientLoansSavings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('clientLoansSavings')}
                        >
                            Client Loans & Savings
                        </button>
                    )}
                    {reassignmentType === 'group' && (
                        <button
                            className={`tab-button ${activeTab === 'groupLoans' ? 'active' : ''}`}
                            onClick={() => setActiveTab('groupLoans')}
                        >
                            Group Loans
                        </button>
                    )}
                </div>
            )}
            <div className="loan-tables-container">
                {fromLoanOfficer && activeTab === 'clientLoansSavings' && (
                    <div className="loan-table-container">
                        <h3>Client Loans</h3>
                        <table className="loan-table">
                            <thead>
                            <tr>
                                <th>
                                    <input
                                        id="select-all-client-loans"
                                        type="checkbox"
                                        onChange={handleSelectAllClients}
                                        checked={
                                            groupedClientAccounts.length > 0 &&
                                            selectedClientLoans.length === groupedClientAccounts.flatMap(client => client.loanAccountIds).length &&
                                            selectedSavingsAccounts.length === groupedClientAccounts.flatMap(client => client.savingsAccountIds).length
                                        }
                                    />
                                </th>
                                <th>Client Name</th>
                                <th>Number of Loans Accounts</th>
                                <th>Loans Unassigned</th>
                                <th>Loans Assigned to Others</th>
                                <th>Number of Savings Accounts</th>
                                <th>Savings Accounts Unassigned</th>
                                <th>Savings Assigned to Others</th>
                            </tr>
                            </thead>
                            <tbody>
                            {groupedClientAccounts.length > 0 ? (
                                getPaginatedItems(groupedClientAccounts, clientPage, clientItemsPerPage).map((client) => (
                                    <tr key={client.clientId}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                onChange={() => handleClientSelect(client.clientId)}
                                                checked={
                                                    client.loanAccountIds.every(id => selectedClientLoans.includes(id)) &&
                                                    client.savingsAccountIds.every(id => selectedSavingsAccounts.includes(id))
                                                }
                                            />
                                        </td>
                                        <td>{client.clientName}</td>
                                        <td>{client.loanAccounts}</td>
                                        <td>{client.unassignedLoans}</td>
                                        <td>{client.loansAssignedToOthers}</td>
                                        <td>{client.savingsAccounts}</td>
                                        <td>{client.unassignedSavings}</td>
                                        <td>{client.savingsAssignedToOthers}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td className={'no-data'} colSpan="8" style={{textAlign: 'center'}}>No data
                                        available
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                        <div className="pagination">
                            <label>
                                Items per page:
                                <select
                                    value={clientItemsPerPage}
                                    onChange={handleClientItemsPerPageChange}
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </label>
                            <div className="pagination">
                                <button
                                    onClick={() => setClientPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={clientPage === 1}
                                >
                                    Previous
                                </button>
                                <span>Page {clientPage} of {Math.ceil(groupedClientAccounts.length / clientItemsPerPage)}</span>
                                <button
                                    onClick={() =>
                                        setClientPage((prev) =>
                                            Math.min(prev + 1, Math.ceil(groupedClientAccounts.length / clientItemsPerPage))
                                        )
                                    }
                                    disabled={clientPage === Math.ceil(groupedClientAccounts.length / clientItemsPerPage)}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {fromLoanOfficer && activeTab === 'groupLoans' && (
                    <div className="loan-table-container">
                        <h3>Group Loans</h3>
                        <table className="loan-table">
                            <thead>
                            <tr>
                                <th>
                                    <input
                                        id="select-all-group-loans"
                                        type="checkbox"
                                        onChange={handleSelectAllGroupLoans}
                                        checked={groupLoans.length > 0 && selectedGroupLoans.length === groupLoans.length}
                                    />
                                </th>
                                <th>Account No</th>
                                <th>Group Name</th>
                                <th>Principal Amount</th>
                                <th>Total Expected Payment</th>
                                <th>Currency</th>
                            </tr>
                            </thead>
                            <tbody>
                            {groupLoans.length > 0 ? (
                                getPaginatedItems(groupLoans, groupPage, groupItemsPerPage).map((loan) => (
                                    <tr key={loan.id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                onChange={() => handleGroupLoanSelect(loan.id)}
                                                checked={selectedGroupLoans.includes(loan.id)}
                                            />
                                        </td>
                                        <td>{loan.accountNo}</td>
                                        <td>{loan.groupName}</td>
                                        <td>
                                            {loan.principal !== null && loan.principal !== undefined
                                                ? loan.principal.toLocaleString()
                                                : ''}
                                        </td>
                                        <td>
                                            {loan.summary?.totalExpectedRepayment !== null && loan.summary?.totalExpectedRepayment !== undefined
                                                ? loan.summary.totalExpectedRepayment.toLocaleString()
                                                : ''}
                                        </td>
                                        <td>{loan.currency.code}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td className={'no-data'} colSpan="6" style={{textAlign: 'center'}}>No data available</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                        <div className="pagination">
                            <label>
                                Items per page:
                                <select
                                    value={groupItemsPerPage}
                                    onChange={handleGroupItemsPerPageChange}
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </label>
                            <div className="pagination">
                                <button
                                    onClick={() => setGroupPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={groupPage === 1}
                                >
                                    Previous
                                </button>
                                <span>Page {groupPage} of {Math.ceil(groupLoans.length / groupItemsPerPage)}</span>
                                <button
                                    onClick={() =>
                                        setGroupPage((prev) =>
                                            Math.min(prev + 1, Math.ceil(groupLoans.length / groupItemsPerPage))
                                        )
                                    }
                                    disabled={groupPage === Math.ceil(groupLoans.length / groupItemsPerPage)}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 className="modal-title">Warning</h2>
                        <p className="modal-body">
                            All accounts under the selected clients will be assigned the new officer,
                            including those assigned to other officers and those not assigned to any officer.
                            Proceed with caution!
                        </p>
                        <div className="modal-actions">
                            <button
                                className="modal-btn cancel-btn"
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="modal-btn confirm-btn"
                                onClick={handleConfirm}
                            >
                                Proceed
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BulkLoanReassignment;
