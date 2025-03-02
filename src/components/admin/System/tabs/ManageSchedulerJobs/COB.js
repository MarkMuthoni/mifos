import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import './COB.css';
import {FaInfoCircle} from "react-icons/fa";

const COB = () => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();

    const [isCatchUpRunning, setIsCatchUpRunning] = useState(false);
    const [lockedLoans, setLockedLoans] = useState([]);

    const [pollingInterval, setPollingInterval] = useState(null);

    useEffect(() => {
        pollCatchUpStatus();
        fetchLockedLoans();
    }, []);

    useEffect(() => {
        return () => {
            if (pollingInterval) {
                clearInterval(pollingInterval);
            }
        };
    }, [pollingInterval]);

    const pollCatchUpStatus = () => {
        const interval = setInterval(async () => {
            try {
                const response = await fetch(`/fineract-provider/api/v1/loans/is-catch-up-running`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        'Content-Type': 'application/json',
                    },
                });
                const data = await response.json();
                setIsCatchUpRunning(data.isCatchUpRunning);

                if (!data.isCatchUpRunning) {
                    clearInterval(interval);
                    setPollingInterval(null);
                }
            } catch (error) {
                console.error('Error fetching Catch-Up Status during polling:', error);
            }
        }, 5000);
        setPollingInterval(interval);
    };

    const fetchLockedLoans = async () => {
        startLoading();
        try {
            const response = await fetch(`/fineract-provider/api/v1/loans/locked?page=0&limit=5000`, {
                method: 'GET',
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            setLockedLoans(data.content || []);
        } catch (error) {
            console.error('Error fetching locked loans:', error);
        } finally {
            stopLoading();
        }
    };

    const runCatchUp = async () => {
        startLoading();
        try {
            const response = await fetch(`/fineract-provider/api/v1/loans/catch-up`, {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                setIsCatchUpRunning(true);
                pollCatchUpStatus();
            } else {
                console.error('Error starting Catch-Up:', await response.json());
            }
        } catch (error) {
            console.error('Error starting Catch-Up:', error);
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="cob-container">
            <h3>COB Jobs</h3>
            <div className="catch-up-status">
                <div>
                    <strong className={'label'}>COB Catch-Up is:</strong>{' '}
                    <span className={`status ${isCatchUpRunning ? 'running' : 'inactive'}`}>
                        {isCatchUpRunning ? 'Running' : 'Inactive'}
                    </span>
                </div>
                {!isCatchUpRunning && (
                    <button className="run-catch-up-button" onClick={runCatchUp}>
                        Run Catch-Up
                    </button>
                )}
            </div>
            <div className="locked-loans-section">
                <h4>Locked Loans</h4>
                {lockedLoans.length > 0 ? (
                    <table className="locked-loans-table">
                        <thead>
                        <tr>
                            <th>Loan ID</th>
                            <th>Borrower</th>
                            <th>Status</th>
                            <th>Amount</th>
                        </tr>
                        </thead>
                        <tbody>
                        {lockedLoans.map((loan, index) => (
                            <tr key={index}>
                                <td>{loan.id}</td>
                                <td>{loan.borrowerName || ''}</td>
                                <td>{loan.status || 'Locked'}</td>
                                <td>{loan.amount || ''}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="no-loans-message">
                        <FaInfoCircle className="info-icon"/>
                        There are no locked loans available.
                    </p>
                )}
            </div>
        </div>
    );
};

export default COB;
