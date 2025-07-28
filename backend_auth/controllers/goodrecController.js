const axios = require('axios');
const https = require('https');

// SAP OData Config (Ensure these are set in your .env file)
const SAP_BASE_URL = process.env.SAP_BASE_URL; // e.g., http://azktlds5cp.kcloud.com:8000
const SAP_SERVICE = '/sap/opu/odata/SAP/ZMM_VENDOR_ODATA_PORTAL_SRV';
const SAP_CREDS = {
  username: process.env.AUTH_USER,
  password: process.env.AUTH_PASS
};

// SSL Agent for self-signed certificates or development environments
const sapAgent = new https.Agent({ rejectUnauthorized: false });

/**
 * Helper function to normalize a vendor ID string by removing leading zeros.
 * This ensures '0000100000' and '100000' both become '100000'.
 * Handles cases where the input might not be a valid numeric string gracefully.
 * @param {string} vendorId The input vendor ID string.
 * @returns {string} The normalized vendor ID string (e.g., '100000').
 */
function normalizeVendorId(vendorId) {
  if (typeof vendorId !== 'string' || vendorId === null || vendorId === undefined) {
    return String(vendorId);
  }
  try {
    const num = BigInt(vendorId);
    return String(num); // Converts '0000100000' to '100000'
  } catch (e) {
    return vendorId;
  }
}

/**
 * Helper function to pad a normalized vendor ID with leading zeros if needed,
 * to match SAP's expected format (e.g., '100000' -> '0000100000').
 * @param {string} normalizedVendorId The normalized vendor ID (e.g., '100000').
 * @param {number} desiredLength The total desired length including leading zeros.
 * @returns {string} The padded vendor ID.
 */
function padVendorIdForSAP(normalizedVendorId, desiredLength = 10) {
    if (typeof normalizedVendorId !== 'string') {
        return String(normalizedVendorId);
    }
    // Ensure it's treated as a number string for padding
    const numericPart = normalizedVendorId.replace(/^0+/, ''); // Remove any existing leading zeros first
    return numericPart.padStart(desiredLength, '0');
}


/**
 * Fetches Goods Receipts based on a specific vendor ID (lifnr).
 */
exports.getGoodsReceiptsByLifnr = async (req, res) => {
  const { lifnr } = req.query; // Get lifnr from query parameters
  console.log(`[NodeJS] Received request for lifnr (raw): '${lifnr}'`);

  const normalizedLifnr = normalizeVendorId(lifnr); // Normalize for internal check: '100000'
  console.log(`[NodeJS] Normalized lifnr for internal check: '${normalizedLifnr}'`);

  // Define the REQUIRED normalized vendor ID for the INTERNAL access check.
  const REQUIRED_VENDOR_ID_NORMALIZED = '100000'; // Still '100000' for internal validation

  // Perform the access check using the normalized ID
  if (normalizedLifnr !== REQUIRED_VENDOR_ID_NORMALIZED) {
    console.log(`[NodeJS] Access denied: Normalized lifnr '${normalizedLifnr}' does NOT match required '${REQUIRED_VENDOR_ID_NORMALIZED}'.`);
    return res.status(404).json({ message: 'SAP data not found for this vendor ID. Access denied.' });
  }

  // --- CRITICAL CHANGE HERE ---
  // Pad the normalized lifnr to match SAP's expected format for the filter.
  // Based on your direct Postman test, SAP requires '0000100000'.
  const lifnrForSapFilter = padVendorIdForSAP(normalizedLifnr, 10); // Pad '100000' to '0000100000'
  console.log(`[NodeJS] Lifnr used for SAP filter (padded): '${lifnrForSapFilter}'`);


  // Construct the SAP OData URL with a filter for the *padded* lifnr.
  const goodsUrl = `${SAP_BASE_URL}${SAP_SERVICE}/VEN_GOODSRECSet?$filter=Lifnr eq '${lifnrForSapFilter}'&$format=json`;
  console.log(`[NodeJS] Constructed SAP OData URL: ${goodsUrl}`);

  try {
    const response = await axios.get(goodsUrl, {
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${SAP_CREDS.username}:${SAP_CREDS.password}`).toString('base64'),
        Accept: 'application/json'
      },
      httpsAgent: sapAgent // Use the custom agent for SSL if needed
    });

    // Debugging logs remain
    console.log('[NodeJS] Raw response from SAP (status, headers, data.d):', {
        status: response.status,
        headers: response.headers,
        data_d_keys: response.data.d ? Object.keys(response.data.d) : 'N/A',
        data_d_results_exists: !!response.data.d?.results,
        // raw_data: response.data // Uncomment this to see the full raw data for debugging
    });

    const goodsReceipts = response.data.d?.results || [];
    console.log(`[NodeJS] SAP response received. Number of goods receipts: ${goodsReceipts.length}`);

    if (goodsReceipts.length > 0) {
      console.log(`[NodeJS] ✅ Successfully fetched goods receipts for lifnr: ${lifnrForSapFilter}`);
      res.json(goodsReceipts); // Send the fetched data back as JSON
    } else {
      console.log(`[NodeJS] ℹ️ No goods receipts found in SAP for lifnr: ${lifnrForSapFilter}. Returning 404.`);
      res.status(404).json({ message: 'No goods receipts found for the specified vendor ID.' });
    }
  } catch (error) {
    console.error(`[NodeJS] ❌ SAP Fetch Error for lifnr '${lifnr}':`, {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
    });
    res.status(500).json({ error: 'Failed to fetch goods receipts from SAP due to an internal server error.' });
  }
};
