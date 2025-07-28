const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

// GET /api/profile/:vendorId
router.get('/profile/:vendorId', profileController.getVendorProfile);

module.exports = router;
