const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { getSubtitles } = require('youtube-caption-extractor');
const dotenv = require('dotenv');
const captionsRouter = require('./captions'); 
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Correctly mount the captionsRouter under '/summary'
app.use('/summary', captionsRouter);


app.get('/', (req, res) => {
  res.send('Backend is running');
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

