import React, {useContext, useEffect, useState} from 'react';
import {BrowserRouter as Router, Routes, Route, useLocation} from 'react-router-dom';
import { loadConfig } from './config';
import Login from './components/auth/Login';
import Dashboard from './components/Dashboard';
import {AuthContext, AuthProvider} from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { LoadingProvider } from './context/LoadingContext';
// import Notification from './components/utilities/Notification';
import './App.css';
import './index.css';
import Navbar from "./components/Navigation/Navbar";
import LoadingOverlay from "./components/utilities/LoadingOverlay";
import Sidebar from "./components/Navigation/Sidebar";
import ProtectedLayout from './ProtectedLayout';

import Accounting from './components/accounting/Accounting';
import Reports from './components/Reports/Reports';
import Admin from './components/admin/Admin';

import ClientsPage from "./components/views/Clients/ClientsPage";
import GroupsPage from "./components/views/Groups/GroupsPage";
import CentersPage from "./components/views/Centers/CentersPage";

/* Accounting */
import FrequentPosting from "./components/accounting/FrequentPosting/FrequentPosting";
import FinancialActivityMappings from "./components/accounting/FinancialActivityMapping/FinancialActivityMappings";
import JournalEntries from "./components/accounting/JournalEntries/JournalEntries"
import ClosingEntries from "./components/accounting/AccountClosure/ClosingEntries";
import ChartofAccounts from "./components/accounting/ChartOfAccounts/ChartofAccounts";
import AccountingTabs from "./components/accounting/AccountingRules/AccountingRules";
import Accruals from "./components/accounting/Accruals/Accruals";
import ProvisioningEntries from "./components/accounting/ProvisioningEntries/ProvisioningEntries";

/* Admin */
import Users from "./components/admin/Users/Users";
import Organization from "./components/admin/Organization/Organization";
import Products from "./components/admin/Products/Products"
import System from "./components/admin/System/System";
import Templates from "./components/admin/Templates/Templates";

/* Admin-System */
import ManageDataTables from "./components/admin/System/tabs/ManageDataTables/ManageDataTables";
import ManageCodes from "./components/admin/System/tabs/ManageCodes/ManageCodes";
import ManageRolesPermissions from "./components/admin/System/tabs/ManageRolesPermissions/ManageRolesPermissions";
import ConfigureMakerChecker from "./components/admin/System/tabs/ConfigureMakerChecker/ConfigureMakerChecker";
import ManageHooks from "./components/admin/System/tabs/ManageHooks/ManageHooks";
import ManageSurveys from "./components/admin/System/tabs/ManageSurveys/ManageSurveys";
import ManageReports from "./components/admin/System/tabs/ManageReports/ManageReports";
import AccountPreferences from "./components/admin/System/tabs/AccountNumberPrefences/AccountPreferences";
import ManageExternalEvents from "./components/admin/System/tabs/ManageExternalEvents/ManageExternalEvents";
import Configurations from "./components/admin/System/tabs/Configuration/Configurations";
import EntityMapping from "./components/admin/System/tabs/EntityToEntity/EntityMapping";
import ExternalServices from "./components/admin/System/tabs/ExternalServices/ExternalServices";
import TwoFactorAuthentication from "./components/admin/System/tabs/TwoFactor/TwoFactorConfig";
import AuditTrails from "./components/admin/System/tabs/AuditTrails/AuditTrails";
import ManageSchedulerJobs from "./components/admin/System/tabs/ManageSchedulerJobs/ManageSchedulerJobs";

/* Admin/ System / External-Services */
import AmazonS3Service from "./components/admin/System/tabs/ExternalServices/AmazonS3Service";
import EmailService from "./components/admin/System/tabs/ExternalServices/EmailService";
import SmsService from "./components/admin/System/tabs/ExternalServices/SmsService";
import NotificationService from "./components/admin/System/tabs/ExternalServices/NotificationService";
import NotFound from "./components/utilities/NotFound";

/* Products */
import LoanProducts from "./components/admin/Products/tabs/LoanProducts/LoanProducts";
import SavingsProducts from "./components/admin/Products/tabs/SavingsProducts/SavingsProducts";
import ShareProducts from "./components/admin/Products/tabs/ShareProducts/ShareProducts";
import Charges from "./components/admin/Products/tabs/charges/Charges";
import Collaterals from "./components/admin/Products/tabs/Collateral/Collaterals";
import ProductsMix from "./components/admin/Products/tabs/ProductsMix/ProductsMix";
import FixedDepositProducts from "./components/admin/Products/tabs/FixedDepositsProducts/FixedDepositProducts";
import RecurringDepositProducts from "./components/admin/Products/tabs/RecurringDepositProducts/RecurringDepositProducts";
import FloatingRates from "./components/admin/Products/tabs/FloatingRates/FloatingRates";
import ManageDelinquency from "./components/admin/Products/tabs/ManageDelinquency/ManageDelinquency";
import ManageTaxConfigurations from "./components/admin/Products/tabs/ManageTaxConfigurations/ManageTaxConfigurations";

/* Delinquency Buckets */
import DelinquencyBuckets from "./components/admin/Products/tabs/ManageDelinquency/DelinquencyBuckets/DelinquencyBuckets";
import DelinquencyRanges from "./components/admin/Products/tabs/ManageDelinquency/DelinquencyRanges/DelinquencyRanges";

/* Tax Configurations */
import TaxComponents from "./components/admin/Products/tabs/ManageTaxConfigurations/TaxComponents/TaxComponents";
import TaxGroups from "./components/admin/Products/tabs/ManageTaxConfigurations/TaxGroups/TaxGroups";

/* Organisation*/
import ManageOffices from "./components/admin/Organization/tabs/ManageOffices/ManageOffices";
import ManageHolidays from "./components/admin/Organization/tabs/ManageHolidays/ManageHolidays";
import ManageEmployees from "./components/admin/Organization/tabs/ManageEmployees/ManageEmployees";
import LoanProvisioningCriteria from "./components/admin/Organization/tabs/LoanProvisioningCriteria/LoanProvisioningCriteria";
import EntityDataTableChecks from "./components/admin/Organization/tabs/EntityDataTableChecks/EntityDataTable";
import CurrencyConfiguration from "./components/admin/Organization/tabs/CurrencyConfiguration/CurrencyConfiguration";
import ManageFunds from "./components/admin/Organization/tabs/ManageFunds/ManageFunds";
import TellersCashiers from "./components/admin/Organization/tabs/Tellers-Cashier/TellersCashiers";
import PaymentTypes from "./components/admin/Organization/tabs/PaymentTypes/PaymentTypes";
import ManageSMSCampaigns from "./components/admin/Organization/tabs/SMSCampaigns/SmsCampaigns";
import AdHocQuery from "./components/admin/Organization/tabs/AdHocQuery/AdHocQuery";
import PasswordPreferences from "./components/admin/Organization/tabs/PasswordPreferences/PasswordPreferences";
import WorkingDays from "./components/admin/Organization/tabs/WorkingDays/WorkingDays";
import BulkLoanReassignment from "./components/admin/Organization/tabs/BulkLoanReassignment/BulkLoanReassignment";
import StandingInstructionsHistory from "./components/admin/Organization/tabs/StandingInstructions/StandingInstructionsHistory";
import FundMapping from "./components/admin/Organization/tabs/FundMapping/FundMapping";
import ManageInvestors from "./components/admin/Organization/tabs/ManageInvestors/ManageInvestors";
import BulkImports from "./components/admin/Organization/tabs/BulkImports/BulkImports";

/* Viewing routes */
import ViewHoliday from "./components/admin/Organization/tabs/ManageHolidays/ViewHoliday";

/* Bulk Imports */
import BulkImport from "./components/admin/Organization/tabs/BulkImports/BulkImport";

/* Reports */
import ReportsPage from "./components/Reports/filteredReports/ReportsPage";
import ReportFormPage from "./components/Reports/ViewReports";
import XBRLPage from "./components/Reports/XBRL/XBRLPage";
import ScrollToTop from "./components/utilities/ScrollToTop";

/* Client Edits */
import EditClientDetails from "./components/views/Clients/EditClientDetails";
import ClientApplications from "./components/views/Clients/ClientApplications";
import CreateStandingInstructions from "./components/views/Clients/CreateStandingInstructions";
import ViewStandingInstructions from "./components/views/Clients/ViewStandingInstructions";
import GroupApplications from "./components/views/Groups/GroupApplications";
import CentersApplications from "./components/views/Centers/Applications";
import LoanDetails from "./components/views/Clients/LoanDetails/LoanDetails";
import SavingsDetails from "./components/views/Clients/SavingsDetails/SavingsDetails";
import CollateralDetails from "./components/views/Clients/CollateralDetails/CollateralDetails";

import SystemManagement from "./components/utilities/SystemManagement";
import NotificationContainer from "./context/NotificationContainer";
import CollectionSheet from "./components/CollectionSheet";
import axios from "axios";

const App = () => {
    const { redirectToLogin, authInitialized } = useContext(AuthContext);
    const [configLoaded, setConfigLoaded] = useState(false);

    useEffect(() => {
        const initializeConfig = async () => {
            await loadConfig();
            setConfigLoaded(true);
        };

        initializeConfig();
    }, []);

    const location = useLocation();
    const [isLoginRendered, setIsLoginRendered] = useState(false);

    const isLoginPage = location.pathname === '/login';
    useEffect(() => {
        if (location.pathname === '/login' && !isLoginRendered) {
            setIsLoginRendered(true);
        }
    }, [location.pathname, isLoginRendered]);

    if (!authInitialized || !configLoaded) {
        return <div></div>;
    }

    return (
        <AuthProvider>
            <LoadingProvider>
                <NotificationProvider>
                    <LoadingOverlay />
                    <NotificationContainer />
                    {/*<Navbar />*/}
                    {!isLoginPage && <Navbar />}
                    {!isLoginPage && <Sidebar className="sidebar" />}
                    <Routes>
                        {redirectToLogin || isLoginPage ? (
                            <Route path="/login" element={<Login />} />
                        ) : null}
                        <Route path='*' element={<NotFound />} />
                        <Route element={<ProtectedLayout />}>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/clients" element={<ClientsPage />} />
                            <Route path="/groups" element={<GroupsPage />} />
                            <Route path="/centers" element={<CentersPage />} />
                            <Route path="/accounting" element={<Accounting />} />
                            <Route path="/reports" element={<Reports />} />
                            <Route path="/admin" element={<Admin />} />
                            {/*<Route path="/addclient" element={<AddClient />} />*/}
                            {/*<Route path="/addgroup" element={<AddGroup />} />*/}
                            {/*<Route path="/addcenter" element={<AddCenter />} />*/}

                            {/* Accounting */}
                            <Route path="/frequent-postings" element={<FrequentPosting />} />
                            <Route path="/journal-entries" element={<JournalEntries />} />
                            {/*<Route path="/search-journal-entries" element={<SearchJournalEntries />} />*/}
                            <Route path="/financial-activity-mappings" element={<FinancialActivityMappings />} />
                            <Route path="/closing-entries" element={<ClosingEntries />} />
                            <Route path="/chart-of-accounts" element={<ChartofAccounts />} />
                            <Route path="/accounting-rules" element={<AccountingTabs />} />
                            <Route path="/accruals" element={<Accruals />} />
                            <Route path="/provisioning-entries" element={<ProvisioningEntries />} />

                            {/* Admin */}
                            <Route path="/users" element={<Users />} />
                            <Route path="/organization" element={<Organization />} />
                            <Route path="/products" element={<Products />} />
                            <Route path="/system" element={<System />} />
                            <Route path="/templates" element={<Templates />} />

                            {/* Admin/ System */}
                            <Route path="/manage-data-tables" element={<ManageDataTables />} />
                            <Route path="/manage-codes" element={<ManageCodes />} />
                            <Route path="/manage-roles-permissions" element={<ManageRolesPermissions />} />
                            <Route path="/configure-maker-checker" element={<ConfigureMakerChecker />} />
                            <Route path="/manage-hooks" element={<ManageHooks />} />
                            <Route path="/manage-surveys" element={<ManageSurveys />} />
                            <Route path="/manage-reports" element={<ManageReports />} />
                            <Route path="/account-preferences" element={<AccountPreferences />} />
                            <Route path="/manage-external-events" element={<ManageExternalEvents />} />
                            <Route path="/configurations" element={<Configurations />} />
                            <Route path="/entity-mappings" element={<EntityMapping />} />
                            <Route path="/external-services" element={<ExternalServices />} />
                            <Route path="/two-factor" element={<TwoFactorAuthentication />} />
                            <Route path="/audit-trails" element={<AuditTrails />} />
                            <Route path="/manage-scheduler-jobs" element={<ManageSchedulerJobs />} />

                            {/* Admin/ System / External-Services */}
                            <Route path="/amzons3" element={<AmazonS3Service />} />
                            <Route path="/email-service" element={<EmailService />} />
                            <Route path="/sms-service" element={<SmsService />} />
                            <Route path="/notification-service" element={<NotificationService />} />

                            {/* Products */}
                            <Route path="/loan-products" element={<LoanProducts />} />
                            <Route path="/savings-products" element={<SavingsProducts />} />
                            <Route path="/share-products" element={<ShareProducts />} />
                            <Route path="/charges" element={<Charges />} />
                            <Route path="/collateral" element={<Collaterals />} />
                            <Route path="/products-mix" element={<ProductsMix />} />
                            <Route path="/fixed-deposit-products" element={<FixedDepositProducts />} />
                            <Route path="/recurring-deposit-products" element={<RecurringDepositProducts />} />
                            <Route path="/floating-rates" element={<FloatingRates />} />
                            <Route path="/manage-delinquency" element={<ManageDelinquency />} />
                            <Route path="/manage-tax-configurations" element={<ManageTaxConfigurations />} />

                            {/* Manage Delinquency */}
                            <Route path="/delinquency-buckets" element={<DelinquencyBuckets />} />
                            <Route path="/delinquency-ranges" element={<DelinquencyRanges />} />

                            {/* Tax Configurations */}
                            <Route path="/tax-components" element={<TaxComponents />} />
                            <Route path="/tax-groups" element={<TaxGroups />} />

                            {/* Organisation */}
                            <Route path="/manage-offices" element={<ManageOffices />} />
                            <Route path="/manage-holidays" element={<ManageHolidays />} />
                            <Route path="/manage-employees" element={<ManageEmployees />} />
                            <Route path="/loan-provisioning-criteria" element={<LoanProvisioningCriteria />} />
                            <Route path="/entity-data-table-checks" element={<EntityDataTableChecks />} />
                            <Route path="/currency-configuration" element={<CurrencyConfiguration />} />
                            <Route path="/manage-funds" element={<ManageFunds />} />
                            <Route path="/teller-cashier-management" element={<TellersCashiers />} />
                            <Route path="/payment-types" element={<PaymentTypes />} />
                            <Route path="/sms-campaigns" element={<ManageSMSCampaigns />} />
                            <Route path="/ad-hoc-query" element={<AdHocQuery />} />
                            <Route path="/password-preferences" element={<PasswordPreferences />} />
                            <Route path="/working-days" element={<WorkingDays />} />
                            <Route path="/bulk-loan-reassignment" element={<BulkLoanReassignment />} />
                            <Route path="/standing-instructions-history" element={<StandingInstructionsHistory />} />
                            <Route path="/fund-mapping" element={<FundMapping />} />
                            <Route path="/manage-investors" element={<ManageInvestors />} />
                            <Route path="/bulk-imports" element={<BulkImports />} />

                            {/* viewing routes */}
                            <Route path="/holidays/view/:id" element={<ViewHoliday />} />

                            {/* bulk imports */}
                            <Route path="/bulk-imports/:entityType" element={<BulkImport />} />

                            {/* Reports */}
                            <Route path="/report/XBRL" element={<XBRLPage />} />
                            <Route path="/reports/:reportType" element={<ReportsPage />} />
                            <Route path="/reports/view/:reportId" element={<ReportFormPage />} />

                            {/* Edit Client Details */}
                            <Route path="/clients/edit/:clientId" element={<EditClientDetails />} />

                            {/* Client Application */}
                            <Route path="/client/:clientId/applications/:applicationType" element={<ClientApplications />} />
                            <Route path="/group/:groupId/applications/:applicationType" element={<GroupApplications />} />
                            <Route path="/center/:centerId/applications/:applicationType" element={<CentersApplications />} />

                            {/* Client/View Standing Instructions */}
                            <Route path="/client/:clientId/create-standing-instructions" element={<CreateStandingInstructions />} />
                            <Route path="/client/:clientId/view-standing-instructions" element={<ViewStandingInstructions />} />

                            <Route path="/client/:clientId/loan-details/:loanId" element={<LoanDetails />} />
                            <Route path="/client/:clientId/savings-account/:savingsAccountId" element={<SavingsDetails/>} />
                            <Route path="/client/:clientId/collaterals/:collateralId" element={<CollateralDetails />} />
                            <Route path="/management" element={<SystemManagement />} />
                            <Route path="/collection-sheet" element={<CollectionSheet />} />

                        </Route>
                    </Routes>
                </NotificationProvider>
            </LoadingProvider>
        </AuthProvider>
    );
};

const AppWrapper = () => {
    return (
        <Router>
            <ScrollToTop/>
            <App />
        </Router>
    );
};

export default AppWrapper;
