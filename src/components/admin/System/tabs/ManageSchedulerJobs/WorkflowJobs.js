import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import { FaTrash } from 'react-icons/fa';
import './WorkflowJobs.css';
import {NotificationContext} from "../../../../../context/NotificationContext";

const WorkflowJobs = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();

    const [jobNames, setJobNames] = useState([]);
    const [selectedJobName, setSelectedJobName] = useState('');
    const [linkedSteps, setLinkedSteps] = useState([]);
    const [initialLinkedSteps, setInitialLinkedSteps] = useState([]);
    const [availableSteps, setAvailableSteps] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newStep, setNewStep] = useState('');

    useEffect(() => {
        fetchJobNames();
    }, []);

    useEffect(() => {
        if (selectedJobName) {
            fetchLinkedSteps(selectedJobName);
        }
    }, [selectedJobName]);

    const fetchJobNames = async () => {
        startLoading();
        try {
            const response = await fetch(`${API_CONFIG.proxy}/fineract-provider/api/v1/jobs/names`, {
                method: 'GET',
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            setJobNames(data.businessJobs);
        } catch (error) {
            console.error('Error fetching job names:', error);
        } finally {
            stopLoading();
        }
    };

    const fetchLinkedSteps = async (jobName) => {
        startLoading();
        try {
            const response = await fetch(`${API_CONFIG.proxy}/fineract-provider/api/v1/jobs/${jobName}/steps`, {
                method: 'GET',
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            setLinkedSteps(data.businessSteps);
            setInitialLinkedSteps(data.businessSteps); // Save initial state for comparison
        } catch (error) {
            console.error('Error fetching linked steps:', error);
        } finally {
            stopLoading();
        }
    };

    const fetchAvailableSteps = async () => {
        startLoading();
        try {
            const jobBaseName = selectedJobName.split('_')[0];

            const response = await fetch(`${API_CONFIG.proxy}/fineract-provider/api/v1/jobs/${jobBaseName}/available-steps`, {
                method: 'GET',
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 204) {
                setAvailableSteps([]);
                showNotification('No available steps to add for this job!', 'info');
                return;
            }

            const data = await response.json();
            setAvailableSteps(
                data.availableBusinessSteps.filter(
                    (step) => !linkedSteps.some((linkedStep) => linkedStep.stepName === step.stepName)
                )
            );
            setShowModal(true);
        } catch (error) {
            console.error('Error fetching available steps:', error);
            showNotification('Failed to fetch available steps. Please try again!', 'error');
        } finally {
            stopLoading();
        }
    };

    const addStep = () => {
        setLinkedSteps((prev) => [
            ...prev,
            { stepName: newStep }, // Order will be assigned by the backend
        ]);
        setNewStep('');
        setShowModal(false);
    };

    const deleteStep = (index) => {
        setLinkedSteps((prev) => {
            const updatedSteps = [...prev];
            updatedSteps.splice(index, 1);
            return updatedSteps;
        });
    };

    const hasUnsavedChanges = () => {
        return (
            JSON.stringify(initialLinkedSteps.map((step) => step.stepName).sort()) !==
            JSON.stringify(linkedSteps.map((step) => step.stepName).sort())
        );
    };

    const applyChanges = async () => {
        startLoading();
        try {
            const payload = {
                jobName: selectedJobName,
                steps: linkedSteps,
            };

            const response = await fetch(`${API_CONFIG.proxy}/fineract-provider/api/v1/jobs/${selectedJobName}/steps`, {
                method: 'PUT',
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                showNotification('Changes applied successfully!', 'success');
                setInitialLinkedSteps([...linkedSteps]); // Update initial state after successful save
            } else {
                console.error('Error applying changes:', await response.json());
                showNotification('Error applying changes!', 'error');
            }
        } catch (error) {
            console.error('Error applying changes:', error);
            showNotification('Error applying changes!', "error");
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="workflow-jobs-container">
                <div className="job-name-section">
                    <label htmlFor="job-name-select">Job Name <span>*</span></label>
                    <select
                        id="job-name-select"
                        value={selectedJobName}
                        onChange={(e) => setSelectedJobName(e.target.value)}
                        className="styled-select"
                    >
                        <option value="">Select Job Name</option>
                        {jobNames.map((jobName, index) => (
                            <option key={index} value={jobName}>
                                {jobName}
                            </option>
                        ))}
                    </select>
                </div>
                {selectedJobName && (
                    <>
                        <button className="link-step-button" onClick={fetchAvailableSteps}>
                            Link Job Step
                        </button>
                        {linkedSteps.length > 0 && (
                            <table className="linked-steps-table">
                                <thead>
                                <tr>
                                    <th>Step Name</th>
                                    <th>Order</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {linkedSteps.map((step, index) => (
                                    <tr key={index}>
                                        <td>{step.stepName}</td>
                                        <td>{step.order}</td>
                                        <td>
                                            <button
                                                className="delete-step-button"
                                                onClick={() => deleteStep(index)}
                                            >
                                                <FaTrash/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                        {hasUnsavedChanges() && (
                            <button
                                className="apply-changes-button"
                                onClick={applyChanges}
                            >
                                Apply Changes
                            </button>
                        )}
                    </>
                )}
                {showModal && (
                    <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h4>Add Job Step to Workflow</h4>
                            </div>
                            <div className="modal-body">
                                <label htmlFor="step-select" className="modal-label">
                                    Select Step
                                </label>
                                <select
                                    id="step-select"
                                    value={newStep}
                                    onChange={(e) => setNewStep(e.target.value)}
                                    className="styled-select"
                                >
                                    <option value="">Select Step</option>
                                    {availableSteps.map((step, index) => (
                                        <option key={index} value={step.stepName}>
                                            {step.stepDescription}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button className="modal-cancel-button" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button
                                    className="modal-submit-button"
                                    onClick={addStep}
                                    disabled={!newStep}
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

            export default WorkflowJobs;
