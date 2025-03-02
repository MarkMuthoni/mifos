const { createProxyMiddleware } = require('http-proxy-middleware');
const fs = require('fs');
const path = require('path');

module.exports = function (app) {
    let baseURL = null;

    try {
        const configPath = path.join(__dirname, `../public/config.json`);
        if (fs.existsSync(configPath)) {
            const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            baseURL = configData.baseURL;
        }
    } catch (error) {
        console.error("Error reading base URL from config.json:", error);
    }

    app.use('/api/getBaseURL', (req, res) => {
        res.json({ baseURL });
    });

    app.use('/api/updateBaseURL', (req, res) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                if (data.baseURL) {
                    baseURL = data.baseURL;
                    res.json({ success: true });
                } else {
                    res.status(400).json({ error: 'Invalid Base URL' });
                }
            } catch (error) {
                res.status(400).json({ error: 'Invalid JSON' });
            }
        });
    });

    if (!baseURL) {
        console.error("Proxy Error: baseURL is not set. Proxy will not work.");
        return;
    }

    app.use(
        (req, res, next) => {

            const parsedURL = new URL(baseURL);
            const domain = `${parsedURL.protocol}//${parsedURL.hostname}`;

            if (req.url.startsWith('/fineract-provider/api/v1')) {

                createProxyMiddleware({
                    target: domain,
                    changeOrigin: true,
                    secure: false,
                    onProxyReq: (proxyReq, req, res) => {
                        proxyReq.setHeader('Origin', domain);
                        proxyReq.setHeader('Referer', domain);
                    },
                    onProxyRes: (proxyRes, req, res) => {
                        proxyRes.headers['Access-Control-Allow-Origin'] = req.headers.origin || domain;
                    }
                })(req, res, next);
            } else {
                next();
            }
        }
    );
};
