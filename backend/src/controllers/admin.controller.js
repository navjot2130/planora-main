const { auth, db } = require('../firebase/admin');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../utils/apiError');

const listUsers = asyncHandler(async (req, res) => {
  const result = await auth.listUsers(100);
  const users = result.users.map((u) => ({
    uid: u.uid,
    email: u.email || null,
    displayName: u.displayName || null,
    disabled: u.disabled,
    createdAt: u.metadata.creationTime,
    lastSignInAt: u.metadata.lastSignInTime,
    admin: Boolean(u.customClaims?.admin)
  }));

  res.json({ users });
});

const updateUser = asyncHandler(async (req, res) => {
  const { uid } = req.params;
  const { disabled } = req.body || {};

  if (typeof disabled !== 'boolean') {
    throw new ApiError(400, 'Missing boolean field: disabled');
  }

  await auth.updateUser(uid, { disabled });
  res.json({ ok: true });
});

const getSystemStats = asyncHandler(async (req, res) => {
  const [tasksSnap, remindersSnap, chatsSnap, profilesSnap] = await Promise.all([
    db.collection('tasks').get(),
    db.collection('reminders').get(),
    db.collection('chats').get(),
    db.collection('profiles').get()
  ]);

  const tasks = tasksSnap.docs.map((d) => d.data());
  const completed = tasks.filter((t) => t.completed).length;

  res.json({
    stats: {
      profiles: profilesSnap.size,
      tasks: tasksSnap.size,
      completedTasks: completed,
      pendingTasks: tasks.length - completed,
      reminders: remindersSnap.size,
      chats: chatsSnap.size
    }
  });
});

module.exports = { listUsers, updateUser, getSystemStats };
