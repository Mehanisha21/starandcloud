const axios = require('axios');
const https = require('https');
require('dotenv').config();

const SAP_BASE_URL = process.env.SAP_BASE_URL;
const SAP_SERVICE = '/sap/opu/odata/SAP/ZMM_VENDOR_ODATA_PORTAL_SRV';
const SAP_CREDS = {
  username: process.env.AUTH_USER,
  password: process.env.AUTH_PASS
};

const sapAgent = new https.Agent({ rejectUnauthorized: false });

exports.getAllCDMemos = async (req, res) => {
  const url = `${SAP_BASE_URL}${SAP_SERVICE}/ZVEN_CDMEMOSet?$format=json`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${SAP_CREDS.username}:${SAP_CREDS.password}`).toString('base64'),
        Accept: 'application/json'
      },
      httpsAgent: sapAgent
    });

    const results = response.data?.d?.results || [];
    res.status(200).json(results);
  } catch (error) {
    console.error('SAP Fetch Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch data from SAP' });
  }
};

// Optional: If you're using getCDMemoByVendor
exports.getCDMemoByVendor = async (req, res) => {
  const lifnr = req.params.lifnr;
  const url = `${SAP_BASE_URL}${SAP_SERVICE}/ZVEN_CDMEMOSet?$filter=Lifnr eq '${lifnr}'&$format=json`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${SAP_CREDS.username}:${SAP_CREDS.password}`).toString('base64'),
        Accept: 'application/json'
      },
      httpsAgent: sapAgent
    });

    const results = response.data?.d?.results || [];
    res.status(200).json(results);
  } catch (error) {
    console.error('SAP Fetch Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch data from SAP' });
  }
};
