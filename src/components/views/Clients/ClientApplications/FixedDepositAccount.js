import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../../../context/AuthContext';
import { useLoading } from '../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../config';
import DatePicker from "react-datepicker";

const FixedDepositAccount = () => {
    const { clientId } = useParams();
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();

    const [currentStage, setCurrentStage] = useState('Details');
    const [clientData, setClientData] = useState(null);
    const [fixedDepositTemplate, setFixedDepositTemplate] = useState(null);

    const [chargeOptions, setChargeOptions] = useState([]);
    const [periodFrequencyOptions, setPeriodFrequencyOptions] = useState([]);
    const [preClosurePenalInterestOptions, setPreClosurePenalInterestOptions] = useState([]);
    const [productOptions, setProductOptions] = useState([]);
    const [savingsAccounts, setSavingsAccounts] = useState([]);

    const [selectedProduct, setSelectedProduct] = useState('');
    const [submittedOn, setSubmittedOn] = useState('');

    const [selectedCharge, setSelectedCharge] = useState('');
    const [selectedCharges, setSelectedCharges] = useState([]);

    const [interestRateChart, setInterestRateChart] = useState([]);

    const [lockInFrequency, setLockInFrequency] = useState('');
    const [lockInType, setLockInType] = useState('');
    const [minDepositFrequency, setMinDepositFrequency] = useState('');
    const [minDepositType, setMinDepositType] = useState('');
    const [multiplesFrequency, setMultiplesFrequency] = useState('');
    const [multiplesType, setMultiplesType] = useState('');
    const [maxDepositFrequency, setMaxDepositFrequency] = useState('');
    const [maxDepositType, setMaxDepositType] = useState('');
    const [transferInterest, setTransferInterest] = useState(false);
    const [maturityInstructions, setMaturityInstructions] = useState('');
    const [applyPenalInterest, setApplyPenalInterest] = useState(false);
    const [penalInterest, setPenalInterest] = useState('');
    const [penalInterestPeriod, setPenalInterestPeriod] = useState('');
    const [depositAmount, setDepositAmount] = useState('');
    const [depositPeriod, setDepositPeriod] = useState('');
    const [depositPeriodType, setDepositPeriodType] = useState('');
    const [interestCompoundingPeriod, setInterestCompoundingPeriod] = useState('');
    const [interestPostingPeriod, setInterestPostingPeriod] = useState('');
    const [interestCalculatedUsing, setInterestCalculatedUsing] = useState('');
    const [daysInYear, setDaysInYear] = useState('');

    const [disbursementOn, setDisbursementOn] = useState(null);
    const [validFromDate, setValidFromDate] = useState(null);
    const [invalidDate, setInvalidDate] = useState(null);
    const [typeOptions, setTypeOptions] = useState([]); // Used for various type dropdowns
    const [maturityInstructionOptions, setMaturityInstructionOptions] = useState([]); // Maturity instructions
    const [penalInterestPeriodOptions, setPenalInterestPeriodOptions] = useState([]); // Penal interest options


    const stages = ['Details', 'Terms', 'Settings', 'Interest Rate Chart', 'Charges'];

    // Fetch data
    const fetchData = async () => {
        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
            };

            const [clientResponse, fixedDepositResponse] = await Promise.all([
                axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/clients/${clientId}`, { headers }),
                axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/fixeddepositaccounts/template?clientId=${clientId}`, { headers }),
            ]);

            setClientData(clientResponse.data);
            setFixedDepositTemplate(fixedDepositResponse.data);

            // Populate additional data
            setChargeOptions(fixedDepositResponse.data.chargeOptions || []);
            setPeriodFrequencyOptions(fixedDepositResponse.data.periodFrequencyTypeOptions || []);
            setPreClosurePenalInterestOptions(fixedDepositResponse.data.preClosurePenalInterestOnTypeOptions || []);
            setProductOptions(fixedDepositResponse.data.productOptions || []);
            setSavingsAccounts(fixedDepositResponse.data.savingsAccounts || []);
            setTypeOptions(fixedDepositResponse.data.typeOptions || []);
            setMaturityInstructionOptions(fixedDepositResponse.data.maturityInstructionOptions || []);
            setPenalInterestPeriodOptions(fixedDepositResponse.data.penalInterestPeriodOptions || []);
        } catch (error) {
            console.error('Error fetching fixed deposit data:', error);
        } finally {
            stopLoading();
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Stage navigation
    const handleNext = () => {
        const currentIndex = stages.indexOf(currentStage);
        if (currentIndex < stages.length - 1) {
            setCurrentStage(stages[currentIndex + 1]);
        }
    };

    const handlePrevious = () => {
        const currentIndex = stages.indexOf(currentStage);
        if (currentIndex > 0) {
            setCurrentStage(stages[currentIndex - 1]);
        }
    };

    // Interest Rate Chart handlers
    const handleAddInterestRateRow = () => {
        setInterestRateChart((prev) => [...prev, { period: '', amountRange: '', interest: '', description: '' }]);
    };

    const handleEditInterestRateRow = (index) => {
        // Edit logic for interest rate chart row
    };

    const handleDeleteInterestRateRow = (index) => {
        setInterestRateChart((prev) => prev.filter((_, i) => i !== index));
    };

    // Charge handlers
    const handleAddCharge = () => {
        if (!selectedCharge) {
            alert('Please select a charge to add.');
            return;
        }
        const charge = chargeOptions.find((c) => c.id === selectedCharge);
        if (charge) {
            setSelectedCharges((prev) => [...prev, charge]);
        }
    };

    const handleRemoveCharge = (index) => {
        setSelectedCharges((prev) => prev.filter((_, i) => i !== index));
    };

    // Render stage tracker
    const renderStageTracker = () => (
        <div className="staged-form-stage-tracker">
            {stages.map((stage, index) => (
                <div
                    key={stage}
                    className={`staged-form-stage ${
                        index === stages.indexOf(currentStage)
                            ? 'staged-form-active'
                            : index < stages.indexOf(currentStage)
                                ? 'staged-form-completed'
                                : 'staged-form-unvisited'
                    }`}
                    onClick={() => {
                        if (index <= stages.indexOf(currentStage)) {
                            setCurrentStage(stage);
                        }
                    }}
                >
                    <span className="staged-form-stage-circle">{index + 1}</span>
                    <span className="staged-form-stage-label">{stage}</span>
                </div>
            ))}
        </div>
    );

    // Render stage content (placeholder)
    const renderStageContent = () => {
        switch (currentStage) {
            case 'Details':
                return (
                    <div className="stage-details">
                        {/* Product Name Field */}
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="productName">
                                    Product Name <span>*</span>
                                </label>
                                <select
                                    id="productName"
                                    value={selectedProduct || ''}
                                    onChange={(e) => setSelectedProduct(e.target.value)}
                                    className="staged-form-select"
                                    required
                                >
                                    <option value="">-- Select Product --</option>
                                    {productOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Dynamic Fields Rendered After Product Selection */}
                        {selectedProduct && (
                            <>
                                {/* External ID and Deposit Officer */}
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="externalId">External ID</label>
                                        <input
                                            type="text"
                                            id="externalId"
                                            value={clientData?.externalId || ''}
                                            readOnly
                                            className="staged-form-input"
                                        />
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="depositOfficer">Deposit Officer</label>
                                        <select
                                            id="depositOfficer"
                                            className="staged-form-select"
                                        >
                                            <option value="">-- Select Deposit Officer --</option>
                                            {fixedDepositTemplate?.officerOptions?.map((officer) => (
                                                <option key={officer.id} value={officer.id}>
                                                    {officer.displayName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Deposit Purpose and Fund */}
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="depositPurpose">Deposit Purpose</label>
                                        <select
                                            id="depositPurpose"
                                            className="staged-form-select"
                                        >
                                            <option value="">-- Select Purpose --</option>
                                            {fixedDepositTemplate?.purposeOptions?.map((purpose) => (
                                                <option key={purpose.id} value={purpose.id}>
                                                    {purpose.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="fund">Fund</label>
                                        <select id="fund" className="staged-form-select">
                                            <option value="">-- Select Fund --</option>
                                            {fixedDepositTemplate?.fundOptions?.map((fund) => (
                                                <option key={fund.id} value={fund.id}>
                                                    {fund.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Submission and Disbursement Dates */}
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="submittedOn">
                                            Submitted On <span>*</span>
                                        </label>
                                        <DatePicker
                                            id="submittedOn"
                                            selected={submittedOn ? new Date(submittedOn) : null}
                                            onChange={(date) => setSubmittedOn(date.toISOString().split('T')[0])}
                                            className="staged-form-input"
                                            placeholderText="Select Submission Date"
                                            dateFormat="MMMM d, yyyy"
                                            showMonthDropdown
                                            showYearDropdown
                                            dropdownMode="select"
                                            required
                                        />
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="disbursementOn">Disbursement On</label>
                                        <DatePicker
                                            id="disbursementOn"
                                            selected={disbursementOn ? new Date(disbursementOn) : null}
                                            onChange={(date) => setDisbursementOn(date.toISOString().split('T')[0])}
                                            className="staged-form-input"
                                            placeholderText="Select Disbursement Date"
                                            showMonthDropdown
                                            showYearDropdown
                                            dropdownMode="select"
                                            dateFormat="MMMM d, yyyy"
                                        />
                                    </div>
                                </div>

                                {/* Savings Linkage */}
                                <h4>Savings Linkage</h4>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="linkSavings">Link Savings</label>
                                        <select id="linkSavings" className="staged-form-select">
                                            <option value="">-- Select Savings --</option>
                                            {savingsAccounts?.map((account) => (
                                                <option key={account.id} value={account.id}>
                                                    {account.productName} - {account.accountNo}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="createStandingInstructions">
                                            <input
                                                type="checkbox"
                                                id="createStandingInstructions"
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
                        {/* Deposit Amount */}
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="depositAmount">
                                    Deposit Amount <span>*</span>
                                </label>
                                <input
                                    type="number"
                                    id="depositAmount"
                                    value={depositAmount || ''}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    className="staged-form-input"
                                    required
                                />
                            </div>
                        </div>

                        {/* Deposit Period and Type */}
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="depositPeriod">
                                    Deposit Period <span>*</span>
                                </label>
                                <input
                                    type="number"
                                    id="depositPeriod"
                                    value={depositPeriod || ''}
                                    onChange={(e) => setDepositPeriod(e.target.value)}
                                    className="staged-form-input"
                                    required
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="depositPeriodType">
                                    Deposit Period Type <span>*</span>
                                </label>
                                <select
                                    id="depositPeriodType"
                                    value={depositPeriodType || ''}
                                    onChange={(e) => setDepositPeriodType(e.target.value)}
                                    className="staged-form-select"
                                    required
                                >
                                    <option value="">-- Select Type --</option>
                                    {periodFrequencyOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Interest Compounding Period and Interest Posting Period */}
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="interestCompoundingPeriod">
                                    Interest Compounding Period <span>*</span>
                                </label>
                                <select
                                    id="interestCompoundingPeriod"
                                    value={interestCompoundingPeriod || ''}
                                    onChange={(e) => setInterestCompoundingPeriod(e.target.value)}
                                    className="staged-form-select"
                                    required
                                >
                                    <option value="">-- Select Compounding Period --</option>
                                    {fixedDepositTemplate?.compoundingPeriodOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="interestPostingPeriod">
                                    Interest Posting Period <span>*</span>
                                </label>
                                <select
                                    id="interestPostingPeriod"
                                    value={interestPostingPeriod || ''}
                                    onChange={(e) => setInterestPostingPeriod(e.target.value)}
                                    className="staged-form-select"
                                    required
                                >
                                    <option value="">-- Select Posting Period --</option>
                                    {fixedDepositTemplate?.postingPeriodOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Interest Calculated Using and Days in Year */}
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="interestCalculatedUsing">
                                    Interest Calculated Using <span>*</span>
                                </label>
                                <select
                                    id="interestCalculatedUsing"
                                    value={interestCalculatedUsing || ''}
                                    onChange={(e) => setInterestCalculatedUsing(e.target.value)}
                                    className="staged-form-select"
                                    required
                                >
                                    <option value="">-- Select Calculation Method --</option>
                                    {fixedDepositTemplate?.calculationMethodOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="daysInYear">
                                    Days in Year <span>*</span>
                                </label>
                                <select
                                    id="daysInYear"
                                    value={daysInYear || ''}
                                    onChange={(e) => setDaysInYear(e.target.value)}
                                    className="staged-form-select"
                                    required
                                >
                                    <option value="">-- Select Days in Year --</option>
                                    {fixedDepositTemplate?.daysInYearOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                );

            case 'Settings':
                return (
                    <div className="stage-settings">
                        {/* Lock-in Period Section */}
                        <h4>Lock-in Period</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="lockInFrequency">Frequency</label>
                                <input
                                    type="number"
                                    id="lockInFrequency"
                                    value={lockInFrequency || ''}
                                    onChange={(e) => setLockInFrequency(e.target.value)}
                                    className="staged-form-input"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="lockInType">Type</label>
                                <select
                                    id="lockInType"
                                    value={lockInType || ''}
                                    onChange={(e) => setLockInType(e.target.value)}
                                    className="staged-form-select"
                                >
                                    <option value="">-- Select Type --</option>
                                    {typeOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Minimum Deposit Term Section */}
                        <h4>Minimum Deposit Term</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="minDepositFrequency">Frequency</label>
                                <input
                                    type="number"
                                    id="minDepositFrequency"
                                    value={minDepositFrequency || ''}
                                    onChange={(e) => setMinDepositFrequency(e.target.value)}
                                    className="staged-form-input"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="minDepositType">Type</label>
                                <select
                                    id="minDepositType"
                                    value={minDepositType || ''}
                                    onChange={(e) => setMinDepositType(e.target.value)}
                                    className="staged-form-select"
                                >
                                    <option value="">-- Select Type --</option>
                                    {typeOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* In Multiples of Section */}
                        <h4>In Multiples of</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="multiplesFrequency">Frequency</label>
                                <input
                                    type="number"
                                    id="multiplesFrequency"
                                    value={multiplesFrequency || ''}
                                    onChange={(e) => setMultiplesFrequency(e.target.value)}
                                    className="staged-form-input"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="multiplesType">Type</label>
                                <select
                                    id="multiplesType"
                                    value={multiplesType || ''}
                                    onChange={(e) => setMultiplesType(e.target.value)}
                                    className="staged-form-select"
                                >
                                    <option value="">-- Select Type --</option>
                                    {typeOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Maximum Deposit Term Section */}
                        <h4>Maximum Deposit Term</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="maxDepositFrequency">Frequency</label>
                                <input
                                    type="number"
                                    id="maxDepositFrequency"
                                    value={maxDepositFrequency || ''}
                                    onChange={(e) => setMaxDepositFrequency(e.target.value)}
                                    className="staged-form-input"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="maxDepositType">Type</label>
                                <select
                                    id="maxDepositType"
                                    value={maxDepositType || ''}
                                    onChange={(e) => setMaxDepositType(e.target.value)}
                                    className="staged-form-select"
                                >
                                    <option value="">-- Select Type --</option>
                                    {typeOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Interest Transfer Section */}
                        <h4>Interest Transfer</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="transferInterest">
                                    <input
                                        type="checkbox"
                                        id="transferInterest"
                                        checked={transferInterest || false}
                                        onChange={(e) => setTransferInterest(e.target.checked)}
                                    />{' '}
                                    Transfer Interest to Linked Savings Account?
                                </label>
                            </div>
                        </div>

                        {/* Maturity Instructions */}
                        <h4>Maturity Instructions</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="maturityInstructions">Maturity Instructions</label>
                                <select
                                    id="maturityInstructions"
                                    value={maturityInstructions || ''}
                                    onChange={(e) => setMaturityInstructions(e.target.value)}
                                    className="staged-form-select"
                                >
                                    <option value="">-- Select Maturity Instruction --</option>
                                    {maturityInstructionOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Pre-mature Closure Section */}
                        <h4>For Pre-mature Closure</h4>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="applyPenalInterest">
                                    <input
                                        type="checkbox"
                                        id="applyPenalInterest"
                                        checked={applyPenalInterest || false}
                                        onChange={(e) => setApplyPenalInterest(e.target.checked)}
                                    />{' '}
                                    Apply Penal Interest (less)
                                </label>
                            </div>
                        </div>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="penalInterest">Penal Interest (%)</label>
                                <input
                                    type="number"
                                    id="penalInterest"
                                    value={penalInterest || ''}
                                    onChange={(e) => setPenalInterest(e.target.value)}
                                    className="staged-form-input"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="penalInterestPeriod">Period</label>
                                <select
                                    id="penalInterestPeriod"
                                    value={penalInterestPeriod || ''}
                                    onChange={(e) => setPenalInterestPeriod(e.target.value)}
                                    className="staged-form-select"
                                >
                                    <option value="">-- Select Period --</option>
                                    {penalInterestPeriodOptions?.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                );

            case 'Interest Rate Chart':
                return (
                    <div className="stage-interest-rate-chart">
                        {/* Valid From and Invalid Date Fields */}
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="validFromDate">
                                    Valid From Date <span>*</span>
                                </label>
                                <DatePicker
                                    id="validFromDate"
                                    selected={validFromDate ? new Date(validFromDate) : null}
                                    onChange={(date) => setValidFromDate(date.toISOString().split('T')[0])}
                                    className="staged-form-input"
                                    placeholderText="Select Valid From Date"
                                    dateFormat="MMMM d, yyyy"
                                    required
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="invalidDate">Invalid Date</label>
                                <DatePicker
                                    id="invalidDate"
                                    selected={invalidDate ? new Date(invalidDate) : null}
                                    onChange={(date) => setInvalidDate(date.toISOString().split('T')[0])}
                                    className="staged-form-input"
                                    placeholderText="Select Invalid Date"
                                    showMonthDropdown
                                    showYearDropdown
                                    dropdownMode="select"
                                    dateFormat="MMMM d, yyyy"
                                />
                            </div>
                        </div>

                        {/* Primary Grouping */}
                        <h4>Primary Grouping by Amount:</h4>

                        {/* Interest Rate Chart Table */}
                        <div className="staged-form-table-container">
                            <table className="staged-form-table">
                                <thead>
                                <tr>
                                    <th>Period</th>
                                    <th>Amount Range</th>
                                    <th>Interest (%)</th>
                                    <th>Description</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {interestRateChart.map((row, index) => (
                                    <tr key={index}>
                                        <td>{row.period}</td>
                                        <td>{row.amountRange}</td>
                                        <td>{row.interest}</td>
                                        <td>{row.description}</td>
                                        <td>
                                            <button
                                                className="staged-form-button-edit"
                                                onClick={() => handleEditInterestRateRow(index)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="staged-form-button-delete"
                                                onClick={() => handleDeleteInterestRateRow(index)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {!interestRateChart.length && (
                                    <tr>
                                        <td colSpan="5">No rows added yet.</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                            <button
                                className="staged-form-button-add"
                                onClick={handleAddInterestRateRow}
                            >
                                Add Row
                            </button>
                        </div>
                    </div>
                );

            case 'Charges':
                return (
                    <div className="stage-charges">
                        {/* Field to select a charge */}
                        <div className="form-group">
                            <label htmlFor="chargeSelect">Charge</label>
                            <select
                                id="chargeSelect"
                                value={selectedCharge || ''}
                                onChange={(e) => setSelectedCharge(e.target.value)}
                                className="form-control"
                            >
                                <option value="">-- Select a Charge --</option>
                                {chargeOptions?.map((charge) => (
                                    <option key={charge.id} value={charge.id}>
                                        {charge.name} - {charge.amount} {charge.currency?.code}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={handleAddCharge}
                                className="add-charge-button"
                            >
                                Add
                            </button>
                        </div>

                        {/* Table for added charges */}
                        <div className="added-charges-section">
                            <h4>Selected Charges</h4>
                            {selectedCharges?.length > 0 ? (
                                <table className="charges-table">
                                    <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Amount</th>
                                        <th>Currency</th>
                                        <th>Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {selectedCharges.map((charge, index) => (
                                        <tr key={index}>
                                            <td>{charge.name}</td>
                                            <td>{charge.amount}</td>
                                            <td>{charge.currency?.code}</td>
                                            <td>
                                                <button
                                                    onClick={() => handleRemoveCharge(index)}
                                                    className="remove-charge-button"
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p>No charges selected.</p>
                            )}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    if (!clientData || !fixedDepositTemplate) {
        return <div>Loading...</div>;
    }

    return (
        <div className="staged-form-add-client">
            {renderStageTracker()}
            <div className="staged-form-stage-content">
                {renderStageContent()}
                <div className="staged-form-stage-buttons">
                    <button
                        onClick={handlePrevious}
                        className="staged-form-button-previous"
                        disabled={currentStage === 'Details'}
                    >
                        Previous
                    </button>
                    <button
                        onClick={handleNext}
                        className="staged-form-button-next"
                        disabled={currentStage === 'Charges'}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FixedDepositAccount;
