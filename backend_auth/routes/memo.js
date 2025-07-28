const express = require('express');
const router = express.Router();  // ✅ Make sure this is from 'express', not from 'router'

const {
  getAllCDMemos,
  getCDMemoByVendor
} = require('../controllers/cdmemoController');  // ✅ Ensure this path is correct and functions exist

// Route to get all CD memos
router.get('/', getAllCDMemos);

// Route to get CD memos by vendor ID
router.get('/:lifnr', getCDMemoByVendor);

module.exports = router;
