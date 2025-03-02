import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import { Link } from 'react-router-dom';
import './ManageExternalEvents.css';

const ManageExternalEvents = () => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const [events, setEvents] = useState([]);
    const [originalEvents, setOriginalEvents] = useState([]);
    const [filter, setFilter] = useState({ eventType: '', status: '' });
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/externalevents/configuration`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            const fetchedEvents = response.data.externalEventConfiguration || [];
            setEvents(fetchedEvents);
            setOriginalEvents(fetchedEvents);
        } catch (error) {
            console.error('Error fetching events:', error);
            setEvents([]);
            setOriginalEvents([]);
        } finally {
            stopLoading();
        }
    };

    const handleToggle = (type) => {
        setEvents((prevEvents) => {
            const updatedEvents = prevEvents.map((event) =>
                event.type === type ? { ...event, enabled: !event.enabled } : event
            );
            const changesMade = updatedEvents.some(
                (event, index) =>
                    event.enabled !== originalEvents[index]?.enabled
            );
            setHasChanges(changesMade);
            return updatedEvents;
        });
    };

    const handleApplyChanges = async () => {
        const updatedEvents = events.map((event) => ({
            type: event.type,
            enabled: event.enabled,
        }));
        try {
            startLoading();
            await axios.put(`/fineract-provider/api/v1/externalevents/configuration`, updatedEvents, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setHasChanges(false);
            setOriginalEvents(events);
        } catch (error) {
            console.error('Error applying changes:', error);
        } finally {
            stopLoading();
        }
    };

    const filteredEvents = () =>
        events.filter((event) => {
            const matchesEventType = filter.eventType
                ? event.type.toLowerCase().includes(filter.eventType.toLowerCase())
                : true;
            const matchesStatus =
                filter.status === 'enabled'
                    ? event.enabled
                    : filter.status === 'disabled'
                        ? !event.enabled
                        : true;
            return matchesEventType && matchesStatus;
        });

    const paginatedEvents = filteredEvents().slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
        setCurrentPage(1);
    };

    return (
        <div className="manage-external-events-page neighbor-element">
            <h2 className="page-heading">
                <Link to="/system" className="breadcrumb-link">System</Link> . Manage External Events
            </h2>
            <div className="apply-changes-container">
                <button
                    className={`apply-changes-button ${hasChanges ? '' : 'disabled'}`}
                    onClick={handleApplyChanges}
                    disabled={!hasChanges}
                >
                    Apply Changes
                </button>
            </div>
            <div className="events-controls">
                <div className="filter-container">
                    <div className="filter-item">
                        <label htmlFor="eventTypeFilter">Filter by Event Type:</label>
                        <input
                            type="text"
                            id="eventTypeFilter"
                            value={filter.eventType}
                            onChange={(e) =>
                                setFilter((prev) => ({ ...prev, eventType: e.target.value }))
                            }
                            placeholder="Enter event type..."
                        />
                    </div>
                    <div className="filter-item">
                        <label htmlFor="statusFilter">Filter by Status:</label>
                        <select
                            id="statusFilter"
                            value={filter.status}
                            onChange={(e) =>
                                setFilter((prev) => ({ ...prev, status: e.target.value }))
                            }
                        >
                            <option value="">All</option>
                            <option value="enabled">Enabled</option>
                            <option value="disabled">Disabled</option>
                        </select>
                    </div>
                </div>
                <div className="page-size-selector">
                    <label>Rows per page:</label>
                    <select value={pageSize} onChange={handlePageSizeChange}>
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>
            <table className="events-table">
                <thead>
                <tr>
                    <th>Event Type</th>
                    <th>Status</th>
                </tr>
                </thead>
                <tbody>
                {paginatedEvents.length > 0 ? (
                    paginatedEvents.map((event) => (
                        <tr key={event.type}>
                            <td>{event.type}</td>
                            <td>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={event.enabled}
                                        onChange={() => handleToggle(event.type)}
                                    />
                                    <span className="slider"></span>
                                </label>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="2" className="no-data">
                            No events available
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
            {filteredEvents().length > pageSize && (
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
                        Page {currentPage} of {Math.ceil(filteredEvents().length / pageSize)}
                    </span>
                    <button
                        onClick={() =>
                            setCurrentPage((prev) =>
                                Math.min(prev + 1, Math.ceil(filteredEvents().length / pageSize))
                            )
                        }
                        disabled={currentPage === Math.ceil(filteredEvents().length / pageSize)}
                    >
                        Next
                    </button>
                    <button
                        onClick={() =>
                            setCurrentPage(Math.ceil(filteredEvents().length / pageSize))
                        }
                        disabled={currentPage === Math.ceil(filteredEvents().length / pageSize)}
                    >
                        End
                    </button>
                </div>
            )}
        </div>
    );
};

export default ManageExternalEvents;
