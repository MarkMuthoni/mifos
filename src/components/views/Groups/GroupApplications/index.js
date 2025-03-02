import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import GroupSavingsApplication from './GroupSavingsApplication';
import GroupLoanApplication from './GroupLoanApplication';
import GlimLoanApplication from './GlimLoanApplication';
import GsimApplication from './GsimApplication';
import { API_CONFIG } from '../../../../config';
import { useLoading } from '../../../../context/LoadingContext';
import { AuthContext } from '../../../../context/AuthContext';
import axios from "axios";

const GroupApplications = () => {
    const { applicationType, groupId } = useParams();
    const [groupData, setGroupData] = useState(null);
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();

    useEffect(() => {
        const fetchGroupData = async () => {
            startLoading();
            try {
                const headers = {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                };
                const response = await axios.get(`/fineract-provider/api/v1/groups/${groupId}`, { headers });
                setGroupData(response.data);
            } catch (error) {
                console.error("Error fetching group data:", error);
            } finally {
                stopLoading();
            }
        };

        fetchGroupData();
    }, [groupId, user]);

    const handleBreadcrumbNavigation = () => {
        navigate("/groups", {
            state: {
                groupId: groupId,
                groupName: groupData?.name || "Group Details",
                preventDuplicate: true,
            },
        });
    };

    const renderApplicationComponent = () => {
        switch (applicationType) {
            case 'savings':
                return <GroupSavingsApplication />;
            case 'loan':
                return <GroupLoanApplication />;
            case 'glim-loan':
                return <GlimLoanApplication />;
            case 'gsim':
                return <GsimApplication />;
            default:
                return <div>Invalid Application Type</div>;
        }
    };

    if (!groupData) {
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
                    . {' '} {groupData?.name || "Group Details"}
                </span>{' '}
                . {applicationType.charAt(0).toUpperCase() + applicationType.slice(1).replace(/-/g, ' ')} Application
            </h2>

            <div className="group-applications-content">
                {renderApplicationComponent()}
            </div>
        </div>
    );
};

export default GroupApplications;
