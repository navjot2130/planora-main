const { GoogleGenerativeAI } = require('@google/generative-ai');
const asyncHandler = require('../../utils/asyncHandler');

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY in environment');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  return genAI.getGenerativeModel({ model: modelName });
}

async function generateText({ prompt, systemInstruction }) {
  // Gemini JS supports content parts; keep it simple for beginner-friendly structure.
  const parts = [];
  if (systemInstruction) {
    parts.push({ text: systemInstruction });
  }
  parts.push({ text: prompt });

  const primary = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const candidates = [primary, 'gemini-2.0-flash-lite', 'gemini-flash-latest'];
  let lastError = null;

  for (const modelName of [...new Set(candidates)]) {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Missing GEMINI_API_KEY in environment');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
      return result.response.text();
    } catch (error) {
      lastError = error;
      const message = String(error?.message || error);
      if (!message.includes('not found') && !message.includes('NOT_FOUND') && !message.includes('404')) {
        throw error;
      }
    }
  }

  throw lastError || new Error('Gemini generation failed');
}

module.exports = { generateText };

