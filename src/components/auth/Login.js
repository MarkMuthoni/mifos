import React, {useState, useContext, memo } from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';
import { API_CONFIG } from "../../config";
import { AuthContext } from '../../context/AuthContext';
import { NotificationContext } from '../../context/NotificationContext';
import { useLoading } from '../../context/LoadingContext';
import { FaEye, FaEyeSlash} from "react-icons/fa";

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
    const { showNotification } = useContext(NotificationContext);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showSecurityAnswer1, setShowSecurityAnswer1] = useState(false);
    const [showSecurityAnswer2, setShowSecurityAnswer2] = useState(false);
    const { login, superAdminLogin, updateSuperAdminCredentials, superAdmin} = useContext(AuthContext);
    const { isBaseURLChanged, updateBaseURL, updateTenantId } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const navigate = useNavigate();

    const [isSettingUp, setIsSettingUp] = useState(false);
    const [setupStep, setSetupStep] = useState(1);
    const [newUsername, setNewUsername] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [securityQuestion1, setSecurityQuestion1] = useState("");
    const [securityAnswer1, setSecurityAnswer1] = useState("");
    const [securityQuestion2, setSecurityQuestion2] = useState("");
    const [securityAnswer2, setSecurityAnswer2] = useState("");

    const handleResetBaseURL = async () => {
        try {
            const cacheBuster = `?t=${new Date().getTime()}`;
            const response = await fetch(`${process.env.PUBLIC_URL}/config.json${cacheBuster}`, {
                cache: 'no-store',
            });

            if (response.ok) {
                const config = await response.json();
                const defaultBaseURL = config.baseURL;
                const defaultTenantId = config.tenantId;

                updateBaseURL(defaultBaseURL);
                updateTenantId(defaultTenantId);
                showNotification("Base URL has been reset to the default!", "success");
                window.location.reload();
            } else {
                showNotification("Failed to reset Base URL: Unable to load config!", "error");
            }
        } catch (error) {
            console.error("Error resetting Base URL:", error);
            showNotification("Error resetting Base URL!", "error");
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        startLoading();

        try {
            if (username === superAdmin.username) {
                const response = await superAdminLogin(username, password);
                if (response?.firstLogin) {
                    setIsSettingUp(true);
                    stopLoading();
                } else if (response?.success) {
                    showNotification("Super Admin logged in successfully!", "success");
                    stopLoading();
                    navigate("/");
                } else {
                    showNotification(response?.message || "Login failed for Super Admin.", "error");
                    stopLoading();
                }
            } else {
                const loginData = { username, password };
                const response = await fetch(`/fineract-provider/api/v1/authentication`, {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    },
                    body: JSON.stringify(loginData),
                });

                const data = await response.json();
                if (response.ok) {
                    showNotification("Login Successful! Welcome!", "success");

                    const userData = {
                        username: data.username,
                        userId: data.userId,
                        base64EncodedAuthenticationKey: data.base64EncodedAuthenticationKey,
                        authenticated: data.authenticated,
                        officeId: data.officeId,
                        officeName: data.officeName,
                        roles: data.roles,
                        permissions: data.permissions,
                    };

                    login(userData);
                    navigate("/");
                } else {
                    switch (response.status) {
                        case 401:
                            showNotification("Incorrect username or password!", "error");
                            break;
                        case 404:
                            showNotification("User not found!", "error");
                            break;
                        case 500:
                            showNotification("Server error! Please try again later!", "error");
                            break;
                        default:
                            showNotification(data.message || "Login failed! Please try again!", "error");
                            break;
                    }
                }
            }
        } catch (error) {
            console.error("Error during login:", error);
            showNotification("There was an error connecting to API! Contact Support!", "error");
        } finally {
            stopLoading();
        }
    };

    const handleFirstSetup = async () => {
        try {
            if (setupStep === 1) {
                if (!newUsername || !newPassword || !confirmPassword) {
                    showNotification("All fields are required.", 'info');
                    return;
                }

                if (newPassword !== confirmPassword) {
                    showNotification("Passwords do not match.", 'info');
                    return;
                }

                await updateSuperAdminCredentials(newUsername, newPassword);
                setSetupStep(2);
            } else if (setupStep === 2) {
                if (!securityQuestion1 || !securityAnswer1 || !securityQuestion2 || !securityAnswer2) {
                    showNotification("All fields are required.", 'info');
                    return;
                }

                await updateSuperAdminCredentials(null, null, [
                    { question: securityQuestion1, answer: securityAnswer1 },
                    { question: securityQuestion2, answer: securityAnswer2 },
                ]);

                showNotification("Super Admin setup completed!", 'success');
                navigate("/");
            }
        } catch (error) {
            console.error("Error during setup:", error);
            showNotification("An error occurred during setup. Please try again.", 'error');
        }
    };

    const toggleForgotPasswordModal = () => {
        setIsForgotPasswordModalOpen(!isForgotPasswordModalOpen);
    };

    const renderSetupFormStep1 = () => (
        <div className="body"
             // style={{
             //     background: `url(${process.env.PUBLIC_URL}/Images/microfinance.jpg) no-repeat center center/cover`,
             // }}
        >
            <div className="login-container">
                <header className="login-header">
                    <h1>Super Admin Setup</h1>
                    <p>Change your credentials to continue</p>
                </header>
                <section className="login-form">
                    <div className="form-group-login">
                        <label htmlFor="newUsername">New Username</label>
                        <input
                            type="text"
                            id="newUsername"
                            placeholder="Enter new username"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group-login">
                        <label htmlFor="newPassword">New Password</label>
                        <div className="password-input-container">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="newPassword"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="toggle-password-visibility"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <FaEyeSlash size={18}/> : <FaEye size={18}/>}
                            </button>
                        </div>
                    </div>
                    <div className="form-group-login">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <div className="password-input-container">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                id="confirmPassword"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="toggle-password-visibility"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <FaEyeSlash size={18}/> : <FaEye size={18}/>}
                            </button>
                        </div>
                    </div>
                    <button className="login-btn" onClick={handleFirstSetup}>
                        Continue
                    </button>
                </section>
            </div>
        </div>
    );

    const renderSetupFormStep2 = () => (
        <div className="body"
             // style={{
             //     background: `url(${process.env.PUBLIC_URL}/Images/microfinance.jpg) no-repeat center center/cover`,
             // }}
        >
            <div className="login-container">
                <header className="login-header">
                    <h1>Security Questions Setup</h1>
                    <p>for resetting password or username</p>
                </header>
                <section className="login-form">
                    <div className="form-group-login">
                        <label htmlFor="securityQuestion1">Security Question 1</label>
                        <input
                            type="text"
                            id="securityQuestion1"
                            placeholder="Enter security question 1"
                            value={securityQuestion1}
                            onChange={(e) => setSecurityQuestion1(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group-login">
                        <label htmlFor="securityAnswer1">Answer 1</label>
                        <div className="password-input-container">
                            <input
                                type={showSecurityAnswer1 ? "text" : "password"}
                                id="securityAnswer1"
                                placeholder="Enter answer for question 1"
                                value={securityAnswer1}
                                onChange={(e) => setSecurityAnswer1(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="toggle-password-visibility"
                                onClick={() => setShowSecurityAnswer1(!showSecurityAnswer1)}
                            >
                                {showSecurityAnswer1 ? <FaEyeSlash size={18}/> : <FaEye size={18}/>}
                            </button>
                        </div>
                    </div>
                    <div className="form-group-login">
                        <label htmlFor="securityQuestion2">Security Question 2</label>
                        <input
                            type="text"
                            id="securityQuestion2"
                            placeholder="Enter security question 2"
                            value={securityQuestion2}
                            onChange={(e) => setSecurityQuestion2(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group-login">
                        <label htmlFor="securityAnswer2">Answer 2</label>
                        <div className="password-input-container">
                            <input
                                type={showSecurityAnswer2 ? "text" : "password"}
                                id="securityAnswer2"
                                placeholder="Enter answer for question 2"
                                value={securityAnswer2}
                                onChange={(e) => setSecurityAnswer2(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="toggle-password-visibility"
                                onClick={() => setShowSecurityAnswer2(!showSecurityAnswer2)}
                            >
                                {showSecurityAnswer2 ? <FaEyeSlash size={18}/> : <FaEye size={18}/>}
                            </button>
                        </div>
                    </div>
                    <button className="login-btn" onClick={handleFirstSetup}>
                        Complete Setup
                    </button>
                </section>
            </div>
        </div>
    );

    return isSettingUp
        ? setupStep === 1
            ? renderSetupFormStep1()
            : renderSetupFormStep2()
        : (
            <div className="body"
                 // style={{
                 //     background: `url(${process.env.PUBLIC_URL}/Images/microfinance.jpg) no-repeat center center/cover`,
                 // }}
            >
                <div className="login-container">
                    <header className="login-header">
                        <h1>Welcome Back!</h1>
                        <p>Please log in to continue</p>
                    </header>

                    <section className="login-form">
                        <form onSubmit={handleLogin}>
                            <div className="form-group-login">
                                <label htmlFor="username">Username</label>
                                <input
                                    type="text"
                                    title={"enter your username"}
                                    id="username"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group-login">
                                <label htmlFor="password">Password</label>
                                <div className="password-input-container">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        title={"enter password"}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password-visibility"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <FaEyeSlash size={18}/>
                                        ) : (
                                            <FaEye size={18}/>
                                        )}
                                    </button>
                                </div>
                            </div>
                            {/*<div className="form-group-login remember-me">*/}
                            {/*    <label htmlFor="rememberMe">*/}
                            {/*        <input*/}
                            {/*            type="checkbox"*/}
                            {/*            id="rememberMe"*/}
                            {/*            checked={rememberMe}*/}
                            {/*            onChange={(e) => setRememberMe(e.target.checked)}*/}
                            {/*        />*/}
                            {/*        Remember Me*/}
                            {/*    </label>*/}
                            {/*</div>*/}

                            <button type="submit" className="login-btn">
                                Login
                            </button>
                        </form>
                        {isBaseURLChanged && (
                            <button
                                onClick={handleResetBaseURL}
                                style={{
                                    display: 'block',
                                    margin: '20px auto',
                                    padding: '10px 20px',
                                    textAlign: 'center',
                                    fontSize: '16px',
                                    borderRadius: '20px',
                                    border: 'none',
                                    backgroundColor: '#d36565',
                                    color: '#fff',
                                    cursor: 'pointer',
                                }}
                            >
                                Reset Base URL
                            </button>
                        )}

                        <p className="forgot-password-link" onClick={toggleForgotPasswordModal}>
                            Forgot Password?
                        </p>
                    </section>
                </div>
                {isForgotPasswordModalOpen && (
                    <div className="forgot-password-modal">
                        <div className="forgot-password-modal-content">
                            <h2 className="forgot-password-title">Reset Password(Coming Soon!)</h2>
                            <p className="forgot-password-instructions">
                                Enter your email address below, and we will send you a link to reset your password.
                            </p>
                            <input
                                type="email"
                                className="forgot-password-input"
                                placeholder="Enter your email address"
                                disabled
                            />
                            <div className="forgot-password-actions">
                                <button
                                    className="forgot-password-cancel"
                                    onClick={toggleForgotPasswordModal}
                                >
                                    Cancel
                                </button>
                                {/*<button className="forgot-password-submit">Submit</button>*/}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
};

export default memo(Login);
