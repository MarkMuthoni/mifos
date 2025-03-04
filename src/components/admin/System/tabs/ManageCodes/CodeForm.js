import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../../../../context/AuthContext';
import { API_CONFIG } from '../../../../../config';
import './CodeForm.css';
import {NotificationContext} from "../../../../../context/NotificationContext";

const CodeForm = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const [codeName, setCodeName] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!codeName.trim()) {
            setError('Code name is required.');
            return;
        }

        try {
            const response = await axios.post(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/codes`,
                { name: codeName },
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            navigate('/manage-codes');
        } catch (err) {
            console.error('Error submitting code:', err);
            showNotification('Error submitting code!', 'error');
            setError('Failed to submit. Please try again.');
        }
    };

    return (
        <div className="code-form-container">
            <h3 className="form-title">Add a New Code</h3>
            <form className="code-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="codeName">Code Name <span className="required">*</span></label>
                    <input
                        type="text"
                        id="codeName"
                        value={codeName}
                        onChange={(e) => {
                            setCodeName(e.target.value);
                            setError('');
                        }}
                        placeholder="Enter code name"
                    />
                    {error && <p className="error-message">{error}</p>}
                </div>
                <div className="code-form-buttons">
                    <button type="submit" className="submit-button">Submit</button>
                </div>
            </form>
        </div>
    );
};

export default CodeForm;
