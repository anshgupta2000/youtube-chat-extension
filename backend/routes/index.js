const express = require('express');
const router = express.Router();

const captionsRouter = require('./captions');
const usersRouter = require('./users'); // Placeholder for user-related routes

router.use('/captions', captionsRouter);
router.use('/users', usersRouter); // Placeholder

module.exports = router;
