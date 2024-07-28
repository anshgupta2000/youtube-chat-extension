const express = require('express');
const router = express.Router();

const captionsRouter = require('./captions');

router.use('/captions', captionsRouter);

module.exports = router;
