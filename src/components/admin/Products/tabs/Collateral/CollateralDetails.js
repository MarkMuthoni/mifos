import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { API_CONFIG } from '../../../../../config';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';

const CollateralDetails = ({ collateralId, onClose }) => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();

    const [collateralDetails, setCollateralDetails] = useState(null);

    useEffect(() => {
        const fetchCollateralDetails = async () => {
            startLoading();
            try {
                const headers = {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                };

                const response = await axios.get(
                    `${API_CONFIG.proxy}/fineract-provider/api/v1/collateral-management/${collateralId}?template=false`,
                    { headers }
                );
                setCollateralDetails(response.data);
            } catch (error) {
                console.error('Error fetching collateral details:', error);
            } finally {
                stopLoading();
            }
        };

        fetchCollateralDetails();
    }, [collateralId, user]);

    if (!collateralDetails) {
        return <div className="savings-product-details-container">Loading...</div>;
    }

    return (
        <div className="savings-product-details-container">
            <div className="savings-product-details-header">
                <h1 className="savings-product-details-title">{collateralDetails.name}</h1>
                <div className="loan-product-details-actions">
                    <button className="savings-product-details-edit">
                        <FaEdit /> Edit
                    </button>
                    <button className="savings-product-details-delete" style={{ backgroundColor: '#e13a3a' }}>
                        <FaTrash /> Delete
                    </button>
                </div>
            </div>
            <div className="savings-product-details-section">
                <div className="savings-product-details-row">
                    <strong>Collateral Name:</strong>
                    <p>{collateralDetails.name}</p>
                </div>
                <div className="savings-product-details-row">
                    <strong>Type/Quality:</strong>
                    <p>{collateralDetails.quality}</p>
                </div>
                <div className="savings-product-details-row">
                    <strong>Base Price:</strong>
                    <p>{collateralDetails.basePrice}</p>
                </div>
                <div className="savings-product-details-row">
                    <strong>Base Percentage:</strong>
                    <p>{collateralDetails.pctToBase}%</p>
                </div>
                <div className="savings-product-details-row">
                    <strong>Unit Type:</strong>
                    <p>{collateralDetails.unitType}</p>
                </div>
                <div className="savings-product-details-row">
                    <strong>Currency:</strong>
                    <p>{collateralDetails.currency}</p>
                </div>
            </div>
        </div>
    );
};

export default CollateralDetails;
