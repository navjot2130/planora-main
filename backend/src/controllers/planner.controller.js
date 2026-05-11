const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../utils/apiError');
const plannerService = require('../services/ai/plannerService');
const { taskSchema } = require('../utils/validation');
const { db } = require('../firebase/admin');

/**
 * POST /api/planner/generate
 * Body:
 * {
 *   goals: string,
 *   timezone?: string
 * }
 */
const generatePlan = asyncHandler(async (req, res) => {
  const { goals, timezone } = req.body || {};
  const userId = req.user.uid;

  if (!goals || typeof goals !== 'string' || !goals.trim()) {
    throw new ApiError(400, 'Missing required field: goals');
  }

  const result = await plannerService.generateDailyPlan({ userId, goals, timezone });

  res.json({ plan: result });
});

/**
 * POST /api/planner/accept
 * Body:
 * {
 *   plan: {
 *     timeline: [{ time, task, focus, tone }],
 *     priorities?: string[],
 *     habitsImprovements?: string[],
 *     reschedule?: [{ task, suggestedTime }]
 *   }
 * }
 */
const acceptPlan = asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const { plan } = req.body || {};

  if (!plan || typeof plan !== 'object') {
    throw new ApiError(400, 'Missing required field: plan');
  }

  const timeline = Array.isArray(plan.timeline) ? plan.timeline : null;
  if (!timeline || !timeline.length) {
    throw new ApiError(400, 'Invalid plan: timeline is required');
  }

  // Persist tasks derived from timeline blocks.
  // Mapping:
  // - task title: block.task || block.focus || block.text (best-effort)
  // - description: block.focus (if task title used block.task)
  // - priority: based on tone (primary=Medium, success=High, warning=Low)
  // - category: derived heuristically from words, default 'Work'
  // - dueDate: today's date + HH:MM from block.time
  // - completed: false

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  function parseHHMMToDateOnly(d, time) {
    if (!time || typeof time !== 'string') return null;
    const m = time.match(/^\s*(\d{1,2}):(\d{2})\s*$/);
    if (!m) return null;
    const hh = Number(m[1]);
    const mm = Number(m[2]);
    if (Number.isNaN(hh) || Number.isNaN(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;

    const x = new Date(d);
    x.setHours(hh, mm, 0, 0);
    return x;
  }

  function toneToPriority(tone) {
    if (tone === 'success') return 'High';
    if (tone === 'warning') return 'Low';
    return 'Medium';
  }

  function inferCategory(title = '') {
    const s = String(title).toLowerCase();
    if (/(health|walk|run|gym|sleep|yoga)/.test(s)) return 'Health';
    if (/(learn|study|course|read|reading|practice)/.test(s)) return 'Learning';
    if (/(call|client|meeting|work|report|sprint|email)/.test(s)) return 'Work';
    if (/(family|personal|home|life|friend|errand)/.test(s)) return 'Personal';
    return 'Work';
  }

  const tasksToCreate = [];

  for (const block of timeline) {
    if (!block || typeof block !== 'object') continue;
    const time = block.time;

    const taskTitle = (block.task || block.focus || block.text || '').toString().trim();
    if (!taskTitle) continue;

    const focus = (block.focus || '').toString();
    const priority = toneToPriority(block.tone);
    const category = inferCategory(taskTitle);
    const dueDate = parseHHMMToDateOnly(today, time);

    const payload = {
      title: taskTitle,
      description: focus ? focus.slice(0, 2000) : '',
      priority,
      category,
      dueDate: dueDate ? dueDate.toISOString() : null,
      completed: false
    };

    const parsed = taskSchema.safeParse(payload);
    if (!parsed.success) {
      // Skip invalid entries rather than failing entire request.
      continue;
    }

    tasksToCreate.push(parsed.data);
  }

  if (!tasksToCreate.length) {
    throw new ApiError(400, 'No valid tasks found in plan timeline');
  }

  const batchSize = 50;
  for (let i = 0; i < tasksToCreate.length; i += batchSize) {
    const chunk = tasksToCreate.slice(i, i + batchSize);
    const writes = chunk.map((t) =>
      db.collection('tasks').add({
        userId,
        title: t.title,
        description: t.description || '',
        priority: t.priority,
        category: t.category,
        completed: Boolean(t.completed),
        dueDate: t.dueDate ? new Date(t.dueDate) : null,
        createdAt: now,
        updatedAt: now
      })
    );
    await Promise.all(writes);
  }

  // Optional: store last accepted plan.
  try {
    await db.collection('ai_memory').add({
      userId,
      type: 'planner_accept',
      payload: plan,
      createdAt: new Date()
    });
  } catch {
    // Non-fatal.
  }

  res.json({ ok: true, created: tasksToCreate.length });
});

module.exports = { generatePlan, acceptPlan };

