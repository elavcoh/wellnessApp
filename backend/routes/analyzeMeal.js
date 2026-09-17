const express = require('express');
const { analyzeMealImage } = require('../services/openaiClient');

const router = express.Router();

router.post('/', async (req, res) => {
  const { imageBase64, mimeType } = req.body;

  if (!imageBase64) {
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
    res.json(result);
  } catch (error) {
    console.error('Meal analysis failed:', error.message);
    res.status(500).json({ error: 'Meal analysis failed' });
  }
});

module.exports = router;
