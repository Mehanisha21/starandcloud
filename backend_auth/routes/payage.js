const express = require('express');
const router = express.Router();
const payageController = require('../controllers/payageController');

router.get('/aging/:Lifnr', payageController.getPayageByVendor);

module.exports = router;