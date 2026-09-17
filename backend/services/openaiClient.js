const OpenAI = require('openai');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Cheapest current OpenAI model that supports image input - more than
// enough for "list the foods you see in this photo".
const MODEL = 'gpt-5.6-luna';

const SYSTEM_PROMPT = `You are a wellness app assistant that looks at a photo and checks whether it shows a meal.
- First decide whether the photo actually shows food or a meal. Set is_food to true or false.
- If is_food is false (e.g. the photo shows a person, an object, a screenshot, anything without food): foods must be an empty array, all totals must be 0, meal_summary should briefly state no food was detected, and general_observation should briefly explain what the photo appears to show instead. Never invent food items for a non-food photo.
- If is_food is true: describe what you can actually see, and also give a best-effort APPROXIMATE calorie and macronutrient (protein/carbs/fat) estimate for each food, as whole numbers. These are rough estimates, not lab measurements - uncertainty naturally comes from unknown portion size, cooking oil, sauces, hidden ingredients, and image angle/quality. Do not refuse to estimate because of this uncertainty; give your best reasonable guess. Never claim or imply the numbers are exact or medical-grade. Keep portion descriptions general (e.g. "approximately one medium serving"), never exact weights or amounts. If you cannot clearly identify something, say so honestly in general_observation instead of guessing.
- total_estimated_calories/protein/carbs/fat must equal the sum of the per-food values.
- Do not give medical or dietary treatment advice. This is general wellness guidance only.`;

const MEAL_ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    is_food: { type: 'boolean' },
    foods: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          portion_description: { type: 'string' },
          category: { type: 'string' },
          estimated_calories: { type: 'integer' },
          estimated_protein_g: { type: 'integer' },
          estimated_carbs_g: { type: 'integer' },
          estimated_fat_g: { type: 'integer' },
        },
        required: [
          'name',
          'portion_description',
          'category',
          'estimated_calories',
          'estimated_protein_g',
          'estimated_carbs_g',
          'estimated_fat_g',
        ],
        additionalProperties: false,
      },
    },
    meal_summary: { type: 'string' },
    general_observation: { type: 'string' },
    total_estimated_calories: { type: 'integer' },
    total_estimated_protein_g: { type: 'integer' },
    total_estimated_carbs_g: { type: 'integer' },
    total_estimated_fat_g: { type: 'integer' },
  },
  required: [
    'is_food',
    'foods',
    'meal_summary',
    'general_observation',
    'total_estimated_calories',
    'total_estimated_protein_g',
    'total_estimated_carbs_g',
    'total_estimated_fat_g',
  ],
  additionalProperties: false,
};

async function analyzeMealImage(base64Image, mimeType) {
  const response = await client.responses.create({
    model: MODEL,
    input: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'input_text', text: 'Identify the foods in this meal photo.' },
          {
            type: 'input_image',
            image_url: `data:${mimeType};base64,${base64Image}`,
            detail: 'auto',
          },
        ],
      },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'meal_analysis',
        schema: MEAL_ANALYSIS_SCHEMA,
        strict: true,
      },
    },
  });

  return JSON.parse(response.output_text);
}

const REFUSAL_MESSAGE =
  "I'm your Wellness Coach, so I can only help with nutrition, movement, workouts, breathing, and wellness information from this app.";

const WELLNESS_ADVICE_SYSTEM_PROMPT = `You are a dedicated Wellness Coach built into a personal wellness app. You are NOT a general-purpose assistant, even though you are built on a general-purpose model - stay strictly inside your domain below.

ALLOWED domain (set is_relevant to true only for questions like these):
- the user's own wellness data collected by this app (profile, meals, calories logged, steps, workouts, breathing)
- nutrition and general food choices
- walking, steps, physical activity, workouts, exercise selection, recovery
- breathing and relaxation
- general non-medical wellness guidance
- interpreting the app's wellness context and suggesting what wellness action the user might take next

OUT OF SCOPE (set is_relevant to false for anything like these, even if phrased politely or mixed with a wellness word):
- programming or code generation of any kind
- math/homework unrelated to wellness
- history, politics, travel, general trivia
- writing essays or unrelated content
- general technical support unrelated to this app's wellness features

If is_relevant is false: set answer to exactly "${REFUSAL_MESSAGE}", and set recommendations, context_used, and missing_information to empty arrays. Do not answer the out-of-scope question in any way, not even partially, and do not add anything else to the answer.

If is_relevant is true, follow these rules:
- Base your answer and recommendations ONLY on the JSON app context you are given below. Never assume or invent activity, meals, or data that isn't present in it.
- If information relevant to the question is missing from the context (e.g. no workout completed today, no steps recorded yet), say so plainly in missing_information - do not pretend it happened or guess a value.
- If the user's question assumes something happened (e.g. "after my workout", "after my run") but the context does not confirm that activity occurred today, the "answer" field itself must open by stating plainly that the data does not show that activity today - before giving any general advice. Never phrase the answer as if the assumed activity happened just because the question implied it.
- Never provide a medical diagnosis or medical treatment advice. This is general wellness guidance only.
- Avoid extreme or restrictive diet/exercise recommendations.
- The context may already include approximate calorie/protein estimates from logged meals, and may include nutrition_targets (a daily calorie/protein target already calculated deterministically by the app, not by you). Reference these as estimates and use the app's target numbers as-is - do not recalculate or second-guess them, and do not invent more precise nutrition values than what's provided.
- For every recommendation, briefly explain WHY it's being suggested, referencing the specific context data behind it.
- Keep the answer concise and useful.

target_assessment: set this to "not_applicable" for almost every question. Only when the user's question is specifically asking you to evaluate a PROPOSED custom daily calorie or protein target they want to use instead of the app's calculated one (the question will describe the proposed number, the app's calculated number, and their reason), set target_assessment to "reasonable" if the proposed number is a sensible general value for their stated profile and goal, or "caution" if it looks too low, too high, poorly justified, or not explained - and explain your reasoning in the answer either way. Never give medical judgments here, only general-wellness reasonableness.`;

const WELLNESS_ADVICE_SCHEMA = {
  type: 'object',
  properties: {
    is_relevant: { type: 'boolean' },
    answer: { type: 'string' },
    recommendations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['title', 'reason'],
        additionalProperties: false,
      },
    },
    context_used: { type: 'array', items: { type: 'string' } },
    missing_information: { type: 'array', items: { type: 'string' } },
    target_assessment: { type: 'string', enum: ['reasonable', 'caution', 'not_applicable'] },
  },
  required: [
    'is_relevant',
    'answer',
    'recommendations',
    'context_used',
    'missing_information',
    'target_assessment',
  ],
  additionalProperties: false,
};

async function getWellnessAdvice(question, context) {
  const response = await client.responses.create({
    model: MODEL,
    input: [
      { role: 'system', content: WELLNESS_ADVICE_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `User question: ${question}\n\nApp context (JSON):\n${JSON.stringify(context)}`,
      },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'wellness_advice',
        schema: WELLNESS_ADVICE_SCHEMA,
        strict: true,
      },
    },
  });

  const result = JSON.parse(response.output_text);

  // Defense-in-depth: don't just trust the model followed the prompt's
  // refusal wording/emptying instructions - enforce it here in code too.
  if (!result.is_relevant) {
    result.answer = REFUSAL_MESSAGE;
    result.recommendations = [];
    result.context_used = [];
    result.missing_information = [];
    result.target_assessment = 'not_applicable';
  }

  return result;
}

module.exports = { analyzeMealImage, getWellnessAdvice };
