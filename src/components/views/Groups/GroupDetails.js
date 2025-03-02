import React, {useContext, useEffect, useState} from 'react';
import axios from 'axios';
import { API_CONFIG } from '../../../config';
import {AuthContext} from "../../../context/AuthContext";
import {useLoading} from "../../../context/LoadingContext";
import {FaEdit, FaStickyNote, FaTrash} from "react-icons/fa";
import DatePicker from "react-datepicker";
import Select from "react-select";
import {useNavigate} from "react-router-dom";
import {NotificationContext} from "../../../context/NotificationContext";

const GroupDetails = ({ groupId, onClose }) => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const navigate = useNavigate();
    const { showNotification } = useContext(NotificationContext);

    const [GroupImage, setGroupImage] = useState(null);
    const [groupDetails, setGroupDetails] = useState(null);
    const [activeTab, setActiveTab] = useState('general');

    const [notes, setNotes] = useState([]);
    const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [editingNoteId, setEditingNoteId] = useState(null);

    const [committeeMembers, setCommitteeMembers] = useState([]);
    const [clientOptions, setClientOptions] = useState([]);
    const [roleOptions, setRoleOptions] = useState([]);
    const [selectedClient, setSelectedClient] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [isCommitteeModalOpen, setIsCommitteeModalOpen] = useState(false);
    const [editingCommitteeMemberId, setEditingCommitteeMemberId] = useState(null);

    const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
    const [activationDate, setActivationDate] = useState(null);
    const [submissionDate, setSubmissionDate] = useState(null);

    const [editGroupData, setEditGroupData] = useState({
        name: '',
        staffId: '',
        submittedOnDate: null,
        activationDate: null,
        externalId: '',
    });
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [submittedDateLimit, setSubmittedDateLimit] = useState(null);
    const [activationDateLimit, setActivationDateLimit] = useState(null);
    const [editGroupStaffOptions, setEditGroupStaffOptions] = useState([]);

    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [clientMembers, setClientMembers] = useState([]);
    const [selectedClients, setSelectedClients] = useState([]);
    const [inheritLoanOfficer, setInheritLoanOfficer] = useState(false);
    const [destinationGroup, setDestinationGroup] = useState('');
    const [availableGroups, setAvailableGroups] = useState([]);

    const [allClients, setAllClients] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredClients, setFilteredClients] = useState([]);
    const [selectedClientIds, setSelectedClientIds] = useState([]);
    const [groupClients, setGroupClients] = useState([]);
    const [isAddClientsModalOpen, setIsAddClientsModalOpen] = useState(false);

    const [isAssignStaffModalOpen, setIsAssignStaffModalOpen] = useState(false);
    const [availableStaff, setAvailableStaff] = useState([]);
    const [selectedStaffId, setSelectedStaffId] = useState('');

    const [isAttachMeetingModalOpen, setIsAttachMeetingModalOpen] = useState(false);
    const [meetingStartDate, setMeetingStartDate] = useState(null);
    const [isRepeating, setIsRepeating] = useState(false);
    const [meetingTypeId, setMeetingTypeId] = useState('');
    const [calendarTypeOptions, setCalendarTypeOptions] = useState([]);

    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    const [closureReasons, setClosureReasons] = useState([]);
    const [closedOnDate, setClosedOnDate] = useState(null);
    const [selectedClosureReason, setSelectedClosureReason] = useState('');

    useEffect(() => {
        if (groupDetails?.timeline?.submittedOnDate) {
            const [year, month, day] = groupDetails.timeline.submittedOnDate;
            setSubmissionDate(new Date(year, month - 1, day));
        }
    }, [groupDetails]);

    useEffect(() => {
        setGroupImage(process.env.PUBLIC_URL + 'Images/group.png');
    }, []);

    // General
    useEffect(() => {
        if (activeTab === 'general') {
            const fetchGeneralTabData = async () => {
                startLoading();
                try {
                    const headers = {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    };

                    // Fetch group details
                    const groupResponse = await axios.get(`/fineract-provider/api/v1/groups/${groupId}?associations=all`, { headers });
                    setGroupDetails(groupResponse.data);

                    // Fetch group summary counts
                    const summaryResponse = await axios.get(`/fineract-provider/api/v1/runreports/GroupSummaryCounts?R_groupId=${groupId}&genericResultSet=false`, { headers });
                    const summaryData = summaryResponse.data[0] || {};
                    setGroupDetails((prevDetails) => ({
                        ...prevDetails,
                        groupSummaryCounts: summaryData,
                    }));

                    // Fetch group accounts
                    const accountsResponse = await axios.get(`/fineract-provider/api/v1/groups/${groupId}/accounts`, { headers });
                    setGroupDetails((prevDetails) => ({
                        ...prevDetails,
                        groupAccounts: accountsResponse.data,
                    }));

                    // Fetch GSIM accounts
                    const gsimAccountsResponse = await axios.get(`/fineract-provider/api/v1/groups/${groupId}/gsimaccounts`, { headers });
                    setGroupDetails((prevDetails) => ({
                        ...prevDetails,
                        gsimAccounts: gsimAccountsResponse.data,
                    }));

                    // Fetch GLIM accounts
                    const glimAccountsResponse = await axios.get(`/fineract-provider/api/v1/groups/${groupId}/glimaccounts`, { headers });
                    setGroupDetails((prevDetails) => ({
                        ...prevDetails,
                        glimAccounts: glimAccountsResponse.data,
                    }));

                } catch (error) {
                    console.error('Error fetching client details:', error);
                } finally {
                    stopLoading();
                }
            };
            fetchGeneralTabData();
        }
    }, [activeTab, groupId]);

    useEffect(() => {
        if (activeTab === 'notes') {
            const fetchNotes = async () => {
                const headers = {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                };

                try {
                    const response = await axios.get(
                        `/fineract-provider/api/v1/groups/${groupId}/notes`,
                        { headers }
                    );
                    setNotes(response.data);
                } catch (error) {
                    console.error('Error fetching notes:', error);
                }
            };

            fetchNotes();
        }
    }, [activeTab, groupId]);

    useEffect(() => {
        if (activeTab === 'committee') {
            const fetchCommitteeData = async () => {
                startLoading();
                try {
                    const headers = {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    };

                    // Fetch group details with template data
                    const response = await axios.get(`/fineract-provider/api/v1/groups/${groupId}?associations=all&template=true`, { headers });
                    const groupData = response.data;

                    setClientOptions(groupData.staffOptions || []);
                    setRoleOptions(groupData.availableRoles || []);
                    setCommitteeMembers(groupData.committeeMembers || []);
                } catch (error) {
                    console.error('Error fetching committee data:', error);
                } finally {
                    stopLoading();
                }
            };

            fetchCommitteeData();
        }
    }, [activeTab, groupId]);

    const getStatusClass = (status) => {
        if (!status) return 'client-status-default';

        switch (status.toLowerCase()) {
            case 'active':
                return 'client-status-active';
            case 'inactive':
                return 'client-status-inactive';
            case 'pending':
                return 'client-status-pending';
            case 'closed':
                return 'client-status-closed';
            default:
                return 'client-status-default';
        }
    };

    const handleSaveNote = async () => {
        const headers = {
            Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
            'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
            'Content-Type': 'application/json',
        };

        const endpoint = editingNoteId
            ? `/fineract-provider/api/v1/groups/${groupId}/notes/${editingNoteId}`
            : `/fineract-provider/api/v1/groups/${groupId}/notes`;

        const method = editingNoteId ? 'put' : 'post';

        try {
            startLoading();
            await axios[method](endpoint, { note: newNote }, { headers });

            const updatedNotes = await axios.get(
                `/fineract-provider/api/v1/groups/${groupId}/notes`,
                { headers }
            );
            setNotes(updatedNotes.data);

            setNewNote('');
            setEditingNoteId(null);
            setIsNotesModalOpen(false);
        } catch (error) {
            console.error('Error saving note:', error);
        } finally {
            stopLoading();
        }
    };

    const handleDeleteNote = async (noteId) => {
        const confirmDelete = window.confirm('Are you sure you want to delete this note?');

        if (!confirmDelete) return;

        const headers = {
            Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
            'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
            'Content-Type': 'application/json',
        };

        try {
            startLoading();
            await axios.delete(
                `/fineract-provider/api/v1/groups/${groupId}/notes/${noteId}`,
                { headers }
            );

            const updatedNotes = await axios.get(
                `/fineract-provider/api/v1/groups/${groupId}/notes`,
                { headers }
            );
            setNotes(updatedNotes.data);
        } catch (error) {
            console.error('Error deleting note:', error);
        } finally {
            stopLoading();
        }
    };

    const handleEditNote = (note) => {
        setEditingNoteId(note.id);
        setNewNote(note.note);
        setIsNotesModalOpen(true);
    };

    const handleSaveCommitteeMember = async () => {
        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                'Content-Type': 'application/json',
            };

            if (editingCommitteeMemberId) {
                await axios.put(
                    `/fineract-provider/api/v1/groups/${groupId}/associations/${editingCommitteeMemberId}`,
                    { clientId: selectedClient, roleId: selectedRole },
                    { headers }
                );
            } else {
                await axios.post(`/fineract-provider/api/v1/groups/${groupId}/associations`, { clientId: selectedClient, roleId: selectedRole }, { headers });
            }

            const updatedResponse = await axios.get(`/fineract-provider/api/v1/groups/${groupId}?associations=all&template=true`, { headers });
            setCommitteeMembers(updatedResponse.data.committeeMembers || []);

            setSelectedClient('');
            setSelectedRole('');
            setEditingCommitteeMemberId(null);
            setIsCommitteeModalOpen(false);
        } catch (error) {
            console.error('Error saving committee member:', error);
        } finally {
            stopLoading();
        }
    };

    const handleDeleteCommitteeMember = async (memberId) => {
        const confirmDelete = window.confirm('Are you sure you want to delete this committee member?');

        if (!confirmDelete) return;

        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                'Content-Type': 'application/json',
            };

            await axios.delete(`/fineract-provider/api/v1/groups/${groupId}/associations/${memberId}`, { headers });

            const updatedResponse = await axios.get(`/fineract-provider/api/v1/groups/${groupId}?associations=all&template=true`, { headers });
            setCommitteeMembers(updatedResponse.data.committeeMembers || []);
        } catch (error) {
            console.error('Error deleting committee member:', error);
        } finally {
            stopLoading();
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <div className="general-tab">
                        {/* Performance History Section */}
                        <div className="general-section general-performance-history">
                            <h3 className="general-section-title">Group Details</h3>
                            <div className="general-details-columns">
                                <div className="general-details-column">
                                    <p><strong>Active
                                        Clients:</strong> {groupDetails?.groupSummaryCounts?.activeClients ?? '-'}</p>
                                    <p><strong>Active Client
                                        Loans:</strong> {groupDetails?.groupSummaryCounts?.activeClientLoans ?? '-'}</p>
                                    <p><strong>Active Client
                                        Borrowers:</strong> {groupDetails?.groupSummaryCounts?.activeClientBorrowers ?? '-'}
                                    </p>
                                    <p><strong>Overdue Client
                                        Loans:</strong> {groupDetails?.groupSummaryCounts?.overdueClientLoans ?? '-'}
                                    </p>
                                </div>

                                <div className="general-details-column">
                                    <p><strong>Active Group
                                        Loans:</strong> {groupDetails?.groupSummaryCounts?.activeGroupLoans ?? '-'}</p>
                                    <p><strong>Active Group
                                        Borrowers:</strong> {groupDetails?.groupSummaryCounts?.activeGroupBorrowers ?? '-'}
                                    </p>
                                    <p><strong>Overdue Group
                                        Loans:</strong> {groupDetails?.groupSummaryCounts?.overdueGroupLoans ?? '-'}</p>
                                    <p><strong>Overdue
                                        Loans:</strong> {groupDetails?.groupSummaryCounts?.overdueLoans ?? '-'}</p>
                                </div>

                                <div className="general-details-column">
                                    <p><strong>Active
                                        Loans:</strong> {groupDetails?.groupSummaryCounts?.activeLoans ?? '-'}</p>
                                    <p><strong>Active
                                        Borrowers:</strong> {groupDetails?.groupSummaryCounts?.activeBorrowers ?? '-'}
                                    </p>
                                </div>
                            </div>


                        </div>

                        {/* GSIM Account Overview */}
                        <div className="general-section general-upcoming-charges">
                            <div className="general-section-header">
                                <h3 className="general-section-title">GSIM Account Overview</h3>
                            </div>
                            <table className="general-charges-table">
                                <thead>
                                <tr>
                                    <th>GSIM Id</th>
                                    <th>Account Number</th>
                                    <th>Product</th>
                                    <th>Balance</th>
                                    <th>Status</th>
                                </tr>
                                </thead>
                                <tbody>
                                {groupDetails?.gsimAccounts?.length > 0 ? (
                                    groupDetails.gsimAccounts.map((account, index) => (
                                        <tr key={index}>
                                            <td>{account.id}</td>
                                            <td>{account.accountNumber}</td>
                                            <td>{account.productName}</td>
                                            <td>{account.balance || 0}</td>
                                            <td>{account.status}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5">No GSIM Accounts available</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>

                        {/* GLIM Loans Accounts Overview */}
                        <div className="general-section general-loan-accounts">
                            <div className="general-section-header">
                                <h3 className="general-section-title">GLIM Loans Accounts Overview</h3>
                            </div>
                            <table className="general-accounts-table">
                                <thead>
                                <tr>
                                    <th>GLIM Id</th>
                                    <th>Account Number</th>
                                    <th>Product</th>
                                    <th>Original Loan</th>
                                    <th>Status</th>
                                </tr>
                                </thead>
                                <tbody>
                                {groupDetails?.glimAccounts?.length > 0 ? (
                                    groupDetails.glimAccounts.map((account, index) => (
                                        <tr key={index}>
                                            <td>{account.id}</td>
                                            <td>{account.accountNumber}</td>
                                            <td>{account.productName}</td>
                                            <td>{account.originalLoanAmount || 0}</td>
                                            <td>{account.loanBalance || 0}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5">No GLIM Accounts available</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'notes':
                return (
                    <div className="general-section general-notes-section">
                        <div className="general-section-header">
                            <h3 className="general-section-title">Notes</h3>
                            <button
                                className="create-provisioning-criteria-submit"
                                onClick={() => {
                                    setIsNotesModalOpen(true);
                                    setEditingNoteId(null);
                                    setNewNote('');
                                }}
                            >
                                Add Note
                            </button>
                        </div>
                        {notes.length > 0 ? (
                            <div className="notes-list">
                                {notes.map((note) => (
                                    <div key={note.id} className="note-item">
                                        <div className="note-icon">
                                            < FaStickyNote/>
                                        </div>
                                        <div className="note-content">
                                            <p>{note.note}</p>
                                            <small>
                                                Created By: {note.createdByUsername || 'Unknown'} |{' '}
                                                {new Date(note.createdOn).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </small>
                                        </div>
                                        <div className="note-actions">
                                            <button
                                                className="note-general-action-button"
                                                onClick={() => handleEditNote(note)}
                                            >
                                                <FaEdit  color={"#56bc23"} size={20}/>
                                            </button>
                                            <button
                                                className="note-general-action-button"
                                                onClick={() => handleDeleteNote(note.id)}
                                            >
                                                <FaTrash color={"#e13a3a"} size={20}/>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="no-data">No notes available</p>
                        )}
                        {isNotesModalOpen && (
                            <div className="create-provisioning-criteria-modal-overlay">
                                <div className="create-provisioning-criteria-modal-content">
                                    <h4 className="create-modal-title">
                                        {editingNoteId ? 'Edit Note' : 'Add Note'}
                                    </h4>
                                    <div className="create-holiday-row">
                                        <div className="create-provisioning-criteria-group">
                                            <label htmlFor="note" className="create-provisioning-criteria-label">
                                                Write Note
                                            </label>
                                            <textarea
                                                id="note"
                                                value={newNote}
                                                placeholder={"Write Note..."}
                                                onChange={(e) => setNewNote(e.target.value)}
                                                className="create-provisioning-criteria-input"
                                                rows="4"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="create-provisioning-criteria-modal-actions">
                                        <button
                                            onClick={() => setIsNotesModalOpen(false)}
                                            className="create-provisioning-criteria-cancel"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveNote}
                                            className="create-provisioning-criteria-confirm"
                                            disabled={!newNote.trim()}
                                        >
                                            Submit
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'committee':
                return (
                    <div className="general-section general-committee-section">
                        <div className="general-section-header">
                            <h3 className="general-section-title">Client Members</h3>
                            <button
                                className="create-provisioning-criteria-submit"
                                onClick={() => {
                                    setIsCommitteeModalOpen(true);
                                    setSelectedClient('');
                                    setSelectedRole('');
                                    setEditingCommitteeMemberId(null);
                                }}
                            >
                                Add Member
                            </button>
                        </div>
                        {committeeMembers.length > 0 ? (
                            <div className="committee-list">
                                {committeeMembers.map((member) => (
                                    <div key={member.id} className="committee-item">
                                        <div className="committee-content">
                                        <p><strong>Client:</strong> {member.clientName}</p>
                                            <p><strong>Role:</strong> {member.role}</p>
                                        </div>
                                        <div className="committee-actions">
                                            <button
                                                className="committee-action-button"
                                                onClick={() => {
                                                    setSelectedClient(member.clientId);
                                                    setSelectedRole(member.roleId);
                                                    setEditingCommitteeMemberId(member.id);
                                                    setIsCommitteeModalOpen(true);
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="committee-action-button"
                                                onClick={() => handleDeleteCommitteeMember(member.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="no-data">No client members available</p>
                        )}
                        {isCommitteeModalOpen && (
                            <div className="create-provisioning-criteria-modal-overlay">
                                <div className="create-provisioning-criteria-modal-content">
                                    <h4 className="create-modal-title">
                                        {editingCommitteeMemberId ? 'Edit Client Member' : 'Add Client Member'}
                                    </h4>
                                    <div className="create-holiday-row">
                                        {/* Client Dropdown */}
                                        <div className="create-provisioning-criteria-group">
                                            <label htmlFor="client" className="create-provisioning-criteria-label">
                                                Client <span>*</span>
                                            </label>
                                            <select
                                                id="client"
                                                value={selectedClient}
                                                onChange={(e) => setSelectedClient(e.target.value)}
                                                className="create-provisioning-criteria-input"
                                                required
                                            >
                                                <option value="">Select Client</option>
                                                {clientOptions.map((client) => (
                                                    <option key={client.id} value={client.id}>
                                                        {client.displayName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        {/* Role Dropdown */}
                                        <div className="create-provisioning-criteria-group">
                                            <label htmlFor="role" className="create-provisioning-criteria-label">
                                                Role <span>*</span>
                                            </label>
                                            <select
                                                id="role"
                                                value={selectedRole}
                                                onChange={(e) => setSelectedRole(e.target.value)}
                                                className="create-provisioning-criteria-input"
                                                required
                                            >
                                                <option value="">Select Role</option>
                                                {roleOptions.map((role) => (
                                                    <option key={role.id} value={role.id}>
                                                        {role.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="create-provisioning-criteria-modal-actions">
                                        <button
                                            onClick={() => setIsCommitteeModalOpen(false)}
                                            className="create-provisioning-criteria-cancel"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveCommitteeMember}
                                            className="create-provisioning-criteria-confirm"
                                            disabled={!selectedClient || !selectedRole}
                                        >
                                            Submit
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );

            default:
                return <div>Content Not Found</div>;
        }
    };

    const handleActivateGroupSubmit = async () => {
        if (!activationDate || activationDate < submissionDate) {
            showNotification("Activation date must be on or after the submission date!", 'info');
            return;
        }

        const payload = {
            activationDate: activationDate.toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }),
            dateFormat: 'dd MMMM yyyy',
            locale: 'en',
        };

        const headers = {
            Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
            'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
            'Content-Type': 'application/json',
        };

        try {
            startLoading();
            await axios.post(`/fineract-provider/api/v1/groups/${groupId}?command=activate`, payload, { headers });
            setIsActivateModalOpen(false);
            const groupResponse = await axios.get(`/fineract-provider/api/v1/groups/${groupId}?associations=all`, { headers });
            setGroupDetails(groupResponse.data);
            showNotification("Group activated successfully!", 'success')
        } catch (error) {
            console.error('Error activating group:', error);
            showNotification('Error activating group!', 'error');
        } finally {
            stopLoading();
        }
    };

    const handleEditGroup = async () => {
        setEditGroupData({
            name: groupDetails?.name || '',
            officeId: groupDetails?.officeId || '',
            staffId: groupDetails?.staffId || '',
            submittedOnDate: groupDetails?.timeline?.submittedOnDate
                ? new Date(groupDetails.timeline.submittedOnDate[0], groupDetails.timeline.submittedOnDate[1] - 1, groupDetails.timeline.submittedOnDate[2])
                : null,
            activationDate: groupDetails?.activationDate
                ? new Date(groupDetails.activationDate[0], groupDetails.activationDate[1] - 1, groupDetails.activationDate[2])
                : null,
            externalId: groupDetails?.externalId || '',
        });

        if (groupDetails?.officeId) {
            await fetchStaffForOffice(groupDetails.officeId);
        }

        setIsEditModalOpen(true);
    };

    const fetchStaffForOffice = async (selectedOfficeId) => {
        setEditGroupData((prevData) => ({ ...prevData, officeId: selectedOfficeId, staffId: '' }));

        try {
            startLoading();
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                'Content-Type': 'application/json',
            };

            const staffResponse = await axios.get(
                `/fineract-provider/api/v1/groups/template?officeId=${selectedOfficeId}&staffInSelectedOfficeOnly=true`,
                { headers }
            );

            setEditGroupStaffOptions(staffResponse.data.staffOptions || []);
        } catch (error) {
            console.error('Error fetching staff for selected office:', error);
        } finally {
            stopLoading();
        }
    };

    const handleEditGroupSubmit = async () => {
        const { name, staffId, submittedOnDate, activationDate, externalId } = editGroupData;

        if (!name || !submittedOnDate || !activationDate) {
            showNotification('Name, Submitted On Date, and Activation Date are mandatory!', 'info');
            return;
        }

        const payload = {
            name,
            staffId: staffId || undefined,
            submittedOnDate: submittedOnDate.toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }),
            activationDate: activationDate.toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }),
            externalId: externalId || undefined,
            dateFormat: 'dd MMMM yyyy',
            locale: 'en',
        };

        const headers = {
            Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
            'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
            'Content-Type': 'application/json',
        };

        try {
            startLoading();
            await axios.put(`/fineract-provider/api/v1/groups/${groupId}`, payload, { headers });
            setIsEditModalOpen(false);

            const updatedResponse = await axios.get(`/fineract-provider/api/v1/groups/${groupId}?associations=all`, { headers });
            setGroupDetails(updatedResponse.data);
            showNotification("Group editing successful!", 'success');
        } catch (error) {
            console.error('Error editing group:', error);
            showNotification('Error editing group!', 'error');
        } finally {
            stopLoading();
        }
    };

    const fetchGroupAssociations = async () => {
        try {
            startLoading();
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                'Content-Type': 'application/json',
            };

            const response = await axios.get(`/fineract-provider/api/v1/groups/${groupId}?associations=all`, { headers });
            setClientMembers(
                response.data.clientMembers.map((client) => ({
                    value: client.id,
                    label: client.displayName,
                }))
            );
            setAvailableGroups(
                response.data.availableGroups.map((group) => ({
                    value: group.id,
                    label: group.name,
                }))
            );
        } catch (error) {
            console.error('Error fetching group associations:', error);
            showNotification('Error fetching group associations!', 'error');
        } finally {
            stopLoading();
        }
    };

    const handleSubmitTransferClients = async () => {
        if (!selectedClients.length || !destinationGroup) {
            showNotification('Please select clients and a destination group!', 'info');
            return;
        }

        const payload = {
            clients: selectedClients.map((client) => ({ id: client.value })),
            inheritDestinationGroupLoanOfficer: inheritLoanOfficer,
            destinationGroupId: destinationGroup,
        };

        const headers = {
            Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
            'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
            'Content-Type': 'application/json',
        };

        try {
            startLoading();
            await axios.post(`/fineract-provider/api/v1/groups/${groupId}?command=transferClients`, payload, { headers });
            showNotification('Clients transferred successfully!', 'success');
            setIsTransferModalOpen(false);
            fetchGroupAssociations(); // Refresh data
        } catch (error) {
            console.error('Error transferring clients:', error);
            showNotification('Error transferring clients!', 'error');
        } finally {
            stopLoading();
        }
    };

    const openTransferModal = async () => {
        await fetchGroupAssociations();
        setIsTransferModalOpen(true);
    };

    useEffect(() => {
        if (isAddClientsModalOpen) {
            const fetchAllClients = async () => {
                try {
                    startLoading();
                    const headers = {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    };
                    const response = await axios.get(
                        `/fineract-provider/api/v1/clients?orphansOnly=true&sortOrder=ASC&orderBy=displayName`,
                        { headers }
                    );
                    setAllClients(response.data.pageItems || []);
                } catch (error) {
                    console.error('Error fetching all clients:', error);
                } finally {
                    stopLoading();
                }
            };

            fetchAllClients();
        }
    }, [isAddClientsModalOpen]);

    useEffect(() => {
        if (searchQuery) {
            const lowerCaseQuery = searchQuery.toLowerCase();
            const filtered = allClients.filter(
                (client) =>
                    (client.displayName.toLowerCase().includes(lowerCaseQuery) ||
                        client.accountNo.includes(lowerCaseQuery)) &&
                    client.officeId === groupDetails?.officeId
            );
            setFilteredClients(filtered);
        } else {
            setFilteredClients([]);
        }
    }, [searchQuery, allClients]);

    const handleAddClientsToGroup = async () => {
        try {
            startLoading();

            const invalidClients = selectedClientIds.filter(
                (id) => {
                    const client = allClients.find((c) => c.id === id);
                    return client?.officeId !== groupDetails?.officeId;
                }
            );

            if (invalidClients.length > 0) {
                showNotification(
                    `Selected clients (${invalidClients.join(
                        ", "
                    )}) belong to a different office than the group.`, 'info'
                );
                return;
            }

            const payload = { clientMembers: selectedClientIds };
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };

            await axios.post(
                `/fineract-provider/api/v1/groups/${groupId}?command=associateClients`,
                payload,
                { headers }
            );

            fetchGroupClients();
            setSelectedClientIds([]);
            setSearchQuery("");
            showNotification("Clients added successfully!", 'success');
        } catch (error) {
            console.error("Error adding clients:", error);
            showNotification("Error adding clients. Please try again!", 'error');
        } finally {
            stopLoading();
        }
    };

    const fetchGroupClients = async () => {
        try {
            startLoading();
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                'Content-Type': 'application/json',
            };

            const response = await axios.get(`/fineract-provider/api/v1/groups/${groupId}?associations=all`, { headers });
            setGroupClients(response.data.clientMembers || []);
        } catch (error) {
            console.error('Error fetching group clients:', error);
        } finally {
            stopLoading();
        }
    };

    const handleRemoveClientFromGroup = async (clientId) => {
        const confirmRemoval = window.confirm('Are you sure you want to remove this client from the group?');
        if (!confirmRemoval) return;

        try {
            const payload = { clientMembers: [clientId] };
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                'Content-Type': 'application/json',
            };

            await axios.post(`/fineract-provider/api/v1/groups/${groupId}?command=disassociateClients`, payload, { headers });
            fetchGroupClients();
        } catch (error) {
            console.error('Error removing client:', error);
        }
    };

    const handleUnassignStaff = async () => {
        const confirmUnassign = window.confirm(
            "Are you sure you want to unassign the staff from this group?"
        );

        if (!confirmUnassign) return;

        try {
            startLoading();
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                'Content-Type': 'application/json',
            };

            const payload = { staffId: groupDetails?.staffId };

            await axios.post(
                `/fineract-provider/api/v1/groups/${groupId}?command=unassignStaff`,
                payload,
                { headers }
            );

            const response = await axios.get(
                `/fineract-provider/api/v1/groups/${groupId}?associations=all`,
                { headers }
            );
            setGroupDetails(response.data);
            showNotification("Staff unassigned!", 'success');

        } catch (error) {
            console.error("Error unassigning staff:", error);
            showNotification("Failed to unassign staff. Please try again!", 'error');
        } finally {
            stopLoading();
        }
    };

    const fetchAvailableStaff = async () => {
        try {
            startLoading();
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                'Content-Type': 'application/json',
            };

            const response = await axios.get(
                `/fineract-provider/api/v1/groups/${groupId}?associations=all&template=true`,
                { headers }
            );

            setAvailableStaff(response.data.staffOptions || []);
            setIsAssignStaffModalOpen(true);
        } catch (error) {
            console.error("Error fetching available staff:", error);
            showNotification("Failed to fetch staff options. Please try again!", 'error');
        } finally {
            stopLoading();
        }
    };

    const handleAssignStaff = async () => {
        if (!selectedStaffId) {
            showNotification("Please select a staff to assign!", 'info');
            return;
        }

        try {
            startLoading();
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                'Content-Type': 'application/json',
            };

            const payload = { staffId: selectedStaffId };

            await axios.post(
                `/fineract-provider/api/v1/groups/${groupId}?command=assignStaff`,
                payload,
                { headers }
            );

            const response = await axios.get(
                `/fineract-provider/api/v1/groups/${groupId}?associations=all`,
                { headers }
            );
            setGroupDetails(response.data);

            setIsAssignStaffModalOpen(false);
            setSelectedStaffId('');
            showNotification("Staff assigned successfully!", 'success');
        } catch (error) {
            console.error("Error assigning staff:", error);
            showNotification("Failed to assign staff. Please try again!", 'error');
        } finally {
            stopLoading();
        }
    };

    const fetchCalendarTypes = async () => {
        try {
            startLoading();
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                'Content-Type': 'application/json',
            };

            const response = await axios.get(
                `/fineract-provider/api/v1/groups/${groupId}/calendars/template`,
                { headers }
            );

            setCalendarTypeOptions(response.data.calendarTypeOptions || []);
            setIsAttachMeetingModalOpen(true);
        } catch (error) {
            console.error('Error fetching calendar types:', error);
            showNotification('Failed to fetch calendar options. Please try again!', 'error');
        } finally {
            stopLoading();
        }
    };

    const handleCreateMeeting = async () => {
        if (!meetingStartDate || !meetingTypeId) {
            showNotification("Please provide a valid meeting start date and type!", 'info');
            return;
        }

        try {
            startLoading();
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                'Content-Type': 'application/json',
            };

            const payload = {
                startDate: meetingStartDate.toLocaleDateString('en-GB', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                }),
                repeating: isRepeating,
                title: `groups_${groupId}_CollectionMeeting`,
                typeId: meetingTypeId,
                dateFormat: 'dd MMMM yyyy',
                locale: 'en',
            };

            await axios.post(
                `/fineract-provider/api/v1/groups/${groupId}/calendars`,
                payload,
                { headers }
            );

            setIsAttachMeetingModalOpen(false);
            setMeetingStartDate(null);
            setIsRepeating(false);
            setMeetingTypeId('');
            showNotification("Meeting created successfully", 'success');
        } catch (error) {
            console.error("Error creating meeting:", error);
            showNotification("Failed to create the meeting. Please try again!", 'error');
        } finally {
            stopLoading();
        }
    };

    const fetchClosureReasons = async () => {
        try {
            startLoading();
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                'Content-Type': 'application/json',
            };

            const response = await axios.get(
                `/fineract-provider/api/v1/groups/template?command=close`,
                { headers }
            );

            setClosureReasons(response.data.closureReasons || []);
            setIsCloseModalOpen(true);
        } catch (error) {
            console.error('Error fetching closure reasons:', error);
            showNotification('Failed to fetch closure reasons. Please try again!', 'error');
        } finally {
            stopLoading();
        }
    };

    const handleCloseGroup = async () => {
        if (!closedOnDate || !selectedClosureReason) {
            showNotification('Please provide a valid closure date and reason!', 'info');
            return;
        }

        try {
            startLoading();
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                'Content-Type': 'application/json',
            };

            const payload = {
                closedOnDate: closedOnDate.toLocaleDateString('en-GB', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                }),
                closureReasonId: selectedClosureReason,
                dateFormat: 'dd MMMM yyyy',
                locale: 'en',
            };

            await axios.post(
                `/fineract-provider/api/v1/groups/${groupId}?command=close`,
                payload,
                { headers }
            );

            setIsCloseModalOpen(false);
            setClosedOnDate(null);
            setSelectedClosureReason('');
            showNotification("Group closed successfully!", 'success');
        } catch (error) {
            console.error('Error closing group:', error);
            showNotification('Failed to close the group. Please try again!', 'error');
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="client-details-container">
            <div className="client-details-header">
                {/* Left Section */}
                <div className="client-image-section">
                    <img
                        src={GroupImage}
                        alt="Group"
                        className="client-image"
                    />
                </div>

                {/* Middle Section 1 */}
                <div className="client-info-section">
                    <h2 className={`client-name ${getStatusClass(groupDetails?.status?.value || '')}`}>
                        {groupDetails?.name} ({groupDetails?.status?.value || 'Unknown'})
                    </h2>
                    <ul className="client-info-list">
                        <li><strong>Center Name:</strong> {groupDetails?.centerName || 'N/A'}</li>
                        <li><strong>Staff:</strong> {groupDetails?.staffName || 'Unassigned'}</li>
                        <li><strong>Office:</strong> {groupDetails?.officeName || 'N/A'}</li>
                        <li>
                            <strong>Activation Date:</strong>{' '}
                            {groupDetails?.activationDate
                                ? new Date(groupDetails.activationDate.join('-')).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })
                                : 'N/A'}
                        </li>
                    </ul>
                </div>

                {/* Middle Section 2 */}
                <div className="client-info-section">
                    <ul className="client-info-list">
                        <li><strong>Next Meeting On:</strong> {groupDetails?.nextMeetingDate || 'N/A'}</li>
                        <li><strong>Meeting Frequency:</strong> {groupDetails?.meetingFrequency || 'N/A'}</li>
                    </ul>
                </div>

                {/* Right Section */}
                <div className="client-actions-section">
                    {groupDetails?.status?.value === 'Pending' && (
                        <button
                            className="client-action-button"
                            onClick={() => setIsActivateModalOpen(true)}
                        >
                            Activate
                        </button>
                    )}
                    <button
                        className="client-action-button"
                        onClick={handleEditGroup}
                    >
                        Edit
                    </button>
                    <button
                        className="client-action-button"
                        onClick={() => {
                            setIsAddClientsModalOpen(true);
                            fetchGroupClients();
                        }}
                    >
                        Add Clients
                    </button>
                    <button
                        className="client-action-button"
                        onClick={openTransferModal}
                    >
                        Transfer Clients
                    </button>
                    <button className="client-action-button"
                            onClick={() => {
                                setIsAddClientsModalOpen(true);
                                fetchGroupClients();
                            }}
                    >
                        Manage Members
                    </button>

                    <div className="client-dropdown">
                        <button className="client-action-button">Applications</button>
                        <div className="client-dropdown-content">

                            <button onClick={() => navigate(`/group/${groupId}/applications/savings`)}>Group Saving
                                Application
                            </button>
                            {/*onClick={() => navigate(`/group/${groupId}/applications/loan`)}*/}
                            <button >Group Loan
                                Application
                            </button>
                            {/*onClick={() => navigate(`/group/${groupId}/applications/glim-loan`)}*/}
                            <button >GLIM Loan
                                Application
                            </button>
                            {/*onClick={() => navigate(`/group/${groupId}/applications/gsim`)}*/}
                            <button >GSIM Application
                            </button>
                        </div>
                    </div>

                    <div className="client-dropdown">
                        <button className="client-action-button">More</button>
                        <div className="client-dropdown-content">
                            {groupDetails?.staffId ? (
                                <button onClick={handleUnassignStaff}>Unassign Staff</button>
                            ) : (
                                <button onClick={fetchAvailableStaff}>Assign Staff</button>
                            )}
                            <button onClick={fetchCalendarTypes}>Attach Meeting</button>
                            <button onClick={fetchClosureReasons}>Close</button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="client-details-tabs">
                {['general', 'notes', 'committee'].map((tab) => (
                    <button
                        key={tab}
                        className={`client-tab-button ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="client-tab-content">{renderTabContent()}</div>

            {isActivateModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className="create-modal-title">Activate Group</h4>
                        <div className="create-holiday-row">
                            <div className="create-provisioning-criteria-group">
                                <label htmlFor="activationDate" className="create-provisioning-criteria-label">
                                    Activation Date
                                </label>
                                <DatePicker
                                    id="activationDate"
                                    selected={activationDate}
                                    onChange={(date) => setActivationDate(date)}
                                    className="create-provisioning-criteria-input"
                                    placeholderText="Select Activation Date"
                                    dateFormat="dd MMMM yyyy"
                                    showMonthDropdown
                                    showYearDropdown
                                    dropdownMode="select"
                                    minDate={submissionDate}
                                />
                            </div>
                        </div>
                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                onClick={() => setIsActivateModalOpen(false)}
                                className="create-provisioning-criteria-cancel"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleActivateGroupSubmit}
                                className="create-provisioning-criteria-confirm"
                                disabled={!activationDate}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isEditModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className="create-modal-title">Edit Group</h4>
                        <div className="create-holiday-row">
                            <div className="create-provisioning-criteria-group">
                                <label htmlFor="groupName" className="create-provisioning-criteria-label">
                                    Group Name <span>*</span>
                                </label>
                                <input
                                    id="groupName"
                                    type="text"
                                    value={editGroupData.name}
                                    onChange={(e) => setEditGroupData({...editGroupData, name: e.target.value})}
                                    className="create-provisioning-criteria-input"
                                    placeholder="Enter Group Name"
                                />
                            </div>
                        </div>
                        <div className="create-holiday-row">
                            <div className="create-provisioning-criteria-group">
                                <label htmlFor="officeName" className="create-provisioning-criteria-label">
                                    Office
                                </label>
                                <input
                                    id="officeName"
                                    type="text"
                                    value={groupDetails?.officeName || ''}
                                    className="create-provisioning-criteria-input"
                                    disabled
                                />
                            </div>

                            <div className="create-provisioning-criteria-group">
                                <label htmlFor="staffId" className="create-provisioning-criteria-label">
                                    Staff
                                </label>
                                <select
                                    id="staffId"
                                    value={editGroupData.staffId} // Correctly bind the selected staff
                                    onChange={(e) => setEditGroupData({...editGroupData, staffId: e.target.value})}
                                    className="create-provisioning-criteria-input"
                                >
                                    <option value="">-- Select Staff --</option>
                                    {editGroupStaffOptions.map((staff) => (
                                        <option key={staff.id} value={staff.id}>
                                            {staff.displayName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="create-holiday-row">
                            {/* Submitted On */}
                            <div className="create-provisioning-criteria-group">
                                <label htmlFor="submittedOnDate" className="create-provisioning-criteria-label">
                                    Submitted On <span>*</span>
                                </label>
                                <DatePicker
                                    id="submittedOnDate"
                                    selected={editGroupData.submittedOnDate}
                                    onChange={(date) => {
                                        setEditGroupData({...editGroupData, submittedOnDate: date});
                                        setActivationDateLimit(date);
                                    }}
                                    className="create-provisioning-criteria-input"
                                    dateFormat="dd MMMM yyyy"
                                    maxDate={activationDateLimit}
                                    showMonthDropdown
                                    showYearDropdown
                                    dropdownMode="select"
                                />
                            </div>

                            <div className="create-provisioning-criteria-group">
                                <label htmlFor="activationDate" className="create-provisioning-criteria-label">
                                    Activation Date
                                    <span>*</span>
                                </label>
                                <DatePicker
                                    id="activationDate"
                                    selected={editGroupData.activationDate}
                                    onChange={(date) => {
                                        setEditGroupData({...editGroupData, activationDate: date});
                                        setSubmittedDateLimit(date);
                                    }}
                                    className="create-provisioning-criteria-input"
                                    dateFormat="dd MMMM yyyy"
                                    minDate={submittedDateLimit}
                                    showMonthDropdown
                                    showYearDropdown
                                    dropdownMode="select"
                                />
                            </div>
                        </div>

                        <div className="create-holiday-row">
                            <div className="create-provisioning-criteria-group">
                                <label htmlFor="externalId" className="create-provisioning-criteria-label">
                                    External ID
                                </label>
                                <input
                                    id="externalId"
                                    type="text"
                                    value={editGroupData.externalId}
                                    onChange={(e) => setEditGroupData({...editGroupData, externalId: e.target.value})}
                                    className="create-provisioning-criteria-input"
                                    placeholder="Enter External ID"
                                />
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="create-provisioning-criteria-cancel"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleEditGroupSubmit}
                                className="create-provisioning-criteria-confirm"
                                disabled={!editGroupData.name || !editGroupData.submittedOnDate || !editGroupData.activationDate}
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isTransferModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className="create-modal-title">Transfer Clients</h4>

                        <div className="create-holiday-row">
                            <div className="create-provisioning-criteria-group">
                                <label htmlFor="clientMembers" className="create-provisioning-criteria-label">
                                    Client Members <span>*</span>
                                </label>
                                <Select
                                    id="clientMembers"
                                    isMulti
                                    options={clientMembers}
                                    value={selectedClients}
                                    onChange={(selected) => setSelectedClients(selected)}
                                    placeholder="Select Client Members"
                                    isClearable
                                />
                            </div>
                        </div>

                        <div className="create-holiday-row">
                            <div className="create-provisioning-criteria-group">
                                <label className="create-provisioning-criteria-label">
                                    <input
                                        type="checkbox"
                                        checked={inheritLoanOfficer}
                                        onChange={(e) => setInheritLoanOfficer(e.target.checked)}
                                        className="create-provisioning-criteria-input"
                                    />  Inherit Group Loan Officer?
                                </label>
                            </div>
                        </div>

                        <div className="create-holiday-row">
                            <div className="create-provisioning-criteria-group">
                                <label htmlFor="destinationGroup" className="create-provisioning-criteria-label">
                                    Destination Group <span>*</span>
                                </label>
                                <select
                                    id="destinationGroup"
                                    value={destinationGroup}
                                    onChange={(e) => setDestinationGroup(e.target.value)}
                                    className="create-provisioning-criteria-input"
                                >
                                    <option value="">-- Select Destination Group --</option>
                                    {availableGroups.map((group) => (
                                        <option key={group.id} value={group.id}>
                                            {group.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                onClick={() => setIsTransferModalOpen(false)}
                                className="create-provisioning-criteria-cancel"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitTransferClients}
                                className="create-provisioning-criteria-confirm"
                                disabled={!selectedClients.length || !destinationGroup}
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isAddClientsModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className="create-modal-title">Add Clients</h4>

                        <div className="create-holiday-row">
                            <div className="create-holiday-row add-client-input-row">
                                <input
                                    id="addClients"
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="create-provisioning-criteria-input add-client-input"
                                    placeholder="Search clients by name or ID"
                                    onFocus={() => {
                                        if (!searchQuery) {
                                            const defaultClients = allClients
                                                .filter(client => client.officeId === groupDetails?.officeId)
                                                .slice(0, 5);
                                            setFilteredClients(defaultClients);
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    className="submit-button"
                                    onClick={handleAddClientsToGroup}
                                    disabled={selectedClientIds.length === 0}
                                >
                                    Add
                                </button>
                            </div>

                            {filteredClients.length > 0 && (
                                <div className="dropdown-menu dropdown-menu-custom">
                                    {filteredClients.map((client) => (
                                        <div
                                            key={client.id}
                                            className="dropdown-item dropdown-item-custom"
                                            onClick={() => {
                                                setSearchQuery(client.displayName);
                                                setSelectedClientIds([client.id]);
                                                setFilteredClients([]);
                                            }}
                                        >
                                            {client.displayName} ({client.accountNo})
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <h4>Group Members</h4>
                        <table className="general-charges-table">
                            <thead>
                            <tr>
                                <th>Name</th>
                                <th>Office</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {groupClients.length > 0 ? (
                                groupClients.map((client) => (
                                    <tr key={client.id}>
                                        <td>{client.displayName}</td>
                                        <td>{client.officeName}</td>
                                        <td>
                                            <button style={{border: "none", cursor: "pointer"}}
                                                onClick={() => handleRemoveClientFromGroup(client.id)}
                                            >
                                                <FaTrash style={{fontSize: "20px"}} color="red"/>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3">No clients in this group.</td>
                                </tr>
                            )}
                            </tbody>
                        </table>

                        {/* Modal Actions */}
                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                onClick={() => setIsAddClientsModalOpen(false)}
                                className="create-provisioning-criteria-cancel"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isAssignStaffModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className="create-modal-title">Assign Staff</h4>
                        <div className="create-holiday-row">
                            <div className="create-provisioning-criteria-group">
                                <label htmlFor="staffSelect" className="create-provisioning-criteria-label">
                                    Select Staff <span>*</span>
                                </label>
                                <select
                                    id="staffSelect"
                                    value={selectedStaffId}
                                    onChange={(e) => setSelectedStaffId(e.target.value)}
                                    className="create-provisioning-criteria-input"
                                >
                                    <option value="">-- Select Staff --</option>
                                    {availableStaff.map((staff) => (
                                        <option key={staff.id} value={staff.id}>
                                            {staff.displayName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                onClick={() => setIsAssignStaffModalOpen(false)}
                                className="create-provisioning-criteria-cancel"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAssignStaff}
                                className="create-provisioning-criteria-confirm"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isAttachMeetingModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className="create-modal-title">Attach Meeting</h4>
                            <div className="create-provisioning-criteria-group">
                                <label htmlFor="meetingStartDate" className="create-provisioning-criteria-label">
                                    Meeting Start Date <span>*</span>
                                </label>
                                <DatePicker
                                    id="meetingStartDate"
                                    selected={meetingStartDate}
                                    onChange={(date) => setMeetingStartDate(date)}
                                    className="create-provisioning-criteria-input"
                                    placeholderText="Select Meeting Start Date"
                                    dateFormat="dd MMMM yyyy"
                                    minDate={new Date()}
                                    showMonthDropdown
                                    showYearDropdown
                                    dropdownMode="select"
                                />
                            </div>

                            {/* Meeting Type */}
                            <div className="create-provisioning-criteria-group">
                                <label htmlFor="meetingType" className="create-provisioning-criteria-label">
                                    Meeting Type <span>*</span>
                                </label>
                                <select
                                    id="meetingType"
                                    value={meetingTypeId}
                                    onChange={(e) => setMeetingTypeId(e.target.value)}
                                    className="create-provisioning-criteria-input"
                                >
                                    <option value="">-- Select Meeting Type --</option>
                                    {calendarTypeOptions.map((type) => (
                                        <option key={type.id} value={type.id}>
                                            {type.value}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Repeats Checkbox */}
                            <div className="create-provisioning-criteria-group">
                                <label className="create-provisioning-criteria-label">
                                    <input
                                        type="checkbox"
                                        checked={isRepeating}
                                        onChange={(e) => setIsRepeating(e.target.checked)}
                                        className="create-provisioning-criteria-input"
                                    />{' '}
                                    Repeats?
                                </label>
                            </div>

                        {/* Modal Actions */}
                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                onClick={() => setIsAttachMeetingModalOpen(false)}
                                className="create-provisioning-criteria-cancel"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateMeeting}
                                className="create-provisioning-criteria-confirm"
                                disabled={!meetingStartDate || !meetingTypeId}
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isCloseModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className="create-modal-title">Close Group</h4>
                            {/* Closed On Date */}
                            <div className="create-provisioning-criteria-group">
                                <label htmlFor="closedOnDate" className="create-provisioning-criteria-label">
                                    Closed On Date <span>*</span>
                                </label>
                                <DatePicker
                                    id="closedOnDate"
                                    selected={closedOnDate}
                                    onChange={(date) => setClosedOnDate(date)}
                                    className="create-provisioning-criteria-input"
                                    placeholderText="Select Closed On Date"
                                    dateFormat="dd MMMM yyyy"
                                    maxDate={new Date()}
                                    showMonthDropdown
                                    showYearDropdown
                                    dropdownMode="select"
                                />
                            </div>

                            {/* Closure Reason */}
                            <div className="create-provisioning-criteria-group">
                                <label htmlFor="closureReason" className="create-provisioning-criteria-label">
                                    Closure Reason <span>*</span>
                                </label>
                                <select
                                    id="closureReason"
                                    value={selectedClosureReason}
                                    onChange={(e) => setSelectedClosureReason(e.target.value)}
                                    className="create-provisioning-criteria-input"
                                >
                                    <option value="">-- Select Closure Reason --</option>
                                    {closureReasons.map((reason) => (
                                        <option key={reason.id} value={reason.id}>
                                            {reason.value}
                                        </option>
                                    ))}
                                </select>
                            </div>

                        {/* Modal Actions */}
                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                onClick={() => setIsCloseModalOpen(false)}
                                className="create-provisioning-criteria-cancel"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCloseGroup}
                                className="create-provisioning-criteria-confirm"
                                disabled={!closedOnDate || !selectedClosureReason}
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}



        </div>
    );
};

export default GroupDetails;
