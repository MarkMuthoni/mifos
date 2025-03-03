let API_CONFIG = {
    baseURL: null,
    tenantId: null,
    proxy: 'https://proxy-omega-lac.vercel.app'
};

export const loadConfig = async () => {
    try {
        const cacheBuster = `?t=${new Date().getTime()}`;
        const response = await fetch(`${process.env.PUBLIC_URL}/config.json${cacheBuster}`, {
            cache: 'no-store',
        });

        if (response.ok) {
            const config = await response.json();

            const customBaseURL = localStorage.getItem('customBaseURL');
            const customTenantId = localStorage.getItem('customTenantId');

            API_CONFIG.baseURL = customBaseURL || config.baseURL || API_CONFIG.baseURL;
            API_CONFIG.tenantId = customTenantId || config.tenantId || API_CONFIG.tenantId;
        } else {
            console.error('Failed to load configuration file:', response.statusText);
        }
    } catch (error) {
        console.error('Error loading config file:', error);
    }
};

export { API_CONFIG };
