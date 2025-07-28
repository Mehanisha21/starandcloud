// backend/routes/po.js
const express = require('express');
const router = express.Router();
// IMPORTANT: This path must EXACTLY match your controller file name: poController.js
const poController = require('../controllers/poController'); // Corrected import path

// Route to get Purchase Orders for a specific vendor
// The ':Lifnr' is a URL parameter that will capture the vendor ID from the request URL.
// This route will be handled by the getPOByVendor function in poController.js.
router.get('/purchase-orders/:Lifnr', poController.getPOByVendor);

module.exports = router;