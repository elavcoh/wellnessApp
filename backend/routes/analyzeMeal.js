/**
 * routes/analyzeMeal.js
 *
 * Purpose: Handles POST /api/analyze-meal - takes a base64 photo from the
 * app and returns the AI's food/calorie/protein analysis.
 * Related to: called by src/services/aiService.js on the phone.
 */

const express = require('express');
const { analyzeMealImage } = require('../services/openaiClient');

// A "router" groups related routes together. This file only defines what
// happens for POST requests to "/" - but since server.js mounts it at
// "/api/analyze-meal" (app.use('/api/analyze-meal', analyzeMealRoute)),
// the real URL the phone calls is POST /api/analyze-meal.
const router = express.Router();

// Validates the request, forwards the image to OpenAI, and logs basic
// (non-sensitive) debug info - never the image bytes or the API key.
// "req" is the incoming request (what the phone sent), "res" is how we
// send a response back to it.
router.post('/', async (req, res) => {
  // req.body is the parsed JSON the phone sent - see express.json() in
  // server.js, which is what makes this destructuring possible.
  const { imageBase64, mimeType } = req.body;

  if (!imageBase64) {
    // 400 = "Bad Request" - the client (the phone app) sent something
    // invalid, so we stop here instead of calling OpenAI with nothing.
    return res.status(400).json({ error: 'imageBase64 is required' });
  }

  // The mobile app should send raw base64, not a data URL - but if one
  // slips through (e.g. future bug), strip it instead of sending OpenAI a
  // double-encoded string.
  const hasDataUrlPrefix = imageBase64.startsWith('data:');
  const rawBase64 = hasDataUrlPrefix ? imageBase64.split(',')[1] : imageBase64;
  const resolvedMimeType = mimeType || 'image/jpeg';

  console.log('Meal analysis request:', {
    mimeType: resolvedMimeType,
    base64Length: rawBase64.length,
    hadDataUrlPrefix: hasDataUrlPrefix,
  });

  if (!rawBase64) {
    return res.status(400).json({ error: 'imageBase64 is empty' });
  }

  try {
    const result = await analyzeMealImage(rawBase64, resolvedMimeType);
    // res.json() sends the result back to the phone as a JSON HTTP
    // response - this is what aiService.analyzeMealPhoto() on the phone
    // receives and parses.
    res.json(result);
  } catch (error) {
    // Anything could fail here - no internet, OpenAI's servers down, an
    // invalid API key, etc. We log the real reason on the Mac (for
    // debugging) but send the phone a generic message - never leak
    // internal error details or the API key to the client.
    console.error('Meal analysis failed:', error.message);
    // 500 = "Internal Server Error" - something went wrong on our side,
    // not because of anything wrong with the request itself.
    res.status(500).json({ error: 'Meal analysis failed' });
  }
});

module.exports = router;
