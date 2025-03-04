import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {useLocation, useNavigate, useParams} from 'react-router-dom';
import { AuthContext } from '../../../../context/AuthContext';
import { useLoading } from '../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../config';
import DatePicker from "react-datepicker";
import {FaTrash} from "react-icons/fa";
import {NotificationContext} from "../../../../context/NotificationContext";

const LoanAccount = () => {
    const { clientId } = useParams();
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();
    const navigate = useNavigate();
    const location = useLocation();
    const { isModification, accountId } = location.state || {};
    const [isModifying, setIsModifying] = useState(isModification || false);
    const [account ] = useState(accountId || null);

    const [currentStage, setCurrentStage] = useState('Details');
    const [clientData, setClientData] = useState(null);
    const [loanTemplate, setLoanTemplate] = useState(null);
    const [datatableInfo, setDatatableInfo] = useState(null);
    const [clientAccounts, setClientAccounts] = useState(null);
    const [collateralTemplate, setCollateralTemplate] = useState(null);
    const [collaterals, setCollaterals] = useState([]);
    const [isCollateralModalOpen, setIsCollateralModalOpen] = useState(false);
    const [selectedCollateral, setSelectedCollateral] = useState('');
    const [quantity, setQuantity] = useState('');
    const [overdueCharges, setCharges] = useState([]);
    const [officerId, setOfficerId] = useState(null);

    const [formData, setFormData] = useState({
        productName: "",
        externalId: "",
        loanOfficer: "",
        loanPurpose: "",
        fund: "",
        submittedOn: null,
        disbursementOn: null,
        linkSavings: "",
        createStandingInstructions: false,
        principal: "",
        loanTerm: "",
        frequency: "",
        numberOfRepayments: "",
        repaidEvery: "",
        frequencyRepaidEvery: "",
        nominalInterestRate: "",
        interestRateFrequencyType: "",
        interestMethod: "",
        amortization: "",
        isEqualAmortization: false,
    });

    const [submittedOn, setSubmittedOn] = useState('');

    const [loanDetails, setLoanDetails] = useState({});

    const [visitedStages, setVisitedStages] = useState([]);
    const [modifyData, setModifyData] = useState(null);

    const stages = ['Details', 'Terms', 'Charges', 'Repayment Schedule', "Preview"];

    useEffect(() => {
        if (isModifying) {
            const fetchModificationData = async () => {
                startLoading();
                try {
                    const headers = {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    };

                    const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/loans/${account}?associations=charges,collateral,meeting,multiDisburseDetails&staffInSelectedOfficeOnly=true&template=true`,
                        { headers });
                    setModifyData(response.data);
                } catch (error) {
                    console.error('Error fetching modification data', error);
                }
            };

            fetchModificationData();
        }
    }, [isModifying]);

    useEffect(() => {
        if (modifyData) {
            setFormData((prev) => ({
                ...prev,
                productName: modifyData?.loanProductId,
                externalId: modifyData?.externalId,
                loanOfficer: modifyData?.loanOfficerId,
                loanPurpose: modifyData?.loanPurposeId,
                fund: modifyData?.fundId,
                submittedOn: setDateForSubmittedOn(modifyData?.timeline?.submittedOnDate),
                disbursementOn: setDateForSubmittedOn(modifyData?.timeline?.expectedDisbursementDate),
                linkSavings: modifyData?.linkedAccount?.id,
                createStandingInstructions: modifyData?.createStandingInstructionAtDisbursement,
                principal: modifyData?.principal,
                loanTerm: modifyData?.termFrequency,
                frequency: modifyData?.termPeriodFrequencyType?.id,
                numberOfRepayments: modifyData?.numberOfRepayments,
                repaidEvery: modifyData?.repaymentEvery,
                frequencyRepaidEvery: modifyData?.repaymentFrequencyType.id,
                nominalInterestRate: modifyData?.interestRatePerPeriod,
                interestRateFrequencyType: modifyData?.interestRateFrequencyType.id,
                interestMethod: modifyData?.interestType.id,
                amortization: modifyData?.amortizationType.id,
                isEqualAmortization: modifyData?.isEqualAmortization,

            }));
        }
    }, [modifyData]);

    useEffect(() => {
        if (loanTemplate) {
            setFormData(prev => ({
                ...prev,
                linkSavings: loanTemplate?.accountLinkingOptions?.length > 0
                    ? loanTemplate.accountLinkingOptions[0].id
                    : ""
            }));
        }
    }, [loanTemplate]);

    const setDateForSubmittedOn = (submittedOnDate) => {
        if (submittedOnDate && submittedOnDate.length === 3) {
            const [year, month, day] = submittedOnDate;
            setSubmittedOn(new Date(year, month - 1, day));
        } else {
            setSubmittedOn("");
        }
    };

    useEffect(() => {
        if (loanTemplate) {
            setFormData({
                principal: loanTemplate?.principal || '',
                loanTerm: loanTemplate?.termFrequency || '',
                frequency: loanTemplate?.termFrequencyType?.id || '',
                numberOfRepayments: loanTemplate?.numberOfRepayments || '',
                firstRepayment: loanTemplate?.expectedFirstRepaymentOnDate || '',
                interestChargedFrom: loanTemplate?.interestChargedFromDate || '',
                repaidEvery: loanTemplate?.repaymentEvery || '',
                frequencyRepaidEvery: loanTemplate?.repaymentFrequencyType?.id || '',
                nominalInterestRate: loanTemplate?.interestRatePerPeriod || '',
                interestRateFrequencyType: loanTemplate?.interestRateFrequencyType?.id || '',
                interestMethod: loanTemplate?.interestType?.id || '',
                amortization: loanTemplate?.amortizationType?.id || '',
                isEqualAmortization: loanTemplate?.isEqualAmortization || false,
            });
        }
    }, [loanTemplate]);

    const formatDateForPayload = (date) => {
        return date
            .toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
            })
            .replace(",", "");
    };

    const handleGenerateRepaymentSchedule = async () => {
        try {
            startLoading();

            const payload = {
                amortizationType: formData.amortization || loanTemplate?.amortizationType?.id || null,
                charges: formData.addedCharges?.map(charge => ({
                    chargeId: charge.id,
                    amount: charge.amount || 0,
                    ...(charge.dueDate ? { dueDate: formatDateForPayload(new Date(charge.dueDate)) } : {}),
                })) || [],
                clientId: parseInt(clientId, 10) || null,
                collateral: [],
                createStandingInstructionAtDisbursement: formData.createStandingInstructions ?? false,
                dateFormat: "dd MMMM yyyy",
                expectedDisbursementDate: formData.disbursementOn
                    ? formatDateForPayload(new Date(formData.disbursementOn))
                    : null,
                externalId: formData.externalId?.trim() || "",
                fundId: formData.fund ? parseInt(formData.fund, 10) : loanTemplate?.fundOptions?.[0]?.id || null,
                graceOnArrearsAgeing: formData.graceOnArrearsAgeing
                    ? parseInt(formData.graceOnArrearsAgeing, 10)
                    : loanTemplate?.graceOnArrearsAgeing || 0,
                interestCalculationPeriodType: formData.interestMethod || loanTemplate?.interestType?.id || null,
                interestChargedFromDate: formData.interestChargedFrom
                    ? formatDateForPayload(new Date(formData.interestChargedFrom))
                    : null,
                interestRateFrequencyType: formData.interestRateFrequencyType || loanTemplate?.interestRateFrequencyType?.id || null,
                interestRatePerPeriod: formData.nominalInterestRate
                    ? parseFloat(formData.nominalInterestRate)
                    : loanTemplate?.interestRatePerPeriod || 0,
                interestType: formData.interestMethod || loanTemplate?.interestType?.id || null,
                isEqualAmortization: formData.isEqualAmortization ?? loanTemplate?.isEqualAmortization ?? false,
                isTopup: formData.isTopup ?? false,
                linkAccountId: formData.linkSavings ? parseInt(formData.linkSavings, 10) : loanTemplate?.accountLinkingOptions?.[0]?.id || null,
                loanOfficerId: formData.loanOfficer ? parseInt(formData.loanOfficer, 10) : loanTemplate?.loanOfficerOptions?.[0]?.id || null,
                loanPurposeId: formData.loanPurpose ? parseInt(formData.loanPurpose, 10) : loanTemplate?.loanPurposeOptions?.[0]?.id || null,
                loanTermFrequency: formData.loanTerm ? parseInt(formData.loanTerm, 10) : loanTemplate?.termFrequency || null,
                loanTermFrequencyType: formData.frequency || loanTemplate?.termPeriodFrequencyType?.id || null,
                loanType: "individual",
                locale: "en",
                numberOfRepayments: formData.numberOfRepayments ? parseInt(formData.numberOfRepayments, 10) : loanTemplate?.numberOfRepayments || null,
                principal: formData.principal ? parseFloat(formData.principal) : loanTemplate?.principal || 0,
                productId: formData.productName ? parseInt(formData.productName, 10) : loanTemplate?.product?.id || null,
                repaymentEvery: formData.repaidEvery ? parseInt(formData.repaidEvery, 10) : loanTemplate?.repaymentEvery || null,
                repaymentFrequencyDayOfWeekType: formData.selectDay || "",
                repaymentFrequencyNthDayType: formData.selectOn || "",
                repaymentFrequencyType: formData.frequencyRepaidEvery || loanTemplate?.repaymentFrequencyType?.id || null,
                repaymentsStartingFromDate: formData.firstRepayment
                    ? formatDateForPayload(new Date(formData.firstRepayment))
                    : null,
                submittedOnDate: formData.submittedOn
                    ? formatDateForPayload(new Date(formData.submittedOn))
                    : null,
                transactionProcessingStrategyCode: "principal-interest-penalties-fees-order-strategy",
            };

            const response = await axios.post(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/loans?command=calculateLoanSchedule`,
                payload,
                {
                    headers: {
                        Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            setLoanDetails(response.data);
        } catch (error) {
            const errorMessage = error.response?.data?.errors?.[0]?.defaultUserMessage ||
                error.response?.data?.defaultUserMessage ||
                "An unexpected error occurred.";
            showNotification(errorMessage, 'error');
        } finally {
            stopLoading();
        }
    };

    const fetchData = async () => {
        if (!clientId) {
            console.error("clientId is missing, skipping data fetch.");
            return;
        }

        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
            };

            const clientRequest = axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/clients/${clientId}`, { headers });
            const loanTemplateRequest = axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/loans/template?activeOnly=true&staffInSelectedOfficeOnly=true&clientId=${clientId}&templateType=individual`, { headers });
            const datatableRequest = axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/datatables?apptable=m_client`, { headers });
            const clientAccountsRequest = axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/clients/${clientId}/accounts`, { headers });
            const collateralsRequest = axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/clients/${clientId}/collaterals/template`, { headers });
            const chargesRequest = axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/clients/${clientId}/charges?pendingPayment=true`, { headers });

            const responses = await Promise.allSettled([
                clientRequest,
                loanTemplateRequest,
                datatableRequest,
                clientAccountsRequest,
                collateralsRequest,
                chargesRequest
            ]);

            responses.forEach((response, index) => {
                if (response.status === "fulfilled") {
                    switch (index) {
                        case 0:
                            setClientData(response.value.data);
                            setOfficerId(prev => {
                                return response.value.data?.staffId;
                            });
                            break;
                        case 1: setLoanTemplate(response.value.data); break;
                        case 2: setDatatableInfo(response.value.data); break;
                        case 3: setClientAccounts(response.value.data); break;
                        case 4: setCollateralTemplate(response.value.data); break;
                        case 5: setCharges(response.value.data.pageItems); break;
                        default: break;
                    }
                } else {
                    console.error(`Error in request ${index}:`, response.reason);
                }
            });

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            stopLoading();
        }
    };

    useEffect(() => {
        if (officerId && !formData.loanOfficer) {
            setFormData(prev => ({
                ...prev,
                loanOfficer: officerId
            }));
        }
    }, [officerId, formData.loanOfficer]);

    useEffect(() => {
        fetchData();
    }, [clientId]);

    const fetchLoanProductDetails = async (productId) => {
        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
            };
            const response = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/loans/template?activeOnly=true&staffInSelectedOfficeOnly=true&productId=${productId}&clientId=${clientId}&templateType=individual`,
                { headers }
            );
            setLoanTemplate(response.data);
            formData.productName = productId;
        } catch (error) {
            console.error("Error fetching loan product details:", error);
        } finally {
            stopLoading();
        }
    };

    const handleNext = () => {
        const currentIndex = stages.indexOf(currentStage);
        if (currentIndex < stages.length - 1) {
            const nextStage = stages[currentIndex + 1];
            if (!visitedStages.includes(currentStage)) {
                setVisitedStages((prev) => [...prev, currentStage]);
            }
            setCurrentStage(nextStage);
        }
    };

    const handlePrevious = () => {
        const currentIndex = stages.indexOf(currentStage);
        if (currentIndex > 0) {
            setCurrentStage(stages[currentIndex - 1]);
        }
    };

    const handleAddCharge = () => {
        const selectedCharge = loanTemplate?.chargeOptions?.find(
            (charge) => charge.id === parseInt(formData.chargeSelect, 10)
        );

        if (!selectedCharge) {
            showNotification('Please select a charge to add!', 'info');
            return;
        }

        setFormData((prevData) => ({
            ...prevData,
            addedCharges: [...(prevData.addedCharges || []), selectedCharge],
            chargeSelect: '',
        }));
    };

    const handleRemoveCharge = (index) => {
        setFormData((prevData) => ({
            ...prevData,
            addedCharges: prevData.addedCharges.filter((_, i) => i !== index),
        }));
    };

    const handleAddCollateral = () => {
        if (!selectedCollateral || !quantity) {
            showNotification('Please select a collateral and enter quantity!', 'info');
            return;
        }

        const collateralData = collateralTemplate.find((item) => item.id === selectedCollateral);

        setCollaterals((prev) => [
            ...prev,
            {
                name: collateralData.name,
                quantity: parseFloat(quantity),
                totalValue: parseFloat(quantity) * parseFloat(collateralData.value),
                totalCollateralValue: parseFloat(quantity) * parseFloat(collateralData.value),
            },
        ]);

        setSelectedCollateral('');
        setQuantity('');
        setIsCollateralModalOpen(false);
    };

    const handleRemoveCollateral = (index) => {
        setCollaterals((prev) => prev.filter((_, i) => i !== index));
    };

    const calculateTotalValue = () => {
        if (!selectedCollateral || !quantity) {
            return '';
        }
        const collateralData = collateralTemplate.find((item) => item.id === selectedCollateral);
        if (collateralData) {
            return parseFloat(quantity) * parseFloat(collateralData.value || 0);
        }
        return '';
    };

    const renderStageTracker = () => {
        return (
            <div className="staged-form-stage-tracker">
                {stages.map((stage, index) => (
                    <div
                        key={stage}
                        className={`staged-form-stage ${
                            stage === "Preview" || visitedStages.includes(stage)
                                ? "staged-form-completed"
                                : index === stages.indexOf(currentStage)
                                    ? "staged-form-active"
                                    : "staged-form-unvisited"
                        }`}
                        onClick={() => {
                            if (!visitedStages.includes(stage)) {
                                setVisitedStages((prev) => [...prev, stage]);
                            }
                            setCurrentStage(stage);
                        }}
                        style={{ cursor: stage === "Preview" || visitedStages.includes(stage) ? "pointer" : "default" }}
                    >
                        <span className="staged-form-stage-circle">{index + 1}</span>
                        <span className="staged-form-stage-label">{stage}</span>
                    </div>
                ))}
            </div>
        );
    };

    const handleInputChange = (e) => {
        const { id, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [id]: type === "checkbox" ? checked : type === "number" ? parseFloat(value) || "" : value,
        }));
    };

    useEffect(() => {
        if (formData.productName) {
            fetchLoanProductDetails(formData.productName);
        }
    }, [formData.productName]);

    const renderStageContent = () => {
        switch (currentStage) {
            case 'Details':
                return (
                    <div className="stage-details">
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="productName">Product Name <span>*</span></label>
                                <select
                                    id="productName"
                                    value={formData.productName}
                                    onChange={handleInputChange}
                                    className="staged-form-select"
                                    required
                                >
                                    <option value="">-- Select Loan Product --</option>
                                    {loanTemplate?.productOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Dynamic Fields after Product Selection */}
                        {loanTemplate?.loanProductName && (
                            <>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="externalId">National ID/Passport</label>
                                        <input
                                            type="text"
                                            id="externalId"
                                            value={formData.externalId}
                                            onChange={handleInputChange}
                                            className="staged-form-input"
                                        />
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="loanOfficer">Loan Officer</label>
                                        <select
                                            id="loanOfficer"
                                            value={formData.loanOfficer || ""}
                                            onChange={handleInputChange}
                                            className="staged-form-select"
                                        >
                                            <option value="">-- Select Loan Officer --</option>
                                            {loanTemplate?.loanOfficerOptions?.map((officer) => (
                                                <option key={officer.id} value={officer.id}>
                                                    {officer.displayName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="loanPurpose">Loan Purpose</label>
                                        <select
                                            id="loanPurpose"
                                            value={formData.loanPurpose}
                                            onChange={handleInputChange}
                                            className="staged-form-select"
                                        >
                                            <option value="">-- Select Purpose --</option>
                                            {loanTemplate?.loanPurposeOptions?.map((purpose) => (
                                                <option key={purpose.id} value={purpose.id}>
                                                    {purpose.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="fund">Fund</label>
                                        <select
                                            id="fund"
                                            value={formData.fund}
                                            onChange={handleInputChange}
                                            className="staged-form-select"
                                        >
                                            <option value="">-- Select Fund --</option>
                                            {loanTemplate?.fundOptions?.map((fund) => (
                                                <option key={fund.id} value={fund.id}>
                                                    {fund.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="submittedOn">Submitted On <span>*</span></label>
                                        <DatePicker
                                            id="submittedOn"
                                            selected={formData.submittedOn ? new Date(formData.submittedOn) : null}
                                            onChange={(date) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    submittedOn: date.toISOString().split('T')[0],
                                                    disbursementOn: "",
                                                }))
                                            }
                                            className="staged-form-input"
                                            placeholderText="Select Submission Date"
                                            dateFormat="MMMM d, yyyy"
                                            maxDate={new Date()}
                                            showMonthDropdown
                                            showYearDropdown
                                            dropdownMode="select"
                                            showPopperArrow={false}
                                        />
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="disbursementOn">Disbursement On</label>
                                        <DatePicker
                                            id="disbursementOn"
                                            selected={formData.disbursementOn ? new Date(formData.disbursementOn) : null}
                                            onChange={(date) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    disbursementOn: date.toISOString().split('T')[0],
                                                }))
                                            }
                                            className="staged-form-input"
                                            placeholderText="Select Disbursement Date"
                                            dateFormat="MMMM d, yyyy"
                                            showMonthDropdown
                                            showYearDropdown
                                            minDate={
                                                formData.submittedOn
                                                    ? new Date(new Date(formData.submittedOn).setDate(new Date(formData.submittedOn).getDate() + 1))
                                                    : null
                                            }
                                            dropdownMode="select"
                                            showPopperArrow={false}
                                        />
                                    </div>
                                </div>

                                <h4>Savings Linkage</h4>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="linkSavings">Link Savings</label>
                                        <select
                                            id="linkSavings"
                                            value={formData.linkSavings}
                                            onChange={handleInputChange}
                                            className="staged-form-select"
                                        >
                                            <option value="">-- Select Savings --</option>
                                            {loanTemplate?.accountLinkingOptions?.length > 0 ? (
                                                loanTemplate.accountLinkingOptions.map((account) => (
                                                    <option key={account.id} value={account.id}>
                                                        {account.productName} - {account.accountNo}
                                                    </option>
                                                ))
                                            ) : (
                                                <option disabled>No linked savings accounts available</option>
                                            )}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="createStandingInstructions">
                                            <input
                                                type="checkbox"
                                                id="createStandingInstructions"
                                                checked={formData.createStandingInstructions}
                                                onChange={handleInputChange}
                                            />{' '}
                                            Create Standing Instructions at Disbursement
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                );
            case 'Terms':
                return (
                    <div className="stage-terms">
                        {/* Principal */}
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="principal">Principal *</label>
                                <input
                                    type="number"
                                    id="principal"
                                    value={formData.principal}
                                    onChange={handleInputChange}
                                    required
                                    min="1"
                                    className="staged-form-input"
                                />
                            </div>
                        </div>

                        <h4>Term Options</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="loanTerm">Loan Term *</label>
                                <input
                                    type="number"
                                    id="loanTerm"
                                    value={formData.loanTerm}
                                    onChange={handleInputChange}
                                    min="1"
                                    max={loanTemplate?.termFrequency || 1}
                                    className="staged-form-input"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="frequency">Frequency *</label>
                                <select
                                    id="frequency"
                                    value={formData.frequency}
                                    onChange={handleInputChange}
                                    required
                                    className="staged-form-select"
                                >
                                    <option value="">-- Select Frequency --</option>
                                    {loanTemplate?.termFrequencyTypeOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <h4>Repayments</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="numberOfRepayments">Number of Repayments *</label>
                                <input
                                    type="number"
                                    id="numberOfRepayments"
                                    value={formData.numberOfRepayments}
                                    onChange={handleInputChange}
                                    required
                                    className="staged-form-input"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="firstRepayment">First Repayment On</label>
                                <DatePicker
                                    id="firstRepayment"
                                    selected={formData.firstRepayment ? new Date(formData.firstRepayment) : null}
                                    onChange={(date) => handleInputChange({
                                        target: {
                                            id: 'firstRepayment',
                                            value: date.toISOString().split('T')[0]
                                        }
                                    })}
                                    className="staged-form-input"
                                    dateFormat="MMMM d, yyyy"
                                    showMonthDropdown
                                    showYearDropdown
                                    disabled
                                    dropdownMode="select"
                                    showPopperArrow={false}
                                    placeholderText="Select First Repayment Date"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="interestChargedFrom">Interest Charged From</label>
                                <DatePicker
                                    id="interestChargedFrom"
                                    selected={formData.interestChargedFrom ? new Date(formData.interestChargedFrom) : null}
                                    onChange={(date) => handleInputChange({
                                        target: {
                                            id: 'interestChargedFrom',
                                            value: date.toISOString().split('T')[0]
                                        }
                                    })}
                                    className="staged-form-input"
                                    dateFormat="MMMM d, yyyy"
                                    showMonthDropdown
                                    disabled
                                    showYearDropdown
                                    dropdownMode="select"
                                    showPopperArrow={false}
                                    placeholderText="Select Interest Charged From Date"
                                />
                            </div>
                        </div>

                        {/* Repaid Every */}
                        <h4>Repaid Every</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="repaidEvery">Repaid Every</label>
                                <input
                                    type="number"
                                    id="repaidEvery"
                                    value={formData.repaidEvery}
                                    onChange={handleInputChange}
                                    className="staged-form-input"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="frequencyRepaidEvery">Frequency</label>
                                <select
                                    id="frequencyRepaidEvery"
                                    value={formData.frequencyRepaidEvery}
                                    onChange={handleInputChange}
                                    className="staged-form-select"
                                >
                                    <option value="">-- Select Frequency --</option>
                                    {loanTemplate?.repaymentFrequencyTypeOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <h4>Nominal Interest Rate</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="nominalInterestRate">Nominal Interest Rate % *</label>
                                <input
                                    type="number"
                                    id="nominalInterestRate"
                                    value={formData.nominalInterestRate}
                                    onChange={handleInputChange}
                                    required
                                    className="staged-form-input"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="interestRateFrequencyType">Frequency</label>
                                <select
                                    id="interestRateFrequencyType"
                                    value={formData.interestRateFrequencyType}
                                    onChange={handleInputChange}
                                    className="staged-form-select"
                                >
                                    <option value="">-- Select Frequency --</option>
                                    {loanTemplate?.interestRateFrequencyTypeOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="interestMethod">Interest Method</label>
                                <select
                                    id="interestMethod"
                                    value={formData.interestMethod}
                                    onChange={handleInputChange}
                                    className="staged-form-select"
                                >
                                    <option value="">-- Select Interest Method --</option>
                                    {loanTemplate?.interestTypeOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="amortization">Amortization</label>
                                <select
                                    id="amortization"
                                    value={formData.amortization}
                                    onChange={handleInputChange}
                                    className="staged-form-select"
                                >
                                    <option value="">-- Select Amortization --</option>
                                    {loanTemplate?.amortizationTypeOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="staged-form-field">
                            <label>
                                <input
                                    type="checkbox"
                                    id="isEqualAmortization"
                                    checked={formData.isEqualAmortization}
                                    onChange={handleInputChange}
                                />
                                Is Equal Amortization?
                            </label>
                        </div>

                        {/* Collateral Section */}
                        <div className="staged-form-row">
                            <h4 className="staged-form-field">Collateral Data</h4>
                            <button
                                className="create-provisioning-criteria-confirm"
                                onClick={() => setIsCollateralModalOpen(true)}
                            >
                                Add
                            </button>
                        </div>
                        <table className="staged-form-table">
                            <thead>
                            <tr>
                                <th>Name</th>
                                <th>Quantity</th>
                                <th>Total Value</th>
                                <th>Total Collateral Value</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {collaterals.map((collateral, index) => (
                                <tr key={index}>
                                    <td>{collateral.name}</td>
                                    <td>{collateral.quantity}</td>
                                    <td>{collateral.totalValue}</td>
                                    <td>{collateral.totalCollateralValue}</td>
                                    <td>
                                        <button
                                            className="staged-form-button-delete"
                                            onClick={() => handleRemoveCollateral(index)}
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        {/* Collateral Modal */}
                        {isCollateralModalOpen && (
                            <div className="create-provisioning-criteria-modal-overlay">
                                <div className="create-provisioning-criteria-modal-content">
                                    <h4 className="create-modal-title">Add Collateral</h4>
                                    <div className="create-provisioning-criteria-group">
                                        <label htmlFor="collateral"
                                               className="create-provisioning-criteria-label">Collateral <span>*</span></label>
                                        <select
                                            id="collateral"
                                            value={selectedCollateral}
                                            onChange={(e) => setSelectedCollateral(e.target.value)}
                                            className="staged-form-select"
                                        >
                                            {collateralTemplate?.map((option) => (
                                                <option key={option.id} value={option.id}>
                                                    {option.name}
                                                </option>
                                            ))}
                                        </select>
                                        <label htmlFor="quantity"
                                               className="create-provisioning-criteria-label">Quantity <span>*</span></label>
                                        <input
                                            type="number"
                                            id="quantity"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            required
                                            className="staged-form-input"
                                        />
                                        <label htmlFor="totalValue" className="create-provisioning-criteria-label">Total
                                            Value</label>
                                        <input
                                            type="text"
                                            id="totalValue"
                                            value={calculateTotalValue()}
                                            disabled
                                            className="staged-form-input"
                                        />
                                    </div>
                                    <div className="create-provisioning-criteria-modal-actions">
                                        <button
                                            onClick={() => setIsCollateralModalOpen(false)}
                                            className="create-provisioning-criteria-cancel"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleAddCollateral}
                                            className="create-provisioning-criteria-confirm"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'Charges':
                return (
                    <div className="stage-charges">
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="chargeSelect">Charge</label>
                                <select
                                    id="chargeSelect"
                                    value={formData.chargeSelect || ''}
                                    onChange={handleInputChange}
                                    className="form-control"
                                >
                                    <option value="">-- Select a Charge --</option>
                                    {loanTemplate?.chargeOptions
                                        ?.filter(
                                            (charge) =>
                                                !formData.addedCharges?.some(
                                                    (added) => added.id === charge.id
                                                )
                                        )
                                        .map((charge) => (
                                            <option key={charge.id} value={charge.id}>
                                                {charge.name} - {charge.amount}
                                            </option>
                                        ))}
                                </select>
                            </div>
                            <button
                                onClick={handleAddCharge}
                                className="create-provisioning-criteria-confirm"
                            >
                                Add
                            </button>
                        </div>

                        {formData.addedCharges?.length > 0 && (
                            <div className="added-charges-section">
                                <table className="charges-table">
                                    <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Type</th>
                                        <th>Amount</th>
                                        <th>Collected On</th>
                                        <th>Date</th>
                                        <th>Action</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {formData.addedCharges.map((charge, index) => {
                                        const chargeInfo = loanTemplate?.chargeOptions?.find((c) => c.id === charge.id);
                                        return (
                                            <tr key={index}>
                                                <td>{chargeInfo?.name}</td>
                                                <td>{chargeInfo?.chargeCalculationType?.value}</td>
                                                <td>{charge.amount}</td>
                                                <td>{chargeInfo?.chargeTimeType?.value}</td>
                                                <td>
                                                    {chargeInfo?.chargeTimeType?.code === "chargeTimeType.specifiedDueDate" ? (
                                                        <DatePicker
                                                            selected={charge.dueDate ? new Date(charge.dueDate) : null}
                                                            onChange={(date) => {
                                                                const updatedCharges = [...formData.addedCharges];
                                                                updatedCharges[index].dueDate = date.toISOString().split('T')[0];
                                                                setFormData((prev) => ({
                                                                    ...prev,
                                                                    addedCharges: updatedCharges
                                                                }));
                                                            }}
                                                            className="staged-form-input"
                                                            placeholderText="Select Due Date"
                                                            dateFormat="MMMM d, yyyy"
                                                            minDate={new Date()}
                                                            showMonthDropdown
                                                            showYearDropdown
                                                            dropdownMode="select"
                                                        />
                                                    ) : (
                                                        ""
                                                    )}
                                                </td>
                                                <td>
                                                    <button
                                                        className="remove-charge-button"
                                                        onClick={() => handleRemoveCharge(index)}
                                                        style={{
                                                            border: "none",
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        <FaTrash size={20} color={"#ff0000"}/>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {loanTemplate?.overdueCharges?.length > 0 && (
                            <div className="overdue-charges-section">
                                <h4>Overdue Charges</h4>
                                <table className="charges-table">
                                    <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Type</th>
                                        <th>Amount</th>
                                        <th>Applies To</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {loanTemplate?.overdueCharges.map((charge, index) => (
                                        <tr key={index}>
                                            <td>{charge.name}</td>
                                            <td>{charge?.chargeTimeType?.value}</td>
                                            <td>{charge?.currency?.code} {charge?.amount}</td>
                                            <td>{charge?.chargeAppliesTo?.value}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );
            case 'Repayment Schedule':
                return (
                    <div className="stage-repayment-schedule">
                        <button
                            className="create-provisioning-criteria-confirm"
                            onClick={handleGenerateRepaymentSchedule}
                        >
                            Generate Repayment Schedule
                        </button>

                        {loanDetails?.periods?.length > 0 && (
                            <table className="repayment-schedule-table">
                                <thead>
                                <tr>
                                    <th colSpan="3"></th>
                                    <th colSpan="2">Loan Amount and Balance</th>
                                    <th colSpan="4">Total Cost of Loan</th>
                                    <th colSpan="1">Installment Totals</th>
                                </tr>
                                <tr>
                                    <th>Serial</th>
                                    <th>Days</th>
                                    <th>Date</th>
                                    <th>Balance of Loan</th>
                                    <th>Principal Due</th>
                                    <th>Interest</th>
                                    <th>Fees</th>
                                    <th>Penalties</th>
                                    <th>Due</th>
                                    <th>Outstanding</th>
                                </tr>
                                </thead>
                                <tbody>
                                {loanDetails.periods.map((period, index) => {
                                    const currentDate = period.dueDate
                                        ? new Date(period.dueDate[0], period.dueDate[1] - 1, period.dueDate[2])
                                        : null;
                                    const previousDate =
                                        index > 0
                                            ? new Date(
                                                loanDetails.periods[index - 1].dueDate[0],
                                                loanDetails.periods[index - 1].dueDate[1] - 1,
                                                loanDetails.periods[index - 1].dueDate[2]
                                            )
                                            : null;
                                    const days = index === 0 ? "" : previousDate && currentDate
                                        ? Math.floor((currentDate - previousDate) / (1000 * 60 * 60 * 24))
                                        : 0;
                                    const outstanding =
                                        (period.principalDue || 0) +
                                        (period.interestDue || 0) +
                                        (period.feeChargesDue || 0) +
                                        (period.penaltyChargesDue || 0);

                                    return (
                                        <tr key={index}>
                                            <td>{index + 1}</td>
                                            <td>{days}</td>
                                            <td>{currentDate ? formatDateForPayload(currentDate) : ''}</td>
                                            <td>{(period.principalLoanBalanceOutstanding || 0).toLocaleString()}</td>
                                            <td>{(period.principalDue || 0).toLocaleString()}</td>
                                            <td>{(period.interestDue || 0).toLocaleString()}</td>
                                            <td>{(period.feeChargesDue || 0).toLocaleString()}</td>
                                            <td>{(period.penaltyChargesDue || 0).toLocaleString()}</td>
                                            <td>{(period.totalDueForPeriod || 0).toLocaleString()}</td>
                                            <td>{outstanding.toLocaleString()}</td>
                                        </tr>
                                    );
                                })}
                                <tr className="total-row">
                                    <td colSpan="4">Totals</td>
                                    <td>
                                        {loanDetails?.currency?.code}{" "}{loanDetails.periods
                                            .reduce((sum, period) => sum + (period.principalDue || 0), 0)
                                            .toLocaleString()}
                                    </td>
                                    <td>
                                        {loanDetails?.currency?.code}{" "}{loanDetails.periods
                                            .reduce((sum, period) => sum + (period.interestDue || 0), 0)
                                            .toLocaleString()}
                                    </td>
                                    <td>
                                        {loanDetails?.currency?.code}{" "}{loanDetails.periods
                                            .reduce((sum, period) => sum + (period.feeChargesDue || 0), 0)
                                            .toLocaleString()}
                                    </td>
                                    <td>
                                        {loanDetails?.currency?.code}{" "}{loanDetails.periods
                                            .reduce((sum, period) => sum + (period.penaltyChargesDue || 0), 0)
                                            .toLocaleString()}
                                    </td>
                                    <td>
                                        {loanDetails?.currency?.code}{" "}{loanDetails.periods
                                            .reduce((sum, period) => sum + (period.totalDueForPeriod || 0), 0)
                                            .toLocaleString()}
                                    </td>
                                    <td>
                                        {loanDetails?.currency?.code}{" "}{loanDetails.periods
                                            .reduce(
                                                (sum, period) =>
                                                    sum +
                                                    (period.principalDue || 0) +
                                                    (period.interestDue || 0) +
                                                    (period.feeChargesDue || 0) +
                                                    (period.penaltyChargesDue || 0),
                                                0
                                            )
                                            .toLocaleString()}
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    const handleSubmit = async () => {
        try {
            startLoading();

            const payload = {
                amortizationType: formData.amortization || loanTemplate?.amortizationType?.id || null,
                charges: formData.addedCharges?.map(charge => ({
                    chargeId: charge.id,
                    amount: charge.amount || 0,
                    ...(charge.dueDate ? { dueDate: formatDateForPayload(new Date(charge.dueDate)) } : {}),
                })) || [],
                clientId: parseInt(clientId, 10) || null,
                collateral: [],
                createStandingInstructionAtDisbursement: formData.createStandingInstructions ?? false,
                dateFormat: "dd MMMM yyyy",
                expectedDisbursementDate: formData.disbursementOn
                    ? formatDateForPayload(new Date(formData.disbursementOn))
                    : null,
                externalId: formData.externalId?.trim() || "",
                fundId: formData.fund ? parseInt(formData.fund, 10) : loanTemplate?.fundOptions?.[0]?.id || null,
                graceOnArrearsAgeing: formData.graceOnArrearsAgeing
                    ? parseInt(formData.graceOnArrearsAgeing, 10)
                    : loanTemplate?.graceOnArrearsAgeing || 1,
                interestCalculationPeriodType: formData.interestMethod || loanTemplate?.interestType?.id || null,
                interestChargedFromDate: formData.interestChargedFrom
                    ? formatDateForPayload(new Date(formData.interestChargedFrom))
                    : null,
                interestRateFrequencyType: formData.interestRateFrequencyType || loanTemplate?.interestRateFrequencyType?.id || null,
                interestRatePerPeriod: formData.nominalInterestRate
                    ? parseFloat(formData.nominalInterestRate)
                    : loanTemplate?.interestRatePerPeriod || 0,
                interestType: formData.interestMethod || loanTemplate?.interestType?.id || null,
                isEqualAmortization: formData.isEqualAmortization ?? loanTemplate?.isEqualAmortization ?? false,
                isTopup: formData.isTopup ?? false,
                linkAccountId: formData.linkSavings ? parseInt(formData.linkSavings, 10) : loanTemplate?.accountLinkingOptions?.[0]?.id || null,
                loanOfficerId: formData.loanOfficer ? parseInt(formData.loanOfficer, 10) : loanTemplate?.loanOfficerOptions?.[0]?.id || null,
                loanPurposeId: formData.loanPurpose ? parseInt(formData.loanPurpose, 10) : loanTemplate?.loanPurposeOptions?.[0]?.id || null,
                loanTermFrequency: formData.loanTerm ? parseInt(formData.loanTerm, 10) : loanTemplate?.termFrequency || null,
                loanTermFrequencyType: formData.frequency || loanTemplate?.termPeriodFrequencyType?.id || null,
                loanType: "individual",
                locale: "en",
                numberOfRepayments: formData.numberOfRepayments ? parseInt(formData.numberOfRepayments, 10) : loanTemplate?.numberOfRepayments || null,
                principal: formData.principal ? parseFloat(formData.principal) : loanTemplate?.principal || 0,
                productId: formData.productName ? parseInt(formData.productName, 10) : loanTemplate?.product?.id || null,
                repaymentEvery: formData.repaidEvery ? parseInt(formData.repaidEvery, 10) : loanTemplate?.repaymentEvery || null,
                repaymentFrequencyDayOfWeekType: formData.selectDay || "",
                repaymentFrequencyNthDayType: formData.selectOn || "",
                repaymentFrequencyType: formData.frequencyRepaidEvery || loanTemplate?.repaymentFrequencyType?.id || null,
                repaymentsStartingFromDate: formData.firstRepayment
                    ? formatDateForPayload(new Date(formData.firstRepayment))
                    : null,
                submittedOnDate: formData.submittedOn
                    ? formatDateForPayload(new Date(formData.submittedOn))
                    : null,
                transactionProcessingStrategyCode: "principal-interest-penalties-fees-order-strategy",
            };

            const endpoint = isModifying
                ? `${API_CONFIG.proxy}/fineract-provider/api/v1/loans/${account}`
                : `${API_CONFIG.proxy}/fineract-provider/api/v1/loans`;

            const method = isModifying ? "put" : "post";

            const response = await axios({
                method: method,
                url: endpoint,
                data: payload,
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });

            showNotification(isModifying ? "Loan modified successfully!" : 'Loan submitted successfully!', 'success');
            setIsModifying(false);
            setFormData({
                principal: '',
                loanTerm: '',
                frequency: '',
                numberOfRepayments: '',
                firstRepayment: '',
                interestChargedFrom: '',
                repaidEvery: '',
                frequencyRepaidEvery: '',
                nominalInterestRate: '',
                interestRateFrequencyType: '',
                interestMethod: '',
                amortization: '',
                isEqualAmortization: false,
                externalId: '',
                fund: '',
                loanOfficer: '',
                loanPurpose: '',
                disbursementOn: '',
                submittedOn: '',
                addedCharges: [],
                createStandingInstructions: false,
                linkSavings: '',
            });

            navigate(`/client/${clientId}/loan-details/${response.data.loanId}`, {
                state: { loan: payload }
            });
        } catch (error) {
            console.error("Error submitting loan:", error);

            let errorMessage = "Failed to submit the loan. Please try again!";

            if (error.response && error.response.data) {
                const errorData = error.response.data;
                if (errorData.errors && errorData.errors.length > 0) {
                    errorMessage = errorData.errors[0].defaultUserMessage || errorData.errors[0].developerMessage;
                } else if (errorData.defaultUserMessage) {
                    errorMessage = errorData.defaultUserMessage;
                }
            }

            showNotification(errorMessage, 'error');
        } finally {
            stopLoading();
        }
    };

    const formatDateForPreview = (date) => {
        return date
            ? new Date(date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
            })
            : "";
    };

    const renderPreviewSection = () => {
        const previewData = [
            {
                title: "Details",
                data: {
                    "Product Name": formData.productName
                        ? loanTemplate?.productOptions?.find(p => p.id === parseInt(formData.productName, 10))?.name
                        : loanTemplate?.loanProductName || '',
                    "External ID": formData.externalId || '',
                    "Loan Officer": formData.loanOfficer
                        ? loanTemplate?.loanOfficerOptions?.find(o => o.id === parseInt(formData.loanOfficer, 10))?.displayName
                        : '',
                    "Loan Purpose": formData.loanPurpose
                        ? loanTemplate?.loanPurposeOptions?.find(p => p.id === parseInt(formData.loanPurpose, 10))?.name
                        : '',
                    "Fund": formData.fund
                        ? loanTemplate?.fundOptions?.find(f => f.id === parseInt(formData.fund, 10))?.name
                        : '',
                    "Submitted On": formatDateForPreview(formData.submittedOn),
                    "Disbursement On": formatDateForPreview(formData.disbursementOn),
                    "Link Savings": formData.linkSavings
                        ? clientAccounts?.savingsAccounts?.find(a => a.id === parseInt(formData.linkSavings, 10))?.productName
                        : '',
                    "Standing Instructions": formData.createStandingInstructions ? "Yes" : "No",
                },
            },
            {
                title: "Terms",
                data: {
                    "Principal": formData.principal || loanTemplate?.principal || '',
                    "Loan Term": formData.loanTerm || loanTemplate?.termFrequency || '',
                    "Frequency":
                        loanTemplate?.termFrequencyTypeOptions?.find(f => f.id === parseInt(formData.frequency, 10))?.value ||
                        loanTemplate?.termFrequencyTypeOptions?.find(f => f.id === loanTemplate?.termFrequencyType?.id)?.value || '',
                    "Number of Repayments": formData.numberOfRepayments || loanTemplate?.numberOfRepayments || '',
                    "First Repayment On": formData.firstRepayment ? formatDateForPreview(formData.firstRepayment) : '',
                    "Interest Charged From": formData.interestChargedFrom ? formatDateForPreview(formData.interestChargedFrom) : '',
                    "Repaid Every": formData.repaidEvery || loanTemplate?.repaymentEvery || '',
                    "Repayment Frequency":
                        loanTemplate?.repaymentFrequencyTypeOptions?.find(f => f.id === parseInt(formData.frequencyRepaidEvery, 10))?.value ||
                        loanTemplate?.repaymentFrequencyTypeOptions?.find(f => f.id === loanTemplate?.repaymentFrequencyType?.id)?.value || '',
                    "Nominal Interest Rate": formData.nominalInterestRate || loanTemplate?.interestRatePerPeriod || '',
                    "Interest Frequency":
                        loanTemplate?.interestRateFrequencyTypeOptions?.find(f => f.id === parseInt(formData.interestRateFrequencyType, 10))?.value ||
                        loanTemplate?.interestRateFrequencyTypeOptions?.find(f => f.id === loanTemplate?.interestRateFrequencyType?.id)?.value || '',
                    "Interest Method":
                        loanTemplate?.interestTypeOptions?.find(i => i.id === parseInt(formData.interestMethod, 10))?.value ||
                        loanTemplate?.interestTypeOptions?.find(i => i.id === loanTemplate?.interestType?.id)?.value || '',
                    "Amortization":
                        loanTemplate?.amortizationTypeOptions?.find(a => a.id === parseInt(formData.amortization, 10))?.value ||
                        loanTemplate?.amortizationTypeOptions?.find(a => a.id === loanTemplate?.amortizationType?.id)?.value || '',
                    "Is Equal Amortization": formData.isEqualAmortization || loanTemplate?.isEqualAmortization ? "Yes" : "No",
                },
            },
        ];

        return (
            <div className="staged-form-preview-section">
                <h2 className="preview-header">Form Preview</h2>
                {previewData.map(({ title, data }) => (
                    <div key={title} className="staged-form-preview-block">
                        <div className="staged-form-preview-header">
                            <h4 className="preview-stage-title">{title}</h4>
                            <button
                                className="staged-form-edit-button"
                                onClick={() => setCurrentStage(title)}
                            >
                                Edit
                            </button>
                        </div>
                        <div className="staged-form-preview-table-wrapper">
                            <table className="staged-form-preview-table">
                                <tbody>
                                {Object.entries(data).map(([key, value]) => (
                                    value && (
                                        <tr key={key}>
                                            <td>{key}</td>
                                            <td>{value}</td>
                                        </tr>
                                    )
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}

                {formData.addedCharges?.length > 0 && (
                    <div className="staged-form-preview-block">
                        <div className="staged-form-preview-header">
                            <h4 className="preview-stage-title">Charges</h4>
                            <button
                                className="staged-form-edit-button"
                                onClick={() => setCurrentStage("Charges")}
                            >
                                Edit
                            </button>
                        </div>
                        <div className="staged-form-preview-table-wrapper">
                            <table className="staged-form-preview-table">
                                <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Collected On</th>
                                    <th>Date</th>
                                </tr>
                                </thead>
                                <tbody>
                                {formData.addedCharges.map((charge, index) => {
                                    const chargeInfo = loanTemplate?.chargeOptions?.find(c => c.id === charge.id);
                                    return (
                                        <tr key={index}>
                                            <td>{chargeInfo?.name || ''}</td>
                                            <td>{chargeInfo?.chargeCalculationType?.value || ''}</td>
                                            <td>{charge.amount || ''}</td>
                                            <td>{chargeInfo?.chargeTimeType?.value || ''}</td>
                                            <td>
                                                {chargeInfo?.chargeTimeType?.code === "chargeTimeType.specifiedDueDate"
                                                    ? formatDateForPreview(charge.dueDate)
                                                    : ""}
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (!clientData || !loanTemplate) {
        return <div>Loading...</div>;
    }

    return (
        <div className="staged-form-add-client">
            {renderStageTracker()}
            <div className="staged-form-stage-content">
                {currentStage === 'Preview' ? (
                    renderPreviewSection()
                ) : (
                    renderStageContent()
                )}
                <div className="staged-form-stage-buttons">
                    <button
                        onClick={handlePrevious}
                        className="staged-form-button-previous"
                        disabled={currentStage === 'Details'}
                    >
                        Previous
                    </button>
                    <button
                        onClick={currentStage === 'Preview' ? handleSubmit : handleNext}
                        className="staged-form-button-next"
                    >
                        {currentStage === stages[stages.length - 2] ? 'Preview' : currentStage === 'Preview' ? 'Submit' : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoanAccount;
