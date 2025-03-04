import React, {useContext, useEffect, useState} from 'react';
import axios from 'axios';
import { API_CONFIG } from '../../../config';
import {AuthContext} from "../../../context/AuthContext";
import {useLoading} from "../../../context/LoadingContext";
import { FaTrash, FaEdit, FaStickyNote} from 'react-icons/fa';
import {useNavigate} from "react-router-dom";
import DatePicker from "react-datepicker";
import {format} from "date-fns";
import {NotificationContext} from "../../../context/NotificationContext";

const CenterDetails = ({ centerId, onClose }) => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const navigate = useNavigate();

    const [CenterImage, setCenterImage] = useState(null);
    const [centersDetails, setCentersDetails] = useState(null);
    const [activeTab, setActiveTab] = useState('general');

    const [notes, setNotes] = useState([]);
    const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [editingNoteId, setEditingNoteId] = useState(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editCenterData, setEditCenterData] = useState({
        name: "",
        staffId: "",
        externalId: "",
    });
    const [originalCenterData, setOriginalCenterData] = useState(null); // For comparison
    const [staffOptions, setStaffOptions] = useState([]);

    const [isManageGroupsModalOpen, setIsManageGroupsModalOpen] = useState(false);
    const [availableGroups, setAvailableGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [currentGroups, setCurrentGroups] = useState([]);

    const [isAssignStaffModalOpen, setIsAssignStaffModalOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState('');

    const [isAttachMeetingModalOpen, setIsAttachMeetingModalOpen] = useState(false);
    const [meetingStartDate, setMeetingStartDate] = useState(null);
    const [isRepeating, setIsRepeating] = useState(false);
    const [meetingTemplate, setMeetingTemplate] = useState(null);

    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    const [closedOnDate, setClosedOnDate] = useState(null);
    const [closureReason, setClosureReason] = useState('');
    const closureReasons = [
        { id: 1, value: 'Business Completed' },
        { id: 2, value: 'Merged with Another Center' },
        { id: 3, value: 'Other' },
    ];

    useEffect(() => {
        setCenterImage(process.env.PUBLIC_URL + 'Images/centers.png');
    }, []);

    const handleGroupRowClick = (group) => {
        navigate('/groups', {
            state: { openGroupDetails: group },
        });
    };
    useEffect(() => {
        if (activeTab === 'general') {
            fetchGeneralTabData();
        }
    }, [activeTab, centerId]);
    const fetchGeneralTabData = async () => {
        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                'Content-Type': 'application/json',
            };

            // Fetch center details
            const centerResponse = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/centers/${centerId}?associations=groupMembers,collectionMeetingCalendar`,
                { headers }
            );
            setCentersDetails(centerResponse.data);

            // Fetch group summary counts
            const summaryResponse = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/runreports/GroupSummaryCounts?R_groupId=${centerId}&genericResultSet=false`,
                { headers }
            );
            const summaryData = summaryResponse.data[0] || {};
            setCentersDetails((prevDetails) => ({
                ...prevDetails,
                groupSummaryCounts: summaryData,
            }));

            // Fetch group accounts
            const accountsResponse = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/centers/${centerId}/accounts`,
                { headers }
            );
            setCentersDetails((prevDetails) => ({
                ...prevDetails,
                groupAccounts: accountsResponse.data,
            }));
        } catch (error) {
            console.error('Error fetching center details:', error);
        } finally {
            stopLoading();
        }
    };

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
                        `${API_CONFIG.proxy}/fineract-provider/api/v1/groups/${centerId}/notes`,
                        { headers }
                    );
                    setNotes(response.data);
                } catch (error) {
                    console.error('Error fetching notes:', error);
                }
            };

            fetchNotes();
        }
    }, [activeTab, centerId]);

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
            ? `${API_CONFIG.proxy}/fineract-provider/api/v1/groups/${centerId}/notes/${editingNoteId}`
            : `${API_CONFIG.proxy}/fineract-provider/api/v1/groups/${centerId}/notes`;

        const method = editingNoteId ? 'put' : 'post';

        try {
            startLoading();
            await axios[method](endpoint, { note: newNote }, { headers });

            const updatedNotes = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/groups/${centerId}/notes`,
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
                `${API_CONFIG.proxy}/fineract-provider/api/v1/groups/${centerId}/notes/${noteId}`,
                { headers }
            );

            const updatedNotes = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/groups/${centerId}/notes`,
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

    const fetchCenterData = async () => {
        try {
            startLoading();
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                'Content-Type': 'application/json',
            };

            const response = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/centers/${centerId}?staffInSelectedOfficeOnly=true&template=true`,
                { headers }
            );

            const data = response.data;
            setEditCenterData({
                name: data.name || "",
                staffId: data.staffId || "",
                externalId: data.externalId || "",
            });

            setOriginalCenterData({
                name: data.name || "",
                staffId: data.staffId || "",
                externalId: data.externalId || "",
            });

            setStaffOptions(data.staffOptions || []);
            setIsEditModalOpen(true);
        } catch (error) {
            console.error("Error fetching center data for editing:", error);
        } finally {
            stopLoading();
        }
    };

    const handleEditSubmit = async () => {
        try {
            startLoading();
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                'Content-Type': 'application/json',
            };

            const payload = {
                name: editCenterData.name,
                staffId: parseInt(editCenterData.staffId),
                externalId: editCenterData.externalId || undefined,
                dateFormat: "dd MMMM yyyy",
                locale: "en",
            };

            await axios.put(`${API_CONFIG.proxy}/fineract-provider/api/v1/centers/${centerId}`, payload, { headers });
            setIsEditModalOpen(false);
            fetchGeneralTabData();
            showNotification("Center details updated!", 'info');
        } catch (error) {
            console.error("Error updating center data:", error);
            showNotification("Failed to update center details. Please try again!", 'error');
        } finally {
            stopLoading();
        }
    };

    const fetchManageGroupsData = async () => {
        try {
            startLoading();
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                'Content-Type': 'application/json',
            };

            // Fetch current groups and center details
            const centerResponse = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/centers/${centerId}?associations=groupMembers&template=true`,
                { headers }
            );

            setCurrentGroups(centerResponse.data.groupMembers || []);

            // Fetch available groups for dropdown
            const availableGroupsResponse = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/groups?sortOrder=ASC&orderBy=name&officeId=${centerResponse.data.officeId}&orphansOnly=true`,
                { headers }
            );

            setAvailableGroups(availableGroupsResponse.data || []);
            setIsManageGroupsModalOpen(true);
        } catch (error) {
            console.error("Error fetching manage groups data:", error);
        } finally {
            stopLoading();
        }
    };

    const handleAddGroup = async () => {
        if (!selectedGroup) return;

        try {
            startLoading();
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                'Content-Type': 'application/json',
            };

            const payload = { groupMembers: [selectedGroup] };

            await axios.post(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/centers/${centerId}?command=associateGroups`,
                payload,
                { headers }
            );

            fetchManageGroupsData();
            setSelectedGroup(null);
        } catch (error) {
            console.error("Error adding group to center:", error);
            showNotification("Failed to add group. Please try again!", 'error');
        } finally {
            stopLoading();
        }
    };

    const handleRemoveGroup = async (groupId) => {
        const confirmRemove = window.confirm("Are you sure you want to remove this group?");
        if (!confirmRemove) return;

        try {
            startLoading();
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                'Content-Type': 'application/json',
            };

            const payload = { groupMembers: [groupId] };

            await axios.post(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/centers/${centerId}?command=disassociateGroups`,
                payload,
                { headers }
            );

            fetchManageGroupsData();
        } catch (error) {
            console.error("Error removing group from center:", error);
            showNotification("Failed to remove group. Please try again!", 'error');
        } finally {
            stopLoading();
        }
    };

    const fetchAssignStaffData = async () => {
        try {
            startLoading();
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
            };

            const response = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/groups/${centerId}?groupOrCenter=centers&staffInSelectedOfficeOnly=true&template=true`,
                { headers }
            );

            setStaffOptions(response.data.staffOptions || []);
        } catch (error) {
            console.error('Error fetching staff options:', error);
        } finally {
            stopLoading();
        }
    };

    const fetchMeetingTemplate = async () => {
        try {
            startLoading();
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
            };
            const response = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/centers/${centerId}/calendars/template`,
                { headers }
            );
            setMeetingTemplate(response.data);
        } catch (error) {
            console.error('Error fetching meeting template:', error);
        } finally {
            stopLoading();
        }
    };

    const handleAssignStaff = async () => {
        try {
            startLoading();
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                'Content-Type': 'application/json',
            };

            const payload = { staffId: selectedStaff };

            await axios.post(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/groups/${centerId}?command=assignStaff`,
                payload,
                { headers }
            );

            setIsAssignStaffModalOpen(false);
            fetchGeneralTabData(); // Refresh the center details
        } catch (error) {
            console.error('Error assigning staff:', error);
            showNotification('Failed to assign staff. Please try again!', 'error');
        } finally {
            stopLoading();
        }
    };

    const handleUnassignStaff = async () => {
        const confirmUnassign = window.confirm('Are you sure you want to unassign the staff?');
        if (!confirmUnassign) return;

        try {
            startLoading();
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                'Content-Type': 'application/json',
            };

            const payload = { staffId: centersDetails.staffId };

            await axios.post(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/groups/${centerId}?command=unassignStaff`,
                payload,
                { headers }
            );

            fetchGeneralTabData();
        } catch (error) {
            console.error('Error unassigning staff:', error);
            showNotification('Failed to unassign staff!', 'error');
        } finally {
            stopLoading();
        }
    };

    const handleAttachMeeting = async () => {
        try {
            startLoading();

            const formattedDate = format(meetingStartDate, 'dd MMMM yyyy');

            const payload = {
                startDate: formattedDate,
                repeating: isRepeating,
                title: `centers_${centerId}_CollectionMeeting`,
                typeId: meetingTemplate?.type?.id || '1',
                dateFormat: 'dd MMMM yyyy',
                locale: 'en',
            };

            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                'Content-Type': 'application/json',
            };

            await axios.post(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/centers/${centerId}/calendars`,
                payload,
                { headers }
            );

            setIsAttachMeetingModalOpen(false);
            fetchGeneralTabData();
        } catch (error) {
            console.error('Error attaching meeting:', error.response?.data || error);
            showNotification('Failed to attach meeting. Please try again!', 'error');
        } finally {
            stopLoading();
        }
    };

    const handleViewStaffAssignmentHistory = () => {
        // modal logic
    };

    const handleCloseCenter = async () => {
        try {
            startLoading();

            const formattedDate = closedOnDate
                ? closedOnDate.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                })
                : '';

            const payload = {
                closedOn: formattedDate,
                closureReasonId: parseInt(closureReason),
                dateFormat: 'dd MMMM yyyy',
                locale: 'en',
            };

            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                'Content-Type': 'application/json',
            };

            await axios.post(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/centers/${centerId}?command=close`,
                payload,
                { headers }
            );

            showNotification('Center closed successfully!', 'success');
            setIsCloseModalOpen(false);
            fetchGeneralTabData(); // Refresh center details
        } catch (error) {
            console.error('Error closing center:', error.response?.data || error);
            showNotification('Failed to close center. Please try again!', 'error');
        } finally {
            stopLoading();
        }
    };

    const handleDeleteCenter = async () => {
        const confirmDelete = window.confirm(
            'Are you sure you want to delete this center? This action cannot be undone.'
        );

        if (!confirmDelete) return;

        try {
            startLoading();

            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
            };

            await axios.delete(`${API_CONFIG.proxy}/fineract-provider/api/v1/centers/${centerId}`, { headers });

            showNotification('Center deleted successfully!', 'success');
            onClose();
        } catch (error) {
            console.error('Error deleting center:', error.response?.data || error);
            showNotification('Failed to delete center. Please try again!', 'error');
        } finally {
            stopLoading();
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <div className="general-tab">
                        {/* Summary Details Section */}
                        <div className="general-section general-summary-details">
                            <h3 className="general-section-title">Summary Details</h3>
                            <div className="general-details-columns">
                                <div className="general-details-column">
                                    <p><strong>Active Clients:</strong> {centersDetails?.groupSummaryCounts?.activeClients ?? '-'}</p>
                                    <p><strong>Active Client Loans:</strong> {centersDetails?.groupSummaryCounts?.activeClientLoans ?? '-'}</p>
                                    <p><strong>Active Client Borrowers:</strong> {centersDetails?.groupSummaryCounts?.activeClientBorrowers ?? '-'}</p>
                                    <p><strong>Active Overdue Client Loans:</strong> {centersDetails?.groupSummaryCounts?.overdueClientLoans ?? '-'}</p>
                                </div>

                                <div className="general-details-column">
                                    <p><strong>Active Group Loans:</strong> {centersDetails?.groupSummaryCounts?.activeGroupLoans ?? '-'}</p>
                                    <p><strong>Active Group Borrowers:</strong> {centersDetails?.groupSummaryCounts?.activeGroupBorrowers ?? '-'}</p>
                                    <p><strong>Active Overdue Group Loans:</strong> {centersDetails?.groupSummaryCounts?.overdueGroupLoans ?? '-'}</p>
                                    <p><strong>Active Loans:</strong> {centersDetails?.groupSummaryCounts?.activeLoans ?? '-'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Groups Section */}
                        <div className="general-section general-groups-section">
                            <h3 className="general-section-title">Groups</h3>
                            <table className="general-charges-table">
                                <thead>
                                <tr>
                                    <th>Account Number</th>
                                    <th>Group Name</th>
                                    <th>Office Name</th>
                                    <th>Submitted On</th>
                                </tr>
                                </thead>
                                <tbody>
                                {centersDetails?.groupMembers?.length > 0 ? (
                                    centersDetails.groupMembers.map((group, index) => (
                                        <tr
                                            key={index}
                                            onClick={() => handleGroupRowClick(group)}
                                            style={{cursor: 'pointer'}}
                                        >
                                            <td>{group.accountNo}</td>
                                            <td>{group.name}</td>
                                            <td>{group.officeName}</td>
                                            <td>
                                                {group.timeline?.submittedOnDate
                                                    ? new Date(group.timeline.submittedOnDate.join('-')).toLocaleDateString(undefined, {
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
                                        <td colSpan="4">No groups available</td>
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

            default:
                return <div>Content Not Found</div>;
        }
    };

    return (
        <div className="client-details-container">
            <div className="client-details-header">
                {/* Left Section */}
                <div className="client-image-section">
                    <img
                        src={CenterImage}
                        alt="Center"
                        className="client-image"
                    />
                </div>

                {/* Middle Section 1 */}
                <div className="client-info-section">
                    <h2 className={`client-name ${getStatusClass(centersDetails?.status?.value || '')}`}>
                        {centersDetails?.name} ({centersDetails?.status?.value || 'Unknown'})
                    </h2>
                    <ul className="client-info-list">
                        <li><strong>Account:</strong> {centersDetails?.accountNo || 'N/A'}</li>
                        <li><strong>Office:</strong> {centersDetails?.officeName || 'N/A'}</li>
                        <li><strong>External Id:</strong> {centersDetails?.externalId || 'N/A'}</li>
                        <li><strong>Staff:</strong> {centersDetails?.staffName || 'Unassigned'}</li>
                        <li>
                            <strong>Activation Date:</strong>{' '}
                            {centersDetails?.activationDate
                                ? new Date(centersDetails.activationDate.join('-')).toLocaleDateString(undefined, {
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
                        <li><strong>Next Meeting On:</strong> {centersDetails?.nextMeetingDate || 'N/A'}</li>
                        <li><strong>Meeting Frequency:</strong> {centersDetails?.meetingFrequency || 'N/A'}</li>
                    </ul>
                </div>

                {/* Right Section */}
                <div className="client-actions-section">
                    <button className="client-action-button" onClick={fetchCenterData}>Edit</button>
                    <button className="client-action-button" onClick={fetchManageGroupsData}>Manage Groups</button>
                    <button className="client-action-button"
                            onClick={() => navigate(`/center/${centerId}/applications/savings`)}>Center Saving
                        Application
                    </button>

                    <div className="client-dropdown">
                        <button className="client-action-button">More</button>
                        <div className="client-dropdown-content">
                            {centersDetails?.staffId ? (
                                <button onClick={() => handleUnassignStaff()}>Unassign Staff</button>
                            ) : (
                                <button onClick={() => {
                                    setIsAssignStaffModalOpen(true);
                                    fetchAssignStaffData();
                                }}>Assign Staff</button>
                            )}
                            <button onClick={() => {
                                setIsAttachMeetingModalOpen(true);
                                fetchMeetingTemplate();
                            }}>Attach Meeting</button>
                            <button onClick={() => handleViewStaffAssignmentHistory()}>
                                Staff Assignment History
                            </button>
                            <button onClick={() => setIsCloseModalOpen(true)}>Close</button>
                            {centersDetails?.status?.value === 'Pending' && (
                                <button
                                    className="client-action-button"
                                    onClick={() => handleDeleteCenter()}
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="client-details-tabs">
                {['general', 'notes'].map((tab) => (
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

            {isEditModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className="create-modal-title">Edit Center</h4>

                        {/* Name Field */}
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="editName" className="create-provisioning-criteria-label">
                                Name <span>*</span>
                            </label>
                            <input
                                id="editName"
                                type="text"
                                value={editCenterData.name}
                                onChange={(e) =>
                                    setEditCenterData({ ...editCenterData, name: e.target.value })
                                }
                                className="create-provisioning-criteria-input"
                                placeholder="Enter Center Name"
                                required
                            />
                        </div>

                        {/* Staff Dropdown */}
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="editStaff" className="create-provisioning-criteria-label">
                                Staff <span>*</span>
                            </label>
                            <select
                                id="editStaff"
                                value={editCenterData.staffId}
                                onChange={(e) =>
                                    setEditCenterData({ ...editCenterData, staffId: e.target.value })
                                }
                                className="create-provisioning-criteria-input"
                                required
                            >
                                <option value="">-- Select Staff --</option>
                                {staffOptions.map((staff) => (
                                    <option key={staff.id} value={staff.id}>
                                        {staff.displayName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* External ID */}
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="editExternalId" className="create-provisioning-criteria-label">
                                External ID
                            </label>
                            <input
                                id="editExternalId"
                                type="text"
                                value={editCenterData.externalId}
                                onChange={(e) =>
                                    setEditCenterData({ ...editCenterData, externalId: e.target.value })
                                }
                                className="create-provisioning-criteria-input"
                                placeholder="Enter External ID"
                            />
                        </div>

                        {/* Modal Actions */}
                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="create-provisioning-criteria-cancel"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEditSubmit}
                                className="create-provisioning-criteria-confirm"
                                disabled={
                                    !editCenterData.name.trim() ||
                                    !editCenterData.staffId ||
                                    JSON.stringify(editCenterData) === JSON.stringify(originalCenterData)
                                }
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isManageGroupsModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className="create-modal-title">Manage Groups</h4>

                        {/* Add Group Dropdown */}
                            <div className="create-provisioning-criteria-group">
                            <label htmlFor="addGroupDropdown" className="create-provisioning-criteria-label">
                                Add Group
                            </label>
                            <select
                                id="addGroupDropdown"
                                value={selectedGroup || ""}
                                onChange={(e) => setSelectedGroup(e.target.value)}
                                className="create-provisioning-criteria-input"
                            >
                                <option value="">-- Select Group --</option>
                                {availableGroups.map((group) => (
                                    <option key={group.id} value={group.id}>
                                        {group.name} ({group.accountNo})
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={handleAddGroup}
                                className="create-provisioning-criteria-confirm"
                                disabled={!selectedGroup}
                            >
                                Add Group
                            </button>
                        </div>

                        {/* Current Groups Table */}
                        <div className="general-section general-groups-section">
                            <h4 className="general-section-title">Current Groups</h4>
                            <table className="general-charges-table">
                                <thead>
                                <tr>
                                    <th>Account Number</th>
                                    <th>Group Name</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {currentGroups.length > 0 ? (
                                    currentGroups.map((group) => (
                                        <tr key={group.id}>
                                            <td>{group.accountNo}</td>
                                            <td>{group.name}</td>
                                            <td>
                                                <button style={{border: "none", cursor: "pointer"}}
                                                    onClick={() => handleRemoveGroup(group.id)}
                                                >
                                                    <FaTrash color={"#e13a3a"} size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3">No groups available</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>

                        {/* Modal Actions */}
                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                onClick={() => setIsManageGroupsModalOpen(false)}
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
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="staffSelect" className="create-provisioning-criteria-label">
                                Select Staff <span>*</span>
                            </label>
                            <select
                                id="staffSelect"
                                value={selectedStaff}
                                onChange={(e) => setSelectedStaff(e.target.value)}
                                className="create-provisioning-criteria-input"
                            >
                                <option value="">-- Select Staff --</option>
                                {staffOptions.map((staff) => (
                                    <option key={staff.id} value={staff.id}>
                                        {staff.displayName}
                                    </option>
                                ))}
                            </select>
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
                                disabled={!selectedStaff}
                            >
                                Assign
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
                            />
                        </div>
                        <div className="create-provisioning-criteria-group">
                            <label className="create-provisioning-criteria-label" htmlFor="isRepeating">
                                Repeats?{'  '}<input
                                    type="checkbox"
                                    id="isRepeating"
                                    checked={isRepeating}
                                    onChange={(e) => setIsRepeating(e.target.checked)}
                                />

                            </label>
                        </div>
                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                onClick={() => setIsAttachMeetingModalOpen(false)}
                                className="create-provisioning-criteria-cancel"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAttachMeeting}
                                className="create-provisioning-criteria-confirm"
                                disabled={!meetingStartDate}
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
                        <h4 className="create-modal-title">Close Center</h4>
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
                                maxDate={new Date()} // Prevent future dates
                            />
                        </div>

                        {/* Closure Reason */}
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="closureReason" className="create-provisioning-criteria-label">
                                Closure Reason <span>*</span>
                            </label>
                            <select
                                id="closureReason"
                                value={closureReason}
                                onChange={(e) => setClosureReason(e.target.value)}
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
                                onClick={handleCloseCenter}
                                className="create-provisioning-criteria-confirm"
                                disabled={!closedOnDate || !closureReason}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}



        </div>
    );
};

export default CenterDetails;
