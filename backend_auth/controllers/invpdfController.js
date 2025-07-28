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

// Function for getting a list of invoices (no change needed here)
exports.getInvoicesByVendor = async (req, res) => {
    // ... (Your existing code for getting invoice list)
};

// ***************************************************************
// CORRECTED Function for getting the PDF from SAP
// ***************************************************************
exports.getInvoicePdf = async (req, res) => {
    let Lifnr = req.params.lifnr; // Vendor ID
    let Belnr = req.params.belnr; // Invoice Number (Document Number)

    if (!Lifnr || !Belnr) {
        return res.status(400).json({ success: false, message: 'Lifnr (Vendor Code) and Belnr (Invoice Number) are required' });
    }
    
    // Pad Lifnr and Belnr with leading zeros to match SAP's key format.
    Lifnr = String(Lifnr).padStart(10, '0');
    Belnr = String(Belnr).padStart(10, '0');
    
    const pdfUrl = `${SAP_BASE_URL}${SAP_SERVICE}/ZVEN_INVOICEPDFSet(Lifnr='${Lifnr}',Belnr='${Belnr}')?$format=json`;
    console.log('🔍 SAP PDF URL:', pdfUrl);

    try {
        const response = await axios.get(pdfUrl, {
            headers: {
                Authorization:
                    'Basic ' + Buffer.from(`${SAP_CREDS.username}:${SAP_CREDS.password}`).toString('base64'),
                Accept: 'application/json' 
            },
            httpsAgent: sapAgent,
        });

        // The key fix is to decode the Base64 string from the SAP response.
        // Your provided output confirms this is the correct path.
        if (response.data && response.data.d && response.data.d.XPdf) {
            const base64PdfString = response.data.d.XPdf;

            // Decode the Base64 string to a binary Buffer
            const pdfBuffer = Buffer.from(base64PdfString, 'base64');
            
            // Set the appropriate headers for PDF download.
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="invoice_${Belnr}.pdf"`);

            // Send the raw binary Buffer directly to the client.
            res.status(200).send(pdfBuffer);
            console.log(`✅ PDF for invoice ${Belnr} sent successfully.`);
        } else {
            console.error('SAP PDF response did not contain expected XPdf field:', JSON.stringify(response.data, null, 2));
            res.status(500).json({ 
                error: 'Failed to retrieve PDF data',
                details: 'XPdf field was missing in the SAP response.'
            });
        }

    } catch (error) {
        // ... (Error handling remains the same as it correctly captured the "Invalid key predicate" error)
        if (error.response) {
            console.error('SAP responded with error for PDF:', error.response.status, error.response.statusText);
            if (error.response.data) {
                try {
                    const errorDetails = error.response.data.error && error.response.data.error.message ? error.response.data.error.message.value : JSON.stringify(error.response.data);
                    console.error('SAP PDF Error data:', errorDetails);
                    res.status(error.response.status).json({
                        error: 'Failed to retrieve PDF from SAP',
                        details: errorDetails
                    });
                } catch (parseError) {
                    console.error('Could not parse SAP error response:', error.response.data);
                    res.status(error.response.status).send('Failed to retrieve PDF from SAP: ' + error.response.statusText);
                }
            } else {
                res.status(error.response.status).send('Failed to retrieve PDF from SAP: ' + error.response.statusText);
            }
        } else if (error.request) {
            console.error('No response received from SAP for PDF:', error.request);
            res.status(500).json({ error: 'No response received from SAP when requesting PDF' });
        } else {
            console.error('Error setting up PDF request:', error.message);
            res.status(500).json({ error: 'Failed to set up PDF request' });
        }
    }
};