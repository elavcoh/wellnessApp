/**
 * routes/wellnessAdvice.js
 *
 * Purpose: Handles POST /api/wellness-advice - takes a question and the
 * app's wellness context, and returns the AI Coach's structured answer.
 * Related to: called by src/services/aiService.js on the phone.
 */

// Express is the web framework that turns HTTP requests into function calls.
const express = require('express');
const { getWellnessAdvice } = require('../services/openaiClient');

// Mounted at "/api/wellness-advice" in server.js - same router pattern as
// routes/analyzeMeal.js.
const router = express.Router();

const MAX_QUESTION_LENGTH = 1000;

// Checks the question and context, asks OpenAI, and returns the coach's
// structured answer (or a short error).
router.post('/', async (req, res) => {
  // question: plain text typed or tapped by the user.
  // context: the whole object built by wellnessContextBuilder.js on the
  // phone (profile, today's meals/steps/workout/breathing, targets).
  const { question, context } = req.body;

  if (typeof question !== 'string' || !question.trim() || typeof context !== 'object' || !context) {
    return res.status(400).json({ error: 'question and context are required' });
  }
  // Same idea as the meal description limit - stops someone pasting a huge
  // text and spending OpenAI credit on it.
  if (question.length > MAX_QUESTION_LENGTH) {
    return res.status(400).json({ error: 'question is too long' });
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
