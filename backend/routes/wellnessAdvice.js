/**
 * routes/wellnessAdvice.js
 *
 * Purpose: Handles POST /api/wellness-advice - takes a question and the
 * app's wellness context, and returns the AI Coach's structured answer.
 * Related to: called by src/services/aiService.js on the phone.
 */

const express = require('express');
const { getWellnessAdvice } = require('../services/openaiClient');

// Mounted at "/api/wellness-advice" in server.js - same router pattern as
// routes/analyzeMeal.js.
const router = express.Router();

router.post('/', async (req, res) => {
  // question: plain text typed or tapped by the user.
  // context: the whole object built by wellnessContextBuilder.js on the
  // phone (profile, today's meals/steps/workout/breathing, targets).
  const { question, context } = req.body;

  if (!question || !context) {
    return res.status(400).json({ error: 'question and context are required' });
  }

  try {
    // All the actual AI logic - the prompt, the domain restriction, the
    // structured-output schema - lives in openaiClient.js, not here. This
    // route's only job is: validate the request, call that function, and
    // turn the result into an HTTP response (or an error one).
    const result = await getWellnessAdvice(question, context);
    res.json(result);
  } catch (error) {
    console.error('Wellness advice failed:', error.message);
    res.status(500).json({ error: 'Wellness advice failed' });
  }
});

module.exports = router;
