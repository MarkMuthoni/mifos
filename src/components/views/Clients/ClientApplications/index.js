import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoanAccount from './LoanAccount';
import SavingsAccount from './SavingsAccount';
import ShareAccount from './ShareAccount';
import RecurringDepositAccount from './RecurringDepositAccount';
import FixedDepositAccount from './FixedDepositAccount';
import { API_CONFIG } from '../../../../config';
import { useLoading } from '../../../../context/LoadingContext';
import { AuthContext } from '../../../../context/AuthContext';

const ClientApplications = () => {
    const { applicationType, clientId } = useParams();
    const [clientData, setClientData] = useState(null);
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();

    useEffect(() => {
        const fetchClientData = async () => {
            startLoading();
            try {
                const headers = {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                };
                const response = await axios.get(`/fineract-provider/api/v1/clients/${clientId}`, { headers });
                setClientData(response.data);
            } catch (error) {
                console.error("Error fetching client data:", error);
            } finally {
                stopLoading();
            }
        };

        fetchClientData();
    }, [clientId, user]);

    const handleBreadcrumbNavigation = () => {
        navigate("/clients", {
            state: {
                clientId: clientId,
                clientName: clientData?.displayName || "Client Details",
                preventDuplicate: true,
            },
        });
    };

    const renderApplicationComponent = () => {
        switch (applicationType) {
            case 'loan':
                return <LoanAccount />;
            case 'savings':
                return <SavingsAccount />;
            case 'share':
                return <ShareAccount />;
            case 'recurring-deposit':
                return <RecurringDepositAccount />;
            case 'fixed-deposit':
                return <FixedDepositAccount />;
            default:
                return <div>Invalid Application Type</div>;
        }
    };

    if (!clientData) {
        return <div>Loading...</div>;
    }

    return (
        <div className="users-page-screen neighbor-element">
            <h2 className="users-page-head">
                <Link to="/clients" className="breadcrumb-link">Clients</Link>{' '}
                <span
                    className="breadcrumb-link"
                    onClick={handleBreadcrumbNavigation}
                >
                    . {' '} {clientData?.displayName || "Client Details"}
                </span>{' '}
                . {applicationType.charAt(0).toUpperCase() + applicationType.slice(1).replace(/-/g, ' ')} Application
            </h2>

            <div className="client-applications-content">
                {renderApplicationComponent()}
            </div>
        </div>
    );
};

export default ClientApplications;
