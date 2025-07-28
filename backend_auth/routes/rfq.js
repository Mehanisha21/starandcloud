const express = require('express');
const router = express.Router();
const rfqController = require('../controllers/rfqController');

// @route   GET /rfq/:VendorId
// @desc    Fetch RFQ data for a specific Vendor ID
// @access  Public
router.get('/rfq/:Lifnr', rfqController.getRFQByVendor);

module.exports = router;