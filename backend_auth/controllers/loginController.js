const axios = require('axios');
const xml2js = require('xml2js');
const https = require('https');

// Base URL for your SAP OData service, typically loaded from environment variables
const SAP_BASE_URL = process.env.SAP_BASE_URL;
// The specific OData service path for vendor portal
const SAP_SERVICE = '/sap/opu/odata/SAP/ZMM_VENDOR_ODATA_PORTAL_SRV';
// Credentials for authenticating with the SAP OData service itself (not vendor credentials)
const SAP_CREDS = {
  username: process.env.AUTH_USER,
  password: process.env.AUTH_PASS
};

// Custom HTTPS agent to bypass SSL certificate validation.
// Use with caution in production environments; primarily for development/testing.
const sapAgent = new https.Agent({ rejectUnauthorized: false });

/**
 * Handles user login by authenticating vendorId and vendorPassword against SAP.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 */
exports.loginUser = async (req, res) => {
  // Extract vendorId and vendorPassword from the request body
  const { vendorId, vendorPassword } = req.body;
  console.log('📡 POST /api/login hit');
  console.log('📥 Incoming body:', req.body);

  // Validate that both vendorId and vendorPassword are provided
  if (!vendorId || !vendorPassword) {
    return res.status(400).json({ success: false, message: 'vendorId and vendorPassword are required.' });
  }

  // Construct the SAP login URL using the provided vendorId and vendorPassword.
  // This URL targets a specific entity in the ZLOGIN_AUTHSet collection for authentication.
  const loginUrl = `${SAP_BASE_URL}${SAP_SERVICE}/ZLOGIN_AUTHSet(VendorId='${vendorId}',VendorPwd='${vendorPassword}')`;
  console.log('🔍 SAP Request URL:', loginUrl);

  try {
    console.log('🔗 Hitting SAP login URL:', loginUrl);
    // Log the SAP Basic Auth username being used for the service call.
    console.log('🛡️ Using SAP Basic Auth credentials for user:', SAP_CREDS.username);

    // Make the GET request to the SAP OData service.
    // The Authorization header uses Basic Auth for the SAP service user (not the vendor).
    // Accept: 'application/xml' requests the response in XML format.
    const sapResponse = await axios.get(loginUrl, {
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${SAP_CREDS.username}:${SAP_CREDS.password}`).toString('base64'),
        Accept: 'application/xml'
      },
      httpsAgent: sapAgent // Apply the custom HTTPS agent
    });

    const xml = sapResponse.data;
    console.log('📄 Raw SAP XML Response:', xml); // Log the raw XML response from SAP for debugging

    // Parse the XML response into a JavaScript object.
    // explicitArray: false ensures that single child elements are not wrapped in arrays.
    const parsed = await xml2js.parseStringPromise(xml, { explicitArray: false });
    console.log('🌳 Parsed SAP XML Response:', JSON.stringify(parsed, null, 2)); // Log the parsed object for detailed debugging

    // Navigate through the parsed XML to find the 'm:properties' object
    const props = parsed?.entry?.content?.['m:properties'];
    // Extract the 'd:Status' and 'd:Message' properties from SAP's response
    const sapStatus = props?.['d:Status'];
    const sapMessage = props?.['d:Message'];

    console.log(`✨ SAP Status received: '${sapStatus}'`);
    console.log(`💬 SAP Message received: '${sapMessage}'`);

    // Determine the login success based on the 'd:Status' from SAP.
    // It's assumed that 'SUCCESS' (case-insensitive) indicates a valid login.
    if (sapStatus && sapStatus.toUpperCase() === 'SUCCESS') {
      // If SAP reports success, send a success response to the client.
      return res.json({
        success: true,
        data: {
          vendorId,
          message: sapMessage || 'Login successful.' // Use SAP's message or a default success message
        }
      });
    } else {
      // If SAP status is not 'SUCCESS' or is missing, treat it as a failed login.
      // Send a 401 Unauthorized status to the client.
      return res.status(401).json({
        success: false,
        message: sapMessage || 'SAP login failed. Invalid credentials or unknown error.', // Use SAP's message or a default error
        error: `SAP Status: ${sapStatus || 'Not provided'}`, // Include the SAP status for debugging
        details: props // Include all parsed properties for further investigation
      });
    }

  } catch (error) {
    console.error('❌ An error occurred during the SAP request:', error.message);
    // Log detailed error information from Axios to help diagnose network or SAP server issues.
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('🔍 SAP Response Status:', error.response.status);
      console.error('🔍 SAP Response Headers:', error.response.headers);
      console.error('🔍 SAP Response Data:', error.response.data); // This is often the most useful part
    } else if (error.request) {
      // The request was made but no response was received (e.g., network error)
      console.error('🔍 No response received from SAP. Request details:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('🔍 Error setting up SAP request:', error.config);
    }

    // Send a comprehensive error response to the client.
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'An unexpected error occurred during SAP login.',
      error: error.message,
      details: error.response?.data || 'No specific response data from SAP.'
    });
  }
};
