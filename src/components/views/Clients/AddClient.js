import React, {useContext, useEffect, useState} from 'react';
import {FaEdit, FaPlus, FaTrash} from 'react-icons/fa';
import './AddClient.css';
import {useNavigate} from "react-router-dom";
import { API_CONFIG } from '../../../config';
import axios from 'axios';
import { useLoading } from '../../../context/LoadingContext';
import {AuthContext} from "../../../context/AuthContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import {NotificationContext} from "../../../context/NotificationContext";

const stages = [
    "Basic User Info",
    "Additional Details",
    "Family Members",
];

const AddClientForm = () => {
    const [legalForm, setLegalForm] = useState('');
    const { showNotification } = useContext(NotificationContext);

    const [isActive, setIsActive] = useState(false);
    const [openSavingsAccount, setOpenSavingsAccount] = useState(false);
    const [office, setOffice] = useState('');
    const [staff, setStaff] = useState('');
    const [staffs, setStaffs] = useState([]);

    const { user } = useContext(AuthContext);
    const [firstName, setFirstName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [lastName, setLastName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');

    const [name, setName] = useState('');

    const [gender, setGender] = useState('');
    const [clientType, setClientType] = useState('');
    const [clientClassification, setClientClassification] = useState('');
    const [externalId, setExternalId] = useState('');
    const [submittedOn, setSubmittedOn] = useState(new Date().toISOString().split('T')[0]);
    const [activationDate, setActivationDate] = useState(new Date().toISOString().split('T')[0]);
    const [incorporationDate, setIncorporationDate] = useState('');
    const [incorporationValidUntil, setIncorporationValidUntil] = useState('');
    const [incorporationNumber, setIncorporationNumber] = useState('');
    const [mainBusinessLine, setMainBusinessLine] = useState('');
    const [constitution, setConstitution] = useState('');
    const [remarks, setRemarks] = useState('');

    const [selectedSavingsProduct, setSelectedSavingsProduct] = useState('');
    const [savingsCharges, setSavingsCharges] = useState([]);

    const [clientTemplate, setClientTemplate] = useState({});
    const [isStaff, setIsStaff] = useState(false);

    const { startLoading, stopLoading } = useLoading();
    const navigate = useNavigate();

    const addFamilyMember = () => {
        if (currentEditIndex !== null) {
            const updatedFamilyMembers = [...familyMembers];
            updatedFamilyMembers[currentEditIndex] = newFamilyMember;
            setFamilyMembers(updatedFamilyMembers);
        } else {
            setFamilyMembers([...familyMembers, newFamilyMember]);
        }

        setCurrentEditIndex(null);
        setNewFamilyMember({
            firstName: '',
            middleName: '',
            lastName: '',
            mobileNumber: '',
            age: '',
            isDependent: false,
            gender: '',
            profession: '',
            maritalStatus: '',
            dateOfBirth: '',
        });
        setShowModal(false);
    };

    const removeFamilyMember = (index) => {
        setFamilyMembers(familyMembers.filter((_, i) => i !== index));
    };

    const [familyMembers, setFamilyMembers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newFamilyMember, setNewFamilyMember] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        mobileNumber: '',
        age: '',
        isDependent: false,
        gender: '',
        profession: '',
        maritalStatus: '',
        dateOfBirth: '',
    })

    const INITIAL_ADDRESS = {
        addressType: '',
        addressLine1: '',
        addressLine2: '',
        country: '',
        province: '',
        city: '',
        postalCode: '',
        isActive: false,
    };

    const [currentStage, setCurrentStage] = useState(0);
    const [completedStages, setCompletedStages] = useState(new Set());
    const [allStagesComplete, setAllStagesComplete] = useState(false);
    const [currentEditIndex, setCurrentEditIndex] = useState(null);

    const isStep1Complete =
        office !== '' &&
        externalId !== '' &&
        legalForm !== '' &&
        ((legalForm === clientTemplate.clientLegalFormOptions?.find(option => option.code === "legalFormType.person")?.value &&
                firstName !== '' &&
                lastName !== '') ||
            (legalForm === clientTemplate.clientLegalFormOptions?.find(option => option.code === "legalFormType.entity")?.value &&
                name !== ''));

    const isStep2Complete =
        (legalForm === clientTemplate.clientLegalFormOptions?.find(option => option.code === "legalFormType.person")?.value &&
            dateOfBirth !== '' &&
            gender !== '' &&
            clientType !== '' &&
            clientClassification !== '') ||
        (legalForm === clientTemplate.clientLegalFormOptions?.find(option => option.code === "legalFormType.entity")?.value &&
            incorporationDate !== '' &&
            incorporationValidUntil !== '' &&
            incorporationNumber !== '' &&
            submittedOn !== '');

    const fetchStaffOptions = async (officeId) => {
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                'Content-Type': 'application/json',
            };

            const response = await axios.get(
                `${API_CONFIG.proxy}/fineract-provider/api/v1/clients/template`,
                {
                    headers,
                    params: {
                        officeId,
                        staffInSelectedOfficeOnly: true,
                    },
                }
            );

            setStaffs(response.data.staffOptions || []);
        } catch (error) {
            console.error("Error fetching staff options:", error);
            showNotification("Error fetching staff options!", 'error');
            setStaffs([]);
        }
    };

    useEffect(() => {
        if (office) {
            fetchStaffOptions(office);
        } else {
            setStaffs([]);
        }
    }, [office]);


    useEffect(() => {
        const fetchData = async () => {
            startLoading();

            try {
                const headers = {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                };

                const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/clients/template`, { headers });

                setClientTemplate(response.data || {});
            } catch (error) {
                console.error('Error fetching client template:', error);
                showNotification('Error fetching client template!', 'error');
            } finally {
                stopLoading();
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const fetchSavingsCharges = async () => {
            try {
                const headers = {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                };

                const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/charges/template`, { headers });

                const savingsRelatedCharges = response.data.savingsChargeCalculationTypeOptions;
                setSavingsCharges(savingsRelatedCharges);
            } catch (error) {
                console.error('Error fetching charges template:', error);
                showNotification('Error fetching charges template!', 'error');
            }
        };

        fetchSavingsCharges();
    }, []);

    useEffect(() => {
        setAllStagesComplete(
            completedStages.size === stages.length
        );
    }, [completedStages, stages.length]);

    const renderStageTracker = () => {
        const trackerStages = allStagesComplete
            ? [...stages, "Preview"]
            : stages;

        return (
            <div className="staged-form-stage-tracker">
                {trackerStages.map((stage, index) => (
                    <div
                        key={stage}
                        className={`staged-form-stage ${
                            index === currentStage
                                ? "staged-form-active"
                                : stage === "Preview" || completedStages.has(stage)
                                    ? "staged-form-completed"
                                    : "staged-form-unvisited"
                        }`}
                        onClick={() => {
                            if (stage === "Preview" || completedStages.has(stage)) {
                                setCurrentStage(index);
                            }
                        }}
                    >
                        <span className="staged-form-stage-circle">{index + 1}</span>
                        <span className="staged-form-stage-label">{stage}</span>
                    </div>
                ))}
            </div>
        );
    };

    const renderStageContent = () => {
        switch (stages[currentStage]) {
            case "Basic User Info":
                return (
                    <div className="staged-form-basic-info">
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="office">
                                    Branch <span className="staged-form-required">*</span>
                                </label>
                                <select
                                    id="office"
                                    value={office}
                                    onChange={(e) => setOffice(e.target.value)}
                                    className="staged-form-select"
                                    required
                                >
                                    <option value="">-- Select Branch --</option>
                                    {clientTemplate.officeOptions?.length > 0
                                        ? clientTemplate.officeOptions.map((office) => (
                                            <option key={office.id} value={office.id}>
                                                {office.name}
                                            </option>
                                        ))
                                        : <option value="" disabled>No Options Available...</option>}
                                </select>
                            </div>

                            <div className="staged-form-field">
                                <label htmlFor="staff">
                                    Loan Officer
                                </label>
                                <select
                                    id="staff"
                                    value={staff}
                                    onChange={(e) => setStaff(e.target.value)}
                                    className="staged-form-select"
                                    disabled={!office}
                                >
                                    <option value="">-- Select Loan Officer --</option>
                                    {staffs.length > 0
                                        ? staffs.map((staff) => (
                                            <option key={staff.id} value={staff.id}>
                                                {staff.displayName}
                                            </option>
                                        ))
                                        : <option value="" disabled>No Options Available...</option>}
                                </select>
                            </div>
                        </div>

                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="externalId">
                                    National ID/Passport <span className="staged-form-required">*</span>
                                </label>
                                <input
                                    id="externalId"
                                    type="text"
                                    value={externalId}
                                    onChange={(e) => setExternalId(e.target.value)}
                                    className="staged-form-input"
                                    placeholder="Enter External ID"
                                    required
                                />
                            </div>
                            <div className="staged-form-field">
                                <label htmlFor="legalForm">
                                    Legal Form <span className="staged-form-required">*</span>
                                </label>
                                <select
                                    id="legalForm"
                                    value={legalForm}
                                    onChange={(e) => setLegalForm(e.target.value)}
                                    className="staged-form-select"
                                >
                                    <option value="">-- Select Legal Form --</option>
                                    {clientTemplate.clientLegalFormOptions?.map((option) => (
                                        <option key={option.id} value={option.value}>
                                            {option.value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {legalForm && (
                            legalForm === clientTemplate.clientLegalFormOptions?.find(option => option.code === "legalFormType.person")?.value ? (
                                <>
                                    <div className="staged-form-row">
                                        <div className="staged-form-field">
                                            <label htmlFor="firstName">
                                                First Name <span className="staged-form-required">*</span>
                                            </label>
                                            <input
                                                id="firstName"
                                                type="text"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                className="staged-form-input"
                                                placeholder="Enter First Name"
                                                required
                                            />
                                        </div>
                                        <div className="staged-form-field">
                                            <label htmlFor="middleName">Middle Name</label>
                                            <input
                                                id="middleName"
                                                type="text"
                                                value={middleName}
                                                onChange={(e) => setMiddleName(e.target.value)}
                                                className="staged-form-input"
                                                placeholder="Enter Middle Name"
                                            />
                                        </div>
                                    </div>
                                    <div className="staged-form-row">
                                        <div className="staged-form-field">
                                            <label htmlFor="lastName">
                                                Last Name <span className="staged-form-required">*</span>
                                            </label>
                                            <input
                                                id="lastName"
                                                type="text"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                className="staged-form-input"
                                                placeholder="Enter Last Name"
                                                required
                                            />
                                        </div>
                                        <div className="staged-form-field">
                                            <label htmlFor="mobileNumber">Mobile Number</label>
                                            <input
                                                id="mobileNumber"
                                                type="text"
                                                value={mobileNumber}
                                                onChange={(e) => setMobileNumber(e.target.value)}
                                                className="staged-form-input"
                                                placeholder="Enter Mobile Number"
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="staged-form-row">
                                        <div className="staged-form-field">
                                            <label htmlFor="name">
                                                Name <span className="staged-form-required">*</span>
                                            </label>
                                            <input
                                                id="name"
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="staged-form-input"
                                                placeholder="Enter Name"
                                                required
                                            />
                                        </div>
                                        <div className="staged-form-field">
                                            <label htmlFor="mobileNumber">Mobile Number</label>
                                            <input
                                                id="mobileNumber"
                                                type="text"
                                                value={mobileNumber}
                                                onChange={(e) => setMobileNumber(e.target.value)}
                                                className="staged-form-input"
                                                placeholder="Enter Mobile Number"
                                            />
                                        </div>
                                    </div>
                                </>
                            )
                        )}

                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={() => setIsActive(!isActive)}
                                    />
                                    Activate Client
                                </label>
                            </div>

                            {isActive && (
                                <div className="staged-form-field">
                                    <label htmlFor="activationDate">
                                        Activation Date <span className="staged-form-required">*</span>
                                    </label>
                                    <DatePicker
                                        id="activationDate"
                                        selected={activationDate ? new Date(activationDate) : null}
                                        onChange={(date) => setActivationDate(date.toISOString().split('T')[0])}
                                        className="staged-form-input"
                                        placeholderText="Select Activation Date"
                                        dateFormat="MMMM d, yyyy"
                                        showPopperArrow={false}
                                        showMonthDropdown
                                        showYearDropdown
                                        dropdownMode="select"
                                        minDate={new Date()}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                );

            case "Additional Details":
                return (
                    <div className="staged-form-additional-details">
                        {legalForm && (
                            legalForm === clientTemplate.clientLegalFormOptions?.find(option => option.code === "legalFormType.person")?.value ? (
                                <>
                                    <div className="staged-form-row">
                                        <div className="staged-form-field">
                                            <label htmlFor="dateOfBirth">
                                                Date of Birth <span className="staged-form-required">*</span>
                                            </label>
                                            <DatePicker
                                                id="dateOfBirth"
                                                selected={dateOfBirth ? new Date(dateOfBirth) : null}
                                                onChange={(date) =>
                                                    setDateOfBirth(date.toISOString().split("T")[0])
                                                }
                                            className="staged-form-input"
                                            placeholderText="Select Date of Birth"
                                            dateFormat="MMMM d, yyyy"
                                            showPopperArrow={false}
                                            showMonthDropdown
                                            showYearDropdown
                                            dropdownMode="select"
                                            minDate={new Date(1900, 0, 1)}
                                            maxDate={new Date()}
                                        />
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="gender">
                                            Gender <span className="staged-form-required">*</span>
                                        </label>
                                        <select
                                            id="gender"
                                            value={gender}
                                            onChange={(e) => setGender(e.target.value)}
                                            className="staged-form-select"
                                        >
                                            <option value="">-- Select Gender --</option>
                                            {clientTemplate.genderOptions?.map((option) => (
                                                <option key={option.id} value={option.name}>
                                                    {option.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="clientType">
                                            Client Type <span className="staged-form-required">*</span>
                                        </label>
                                        <select
                                            id="clientType"
                                            value={clientType}
                                            onChange={(e) => setClientType(e.target.value)}
                                            className="staged-form-select"
                                        >
                                            <option value="">-- Select Client Type --</option>
                                            {clientTemplate.clientTypeOptions?.map((option) => (
                                                <option key={option.id} value={option.name}>
                                                    {option.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="clientClassification">
                                            Client Classification <span className="staged-form-required">*</span>
                                        </label>
                                        <select
                                            id="clientClassification"
                                            value={clientClassification}
                                            onChange={(e) => setClientClassification(e.target.value)}
                                            className="staged-form-select"
                                        >
                                            <option value="">-- Select Classification --</option>
                                            {clientTemplate.clientClassificationOptions?.map((option) => (
                                                <option key={option.id} value={option.name}>
                                                    {option.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="incorporationDate">
                                            Incorporation Date <span className="staged-form-required">*</span>
                                        </label>
                                        <DatePicker
                                            id="incorporationDate"
                                            selected={incorporationDate ? new Date(incorporationDate) : null}
                                            onChange={(date) =>
                                                setIncorporationDate(date.toISOString().split("T")[0])
                                            }
                                            className="staged-form-select"
                                            placeholderText="Select Incorporation Date"
                                            dateFormat="MMMM d, yyyy"
                                            showPopperArrow={false}
                                            showMonthDropdown
                                            showYearDropdown
                                            dropdownMode="select"
                                            minDate={new Date(1900, 0, 1)}
                                            maxDate={new Date()}
                                        />
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="incorporationValidUntil">
                                            Valid Until <span className="staged-form-required">*</span>
                                        </label>
                                        <DatePicker
                                            id="incorporationValidUntil"
                                            selected={incorporationValidUntil ? new Date(incorporationValidUntil) : null}
                                            onChange={(date) =>
                                                setIncorporationValidUntil(date.toISOString().split("T")[0])
                                            }
                                            className="staged-form-input"
                                            placeholderText="Select Valid Until Date"
                                            dateFormat="MMMM d, yyyy"
                                            showPopperArrow={false}
                                            showMonthDropdown
                                            showYearDropdown
                                            dropdownMode="select"
                                            minDate={new Date()}
                                        />
                                    </div>
                                </div>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="incorporationNumber">
                                            Incorporation Number <span className="staged-form-required">*</span>
                                        </label>
                                        <input
                                            id="incorporationNumber"
                                            type="text"
                                            value={incorporationNumber}
                                            onChange={(e) => setIncorporationNumber(e.target.value)}
                                            className="staged-form-input"
                                            placeholder="Enter Incorporation Number"
                                            required
                                        />
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="mainBusinessLine">Main Business Line</label>
                                        <select
                                            id="mainBusinessLine"
                                            value={mainBusinessLine}
                                            onChange={(e) => setMainBusinessLine(e.target.value)}
                                            className="staged-form-select"
                                        >
                                            <option value="">-- Select Business Line --</option>
                                            {clientTemplate.clientNonPersonMainBusinessLineOptions?.map((option) => (
                                                <option key={option.id} value={option.name}>
                                                    {option.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="staged-form-row">
                                    <div className="staged-form-field">
                                        <label htmlFor="constitution">Constitution</label>
                                        <select
                                            id="constitution"
                                            value={constitution}
                                            onChange={(e) => setConstitution(e.target.value)}
                                            className="staged-form-select"
                                        >
                                            <option value="">-- Select Constitution --</option>
                                            {clientTemplate.clientNonPersonConstitutionOptions?.map((option) => (
                                                <option key={option.id} value={option.name}>
                                                    {option.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="staged-form-field">
                                        <label htmlFor="remarks">Remarks</label>
                                        <textarea
                                            id="remarks"
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                            className="staged-form-textarea"
                                            placeholder="Enter Remarks"
                                        ></textarea>
                                    </div>
                                </div>
                            </>
                        )
                        )}

                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label htmlFor="submittedOn">
                                    Submitted On <span className="staged-form-required">*</span>
                                </label>
                                <DatePicker
                                    id="submittedOn"
                                    selected={submittedOn ? new Date(submittedOn) : null}
                                    onChange={(date) => {
                                        setSubmittedOn(date.toISOString().split("T")[0]);
                                    }}
                                    className="staged-form-input"
                                    placeholderText="Select Submission Date"
                                    dateFormat="MMMM d, yyyy"
                                    showPopperArrow={false}
                                    showMonthDropdown
                                    showYearDropdown
                                    dropdownMode="select"
                                    minDate={new Date(1900, 0, 1)}
                                    maxDate={new Date()}
                                />
                            </div>
                            {legalForm &&
                                ( legalForm === clientTemplate.clientLegalFormOptions?.find(option => option.code === "legalFormType.person")?.value && (
                                <div className="staged-form-field">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={isStaff}
                                            onChange={() => setIsStaff(!isStaff)}
                                        />
                                        Is Staff?
                                    </label>
                                </div>
                                ))}
                        </div>
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={openSavingsAccount}
                                        onChange={() => setOpenSavingsAccount(!openSavingsAccount)}
                                    />
                                    Open Savings Account
                                </label>
                            </div>

                            {openSavingsAccount && (
                                <div className="staged-form-field">
                                    <label htmlFor="savingsProduct">
                                        Savings Product <span className="staged-form-required">*</span>
                                    </label>
                                    <select
                                        id="savingsProduct"
                                        value={selectedSavingsProduct}
                                        onChange={(e) => setSelectedSavingsProduct(e.target.value)}
                                        className="staged-form-select"
                                        required
                                    >
                                        <option value="">-- Select Savings Product --</option>
                                        {clientTemplate.savingProductOptions?.map((product) => (
                                            <option key={product.id} value={product.id}>
                                                {product.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case "Family Members":
                return (
                    <div className="staged-form-family-members">
                        <div className="t-head">
                            <h3>Family Members</h3>
                            <div
                                className="add-family-member"
                                onClick={() => setShowModal(true)}
                            >
                                <FaPlus className="react-icon-plus"/> Add Family Member
                            </div>
                        </div>
                        <table className="staged-form-table">
                            <thead>
                            <tr>
                                <th>First Name</th>
                                <th>Middle Name</th>
                                <th>Last Name</th>
                                <th>Mobile Number</th>
                                <th>Age</th>
                                <th>Dependent</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {familyMembers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="staged-form-no-data">
                                        No family members added.
                                    </td>
                                </tr>
                            ) : (
                                familyMembers.map((member, index) => (
                                    <tr key={index}>
                                        <td>{member.firstName}</td>
                                        <td>{member.middleName}</td>
                                        <td>{member.lastName}</td>
                                        <td>{member.mobileNumber}</td>
                                        <td>{member.age}</td>
                                        <td>{member.isDependent ? "Yes" : "No"}</td>
                                        <td>
                                            <button
                                                className="edit-icon"
                                                onClick={() => handleEditFamilyMember(index)}
                                            >
                                                <FaEdit/>
                                            </button>
                                            <button
                                                className="remove-icon"
                                                style={{border: 'none'}}
                                                onClick={() => removeFamilyMember(index)}
                                            >
                                                <FaTrash/>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                );

            default:
                return null;
        }
    };

    const renderPreviewSection = () => {
        const getOfficeName = () => {
            const officeObj = clientTemplate.officeOptions?.find((o) => o.id === parseInt(office));
            return officeObj ? officeObj.name : "";
        };

        const getStaffName = () => {
            const staffObj = staffs.find((s) => s.id === parseInt(staff));
            return staffObj ? staffObj.displayName : "";
        };

        const getSelectedSavingsProductName = () => {
            const productObj = clientTemplate.savingProductOptions?.find(
                (p) => p.id === parseInt(selectedSavingsProduct)
            );
            return productObj ? productObj.name : "";
        };

        const transformFamilyMembers = () =>
            familyMembers.length > 0
                ? familyMembers.map((member) => ({
                    "First Name": member.firstName || "",
                    "Middle Name": member.middleName || "",
                    "Last Name": member.lastName || "",
                    "Mobile Number": member.mobileNumber || "",
                    Age: member.age || "",
                    Gender: clientTemplate.genderOptions?.find((g) => g.id === member.gender)?.name || "",
                    Profession: member.profession || "",
                    "Marital Status":
                        clientTemplate.maritalStatusIdOptions?.find((m) => m.id === member.maritalStatus)?.name || "",
                    "Date of Birth": member.dateOfBirth
                        ? format(new Date(member.dateOfBirth), "MMMM d, yyyy")
                        : "",
                    Dependent: member.isDependent ? "Yes" : "No",
                }))
                : null;

        const stageData = [
            {
                title: "Basic User Info",
                data: {
                    Office: getOfficeName(),
                    Staff: getStaffName(),
                    "External ID": externalId || "",
                    "Legal Form": legalForm || "",
                    ...(legalForm === clientTemplate.clientLegalFormOptions?.find(option => option.code === "legalFormType.person")?.value
                        ? {
                            "First Name": firstName || "",
                            "Middle Name": middleName || "",
                            "Last Name": lastName || "",
                            "Mobile Number": mobileNumber || "",
                        }
                        : {
                            Name: name || "",
                            "Mobile Number": mobileNumber || "",
                        }),
                    "Active Client": isActive ? "Yes" : "No",
                    ...(isActive && activationDate
                        ? {
                            "Activation Date": format(new Date(activationDate), "MMMM d, yyyy"),
                        }
                        : {}),
                },
            },
            {
                title: "Additional Details",
                data: {
                    ...(legalForm === clientTemplate.clientLegalFormOptions?.find(option => option.code === "legalFormType.person")?.value
                        ? {
                            "Date of Birth": dateOfBirth
                                ? format(new Date(dateOfBirth), "MMMM d, yyyy")
                                : "",
                            Gender: clientTemplate.genderOptions?.find((g) => g.name === gender)?.name || "",
                            "Client Type": clientTemplate.clientTypeOptions?.find((t) => t.name === clientType)?.name || "",
                            "Client Classification":
                                clientTemplate.clientClassificationOptions?.find((c) => c.name === clientClassification)?.name ||
                                "",
                            "Is Staff": isStaff ? "Yes" : "No",
                        }
                        : {
                            "Incorporation Date": incorporationDate
                                ? format(new Date(incorporationDate), "MMMM d, yyyy")
                                : "",
                            "Valid Until": incorporationValidUntil
                                ? format(new Date(incorporationValidUntil), "MMMM d, yyyy")
                                : "",
                            "Incorporation Number": incorporationNumber || "",
                            "Main Business Line":
                                clientTemplate.clientNonPersonMainBusinessLineOptions?.find((b) => b.name === mainBusinessLine)
                                    ?.name || "",
                            Constitution:
                                clientTemplate.clientNonPersonConstitutionOptions?.find((c) => c.name === constitution)?.name ||
                                "",
                            Remarks: remarks || "",
                            "Submitted On": submittedOn
                                ? format(new Date(submittedOn), "MMMM d, yyyy")
                                : "",
                            "Open Savings Account": openSavingsAccount ? "Yes" : "No",
                            ...(openSavingsAccount && selectedSavingsProduct
                                ? {
                                    "Savings Product": getSelectedSavingsProductName(),
                                }
                                : {}),
                        }),
                },
            },
            {
                title: "Family Members",
                data: transformFamilyMembers(),
            },
        ];

        return (
            <div className="staged-form-preview-section">
                <h2 className="preview-header">Form Preview</h2>
                {stageData.map(({ title, data }, index) => (
                    <div key={title} className="staged-form-preview-block">
                        <div className="staged-form-preview-header">
                            <h4 className="preview-stage-title">{title}</h4>
                            <button
                                className="staged-form-edit-button"
                                onClick={() => setCurrentStage(index)}
                            >
                                Edit
                            </button>
                        </div>
                        {data && typeof data === "object" && !Array.isArray(data) ? (
                            <div className="staged-form-preview-table-wrapper">
                                <table className="staged-form-preview-table">
                                    <thead>
                                    <tr>
                                        <th>Field</th>
                                        <th>Value</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {Object.entries(data).map(([key, value]) => (
                                        <tr key={key}>
                                            <td>{key}</td>
                                            <td>{value || ""}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : Array.isArray(data) && data.length > 0 ? (
                            <table className="staged-form-preview-table">
                                <thead>
                                <tr>
                                    {Object.keys(data[0]).map((key) => (
                                        <th key={key}>{key}</th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                {data.map((item, idx) => (
                                    <tr key={idx}>
                                        {Object.values(item).map((value, i) => (
                                            <td key={i}>
                                                {typeof value === "object"
                                                    ? JSON.stringify(value)
                                                    : value || ""}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="no-data-message">No data available for this section.</p>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const handleNextStage = () => {
        if (currentStage < stages.length) {
            const stageComplete =
                (currentStage === 0 && isStep1Complete) ||
                (currentStage === 1 && isStep2Complete) ||
                (currentStage === 2 && familyMembers.length >= 0);

            if (stageComplete || (currentStage === stages.length - 1 && allStagesComplete)) {
                setCompletedStages((prev) => {
                    const updatedStages = new Set(prev);
                    updatedStages.add(stages[currentStage]);
                    return updatedStages;
                });

                setCurrentStage((prev) => prev + 1);
            }
        } else if (currentStage === stages.length && allStagesComplete) {
            setCompletedStages((prev) => {
                const updatedStages = new Set(prev);
                updatedStages.add("Preview");
                return updatedStages;
            });
        }
    };

    const handleSubmit = async () => {
        startLoading();
        try {
            const headers = {
                Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                'Content-Type': 'application/json',
            };

            if (!legalForm) {
                showNotification('Legal form must be selected!', 'info');
                return;
            }

            if (legalForm === clientTemplate.clientLegalFormOptions?.find(option => option.code === "legalFormType.person")?.value && (!firstName || !lastName)) {
                showNotification('First and Last Name are required for Person legal form!', 'info');
                return;
            }

            if (legalForm === clientTemplate.clientLegalFormOptions?.find(option => option.code === "legalFormType.entity")?.value && !name) {
                showNotification('Name is required for Entity legal form!', 'info');
                return;
            }

            if (isActive && !activationDate) {
                showNotification('Activation date is required when activating the client!', 'info');
                return;
            }

            const formattedActivationDate = isActive ? format(new Date(activationDate), 'dd MMMM yyyy') : null;
            const formattedSubmittedOnDate = submittedOn ? format(new Date(submittedOn), 'dd MMMM yyyy') : null;
            const formattedDateOfBirth = dateOfBirth ? format(new Date(dateOfBirth), 'dd MMMM yyyy') : null;

            const clientData = {
                officeId: parseInt(office),
                legalFormId: clientTemplate.clientLegalFormOptions?.find(option => option.value === legalForm)?.id,
                firstname: legalForm === clientTemplate.clientLegalFormOptions?.find(option => option.code === "legalFormType.person")?.value ? firstName : undefined,
                lastname: legalForm === clientTemplate.clientLegalFormOptions?.find(option => option.code === "legalFormType.person")?.value ? lastName : undefined,
                fullname: legalForm === clientTemplate.clientLegalFormOptions?.find(option => option.code === "legalFormType.entity")?.value ? name : undefined,
                mobileNo: mobileNumber || undefined,
                isStaff,
                staffId: staff ? parseInt(staff) : undefined,
                active: isActive,
                activationDate: formattedActivationDate,
                submittedOnDate: formattedSubmittedOnDate,
                dateOfBirth: formattedDateOfBirth,
                dateFormat: 'dd MMMM yyyy',
                locale: 'en',
                genderId: gender ? parseInt(clientTemplate.genderOptions?.find((g) => g.name === gender)?.id) : undefined,
                clientTypeId: clientType ? parseInt(clientTemplate.clientTypeOptions?.find((t) => t.name === clientType)?.id) : undefined,
                clientClassificationId: clientClassification ? parseInt(clientTemplate.clientClassificationOptions?.find((c) => c.name === clientClassification)?.id) : undefined,
                savingsProductId: openSavingsAccount ? parseInt(selectedSavingsProduct) : undefined,
                externalId: externalId || undefined,
            };

            const response = await axios.post(`${API_CONFIG.proxy}/fineract-provider/api/v1/clients`, clientData, { headers });

            setLegalForm('');
            setFirstName('');
            setMiddleName('');
            setLastName('');
            setName('');
            setMobileNumber('');
            setIsStaff(false);
            setIsActive(false);
            setActivationDate(null);
            setSubmittedOn(null);
            setGender('');
            setClientType('');
            setClientClassification('');
            setSelectedSavingsProduct('');
            setOpenSavingsAccount(false);
            setExternalId('');
            setStaff('');

            navigate("/clients", {
                state: {
                    clientId: response.data.clientId,
                    clientName: legalForm === clientTemplate.clientLegalFormOptions?.find(option => option.code === "legalFormType.person")?.value
                        ? `${firstName} ${lastName}`
                        : name || "Client Details",
                    preventDuplicate: true,
                },
            });
        } catch (error) {
            console.error('Error submitting client data:', error.response?.data || error.message);
            showNotification('Error submitting client data:', 'error');
        } finally {
            stopLoading();
        }
    };

    const handleEditFamilyMember = (index) => {
        setCurrentEditIndex(index);
        setNewFamilyMember(familyMembers[index]);
        setShowModal(true);
    };

    return (
        <>
            <div className="staged-form-add-client">
                {renderStageTracker()}
                <div className="staged-form-stage-content">
                    {currentStage === stages.length && allStagesComplete ? (
                        renderPreviewSection()
                    ) : (
                        renderStageContent()
                    )}

                    <div className="staged-form-stage-buttons">
                        <button
                            onClick={() => setCurrentStage((prev) => Math.max(prev - 1, 0))}
                            disabled={currentStage === 0}
                            className="staged-form-button-previous"
                        >
                            Previous
                        </button>
                        {currentStage < stages.length && (
                            <button
                                onClick={handleNextStage}
                                className="staged-form-button-next"
                                disabled={
                                    (currentStage === 0 && !isStep1Complete) ||
                                    (currentStage === 1 && !isStep2Complete)
                                }
                            >
                                Next
                            </button>
                        )}
                        {currentStage === stages.length && (
                            <button
                                onClick={handleSubmit}
                                className="staged-form-button-next"
                                disabled={!allStagesComplete}
                            >
                                Submit
                            </button>
                        )}
                    </div>
                </div>
            </div>
            {showModal && (
                <div className="create-provisioning-criteria-modal-overlay" onClick={() => setShowModal(false)}>
                    <div
                        className="create-provisioning-criteria-modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h4 className="create-modal-title">Add Family Member</h4>
                        <div className="create-holiday-row">
                            <div className="create-provisioning-criteria-group">
                                <label htmlFor="fmFirstName" className="create-provisioning-criteria-label">
                                    First Name <span>*</span>
                                </label>
                                <input
                                    id="fmFirstName"
                                    type="text"
                                    value={newFamilyMember.firstName}
                                    onChange={(e) =>
                                        setNewFamilyMember({ ...newFamilyMember, firstName: e.target.value })
                                    }
                                    className="create-provisioning-criteria-input"
                                    placeholder="Enter First Name"
                                    required
                                />
                            </div>
                            <div className="create-provisioning-criteria-group">
                                <label htmlFor="fmMiddleName" className="create-provisioning-criteria-label">
                                    Middle Name
                                </label>
                                <input
                                    id="fmMiddleName"
                                    type="text"
                                    value={newFamilyMember.middleName}
                                    onChange={(e) =>
                                        setNewFamilyMember({ ...newFamilyMember, middleName: e.target.value })
                                    }
                                    className="create-provisioning-criteria-input"
                                    placeholder="Enter Middle Name"
                                />
                            </div>
                        </div>

                        <div className="create-holiday-row">
                            <div className="create-provisioning-criteria-group">
                                <label htmlFor="fmLastName" className="create-provisioning-criteria-label">
                                    Last Name <span>*</span>
                                </label>
                                <input
                                    id="fmLastName"
                                    type="text"
                                    value={newFamilyMember.lastName}
                                    onChange={(e) =>
                                        setNewFamilyMember({ ...newFamilyMember, lastName: e.target.value })
                                    }
                                    className="create-provisioning-criteria-input"
                                    placeholder="Enter Last Name"
                                    required
                                />
                            </div>
                            <div className="create-provisioning-criteria-group">
                                <label htmlFor="fmMobileNumber" className="create-provisioning-criteria-label">
                                    Mobile Number
                                </label>
                                <input
                                    id="fmMobileNumber"
                                    type="text"
                                    value={newFamilyMember.mobileNumber}
                                    onChange={(e) =>
                                        setNewFamilyMember({
                                            ...newFamilyMember,
                                            mobileNumber: e.target.value,
                                        })
                                    }
                                    className="create-provisioning-criteria-input"
                                    placeholder="Enter Mobile Number"
                                />
                            </div>
                        </div>

                        <div className="create-holiday-row">
                            <div className="create-provisioning-criteria-group">
                                <label htmlFor="fmAge" className="create-provisioning-criteria-label">
                                    Age <span>*</span>
                                </label>
                                <input
                                    id="fmAge"
                                    type="number"
                                    required
                                    min="0"
                                    max="120"
                                    value={newFamilyMember.age}
                                    onChange={(e) =>
                                        setNewFamilyMember({
                                            ...newFamilyMember,
                                            age: e.target.value,
                                        })
                                    }
                                    className="create-provisioning-criteria-input"
                                    placeholder="Enter Age"
                                />
                            </div>
                            <div className="create-provisioning-criteria-group">
                                <label htmlFor="fmGender" className="create-provisioning-criteria-label">
                                    Gender <span>*</span>
                                </label>
                                <select
                                    id="fmGender"
                                    value={newFamilyMember.gender}
                                    onChange={(e) =>
                                        setNewFamilyMember({...newFamilyMember, gender: e.target.value})
                                    }
                                    className="create-provisioning-criteria-select"
                                >
                                    <option value="">-- Select Gender --</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                        </div>

                        <div className="create-holiday-row">
                            <div className="create-provisioning-criteria-group">
                                <label htmlFor="fmProfession" className="create-provisioning-criteria-label">
                                    Profession <span>*</span>
                                </label>
                                <select
                                    id="fmProfession"
                                    value={newFamilyMember.profession}
                                    onChange={(e) =>
                                        setNewFamilyMember({
                                            ...newFamilyMember,
                                            profession: e.target.value,
                                        })
                                    }
                                    className="create-provisioning-criteria-select"
                                    required
                                >
                                    <option value="">-- Select Profession --</option>
                                    <option value="Business">Business Person</option>
                                    <option value="Employed">Employed</option>
                                    <option value="Self Employed">Self Employed</option>
                                    <option value="Student">Student</option>
                                    <option value="Unemployed">Unemployed</option>
                                </select>
                            </div>
                            <div className="create-provisioning-criteria-group">
                                <label htmlFor="fmMaritalStatus" className="create-provisioning-criteria-label">
                                    Marital Status
                                </label>
                                <select
                                    id="fmMaritalStatus"
                                    value={newFamilyMember.maritalStatus}
                                    onChange={(e) =>
                                        setNewFamilyMember({
                                            ...newFamilyMember,
                                            maritalStatus: e.target.value,
                                        })
                                    }
                                    className="create-provisioning-criteria-select"
                                >
                                    <option value="">-- Select Marital Status --</option>
                                    <option value="Single">Single</option>
                                    <option value="Married">Married</option>
                                    <option value="Divorced">Divorced</option>
                                </select>
                            </div>
                        </div>

                        <div className="create-holiday-row">
                            <div className="create-provisioning-criteria-group">
                                <label htmlFor="fmDateOfBirth" className="create-provisioning-criteria-label">
                                    Date of Birth <span>*</span>
                                </label>
                                <div className="date-picker-container">
                                    <DatePicker
                                        id="fmDateOfBirth"
                                        selected={newFamilyMember.dateOfBirth ? new Date(newFamilyMember.dateOfBirth) : new Date()}
                                        onChange={(date) =>
                                            setNewFamilyMember({
                                                ...newFamilyMember,
                                                dateOfBirth: date.toISOString().split("T")[0],
                                            })
                                        }
                                        className="create-provisioning-criteria-input"
                                        placeholderText="Select Date"
                                        dateFormat="MMMM d, yyyy"
                                        showPopperArrow={false}
                                        showMonthDropdown
                                        showYearDropdown
                                        dropdownMode="select"
                                        minDate={new Date(1900, 0, 1)}
                                        maxDate={new Date()}
                                    />
                                </div>
                            </div>
                            <div className="create-provisioning-criteria-group">
                                <label className="create-provisioning-criteria-label">
                                    <input
                                        type="checkbox"
                                        checked={newFamilyMember.isDependent}
                                        onChange={(e) =>
                                            setNewFamilyMember({
                                                ...newFamilyMember,
                                                isDependent: e.target.checked,
                                            })
                                        }
                                    /> Dependent
                                </label>
                            </div>
                        </div>

                        <div className="create-provisioning-criteria-modal-actions">
                            <button
                                onClick={() => setShowModal(false)}
                                className="create-provisioning-criteria-cancel"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addFamilyMember}
                                className="create-provisioning-criteria-confirm"
                                disabled={
                                    !newFamilyMember.firstName ||
                                    !newFamilyMember.lastName ||
                                    !newFamilyMember.age ||
                                    !newFamilyMember.gender
                                }
                            >
                                {currentEditIndex !== null ? "Update" : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </>
    );

};

export default AddClientForm;
