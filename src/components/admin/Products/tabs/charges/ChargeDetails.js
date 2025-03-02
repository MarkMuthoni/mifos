import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { API_CONFIG } from '../../../../../config';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';

const ChargeDetails = ({ chargeId, onClose }) => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();

    const [chargeDetails, setChargeDetails] = useState(null);

    useEffect(() => {
        const fetchChargeDetails = async () => {
            startLoading();
            try {
                const headers = {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                };

                const response = await axios.get(`/fineract-provider/api/v1/charges/${chargeId}?template=false`, { headers });
                setChargeDetails(response.data);
            } catch (error) {
                console.error('Error fetching charge details:', error);
            } finally {
                stopLoading();
            }
        };

        fetchChargeDetails();
    }, [chargeId, user]);

    if (!chargeDetails) {
        return <div className="savings-product-details-container">Loading...</div>;
    }

    return (
        <div className="savings-product-details-container">
            <div className="savings-product-details-header">
                <h1 className="savings-product-details-title">{chargeDetails.name}</h1>
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
                    <strong>Charge Name:</strong>
                    <p>{chargeDetails.name}</p>
                </div>
                <div className="savings-product-details-row">
                    <strong>Charge Applies To:</strong>
                    <p>{chargeDetails.chargeAppliesTo?.value}</p>
                </div>
                <div className="savings-product-details-row">
                    <strong>Penalty:</strong>
                    <p>{chargeDetails.penalty ? 'Yes' : 'No'}</p>
                </div>
                <div className="savings-product-details-row">
                    <strong>Currency:</strong>
                    <p>{chargeDetails.currency?.code} ({chargeDetails.currency?.name})</p>
                </div>
                <div className="savings-product-details-row">
                    <strong>Amount:</strong>
                    <p>{chargeDetails.amount}</p>
                </div>
                <div className="savings-product-details-row">
                    <strong>Charge Time Type:</strong>
                    <p>{chargeDetails.chargeTimeType?.value}</p>
                </div>
                <div className="savings-product-details-row">
                    <strong>Charge Calculation Type:</strong>
                    <p>{chargeDetails.chargeCalculationType?.value}</p>
                </div>
                <div className="savings-product-details-row">
                    <strong>Charge Payment Mode:</strong>
                    <p>{chargeDetails.chargePaymentMode?.value}</p>
                </div>
                <div className="savings-product-details-row">
                    <strong>Active:</strong>
                    <p>{chargeDetails.active ? 'Yes' : 'No'}</p>
                </div>
            </div>
        </div>
    );
};

export default ChargeDetails;
