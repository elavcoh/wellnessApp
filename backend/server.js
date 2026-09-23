/**
 * server.js
 *
 * Purpose: Starts the local Express server. This is the only place the
 * OpenAI API key is loaded (from .env) - the mobile app never sees it.
 * Related to: called by "npm run start" in the backend/ folder. Mounts the
 * routes defined in routes/.
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const analyzeMealRoute = require('./routes/analyzeMeal');
const wellnessAdviceRoute = require('./routes/wellnessAdvice');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
// Meal photos arrive as base64 JSON, which is larger than plain text - default 100kb limit is too small.
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Wellness backend is running',
  });
});

app.use('/api/analyze-meal', analyzeMealRoute);
app.use('/api/wellness-advice', wellnessAdviceRoute);

app.listen(PORT, () => {
  console.log(`Wellness backend listening on port ${PORT}`);
});
