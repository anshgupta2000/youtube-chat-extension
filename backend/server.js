
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const captionsRouter = require('./routes/captions'); // Assuming this file exports the router handling '/summary'

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

