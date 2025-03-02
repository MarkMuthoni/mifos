import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import './CreateCashier.css';
import {API_CONFIG} from "../../../../../config";
import {NotificationContext} from "../../../../../context/NotificationContext";

const CreateCashier = ({ teller, onFormSubmitSuccess }) => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();

    const [staff, setStaff] = useState([]);
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isFullDay, setIsFullDay] = useState(false);
    const [templateData, setTemplateData] = useState({
        officeId: "",
        officeName: '',
        tellerName: '',
    });

    const fetchStaff = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/staff`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                },
            });
            setStaff(response.data || []);
        } catch (error) {
            console.error('Error fetching staff:', error);
        } finally {
            stopLoading();
        }
    };

    const fetchCashierTemplate = async () => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/tellers/${teller.id}/cashiers/template`, { // Fetch template data
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                },
            });
            const data = response.data || {};
            setTemplateData({
                officeId: data.officeId || "",
                officeName: data.officeName || '',
                tellerName: data.tellerName || '',
            });
        } catch (error) {
            console.error('Error fetching cashier template:', error);
        } finally {
            stopLoading();
        }
    };

    useEffect(() => {
        fetchStaff();
        fetchCashierTemplate();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            staffId: parseInt(selectedStaffId, 10),
            description: description || null,
            startDate: new Date(startDate).toLocaleDateString('en-GB').split('/').reverse().join('-'),
            endDate: new Date(endDate).toLocaleDateString('en-GB').split('/').reverse().join('-'),
            isFullDay,
            officeId: templateData.officeId,
            tellerId: teller.id,
            dateFormat: 'dd-MM-yyyy',
            locale: 'en',
        };

        startLoading();
        try {
            await axios.post(`/fineract-provider/api/v1/tellers/${teller.id}/cashiers`, payload, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            onFormSubmitSuccess();
            showNotification("Cashier created successfully!", 'success');
        } catch (error) {
            console.error('Error creating cashier:', error);
        } finally {
            stopLoading();
        }
    };


    return (
        <div className="create-cashier-container">
            <form className="create-cashier-form" onSubmit={handleSubmit}>
                <h3 className="create-cashier-title">Create Cashier</h3>
                <div className="create-holiday-row">
                    <div className="create-cashier-group">
                        <label className="create-cashier-label">Office (Read Only)</label>
                        <input
                            type="text"
                            value={templateData.officeName}
                            readOnly
                            className="create-cashier-mute"
                        />
                    </div>

                    <div className="create-cashier-group">
                        <label className="create-cashier-label">Teller Name (Read Only)</label>
                        <input
                            type="text"
                            value={templateData.tellerName}
                            readOnly
                            className="create-cashier-mute"
                        />
                    </div>
                </div>

                <div className="create-cashier-group">
                    <label htmlFor="staffId" className="create-cashier-label">Cashier/Staff <span>*</span></label>
                    <select
                        id="staffId"
                        value={selectedStaffId}
                        onChange={(e) => setSelectedStaffId(e.target.value)}
                        className="create-cashier-select"
                        required
                    >
                        <option value="">Select Cashier/Staff</option>
                        {staff.map((member) => (
                            <option key={member.id} value={member.id}>
                                {member.displayName}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="create-cashier-group">
                    <label htmlFor="description" className="create-cashier-label">Description</label>
                    <textarea
                        id="description"
                        value={description}
                        placeholder={"Enter Description here... "}
                        onChange={(e) => setDescription(e.target.value)}
                        className="create-cashier-textarea"
                    ></textarea>
                </div>

                <div className="create-holiday-row">
                    <div className="create-cashier-group">
                        <label htmlFor="startDate" className="create-cashier-label">From <span>*</span></label>
                        <input
                            type="date"
                            id="startDate"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="create-cashier-input"
                            required
                        />
                    </div>
                    <div className="create-cashier-group">
                        <label htmlFor="endDate" className="create-cashier-label">To <span>*</span></label>
                        <input
                            type="date"
                            id="endDate"
                            value={endDate}
                            min={startDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="create-cashier-input"
                            required
                        />
                    </div>
                </div>

                    <div className="create-cashier-group">
                        <label className="create-cashier-label">
                            <input
                                type="checkbox"
                                checked={isFullDay}
                                onChange={(e) => setIsFullDay(e.target.checked)}
                            /> Full Day?
                        </label>
                    </div>

                    <div className="create-cashier-actions">
                        <button
                            type="submit"
                            className="create-cashier-submit"
                            disabled={!selectedStaffId || !startDate || !endDate}
                        >
                            Create Cashier
                        </button>
                    </div>
            </form>
        </div>
);
};

export default CreateCashier;
