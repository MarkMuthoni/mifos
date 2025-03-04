import React, { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../../../context/AuthContext";
import { useLoading } from "../../../../context/LoadingContext";
import { API_CONFIG } from "../../../../config";
import "./SavingsDetails.css";
import {FaCaretLeft, FaCaretRight, FaEdit, FaStickyNote, FaTrash} from "react-icons/fa";
import DatePicker from "react-datepicker";
import {NotificationContext} from "../../../../context/NotificationContext";

const SavingsAccounts = () => {
    const { clientId, savingsAccountId } = useParams();
    const { state } = useLocation();
    const { showNotification } = useContext(NotificationContext);
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const navigate = useNavigate();

    const [savingsDetails, setSavingsDetails] = useState(null);
    const [clientDetails, setClientDetails] = useState(null);
    const [activeTab, setActiveTab] = useState("general");
    const [accountImage, setAccountImage] = useState(null);
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [activeSubmenu, setActiveSubmenu] = useState(null);

    const dropdownRef = useRef(null);
    const tabsContainerRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const [hideReversed, setHideReversed] = useState(false);
    const [hideAccruals, setHideAccruals] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(Math.ceil(transactions.length / pageSize));
    const [currentPageData, setCurrentPageData] = useState([]);

    const [showInactiveCharges, setShowInactiveCharges] = useState(false);
    const [activeCharges, setActiveCharges] = useState([]);
    const [inactiveCharges, setInactiveCharges] = useState([]);

    const [documents, setDocuments] = useState([]);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadPayload, setUploadPayload] = useState({
        fileName: "",
        description: "",
        file: null,
    });

    const [notes, setNotes] = useState([]);
    const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
    const [newNote, setNewNote] = useState("");
    const [editingNoteId, setEditingNoteId] = useState(null);

    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [depositTransactionDate, setDepositTransactionDate] = useState(new Date());
    const [depositTransactionAmount, setDepositTransactionAmount] = useState("");
    const [depositPaymentTypeOptions, setDepositPaymentTypeOptions] = useState([]);
    const [depositSelectedPaymentType, setDepositSelectedPaymentType] = useState("");
    const [showDepositPaymentDetails, setShowDepositPaymentDetails] = useState(false);
    const [depositAccountNumber, setDepositAccountNumber] = useState("");
    const [depositChequeNumber, setDepositChequeNumber] = useState("");
    const [depositRoutingCode, setDepositRoutingCode] = useState("");
    const [depositReceiptNumber, setDepositReceiptNumber] = useState("");
    const [depositBankNumber, setDepositBankNumber] = useState("");
    const [depositNote, setDepositNote] = useState("");
    const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);

    const [isBlockDepositModalOpen, setIsBlockDepositModalOpen] = useState(false);
    const [blockDepositReasonOptions, setBlockDepositReasonOptions] = useState([]);
    const [selectedBlockDepositReason, setSelectedBlockDepositReason] = useState("");
    const [isSubmittingBlockDeposit, setIsSubmittingBlockDeposit] = useState(false);

    const [withdrawTransactionDate, setWithdrawTransactionDate] = useState(new Date());
    const [withdrawTransactionAmount, setWithdrawTransactionAmount] = useState(0);
    const [withdrawPaymentTypeOptions, setWithdrawPaymentTypeOptions] = useState([]);
    const [withdrawSelectedPaymentType, setWithdrawSelectedPaymentType] = useState("");
    const [withdrawNote, setWithdrawNote] = useState("");
    const [showWithdrawPaymentDetails, setShowWithdrawPaymentDetails] = useState(false);
    const [withdrawAccountNumber, setWithdrawAccountNumber] = useState("");
    const [withdrawChequeNumber, setWithdrawChequeNumber] = useState("");
    const [withdrawRoutingCode, setWithdrawRoutingCode] = useState("");
    const [withdrawReceiptNumber, setWithdrawReceiptNumber] = useState("");
    const [withdrawBankNumber, setWithdrawBankNumber] = useState("");
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

    const [isBlockWithdrawalModalOpen, setIsBlockWithdrawalModalOpen] = useState(false);
    const [blockWithdrawalReason, setBlockWithdrawalReason] = useState("");
    const [blockWithdrawalReasons, setBlockWithdrawalReasons] = useState([]);

    const [isBlockAccountModalOpen, setIsBlockAccountModalOpen] = useState(false);
    const [blockAccountReason, setBlockAccountReason] = useState("");
    const [blockAccountReasons, setBlockAccountReasons] = useState([]);

    const [isHoldAmountModalOpen, setIsHoldAmountModalOpen] = useState(false);
    const [holdAmountReason, setHoldAmountReason] = useState("");
    const [holdAmountReasons, setHoldAmountReasons] = useState([]);
    const [holdTransactionDate, setHoldTransactionDate] = useState(new Date());
    const [holdTransactionAmount, setHoldTransactionAmount] = useState("");

    const [isCalculateInterestModalOpen, setIsCalculateInterestModalOpen] = useState(false);

    const [isPostInterestAsOnModalOpen, setIsPostInterestAsOnModalOpen] = useState(false);
    const [postInterestTransactionDate, setPostInterestTransactionDate] = useState(new Date());

    const [isPostInterestModalOpen, setIsPostInterestModalOpen] = useState(false);

    const [isAddChargeModalOpen, setIsAddChargeModalOpen] = useState(false);
    const [chargeOptions, setChargeOptions] = useState([]);
    const [selectedCharge, setSelectedCharge] = useState(null);
    const [chargeAmount, setChargeAmount] = useState("");
    const [dueDate, setDueDate] = useState(new Date());

    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    const [closeTransactionDate, setCloseTransactionDate] = useState(new Date());
    const [isWithdrawBalance, setIsWithdrawBalance] = useState(false);
    const [isInterestPostingRequired, setIsInterestPostingRequired] = useState(false);
    const [closeTransactionAmount, setCloseTransactionAmount] = useState(0);
    const [closePaymentTypeOptions, setClosePaymentTypeOptions] = useState([]);
    const [closeSelectedPaymentType, setCloseSelectedPaymentType] = useState("");
    const [showClosePaymentDetails, setShowClosePaymentDetails] = useState(false);
    const [closeAccountNumber, setCloseAccountNumber] = useState("");
    const [closeChequeNumber, setCloseChequeNumber] = useState("");
    const [closeRoutingCode, setCloseRoutingCode] = useState("");
    const [closeReceiptNumber, setCloseReceiptNumber] = useState("");
    const [closeBankNumber, setCloseBankNumber] = useState("");
    const [closeNote, setCloseNote] = useState("");

    const [isTransferFundsModalOpen, setIsTransferFundsModalOpen] = useState(false);
    const [transferApplicant, setTransferApplicant] = useState("");
    const [transferOffice, setTransferOffice] = useState("");
    const [transferFromAccount, setTransferFromAccount] = useState("");
    const [transferFromAccountType, setTransferFromAccountType] = useState("");
    const [transferCurrency, setTransferCurrency] = useState("");

    const [fromClientId, setFromClientId] = useState(null);
    const [fromOfficeId, setFromOfficeId] = useState(null);
    const [fromAccountId, setFromAccountId] = useState(null);
    const [fromAccountTypeId, setFromAccountTypeId] = useState(null);

    const [transferTransactionDate, setTransferTransactionDate] = useState(new Date());
    const [transferToOfficeOptions, setTransferToOfficeOptions] = useState([]);
    const [transferToOffice, setTransferToOffice] = useState("");
    const [transferToClientOptions, setTransferToClientOptions] = useState([]);
    const [transferToClient, setTransferToClient] = useState("");
    const [transferToAccountTypeOptions, setTransferToAccountTypeOptions] = useState([]);
    const [transferToAccountType, setTransferToAccountType] = useState("");
    const [transferToAccountOptions, setTransferToAccountOptions] = useState([]);
    const [transferToAccount, setTransferToAccount] = useState("");
    const [transferAmount, setTransferAmount] = useState("");
    const [transferDescription, setTransferDescription] = useState("");

    const [isAssignStaffModalOpen, setIsAssignStaffModalOpen] = useState(false);
    const [assignStaffOptions, setAssignStaffOptions] = useState([]);
    const [assignToStaff, setAssignToStaff] = useState("");
    const [assignmentDate, setAssignmentDate] = useState(new Date());

    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportFromDate, setExportFromDate] = useState(null);
    const [exportToDate, setExportToDate] = useState(null);

    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [transactionDetails, setTransactionDetails] = useState(null);

    const [journalEntries, setJournalEntries] = useState([]);
    const [isJournalEntriesModalOpen, setIsJournalEntriesModalOpen] = useState(false);

    const [isUndoApprovalModalOpen, setIsUndoApprovalModalOpen] = useState(false);
    const [undoApprovalNote, setUndoApprovalNote] = useState("");
    const [isProcessingUndo, setIsProcessingUndo] = useState(false);

    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [approveForm, setApproveForm] = useState({
        approvedOnDate: null,
        note: "",
    });
    const [isProcessingApproval, setIsProcessingApproval] = useState(false);

    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectForm, setRejectForm] = useState({
        rejectedOnDate: new Date(),
        note: "",
    });

    const [isWithdrawnModalOpen, setIsWithdrawnModalOpen] = useState(false);
    const [withdrawnForm, setWithdrawnForm] = useState({
        withdrawnOnDate: new Date(),
        note: "",
    });

    const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
    const [activateForm, setActivateForm] = useState({
        activatedOnDate: new Date(),
    });

    const handleOpenActivateModal = () => {
        setActivateForm({
            activatedOnDate: new Date(),
        });
        setIsActivateModalOpen(true);
    };

    const handleCloseActivateModal = () => {
        setIsActivateModalOpen(false);
    };

    const handleActivateAccount = async () => {
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };

            const payload = {
                activatedOnDate: formatDateForPayload(activateForm.activatedOnDate),
                dateFormat: "dd MMMM yyyy",
                locale: "en",
            };

            await axios.post(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/${savingsAccountId}?command=activate`,
                payload,
                { headers }
            );

            showNotification("Savings account activated successfully!", 'success');
            fetchSavingsData();
            handleCloseActivateModal();
        } catch (error) {
            console.error("Error activating savings account:", error);
            showNotification("Failed to activate the savings account. Please try again.", 'error');
        }
    };

    const handleDeleteSavingsAccount = async () => {
        if (window.confirm("Are you sure you want to delete this savings account? This action cannot be undone.")) {
            try {
                const headers = {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                };

                await axios.delete(
                    `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/${savingsAccountId}`,
                    { headers }
                );

                showNotification("Savings account deleted successfully.", 'info');
                navigate("/clients", {
                    state: {
                        clientId: clientId,
                        clientName: clientDetails?.displayName || "Client Details",
                        preventDuplicate: true,
                    },
                });
            } catch (error) {
                console.error("Error deleting savings account:", error);
                showNotification("Failed to delete the savings account. Please try again.", 'error');
            }
        }
    };

    const handleOpenWithdrawnModal = () => {
        setWithdrawnForm({
            withdrawnOnDate: new Date(),
            note: "",
        });
        setIsWithdrawnModalOpen(true);
    };

    const handleCloseWithdrawnModal = () => {
        setIsWithdrawnModalOpen(false);
    };

    const handleWithdrawnByClient = async () => {
        try {
            if (!withdrawnForm.withdrawnOnDate) {
                showNotification("Withdrawn On Date is required.", 'info');
                return;
            }

            const payload = {
                withdrawnOnDate: formatDateForPayload(withdrawnForm.withdrawnOnDate),
                note: withdrawnForm.note,
                dateFormat: "dd MMMM yyyy",
                locale: "en",
            };

            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };

            await axios.post(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/${savingsAccountId}?command=withdrawnByApplicant`,
                payload,
                { headers }
            );

            showNotification("Account marked as withdrawn successfully.", 'success');
            handleCloseWithdrawnModal();
            fetchSavingsData();
        } catch (error) {
            console.error("Error withdrawing account:", error);
            showNotification("Failed to mark the account as withdrawn. Please try again.", 'error');
        }
    };

    const handleOpenRejectModal = () => {
        setRejectForm({
            rejectedOnDate: new Date(),
            note: "",
        });
        setIsRejectModalOpen(true);
    };

    const handleCloseRejectModal = () => {
        setIsRejectModalOpen(false);
    };

    const handleRejectAccount = async () => {
        try {
            if (!rejectForm.rejectedOnDate) {
                showNotification("Rejected On Date is required.", 'info');
                return;
            }

            const payload = {
                rejectedOnDate: formatDateForPayload(rejectForm.rejectedOnDate),
                note: rejectForm.note,
                dateFormat: "dd MMMM yyyy",
                locale: "en",
            };

            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };

            await axios.post(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/${savingsAccountId}?command=reject`,
                payload,
                { headers }
            );

            showNotification("Account rejected successfully.", 'success');
            handleCloseRejectModal();
            fetchSavingsData();
        } catch (error) {
            console.error("Error rejecting account:", error);
            showNotification("Failed to reject the account. Please try again.", 'error');
        }
    };

    const handleOpenApproveModal = () => {
        setApproveForm({
            approvedOnDate: new Date(),
            note: "",
        });
        setIsApproveModalOpen(true);
    };

    const handleCloseApproveModal = () => {
        setIsApproveModalOpen(false);
        setApproveForm({
            approvedOnDate: null,
            note: "",
        });
    };

    const handleApproveAccount = async () => {
        if (!approveForm.approvedOnDate) {
            showNotification("Please select an approval date.", 'info');
            return;
        }

        setIsProcessingApproval(true);

        try {
            const endpoint = `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/${savingsAccountId}?command=approve`;

            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };

            const payload = {
                approvedOnDate: formatDateForPayload(approveForm.approvedOnDate),
                note: approveForm.note,
                dateFormat: "dd MMMM yyyy",
                locale: "en",
            };

            await axios.post(endpoint, payload, { headers });

            showNotification("Account approved successfully.", 'success');
            fetchSavingsData();
            handleCloseApproveModal();
        } catch (error) {
            console.error("Error approving account:", error);
            showNotification("Failed to approve account. Please try again.", 'error');
        } finally {
            setIsProcessingApproval(false);
        }
    };

    const handleOpenUndoApprovalModal = () => {
        setUndoApprovalNote("");
        setIsUndoApprovalModalOpen(true);
    };

    const handleCloseUndoApprovalModal = () => {
        setIsUndoApprovalModalOpen(false);
        setUndoApprovalNote("");
    };

    const handleUndoApproval = async () => {
        if (!undoApprovalNote.trim()) {
            showNotification("Please provide a note for undo approval.", 'info');
            return;
        }

        setIsProcessingUndo(true);

        try {
            const endpoint = `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/${savingsAccountId}?command=undoapproval`;

            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };

            const payload = {
                note: undoApprovalNote,
            };

            await axios.post(endpoint, payload, { headers });

            showNotification("Approval undone successfully.", 'success');
            fetchSavingsData();
            handleCloseUndoApprovalModal();
        } catch (error) {
            console.error("Error undoing approval:", error);
            showNotification("Failed to undo approval. Please try again.", 'error');
        } finally {
            setIsProcessingUndo(false);
        }
    };

    const handleOpenExportModal = () => {
        setIsExportModalOpen(true);
    };

    const handleCloseExportModal = () => {
        setExportFromDate(null);
        setExportToDate(null);
        setIsExportModalOpen(false);
    };

    const handleGenerateReport = async () => {
        if (!exportFromDate || !exportToDate) return;

        const fromDate = exportFromDate.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
        const toDate = exportToDate.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });

        const reportURL = `${API_CONFIG.proxy}/fineract-provider/api/v1/runreports/Client%20Saving%20Transactions?tenantIdentifier=default&locale=en&dateFormat=dd%20MMMM%20yyyy&output-type=EXCEL&R_startDate=${fromDate}&R_endDate=${toDate}&R_savingsAccountId=${transferFromAccount}`;

        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };

            const response = await axios.get(reportURL, { headers, responseType: "blob" });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `Client_Saving_Transactions_${fromDate}_to_${toDate}.xlsx`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            handleCloseExportModal();
        } catch (error) {
            console.error("Error generating report:", error);
            showNotification("Failed to generate report. Please try again.", 'error');
        }
    };

    const handleOpenAssignStaffModal = async () => {
        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };

            const response = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/${savingsAccountId}?template=true&associations=charges`,
                { headers }
            );

            const data = response.data || {};
            setAssignStaffOptions(data.fieldOfficerOptions || []);
            setIsAssignStaffModalOpen(true);
        } catch (error) {
            console.error("Error fetching assign staff data:", error);
            showNotification("Failed to load data for assigning staff.", 'error');
        } finally {
            stopLoading();
        }
    };

    const handleCloseAssignStaffModal = () => {
        setIsAssignStaffModalOpen(false);
        setAssignToStaff("");
        setAssignmentDate(new Date());
    };

    const handleSubmitAssignStaff = async () => {
        if (!assignToStaff || !assignmentDate) {
            showNotification("Please fill in all mandatory fields.", 'info');
            return;
        }

        const payload = {
            toSavingsOfficerId: assignToStaff,
            assignmentDate: assignmentDate.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
            }),
            dateFormat: "dd MMMM yyyy",
            locale: "en",
            fromSavingsOfficerId: "",
        };

        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };

            await axios.post(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/${savingsAccountId}?command=assignSavingsOfficer`,
                payload,
                { headers }
            );

            showNotification("Savings officer assigned successfully.", 'success');
            setAssignToStaff("");
            setAssignmentDate(null);
            handleCloseAssignStaffModal();
            fetchSavingsData();
        } catch (error) {
            console.error("Error assigning staff:", error);
            showNotification("Failed to assign staff.", 'error');
        } finally {
            stopLoading();
        }
    };

    const handleOpenTransferFundsModal = async () => {
        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };

            const response = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/accounttransfers/template?fromAccountId=${savingsAccountId}&fromAccountType=2`,
                { headers }
            );

            const data = response.data || {};
            setTransferApplicant(data.fromClient?.displayName || "N/A");
            setTransferOffice(data.fromOffice?.name || "N/A");
            setTransferFromAccount(data.fromAccount?.accountNo || "N/A");
            setTransferFromAccountType(data.fromAccountType?.value || "N/A");
            setTransferCurrency(data.currency?.name || "N/A");

            setFromClientId(data.fromAccount?.clientId || null);
            setFromOfficeId(data.fromOffice?.id || null);
            setFromAccountId(data.fromAccount?.id || null);
            setFromAccountTypeId(data.fromAccountType?.id || null);

            setTransferToOfficeOptions(data.toOfficeOptions || []);
            setTransferToClientOptions(data.fromClientOptions || []);
            setTransferToAccountTypeOptions(data.toAccountTypeOptions || []);
            setTransferToAccountOptions(data.fromAccountOptions || []);

            setIsTransferFundsModalOpen(true);
        } catch (error) {
            console.error("Error fetching transfer funds data:", error);
            showNotification("Failed to load data for fund transfer.", 'error');
        } finally {
            stopLoading();
        }
    };

    const handleCloseTransferFundsModal = () => {
        setIsTransferFundsModalOpen(false);
        setTransferTransactionDate(new Date());
        setTransferToOffice("");
        setTransferToClient("");
        setTransferToAccountType("");
        setTransferToAccount("");
        setTransferAmount("");
        setTransferDescription("");
    };

    const handleSubmitTransferFunds = async () => {
        if (
            !transferTransactionDate ||
            !transferToOffice ||
            !transferToClient ||
            !transferToAccountType ||
            !transferToAccount ||
            !transferAmount ||
            !transferDescription
        ) {
            showNotification("Please fill in all mandatory fields.", 'info');
            return;
        }

        const payload = {
            transferDate: transferTransactionDate.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
            }),
            fromOfficeId: fromOfficeId,
            fromClientId: fromClientId,
            fromAccountType: fromAccountTypeId,
            fromAccountId: fromAccountId,
            toOfficeId: parseInt(transferToOffice, 10),
            toClientId: parseInt(transferToClient, 10),
            toAccountType: parseInt(transferToAccountType, 10),
            toAccountId: parseInt(transferToAccount, 10),
            transferAmount: parseFloat(transferAmount),
            transferDescription,
            dateFormat: "dd MMMM yyyy",
            locale: "en",
        };

        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };

            await axios.post(`${API_CONFIG.proxy}/fineract-provider/api/v1/accounttransfers`, payload, { headers });

            showNotification("Funds transferred successfully.", 'success');
            handleCloseTransferFundsModal();
            fetchSavingsData();
        } catch (error) {
            console.error("Error transferring funds:", error);
            showNotification("Failed to transfer funds.", 'error');
        } finally {
            stopLoading();
        }
    };

    const handleOpenCloseModal = async () => {
        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };

            const response = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/${savingsAccountId}/transactions/template`,
                { headers }
            );

            const accountResponse = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/${savingsAccountId}?associations=all`,
                { headers }
            );

            const data = response.data || {};
            const accountData = accountResponse.data || {};
            setCloseTransactionAmount(accountData.summary.availableBalance || 0);
            setClosePaymentTypeOptions(data.paymentTypeOptions || []);
            setIsCloseModalOpen(true);
        } catch (error) {
            console.error("Error fetching close account data:", error);
            showNotification("Failed to load data for closing the account.", 'error');
        } finally {
            stopLoading();
        }
    };

    const handleCloseCloseModal = () => {
        setIsCloseModalOpen(false);
        setCloseTransactionDate(new Date());
        setIsWithdrawBalance(false);
        setIsInterestPostingRequired(false);
        setCloseTransactionAmount(0);
        setCloseSelectedPaymentType("");
        setShowClosePaymentDetails(false);
        setCloseAccountNumber("");
        setCloseChequeNumber("");
        setCloseRoutingCode("");
        setCloseReceiptNumber("");
        setCloseBankNumber("");
        setCloseNote("");
    };

    const handleSubmitClose = async () => {
        if (!closeTransactionDate || (isWithdrawBalance && !closeSelectedPaymentType)) {
            showNotification("Please fill in all mandatory fields.", 'info');
            return;
        }

        const payload = {
            closedOnDate: formatDateForPayload(closeTransactionDate),
            withdrawBalance: isWithdrawBalance,
            postInterestValidationOnClosure: isInterestPostingRequired,
            ...(isWithdrawBalance && {
                paymentTypeId: closeSelectedPaymentType,
                accountNumber: closeAccountNumber,
                checkNumber: closeChequeNumber,
                routingCode: closeRoutingCode,
                receiptNumber: closeReceiptNumber,
                bankNumber: closeBankNumber,
            }),
            note: closeNote,
            dateFormat: "dd MMMM yyyy",
            locale: "en",
        };

        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };

            await axios.post(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/${savingsAccountId}?command=close`,
                payload,
                { headers }
            );

            showNotification("Account closed successfully.", 'success');
            handleCloseCloseModal();
            fetchSavingsData();
        } catch (error) {
            console.error("Error closing account:", error);
            showNotification("Failed to close the account.", 'error');
        } finally {
            stopLoading();
        }
    };

    const handleOpenAddChargeModal = async () => {
        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };

            const response = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/${savingsAccountId}/charges/template`,
                { headers }
            );

            const data = response.data || {};
            setChargeOptions(data.chargeOptions || []);
            setIsAddChargeModalOpen(true);
        } catch (error) {
            console.error("Error fetching charge template:", error);
            showNotification("Failed to load data for adding a charge.", 'error');
        } finally {
            stopLoading();
        }
    };

    const handleCloseAddChargeModal = () => {
        setIsAddChargeModalOpen(false);
        setSelectedCharge(null);
        setChargeAmount("");
        setDueDate(new Date());
    };

    const handleSubmitAddCharge = async () => {
        if (!selectedCharge || !chargeAmount || !dueDate) {
            showNotification("Please fill in all mandatory fields.", 'info');
            return;
        }

        const payload = {
            chargeId: selectedCharge.id,
            amount: parseFloat(chargeAmount),
            dueDate: dueDate.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
            }),
            dateFormat: "dd MMMM yyyy",
            locale: "en",
        };

        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };

            await axios.post(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/${savingsAccountId}/charges`,
                payload,
                { headers }
            );

            showNotification("Charge added successfully.", 'success');
            handleCloseAddChargeModal();
            fetchSavingsData();
        } catch (error) {
            console.error("Error adding charge:", error);
            showNotification("Failed to add charge.", 'error');
        } finally {
            stopLoading();
        }
    };

    const handleOpenPostInterestModal = () => {
        setIsPostInterestModalOpen(true);
    };

    const handleClosePostInterestModal = () => {
        setIsPostInterestModalOpen(false);
    };

    const handlePostInterest = async () => {
        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };

            await axios.post(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/${savingsAccountId}?command=postInterest`,
                {},
                { headers }
            );

            showNotification("Interest posted successfully.", 'success');
            handleClosePostInterestModal();
            fetchSavingsData();
        } catch (error) {
            console.error("Error posting interest:", error);
            showNotification("Failed to post interest.", 'error');
        } finally {
            stopLoading();
        }
    };

    const handleOpenPostInterestAsOnModal = () => {
        setIsPostInterestAsOnModalOpen(true);
    };

    const handleClosePostInterestAsOnModal = () => {
        setIsPostInterestAsOnModalOpen(false);
        setPostInterestTransactionDate(new Date());
    };

    const handlePostInterestAsOn = async () => {
        if (!postInterestTransactionDate) {
            showNotification("Please select a transaction date.", 'info');
            return;
        }

        const payload = {
            transactionDate: postInterestTransactionDate.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
            }),
            IsPostInterestAsOn: true,
            dateFormat: "dd MMMM yyyy",
            locale: "en",
        };

        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };

            await axios.post(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/${savingsAccountId}/transactions?command=postInterestAsOn`,
                payload,
                { headers }
            );

            showNotification("Interest posted successfully.", 'success');
            handleClosePostInterestAsOnModal();
            fetchSavingsData();
        } catch (error) {
            console.error("Error posting interest:", error);
            showNotification("Failed to post interest.", 'error');
        } finally {
            stopLoading();
        }
    };

    const handleOpenCalculateInterestModal = () => {
        setIsCalculateInterestModalOpen(true);
    };

    const handleCloseCalculateInterestModal = () => {
        setIsCalculateInterestModalOpen(false);
    };

    const handleCalculateInterest = async () => {
        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };

            await axios.post(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/${savingsAccountId}?command=calculateInterest`,
                {},
                { headers }
            );

            showNotification("Interest calculated successfully.", 'success');
            handleCloseCalculateInterestModal();
            fetchSavingsData();
        } catch (error) {
            console.error("Error calculating interest:", error);
            showNotification("Failed to calculate interest.", 'error');
        } finally {
            stopLoading();
        }
    };

    const fetchHoldAmountReasons = async () => {
        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };

            const codesResponse = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/codes`, { headers });
            const holdAmountCode = codesResponse.data.find(
                (code) => code.name === "SavingsAccountBlockReasons"
            );

            if (holdAmountCode) {
                const codeValuesResponse = await axios.get(
                    `${API_CONFIG.proxy}/fineract-provider/api/v1/codes/${holdAmountCode.id}/codevalues`,
                    { headers }
                );
                setHoldAmountReasons(codeValuesResponse.data || []);
            }

            setIsHoldAmountModalOpen(true);
        } catch (error) {
            console.error("Error fetching hold amount reasons:", error);
            showNotification("Failed to load hold amount reasons.", 'error');
        } finally {
            stopLoading();
        }
    };

    const handleOpenHoldAmountModal = () => {
        fetchHoldAmountReasons();
    };

    const handleCloseHoldAmountModal = () => {
        setIsHoldAmountModalOpen(false);
        setHoldAmountReason("");
        setHoldTransactionDate(new Date());
        setHoldTransactionAmount("");
    };

    const formatDateForPayload = (date) => {
        return date
            .toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
            })
            .replace(",", "");
    };

    const handleSubmitHoldAmount = async () => {
        if (!holdAmountReason || !holdTransactionDate || !holdTransactionAmount) {
            showNotification("Please fill in all mandatory fields.", 'info');
            return;
        }

        const payload = {
            reasonForBlock: holdAmountReason,
            transactionDate: formatDateForPayload(holdTransactionDate),
            transactionAmount: holdTransactionAmount,
            dateFormat: "dd MMMM yyyy",
            locale: "en",
        };

        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };

            await axios.post(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/${savingsAccountId}/transactions?command=holdAmount`,
                payload,
                { headers }
            );

            showNotification("Amount held successfully.", 'success');
            handleCloseHoldAmountModal();
            fetchSavingsData();
        } catch (error) {
            console.error("Error holding amount:", error);
            showNotification("Failed to hold amount.", 'error');
        } finally {
            stopLoading();
        }
    };

    const fetchBlockAccountReasons = async () => {
        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };

            const codesResponse = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/codes`, { headers });
            const blockAccountCode = codesResponse.data.find(
                (code) => code.name === "SavingsAccountBlockReasons"
            );

            if (blockAccountCode) {
                const codeValuesResponse = await axios.get(
                    `${API_CONFIG.proxy}/fineract-provider/api/v1/codes/${blockAccountCode.id}/codevalues`,
                    { headers }
                );
                setBlockAccountReasons(codeValuesResponse.data || []);
            }

            setIsBlockAccountModalOpen(true);
        } catch (error) {
            console.error("Error fetching block account reasons:", error);
            showNotification("Failed to load block account reasons.", 'error');
        } finally {
            stopLoading();
        }
    };

    const handleOpenBlockAccountModal = () => {
        fetchBlockAccountReasons();
    };

    const handleCloseBlockAccountModal = () => {
        setIsBlockAccountModalOpen(false);
        setBlockAccountReason("");
    };

    const handleSubmitBlockAccount = async () => {
        if (!blockAccountReason) {
            showNotification("Please select a reason.", 'info');
            return;
        }

        const payload = {
            reasonForBlock: blockAccountReason,
        };

        startLoading();

        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };

            await axios.post(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/${savingsAccountId}?command=block`,
                payload,
                { headers }
            );

            showNotification("Account blocked successfully.", 'success');
            handleCloseBlockAccountModal();
            fetchSavingsData();
        } catch (error) {
            console.error("Error blocking account:", error);
            showNotification("Failed to block account.", 'error');
        } finally {
            stopLoading();
        }
    };

    const fetchBlockWithdrawalReasons = async () => {
        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };

            const codesResponse = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/codes`, { headers });
            const blockWithdrawalCode = codesResponse.data.find(
                (code) => code.name === "SavingsTransactionFreezeReasons"
            );

            if (blockWithdrawalCode) {
                const codeValuesResponse = await axios.get(
                    `${API_CONFIG.proxy}/fineract-provider/api/v1/codes/${blockWithdrawalCode.id}/codevalues`,
                    { headers }
                );
                setBlockWithdrawalReasons(codeValuesResponse.data || []);
            }

            setIsBlockWithdrawalModalOpen(true);
        } catch (error) {
            console.error("Error fetching block withdrawal reasons:", error);
            showNotification("Failed to load block withdrawal reasons.", 'error');
        } finally {
            stopLoading();
        }
    };

    const handleOpenBlockWithdrawalModal = () => {
        fetchBlockWithdrawalReasons();
    };

    const handleCloseBlockWithdrawalModal = () => {
        setIsBlockWithdrawalModalOpen(false);
        setBlockWithdrawalReason("");
    };

    const handleSubmitBlockWithdrawal = async () => {
        if (!blockWithdrawalReason) {
            showNotification("Please select a reason.", 'info');
            return;
        }

        const payload = {
            reasonForBlock: blockWithdrawalReason,
        };

        startLoading();

        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };

            await axios.post(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/${savingsAccountId}?command=blockWithdraw`,
                payload,
                { headers }
            );

            showNotification("Withdrawal blocked successfully.", 'success');
            handleCloseBlockWithdrawalModal();
            fetchSavingsData();
        } catch (error) {
            console.error("Error blocking withdrawal:", error);
            showNotification("Failed to block withdrawal.", 'error');
        } finally {
            stopLoading();
        }
    };

    const handleOpenWithdrawModal = async () => {
        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };

            const response = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/${savingsAccountId}/transactions/template`,
                { headers }
            );

            const data = response.data || {};
            setWithdrawPaymentTypeOptions(data.paymentTypeOptions || []);
            setIsWithdrawModalOpen(true);
        } catch (error) {
            console.error("Error fetching withdraw data:", error);
            showNotification("Failed to load data for withdrawal.", 'error');
        } finally {
            stopLoading();
        }
    };

    const handleCloseWithdrawModal = () => {
        setIsWithdrawModalOpen(false);
        setWithdrawTransactionDate(new Date());
        setWithdrawTransactionAmount(0);
        setWithdrawSelectedPaymentType("");
        setWithdrawNote("");
        setShowWithdrawPaymentDetails(false);
        setWithdrawAccountNumber("");
        setWithdrawChequeNumber("");
        setWithdrawRoutingCode("");
        setWithdrawReceiptNumber("");
        setWithdrawBankNumber("");
    };

    const handleSubmitWithdraw = async () => {
        if (!withdrawTransactionDate || !withdrawTransactionAmount || !withdrawSelectedPaymentType) {
            showNotification("Please fill in all mandatory fields.", 'info');
            return;
        }

        const payload = {
            transactionDate: withdrawTransactionDate.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
            }),
            transactionAmount: parseFloat(withdrawTransactionAmount),
            paymentTypeId: parseInt(withdrawSelectedPaymentType, 10),
            note: withdrawNote || "",
            dateFormat: "dd MMMM yyyy",
            locale: "en",
            ...(showWithdrawPaymentDetails && {
                accountNumber: withdrawAccountNumber ? parseInt(withdrawAccountNumber, 10) : 0,
                checkNumber: withdrawChequeNumber ? parseInt(withdrawChequeNumber, 10) : 0,
                routingCode: withdrawRoutingCode || "",
                receiptNumber: withdrawReceiptNumber || "",
                bankNumber: withdrawBankNumber || "",
            }),
        };

        setIsSubmittingWithdraw(true);
        startLoading();

        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };

            await axios.post(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/${savingsAccountId}/transactions?command=withdrawal`,
                payload,
                { headers }
            );

            showNotification("Withdrawal submitted successfully.", 'success');

            setWithdrawTransactionDate(null);
            setWithdrawTransactionAmount("");
            setWithdrawSelectedPaymentType("");
            setWithdrawNote("");
            setWithdrawAccountNumber("");
            setWithdrawChequeNumber("");
            setWithdrawRoutingCode("");
            setWithdrawReceiptNumber("");
            setWithdrawBankNumber("");
            setShowWithdrawPaymentDetails(false);

            handleCloseWithdrawModal();
            fetchSavingsData();
        } catch (error) {
            console.error("Error submitting withdrawal:", error);
            showNotification("Failed to submit withdrawal.", 'error');
        } finally {
            setIsSubmittingWithdraw(false);
            stopLoading();
        }
    };

    const fetchBlockDepositReasons = async () => {
        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };

            const codesResponse = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/codes`, { headers });
            const reasonCode = codesResponse.data.find(
                (code) => code.name === "SavingsAccountBlockReasons"
            );


            const reasonsResponse = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/codes/${reasonCode.id}/codevalues`,
                { headers }
            );

            setIsBlockDepositModalOpen(true);
        } catch (error) {
            console.error("Error fetching block deposit reasons:", error);
            showNotification("Failed to fetch block deposit reasons.", 'error');
        } finally {
            stopLoading();
        }
    };

    const handleSubmitBlockDeposit = async () => {
        if (!selectedBlockDepositReason) {
            showNotification("Please select a reason.", 'info');
            return;
        }

        setIsSubmittingBlockDeposit(true);
        startLoading();

        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };

            const payload = {
                reasonId: selectedBlockDepositReason,
            };

            await axios.post(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/${savingsAccountId}?command=blockdeposit`,
                payload,
                { headers }
            );

            showNotification("Deposit block submitted successfully.", 'success');
            fetchSavingsData();
            handleCloseBlockDepositModal();
        } catch (error) {
            console.error("Error blocking deposit:", error);
            showNotification("Failed to block deposit.", 'error');
        } finally {
            setIsSubmittingBlockDeposit(false);
            stopLoading();
        }
    };

    const handleOpenBlockDepositModal = async () => {
        await fetchBlockDepositReasons();
    };

    const handleCloseBlockDepositModal = () => {
        setIsBlockDepositModalOpen(false);
        setSelectedBlockDepositReason("");
    };

    const handleOpenDepositModal = async () => {
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };

            const response = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/${savingsAccountId}/transactions/template`,
                { headers }
            );

            const data = response.data || {};
            setDepositPaymentTypeOptions(data.paymentTypeOptions || []);
            setIsDepositModalOpen(true);
        } catch (error) {
            console.error("Error fetching deposit data:", error);
            showNotification("Failed to load data for deposit.", 'error');
        }
    };

    const handleCloseDepositModal = () => {
        setIsDepositModalOpen(false);
        setDepositTransactionDate(new Date());
        setDepositTransactionAmount("");
        setDepositSelectedPaymentType("");
        setShowDepositPaymentDetails(false);
        setDepositAccountNumber("");
        setDepositChequeNumber("");
        setDepositRoutingCode("");
        setDepositReceiptNumber("");
        setDepositBankNumber("");
        setDepositNote("");
    };

    const handleSubmitDeposit = async () => {
        if (!depositTransactionDate || !depositTransactionAmount || !depositSelectedPaymentType) {
            showNotification("Please fill in all mandatory fields.", 'info');
            return;
        }

        const payload = {
            transactionDate: depositTransactionDate.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
            }),
            transactionAmount: parseFloat(depositTransactionAmount),
            paymentTypeId: parseInt(depositSelectedPaymentType),
            note: depositNote || "",
            dateFormat: "dd MMMM yyyy",
            locale: "en",
            ...(showDepositPaymentDetails && {
                accountNumber: depositAccountNumber || "",
                checkNumber: depositChequeNumber || "",
                routingCode: depositRoutingCode || "",
                receiptNumber: depositReceiptNumber || "",
                bankNumber: depositBankNumber || "",
            }),
        };

        setIsSubmittingDeposit(true);
        startLoading();

        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };

            await axios.post(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/${savingsAccountId}/transactions?command=deposit`,
                payload,
                { headers }
            );

            showNotification("Deposit submitted successfully.", 'success');
            setDepositTransactionDate(null);
            setDepositTransactionAmount("");
            setDepositSelectedPaymentType("");
            setDepositNote("");
            setDepositAccountNumber("");
            setDepositChequeNumber("");
            setDepositRoutingCode("");
            setDepositReceiptNumber("");
            setDepositBankNumber("");
            setShowDepositPaymentDetails(false);
            handleCloseDepositModal();
            fetchSavingsData();
        } catch (error) {
            console.error("Error submitting deposit:", error);
            showNotification("Failed to submit deposit.", 'error');
        } finally {
            setIsSubmittingDeposit(false);
            stopLoading();
        }
    };

    const [standingInstructions, setStandingInstructions] = useState([]);

    const fetchStandingInstructions = async () => {
        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };
            const response = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/standinginstructions?clientId=${clientId}&clientName=${encodeURIComponent(
                    clientDetails?.displayName || ""
                )}&fromAccountId=${savingsAccountId}&fromAccountType=2&locale=en&dateFormat=dd%20MMMM%20yyyy`,
                { headers }
            );
            setStandingInstructions(response.data?.pageItems || []);
        } catch (error) {
            console.error("Error fetching standing instructions:", error);
        } finally {
            stopLoading();
        }
    };

    const handleEditInstruction = (instruction) => {
        // console.log("Edit instruction", instruction);
    };

    const handleDeleteInstruction = async (instructionId) => {
        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };
            await axios.delete(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/standinginstructions/${instructionId}`,
                { headers }
            );
            fetchStandingInstructions();
        } catch (error) {
            console.error("Error deleting standing instruction:", error);
        } finally {
            stopLoading();
        }
    };

    useEffect(() => {
        if (activeTab === "standingInstructions") {
            fetchStandingInstructions();
        }
    }, [activeTab, savingsAccountId]);

    const fetchNotes = async () => {
        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };
            const response = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/savings/${savingsAccountId}/notes`,
                { headers }
            );
            setNotes(response.data || []);
        } catch (error) {
            console.error("Error fetching notes:", error);
        } finally {
            stopLoading();
        }
    };

    const handleSaveNote = async () => {
        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };
            if (editingNoteId) {
                await axios.put(
                    `${API_CONFIG.proxy}/fineract-provider/api/v1/savings/${savingsAccountId}/notes/${editingNoteId}`,
                    { note: newNote },
                    { headers }
                );
            } else {
                await axios.post(
                    `${API_CONFIG.proxy}/fineract-provider/api/v1/savings/${savingsAccountId}/notes`,
                    { note: newNote },
                    { headers }
                );
            }
            fetchNotes();
            setIsNotesModalOpen(false);
            setNewNote("");
            setEditingNoteId(null);
        } catch (error) {
            console.error("Error saving note:", error);
        } finally {
            stopLoading();
        }
    };

    const handleDeleteNote = async (noteId) => {
        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };
            await axios.delete(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/savings/${savingsAccountId}/notes/${noteId}`,
                { headers }
            );
            fetchNotes();
        } catch (error) {
            console.error("Error deleting note:", error);
        } finally {
            stopLoading();
        }
    };

    const handleEditNote = (note) => {
        setIsNotesModalOpen(true);
        setEditingNoteId(note.id);
        setNewNote(note.note);
    };

    useEffect(() => {
        if (activeTab === "notes") {
            fetchNotes();
        }
    }, [activeTab, savingsAccountId]);

    const fetchDocuments = async () => {
        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };
            const response = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/savings/${savingsAccountId}/documents`,
                { headers }
            );
            setDocuments(response.data || []);
        } catch (error) {
            console.error("Error fetching documents:", error);
        } finally {
            stopLoading();
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setUploadPayload((prev) => ({ ...prev, file }));
    };

    const handleSubmitUpload = async () => {
        startLoading();
        const formData = new FormData();
        formData.append("name", uploadPayload.fileName);
        formData.append("description", uploadPayload.description || "");
        formData.append("file", uploadPayload.file);

        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
            };
            await axios.post(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/savings/${savingsAccountId}/documents`,
                formData,
                { headers }
            );
            setIsUploadModalOpen(false);
            fetchDocuments();
        } catch (error) {
            console.error("Error uploading document:", error);
        } finally {
            stopLoading();
        }
    };

    useEffect(() => {
        if (activeTab === "documents") {
            fetchDocuments();
        }
    }, [activeTab]);

    useEffect(() => {
        if (savingsDetails?.charges) {
            const active = savingsDetails.charges.filter((charge) => charge.isActive);
            const inactive = savingsDetails.charges.filter((charge) => !charge.isActive);
            setActiveCharges(active);
            setInactiveCharges(inactive);
        }
    }, [savingsDetails]);

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage((prev) => prev + 1);
        }
    };

    useEffect(() => {
        const filteredTransactions = transactions.filter((transaction) => {
            if (hideReversed && transaction.reversed) return false;
            if (hideAccruals && transaction.isAccrual) return false;
            return true;
        });
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        setCurrentPageData(filteredTransactions.slice(startIndex, endIndex));
        setTotalPages(Math.ceil(filteredTransactions.length / pageSize));
    }, [hideReversed, hideAccruals, currentPage, pageSize, transactions]);

    const viewTransaction = async (id) => {
        try {
            startLoading();

            const endpoint = `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/${savingsAccountId}/transactions/${id}`;

            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };

            const response = await axios.get(endpoint, { headers });
            const data = response.data;

            setTransactionDetails(data);
            setIsTransactionModalOpen(true);
        } catch (error) {
            console.error("Error fetching transaction details:", error);
            showNotification("Failed to fetch transaction details.", 'error');
        } finally {
            stopLoading();
        }
    };

    const undoTransaction = async (id) => {
        if (!window.confirm("Are you sure you want to undo this transaction?")) return;

        startLoading();
        try {
            const payload = {
                transactionDate: new Date().toISOString(),
                transactionAmount: 0,
                dateFormat: "dd MMMM yyyy",
                locale: "en",
            };

            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };

            await axios.post(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/${savingsAccountId}/transactions/${id}?command=undo`,
                payload,
                { headers }
            );

            fetchSavingsData();
        } catch (error) {
            console.error("Error undoing transaction:", error);
            showNotification("Failed to undo transaction. Please try again.", 'error');
        } finally {
            stopLoading();
        }
    };

    const viewReceipts = async (id) => {
        try {
            startLoading();

            const receiptURL = `${API_CONFIG.proxy}/fineract-provider/api/v1/runreports/Savings%20Transaction%20Receipt?tenantIdentifier=default&locale=en&dateFormat=dd%20MMMM%20yyyy&output-type=PDF&R_transactionId=${id}`;

            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
            };

            const response = await axios.get(receiptURL, {
                headers,
                responseType: "blob",
            });

            const blob = new Blob([response.data], { type: "application/pdf" });
            const link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            link.download = `Transaction_Receipt_${id}.pdf`;
            link.click();
        } catch (error) {
            console.error("Error viewing receipt:", error);
            showNotification("Failed to view receipt. Please try again.", 'error');
        } finally {
            stopLoading();
        }
    };

    const viewJournalEntries = async (id) => {
        try {
            startLoading();

            const endpoint = `${API_CONFIG.proxy}/fineract-provider/api/v1/journalentries?transactionId=S${id}&transactionDetails=true`;

            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };

            const response = await axios.get(endpoint, { headers });
            const data = response.data || {};

            if (data.totalFilteredRecords > 0 && Array.isArray(data.pageItems)) {
                setJournalEntries(data.pageItems);
            } else {
                setJournalEntries([]);
            }

            setIsJournalEntriesModalOpen(true);
        } catch (error) {
            console.error("Error fetching journal entries:", error);
            showNotification("Failed to fetch journal entries. Please try again.", 'error');
        } finally {
            stopLoading();
        }
    };

    const handleToggleDropdown = () => {
        setDropdownOpen((prev) => !prev);
    };

    const handleSubmenuToggle = (submenu) => {
        setActiveSubmenu((prev) => (prev === submenu ? null : submenu));
    };

    const handleOutsideClick = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setDropdownOpen(false);
            setActiveSubmenu(null);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleOutsideClick);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, []);

    useEffect(() => {
        setAccountImage(`${process.env.PUBLIC_URL}/Images/centers.png`);
    }, []);

    useEffect(() => {
        fetchSavingsData();
    }, [savingsAccountId]);

    const fetchSavingsData = async () => {
        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                "Content-Type": "application/json",
            };

            const savingsResponse = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/${savingsAccountId}?associations=all`,
                { headers }
            );
            setSavingsDetails(savingsResponse.data);
            setTransactions(savingsResponse.data.transactions || []);

            const clientResponse = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/clients/${clientId}`,
                { headers }
            );
            setClientDetails(clientResponse.data);
        } catch (error) {
            console.error("Error fetching savings details:", error);
        } finally {
            stopLoading();
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case "general":
                return (
                    <div className="general-tab">
                        <div className="general-section">
                            <h3 className="general-section-title">Savings Details</h3>
                            <table className="general-vertical-table">
                                <tbody>
                                <tr>
                                    <td className="label">External ID</td>
                                    <td className="value">{savingsDetails?.externalId || "N/A"}</td>
                                </tr>
                                <tr>
                                    <td className="label">Activated On</td>
                                    <td className="value">
                                        {savingsDetails?.timeline?.activatedOnDate
                                            ? new Date(savingsDetails.timeline.activatedOnDate.join("-")).toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "long",
                                                year: "numeric",
                                            })
                                            : "N/A"}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="label">Field Officer</td>
                                    <td className="value">
                                        {savingsDetails?.fieldOfficerName || "Unassigned"}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="label">Currency</td>
                                    <td className="value">{savingsDetails?.currency?.name || "N/A"}</td>
                                </tr>
                                <tr>
                                    <td className="label">Nominal Interest Rate</td>
                                    <td className="value">
                                        {savingsDetails?.nominalAnnualInterestRate
                                            ? `${savingsDetails.nominalAnnualInterestRate}%`
                                            : "N/A"}
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Performance History Section */}
                        <div className="general-section">
                            <h3 className="general-section-title">Performance History</h3>
                            <table className="general-vertical-table">
                                <tbody>
                                <tr>
                                    <td className="label">Total Deposits</td>
                                    <td className="value">
                                        {savingsDetails?.currency?.code}{" "}
                                        {savingsDetails?.summary?.totalDeposits?.toLocaleString("en-US", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        }) || "0.00"}
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Account Summary Section */}
                        <div className="general-section">
                            <h3 className="general-section-title">Account Summary</h3>
                            <table className="general-vertical-table">
                                <tbody>
                                <tr>
                                    <td className="label">Interest Earned Not Posted</td>
                                    <td className="value">
                                        {savingsDetails?.currency?.code}{" "}
                                        {savingsDetails?.summary?.interestNotPosted?.toLocaleString("en-US", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        }) || "0.00"}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="label">Interest Compounding Period</td>
                                    <td className="value">{savingsDetails?.interestCompoundingPeriodType?.value || "N/A"}</td>
                                </tr>
                                <tr>
                                    <td className="label">Interest Posting Period</td>
                                    <td className="value">{savingsDetails?.interestPostingPeriodType?.value || "N/A"}</td>
                                </tr>
                                <tr>
                                    <td className="label">Interest Calculated Using</td>
                                    <td className="value">{savingsDetails?.interestCalculationType?.value || "N/A"}</td>
                                </tr>
                                <tr>
                                    <td className="label">Days in Year</td>
                                    <td className="value">{savingsDetails?.interestCalculationDaysInYearType?.value || "N/A"}</td>
                                </tr>
                                <tr>
                                    <td className="label">Last Active Transaction Date</td>
                                    <td className="value">
                                        {savingsDetails?.lastActiveTransactionDate
                                            ? new Date(savingsDetails.lastActiveTransactionDate.join("-")).toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "long",
                                                year: "numeric",
                                            })
                                            : "N/A"}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="label">Days to Inactive</td>
                                    <td className="value">{savingsDetails?.daysToInactive || ""}</td>
                                </tr>
                                <tr>
                                    <td className="label">Days to Dormancy</td>
                                    <td className="value">{savingsDetails?.daysToDormancy || ""}</td>
                                </tr>
                                <tr>
                                    <td className="label">Days to Escheat</td>
                                    <td className="value">{savingsDetails?.daysToEscheat || ""}</td>
                                </tr>
                                <tr>
                                    <td className="label">Overdraft Limit</td>
                                    <td className="value">
                                        {savingsDetails?.currency?.code}{" "}
                                        {savingsDetails?.overdraftLimit?.toLocaleString("en-US", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        }) || "0.00"}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="label">Minimum Overdraft Required for Interest Calculation</td>
                                    <td className="value">
                                        {savingsDetails?.currency?.code}{" "}
                                        {savingsDetails?.minRequiredOverdraftForInterestCalculation?.toLocaleString("en-US", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        }) || "0.00"}
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case "transactions":
                return (
                    <div className="tab-content">
                        <div className="transactions-header">
                            <div className="actions">
                                <label>
                                    <input
                                        type="checkbox"
                                        className="toggle-button"
                                        onChange={(e) => setHideReversed(e.target.checked)}
                                    />
                                    Hide Reversed
                                </label>
                                <label>
                                    <input
                                        type="checkbox"
                                        className="toggle-button"
                                        onChange={(e) => setHideAccruals(e.target.checked)}
                                    />
                                    Hide Accruals
                                </label>
                                <button className="export-btn" onClick={handleOpenExportModal}>Export</button>
                            </div>
                            <div className="filter-group">
                            <label htmlFor="pageSize" className="filter-label">
                                    Rows per page:
                                </label>
                                <select
                                    id="pageSize"
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(parseInt(e.target.value, 10));
                                        setCurrentPage(1);
                                    }}
                                    className="filter-dropdown"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>
                        </div>
                        {/* Transactions Table */}
                        <table className="transactions-table">
                            <thead>
                            <tr>
                            <th>#</th>
                                <th>ID</th>
                                <th>Transaction Date</th>
                                <th>External Id</th>
                                <th>Transaction Type</th>
                                <th>Debit</th>
                                <th>Credit</th>
                                <th>Balance</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {currentPageData.map((transaction, index) => (
                                <tr
                                    key={transaction.id}
                                    style={{
                                        textDecoration: transaction.reversed ? "line-through" : "none",
                                        color: transaction.reversed ? "gray" : "inherit",
                                    }}
                                >
                                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                                    <td>{transaction.id}</td>
                                    <td>
                                        {transaction.date
                                            ? new Date(transaction.date.join("-")).toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "long",
                                                year: "numeric",
                                            })
                                            : ""}
                                    </td>
                                    <td>{transaction.externalId || ""}</td>
                                    <td>{transaction.transactionType?.value || ""}</td>
                                    <td>
                                        {transaction.entryType === "DEBIT"
                                            ? `${transaction.currency?.code || ""} ${transaction.amount.toLocaleString(
                                                undefined,
                                                {minimumFractionDigits: 2}
                                            )}`
                                            : ""}
                                    </td>
                                    <td>
                                        {transaction.entryType === "CREDIT"
                                            ? `${transaction.currency?.code || ""} ${transaction.amount.toLocaleString(
                                                undefined,
                                                {minimumFractionDigits: 2}
                                            )}`
                                            : ""}
                                    </td>
                                    <td>{`${transaction.currency?.code || ""} ${transaction.runningBalance.toLocaleString(
                                        undefined,
                                        {minimumFractionDigits: 2}
                                    )}`}</td>
                                    <td>
                                        <div className="actions-dropdown">
                                            <div className="dropdown-btn">
                                                <div className="dot"></div>
                                                <div className="dot"></div>
                                                <div className="dot"></div>
                                            </div>
                                            <div className="dropdown-menu">
                                                <button onClick={() => viewTransaction(transaction.id)}>View
                                                    Transaction
                                                </button>
                                                <button onClick={() => undoTransaction(transaction.id)}>Undo
                                                    Transaction
                                                </button>
                                                <button onClick={() => viewReceipts(transaction.id)}>View Receipts
                                                </button>
                                                <button onClick={() => viewJournalEntries(transaction.id)}>View Journal
                                                    Entries
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        {totalPages > 1 && (
                            <div className="pagination">
                            <button
                                    className="pagination-button"
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                >
                                    Start
                                </button>
                                <button
                                    className="pagination-button"
                                    onClick={handlePreviousPage}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </button>
                                <span>
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    className="pagination-button"
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </button>
                                <button
                                    className="pagination-button"
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                >
                                    End
                                </button>
                            </div>
                        )}
                    </div>
                );
            case "charges":
                return (
                    <div className="tab-content">
                        <div className="pause-button-tags">
                            <button
                                className="pause-delinquency-btn"
                                onClick={() => setShowInactiveCharges((prev) => !prev)}
                            >
                                {showInactiveCharges ? "View Active Charges" : "View Inactive Charges"}
                            </button>
                        </div>
                        <table className="delinquency-table">
                            <thead>
                            <tr>
                                <th>Name</th>
                                <th>Charge Type</th>
                                <th>Payment Due At</th>
                                <th>Due As Of</th>
                                <th>Repeats On (M/d)</th>
                                <th>Calculation Type</th>
                                <th>Due</th>
                                <th>Paid</th>
                                <th>Waived</th>
                                <th>Outstanding</th>
                            </tr>
                            </thead>
                            <tbody>
                            {(showInactiveCharges ? inactiveCharges : activeCharges).map((charge) => (
                                <tr key={charge.id}>
                                    <td>{charge.name}</td>
                                    <td>{charge.penalty ? "Penalty" : "Fee"}</td>
                                    <td>{charge.chargeTimeType?.value || ""}</td>
                                    <td>
                                        {charge.dueAsOf
                                            ? new Date(charge.dueAsOf).toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "long",
                                                year: "numeric",
                                            })
                                            : ""}
                                    </td>
                                    <td>
                                        {charge.repeatsOn
                                            ? `${charge.repeatsOn.month || ""}/${charge.repeatsOn.day || ""}`
                                            : ""}
                                    </td>
                                    <td>{charge.chargeCalculationType?.value || ""}</td>
                                    <td>
                                        {`${charge.currency?.code || ""} ${charge.amount.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                        })}`}
                                    </td>
                                    <td>
                                        {`${charge.currency?.code || ""} ${charge.amountPaid.toLocaleString(
                                            undefined,
                                            {minimumFractionDigits: 2}
                                        )}`}
                                    </td>
                                    <td>
                                        {`${charge.currency?.code || ""} ${charge.amountWaived.toLocaleString(
                                            undefined,
                                            {minimumFractionDigits: 2}
                                        )}`}
                                    </td>
                                    <td>
                                        {`${charge.currency?.code || ""} ${charge.amountOutstanding.toLocaleString(
                                            undefined,
                                            {minimumFractionDigits: 2}
                                        )}`}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                );
            case "documents":
                return (
                    <div className="tab-content">
                        <div className="pause-button-tags">
                            <button
                                className="pause-delinquency-btn"
                                onClick={() => setIsUploadModalOpen(true)}
                            >
                                Add
                            </button>
                        </div>

                        {documents.length > 0 ? (
                            <table className="delinquency-table">
                                <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Description</th>
                                    <th>File Name</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {documents.map((doc, index) => (
                                    <tr key={index}>
                                        <td>{doc.name}</td>
                                        <td>{doc.description || ""}</td>
                                        <td>{doc.fileName}</td>
                                        <td>
                                            <button
                                                className="charges-action-button"
                                                // onClick={() => window.open(doc.fileLocation, "_blank")}
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className={'no-data'}>No documents available.</p>
                        )}

                        {isUploadModalOpen && (
                            <div className="create-provisioning-criteria-modal-overlay">
                                <div className="create-provisioning-criteria-modal-content">
                                    <h4 className="create-modal-title">Upload Document</h4>
                                    <div className="create-provisioning-criteria-group">
                                        <label htmlFor="fileName" className="create-provisioning-criteria-label">
                                            File Name <span>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="fileName"
                                            value={uploadPayload.fileName}
                                            onChange={(e) =>
                                                setUploadPayload((prev) => ({
                                                    ...prev,
                                                    fileName: e.target.value,
                                                }))
                                            }
                                            className="create-provisioning-criteria-input"
                                            required
                                        />
                                    </div>

                                    <div className="create-provisioning-criteria-group">
                                        <label htmlFor="description" className="create-provisioning-criteria-label">
                                            Description
                                        </label>
                                        <textarea
                                            id="description"
                                            value={uploadPayload.description}
                                            onChange={(e) =>
                                                setUploadPayload((prev) => ({
                                                    ...prev,
                                                    description: e.target.value,
                                                }))
                                            }
                                            className="create-provisioning-criteria-input"
                                        />
                                    </div>

                                    <div className="create-provisioning-criteria-group">
                                        <label htmlFor="file" className="create-provisioning-criteria-label">
                                            Select File <span>*</span>
                                        </label>
                                        <input
                                            type="file"
                                            id="file"
                                            onChange={handleFileChange}
                                            className="create-provisioning-criteria-input"
                                            required
                                        />
                                    </div>

                                    <div className="create-provisioning-criteria-modal-actions">
                                        <button
                                            className="create-provisioning-criteria-cancel"
                                            onClick={() => setIsUploadModalOpen(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="create-provisioning-criteria-confirm"
                                            onClick={handleSubmitUpload}
                                            disabled={!uploadPayload.fileName || !uploadPayload.file}
                                        >
                                            Submit
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case "notes":
                return (
                    <div className="tab-content">
                        {/* Add Note Button */}
                        <div className="general-section-header">
                            <button
                                className="create-provisioning-criteria-submit"
                                onClick={() => {
                                    setIsNotesModalOpen(true);
                                    setEditingNoteId(null);
                                    setNewNote("");
                                }}
                            >
                                Add Note
                            </button>
                        </div>

                        {/* Notes List */}
                        {notes.length > 0 ? (
                            <div className="notes-list">
                                {notes.map((note) => (
                                    <div key={note.id} className="note-item">
                                        <div className="note-icon">
                                            <FaStickyNote />
                                        </div>
                                        <div className="note-content">
                                            <p>{note.note}</p>
                                            <small>
                                                Created By: {note.createdByUsername || "Unknown"} |{" "}
                                                {new Date(note.createdOn).toLocaleDateString(undefined, {
                                                    dateStyle: "long",
                                                })}
                                            </small>
                                        </div>
                                        <div className="note-actions">
                                            <button
                                                style={{border: "none"}}
                                                onClick={() => handleEditNote(note)}
                                            >
                                                <FaEdit color={"#56bc23"} size={20} />
                                            </button>
                                            <button
                                                style={{border: "none"}}
                                                onClick={() => handleDeleteNote(note.id)}
                                            >
                                                <FaTrash color={"#e13a3a"} size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="no-data">No notes available</p>
                        )}

                        {/* Modal for Add/Edit Note */}
                        {isNotesModalOpen && (
                            <div className="create-provisioning-criteria-modal-overlay">
                                <div className="create-provisioning-criteria-modal-content">
                                    <h4 className="create-modal-title">
                                        {editingNoteId ? "Edit Note" : "Add Note"}
                                    </h4>
                                    <div className="create-holiday-row">
                                        <div className="create-provisioning-criteria-group">
                                            <label htmlFor="note" className="create-provisioning-criteria-label">
                                                Write Note
                                            </label>
                                            <textarea
                                                id="note"
                                                value={newNote}
                                                placeholder={"Write Note..."}
                                                onChange={(e) => setNewNote(e.target.value)}
                                                className="create-provisioning-criteria-input"
                                                rows="4"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="create-provisioning-criteria-modal-actions">
                                        <button
                                            onClick={() => {
                                                setIsNotesModalOpen(false);
                                                setEditingNoteId(null);
                                                setNewNote("");
                                            }}
                                            className="create-provisioning-criteria-cancel"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveNote}
                                            className="create-provisioning-criteria-confirm"
                                            disabled={!newNote.trim()}
                                        >
                                            Submit
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case "standingInstructions":
                return (
                    <div className="tab-content">
                        {standingInstructions.length > 0 ? (
                            <table className="delinquency-table">
                                <thead>
                                <tr>
                                    <th>Client Name</th>
                                    <th>From Account</th>
                                    <th>Beneficiary</th>
                                    <th>To Account</th>
                                    <th>Type</th>
                                    <th>Validity</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {standingInstructions.map((instruction, index) => (
                                    <tr key={index}>
                                        <td>{instruction?.fromClient?.displayName || ""}</td>
                                        <td>{instruction?.fromAccount?.accountNo || ""}</td>
                                        <td>{instruction?.toClient?.displayName || ""}</td>
                                        <td>{instruction?.toAccount?.accountNo || ""}</td>
                                        {/*<td>*/}
                                        {/*    {instruction.amount*/}
                                        {/*        ? `${instruction.currency?.code || ""} ${instruction.amount.toLocaleString()}`*/}
                                        {/*        : "N/A"}*/}
                                        {/*</td>*/}
                                        <td>
                                            {instruction?.transferType
                                                ? `${instruction?.transferType?.value || ""}`
                                                : ""}
                                        </td>
                                        <td>
                                            {instruction?.validFrom
                                                ? `${new Date(instruction.validFrom).toLocaleDateString(
                                                    "en-GB",
                                                    {
                                                        day: "2-digit",
                                                        month: "long",
                                                        year: "numeric",
                                                    }
                                                )}`
                                                : ""}
                                        </td>
                                        <td>
                                            {/*<button*/}
                                            {/*    className="charges-action-button adjust-charge"*/}
                                            {/*    onClick={() => handleEditInstruction(instruction)}*/}
                                            {/*>*/}
                                            {/*    <FaEdit className="charges-action-icon" />*/}
                                            {/*</button>*/}
                                            <button
                                                className="charges-action-button waive-charge"
                                                onClick={() => handleDeleteInstruction(instruction.id)}
                                            >
                                                <FaTrash className="charges-action-icon" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="no-data">No standing instructions available</p>
                        )}
                    </div>
                );
            default:
                return <div>Content Not Found</div>;
        }
    };

    const checkScrollButtons = () => {
        const container = tabsContainerRef.current;
        if (container) {
            setCanScrollLeft(container.scrollLeft > 0);
            setCanScrollRight(
                container.scrollLeft + container.clientWidth < container.scrollWidth
            );
        }
    };

    const scrollTabs = (direction) => {
        const container = tabsContainerRef.current;
        const scrollAmount = 150;
        if (container) {
            container.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
        }
    };

    useEffect(() => {
        const container = tabsContainerRef.current;
        checkScrollButtons();
        if (container) {
            container.addEventListener("scroll", checkScrollButtons);
        }
        return () => {
            if (container) {
                container.removeEventListener("scroll", checkScrollButtons);
            }
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

    const handleUnblockAccount = async () => {
        const confirmUnblock = window.confirm("Are you sure you want to unblock this account?");

        if (!confirmUnblock) return;

        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                "Content-Type": "application/json",
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
            };

            await axios.post(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/${savingsDetails.id}?command=unblock`,
                {
                    dateFormat: "dd MMMM yyyy",
                    locale: "en",
                },
                { headers }
            );

            showNotification("Account successfully unblocked.", 'success');
            fetchSavingsData();
        } catch (error) {
            console.error("Error unblocking the account:", error);
            showNotification("Failed to unblock the account. Please try again.", 'error');
        }
    };

    const handleModifyApplication = () => {
        navigate(`/client/${clientId}/applications/savings`, {
            state: { isModification: true, accountId: savingsAccountId },
        });
    };

    return (
        <div className="users-page-screen neighbor-element">
            <h2 className="users-page-head">
                <Link to="/clients" className="breadcrumb-link">Clients</Link>{' '}
                <span
                    className="breadcrumb-link"
                    onClick={handleBreadcrumbNavigation}
                >
                    . {' '} {clientDetails?.displayName || "Savings Account"}
                </span>{' '}
                . Savings Account
            </h2>
            <div className="client-details-header">
                <div className="client-image-section">
                    <img
                        src={accountImage}
                        alt="Client"
                        className="client-image"
                    />
                </div>

                <div className="client-info-section">
                    <ul className="client-info-list">
                        <li>
                            <span className="client-info-label">Savings Product:</span>
                            <span className="client-info-value">
                                {savingsDetails?.savingsProductName || "N/A"} ({savingsDetails?.accountNo})
                            </span>
                        </li>
                        <li>
                            <span className="client-info-label">Status:</span>
                            <span className="client-info-value">
                                {savingsDetails?.status?.value || "Unknown"}
                            </span>
                        </li>
                        <li>
                            <span className="client-info-label">Client Name:</span>
                            <span className="client-info-value">
                                {savingsDetails?.clientName || "N/A"}
                            </span>
                        </li>
                    </ul>
                </div>

                <div className="client-info-section">
                    <ul className="client-info-list">
                        <li>
                            <span className="client-info-label">Current Balance:</span>
                            <span className="client-info-value">
                                {savingsDetails?.currency?.code} {savingsDetails?.summary?.accountBalance || "0.00"}
                            </span>
                        </li>
                        <li>
                            <span className="client-info-label">Available Balance:</span>
                            <span className="client-info-value">
                                {savingsDetails?.currency?.code} {savingsDetails?.summary?.availableBalance || "0.00"}
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
                            {savingsDetails?.subStatus?.block ? (
                                <button
                                    className="dropdown-item"
                                    onClick={handleUnblockAccount}
                                >
                                    Unblock Account
                                </button>
                            ) : savingsDetails?.status?.approved && !savingsDetails?.status?.active ? (
                                <>
                                    <button className="dropdown-item" onClick={handleOpenUndoApprovalModal} >
                                        Undo Approval
                                    </button>
                                    <button className="dropdown-item" onClick={handleOpenActivateModal}>
                                        Activate
                                    </button>
                                    <button className="dropdown-item" onClick={handleOpenAddChargeModal}>
                                        Add Charge
                                    </button>
                                    <div className="dropdown-submenu">
                                        <button
                                            className="dropdown-item submenu-toggle"
                                            onClick={() => handleSubmenuToggle("more")}
                                        >
                                            More <FaCaretRight className="submenu-icon"/>
                                        </button>
                                        {activeSubmenu === "more" && (
                                            <div className="submenu-content">
                                                <button className="dropdown-item" onClick={handleOpenTransferFundsModal}>
                                                    Transfer Funds
                                                </button>
                                                {savingsDetails?.fieldOfficerId ? (
                                                    <button className="dropdown-item" onClick={handleOpenAssignStaffModal}>
                                                        Change Staff
                                                    </button>
                                                ) : (
                                                    <button className="dropdown-item" onClick={handleOpenAssignStaffModal}>
                                                        Assign Staff
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : savingsDetails?.status?.submittedAndPendingApproval ? (
                                <>
                                    <button className="dropdown-item" onClick={handleModifyApplication} >
                                        Modify Application
                                    </button>
                                    <button className="dropdown-item" onClick={handleOpenApproveModal} >
                                        Approve
                                    </button>
                                    <div className="dropdown-submenu">
                                        <button
                                            className="dropdown-item submenu-toggle"
                                            onClick={() => handleSubmenuToggle("more")}
                                        >
                                            More <FaCaretRight className="submenu-icon"/>
                                        </button>
                                        {activeSubmenu === "more" && (
                                            <div className="submenu-content">
                                                <button className="dropdown-item" onClick={handleOpenRejectModal}>
                                                    Reject
                                                </button>
                                                <button className="dropdown-item" onClick={handleOpenWithdrawnModal}>
                                                    Withdrawn by Client
                                                </button>
                                                <button className="dropdown-item" onClick={handleOpenAddChargeModal}>
                                                    Add Charge
                                                </button>
                                                <button
                                                    className="dropdown-item"
                                                    onClick={handleDeleteSavingsAccount}
                                                >
                                                    Delete
                                                </button>
                                                <button className="dropdown-item"
                                                        onClick={handleOpenTransferFundsModal}>
                                                    Transfer Funds
                                                </button>
                                                {savingsDetails?.fieldOfficerId ? (
                                                    <button className="dropdown-item"
                                                            onClick={handleOpenAssignStaffModal}>
                                                        Change Staff
                                                    </button>
                                                ) : (
                                                    <button className="dropdown-item"
                                                            onClick={handleOpenAssignStaffModal}>
                                                        Assign Staff
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : savingsDetails?.status?.active ? (
                                <>
                                    <button className="dropdown-item" onClick={handleOpenDepositModal}>
                                        Deposit
                                    </button>
                                    <button className="dropdown-item" onClick={handleOpenBlockDepositModal}>
                                        Block Deposit
                                    </button>
                                    <button className="dropdown-item" onClick={handleOpenWithdrawModal}>
                                        Withdraw
                                    </button>
                                    <button className="dropdown-item" onClick={handleOpenBlockWithdrawalModal}>
                                        Block Withdrawal
                                    </button>
                                    <button className="dropdown-item" onClick={handleOpenBlockAccountModal}>
                                        Block Account
                                    </button>
                                    <button className="dropdown-item" onClick={handleOpenHoldAmountModal}>
                                        Hold Amount
                                    </button>
                                    <button className="dropdown-item" onClick={handleOpenCalculateInterestModal}>
                                        Calculate Interest
                                    </button>
                                    <button className="dropdown-item" onClick={handleOpenPostInterestAsOnModal}>
                                        Post Interest As On
                                    </button>
                                    <div className="dropdown-submenu">
                                        <button
                                            className="dropdown-item submenu-toggle"
                                            onClick={() => handleSubmenuToggle("more")}
                                        >
                                            More <FaCaretRight className="submenu-icon"/>
                                        </button>
                                        {activeSubmenu === "more" && (
                                            <div className="submenu-content">
                                                <button className="dropdown-item" onClick={handleOpenPostInterestModal}>
                                                    Post Interest
                                                </button>
                                                <button className="dropdown-item" onClick={handleOpenAddChargeModal}>
                                                    Add Charge
                                                </button>
                                                <button className="dropdown-item" onClick={handleOpenCloseModal}>
                                                    Close
                                                </button>
                                                <button className="dropdown-item" onClick={handleOpenTransferFundsModal}>
                                                    Transfer Funds
                                                </button>
                                                {savingsDetails?.fieldOfficerId ? (
                                                    <button className="dropdown-item" onClick={handleOpenAssignStaffModal}>
                                                        Change Staff
                                                    </button>
                                                ) : (
                                                    <button className="dropdown-item" onClick={handleOpenAssignStaffModal}>
                                                        Assign Staff
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <button className="dropdown-item" onClick={handleOpenTransferFundsModal}>
                                        Transfer Funds
                                    </button>
                                    {savingsDetails?.fieldOfficerId ? (
                                        <button className="dropdown-item" onClick={handleOpenAssignStaffModal}>
                                            Change Staff
                                        </button>
                                    ) : (
                                        <button className="dropdown-item" onClick={handleOpenAssignStaffModal}>
                                            Assign Staff
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="loan-tabs-container-wrapper">
                {canScrollLeft && (
                    <button
                        className="scroll-button scroll-left"
                        onClick={() => scrollTabs("left")}
                    >
                        <FaCaretLeft/>
                    </button>
                )}
                <div className="client-details-tabs" ref={tabsContainerRef}>
                    {savingsDetails?.status?.closed ||
                    savingsDetails?.status?.withdrawnByApplicant ||
                    savingsDetails?.status?.prematureClosed ? (
                        <></>
                    ) : (
                        [
                            "general",
                            "transactions",
                            "charges",
                            "documents",
                            "notes",
                            "standingInstructions",
                        ].map((tab) => (
                            <button
                                key={tab}
                                className={`loan-tab-button ${activeTab === tab ? "active" : ""}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                            </button>
                        ))
                    )}
                </div>
                {canScrollRight && (
                    <button
                        className="scroll-button scroll-right"
                        onClick={() => scrollTabs("right")}
                    >
                        <FaCaretRight/>
                    </button>
                )}
            </div>

            <div className="client-tab-content">{renderTabContent()}</div>

            {isDepositModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className="create-modal-title">Deposit Money to Savings Account</h4>

                        {/* Transaction Date */}
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="transactionDate" className="create-provisioning-criteria-label">
                                Transaction Date <span>*</span>
                            </label>
                            <DatePicker
                                id="transactionDate"
                                selected={depositTransactionDate}
                                onChange={(date) => setDepositTransactionDate(date)}
                                maxDate={new Date()}
                                dateFormat="dd MMMM yyyy"
                                className="create-provisioning-criteria-input"
                            />
                        </div>

                        {/* Transaction Amount */}
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="transactionAmount" className="create-provisioning-criteria-label">
                                Transaction Amount <span>*</span>
                            </label>
                            <input
                                type="number"
                                id="transactionAmount"
                                value={depositTransactionAmount}
                                onChange={(e) => setDepositTransactionAmount(e.target.value)}
                                className="create-provisioning-criteria-input"
                            />
                        </div>

                        {/* Payment Type */}
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="paymentType" className="create-provisioning-criteria-label">
                                Payment Type <span>*</span>
                            </label>
                            <select
                                id="paymentType"
                                value={depositSelectedPaymentType}
                                onChange={(e) => setDepositSelectedPaymentType(e.target.value)}
                                className="create-provisioning-criteria-input"
                            >
                                <option value="">Select Payment Type</option>
                                {depositPaymentTypeOptions.map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {option.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="create-provisioning-criteria-group">
                            <label className="create-provisioning-criteria-label" htmlFor="receipt">Receipt
                                Number</label>
                            <input
                                type="text"
                                placeholder="Receipt #"
                                value={depositReceiptNumber}
                                onChange={(e) => setDepositReceiptNumber(e.target.value)}
                                className="create-provisioning-criteria-input"
                            />
                        </div>

                        {/* Note */}
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="note" className="create-provisioning-criteria-label">
                                Note
                            </label>
                            <textarea
                                id="note"
                                value={depositNote}
                                placeholder={"Narration...(MPesa/Bank Transaction Number) etc."}
                                onChange={(e) => setDepositNote(e.target.value)}
                                className="create-provisioning-criteria-input"
                            />
                        </div>

                        {/* Modal Actions */}
                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                className="create-provisioning-criteria-cancel"
                                onClick={handleCloseDepositModal}
                            >
                                Cancel
                            </button>
                            <button
                                className="create-provisioning-criteria-confirm"
                                onClick={handleSubmitDeposit}
                                disabled={!depositTransactionDate || !depositTransactionAmount || !depositSelectedPaymentType}
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isBlockDepositModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className="create-modal-title">Block Deposit</h4>
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="blockDepositReason" className="create-provisioning-criteria-label">
                            Reason <span>*</span>
                            </label>
                            <select
                                id="blockDepositReason"
                                value={selectedBlockDepositReason}
                                onChange={(e) => setSelectedBlockDepositReason(e.target.value)}
                                className="create-provisioning-criteria-input"
                            >
                                <option value="">Select Reason</option>
                                {blockDepositReasonOptions.map((reason) => (
                                    <option key={reason.id} value={reason.id}>
                                        {reason.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                onClick={handleCloseBlockDepositModal}
                                className="create-provisioning-criteria-cancel"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitBlockDeposit}
                                className="create-provisioning-criteria-confirm"
                                disabled={!selectedBlockDepositReason || isSubmittingBlockDeposit}
                            >
                                {isSubmittingBlockDeposit ? "Submitting..." : "Submit"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isWithdrawModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className="create-modal-title">Withdraw Money</h4>

                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="withdrawTransactionDate" className="create-provisioning-criteria-label">
                                Transaction Date <span>*</span>
                            </label>
                            <DatePicker
                                id="withdrawTransactionDate"
                                selected={withdrawTransactionDate}
                                onChange={(date) => setWithdrawTransactionDate(date)}
                                dateFormat="dd MMMM yyyy"
                                className="create-provisioning-criteria-input"
                            />
                        </div>

                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="withdrawTransactionAmount" className="create-provisioning-criteria-label">
                                Transaction Amount <span>*</span>
                            </label>
                            <input
                                type="number"
                                id="withdrawTransactionAmount"
                                value={withdrawTransactionAmount}
                                onChange={(e) => setWithdrawTransactionAmount(e.target.value)}
                                className="create-provisioning-criteria-input"
                            />
                        </div>

                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="withdrawPaymentType" className="create-provisioning-criteria-label">
                                Payment Type <span>*</span>
                            </label>
                            <select
                                id="withdrawPaymentType"
                                value={withdrawSelectedPaymentType}
                                onChange={(e) => setWithdrawSelectedPaymentType(e.target.value)}
                                className="create-provisioning-criteria-input"
                            >
                                <option value="">Select Payment Type</option>
                                {withdrawPaymentTypeOptions.map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {option.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="create-provisioning-criteria-group">
                            <label className="create-provisioning-criteria-label" htmlFor="receipt">Receipt
                                Number</label>
                            <input
                                type="text"
                                placeholder="Receipt #"
                                value={withdrawReceiptNumber}
                                onChange={(e) => setWithdrawReceiptNumber(e.target.value)}
                                className="create-provisioning-criteria-input"
                            />
                        </div>

                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="withdrawNote" className="create-provisioning-criteria-label">
                                Note
                            </label>
                            <textarea
                                id="withdrawNote"
                                value={withdrawNote}
                                placeholder={"Narration...(MPesa/Bank Transaction Number) etc."}
                                onChange={(e) => setWithdrawNote(e.target.value)}
                                className="create-provisioning-criteria-input"
                            />
                        </div>

                        <div className="create-provisioning-criteria-modal-actions">
                            <button onClick={handleCloseWithdrawModal} className="create-provisioning-criteria-cancel">
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitWithdraw}
                                className="create-provisioning-criteria-confirm"
                                disabled={!withdrawTransactionDate || !withdrawTransactionAmount || !withdrawSelectedPaymentType}
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isBlockWithdrawalModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className="create-modal-title">Block Withdrawal</h4>

                        {/* Reason Dropdown */}
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="blockWithdrawalReason" className="create-provisioning-criteria-label">
                                Reason <span>*</span>
                            </label>
                            <select
                                id="blockWithdrawalReason"
                                value={blockWithdrawalReason}
                                onChange={(e) => setBlockWithdrawalReason(e.target.value)}
                                className="create-provisioning-criteria-input"
                            >
                                <option value="">Select a reason</option>
                                {blockWithdrawalReasons.map((reason) => (
                                    <option key={reason.id} value={reason.id}>
                                        {reason.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Modal Actions */}
                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                onClick={handleCloseBlockWithdrawalModal}
                                className="create-provisioning-criteria-cancel"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitBlockWithdrawal}
                                className="create-provisioning-criteria-confirm"
                                disabled={!blockWithdrawalReason}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isBlockAccountModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className="create-modal-title">Block Account</h4>

                        {/* Reason Dropdown */}
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="blockAccountReason" className="create-provisioning-criteria-label">
                                Reason <span>*</span>
                            </label>
                            <select
                                id="blockAccountReason"
                                value={blockAccountReason}
                                onChange={(e) => setBlockAccountReason(e.target.value)}
                                className="create-provisioning-criteria-input"
                            >
                                <option value="">Select a reason</option>
                                {blockAccountReasons.map((reason) => (
                                    <option key={reason.id} value={reason.id}>
                                        {reason.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Modal Actions */}
                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                onClick={handleCloseBlockAccountModal}
                                className="create-provisioning-criteria-cancel"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitBlockAccount}
                                className="create-provisioning-criteria-confirm"
                                disabled={!blockAccountReason}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isHoldAmountModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className="create-modal-title">Hold Amount</h4>

                        {/* Reason Dropdown */}
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="holdAmountReason" className="create-provisioning-criteria-label">
                                Reason <span>*</span>
                            </label>
                            <select
                                id="holdAmountReason"
                                value={holdAmountReason}
                                onChange={(e) => setHoldAmountReason(e.target.value)}
                                className="create-provisioning-criteria-input"
                            >
                                <option value="">Select a reason</option>
                                {holdAmountReasons.map((reason) => (
                                    <option key={reason.id} value={reason.id}>
                                        {reason.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Transaction Date */}
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="holdTransactionDate" className="create-provisioning-criteria-label">
                                Transaction Date <span>*</span>
                            </label>
                            <DatePicker
                                id="holdTransactionDate"
                                selected={holdTransactionDate}
                                onChange={(date) => setHoldTransactionDate(date)}
                                maxDate={new Date()}
                                dateFormat="dd MMMM yyyy"
                                className="create-provisioning-criteria-input"
                            />
                        </div>

                        {/* Transaction Amount */}
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="holdTransactionAmount" className="create-provisioning-criteria-label">
                                Transaction Amount <span>*</span>
                            </label>
                            <input
                                type="number"
                                id="holdTransactionAmount"
                                value={holdTransactionAmount}
                                onChange={(e) => setHoldTransactionAmount(e.target.value)}
                                className="create-provisioning-criteria-input"
                            />
                        </div>

                        {/* Modal Actions */}
                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                onClick={handleCloseHoldAmountModal}
                                className="create-provisioning-criteria-cancel"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitHoldAmount}
                                className="create-provisioning-criteria-confirm"
                                disabled={!holdAmountReason || !holdTransactionDate || !holdTransactionAmount}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isCalculateInterestModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className="create-modal-title">Calculate Interest</h4>
                        <p className="create-provisioning-criteria-label">Are you sure you want to calculate interest?</p>
                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                onClick={handleCloseCalculateInterestModal}
                                className="create-provisioning-criteria-cancel"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCalculateInterest}
                                className="create-provisioning-criteria-confirm"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isPostInterestAsOnModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className="create-modal-title">Post Interest As On</h4>
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="transactionDate" className="create-provisioning-criteria-label">
                                Transaction Date <span>*</span>
                            </label>
                            <DatePicker
                                id="transactionDate"
                                selected={postInterestTransactionDate}
                                onChange={(date) => setPostInterestTransactionDate(date)}
                                dateFormat="dd MMMM yyyy"
                                className="create-provisioning-criteria-input"
                            />
                        </div>
                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                onClick={handleClosePostInterestAsOnModal}
                                className="create-provisioning-criteria-cancel"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePostInterestAsOn}
                                className="create-provisioning-criteria-confirm"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isPostInterestModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className="create-modal-title">Post Interest</h4>
                        <p className="create-provisioning-criteria-label">Are you sure you want to post interest?</p>
                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                onClick={handleClosePostInterestModal}
                                className="create-provisioning-criteria-cancel"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePostInterest}
                                className="create-provisioning-criteria-confirm"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isAddChargeModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className="create-modal-title">Add Charge</h4>

                        {/* Charge Dropdown */}
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="charge" className="create-provisioning-criteria-label">
                                Charge <span>*</span>
                            </label>
                            <select
                                id="charge"
                                value={selectedCharge?.id || ""}
                                onChange={(e) => {
                                    const selected = chargeOptions.find(
                                        (option) => option.id === parseInt(e.target.value, 10)
                                    );
                                    setSelectedCharge(selected || null);
                                    setChargeAmount(selected?.amount || "");
                                }}
                                className="create-provisioning-criteria-input"
                            >
                                <option value="">Select Charge</option>
                                {chargeOptions.map((charge) => (
                                    <option key={charge.id} value={charge.id}>
                                        {charge.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Amount Field */}
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="amount" className="create-provisioning-criteria-label">
                                Amount <span>*</span>
                            </label>
                            <input
                                type="number"
                                id="amount"
                                value={chargeAmount}
                                onChange={(e) => setChargeAmount(e.target.value)}
                                className="create-provisioning-criteria-input"
                                required
                            />
                        </div>

                        {/* Charge Calculation Type */}
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="calculationType" className="create-provisioning-criteria-label">
                                Charge Calculation
                            </label>
                            <input
                                type="text"
                                id="calculationType"
                                value={selectedCharge?.chargeCalculationType?.value || ""}
                                className="create-provisioning-criteria-input"
                                disabled
                            />
                        </div>

                        {/* Charge Time Type */}
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="timeType" className="create-provisioning-criteria-label">
                                Charge Time Type
                            </label>
                            <input
                                type="text"
                                id="timeType"
                                value={selectedCharge?.chargeTimeType?.value || ""}
                                className="create-provisioning-criteria-input"
                                disabled
                            />
                        </div>

                        {/* Due Date Field */}
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="dueDate" className="create-provisioning-criteria-label">
                                Due for Collection On <span>*</span>
                            </label>
                            <DatePicker
                                id="dueDate"
                                selected={dueDate}
                                onChange={(date) => setDueDate(date)}
                                className="create-provisioning-criteria-input"
                                dateFormat="dd MMMM yyyy"
                            />
                        </div>

                        {/* Modal Actions */}
                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                onClick={handleCloseAddChargeModal}
                                className="create-provisioning-criteria-cancel"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitAddCharge}
                                className="create-provisioning-criteria-confirm"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isCloseModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className="create-modal-title">Close Account</h4>

                        {/* Closed On Date */}
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="transactionDate" className="create-provisioning-criteria-label">
                                Closed On Date <span>*</span>
                            </label>
                            <DatePicker
                                id="transactionDate"
                                selected={closeTransactionDate}
                                onChange={(date) => setCloseTransactionDate(date)}
                                className="create-provisioning-criteria-input"
                                dateFormat="dd MMMM yyyy"
                            />
                        </div>

                        {/* Checkboxes */}
                        <div className="create-provisioning-criteria-group">
                            <label className={"create-provisioning-criteria-label"}>
                                <input
                                    type="checkbox"
                                    checked={isWithdrawBalance}
                                    onChange={(e) => setIsWithdrawBalance(e.target.checked)}
                                /> {" "}Withdraw Balance
                            </label>
                            <label className={"create-provisioning-criteria-label"}>
                                <input
                                    type="checkbox"
                                    checked={isInterestPostingRequired}
                                    onChange={(e) => setIsInterestPostingRequired(e.target.checked)}
                                />{" "} Is Interest Posting Required on Closure Date?
                            </label>
                        </div>

                        {/* Withdraw Balance Fields */}
                        {isWithdrawBalance && (
                            <>
                                <div className="create-provisioning-criteria-group">
                                    <label htmlFor="transactionAmount" className="create-provisioning-criteria-label">
                                        Transaction Amount
                                    </label>
                                    <input
                                        type="number"
                                        id="transactionAmount"
                                        value={closeTransactionAmount}
                                        className="create-provisioning-criteria-input"
                                        disabled
                                    />
                                </div>

                                <div className="create-provisioning-criteria-group">
                                    <label htmlFor="paymentType" className="create-provisioning-criteria-label">
                                        Payment Type <span>*</span>
                                    </label>
                                    <select
                                        id="paymentType"
                                        value={closeSelectedPaymentType}
                                        onChange={(e) => setCloseSelectedPaymentType(e.target.value)}
                                        className="create-provisioning-criteria-input"
                                    >
                                        <option value="">Select Payment Type</option>
                                        {closePaymentTypeOptions.map((option) => (
                                            <option key={option.id} value={option.id}>
                                                {option.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="create-holiday-row">
                                    <label className="create-provisioning-criteria-label">
                                        Show Payment Details
                                    </label>
                                    <div className="switch-toggle">
                                        <label className="switch">
                                            <input
                                                type="checkbox"
                                                checked={showClosePaymentDetails}
                                                onChange={(e) => setShowClosePaymentDetails(e.target.checked)}
                                            />
                                            <span className="slider round"></span>
                                        </label>
                                    </div>
                                </div>

                                {showClosePaymentDetails && (
                                    <>
                                        <div className="create-holiday-row">
                                            <input
                                                type="text"
                                                placeholder="Account #"
                                                value={closeAccountNumber}
                                                onChange={(e) => setCloseAccountNumber(e.target.value)}
                                                className="create-provisioning-criteria-input"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Cheque #"
                                                value={closeChequeNumber}
                                                onChange={(e) => setCloseChequeNumber(e.target.value)}
                                                className="create-provisioning-criteria-input"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Routing Code"
                                                value={closeRoutingCode}
                                                onChange={(e) => setCloseRoutingCode(e.target.value)}
                                                className="create-provisioning-criteria-input"
                                            />
                                        </div>
                                        <div className="create-holiday-row">
                                            <input
                                                type="text"
                                                placeholder="Receipt #"
                                                value={closeReceiptNumber}
                                                onChange={(e) => setCloseReceiptNumber(e.target.value)}
                                                className="create-provisioning-criteria-input"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Bank #"
                                                value={closeBankNumber}
                                                onChange={(e) => setCloseBankNumber(e.target.value)}
                                                className="create-provisioning-criteria-input"
                                            />
                                        </div>
                                    </>
                                )}
                            </>
                        )}

                        {/* Note */}
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="note" className="create-provisioning-criteria-label">Note</label>
                            <textarea
                                id="note"
                                value={closeNote}
                                onChange={(e) => setCloseNote(e.target.value)}
                                className="create-provisioning-criteria-input"
                            />
                        </div>

                        {/* Actions */}
                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                onClick={handleCloseCloseModal}
                                className="create-provisioning-criteria-cancel"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitClose}
                                className="create-provisioning-criteria-confirm"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isTransferFundsModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className="create-modal-title">Transfer Funds</h4>

                        {/* Transferring From Details */}
                        <h5 className="create-provisioning-criteria-label">Transferring From Details</h5>
                        <table className="vertical-table">
                            <tbody className="create-provisioning-criteria-label">
                            <tr>
                                <td>Applicant</td>
                                <td>{transferApplicant}</td>
                            </tr>
                            <tr>
                                <td>Office</td>
                                <td>{transferOffice}</td>
                            </tr>
                            <tr>
                                <td>From Account</td>
                                <td>{transferFromAccount}</td>
                            </tr>
                            <tr>
                                <td>From Account Type</td>
                                <td>{transferFromAccountType}</td>
                            </tr>
                            <tr>
                                <td>Currency</td>
                                <td>{transferCurrency}</td>
                            </tr>
                            </tbody>
                        </table>

                        {/* Transfer To Details */}
                        <h5 className="create-provisioning-criteria-label">Transfer To</h5>
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="transactionDate" className="create-provisioning-criteria-label">Transaction Date <span>*</span></label>
                            <DatePicker
                                id="transactionDate"
                                selected={transferTransactionDate}
                                onChange={(date) => setTransferTransactionDate(date)}
                                dateFormat="dd MMMM yyyy"
                                className="create-provisioning-criteria-input"
                            />
                        </div>
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="toOffice" className="create-provisioning-criteria-label">Office <span>*</span></label>
                            <select
                                id="toOffice"
                                value={transferToOffice}
                                onChange={(e) => setTransferToOffice(e.target.value)}
                                className="create-provisioning-criteria-input"
                            >
                                <option value="">Select Office</option>
                                {transferToOfficeOptions.map((office) => (
                                    <option key={office.id} value={office.id}>{office.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="toClient" className="create-provisioning-criteria-label">Client <span>*</span></label>
                            <select
                                id="toClient"
                                value={transferToClient}
                                onChange={(e) => setTransferToClient(e.target.value)}
                                className="create-provisioning-criteria-input"
                            >
                                <option value="">Select Client</option>
                                {transferToClientOptions.map((client) => (
                                    <option key={client.id} value={client.id}>{client.displayName}</option>
                                ))}
                            </select>
                        </div>
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="toAccountType" className="create-provisioning-criteria-label">Account Type <span>*</span></label>
                            <select
                                id="toAccountType"
                                value={transferToAccountType}
                                onChange={(e) => setTransferToAccountType(e.target.value)}
                                className="create-provisioning-criteria-input"
                            >
                                <option value="">Select Account Type</option>
                                {transferToAccountTypeOptions.map((type) => (
                                    <option key={type.id} value={type.id}>{type.value}</option>
                                ))}
                            </select>
                        </div>
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="toAccount" className="create-provisioning-criteria-label">Account <span>*</span></label>
                            <select
                                id="toAccount"
                                value={transferToAccount}
                                onChange={(e) => setTransferToAccount(e.target.value)}
                                className="create-provisioning-criteria-input"
                            >
                                <option value="">Select Account</option>
                                {transferToAccountOptions.map((account) => (
                                    <option key={account.id} value={account.id}>{account.accountNo}</option>
                                ))}
                            </select>
                        </div>
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="transferAmount" className="create-provisioning-criteria-label">Amount <span>*</span></label>
                            <input
                                type="number"
                                id="transferAmount"
                                value={transferAmount}
                                onChange={(e) => setTransferAmount(e.target.value)}
                                className="create-provisioning-criteria-input"
                            />
                        </div>
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="description" className="create-provisioning-criteria-label">Description <span>*</span></label>
                            <textarea
                                id="description"
                                value={transferDescription}
                                onChange={(e) => setTransferDescription(e.target.value)}
                                className="create-provisioning-criteria-input"
                            />
                        </div>

                        {/* Actions */}
                        <div className="create-provisioning-criteria-modal-actions">
                            <button onClick={handleCloseTransferFundsModal} className="create-provisioning-criteria-cancel">
                                Cancel
                            </button>
                            <button onClick={handleSubmitTransferFunds} className="create-provisioning-criteria-confirm">
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isAssignStaffModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className="create-modal-title">Assign Staff</h4>
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="toStaff" className="create-provisioning-criteria-label">To Savings Officer <span>*</span></label>
                            <select
                                id="toStaff"
                                value={assignToStaff}
                                onChange={(e) => setAssignToStaff(e.target.value)}
                                className="create-provisioning-criteria-input"
                            >
                                <option value="">Select Officer</option>
                                {assignStaffOptions.map((officer) => (
                                    <option key={officer.id} value={officer.id}>
                                        {officer.displayName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="assignmentDate" className="create-provisioning-criteria-label">Assignment Date <span>*</span></label>
                            <DatePicker
                                id="assignmentDate"
                                selected={assignmentDate}
                                onChange={(date) => setAssignmentDate(date)}
                                dateFormat="dd MMMM yyyy"
                                className="create-provisioning-criteria-input"
                            />
                        </div>
                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                onClick={handleCloseAssignStaffModal}
                                className="create-provisioning-criteria-cancel"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitAssignStaff}
                                className="create-provisioning-criteria-confirm"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isExportModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className="create-modal-title">Export Transactions Report</h4>
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="fromDate" className="create-provisioning-criteria-label">From Date <span>*</span></label>
                            <DatePicker
                                id="fromDate"
                                selected={exportFromDate}
                                onChange={(date) => {
                                    setExportFromDate(date);
                                    setExportToDate(null);
                                }}
                                maxDate={new Date()}
                                dateFormat="dd MMMM yyyy"
                                className="create-provisioning-criteria-input"
                            />
                        </div>
                        <div className="create-provisioning-criteria-group">
                            <label htmlFor="toDate" className="create-provisioning-criteria-label">To Date <span>*</span></label>
                            <DatePicker
                                id="toDate"
                                selected={exportToDate}
                                onChange={(date) => setExportToDate(date)}
                                minDate={exportFromDate}
                                maxDate={new Date()}
                                dateFormat="dd MMMM yyyy"
                                className="create-provisioning-criteria-input"
                                disabled={!exportFromDate}
                            />
                        </div>
                        <div className="create-provisioning-criteria-modal-actions">
                            <button className="create-provisioning-criteria-cancel" onClick={handleCloseExportModal}>
                                Cancel
                            </button>
                            <button
                                className="create-provisioning-criteria-confirm"
                                onClick={handleGenerateReport}
                                disabled={!exportFromDate || !exportToDate}
                            >
                                Generate Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isTransactionModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div
                        className="create-provisioning-criteria-modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h4 className="create-modal-title">Transaction Details</h4>
                        {transactionDetails?.transferAmount ? (
                            <table className="create-provisioning-criteria-table">
                                <tbody>
                                <tr>
                                    <td className="create-provisioning-criteria-label">Transaction Amount</td>
                                    <td>
                                        {`${transactionDetails.currency?.code || ""} ${transactionDetails.transferAmount.toFixed(2)} (${transactionDetails.currency?.code || ""})`}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="create-provisioning-criteria-label">Transaction Date</td>
                                    <td>
                                        {transactionDetails.transferDate
                                            ? new Date(transactionDetails.transferDate.join("-")).toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "long",
                                                year: "numeric",
                                            })
                                            : ""}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="create-provisioning-criteria-label">Destination</td>
                                    <td>{transactionDetails.transferDescription || ""}</td>
                                </tr>
                                <tr>
                                    <td className="create-provisioning-criteria-label">Transferred From</td>
                                    <td>
                                        <ul>
                                            <li>Office: {transactionDetails.fromOffice?.name || ""}</li>
                                            <li>Client: {transactionDetails.fromClient?.displayName || ""}</li>
                                            <li>Account Type: {transactionDetails.fromAccountType?.value || ""}</li>
                                            <li>Account No: {transactionDetails.fromAccount?.accountNo || ""}</li>
                                        </ul>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="create-provisioning-criteria-label">Transferred To</td>
                                    <td>
                                        <ul>
                                            <li>Office: {transactionDetails.toOffice?.name || ""}</li>
                                            <li>Client: {transactionDetails.toClient?.displayName || ""}</li>
                                            <li>Account Type: {transactionDetails.toAccountType?.value || ""}</li>
                                            <li>Account No: {transactionDetails.toAccount?.accountNo || ""}</li>
                                        </ul>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        ) : (
                            <table className="create-provisioning-criteria-table">
                                <tbody>
                                <tr>
                                    <td className="create-provisioning-criteria-label">ID</td>
                                    <td>{transactionDetails.id || ""}</td>
                                </tr>
                                <tr>
                                    <td className="create-provisioning-criteria-label">Transaction Type</td>
                                    <td>{transactionDetails.transactionType?.value || ""}</td>
                                </tr>
                                <tr>
                                    <td className="create-provisioning-criteria-label">Transaction Date</td>
                                    <td>
                                        {transactionDetails.date
                                            ? new Date(transactionDetails.date.join("-")).toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "long",
                                                year: "numeric",
                                            })
                                            : ""}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="create-provisioning-criteria-label">Currency</td>
                                    <td>{transactionDetails.currency?.name || ""}</td>
                                </tr>
                                <tr>
                                    <td className="create-provisioning-criteria-label">Amount</td>
                                    <td>{`${transactionDetails.currency?.code || ""} ${transactionDetails.amount.toFixed(2)}`}</td>
                                </tr>
                                <tr>
                                    <td className="create-provisioning-criteria-label">Note</td>
                                    <td>{transactionDetails.note || ""}</td>
                                </tr>
                                <tr>
                                    <td className="create-provisioning-criteria-label">Payment Type</td>
                                    <td>{transactionDetails.paymentDetailData?.paymentType?.name || ""}</td>
                                </tr>
                                <tr>
                                    <td className="create-provisioning-criteria-label">Payment Details</td>
                                    <td>Receipt: {transactionDetails.paymentDetailData?.receiptNumber || ""}</td>
                                </tr>
                                </tbody>
                            </table>
                        )}
                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                className="create-provisioning-criteria-cancel"
                                onClick={() => setIsTransactionModalOpen(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isJournalEntriesModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className="create-modal-title">Journal Entries</h4>
                        <table className="create-provisioning-criteria-table">
                            <thead>
                            <tr>
                                <th>GL Account</th>
                                <th>Debit</th>
                                <th>Credit</th>
                                <th>Transaction Date</th>
                                <th>Office</th>
                            </tr>
                            </thead>
                            <tbody>
                            {journalEntries && journalEntries.length > 0 ? (
                                journalEntries.map((entry, index) => (
                                    <tr key={index}>
                                        <td>{entry.glAccountName || "N/A"}</td>
                                        <td>{entry.debitAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</td>
                                        <td>{entry.creditAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</td>
                                        <td>
                                            {entry.transactionDate
                                                ? new Date(entry.transactionDate).toLocaleDateString("en-GB", {
                                                    day: "2-digit",
                                                    month: "long",
                                                    year: "numeric",
                                                })
                                                : "N/A"}
                                        </td>
                                        <td>{entry.officeName || "N/A"}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td className={"no-data"} colSpan="5" style={{ textAlign: "center" }}>No journal entries available.</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                onClick={() => setIsJournalEntriesModalOpen(false)}
                                className="create-provisioning-criteria-cancel"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isUndoApprovalModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className="create-modal-title">Undo Approval</h4>

                        <div className="create-provisioning-criteria-group">
                            <label className="create-provisioning-criteria-label">Note <span>*</span></label>
                            <textarea
                                value={undoApprovalNote}
                                onChange={(e) => setUndoApprovalNote(e.target.value)}
                                className="create-provisioning-criteria-input"
                                placeholder="Enter reason for undoing approval..."
                            />
                        </div>

                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                onClick={handleCloseUndoApprovalModal}
                                className="create-provisioning-criteria-cancel"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUndoApproval}
                                className="create-provisioning-criteria-confirm"
                                disabled={isProcessingUndo}
                            >
                                {isProcessingUndo ? "Processing..." : "Submit"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isApproveModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className="create-modal-title">Approve Savings Account</h4>

                        <div className="create-provisioning-criteria-group">
                            <label className="create-provisioning-criteria-label">Approval Date <span>*</span></label>
                            <DatePicker
                                selected={approveForm.approvedOnDate}
                                onChange={(date) => setApproveForm((prev) => ({ ...prev, approvedOnDate: date }))}
                                className="create-provisioning-criteria-input"
                                dateFormat="dd MMMM yyyy"
                                maxDate={new Date()}
                            />
                        </div>

                        <div className="create-provisioning-criteria-group">
                            <label className="create-provisioning-criteria-label">Note</label>
                            <textarea
                                value={approveForm.note}
                                onChange={(e) => setApproveForm((prev) => ({ ...prev, note: e.target.value }))}
                                className="create-provisioning-criteria-input"
                                placeholder="Enter note..."
                            />
                        </div>

                        <div className="create-provisioning-criteria-modal-actions">
                            <button onClick={handleCloseApproveModal} className="create-provisioning-criteria-cancel">
                                Cancel
                            </button>
                            <button
                                onClick={handleApproveAccount}
                                className="create-provisioning-criteria-confirm"
                                disabled={!approveForm.approvedOnDate}
                            >
                                {isProcessingApproval ? "Processing..." : "Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isRejectModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className="create-modal-title">Reject Account</h4>

                        <div className="create-provisioning-criteria-group">
                            <label className="create-provisioning-criteria-label">
                                Rejected On Date <span>*</span>
                            </label>
                            <DatePicker
                                selected={rejectForm.rejectedOnDate}
                                onChange={(date) => setRejectForm({ ...rejectForm, rejectedOnDate: date })}
                                className="create-provisioning-criteria-input"
                                dateFormat="dd MMMM yyyy"
                                maxDate={new Date()}
                            />
                        </div>

                        <div className="create-provisioning-criteria-group">
                            <label className="create-provisioning-criteria-label">Note</label>
                            <textarea
                                value={rejectForm.note}
                                onChange={(e) => setRejectForm({ ...rejectForm, note: e.target.value })}
                                className="create-provisioning-criteria-input"
                                placeholder="Enter a reason for rejection"
                            />
                        </div>

                        <div className="create-provisioning-criteria-modal-actions">
                            <button onClick={handleCloseRejectModal} className="create-provisioning-criteria-cancel">
                                Cancel
                            </button>
                            <button
                                onClick={() => handleRejectAccount()}
                                className="create-provisioning-criteria-confirm"
                                disabled={!rejectForm.rejectedOnDate}
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isWithdrawnModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className="create-modal-title">Withdrawn by Client</h4>

                        <div className="create-provisioning-criteria-group">
                            <label className="create-provisioning-criteria-label">
                                Withdrawn On Date <span>*</span>
                            </label>
                            <DatePicker
                                selected={withdrawnForm.withdrawnOnDate}
                                onChange={(date) => setWithdrawnForm({ ...withdrawnForm, withdrawnOnDate: date })}
                                className="create-provisioning-criteria-input"
                                dateFormat="dd MMMM yyyy"
                                maxDate={new Date()}
                            />
                        </div>

                        <div className="create-provisioning-criteria-group">
                            <label className="create-provisioning-criteria-label">Note</label>
                            <textarea
                                value={withdrawnForm.note}
                                onChange={(e) => setWithdrawnForm({ ...withdrawnForm, note: e.target.value })}
                                className="create-provisioning-criteria-input"
                                placeholder="Enter a reason for withdrawal"
                            />
                        </div>

                        <div className="create-provisioning-criteria-modal-actions">
                            <button onClick={handleCloseWithdrawnModal} className="create-provisioning-criteria-cancel">
                                Cancel
                            </button>
                            <button
                                onClick={() => handleWithdrawnByClient()}
                                className="create-provisioning-criteria-confirm"
                                disabled={!withdrawnForm.withdrawnOnDate}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isActivateModalOpen && (
                <div className="create-provisioning-criteria-modal-overlay">
                    <div className="create-provisioning-criteria-modal-content">
                        <h4 className="create-modal-title">Activate Savings Account</h4>

                        <div className="create-provisioning-criteria-group">
                            <label className="create-provisioning-criteria-label">
                                Activated On Date <span>*</span>
                            </label>
                            <DatePicker
                                selected={activateForm.activatedOnDate}
                                onChange={(date) => setActivateForm({ ...activateForm, activatedOnDate: date })}
                                className="create-provisioning-criteria-input"
                                dateFormat="dd MMMM yyyy"
                                maxDate={new Date()}
                            />
                        </div>

                        <div className="create-provisioning-criteria-modal-actions">
                            <button onClick={handleCloseActivateModal} className="create-provisioning-criteria-cancel">
                                Cancel
                            </button>
                            <button
                                onClick={handleActivateAccount}
                                className="create-provisioning-criteria-confirm"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SavingsAccounts;
