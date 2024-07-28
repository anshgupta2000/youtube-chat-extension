
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


// const express = require('express');
// const summaryRouter = require('./routes/captions');
// const mongoose = require('mongoose');
// const dotenv = require('dotenv');
// const routes = require('./routes');
// const cors = require('cors');

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5001;

// app.use(cors());
// app.use(express.json());

// app.use('/summary', summaryRouter);

// app.get('/', (req, res) => {
//   res.send('Backend is running');
// });

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });
