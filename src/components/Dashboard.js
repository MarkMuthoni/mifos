import React, {useContext, useEffect, useRef, useState} from 'react';
import {useNavigate} from "react-router-dom";
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { useLoading } from '../context/LoadingContext';
import {FaUser, FaExclamationTriangle, FaChartLine, FaBalanceScale, FaHandHoldingUsd, FaMoneyCheckAlt, FaUsers, FaUserPlus} from 'react-icons/fa';
import './Dashboard.css';
import {API_CONFIG} from "../config";
import Sidebar from "./Navigation/Sidebar";
import axios from "axios";
import Insights from "../components/Insights";

const Dashboard = () => {
    const { isAuthenticated, user } = useContext(AuthContext);
    const { componentVisibility } = useContext(AuthContext);
    const navigate = useNavigate();
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const [dashboardData, setDashboardData] = useState({
        totalClients: 0, activeClients: 0, inactiveClients: 0, newClients: 0,
        principalOutstanding: 0, interestOutstanding: 0, totalOutstanding: 0, interestThisMonth: 0,
        principalOverdue: 0, interestOverdue: 0, totalOverdue: 0, nonPerformingAssets: 0, savingsCount: 0,
        loansForApproval: 0, loansForDisapproval: 0, portfolioAtRisk: 0, todaysDisbursementsCount: 0,
        borrowersPerLoanOfficer: 0, averageLoanDisbursed: 0, clientsPerPersonnel: 0, todaysDisbursements: 0, thisMonthsDisbursementsCount: 0,
        countPrincipalOutstanding: 0, countPrincipalOverdue: 0, countInterestOverdue: 0, countTotalOverdue: 0, countNonPerformingAssets: 0,
        countLoansForApproval: 0, countLoansForDisapproval: 0, countInterestOutstanding: 0
    });
    const [selectedOffice, setSelectedOffice] = useState(user?.officeId);
    const [officeOptions, setOfficeOptions] = useState([]);
    const [activeTab, setActiveTab] = useState('metrics');
    const activeClientsRef = useRef(0);

    useEffect(() => {
        if (!isAuthenticated) {
            showNotification('Kindly Login to access our services!', 'error');
            navigate('/login');
        }
    }, [isAuthenticated, navigate, showNotification]);

    useEffect(() => {
        const fetchOffices = async () => {
            startLoading();
            try {
                const AUTH_TOKEN = user.base64EncodedAuthenticationKey;
                const headers = {
                    'Authorization': `Basic ${AUTH_TOKEN}`,
                    'Content-Type': 'application/json',
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                };

                const response = await axios.get(`/fineract-provider/api/v1/offices`, { headers });
                const offices = response.data || [];
                setOfficeOptions(offices);

                if (user.officeId === 1) {
                    setSelectedOffice("all");
                }
            } catch (error) {
                console.error("Error fetching offices:", error);
            } finally {
                stopLoading();
            }
        };

        fetchOffices();

    }, []);

    const formatCurrency = (value, currencyCode, currencySymbol, decimalPlaces) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: decimalPlaces
        }).format(value).replace(currencyCode, currencySymbol);
    };

    useEffect(() => {
        let isMounted = true;

        if (user) {
            const AUTH_TOKEN = user.base64EncodedAuthenticationKey;
            const headers = {
                'Authorization': `Basic ${AUTH_TOKEN}`,
                'Content-Type': 'application/json',
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
            };

            const fetchClientData = async () => {
                startLoading();
                try {
                    const officeFilter = selectedOffice && selectedOffice !== "all" ? `&officeId=${selectedOffice}` : "";
                    const response = await axios.get(`/fineract-provider/api/v1/clients?${officeFilter}`, { headers });
                    const staffResponse = await axios.get(`/fineract-provider/api/v1/staff`, { headers });
                    const loansResponse = await axios.get(`/fineract-provider/api/v1/loans`, { headers });
                    const currencyResponse = await axios.get(`/fineract-provider/api/v1/currencies`, { headers });

                    const defaultCurrency = currencyResponse.data.selectedCurrencyOptions[0] || {};
                    const { code: currencyCode, code: currencySymbol, decimalPlaces } = defaultCurrency;

                    const staff = staffResponse.data;
                    const loans = loansResponse.data.pageItems;
                    const clients = response.data.pageItems;

                    const filteredClients =
                        selectedOffice && selectedOffice !== "all"
                            ? clients.filter(client => client.officeId === parseInt(selectedOffice))
                            : clients;

                    const activeClients = filteredClients.filter(client => client.status.value === "Active").length;
                    const inactiveClients = filteredClients.filter(client =>
                        ["Inactive", "Closed", "Withdrawn"].includes(client.status.value)
                    ).length;
                    const newClients = filteredClients.filter(client => client.status.value === "Pending").length;
                    activeClientsRef.current = activeClients;

                    // const activeLoans = loans.filter(loan => loan.status.active).length;
                    // const loanOfficers = staff.filter(member => member.isLoanOfficer && member.isActive);

                    const activeLoanClients = filteredClients.filter(client =>
                        loans.some(loan => loan.clientId === client.id && loan.status.active)
                    ).length;

                    const loanOfficersInOffice = selectedOffice && selectedOffice !== "all"
                        ? staff.filter(member => member.isLoanOfficer && member.isActive && member.officeId === parseInt(selectedOffice))
                        : staff.filter(member => member.isLoanOfficer && member.isActive);

                    const borrowersPerLoanOfficer =
                        loanOfficersInOffice.length > 0
                            ? Math.round(activeLoanClients / loanOfficersInOffice.length)
                            : 'N/A';

                    const clientsPerPersonnel =
                        officeOptions.length > 0
                            ? Math.round(filteredClients.length / officeOptions.length)
                            : 'N/A';

                    const averageClientsPerLoanOfficer =
                        loanOfficersInOffice.length > 0
                            ? Math.round(filteredClients.length / loanOfficersInOffice.length)
                            : 'N/A';

                    const getTodaysDisbursements = (loans) => {
                        const today = new Date();
                        const filteredLoans = loans.filter((loan) => {
                            const disbursementDateArray = loan.timeline?.actualDisbursementDate;
                            if (!Array.isArray(disbursementDateArray) || disbursementDateArray.length < 3) {
                                return false;
                            }

                            const [year, month, day] = disbursementDateArray;
                            const disbursementDate = new Date(year, month - 1, day);
                            return (
                                disbursementDate.getFullYear() === today.getFullYear() &&
                                disbursementDate.getMonth() === today.getMonth() &&
                                disbursementDate.getDate() === today.getDate()
                            );
                        });

                        return {
                            total: filteredLoans.reduce((sum, loan) => sum + loan.principal, 0),
                            count: filteredLoans.length,
                        };
                    };

                    const getThisMonthsDisbursements = (loans) => {
                        const today = new Date();
                        const filteredLoans = loans.filter(loan => {
                            const disbursementDateArray = loan.timeline?.actualDisbursementDate;
                            if (!Array.isArray(disbursementDateArray) || disbursementDateArray.length < 2) {
                                return false;
                            }

                            const [year, month] = disbursementDateArray;
                            return (
                                year === today.getFullYear() &&
                                month === today.getMonth() + 1
                            );
                        });

                        const count = filteredLoans.length;

                        return {
                            total: filteredLoans.reduce((sum, loan) => sum + loan.principal, 0),
                            count: count,
                        };
                    };

                    const todaysDisbursementData = getTodaysDisbursements(loans);
                    const thisMonthsDisbursementData = getThisMonthsDisbursements(loans);

                    const todaysDisbursements = formatCurrency(todaysDisbursementData.total, currencyCode, currencySymbol, decimalPlaces);
                    const todaysDisbursementsCount = todaysDisbursementData.count;

                    const thisMonthsDisbursements = formatCurrency(thisMonthsDisbursementData.total, currencyCode, currencySymbol, decimalPlaces);
                    const thisMonthsDisbursementsCount = thisMonthsDisbursementData.count;

                    const repaymentsToday = calculateRepaymentsToday(loans);

                    return {
                        totalClients: filteredClients.length,
                        activeClients,
                        inactiveClients,
                        newClients,
                        borrowersPerLoanOfficer,
                        clientsPerPersonnel,
                        averageClientsPerLoanOfficer,
                        todaysDisbursements,
                        todaysDisbursementsCount,
                        thisMonthsDisbursements,
                        thisMonthsDisbursementsCount,
                        repaymentsToday,
                    };
                } catch (error) {
                    console.error("Error fetching client data:", error);
                    throw error;
                } finally {
                    stopLoading();
                }
            };

            const calculateTotalSavings = (savingsResponse) => {
                let total = 0;
                let savingsCount = 0;

                if (Array.isArray(savingsResponse)) {
                    savingsResponse.forEach((account) => {
                        const accountBalance = account.summary?.accountBalance;

                        if (accountBalance !== undefined) {
                            const parsedBalance = parseInt(accountBalance, 10);

                            if (!isNaN(parsedBalance)) {
                                total += parsedBalance;
                                savingsCount++;
                            }
                        }
                    });
                }

                return { total, savingsCount };
            };

            const calculateSavingsMobilizedThisMonth = (savingsResponse) => {
                const today = new Date();
                const currentMonth = today.getMonth();
                const currentYear = today.getFullYear();

                return savingsResponse.filter((account) => {
                    const [year, month] = account.timeline.submittedOnDate;
                    return (
                        year === currentYear && month - 1 === currentMonth
                    );
                }).length;
            };

            const calculateRepaymentsToday = (loans) => {
                const today = new Date();
                let repaymentCount = 0;

                loans.forEach((loan) => {
                    const {
                        status,
                        timeline,
                        numberOfRepayments,
                        repaymentEvery,
                        repaymentFrequencyType,
                    } = loan;

                    if (
                        status.active &&
                        timeline.actualDisbursementDate &&
                        Array.isArray(timeline.actualDisbursementDate)
                    ) {
                        const disbursementDate = new Date(
                            timeline.actualDisbursementDate[0],
                            timeline.actualDisbursementDate[1] - 1,
                            timeline.actualDisbursementDate[2]
                        );

                        const repaymentDates = [];
                        for (let i = 0; i < numberOfRepayments; i++) {
                            const nextRepayment = new Date(disbursementDate);

                            switch (repaymentFrequencyType.value) {
                                case "Days":
                                    nextRepayment.setDate(
                                        disbursementDate.getDate() + i * repaymentEvery
                                    );
                                    break;
                                case "Months":
                                    nextRepayment.setMonth(
                                        disbursementDate.getMonth() + i * repaymentEvery
                                    );
                                    break;
                                case "Years":
                                    nextRepayment.setFullYear(
                                        disbursementDate.getFullYear() + i * repaymentEvery
                                    );

                                    break;
                            }

                            repaymentDates.push(nextRepayment);
                        }

                        repaymentDates.forEach((repaymentDate) => {
                            if (
                                repaymentDate.getDate() === today.getDate() &&
                                repaymentDate.getMonth() === today.getMonth() &&
                                repaymentDate.getFullYear() === today.getFullYear()
                            ) {
                                repaymentCount++;
                            }
                        });
                    }
                });

                return repaymentCount;
            };

            const fetchLoanData = async (activeClients) => {
                startLoading();
                try {
                    const officeFilter = selectedOffice && selectedOffice !== "all" ? `&officeId=${selectedOffice}` : "";
                    const response = await axios.get(`/fineract-provider/api/v1/loans?${officeFilter}`, { headers });
                    const currencyResponse = await axios.get(`/fineract-provider/api/v1/currencies`, { headers });
                    const savingsResponse = await axios.get(`/fineract-provider/api/v1/savingsaccounts`, { headers });

                    const defaultCurrency = currencyResponse.data.selectedCurrencyOptions[0] || {};
                    const { code: currencyCode, code: currencySymbol, decimalPlaces } = defaultCurrency;

                    const loans = response.data.pageItems;
                    const savings = savingsResponse.data.pageItems;

                    const filteredLoans =
                        selectedOffice && selectedOffice !== "all"
                            ? loans.filter(loan => loan.clientOfficeId === parseInt(selectedOffice))
                            : loans;

                    let totalDisbursedAmount = 0;
                    let disbursedLoansCount = 0;

                    let totalPrincipalOutstanding = 0;
                    let totalInterestOutstanding = 0;
                    let totalPrincipalOverdue = 0;
                    let totalInterestOverdue = 0;
                    let totalInterestThisMonth = 0;
                    let totalOverdue = 0;
                    let nonPerformingAssets = 0;
                    let loansForApproval = 0;
                    let loansForDisapproval = 0;

                    let countPrincipalOutstanding = 0, countPrincipalOverdue = 0, countInterestOverdue = 0,
                        countTotalOverdue = 0, countNonPerformingAssets = 0,
                        countLoansForApproval = 0, countLoansForDisapproval = 0, countInterestOutstanding = 0;

                    const today = new Date();
                    const thisMonthLoans = filteredLoans.filter(loan => {
                        const disbursementDateArray = loan.timeline?.actualDisbursementDate;
                        if (!Array.isArray(disbursementDateArray) || disbursementDateArray.length < 3) {
                            return false;
                        }

                        const [year, month] = disbursementDateArray;
                        return (
                            year === today.getFullYear() &&
                            month === today.getMonth() + 1
                        );
                    });

                    thisMonthLoans.forEach(loan => {
                        const summary = loan.summary || {};
                        if (summary.interestCharged) {
                            totalInterestThisMonth += summary.interestCharged;
                        }
                    });

                    filteredLoans.forEach(loan => {
                        const summary = loan.summary || {};
                        if (summary.principalOutstanding) {
                            totalPrincipalOutstanding += summary.principalOutstanding;
                            countPrincipalOutstanding++;
                        }
                        // totalPrincipalOutstanding += summary.principalOutstanding || 0;
                        if (summary.interestOutstanding) {
                            totalInterestOutstanding += summary.interestOutstanding;
                            countInterestOutstanding ++;
                        }
                        if (summary.principalOverdue) {
                            totalPrincipalOverdue += summary.principalOverdue;
                            countPrincipalOverdue++;
                        }
                        // totalInterestOutstanding += summary.interestOutstanding || 0;
                        // totalPrincipalOverdue += summary.principalOverdue || 0;
                        if (summary.interestOverdue) {
                            totalInterestOverdue += summary.interestOverdue;
                            countInterestOverdue++;
                        }
                        // if (summary.interestCharged) {
                        //     totalInterestThisMonth += summary.interestCharged;
                        // }
                        if (summary.totalOverdue) {
                            totalOverdue += summary.totalOverdue;
                            countTotalOverdue++;
                        }
                        // totalInterestOverdue += summary.interestOverdue || 0;
                        // totalInterestThisMonth += summary.interestCharged || 0;
                        // totalOverdue += summary.totalOverdue || 0;

                        if (loan.isNPA) {
                            nonPerformingAssets++;
                            countNonPerformingAssets++;
                        }
                        if (loan.status?.pendingApproval && loan.principal) {
                            loansForApproval += loan.principal;
                            countLoansForApproval++;
                        }
                        if (loan.status?.waitingForDisbursal && loan.principal) {
                            loansForDisapproval += loan.principal;
                            countLoansForDisapproval++;
                        }

                        if (loan.principal) {
                            totalDisbursedAmount += loan.principal;
                            disbursedLoansCount++;
                        }

                        // if (loan.isNPA) nonPerformingAssets++;
                        // if (loan.status.pendingApproval) loansForApproval += loan.principal;
                        // if (loan.status?.waitingForDisbursal) loansForDisapproval += loan.principal;

                        // totalDisbursedAmount += loan.principal || 0;
                        // disbursedLoansCount++;
                    });

                    const portfolioAtRisk =
                        totalPrincipalOutstanding > 0
                            ? ((totalPrincipalOverdue / totalPrincipalOutstanding) * 100).toFixed(2) + '%'
                            : '';


                    const totalOutstandingCalc = totalPrincipalOutstanding + totalInterestOutstanding;

                    const { total: totalSavings, savingsCount } = calculateTotalSavings(savings);

                    const totalSavingsMobilizedThisMonth = calculateSavingsMobilizedThisMonth(savings);

                    const averageLoanDisbursed =
                        activeClients > 0
                            ? formatCurrency(totalOutstandingCalc / activeClients, currencyCode, currencySymbol, decimalPlaces)
                            : formatCurrency(0, currencyCode, currencySymbol, decimalPlaces);


                    return {
                        principalOutstanding: formatCurrency(totalPrincipalOutstanding, currencyCode, currencySymbol, decimalPlaces),
                        interestOutstanding: formatCurrency(totalInterestOutstanding, currencyCode, currencySymbol, decimalPlaces),
                        totalOutstanding: formatCurrency(totalOutstandingCalc, currencyCode, currencySymbol, decimalPlaces),
                        interestThisMonth: formatCurrency(totalInterestThisMonth, currencyCode, currencySymbol, decimalPlaces),
                        principalOverdue: formatCurrency(totalPrincipalOverdue, currencyCode, currencySymbol, decimalPlaces),
                        interestOverdue: formatCurrency(totalInterestOverdue, currencyCode, currencySymbol, decimalPlaces),
                        totalOverdue: formatCurrency(totalOverdue, currencyCode, currencySymbol, decimalPlaces),
                        totalSavings: formatCurrency(totalSavings, currencyCode, currencySymbol, decimalPlaces),
                        totalSavingsMobilizedThisMonth: totalSavingsMobilizedThisMonth,
                        nonPerformingAssets,
                        loansForApproval: formatCurrency(loansForApproval, currencyCode, currencySymbol, decimalPlaces),
                        loansForDisapproval: formatCurrency(loansForDisapproval, currencyCode, currencySymbol, decimalPlaces),
                        portfolioAtRisk,
                        averageLoanDisbursed,
                        savingsCount,

                        countPrincipalOutstanding,
                        countPrincipalOverdue,
                        countInterestOverdue,
                        countTotalOverdue,
                        countNonPerformingAssets,
                        countLoansForApproval,
                        countLoansForDisapproval,
                        countInterestOutstanding
                    };
                } catch (error) {
                    console.error("Error fetching loan data:", error);
                    throw error;
                } finally {
                    stopLoading();
                }
            };

            const fetchData = async () => {
                startLoading();
                try {
                    const clientData = await fetchClientData();
                    const loanData = await fetchLoanData(clientData.activeClients);
                    if (isMounted) {
                        setDashboardData(prev => ({
                            ...prev,
                            ...clientData,
                            ...loanData,
                        }));
                    }
                } catch (error) {
                    console.error("Error fetching data:", error);
                } finally {
                    if (isMounted) {
                        stopLoading();
                    }
                }
            };

            fetchData();

            return () => {
                isMounted = false;
            };
        }
    }, [user, selectedOffice]);

    const {
        totalClients, activeClients, inactiveClients, newClients, savingsCount,
        principalOutstanding, interestOutstanding, totalOutstanding, interestThisMonth,
        principalOverdue, interestOverdue, totalOverdue, nonPerformingAssets, loansForApproval, loansForDisapproval,
        portfolioAtRisk, borrowersPerLoanOfficer, averageLoanDisbursed, clientsPerPersonnel, averageClientsPerLoanOfficer,
        todaysDisbursements, thisMonthsDisbursements, repaymentsToday, totalSavings, totalSavingsMobilizedThisMonth, todaysDisbursementsCount, thisMonthsDisbursementsCount,
        countPrincipalOutstanding, countPrincipalOverdue, countInterestOverdue, countTotalOverdue, countNonPerformingAssets,
        countLoansForApproval, countLoansForDisapproval, countInterestOutstanding
    } = dashboardData;

    return (
        <div className="dashboard-layout">
            <div>
                <Sidebar />
            </div>

            <main className="main-content neighbor-element">
                <header className={`dashboard-header ${componentVisibility['dashboard-header'] ? '' : ''}`}>
                    <div className="header-content">
                        <h1 className="dashboard-title">Dashboard</h1>
                        <div className="title-section">
                            <p>Key metrics and insights</p>
                            <div className="office-selector-row">
                                <select
                                    id="office-dropdown"
                                    value={selectedOffice}
                                    onChange={(e) => setSelectedOffice(e.target.value)}
                                    disabled={user?.officeId !== 1}
                                >
                                    {user?.officeId === 1 ? (
                                        <>
                                            {officeOptions.map((office) => (
                                                <option key={office.id} value={office.id}>
                                                    {office.name}
                                                </option>
                                            ))}
                                        </>
                                    ) : (
                                        <option value={user?.officeId}>
                                            {officeOptions.find((office) => office.id === user?.officeId)?.name || "Current Office"}
                                        </option>
                                    )}
                                </select>
                            </div>
                        </div>
                        <div className="top-right-buttons">
                            <button className="action-button" onClick={() => navigate('/manage-roles-permissions')}>
                                <FaUsers className="button-icon"/> Manage Users & Roles
                            </button>
                            <button className="action-button" onClick={() => navigate('/clients')}>
                                <FaUserPlus className="button-icon"/> Onboard a New Client
                            </button>
                        </div>
                    </div>
                </header>
                <div className="dashboard-tabs">
                    <button
                        className={`tab-button ${activeTab === 'metrics' ? 'active' : ''}`}
                        onClick={() => setActiveTab('metrics')}
                    >
                        Key Metrics
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'insights' ? 'active' : ''}`}
                        onClick={() => setActiveTab('insights')}
                    >
                        Insights
                    </button>
                </div>
                {activeTab === 'metrics' ? (
                    <div className={"insights-container"}>
                        <section className="card-grid">
                            <div className="card">
                                <div className="card-header">
                                    <div className="icon-container">
                                        <FaExclamationTriangle className="card-icon"/>
                                    </div>
                                    <h3>Portfolio at Risk</h3>
                                </div>
                                <p>{portfolioAtRisk}</p>
                                <div className="card-footer">Percentage of risky loans</div>
                            </div>

                            <div className="card">
                                <div className="card-header">
                                    <div className="icon-container">
                                        <FaUsers className="card-icon"/>
                                    </div>
                                    <h3>Borrowers Per Loan Officer</h3>
                                </div>
                                <p>{borrowersPerLoanOfficer}</p>
                                <div className="card-footer">Average clients' loans per officer</div>
                            </div>

                            <div className="card">
                                <div className="card-header">
                                    <div className="icon-container">
                                        <FaHandHoldingUsd className="card-icon"/>
                                    </div>
                                    <h3>Average Loan Size</h3>
                                </div>
                                <p>{averageLoanDisbursed}</p>
                                <div className="card-footer">Average distributed Loan size</div>
                            </div>

                            <div className="card">
                                <div className="card-header">
                                    <div className="icon-container">
                                        <FaHandHoldingUsd className="card-icon"/>
                                    </div>
                                    <h3>Today's Disbursements</h3>
                                </div>
                                <p>{todaysDisbursements}</p>
                                <div className="card-footer">
                                    {todaysDisbursementsCount} {todaysDisbursementsCount === 1 ? 'loan' : 'loans'} disbursed
                                    today
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-header">
                                    <div className="icon-container">
                                        <FaHandHoldingUsd className="card-icon"/>
                                    </div>
                                    <h3>This Month's Disbursements</h3>
                                </div>
                                <p>{thisMonthsDisbursements}</p>
                                <div className="card-footer">
                                    {thisMonthsDisbursementsCount} {thisMonthsDisbursementsCount === 1 ? 'loan' : 'loans'} disbursed
                                    this month
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-header">
                                    <div className="icon-container">
                                        <FaUser className="card-icon"/>
                                    </div>
                                    <h3>Clients Per Personnel</h3>
                                </div>
                                <p>{clientsPerPersonnel}</p>
                                <div className="card-footer">Average clients per staff</div>
                            </div>

                            <div className="card">
                                <div className="card-header">
                                    <div className="icon-container">
                                        <FaUser className="card-icon"/>
                                    </div>
                                    <h3>Average Clients per Loan Officer</h3>
                                </div>
                                <p>{averageClientsPerLoanOfficer}</p>
                                <div className="card-footer">Clients managed per officer</div>
                            </div>

                            <div className="card" onClick={() => navigate('/clients')}>
                                <div className="card-header">
                                    <div className="icon-container">
                                        <FaUser className="card-icon"/>
                                    </div>
                                    <h3>Total Clients</h3>
                                </div>
                                <p>{totalClients}</p>
                                <div className="card-footer">{totalClients} clients in system</div>
                            </div>
                            <div className="card" onClick={() => navigate('/clients')}>
                                <div className="card-header">
                                    <div className="icon-container">
                                        <FaUser className="card-icon"/>
                                    </div>
                                    <h3>Active Clients</h3>
                                </div>
                                <p>{activeClients}</p>
                                <div className="card-footer">{activeClients} currently active clients</div>
                            </div>
                            <div className="card" onClick={() => navigate('/clients')}>
                                <div className="card-header">
                                    <div className="icon-container">
                                        <FaUser className="card-icon"/>
                                    </div>
                                    <h3>Inactive Clients</h3>
                                </div>
                                <p>{inactiveClients}</p>
                                <div className="card-footer">{inactiveClients} clients not active</div>
                            </div>
                            <div className="card" onClick={() => navigate('/clients')}>
                                <div className="card-header">
                                    <div className="icon-container">
                                        <FaUser className="card-icon"/>
                                    </div>
                                    <h3>Pending Clients</h3>
                                </div>
                                <p>{newClients}</p>
                                <div className="card-footer">{newClients} clients pending approval</div>
                            </div>
                            <div className="card">
                                <div className="card-header">
                                    <div className="icon-container">
                                        <FaMoneyCheckAlt className="card-icon"/>
                                    </div>
                                    <h3>Principal Outstanding</h3>
                                </div>
                                <p>{principalOutstanding}</p>
                                <div className="card-footer">{countPrincipalOutstanding} loans</div>
                            </div>
                            <div className="card">
                                <div className="card-header">
                                    <div className="icon-container">
                                        <FaHandHoldingUsd className="card-icon"/>
                                    </div>
                                    <h3>Interest Outstanding</h3>
                                </div>
                                <p>{interestOutstanding}</p>
                                <div className="card-footer">Interest yet to be paid, {countInterestOutstanding} loans</div>
                            </div>
                            <div className="card">
                                <div className="card-header">
                                    <div className="icon-container">
                                        <FaBalanceScale className="card-icon"/>
                                    </div>
                                    <h3>Total Outstanding</h3>
                                </div>
                                <p>{totalOutstanding}</p>
                                <div className="card-footer">Total dues (principal + interest)</div>
                            </div>
                            <div className="card">
                                <div className="card-header">
                                    <div className="icon-container">
                                        <FaChartLine className="card-icon"/>
                                    </div>
                                    <h3>Interest This Month</h3>
                                </div>
                                <p>{interestThisMonth}</p>
                                <div className="card-footer">Interest earned this month</div>
                            </div>
                            <div className="card">
                                <div className="card-header">
                                    <div className="icon-container">
                                        <FaExclamationTriangle className="card-icon"/>
                                    </div>
                                    <h3>Principal Overdue</h3>
                                </div>
                                <p>{principalOverdue}</p>
                                <div className="card-footer">{countPrincipalOverdue} loans</div>
                            </div>
                            <div className="card">
                                <div className="card-header">
                                    <div className="icon-container">
                                        <FaExclamationTriangle className="card-icon"/>
                                    </div>
                                    <h3>Interest Overdue</h3>
                                </div>
                                <p>{interestOverdue}</p>
                                <div className="card-footer">Interest payments overdue, {countInterestOverdue} loans</div>
                            </div>
                            <div className="card">
                                <div className="card-header">
                                    <div className="icon-container">
                                        <FaBalanceScale className="card-icon"/>
                                    </div>
                                    <h3>Total Overdue</h3>
                                </div>
                                <p>{totalOverdue}</p>
                                <div className="card-footer">{countTotalOverdue} loans</div>
                            </div>
                            <div className="card">
                                <div className="card-header">
                                    <div className="icon-container">
                                        <FaExclamationTriangle className="card-icon"/>
                                    </div>
                                    <h3>Non-Performing Assets</h3>
                                </div>
                                <p>{nonPerformingAssets}</p>
                                <div className="card-footer">Loans not generating income, {countNonPerformingAssets} loans</div>
                            </div>
                            <div className="card">
                                <div className="card-header">
                                    <div className="icon-container">
                                        <FaBalanceScale className="card-icon"/>
                                    </div>
                                    <h3>Pending Approval</h3>
                                </div>
                                <p>{loansForApproval}</p>
                                <div className="card-footer">{countLoansForApproval} loans</div>
                            </div>
                            <div className="card">
                                <div className="card-header">
                                    <div className="icon-container">
                                        <FaBalanceScale className="card-icon"/>
                                    </div>
                                    <h3>Pending Disbursements</h3>
                                </div>
                                <p>{loansForDisapproval}</p>
                                <div className="card-footer">{countLoansForDisapproval} loans</div>
                            </div>

                            <div className="card">
                                <div className="card-header">
                                    <div className="icon-container">
                                        <FaBalanceScale className="card-icon"/>
                                    </div>
                                    <h3>Today's Expected Payments</h3>
                                </div>
                                <p>{repaymentsToday}</p>
                                <div className="card-footer">{repaymentsToday} payments due today</div>
                            </div>
                            <div className="card">
                                <div className="card-header">
                                    <div className="icon-container">
                                        <FaBalanceScale className="card-icon"/>
                                    </div>
                                    <h3>Total Savings</h3>
                                </div>
                                <p>{totalSavings}</p>
                                <div className="card-footer">{savingsCount} savings accounts</div>
                            </div>
                            <div className="card">
                                <div className="card-header">
                                    <div className="icon-container">
                                        <FaBalanceScale className="card-icon"/>
                                    </div>
                                    <h3>Clients Recruited this Month</h3>
                                </div>
                                <p>{totalSavingsMobilizedThisMonth}</p>
                                <div className="card-footer">{totalSavingsMobilizedThisMonth} new accounts this month
                                </div>
                            </div>
                        </section>
                    </div>
                ) : (
                    <Insights selectedOffice={selectedOffice} officeOptions={officeOptions}/>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
