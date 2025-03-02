import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { FaEdit } from 'react-icons/fa';
import { API_CONFIG } from '../../../../../config';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import './SavingsProductDetails.css';

const SavingsProductDetails = ({ savingsProductId, onClose, onEdit }) => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const [savingsProductDetails, setSavingsProductDetails] = useState(null);

    useEffect(() => {
        const fetchSavingsProductDetails = async () => {
            startLoading();
            try {
                const headers = {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                };

                const response = await axios.get(`/fineract-provider/api/v1/savingsproducts/${savingsProductId}?template=false`, { headers });
                setSavingsProductDetails(response.data);
            } catch (error) {
                console.error('Error fetching savings product details:', error);
            } finally {
                stopLoading();
            }
        };

        fetchSavingsProductDetails();
    }, [savingsProductId, user]);

    const handleEdit = () => {
        onEdit(savingsProductDetails);
        onClose();
    }

    if (!savingsProductDetails) {
        return <div className="savings-product-details-container">Loading...</div>;
    }

    return (
        <div className="savings-product-details-container">
            <div className="savings-product-details-header">
                <h1 className="savings-product-details-title">{savingsProductDetails.name}</h1>
                <button className="savings-product-details-edit">
                    <FaEdit onClick={handleEdit} /> Edit
                </button>
            </div>
            <div className="savings-product-details-content">
                <div className="savings-product-details-section">
                    <h2 className="savings-product-details-section-title">Details</h2>
                    <div className="savings-product-details-row">
                        <strong>Name:</strong>
                        <p>{savingsProductDetails.name}</p>
                    </div>
                    <div className="savings-product-details-row">
                        <strong>Short Name:</strong>
                        <p>{savingsProductDetails.shortName}</p>
                    </div>
                </div>

                <div className="savings-product-details-section">
                    <h2 className="savings-product-details-section-title">Currency</h2>
                    <div className="savings-product-details-row">
                        <strong>Currency:</strong>
                        <p>{savingsProductDetails.currency?.code}</p>
                    </div>
                    <div className="savings-product-details-row">
                        <strong>Decimal Places:</strong>
                        <p>{savingsProductDetails.currency?.decimalPlaces}</p>
                    </div>
                    <div className="savings-product-details-row">
                        <strong>Currency in Multiples of:</strong>
                        <p>{savingsProductDetails.currency?.inMultiplesOf}</p>
                    </div>
                </div>

                <div className="savings-product-details-section">
                    <h2 className="savings-product-details-section-title">Terms</h2>
                    <div className="savings-product-details-row">
                        <strong>Nominal Annual Interest:</strong>
                        <p>{savingsProductDetails.nominalAnnualInterestRate}%</p>
                    </div>
                    <div className="savings-product-details-row">
                        <strong>Interest Compounding Period:</strong>
                        <p>{savingsProductDetails.interestCompoundingPeriodType?.value}</p>
                    </div>
                    <div className="savings-product-details-row">
                        <strong>Interest Posting Period:</strong>
                        <p>{savingsProductDetails.interestPostingPeriodType?.value}</p>
                    </div>
                    <div className="savings-product-details-row">
                        <strong>Interest Calculated Using:</strong>
                        <p>{savingsProductDetails.interestCalculationType?.value}</p>
                    </div>
                    <div className="savings-product-details-row">
                        <strong>Days in Year:</strong>
                        <p>{savingsProductDetails.interestCalculationDaysInYearType?.value}</p>
                    </div>
                </div>

                <div className="savings-product-details-section">
                    <h2 className="savings-product-details-section-title">Settings</h2>
                    <div className="savings-product-details-row">
                        <strong>Apply Withdrawal Fee for Transfers:</strong>
                        <p>{savingsProductDetails.withdrawalFeeForTransfers ? 'Yes' : 'No'}</p>
                    </div>
                    <div className="savings-product-details-row">
                        <strong>Enforce Minimum Balance:</strong>
                        <p>{savingsProductDetails.enforceMinRequiredBalance ? 'Yes' : 'No'}</p>
                    </div>
                    <div className="savings-product-details-row">
                        <strong>Withhold Tax is Applicable:</strong>
                        <p>{savingsProductDetails.withHoldTax ? 'Yes' : 'No'}</p>
                    </div>
                    <div className="savings-product-details-row">
                        <strong>Is Overdraft Allowed:</strong>
                        <p>{savingsProductDetails.allowOverdraft ? 'Yes' : 'No'}</p>
                    </div>
                    <div className="savings-product-details-row">
                        <strong>Maximum Overdraft Amount Limit:</strong>
                        <p>{savingsProductDetails.overdraftLimit}</p>
                    </div>
                    <div className="savings-product-details-row">
                        <strong>Enable Dormancy Tracking:</strong>
                        <p>{savingsProductDetails.isDormancyTrackingActive ? 'Yes' : 'No'}</p>
                    </div>
                    <div className="savings-product-details-row">
                        <strong>Number of Days to Inactive sub-status:</strong>
                        <p>{savingsProductDetails.daysToInactive}</p>
                    </div>
                    <div className="savings-product-details-row">
                        <strong>Number of Days to Dormant sub-status:</strong>
                        <p>{savingsProductDetails.daysToDormancy}</p>
                    </div>
                    <div className="savings-product-details-row">
                        <strong>Number of Days to Escheat:</strong>
                        <p>{savingsProductDetails.daysToEscheat}</p>
                    </div>
                </div>

                <div className="savings-product-details-section">
                    <h2 className="savings-product-details-section-title">Charges</h2>
                    <table className="savings-product-details-charges-table">
                        <thead>
                        <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Collected On</th>
                        </tr>
                        </thead>
                        <tbody>
                        {savingsProductDetails.charges?.length > 0 ? (
                            savingsProductDetails.charges.map((charge) => (
                                <tr key={charge.id}>
                                    <td>{charge.name}</td>
                                    <td>{charge.chargeCalculationType.value }</td>
                                    <td>{charge.amount || ''}</td>
                                    <td>{charge.chargeTimeType.value || ''}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4">No charges available</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                <div className="savings-product-details-section">
                    <h2 className="savings-product-details-section-title">Accounting</h2>
                    <div className="savings-product-details-row">
                        <strong>Type:</strong>
                        <p>{savingsProductDetails.accountingRule?.value}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SavingsProductDetails;
