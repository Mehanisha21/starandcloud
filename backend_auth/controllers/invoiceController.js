const axios = require('axios');
const https = require('https');

// SAP OData Config
const SAP_BASE_URL = process.env.SAP_BASE_URL;
const SAP_SERVICE = '/sap/opu/odata/SAP/ZMM_VENDOR_ODATA_PORTAL_SRV';
const SAP_CREDS = {
  username: process.env.AUTH_USER,
  password: process.env.AUTH_PASS
};

// Allow self-signed SSL certs (if applicable)
const sapAgent = new https.Agent({ rejectUnauthorized: false });

exports.getInvoicesByVendor = async (req, res) => {
  const Lifnr = req.params.Lifnr;

  if (!Lifnr) {
    return res.status(400).json({ success: false, message: 'Lifnr (Vendor Code) is required' });
  }

  const invoiceUrl = `${SAP_BASE_URL}${SAP_SERVICE}/VEN_INVOICESet?$filter=Lifnr eq '${Lifnr}'&$format=json`;
  console.log('🔍 SAP Invoice URL:', invoiceUrl);

  try {
    const response = await axios.get(invoiceUrl, {
      headers: {
        Authorization:
          'Basic ' + Buffer.from(`${SAP_CREDS.username}:${SAP_CREDS.password}`).toString('base64'),
        Accept: 'application/json'
      },
      httpsAgent: sapAgent
    });

    const invoices = response.data.d.results;
    res.json(invoices);
  } catch (error) {
    if (error.response) {
      console.error('SAP responded with error:', error.response.status, error.response.statusText);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received from SAP:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }

    res.status(500).json({ error: 'Failed to retrieve invoices from SAP' });
  }
};
