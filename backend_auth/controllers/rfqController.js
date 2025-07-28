// controllers/rfqController.js
require('dotenv').config();
const axios = require('axios');
const https = require('https');

// SAP configuration from .env
const SAP_BASE_URL = process.env.SAP_BASE_URL;
const SAP_SERVICE = '/sap/opu/odata/SAP/ZMM_VENDOR_ODATA_PORTAL_SRV';
const SAP_CREDS = {
  username: process.env.AUTH_USER,
  password: process.env.AUTH_PASS
};

// Disable SSL verification (only for development/test)
const sapAgent = new https.Agent({ rejectUnauthorized: false });

/**
 * GET RFQ Data by Lifnr (Vendor ID)
 * Route: GET /api/rfq/:lifnr
 */
exports.getRFQByVendor = async (req, res) => {
  const lifnr = req.params.Lifnr;

  if (!lifnr) {
    return res.status(400).json({ success: false, message: 'lifnr is required' });
  }

  const rfqUrl = `${SAP_BASE_URL}${SAP_SERVICE}/VEN_RFQSet?$filter=Lifnr eq '${lifnr}'&$format=json`;

  console.log('🔍 SAP RFQ URL:', rfqUrl);

  try {
    const response = await axios.get(rfqUrl, {
      headers: {
        Authorization:
          'Basic ' + Buffer.from(`${SAP_CREDS.username}:${SAP_CREDS.password}`).toString('base64'),
        Accept: 'application/json'
      },
      httpsAgent: sapAgent
    });

    const rfqData = response.data?.d?.results;

    res.json({
      success: true,
      data: rfqData
    });

  } catch (error) {
    console.error('❌ Error fetching RFQ data:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to fetch RFQ data',
      error: error.message,
      details: error.response?.data
    });
  }
};
