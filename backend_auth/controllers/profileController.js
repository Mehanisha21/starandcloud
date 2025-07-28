// controllers/profileController.js
require('dotenv').config();
const axios = require('axios');
const https = require('https');

const SAP_BASE_URL = process.env.SAP_BASE_URL;
const SAP_SERVICE = '/sap/opu/odata/SAP/ZMM_VENDOR_ODATA_PORTAL_SRV';
const SAP_CREDS = {
  username: process.env.AUTH_USER,
  password: process.env.AUTH_PASS
};

const sapAgent = new https.Agent({ rejectUnauthorized: false });

exports.getVendorProfile = async (req, res) => {
  const { vendorId } = req.params;

  if (!vendorId) {
    return res.status(400).json({ success: false, message: 'vendorId is required' });
  }

  const profileUrl = `${SAP_BASE_URL}${SAP_SERVICE}/ZVEN_PROFILESet(VendorId='${vendorId}')?$format=json`;

  console.log('🔍 SAP Profile URL:', profileUrl);

  try {
    const response = await axios.get(profileUrl, {
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${SAP_CREDS.username}:${SAP_CREDS.password}`).toString('base64'),
        Accept: 'application/json'
      },
      httpsAgent: sapAgent
    });

    const vendorData = response.data?.d;
    res.json({
      success: true,
      data: vendorData
    });

  } catch (error) {
    console.error('❌ Error fetching vendor profile:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to fetch vendor profile',
      error: error.message,
      details: error.response?.data
    });
  }
};
