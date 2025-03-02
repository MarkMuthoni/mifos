import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "../../../context/AuthContext";
import { API_CONFIG } from "../../../config";
import "./CreateUser.css";
import {FaEye, FaEyeSlash} from "react-icons/fa";
import {NotificationContext} from "../../../context/NotificationContext";

const CreateUserForm = ({ onUserCreated }) => {
    const stages = ["Basic Information", "Settings", "Preview"];

    const [currentStage, setCurrentStage] = useState(0);
    const [completedStages, setCompletedStages] = useState(new Set());

    const [username, setUsername] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [sendPasswordToEmail, setSendPasswordToEmail] = useState(true);
    const [passwordNeverExpires, setPasswordNeverExpires] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [office, setOffice] = useState("");
    const [staff, setStaff] = useState("");
    const [staffOptions, setStaffOptions] = useState([]);
    const [offices, setOffices] = useState([]);

    const [roles, setRoles] = useState([]);
    const [selectedRoles, setSelectedRoles] = useState([]);

    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

    const togglePasswordVisibility = () => setPasswordVisible((prev) => !prev);
    const toggleConfirmPasswordVisibility = () => setConfirmPasswordVisible((prev) => !prev);

    const [isStep1Valid, setIsStep1Valid] = useState(false);
    const [isStep2Valid, setIsStep2Valid] = useState(false);

    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);

    const isStep1Complete = () =>
        username.length >= 5 &&
        firstName.trim() !== "" &&
        lastName.trim() !== "" &&
        (sendPasswordToEmail
            ? isValidEmail(email) && email.trim() !== ""
            : isValidPassword(password) && password === confirmPassword);

    const isStep2Complete = () => office.trim() !== "";

    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const isValidPassword = (password) => {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
        return passwordRegex.test(password);
    };

    useEffect(() => {
        setIsStep1Valid(isStep1Complete());
    }, [username, firstName, lastName, email, sendPasswordToEmail, password, confirmPassword]);

    useEffect(() => {
        setIsStep2Valid(isStep2Complete());
    }, [office, selectedRoles]);

    const fetchTemplateData = async () => {
        try {
            const response = await axios.get(`/fineract-provider/api/v1/users/template`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });
            setRoles(response.data.availableRoles);

            const officesResponse = await axios.get(`/fineract-provider/api/v1/offices`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });
            setOffices(officesResponse.data || []);
        } catch (error) {
            console.error("Error fetching template data:", error);
        }
    };

    const fetchStaffData = async (officeId) => {
        try {
            const response = await axios.get(`/fineract-provider/api/v1/staff?officeId=${officeId}&status=all`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });
            setStaffOptions(response.data);
        } catch (error) {
            console.error("Error fetching staff data:", error);
        }
    };

    useEffect(() => {
        fetchTemplateData();
    }, []);

    useEffect(() => {
        if (office) {
            fetchStaffData(office);
        }
    }, [office]);

    const handleNextStage = () => {
        if (currentStage < stages.length - 1) {
            if (
                (currentStage === 0 && isStep1Complete()) ||
                (currentStage === 1 && isStep2Complete())
            ) {
                setCompletedStages((prev) => {
                    const updatedStages = new Set(prev);
                    updatedStages.add(stages[currentStage]);
                    return updatedStages;
                });
                setCurrentStage((prev) => prev + 1);
            }
        }
    };

    const handleSubmit = async () => {
        const payload = {
            username,
            email, // Always include email
            firstname: firstName,
            lastname: lastName,
            officeId: parseInt(office),
            password: !sendPasswordToEmail ? password : undefined,
            repeatPassword: !sendPasswordToEmail ? confirmPassword : undefined,
            passwordNeverExpires,
            roles: selectedRoles.map((roleId) => parseInt(roleId)),
            sendPasswordToEmail,
            staffId: staff ? parseInt(staff) : undefined,
        };

        try {
            const response = await axios.post(`/fineract-provider/api/v1/users`, payload, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.status === 200) {
                const { resourceId } = response.data;
                const newUser = {
                    id: resourceId,
                    firstname: firstName,
                    lastname: lastName,
                };

                // Clear fields
                setUsername("");
                setFirstName("");
                setLastName("");
                setEmail("");
                setSendPasswordToEmail(true);
                setPassword("");
                setConfirmPassword("");
                setPasswordNeverExpires(false);
                setOffice("");
                setStaff("");
                setSelectedRoles([]);
                setCurrentStage(0);
                setCompletedStages(new Set());

                onUserCreated(newUser);

            }
        } catch (error) {
            console.error("Error creating user:", error);
            showNotification("An error occurred while creating the user. Please try again!", 'error');
        }
    };

    const renderStageTracker = () => (
        <div className="staged-form-stage-tracker">
            {stages.map((stage, index) => (
                <div
                    key={stage}
                    className={`staged-form-stage ${
                        index === currentStage
                            ? "staged-form-active"
                            : completedStages.has(stage)
                                ? "staged-form-completed"
                                : "staged-form-unvisited"
                    }`}
                    onClick={() => {
                        if (completedStages.has(stage)) {
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

    const renderStageContent = () => {
        if (stages[currentStage] === "Preview") {
            return renderPreviewSection();
        }

        switch (stages[currentStage]) {
            case "Basic Information":
                return (
                    <div className="staged-form-basic-info">
                        {/* Username */}
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label>
                                    Username <span className="staged-form-required">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter username (min 5 characters)"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    minLength="5"
                                    required
                                    className="staged-form-input"
                                />
                                {username.length > 0 && username.length < 5 && (
                                    <p className="error-message">Username must be at least 5 characters long</p>
                                )}
                            </div>
                            <div className="staged-form-field">
                                <label>
                                    Email {sendPasswordToEmail && <span className="staged-form-required">*</span>}
                                </label>
                                <input
                                    type="email"
                                    placeholder="Enter email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required={sendPasswordToEmail}
                                    className="staged-form-input"
                                />
                            </div>
                        </div>

                        {/* First Name and Last Name */}
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label>
                                    First Name <span className="staged-form-required">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter first name"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                    className="staged-form-input"
                                />
                            </div>
                            <div className="staged-form-field">
                                <label>
                                    Last Name <span className="staged-form-required">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter last name"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                    className="staged-form-input"
                                />
                            </div>
                        </div>

                        <div className="staged-form-row">
                            {/* Send Password to Email */}
                            <div className="staged-form-field">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={sendPasswordToEmail}
                                        onChange={() => {
                                            setSendPasswordToEmail((prev) => !prev);
                                            setPassword("");
                                            setConfirmPassword("");
                                        }}
                                        className="checkbox-input"
                                    />
                                    Send Password to Email
                                </label>
                            </div>

                            {/* Password Never Expires */}
                            <div className="staged-form-field">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={passwordNeverExpires}
                                        onChange={() => setPasswordNeverExpires((prev) => !prev)}
                                        className="checkbox-input"
                                    />
                                    Password Never Expires
                                </label>
                            </div>
                        </div>

                        {/* Password and Confirm Password */}
                        {!sendPasswordToEmail && (
                            <div className="staged-form-row">
                                {/* Password Field */}
                                {/* Password Field */}
                                <div className="staged-form-field">
                                    <label>
                                        Password <span className="staged-form-required">*</span>
                                    </label>
                                    <div className="password-field-container">
                                        <input
                                            type={passwordVisible ? "text" : "password"}
                                            placeholder="Enter password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className={`staged-form-input password-input ${!isValidPassword(password) && password.trim() !== "" ? "invalid" : ""}`}
                                        />
                                        <span
                                            className="toggle-visibility-icon"
                                            onClick={togglePasswordVisibility}
                                        >
                                            {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                                        </span>
                                    </div>
                                    {!isValidPassword(password) && password.trim() !== "" && (
                                        <p className="error-message">
                                            Password must include at least 8 characters, an uppercase letter, a lowercase letter, a number, and a special character.
                                        </p>
                                    )}
                                </div>


                                {/* Confirm Password Field */}
                                <div className="staged-form-field">
                                    <label>
                                        Confirm Password <span className="staged-form-required">*</span>
                                    </label>
                                    <div className="password-field-container">
                                        <input
                                            type={confirmPasswordVisible ? "text" : "password"}
                                            placeholder="Confirm password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            className={`staged-form-input password-input ${password !== confirmPassword && confirmPassword.trim() !== "" ? "invalid" : ""}`}
                                        />
                                        <span
                                            className="toggle-visibility-icon"
                                            onClick={toggleConfirmPasswordVisibility}
                                        >
                                            {confirmPasswordVisible ? <FaEyeSlash/> : <FaEye/>}
                                        </span>
                                        {password !== confirmPassword && confirmPassword.trim() !== "" && (
                                            <p className="error-message">Passwords must match</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case "Settings":
                return (
                    <div className="staged-form-settings">
                        <div className="staged-form-row">
                            <div className="staged-form-field">
                                <label>
                                    Office <span className="staged-form-required">*</span>
                                </label>
                                <select
                                    value={office}
                                    onChange={(e) => setOffice(e.target.value)}
                                    required
                                    className="staged-form-select"
                                >
                                    <option value="">-- Select Office --</option>
                                    {offices.map((officeOption) => (
                                        <option key={officeOption.id} value={officeOption.id}>
                                            {officeOption.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="staged-form-field">
                                <label>Assign Staff</label>
                                <select
                                    value={staff}
                                    onChange={(e) => setStaff(e.target.value)}
                                    className="staged-form-select"
                                >
                                    <option value="">-- Select Staff --</option>
                                    {staffOptions.map((staffMember) => (
                                        <option key={staffMember.id} value={staffMember.id}>
                                            {staffMember.displayName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="staged-form-field">
                            <label>Assign Roles</label>
                            <div className="roles-container">
                                {roles.map((role) => (
                                    <div key={role.id} className="checkbox-group role-item">
                                        <label> <input
                                            type="checkbox"
                                            checked={selectedRoles.includes(role.id)}
                                            onChange={() =>
                                                setSelectedRoles((prev) =>
                                                    prev.includes(role.id)
                                                        ? prev.filter((id) => id !== role.id)
                                                        : [...prev, role.id]
                                                )
                                            }
                                        />
                                            {role.name}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    const renderPreviewSection = () => {
        const getOfficeName = () => {
            const officeObj = offices.find((o) => o.id === parseInt(office));
            return officeObj ? officeObj.name : "N/A";
        };

        const getStaffName = () => {
            const staffObj = staffOptions.find((s) => s.id === parseInt(staff));
            return staffObj ? staffObj.displayName : "N/A";
        };

        const getRoleNames = () =>
            selectedRoles
                .map((roleId) => roles.find((role) => role.id === roleId)?.name)
                .filter(Boolean)
                .join(", ") || "N/A";

        const stageData = [
            {
                title: "Basic Information",
                data: {
                    Username: username || "N/A",
                    "First Name": firstName || "N/A",
                    "Last Name": lastName || "N/A",
                    Email: email || "N/A",
                    Password: !sendPasswordToEmail ? "••••••••" : "Hidden (Send Password to Email Enabled)",
                    "Send Password to Email": sendPasswordToEmail ? "Yes" : "No",
                    "Password Never Expires": passwordNeverExpires ? "Yes" : "No",
                },
            },
            {
                title: "Settings",
                data: {
                    Office: getOfficeName(),
                    Staff: getStaffName(),
                    Roles: getRoleNames(),
                },
            },
        ];

        return (
            <div className="staged-form-preview-section">
                <h2 className="preview-header">Form Preview</h2>
                {stageData.map(({ title, data }) => (
                    <div key={title} className="staged-form-preview-block">
                        <div className="staged-form-preview-header">
                            <h4 className="preview-stage-title">{title}</h4>
                            <button
                                className="staged-form-edit-button"
                                onClick={() => setCurrentStage(stages.indexOf(title))}
                            >
                                Edit
                            </button>
                        </div>
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
                                        <td>{value}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="form-container-create-user">
            <div className="staged-form-create-user">
                {renderStageTracker()}

                <div className="staged-form-stage-content">
                    {renderStageContent()}

                    <div className="staged-form-stage-buttons">
                        <button
                            onClick={() => setCurrentStage((prev) => Math.max(prev - 1, 0))}
                            disabled={currentStage === 0}
                            className="staged-form-button-previous"
                        >
                            Previous
                        </button>

                        {currentStage < stages.length - 1 && (
                            <button
                                onClick={handleNextStage}
                                className="staged-form-button-next"
                                disabled={
                                    (currentStage === stages.indexOf("Basic Information") && !isStep1Valid) ||
                                    (currentStage === stages.indexOf("Settings") && !isStep2Valid)
                                }
                            >
                                Next
                            </button>
                        )}

                        {stages[currentStage] === "Preview" && (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="staged-form-button-next"
                            >
                                Submit
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateUserForm;
