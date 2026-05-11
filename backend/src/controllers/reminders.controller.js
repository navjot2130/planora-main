const asyncHandler = require('../utils/asyncHandler');
const { db } = require('../firebase/admin');
const { ApiError } = require('../utils/apiError');


function parseRemindAt(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

// GET /api/reminders
// Returns reminders for the current user.
const listReminders = asyncHandler(async (req, res) => {
  const userId = req.user.uid;

  const snap = await db
    .collection('reminders')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();

  const reminders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  res.json({ reminders });
});

// POST /api/reminders
// Body: { title: string, remindAt: string|Date }
const createReminder = asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const { title, remindAt } = req.body || {};

  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new ApiError(400, 'Missing required field: title');
  }

  const remindAtDate = parseRemindAt(remindAt);
  if (!remindAtDate) {
    throw new ApiError(400, 'Missing or invalid field: remindAt');
  }

  const now = new Date();
  const docRef = await db.collection('reminders').add({
    userId,
    title: title.trim(),
    remindAt: remindAtDate,
    completed: false,
    createdAt: now
  });

  res.status(201).json({ ok: true, reminderId: docRef.id });
});

// DELETE /api/reminders/:reminderId
const deleteReminder = asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const { reminderId } = req.params;

  const ref = db.collection('reminders').doc(reminderId);
  const existing = await ref.get();

  if (!existing.exists) throw new ApiError(404, 'Reminder not found');
  if (existing.data().userId !== userId) throw new ApiError(403, 'Forbidden');

  await ref.delete();
  res.json({ ok: true });
});

module.exports = { listReminders, createReminder, deleteReminder };


