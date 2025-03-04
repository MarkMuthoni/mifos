import React, {createContext, useState, useEffect, useRef} from 'react';
import bcrypt from "bcryptjs";
import {API_CONFIG, loadConfig} from "../config";
import CryptoJS from "crypto-js";

export const AuthContext = createContext();

const AUTH_DURATION_SHORT = 3 * 60 * 60 * 1000;
const AUTH_DURATION_LONG = 10 * 24 * 60 * 60 * 1000;
const DEFAULT_TIMEOUT = 5 * 60 * 1000;
const ALL_COMPONENTS = {
    "accounting-frequent-postings": true,
    "accounting-journal-entries": true,
    "accounting-closing-entries": true,
    "accounting-chart-of-accounts": true,
    "accounting-financial-activity-mappings": true,
    "accounting-rules": true,
    "accounting-accruals": true,
    "accounting-provisioning-entries": true,
    "sidebar-dashboard": true,
    "sidebar-clients": true,
    "sidebar-groups": true,
    "sidebar-centers": true,
    "sidebar-reports": true,
    "sidebar-reports-all": true,
    "sidebar-reports-clients": true,
    "sidebar-reports-loans": true,
    "sidebar-reports-savings": true,
    "sidebar-reports-funds": true,
    "sidebar-reports-accounting": true,
    "sidebar-reports-XBRL": true,
    "sidebar-accounting": true,
    "sidebar-accounting-frequent-postings": true,
    "sidebar-accounting-closing-entries": true,
    "sidebar-accounting-charts-of-accounts": true,
    "sidebar-accounting-financial-activity-mappings": true,
    "sidebar-accounting-rules": true,
    "sidebar-accounting-accruals": true,
    "sidebar-accounting-provisioning-entries": true,
    "sidebar-admin": true,
    "sidebar-admin-users": true,
    "sidebar-admin-organization": true,
    "sidebar-admin-products": true,
    "sidebar-admin-templates": true,
    "sidebar-admin-system": true,
    "admin-system-manage-data-tables": true,
    "admin-system-manage-codes": true,
    "admin-system-manage-roles-and-permissions": true,
    "admin-system-configure-maker-and-checker-tasks": true,
    "admin-system-manage-hooks": true,
    "admin-system-entity-to-entity-mapping": true,
    "admin-system-manage-surveys": true,
    "admin-system-manage-external-events": true,
    "admin-system-audit-trails": true,
    "admin-system-manage-reports": true,
    "admin-system-scheduler-jobs": true,
    "admin-system-configurations": true,
    "admin-system-account-number-preferences": true,
    "admin-system-external-services": true,
    "admin-system-two-factor": true,
    "admin-users": true,
    "admin-organization": true,
    "admin-products": true,
    "admin-templates": true,
    "admin-system": true,
    "admin-products-loan-products": true,
    "admin-products-savings-products": true,
    "admin-products-share-products": true,
    "admin-products-charges": true,
    "admin-products-collateral-management": true,
    "admin-products-delinquency-buckets": true,
    "admin-products-products-mix": true,
    "admin-products-fixed-deposit-products": true,
    "admin-products-recurring-deposit-products": true,
    "admin-products-manage-tax-configurations": true,
    "admin-products-floating-rates": true,
    "admin-organization-manage-offices": true,
    "admin-organization-manage-holidays": true,
    "admin-organization-manage-employees": true,
    "admin-organization-standing-instructions-history": true,
    "admin-organization-manage-investors": true,
    "admin-organization-fund-mapping": true,
    "admin-organization-password-preferences": true,
    "admin-organization-loan-provisioning-criteria": true,
    "admin-organization-entity-data-table-checks": true,
    "admin-organization-adhocquery": true,
    "admin-organization-currency-configuration": true,
    "admin-organization-manage-funds": true,
    "admin-organization-bulk-loan-reassignment": true,
    "admin-organization-teller/cashier-management": true,
    "admin-organization-working-days": true,
    "admin-organization-payment-types": true,
    "admin-organization-sms-campaigns": true,
    "admin-organization-bulk-imports": true,
    "pentaho-reports": true,
    "table-reports": true,
};
const SECRET_KEY = "h387gfu7y8f783g873co37gco3f8od3b3cfc8on6wt1r3fo8w6t4co8xt4rf2w4xo4rtx3i4d6fw3o4fo4wx3fc";

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [baseURL, setBaseURL] = useState(null);
    const [tenantId, setTenantId] = useState(null);
    const [authInitialized, setAuthInitialized] = useState(false);
    const [isBaseURLChanged, setIsBaseURLChanged] = useState(false);
    const [redirectToLogin, setRedirectToLogin] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [inactivityTimeout, setInactivityTimeout] = useState(
        parseInt(localStorage.getItem('inactivityTimeout')) || DEFAULT_TIMEOUT
    );
    const proxyServerURL = "https://proxy-omega-lac.vercel.app";

    const initializeProxy = async () => {
        try {
            const savedBaseURL = localStorage.getItem("customBaseURL");

            if (savedBaseURL) {
                await fetch(`${proxyServerURL}/api/updateBaseURL`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ baseURL: savedBaseURL }),
                });

                setBaseURL(savedBaseURL);
            }
        } catch (error) {
            console.error("Error initializing proxy connection:", error);
        }
    };

    useEffect(() => {
        initializeProxy();
    }, []);

    const logoutTimer = useRef(null);

    const fetchNotifications = async (savedUser) => {
        if (!savedUser || !savedUser.base64EncodedAuthenticationKey) {
            // console.log("User not found or missing authentication key");
            return;
        }

        const AUTH_TOKEN = savedUser.base64EncodedAuthenticationKey;
        const headers = {
            'Authorization': `Basic ${AUTH_TOKEN}`,
            'Content-Type': 'application/json',
            'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
        };
        try {
            const response = await fetch(`${API_CONFIG.proxy}/fineract-provider/api/v1/notifications?isRead=false`, { headers });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Failed to fetch notifications (${response.status}):`, errorText);
                return;
            }

            const data = await response.json();
            setNotifications(data.pageItems || []);
            setUnreadCount(data.totalFilteredRecords || 0);
        } catch (err) {
            console.error("Error fetching notifications:", err);
        }
    };

    useEffect(() => {
        const savedUser = JSON.parse(localStorage.getItem("user"));

        if (savedUser) {
            fetchNotifications(savedUser);
            const interval = setInterval(() => fetchNotifications(savedUser), 30000);
            return () => clearInterval(interval);
        }
    }, []);

    const [superAdmin, setSuperAdmin] = useState(() => {
        const storedAdmin = JSON.parse(localStorage.getItem("superAdmin"));
        return (
            storedAdmin || {
                username: "SuperAdmin",
                password: "1234",
                securityQuestions: [],
            }
        );
    });

    const [componentVisibility, setComponentVisibility] = useState({});

    useEffect(() => {
        const savedVisibility = JSON.parse(localStorage.getItem("componentVisibility"));

        if (savedVisibility) {
            const updatedVisibility = {};

            Object.keys(savedVisibility).forEach((componentId) => {
                if (ALL_COMPONENTS.hasOwnProperty(componentId)) {
                    updatedVisibility[componentId] = savedVisibility[componentId];
                }
            });

            Object.keys(ALL_COMPONENTS).forEach((componentId) => {
                if (!updatedVisibility.hasOwnProperty(componentId)) {
                    updatedVisibility[componentId] = ALL_COMPONENTS[componentId];
                }
            });

            setComponentVisibility(updatedVisibility);
            localStorage.setItem("componentVisibility", JSON.stringify(updatedVisibility));
        } else {
            localStorage.setItem("componentVisibility", JSON.stringify(ALL_COMPONENTS));
            setComponentVisibility(ALL_COMPONENTS);
        }

        initializeAuth();
    }, []);

    useEffect(() => {
        if (componentVisibility && Object.keys(componentVisibility).length > 0) {
            localStorage.setItem("componentVisibility", JSON.stringify(componentVisibility));
        }
    }, [componentVisibility]);

    const initializeAuth = async () => {
        await loadConfig();

        const savedUser = JSON.parse(localStorage.getItem('user'));
        const savedTimestamp = localStorage.getItem('loginTimestamp');
        const customBaseURL = localStorage.getItem('customBaseURL');
        const tenantId = localStorage.getItem('tenantId');

        if (customBaseURL) {
            setBaseURL(customBaseURL);
        }
        if (tenantId) {
            setTenantId(tenantId);
        }

        if (savedUser && savedTimestamp) {
            const now = new Date().getTime();
            const authDuration = savedUser.rememberMe ? AUTH_DURATION_LONG : AUTH_DURATION_SHORT;

            if (now - savedTimestamp < authDuration) {
                setIsAuthenticated(true);
                setUser(savedUser);
                resetInactivityTimer();

                // const remainingTime = authDuration - (now - savedTimestamp);
                // setTimeout(() => {
                //     logout(true);
                // }, remainingTime);
            } else {
                localStorage.removeItem('user');
                localStorage.removeItem('loginTimestamp');
            }
        }

        setAuthInitialized(true);
    };

    useEffect(() => {
        initializeAuth();

        const activityEvents = ["mousemove", "keydown", "click", "scroll"];

        const handleActivity = () => {
            if (isAuthenticated) {
                resetInactivityTimer();
            }
        };

        activityEvents.forEach(event => window.addEventListener(event, handleActivity));

        return () => {
            activityEvents.forEach(event => window.removeEventListener(event, handleActivity));
            if (logoutTimer.current) {
                clearTimeout(logoutTimer.current);
            }
        };
    }, [isAuthenticated, inactivityTimeout]);

    const login = (userData, rememberMe) => {
        const timestamp = new Date().getTime();
        const authDuration = rememberMe ? AUTH_DURATION_LONG : AUTH_DURATION_SHORT;
        setUser({ ...userData, rememberMe });
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify({ ...userData, rememberMe }));
        localStorage.setItem('loginTimestamp', timestamp);

        setTimeout(() => {
            logout(true);
        }, authDuration);

        setRedirectToLogin(false);
        setIsBaseURLChanged(false);
    };

    const superAdminLogin = async (username, password) => {
        if (username === superAdmin.username) {
            if (!superAdmin.password.startsWith("$2")) {
                return { firstLogin: true };
            }

            const trimmedPassword = password.trim();
            const isValidPassword = await bcrypt.compare(trimmedPassword, superAdmin.password);
            if (isValidPassword) {
                const superAdminData = {
                    username: superAdmin.username,
                    userId: "1",
                    roles: ["System-Configuration-Manager"],
                    permissions: ["ALL"],
                    isSuperAdmin: true,
                    authenticated: true,
                };

                login(superAdminData, false);
                return { success: true };
            }
            return { success: false, message: "Invalid Super Admin credentials" };
        }
        return null;
    };

    const updateSuperAdminCredentials = async (username, password, securityQuestions = []) => {
        const hashedSecurityQuestions = await Promise.all(
            securityQuestions.map(async (q) => ({
                question: q.question,
                answer: await bcrypt.hash(q.answer, 10),
            }))
        );

        const updatedPassword = password
            ? (!superAdmin.password || superAdmin.password === "1234" || !password.startsWith("$2"))
                ? await bcrypt.hash(password, 10)
                : superAdmin.password
            : superAdmin.password;

        const updatedAdmin = {
            username: username || superAdmin.username,
            password: updatedPassword,
            securityQuestions: hashedSecurityQuestions.length
                ? hashedSecurityQuestions
                : superAdmin.securityQuestions,
        };

        setSuperAdmin(updatedAdmin);
        localStorage.setItem("superAdmin", JSON.stringify(updatedAdmin));
    };

    const logout = (notify = false) => {
        setUser(null);
        setIsAuthenticated(false);
        setRedirectToLogin(true);
        localStorage.removeItem('user');
        localStorage.removeItem('loginTimestamp');

        if (notify) {
            const overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
            overlay.style.zIndex = '999';

            const modal = document.createElement('div');
            modal.style.position = 'fixed';
            modal.style.top = '50%';
            modal.style.left = '50%';
            modal.style.transform = 'translate(-50%, -50%)';
            modal.style.padding = '20px';
            modal.style.backgroundColor = '#fff';
            modal.style.border = '1px solid #ccc';
            modal.style.borderRadius = '20px';
            modal.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
            modal.style.zIndex = '1000';
            modal.style.textAlign = 'center';

            const message = document.createElement('p');
            message.textContent = 'Your session has expired due to inactivity. Kindly log in again!';
            modal.appendChild(message);

            const closeButton = document.createElement('button');
            closeButton.textContent = 'Close';
            closeButton.style.marginTop = '15px';
            closeButton.style.padding = '8px 16px';
            closeButton.style.backgroundColor = '#f44336';
            closeButton.style.color = 'white';
            closeButton.style.border = 'none';
            closeButton.style.cursor = 'pointer';
            closeButton.style.borderRadius = '4px';

            closeButton.addEventListener('click', () => {
                modal.remove();
                overlay.remove();
            });

            modal.appendChild(closeButton);

            document.body.appendChild(overlay);
            document.body.appendChild(modal);
        }
    };

    const resetInactivityTimer = () => {
        if (!isAuthenticated) return;

        if (logoutTimer.current) {
            clearTimeout(logoutTimer.current);
        }
        logoutTimer.current = setTimeout(() => {
            logout(true);
        }, inactivityTimeout);
    };

    const updateInactivityTimeout = (newTimeout) => {
        if (!newTimeout || isNaN(newTimeout) || newTimeout < 5) {
            newTimeout = 5;
        }
        const timeoutMs = newTimeout * 60 * 1000;
        setInactivityTimeout(timeoutMs);
        localStorage.setItem('inactivityTimeout', timeoutMs);
        resetInactivityTimer();
    };

    // const updateBaseURL = (newURL) => {
    //     setBaseURL(newURL);
    //     localStorage.setItem('customBaseURL', newURL);
    //     setIsBaseURLChanged(true);
    //
    //     updateProxyBaseURL(newURL);
    // };

    const updateBaseURL = async (newURL) => {
        try {
            setBaseURL(newURL);
            localStorage.setItem("customBaseURL", newURL);

            const encryptedBaseURL = encryptBaseURL(newURL);

            await fetch(`${proxyServerURL}/api/updateBaseURL`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ baseURL: encryptedBaseURL }),
            });

            setIsBaseURLChanged(true);
        } catch (error) {
            console.error("Error updating proxy Base URL:", error);
        }
    };

    const updateTenantId = (newTenantId) => {
        setTenantId(newTenantId);
        localStorage.setItem('tenantId', newTenantId);
        setIsBaseURLChanged(true);
    };

    const encryptBaseURL = (baseURL) => {
        return CryptoJS.AES.encrypt(baseURL, SECRET_KEY).toString();
    }

    const updateProxyBaseURL = async () => {
        const savedBaseURL = localStorage.getItem("customBaseURL");

        if (savedBaseURL) {
            const encryptedBaseURL = encryptBaseURL(savedBaseURL);

            try {
                await fetch(`${proxyServerURL}/api/updateBaseURL`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ baseURL: encryptedBaseURL }),
                });
            } catch (error) {
                console.error("Error updating proxy Base URL:", error);
            }
        }
    };

    useEffect(() => {
        const interval = setInterval(updateProxyBaseURL, 5000); // Adjust timing as needed
        return () => clearInterval(interval);
    }, []);

    const toggleComponentVisibility = (componentId) => {
        setComponentVisibility((prevState) => ({
            ...prevState,
            [componentId]: !prevState[componentId],
        }));
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            user,
            login,
            logout,
            baseURL,
            notifications,
            unreadCount,
            updateBaseURL,
            tenantId,
            updateTenantId,
            isBaseURLChanged,
            redirectToLogin,
            authInitialized,
            superAdmin,
            superAdminLogin,
            updateSuperAdminCredentials,
            componentVisibility,
            toggleComponentVisibility,
            updateInactivityTimeout
        }}>
            {children}
        </AuthContext.Provider>
    );
};
