const { db } = require('../firebase/admin');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../utils/apiError');
const { taskSchema } = require('../utils/validation');

function toDateOnly(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isSameDate(a, b) {
  const da = new Date(a);
  const dbb = new Date(b);
  return (
    da.getFullYear() === dbb.getFullYear() &&
    da.getMonth() === dbb.getMonth() &&
    da.getDate() === dbb.getDate()
  );
}

// GET /api/tasks/today
const getTodaysTasks = asyncHandler(async (req, res) => {
  const userId = req.user.uid;

  const snap = await db
    .collection('tasks')
    .where('userId', '==', userId)
    .orderBy('dueDate', 'asc')
    .get();

  const today = toDateOnly(new Date());

  const tasks = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((t) => {
      if (!t.dueDate) return true; // fallback
      // dueDate can be Timestamp or string
      const due = t.dueDate.toDate ? t.dueDate.toDate() : new Date(t.dueDate);
      return isSameDate(due, today);
    });

  res.json({ tasks });
});

// GET /api/tasks
const listTasks = asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const { priority, category, status } = req.query;

  let query = db.collection('tasks').where('userId', '==', userId);
  if (status === 'completed') query = query.where('completed', '==', true);
  if (status === 'pending') query = query.where('completed', '==', false);

  const snap = await query.orderBy('createdAt', 'desc').get();
  const tasks = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const filtered = tasks.filter((t) => {
    const pOk = priority ? t.priority === priority : true;
    const cOk = category ? t.category === category : true;
    return pOk && cOk;
  });

  res.json({ tasks: filtered });
});

// POST /api/tasks
const createTask = asyncHandler(async (req, res) => {
  const userId = req.user.uid;

  const parsed = taskSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid task payload', parsed.error.flatten());
  }

  const { title, description, priority, category, dueDate, completed } = parsed.data;

  const now = new Date();

  const docRef = await db.collection('tasks').add({
    userId,
    title,
    description: description || '',
    priority,
    category,
    completed: Boolean(completed),
    dueDate: dueDate ? new Date(dueDate) : now,
    createdAt: now,
    updatedAt: now
  });

  res.status(201).json({ id: docRef.id });
});

// PATCH /api/tasks/:taskId
const updateTask = asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const { taskId } = req.params;

  const ref = db.collection('tasks').doc(taskId);
  const existing = await ref.get();
  if (!existing.exists) throw new ApiError(404, 'Task not found');
  if (existing.data().userId !== userId) throw new ApiError(403, 'Forbidden');

  const parsed = taskSchema.partial().safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, 'Invalid task payload', parsed.error.flatten());

  const now = new Date();
  const update = { updatedAt: now };

  const data = parsed.data;
  if (data.title !== undefined) update.title = data.title;
  if (data.description !== undefined) update.description = data.description || '';
  if (data.priority !== undefined) update.priority = data.priority;
  if (data.category !== undefined) update.category = data.category;
  if (data.completed !== undefined) update.completed = Boolean(data.completed);
  if (data.dueDate !== undefined) update.dueDate = data.dueDate ? new Date(data.dueDate) : null;

  await ref.update(update);

  res.json({ ok: true });
});

// DELETE /api/tasks/:taskId
const deleteTask = asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const { taskId } = req.params;

  const ref = db.collection('tasks').doc(taskId);
  const existing = await ref.get();
  if (!existing.exists) throw new ApiError(404, 'Task not found');
  if (existing.data().userId !== userId) throw new ApiError(403, 'Forbidden');

  await ref.delete();
  res.json({ ok: true });
});

// POST /api/tasks/:taskId/toggle
const toggleTaskCompletion = asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const { taskId } = req.params;

  const ref = db.collection('tasks').doc(taskId);
  const existing = await ref.get();
  if (!existing.exists) throw new ApiError(404, 'Task not found');
  if (existing.data().userId !== userId) throw new ApiError(403, 'Forbidden');

  const next = !existing.data().completed;
  await ref.update({ completed: next, updatedAt: new Date() });

  res.json({ ok: true, completed: next });
});

module.exports = {
  getTodaysTasks,
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskCompletion
};

