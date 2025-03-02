import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import CentersSavingsApplication from './CentersSavingsApplication';
import { API_CONFIG } from '../../../../config';
import { useLoading } from '../../../../context/LoadingContext';
import { AuthContext } from '../../../../context/AuthContext';
import axios from "axios";

const CentersApplications = () => {
    const { applicationType, centerId } = useParams();
    const [centerData, setCenterData] = useState(null);
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();

    useEffect(() => {
        const fetchCenterData = async () => {
            startLoading();
            try {
                const headers = {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                };
                const response = await axios.get(`/fineract-provider/api/v1/centers/${centerId}`, { headers });
                setCenterData(response.data);
            } catch (error) {
                console.error("Error fetching center data:", error);
            } finally {
                stopLoading();
            }
        };

        fetchCenterData();
    }, [centerId, user]);

    const handleBreadcrumbNavigation = () => {
        navigate("/centers", {
            state: {
                centerId: centerId,
                centerName: centerData?.name || "Center Details",
                preventDuplicate: true,
            },
        });
    };

    const renderApplicationComponent = () => {
        switch (applicationType) {
            case 'savings':
                return <CentersSavingsApplication />;
            default:
                return <div>Invalid Application Type</div>;
        }
    };

    if (!centerData) {
        return <div>Loading...</div>;
    }

    return (
        <div className="users-page-screen neighbor-element">
            <h2 className="users-page-head">
                <Link to="/dashboard" className="breadcrumb-link">Dashboard</Link>{' '}
                <span
                    className="breadcrumb-link"
                    onClick={handleBreadcrumbNavigation}
                >
                    . {' '} {centerData?.name || "Center Details"}
                </span>{' '}
                . {applicationType.charAt(0).toUpperCase() + applicationType.slice(1).replace(/-/g, ' ')} Application
            </h2>

            <div className="center-applications-content">
                {renderApplicationComponent()}
            </div>
        </div>
    );
};

export default CentersApplications;
