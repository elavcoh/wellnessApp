/**
 * server.js
 *
 * Purpose: Starts the local Express server. This is the only place the
 * OpenAI API key is loaded (from .env) - the mobile app never sees it.
 * Related to: called by "npm run start" in the backend/ folder. Mounts the
 * routes defined in routes/.
 */

// This line MUST run before anything that needs process.env.OPENAI_API_KEY
// (i.e. before requiring the routes below, since they eventually require
// openaiClient.js). It reads backend/.env and copies its values into
// process.env, which is just a plain object of environment variables
// available to any Node.js program.
require('dotenv').config();

// "express" is the web framework - it turns raw HTTP requests into simple
// JavaScript function calls (see app.get/app.use below).
const express = require('express');
// "cors" (Cross-Origin Resource Sharing) lets this server accept requests
// from a different origin than itself - not strictly required for the
// iPhone app itself (React Native's fetch doesn't enforce CORS the way a
// browser does), but harmless to keep in case this API is ever tested from
// a browser or a tool like Postman.
const cors = require('cors');

// Each of these is one Express "router" - a small file that defines what
// happens for requests to one specific URL path (see routes/ folder).
const analyzeMealRoute = require('./routes/analyzeMeal');
const wellnessAdviceRoute = require('./routes/wellnessAdvice');

const app = express();
const PORT = process.env.PORT || 3000;

// "app.use" registers middleware - code that runs on EVERY request, before
// it reaches any specific route below.
app.use(cors());
// express.json() automatically parses an incoming request's JSON body into
// a plain JS object (req.body) - without this, req.body would be undefined.
// Meal photos arrive as base64 JSON, which is larger than plain text - default 100kb limit is too small.
app.use(express.json({ limit: '10mb' }));

// A simple "is this server alive?" endpoint - the mobile app's
// backendService.js calls this for the debug "Test Backend Connection" button.
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Wellness backend is running',
  });
});

// Everything under /api/analyze-meal is handled by analyzeMealRoute, and
// everything under /api/wellness-advice by wellnessAdviceRoute - Express
// forwards the request to whichever router's path matches.
app.use('/api/analyze-meal', analyzeMealRoute);
app.use('/api/wellness-advice', wellnessAdviceRoute);

// Starts the server listening for real network connections on PORT (3000
// by default). Nothing above this line actually starts serving requests -
// this is the line that makes the server "live".
app.listen(PORT, () => {
  console.log(`Wellness backend listening on port ${PORT}`);
});
