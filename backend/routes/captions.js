const express = require('express');
const { fetchSummary } = require('../controllers/captionsController');
const router = express.Router();

router.get('/', fetchSummary);

module.exports = router;

