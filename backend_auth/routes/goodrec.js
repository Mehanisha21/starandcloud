const express = require('express');
const router = express.Router();

// Import the controller
const goodrecController = require('../controllers/goodrecController');

// Route: GET goods receipts filtered by lifnr
// The client should call this route with a query parameter, e.g., /api/goods-receipt?lifnr=0000100000
router.get('/goods-receipt', goodrecController.getGoodsReceiptsByLifnr);

module.exports = router;
