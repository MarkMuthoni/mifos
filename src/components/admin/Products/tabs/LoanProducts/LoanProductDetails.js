import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { FaDownload, FaEdit } from 'react-icons/fa';
import { API_CONFIG } from '../../../../../config';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import './LoanProductDetails.css';
import {NotificationContext} from "../../../../../context/NotificationContext";

const LoanProductDetails = ({ loanProductId, onClose, onEdit }) => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const [loanProductDetails, setLoanProductDetails] = useState(null);

    useEffect(() => {
        const fetchLoanProductDetails = async () => {
            startLoading();
            try {
                const headers = {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                };

                const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/loanproducts/${loanProductId}?template=false`, { headers });
                setLoanProductDetails(response.data);
            } catch (error) {
                console.error('Error fetching loan product details:', error);
                showNotification('Error fetching loan product details:', 'error');
            } finally {
                stopLoading();
            }
        };

        fetchLoanProductDetails();
    }, [loanProductId, user]);

    const handleExport = () => {
        const blob = new Blob([JSON.stringify(loanProductDetails, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${loanProductDetails.name || 'loan-product-details'}.json`;
        link.click();
    };

    const handleEdit = () => {
        onEdit(loanProductDetails);
        onClose();
    }

    if (!loanProductDetails) {
        return <div className="loan-product-details-container">Loading...</div>;
    }

    return (
        <div className="loan-product-details-container">
            <div className="loan-product-details-header">
                <h1 className="loan-product-details-title">{loanProductDetails.name}</h1>
                <div className="loan-product-details-actions">
                    <button className="loan-product-details-export"
                            onClick={handleExport}><FaDownload /> Export</button>
                    <button className="loan-product-details-edit"
                            onClick={handleEdit}
                    ><FaEdit /> Edit</button>
                </div>
            </div>
            <div className="loan-product-details-content">
                <div className="loan-product-details-section">
                    <h2 className="loan-product-details-section-title">Details</h2>
                    <div className="loan-product-details-row"><strong>Name:</strong><p>{loanProductDetails.name}</p></div>
                    <div className="loan-product-details-row"><strong>Short Name:</strong><p>{loanProductDetails.shortName}</p></div>
                    <div className="loan-product-details-row"><strong>Include in Customer Loan Counter:</strong><p>{loanProductDetails.includeInBorrowerCycle ? 'Yes' : 'No'}</p></div>
                </div>

                <div className="loan-product-details-section">
                    <h2 className="loan-product-details-section-title">Currency</h2>
                    <div className="loan-product-details-row"><strong>Currency:</strong><p>{loanProductDetails.currency?.code}</p></div>
                    <div className="loan-product-details-row"><strong>Currency Name:</strong><p>{loanProductDetails.currency?.name}</p></div>
                    <div className="loan-product-details-row"><strong>Decimal Places:</strong><p>{loanProductDetails.currency?.decimalPlaces}</p></div>
                    <div className="loan-product-details-row"><strong>Currency in Multiples of:</strong><p>{loanProductDetails.currency?.inMultiplesOf}</p></div>
                    <div className="loan-product-details-row"><strong>Installment in Multiples of:</strong><p>{loanProductDetails.installmentAmountInMultiplesOf}</p></div>
                </div>

                <div className="loan-product-details-section">
                    <h2 className="loan-product-details-section-title">Terms</h2>
                    <div className="loan-product-details-row"><strong>Principal:</strong><p>{loanProductDetails.principal}</p></div>
                    <div className="loan-product-details-row"><strong>Allow Approved/Disbursed Amounts Over Applied:</strong><p>{loanProductDetails.allowApprovedDisbursedAmountsOverApplied ? 'Yes' : 'No'}</p></div>
                    <div className="loan-product-details-row"><strong>Installment Day Calculation From:</strong><p>{loanProductDetails.repaymentFrequencyType?.value}</p></div>
                    <div className="loan-product-details-row"><strong>Number of Repayments:</strong><p>{loanProductDetails.numberOfRepayments}</p></div>
                    <div className="loan-product-details-row"><strong>Linked to Floating Interest Rates:</strong><p>{loanProductDetails.isLinkedToFloatingInterestRates ? 'Yes' : 'No'}</p></div>
                    <div className="loan-product-details-row"><strong>Nominal Interest Rate:</strong><p>{loanProductDetails.annualInterestRate}%</p></div>
                    <div className="loan-product-details-row"><strong>Terms Vary Based on Loan Cycle:</strong><p>{loanProductDetails.useBorrowerCycle ? 'Yes' : 'No'}</p></div>
                    <div className="loan-product-details-row"><strong>Repay Every:</strong><p>{loanProductDetails.repaymentEvery} {loanProductDetails.repaymentFrequencyType?.value}</p></div>
                </div>

                <div className="loan-product-details-section">
                    <h2 className="loan-product-details-section-title">Settings</h2>
                    <div className="loan-product-details-row"><strong>Amortization:</strong><p>{loanProductDetails.amortizationType?.value}</p></div>
                    <div className="loan-product-details-row"><strong>Is Equal Amortization?:</strong><p>{loanProductDetails.isEqualAmortization ? 'Yes' : 'No'}</p></div>
                    <div className="loan-product-details-row"><strong>Interest Method:</strong><p>{loanProductDetails.interestType?.value}</p></div>
                    <div className="loan-product-details-row"><strong>Interest Calculation Period:</strong><p>{loanProductDetails.interestCalculationPeriodType?.value}</p></div>
                </div>

                <div className="loan-product-details-section">
                    <h2 className="loan-product-details-section-title">Loan Schedule</h2>
                    <div className="loan-product-details-row"><strong>Loan Schedule Type:</strong><p>{loanProductDetails.loanScheduleType?.value}</p></div>
                    <div className="loan-product-details-row"><strong>Repayment Strategy:</strong><p>{loanProductDetails.transactionProcessingStrategyName}</p></div>
                </div>

                <div className="loan-product-details-section">
                    <h2 className="loan-product-details-section-title">Down Payments</h2>
                    <div className="loan-product-details-row"><strong>Enable Down Payments:</strong><p>{loanProductDetails.enableDownPayment ? 'Yes' : 'No'}</p></div>
                </div>

                <div className="loan-product-details-section">
                    <h2 className="loan-product-details-section-title">Moratorium</h2>
                    <div className="loan-product-details-row"><strong>Delinquency Bucket:</strong><p>{loanProductDetails.delinquencyBucket?.ranges?.length > 0 ? 'Configured' : 'Not Configured'}</p></div>
                    <div className="loan-product-details-row"><strong>Enable Installment Level Delinquency:</strong><p>{loanProductDetails.enableInstallmentLevelDelinquency ? 'Yes' : 'No'}</p></div>
                    <div className="loan-product-details-row"><strong>Arrears Tolerance:</strong><p>{loanProductDetails.inArrearsTolerance}</p></div>
                    <div className="loan-product-details-row"><strong>Days in Year:</strong><p>{loanProductDetails.daysInYearType?.value}</p></div>
                    <div className="loan-product-details-row"><strong>Days in Month:</strong><p>{loanProductDetails.daysInMonthType?.value}</p></div>
                    <div className="loan-product-details-row"><strong>Allow Fixing of the Installment Amount:</strong><p>{loanProductDetails.canDefineInstallmentAmount ? 'Yes' : 'No'}</p></div>
                    <div className="loan-product-details-row"><strong>Number of Days Overdue Before Moving Into Arrears:</strong><p>{loanProductDetails.graceOnArrearsAgeing}</p></div>
                    <div className="loan-product-details-row"><strong>Maximum Overdue Days Before Becoming NPA:</strong><p>{loanProductDetails.overdueDaysForNPA}</p></div>
                    <div className="loan-product-details-row"><strong>Account Moves Out of NPA Only After All Arrears Cleared:</strong><p>{loanProductDetails.accountMovesOutOfNPAOnlyOnArrearsCompletion ? 'Yes' : 'No'}</p></div>
                    <div className="loan-product-details-row"><strong>Variable Installments Allowed:</strong><p>{loanProductDetails.allowVariableInstallments ? 'Yes' : 'No'}</p></div>
                    <div className="loan-product-details-row"><strong>Allowed for Top-Up Loans:</strong><p>{loanProductDetails.canUseForTopup ? 'Yes' : 'No'}</p></div>
                </div>

                <div className="loan-product-details-section">
                    <h2 className="loan-product-details-section-title">Interest Recalculation</h2>
                    <div className="loan-product-details-row"><strong>Recalculate Interest:</strong><p>{loanProductDetails.isInterestRecalculationEnabled ? 'Yes' : 'No'}</p></div>
                </div>

                <div className="loan-product-details-section">
                    <h2 className="loan-product-details-section-title">Guarantee Requirements</h2>
                    <div className="loan-product-details-row"><strong>Place Guarantee Funds On-Hold:</strong><p>{loanProductDetails.holdGuaranteeFunds ? 'Yes' : 'No'}</p></div>
                </div>

                <div className="loan-product-details-section">
                    <h2 className="loan-product-details-section-title">Loan Tranche Details</h2>
                    <div className="loan-product-details-row"><strong>Enable Multiple Disbursals:</strong><p>{loanProductDetails.multiDisburseLoan ? 'Yes' : 'No'}</p></div>
                </div>

                <div className="loan-product-details-section">
                    <h2 className="loan-product-details-section-title">Event Settings</h2>
                    <div className="loan-product-details-row"><strong>Use Global Configurations for Repayment Event Notifications:</strong><p>{loanProductDetails.syncExpectedWithDisbursementDate ? 'Yes' : 'No'}</p></div>
                    <div className="loan-product-details-row"><strong>Due Days for Repayment Event:</strong><p>{loanProductDetails.dueDaysForRepaymentEvent}</p></div>
                    <div className="loan-product-details-row"><strong>Overdue Days for Repayment Event:</strong><p>{loanProductDetails.overDueDaysForRepaymentEvent}</p></div>
                </div>

                <div className="loan-product-details-section">
                    <h2 className="loan-product-details-section-title">Configurable Terms and Settings</h2>
                    <div className="loan-product-details-row"><strong>Allow Overriding Select Terms and Settings:</strong><p>{loanProductDetails.allowAttributeOverrides?.amortizationType ? 'Yes' : 'No'}</p></div>
                    <div className="loan-product-details-row"><strong>Amortization:</strong><p>{loanProductDetails.allowAttributeOverrides?.amortizationType ? 'Yes' : 'No'}</p></div>
                    <div className="loan-product-details-row"><strong>Interest Method:</strong><p>{loanProductDetails.allowAttributeOverrides?.interestType ? 'Yes' : 'No'}</p></div>
                    <div className="loan-product-details-row"><strong>Repayment Strategy:</strong><p>{loanProductDetails.allowAttributeOverrides?.transactionProcessingStrategyCode ? 'Yes' : 'No'}</p></div>
                    <div className="loan-product-details-row"><strong>Interest Calculation Period:</strong><p>{loanProductDetails.allowAttributeOverrides?.interestCalculationPeriodType ? 'Yes' : 'No'}</p></div>
                    <div className="loan-product-details-row"><strong>Arrears Tolerance:</strong><p>{loanProductDetails.allowAttributeOverrides?.inArrearsTolerance ? 'Yes' : 'No'}</p></div>
                    <div className="loan-product-details-row"><strong>Repay Every:</strong><p>{loanProductDetails.allowAttributeOverrides?.repaymentEvery ? 'Yes' : 'No'}</p></div>
                    <div className="loan-product-details-row"><strong>Moratorium:</strong><p>{loanProductDetails.allowAttributeOverrides?.graceOnArrearsAgeing ? 'Yes' : 'No'}</p></div>
                    <div className="loan-product-details-row"><strong>Number of Days Overdue Before Moving Into Arrears:</strong><p>{loanProductDetails.allowAttributeOverrides?.overdueDaysForNPA ? 'Yes' : 'No'}</p></div>
                </div>

                <div className="loan-product-details-section">
                    <h2 className="loan-product-details-section-title">Accounting</h2>
                    <div className="loan-product-details-row"><strong>Type:</strong><p>{loanProductDetails.accountingRule?.value}</p></div>
                </div>
            </div>
        </div>
    );
};

export default LoanProductDetails;