const express = require('express');
const router = express.Router();

// Mock endpoint for captions
router.get('/', (req, res) => {
  res.json({ message: 'Captions API endpoint' });
});

module.exports = router;
