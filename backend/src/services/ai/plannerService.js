const { db } = require('../../firebase/admin');
const aiService = require('./aiService');

const SYSTEM = `You are Planora, an AI productivity coach.
Return ONLY valid JSON.
No markdown.
Schema:
{
  "timeline": [
    { "time": "HH:MM", "task": "string", "focus": "string", "tone": "primary|success|warning" }
  ],
  "priorities": ["High|Medium|Low"],
  "focusSuggestions": ["string"],
  "estimatedProductivity": number,
  "habitsImprovements": ["string"],
  "reschedule": [{ "task": "string", "suggestedTime": "HH:MM" }]
}`;

function buildTimelineFromGoals({ goals }) {
  const base = goals
    .split(/\n|,|\./)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!base.length) {
    return ['Focus on the right tasks', 'Protect energy', 'Finish one win'];
  }
  return base;
}

function buildFallbackPlan({ goals }) {
  const ideas = buildTimelineFromGoals({ goals });
  const times = ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00'];
  const verbs = ['Plan', 'Deep work', 'Execute', 'Review', 'Polish', 'Wrap up'];

  return {
    timeline: times.map((time, idx) => {
      const idea = ideas[idx % ideas.length];
      return {
        time,
        task: `${verbs[idx]}: ${idea}`,
        focus: `Focus on ${idea.toLowerCase()} with a clear next action.`,
        tone: idx === 1 || idx === 3 ? 'success' : idx === 4 ? 'warning' : 'primary'
      };
    }),
    priorities: ['High', 'Medium', 'Low'],
    focusSuggestions: [
      'Start with the highest-impact task.',
      'Use 25-minute focus blocks.',
      'Review progress before switching context.'
    ],
    estimatedProductivity: 72,
    habitsImprovements: ['Keep tasks small enough to start immediately.'],
    reschedule: [],
    generatedBy: 'fallback'
  };
}

function normalizeJSON(text) {
  // Model might return extra whitespace; try to extract JSON substring.
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last === -1) return null;
  return JSON.parse(text.slice(first, last + 1));
}

async function generateDailyPlan({ userId, goals, timezone }) {
  const timelineSeed = buildTimelineFromGoals({ goals });

  const prompt = `User goals (raw): ${goals}\n\nTimezone: ${timezone || 'local'}\n\nCreate a realistic day schedule using the goals.
- Provide 6 focus blocks.
- Each block must contain time in HH:MM (24h), and a short focus label.
- estimatedProductivity must be a number from 0 to 100.
- Also return habitsImprovements and reschedule suggestions for unfinished tasks.
Use this seed ideas: ${timelineSeed.join(' | ')}.`;

  let aiText = '';
  try {
    aiText = await aiService.generateText({ prompt, systemInstruction: SYSTEM });
  } catch (e) {
    return buildFallbackPlan({ goals });
  }

  let json = null;
  try {
    json = normalizeJSON(aiText);
  } catch (e) {
    return buildFallbackPlan({ goals });
  }

  if (!json || !Array.isArray(json.timeline)) {
    return buildFallbackPlan({ goals });
  }

  // Store last plan for the user (optional, keeps future AI context).
  try {
    await db.collection('ai_memory').add({
      userId,
      type: 'planner',
      payload: json,
      createdAt: new Date()
    });
  } catch (e) {
    // Non-fatal.
  }

  return json;
}

module.exports = { generateDailyPlan };

