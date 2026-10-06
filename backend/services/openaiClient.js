/**
 * services/openaiClient.js
 *
 * Purpose: The only file that calls the OpenAI API. Holds every AI
 * feature's prompts and structured-output schemas: meal photo analysis,
 * typed meal description analysis, and the AI Coach (which is restricted
 * to wellness topics only, enforced both in the prompt and again in code).
 * Related to: called by routes/analyzeMeal.js, routes/analyzeMealText.js
 * and routes/wellnessAdvice.js.
 */

// "openai" is the official Node.js library for calling OpenAI's API - it
// just turns our JS objects into HTTP requests and parses the JSON reply.
const OpenAI = require('openai');

// Reads the API key from backend/.env (loaded in server.js). This "client"
// object is what actually sends requests to OpenAI.
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Cheapest current OpenAI model that supports image input - more than
// enough for "list the foods you see in this photo".
const MODEL = 'gpt-5.6-luna';

// The "system prompt" is a block of instructions sent with every request
// that tells the model how to behave for this specific feature - it's
// never shown to the user, and the user's own input can't override it.
const SYSTEM_PROMPT = `You are a wellness app assistant that looks at a photo and checks whether it shows a meal.
- First decide whether the photo actually shows food or a meal. Set is_food to true or false.
- If is_food is false (e.g. the photo shows a person, an object, a screenshot, anything without food): foods must be an empty array, all totals must be 0, meal_summary should briefly state no food was detected, and general_observation should briefly explain what the photo appears to show instead. Never invent food items for a non-food photo.
- If is_food is true: describe what you can actually see, and also give a best-effort APPROXIMATE calorie and macronutrient (protein/carbs/fat) estimate for each food, as whole numbers. These are rough estimates, not lab measurements - uncertainty naturally comes from unknown portion size, cooking oil, sauces, hidden ingredients, and image angle/quality. Do not refuse to estimate because of this uncertainty; give your best reasonable guess. Never claim or imply the numbers are exact or medical-grade. Keep portion descriptions general (e.g. "approximately one medium serving"), never exact weights or amounts. If you cannot clearly identify something, say so honestly in general_observation instead of guessing.
- total_estimated_calories/protein/carbs/fat must equal the sum of the per-food values.
- Do not give medical or dietary treatment advice. This is general wellness guidance only.`;

// A JSON Schema describing EXACTLY what shape the AI's answer must have.
// This isn't just a suggestion - OpenAI's "strict" structured-output mode
// (see the "text.format" block in analyzeMealImage below) guarantees the
// response always matches this shape, so our code never has to guard
// against a missing field or a field of the wrong type.
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

// Sends one meal photo to OpenAI and returns the structured JSON result
// (foods, calories, protein, carbs, fat) - always following MEAL_ANALYSIS_SCHEMA.
async function analyzeMealImage(base64Image, mimeType) {
  const response = await client.responses.create({
    model: MODEL,
    // "input" is the conversation sent to the model - one system message
    // (our instructions) plus one user message. The user message here
    // mixes two content types in one array: a short text instruction and
    // the image itself, encoded as a "data URL" (mimeType + base64 bytes
    // glued together) - this is the standard way to send an inline image
    // to OpenAI's API without hosting it anywhere.
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
    // Forces the reply to match MEAL_ANALYSIS_SCHEMA exactly (see the
    // comment above that schema for what "strict" guarantees).
    text: {
      format: {
        type: 'json_schema',
        name: 'meal_analysis',
        schema: MEAL_ANALYSIS_SCHEMA,
        strict: true,
      },
    },
  });

  // response.output_text is the model's reply as a plain string - since we
  // used a strict JSON schema, it's guaranteed to be valid JSON matching
  // MEAL_ANALYSIS_SCHEMA, so a plain JSON.parse is safe here.
  return JSON.parse(response.output_text);
}

// Same job as SYSTEM_PROMPT above, but for a meal the user typed instead of
// photographed. The answer uses the exact same MEAL_ANALYSIS_SCHEMA, so the
// app can show it in the same review box the photo flow already uses.
const TEXT_SYSTEM_PROMPT = `You are a wellness app assistant that reads a short meal description typed by the user and estimates its nutrition.
- First decide whether the text actually describes food or drink that was eaten. Set is_food to true or false.
- If is_food is false (e.g. the text is unrelated to food, or is gibberish): foods must be an empty array, all totals must be 0, meal_summary should briefly state no food was described, and general_observation should briefly say why. Never invent food items.
- If is_food is true: split the description into its individual foods and give a best-effort APPROXIMATE calorie and macronutrient (protein/carbs/fat) estimate for each, as whole numbers. If the user gave amounts (e.g. "200g chicken", "2 slices"), use them and repeat them in portion_description. If not, assume one typical medium serving and say so in portion_description. Do not refuse or ask questions because details are missing; give your best reasonable guess. Never claim or imply the numbers are exact or medical-grade. Use general_observation to briefly mention the main assumption you made (e.g. portion size or cooking method), if any.
- total_estimated_calories/protein/carbs/fat must equal the sum of the per-food values.
- Do not give medical or dietary treatment advice. This is general wellness guidance only.`;

// Sends one typed meal description to OpenAI and returns the structured
// JSON result - same shape as analyzeMealImage(), always following
// MEAL_ANALYSIS_SCHEMA.
async function analyzeMealDescription(description) {
  const response = await client.responses.create({
    model: MODEL,
    // Plain text only this time - no image, just the user's description.
    input: [
      { role: 'system', content: TEXT_SYSTEM_PROMPT },
      { role: 'user', content: `Meal description: ${description}` },
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

// The exact wording shown for any out-of-scope question. Kept as one
// constant so it's used identically in the prompt (telling the model what
// to say) and in code (forcing it, in case the model doesn't comply).
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

// The exact shape the AI Coach's answer must have (strict mode enforces
// it). The phone reads: answer, recommendations, missing_information and
// target_assessment (used by the Profile screen's custom target check).
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

// Sends one question + the app's wellness context to OpenAI, then
// double-checks in code that an out-of-scope question really gets the
// fixed refusal message (not just trusting the model followed the prompt).
async function getWellnessAdvice(question, context) {
  const response = await client.responses.create({
    model: MODEL,
    input: [
      { role: 'system', content: WELLNESS_ADVICE_SYSTEM_PROMPT },
      {
        // Unlike the meal-photo request above, this user message is plain
        // text - we just paste the question and the whole context object
        // (turned into a JSON string) into one message for the model to read.
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

module.exports = { analyzeMealImage, analyzeMealDescription, getWellnessAdvice };
