import React, { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../../../context/AuthContext";
import { useLoading } from "../../../../context/LoadingContext";
import { API_CONFIG } from "../../../../config";

const CollateralDetails = () => {
    const { clientId, collateralId } = useParams();
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const navigate = useNavigate();

    const [collateralDetails, setCollateralDetails] = useState(null);
    const [clientDetails, setClientDetails] = useState(null);
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        fetchCollateralData();
    }, [collateralId]);

    const fetchCollateralData = async () => {
        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };

            const clientResponse = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/clients/${clientId}`,
                { headers }
            );
            setClientDetails(clientResponse.data);

            const collateralResponse = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/clients/${clientId}/collaterals/${collateralId}`,
                { headers }
            );
            setCollateralDetails(collateralResponse.data);
        } catch (error) {
            console.error("Error fetching collateral details:", error);
        } finally {
            stopLoading();
        }
    };

    const handleToggleDropdown = () => {
        setDropdownOpen((prev) => !prev);
    };

    const handleOutsideClick = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setDropdownOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleOutsideClick);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, []);

    const handleBreadcrumbNavigation = () => {
        navigate("/clients", {
            state: {
                clientId: clientId,
                clientName: clientDetails?.displayName || "Client Details",
                preventDuplicate: true,
            },
        });
    };

    return (
        <div className="users-page-screen neighbor-element">
            <h2 className="users-page-head">
                <Link to="/dashboard" className="breadcrumb-link">Dashboard</Link>{' '}
                <span
                    className="breadcrumb-link"
                    onClick={handleBreadcrumbNavigation}
                >
                    . {' '} {clientDetails?.displayName || "Collateral Details"}
                </span>{' '}
                . Collateral Details
            </h2>
            <div className="client-details-header">
                <div className="client-info-section">
                    <ul className="client-info-list">
                        <li>
                            <span className="client-info-label">Name:</span>
                            <span className="client-info-value">
                                {collateralDetails?.name || "N/A"}
                            </span>
                        </li>
                        <li>
                            <span className="client-info-label">Quantity:</span>
                            <span className="client-info-value">
                                {collateralDetails?.quantity || "N/A"}
                            </span>
                        </li>
                        <li>
                            <span className="client-info-label">Total Value:</span>
                            <span className="client-info-value">
                                {collateralDetails?.total || "N/A"}
                            </span>
                        </li>
                        <li>
                            <span className="client-info-label">Total Collateral Value:</span>
                            <span className="client-info-value">
                                {collateralDetails?.totalCollateral || "N/A"}
                            </span>
                        </li>
                    </ul>
                </div>

                <div className="actions-dropdown" ref={dropdownRef}>
                    <button className="actions-dropdown-toggle" onClick={handleToggleDropdown}>
                        Actions
                    </button>
                    {isDropdownOpen && (
                        <div className="actions-dropdown-menu">
                            <button className="dropdown-item">Edit</button>
                            <button className="dropdown-item">Delete</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="client-tab-content">
                <div className="general-tab">
                    <h3 className="general-section-title">Transaction Details</h3>
                    <table className="general-charges-table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Last Repayment</th>
                            <th>Remaining Amount</th>
                            <th>Last Repayment Date</th>
                        </tr>
                        </thead>
                        <tbody>
                        {collateralDetails?.loanTransactionData?.length > 0 ? (
                            collateralDetails.loanTransactionData.map((transaction) => (
                                <tr key={transaction.id}>
                                    <td>{transaction.id}</td>
                                    <td>{transaction.lastRepayment || "N/A"}</td>
                                    <td>{transaction.remainingAmount || "N/A"}</td>
                                    <td>
                                        {transaction.lastRepaymentDate
                                            ? new Date(transaction.lastRepaymentDate).toLocaleDateString()
                                            : "N/A"}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4">No transactions available.</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CollateralDetails;
