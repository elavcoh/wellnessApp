/**
 * routes/analyzeMealText.js
 *
 * Purpose: Handles POST /api/analyze-meal-text - takes a typed meal
 * description from the app and returns the AI's food/calorie/protein
 * estimate, in the same format as the photo route (routes/analyzeMeal.js).
 * Related to: called by src/services/aiService.js on the phone.
 */

const express = require('express');
const { analyzeMealDescription } = require('../services/openaiClient');

// Mounted at "/api/analyze-meal-text" in server.js - same router pattern
// as routes/analyzeMeal.js.
const router = express.Router();

// Long enough for a detailed meal ("200g grilled chicken, 1 cup rice, salad
// with olive oil..."), short enough to stop someone pasting an essay.
const MAX_DESCRIPTION_LENGTH = 500;

router.post('/', async (req, res) => {
  const { description } = req.body;
  const trimmed = typeof description === 'string' ? description.trim() : '';

  if (!trimmed) {
    return res.status(400).json({ error: 'description is required' });
  }
  if (trimmed.length > MAX_DESCRIPTION_LENGTH) {
    return res.status(400).json({ error: 'description is too long' });
  }

  // Only the length is logged - never the text itself.
  console.log('Meal text analysis request:', { descriptionLength: trimmed.length });

  try {
    const result = await analyzeMealDescription(trimmed);
    res.json(result);
  } catch (error) {
    // Same as the photo route: log the real reason here, send the phone a
    // generic message.
    console.error('Meal text analysis failed:', error.message);
    res.status(500).json({ error: 'Meal text analysis failed' });
  }
});

module.exports = router;
