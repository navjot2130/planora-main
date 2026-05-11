const { db } = require('../firebase/admin');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../utils/apiError');

function normalizeProfile(input = {}) {
  const displayName = typeof input.displayName === 'string' ? input.displayName.trim().slice(0, 120) : '';
  const role = typeof input.role === 'string' ? input.role.trim().slice(0, 80) : '';
  const preferences = input.preferences && typeof input.preferences === 'object' ? input.preferences : {};
  const workHours = input.workHours && typeof input.workHours === 'object' ? input.workHours : {};

  return {
    displayName,
    role,
    preferences: {
      focusStyle: typeof preferences.focusStyle === 'string' ? preferences.focusStyle.slice(0, 80) : 'Balanced',
      dailyGoal: typeof preferences.dailyGoal === 'string' ? preferences.dailyGoal.slice(0, 200) : '',
      reminderLeadMinutes: Number.isFinite(Number(preferences.reminderLeadMinutes))
        ? Math.max(0, Math.min(240, Number(preferences.reminderLeadMinutes)))
        : 15
    },
    workHours: {
      start: typeof workHours.start === 'string' ? workHours.start : '09:00',
      end: typeof workHours.end === 'string' ? workHours.end : '17:00',
      days: Array.isArray(workHours.days) ? workHours.days.slice(0, 7) : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    }
  };
}

const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const ref = db.collection('profiles').doc(userId);
  const doc = await ref.get();

  if (!doc.exists) {
    return res.json({
      profile: normalizeProfile({}),
      streak: 0
    });
  }

  res.json({ profile: doc.data(), streak: doc.data().streak || 0 });
});

const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const profile = normalizeProfile(req.body || {});

  if (profile.workHours.start >= profile.workHours.end) {
    throw new ApiError(400, 'Work hours start must be before end');
  }

  await db.collection('profiles').doc(userId).set(
    {
      ...profile,
      userId,
      updatedAt: new Date()
    },
    { merge: true }
  );

  res.json({ ok: true, profile });
});

module.exports = { getProfile, updateProfile };
