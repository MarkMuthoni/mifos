import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';
import axios from 'axios';
import {Pie, Line, Doughnut, Bar} from 'react-chartjs-2';
import { API_CONFIG } from '../config';
import {Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend,} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const Insights = ({ selectedOffice, officeOptions }) => {
    const { isAuthenticated, user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const [graphData, setGraphData] = useState({
        disbursalVsAwaiting: { disbursedAmount: 0, amountToBeDisburse: 0 },
        demandVsCollection: { AmountPaid: 0, AmountDue: 0 },
        trendsByDay: { clients: [], loans: [] },
        trendsByWeek: { clients: [], loans: [] },
        trendsByMonth: { clients: [], loans: [] },
        loanAccounts: { active: 0, inArrears: 0 },
        weeklyDisbursement: [],
        repaymentTrend: { actual: [], expected: [] },
    });
    const isSuperUser = user?.roles?.some(role => role.name === 'Super user');

    const AUTH_TOKEN = user?.base64EncodedAuthenticationKey;
    const headers = {
        'Authorization': `Basic ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
    };

    const fetchOfficeData = async (endpoint, officeId) => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/runreports/${endpoint}`, {
                headers,
                params: {
                    R_officeId: officeId,
                    genericResultSet: false,
                },
            });
            return response.data || [];
        } catch (error) {
            console.error(`Error fetching data from ${endpoint} for office ${officeId}`, error);
            return [];
        } finally {
            stopLoading();
        }
    };

    const fetchInsightsData = async () => {
        if (!isAuthenticated || !user) {
            console.error('User not authenticated. Cannot fetch insights data.');
            return;
        }

        startLoading();

        try {
            const currentOfficeId = selectedOffice === 'all' ? user?.officeId : selectedOffice;

            const clientTrendsDayData = await fetchOfficeData('ClientTrendsByDay', currentOfficeId);
            const clientTrendsWeekData = await fetchOfficeData('ClientTrendsByWeek', currentOfficeId);
            const clientTrendsMonthData = await fetchOfficeData('ClientTrendsByMonth', currentOfficeId);
            const loanTrendsDayData = await fetchOfficeData('LoanTrendsByDay', currentOfficeId);
            const loanTrendsWeekData = await fetchOfficeData('LoanTrendsByWeek', currentOfficeId);
            const loanTrendsMonthData = await fetchOfficeData('LoanTrendsByMonth', currentOfficeId);
            const loanAccountData = await fetchLoanAccountData(currentOfficeId);

            let disbursalData = { disbursedAmount: 0, amountToBeDisburse: 0 };
            let demandData = { AmountPaid: 0, AmountDue: 0 };
            let weeklyDisbursement = [];
            let repaymentTrend = { actual: [], expected: [], labels: [] };

            if (isSuperUser) {
                disbursalData = await fetchOfficeData('Disbursal%20Vs%20Awaitingdisbursal', currentOfficeId);
                demandData = await fetchOfficeData('Demand%20Vs%20Collection', currentOfficeId);
                weeklyDisbursement = await fetchWeeklyDisbursement(currentOfficeId);
                repaymentTrend = await fetchRepaymentTrend(currentOfficeId);
            }

            setGraphData({
                disbursalVsAwaiting: disbursalData[0] || { disbursedAmount: 0, amountToBeDisburse: 0 },
                demandVsCollection: demandData[0] || { AmountPaid: 0, AmountDue: 0 },
                trendsByDay: {
                    clients: clientTrendsDayData,
                    loans: loanTrendsDayData,
                },
                trendsByWeek: {
                    clients: clientTrendsWeekData,
                    loans: loanTrendsWeekData,
                },
                trendsByMonth: {
                    clients: clientTrendsMonthData,
                    loans: loanTrendsMonthData,
                },
                loanAccounts: loanAccountData,
                weeklyDisbursement,
                repaymentTrend,
            });
        } catch (error) {
            console.error('Error fetching insights data:', error.message);
        } finally {
            stopLoading();
        }
    };

    const fetchLoanAccountData = async (officeId) => {
        startLoading();
        try {
            const response = await axios.get(`/fineract-provider/api/v1/loans`, {
                headers,
                params: {
                    officeId: officeId === 'all' ? undefined : officeId,
                },
            });

            const loans = response.data.pageItems || [];

            const activeLoans = loans.filter(loan => loan.status.value === 'Active').length;
            const inArrearsLoans = loans.filter(loan => loan.inArrears === true).length;

            return {
                active: activeLoans,
                inArrears: inArrearsLoans,
            };
        } catch (error) {
            console.error('Error fetching loan accounts data:', error);
            return { active: 0, inArrears: 0 };
        } finally {
            stopLoading();
        }
    };

    const fetchWeeklyDisbursement = async (officeId) => {
        startLoading();
        try {
            const response = await fetchOfficeData('WeeklyDisbursementHistory', officeId);
            return response || [];
        } catch (error) {
            console.error('Error fetching weekly disbursement data:', error);
            return [];
        } finally {
            stopLoading();
        }
    };

    const fetchRepaymentTrend = async (officeId) => {
        startLoading();
        try {
            const response = await fetchOfficeData('RepaymentTrendActualVsExpected', officeId);
            const actual = response.map(item => item.actual);
            const expected = response.map(item => item.expected);
            const labels = response.map(item => item.date);

            return { actual, expected, labels };
        } catch (error) {
            console.error('Error fetching repayment trend data:', error);
            return { actual: [], expected: [], labels: [] };
        } finally {
            stopLoading();
        }
    };

    useEffect(() => {
        if (isAuthenticated && user) {
            fetchInsightsData();
        }
    }, [selectedOffice, isAuthenticated, user]);

    const safeMap = (data, callback) => (data ? data.map(callback) : []);

    return (
        <div className="insights-container">
            {/* Disbursal vs Awaiting */}
            {isSuperUser && (
                <div className="graph-container">
                    <h3>Disbursal vs Awaiting Disbursal</h3>
                    <Pie
                        data={{
                            labels: ['Disbursed', 'Awaiting Disbursal'],
                            datasets: [
                                {
                                    data: [
                                        graphData.disbursalVsAwaiting.disbursedAmount || 0,
                                        graphData.disbursalVsAwaiting.amountToBeDisburse || 0,
                                    ],
                                    backgroundColor: ['#4caf50', '#f44336'],
                                },
                            ],
                        }}
                    />
                </div>
            )}

            {/* Demand vs Collection */}
            {isSuperUser && (
                <div className="graph-container">
                    <h3>Demand vs Collection</h3>
                    <Pie
                        data={{
                            labels: ['Amount Collected', 'Amount Pending'],
                            datasets: [
                                {
                                    data: [
                                        graphData.demandVsCollection.AmountPaid || 0,
                                        (graphData.demandVsCollection.AmountDue || 0) - (graphData.demandVsCollection.AmountPaid || 0),
                                    ],
                                    backgroundColor: ['#3b83f6', '#f6c23e'],
                                },
                            ],
                        }}
                    />
                </div>
            )}

            {/* Loan Accounts: Active vs In Arrears */}
            <div className="graph-container">
                <h3>Loan Accounts: Active vs In Arrears</h3>
                <Doughnut
                    data={{
                        labels: ['Active', 'In Arrears'],
                        datasets: [
                            {
                                data: [
                                    graphData.loanAccounts.active || 0,
                                    graphData.loanAccounts.inArrears || 0,
                                ],
                                backgroundColor: ['#4caf50', '#f44336'],
                                borderWidth: 0,
                            },
                        ],
                    }}
                    options={{
                        cutout: '50%',
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: function (tooltipItem) {
                                        const total = tooltipItem.dataset.data.reduce((sum, value) => sum + value, 0);
                                        const value = tooltipItem.raw;
                                        const percentage = ((value / total) * 100).toFixed(2);
                                        return `${tooltipItem.label}: ${percentage}%`;
                                    },
                                },
                            },
                            legend: {
                                labels: {
                                    generateLabels: function (chart) {
                                        const data = chart.data.datasets[0].data;
                                        const total = data.reduce((sum, value) => sum + value, 0);
                                        return chart.data.labels.map((label, index) => {
                                            const value = data[index];
                                            const percentage = ((value / total) * 100).toFixed(2);
                                            return {
                                                text: `${label}: ${percentage}%`,
                                                fillStyle: chart.data.datasets[0].backgroundColor[index],
                                                hidden: chart.getDatasetMeta(0).data[index].hidden,
                                            };
                                        });
                                    },
                                },
                            },
                        },
                    }}
                />
            </div>

            {/* Weekly Disbursement History */}
            {isSuperUser && (
                <div className="graph-container">
                    <h3>Weekly Disbursement History</h3>
                    <Bar
                        data={{
                            labels: graphData.weeklyDisbursement.map(item => item.week),
                            datasets: [
                                {
                                    label: 'Disbursed Amount',
                                    data: graphData.weeklyDisbursement.map(item => item.amount),
                                    backgroundColor: '#4caf50',
                                    borderColor: '#388e3c',
                                    borderWidth: 1,
                                },
                            ],
                        }}
                        options={{
                            responsive: true,
                            plugins: {
                                legend: {
                                    position: 'top',
                                },
                                title: {
                                    display: true,
                                    text: 'Weekly Disbursement History',
                                },
                            },
                        }}
                        key={`weekly-disbursement-${selectedOffice}`}
                    />
                </div>
            )}

            {/* Repayment Trend: Actual vs Expected */}
            {isSuperUser && (
                <div className="graph-container">
                    <h3>Repayment Trend: Actual vs Expected</h3>
                    <Line
                        data={{
                            labels: graphData.repaymentTrend.labels,
                            datasets: [
                                {
                                    label: 'Actual',
                                    data: graphData.repaymentTrend.actual,
                                    borderColor: '#4caf50',
                                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                                    fill: true,
                                },
                                {
                                    label: 'Expected',
                                    data: graphData.repaymentTrend.expected,
                                    borderColor: '#f44336',
                                    backgroundColor: 'rgba(244, 67, 54, 0.2)',
                                    fill: true,
                                },
                            ],
                        }}
                    />
                </div>
            )}

            {/* Trends by Day */}
            <div className="graph-container">
                <h3>Trends by Day</h3>
                <Line
                    data={{
                        labels: safeMap(graphData.trendsByDay.clients, item => item.Days),
                        datasets: [
                            {
                                label: 'Clients Added',
                                data: safeMap(graphData.trendsByDay.clients, item => item.count),
                                borderColor: '#4bc0c0',
                                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                fill: true,
                            },
                            {
                                label: 'Loans Disbursed',
                                data: safeMap(graphData.trendsByDay.loans, item => item.lcount),
                                borderColor: '#9966ff',
                                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                                fill: true,
                            },
                        ],
                    }}
                />
            </div>

            {/* Trends by Week */}
            <div className="graph-container">
                <h3>Trends by Week</h3>
                <Line
                    data={{
                        labels: safeMap(graphData.trendsByWeek.clients, item => item.Weeks),
                        datasets: [
                            {
                                label: 'Clients Added',
                                data: safeMap(graphData.trendsByWeek.clients, item => item.count),
                                borderColor: '#4bc0c0',
                                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                fill: true,
                            },
                            {
                                label: 'Loans Disbursed',
                                data: safeMap(graphData.trendsByWeek.loans, item => item.lcount),
                                borderColor: '#9966ff',
                                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                                fill: true,
                            },
                        ],
                    }}
                />
            </div>

            {/* Trends by Month */}
            <div className="graph-container">
                <h3>Trends by Month</h3>
                <Line
                    data={{
                        labels: safeMap(graphData.trendsByMonth.clients, item => item.Months),
                        datasets: [
                            {
                                label: 'Clients Added',
                                data: safeMap(graphData.trendsByMonth.clients, item => item.count),
                                borderColor: '#4bc0c0',
                                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                fill: true,
                            },
                            {
                                label: 'Loans Disbursed',
                                data: safeMap(graphData.trendsByMonth.loans, item => item.lcount),
                                borderColor: '#9966ff',
                                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                                fill: true,
                            },
                        ],
                    }}
                />
            </div>
        </div>
    );
};

export default Insights;
