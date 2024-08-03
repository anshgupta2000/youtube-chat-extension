const express = require('express');
const router = express.Router();
const { getCaptions } = require('../controllers/captionsController');
const { fetchSummary } = require('../controllers/captionsController');

router.get('/', fetchSummary);
router.get('/captions', getCaptions);

module.exports = router;

