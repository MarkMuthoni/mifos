import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import './CreateOffice.css';
import {NotificationContext} from "../../../../../context/NotificationContext";

const CreateOffice = ({ onFormSubmitSuccess }) => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();

    const [name, setName] = useState('');
    const [parentId, setParentId] = useState('');
    const [openingDate, setOpeningDate] = useState('');
    const [externalId, setExternalId] = useState('');
    const [offices, setOffices] = useState([]);

    useEffect(() => {
        fetchParentOffices();
    }, []);

    const fetchParentOffices = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/offices`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                },
            });
            setOffices(response.data || []);
        } catch (error) {
            console.error('Error fetching offices:', error);
        } finally {
            stopLoading();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formattedOpeningDate = new Date(openingDate).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });

        const payload = {
            name,
            parentId: parseInt(parentId, 10),
            openingDate: formattedOpeningDate,
            externalId: externalId || null,
            dateFormat: 'dd MMMM yyyy',
            locale: 'en',
        };

        startLoading();
        try {
            const response = await axios.post(`/fineract-provider/api/v1/offices`, payload, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            showNotification('Office created successfully:', 'success');

            if (onFormSubmitSuccess) onFormSubmitSuccess();
        } catch (error) {
            console.error('Error creating office:', error);
        } finally {
            stopLoading();
        }
    };

    const getDefaultDate = () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
    };

    return (
        <div className="create-office-wrapper">
            <form className="create-office-form" onSubmit={handleSubmit}>
                <h3 className="create-office-title">Create New Office</h3>
                <div className="create-office-field">
                    <label htmlFor="name" className="create-office-label">
                        Office Name <span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter office name"
                        className="create-office-input"
                        required
                    />
                </div>
                <div className="create-office-field">
                    <label htmlFor="parentId" className="create-office-label">
                        Parent Office <span className="required">*</span>
                    </label>
                    <select
                        id="parentId"
                        value={parentId}
                        onChange={(e) => setParentId(e.target.value)}
                        className="create-office-select"
                        required
                    >
                        <option value="">Select Parent Office</option>
                        {offices.map((office) => (
                            <option key={office.id} value={office.id}>
                                {office.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="create-office-field">
                    <label htmlFor="openingDate" className="create-office-label">
                        Opened On <span className="required">*</span>
                    </label>
                    <input
                        type="date"
                        id="openingDate"
                        value={openingDate}
                        onChange={(e) => setOpeningDate(e.target.value)}
                        max={getDefaultDate()}
                        className="create-office-input"
                        required
                    />
                </div>
                <div className="create-office-field">
                    <label htmlFor="externalId" className="create-office-label">
                        External ID
                    </label>
                    <input
                        type="text"
                        id="externalId"
                        value={externalId}
                        onChange={(e) => setExternalId(e.target.value)}
                        placeholder="Enter external ID"
                        className="create-office-input"
                    />
                </div>
                <div className="create-office-actions">
                    <button type="submit" className="create-office-submit">
                        Create Office
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateOffice;
