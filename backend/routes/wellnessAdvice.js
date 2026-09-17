const express = require('express');
const { getWellnessAdvice } = require('../services/openaiClient');

const router = express.Router();

router.post('/', async (req, res) => {
  const { question, context } = req.body;

  if (!question || !context) {
    return res.status(400).json({ error: 'question and context are required' });
  }

  try {
    const result = await getWellnessAdvice(question, context);
    res.json(result);
  } catch (error) {
    console.error('Wellness advice failed:', error.message);
    res.status(500).json({ error: 'Wellness advice failed' });
  }
});

module.exports = router;
