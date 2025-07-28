const express = require('express');
const router = express.Router();
const { getInvoicesByVendor } = require('../controllers/invoiceController');

// Route: /api/invoice/:Lifnr
router.get('/invoice/:Lifnr', getInvoicesByVendor);

module.exports = router;