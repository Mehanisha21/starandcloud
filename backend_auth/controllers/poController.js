// backend/controllers/poController.js
const axios = require('axios');
const https = require('https');

// SAP OData Config
// It's good practice to get these from environment variables
const SAP_BASE_URL = process.env.SAP_BASE_URL;
const SAP_SERVICE = '/sap/opu/odata/SAP/ZMM_VENDOR_ODATA_PORTAL_SRV';
const SAP_CREDS = {
    username: process.env.AUTH_USER,
    password: process.env.AUTH_PASS
};

// SSL Agent for self-signed certificates (optional)
// Set rejectUnauthorized to false ONLY for development/testing with self-signed certs.
// In production, you should set this to true and configure trusted certificates.
const sapAgent = new https.Agent({ rejectUnauthorized: false });

/**
 * Controller function to fetch Purchase Orders for a specific vendor from SAP.
 * The vendor ID (Lifnr) is expected to be passed as a URL parameter.
 * This function is designed to return data corresponding to the requested Lifnr.
 */
exports.getPOByVendor = async (req, res) => {
    console.log('[PO Controller] getPOByVendor function entered.'); // Log for tracing

    // Extract the Vendor ID (Lifnr) from the request parameters.
    // This 'Lifnr' should come from the frontend, corresponding to the logged-in user.
    const Lifnr = req.params.Lifnr;

    // Validate that Lifnr is provided.
    if (!Lifnr) {
        console.error('[PO Controller] Error: Lifnr is required for getPOByVendor');
        return res.status(400).json({ success: false, message: 'Vendor ID (Lifnr) is required.' });
    }

    // Construct the SAP OData URL with the filter for the specific vendor ID.
    // Ensure that 'Lifnr' in the filter matches the SAP OData entity property name in SAP.
    const poUrl = `${SAP_BASE_URL}${SAP_SERVICE}/VEN_POSet?$filter=Lifnr eq '${Lifnr}'&$format=json`;
    console.log(`[PO Controller] Attempting to fetch SAP POs for Lifnr: ${Lifnr}`);
    console.log('[PO Controller] SAP PO URL:', poUrl);

    try {
        const response = await axios.get(poUrl, {
            headers: {
                Authorization:
                    'Basic ' + Buffer.from(`${SAP_CREDS.username}:${SAP_CREDS.password}`).toString('base64'),
                Accept: 'application/json'
            },
            httpsAgent: sapAgent // Use the custom agent for SSL if needed
        });

        console.log('[PO Controller] Received response from SAP.'); // Log for successful SAP call
        // console.log('[PO Controller] Raw SAP Response Data:', JSON.stringify(response.data, null, 2)); // Uncomment for verbose debugging

        // Check if SAP response contains data and results array
        if (response.data && response.data.d && Array.isArray(response.data.d.results)) {
            const purchaseOrders = response.data.d.results;
            console.log(`✅ [PO Controller] Successfully fetched ${purchaseOrders.length} POs for Lifnr: ${Lifnr}`);
            // Send the filtered purchase orders back to the frontend
            res.json({ success: true, data: purchaseOrders, message: `PO data for ${Lifnr} retrieved.` });
        } else {
            // If SAP returns a 200 OK but with no results or unexpected format
            console.warn(`[PO Controller] SAP returned no results or unexpected format for Lifnr: ${Lifnr}`, response.data);
            res.status(200).json({ success: true, data: [], message: `No PO data found for ${Lifnr}.` });
        }

    } catch (error) {
        // Detailed error logging
        if (error.response) {
            // Error from SAP HTTP response (e.g., 401, 404, 500 from SAP)
            console.error('[PO Controller] SAP responded with error (HTTP Status):', error.response.status);
            console.error('[PO Controller] SAP Error Response Data:', JSON.stringify(error.response.data, null, 2));
            // Attempt to send a more specific error message from SAP if available
            const sapErrorMessage = error.response.data?.error?.message?.value || 'SAP returned an error.';
            res.status(error.response.status).json({ success: false, message: `SAP Error: ${sapErrorMessage}` });
        } else if (error.request) {
            // Request made but no response received (e.g., network issue, SAP server down, firewall)
            console.error('[PO Controller] No response received from SAP (network/timeout issue):', error.request);
            res.status(500).json({ success: false, message: 'Network error: No response from SAP. Please check SAP server status or network connectivity.' });
        } else {
            // Error setting up the request (e.g., invalid URL, Axios configuration error, coding mistake)
            console.error('[PO Controller] Error setting up Axios request (code issue):', error.message);
            res.status(500).json({ success: false, message: `Internal server error: ${error.message}` });
        }
    }
};