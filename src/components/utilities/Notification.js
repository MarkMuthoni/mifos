import React, {useContext} from "react";
import {AuthContext} from "../../context/AuthContext";
import "./Notification.css";
import {API_CONFIG} from "../../config";
import axios from "axios";

const NotificationModal = ({ isOpen, onClose }) => {
    const { notifications, user } = useContext(AuthContext);

    const handleCloseModal = async () => {
        try {
            await axios.put(
                `/fineract-provider/api/v1/notifications`,
                {},
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': API_CONFIG.tenantId,
                        'Content-Type': 'application/json',
                    },
                }
            );
        } catch (error) {
            console.error('Failed to clear notifications:', error);
        } finally {
            onClose();
        }
    };


    if (!isOpen) return null;

    return (
        <div className="notification-modal-overlay">
            <div className="notification-modal-content">
                <h4 className="notification-modal-title">Notifications</h4>
                <button className="close-button" onClick={handleCloseModal}>×</button>

                {notifications.length === 0 ? (
                    <>
                        <p>No new notifications</p>
                    </>
                ) : (
                    <ul className="notification-list">
                        {notifications.map((notification) => {
                            const date = new Date(notification.createdAt);
                            const formattedDate = date.toLocaleDateString('en-US', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                            });

                            const formattedTime = date.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true,
                            });

                            return (
                                <li key={notification.id} className="notification-item">
                                    <p><strong>Content:</strong> {notification.content || 'No content available'}</p>
                                    {notification.action && <p><strong>Action:</strong> {notification.action}</p>}
                                    {notification.objectType && <p><strong>Type:</strong> {notification.objectType}</p>}
                                    <small><strong>Date:</strong> {formattedDate}, {formattedTime}</small>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default NotificationModal;
