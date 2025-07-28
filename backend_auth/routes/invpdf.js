const express = require('express');
const router = express.Router();
const invpdfController = require('../controllers/invpdfController');

// Route: /api/invoicepdf/:lifnr/:belnr
router.get('/invoicepdf/:lifnr/:belnr', invpdfController.getInvoicePdf);

module.exports = router;
