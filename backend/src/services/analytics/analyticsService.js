const { db } = require('../../firebase/admin');

function toDateOnly(d) {
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

function computeProductivity({ tasks }) {
  if (!tasks.length) return 0;
  // Simple beginner-friendly score: completion ratio * 100.
  const completed = tasks.filter((t) => t.completed).length;
  return Math.round((completed / tasks.length) * 100);
}

async function getTodayAnalytics({ userId }) {
  const now = new Date();
  const today = toDateOnly(now);

  const snap = await db
    .collection('tasks')
    .where('userId', '==', userId)
    .get();

  const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Prefer dueDate tasks for today; fallback to tasks with matching updatedAt date.
  const todays = all.filter((t) => {
    const due = t.dueDate?.toDate ? t.dueDate.toDate() : t.dueDate ? new Date(t.dueDate) : null;
    if (due) return isSameDate(due, today);
    const upd = t.updatedAt?.toDate ? t.updatedAt.toDate() : t.updatedAt ? new Date(t.updatedAt) : null;
    return upd ? isSameDate(upd, today) : false;
  });

  const productivity = computeProductivity({ tasks: todays });

  const completed = todays.filter((t) => t.completed).length;
  const pending = todays.length - completed;

  const completionPercentage = todays.length ? Math.round((completed / todays.length) * 100) : 0;

  // Streak: count consecutive days up to today where at least one task completed.
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const day = toDateOnly(new Date(now.getTime() - i * 24 * 60 * 60 * 1000));
    const anyCompleted = all.some((t) => {
      if (!t.completed) return false;
      const upd = t.updatedAt?.toDate ? t.updatedAt.toDate() : t.updatedAt ? new Date(t.updatedAt) : null;
      return upd ? isSameDate(upd, day) : false;
    });
    if (anyCompleted) streak++;
    else break;
  }

  // Focus time: approximate from count of completed tasks * 25 minutes.
  const focusTimeHours = Math.round((completed * 25) / 60 * 10) / 10;

  // Motivation message (static for now; could be AI-generated later)
  const motivationalMessage =
    productivity >= 80
      ? 'You’re in momentum mode—protect it by finishing one last important task.'
      : productivity >= 50
        ? 'Good progress. Choose the smallest next action and complete it within 25 minutes.'
        : 'Start tiny: pick one high-leverage task and begin for 10 minutes. Momentum follows.';

  return {
    productivity,
    stats: {
      completed,
      pending,
      completionPercentage
    },
    streak,
    focusTimeHours,
    motivationalMessage,
    recentActivity: todays
      .slice()
      .sort((a, b) => (b.updatedAt?.toDate ? b.updatedAt.toDate() : 0) - (a.updatedAt?.toDate ? a.updatedAt.toDate() : 0))
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        title: t.title,
        completed: t.completed,
        updatedAt: t.updatedAt?.toDate ? t.updatedAt.toDate().toISOString() : null
      }))
  };
}

async function getWeeklyAnalytics({ userId }) {
  const now = new Date();

  // last 7 days (Mon..Sun-like labels in frontend are fixed; we provide chronological values)
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const snap = await db.collection('tasks').where('userId', '==', userId).get();
  const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const weekly = days.map((day) => {
    const tasks = all.filter((t) => {
      const due = t.dueDate?.toDate ? t.dueDate.toDate() : t.dueDate ? new Date(t.dueDate) : null;
      if (due) return isSameDate(due, day);
      const upd = t.updatedAt?.toDate ? t.updatedAt.toDate() : t.updatedAt ? new Date(t.updatedAt) : null;
      return upd ? isSameDate(upd, day) : false;
    });
    return computeProductivity({ tasks });
  });

  const avg = weekly.length ? Math.round(weekly.reduce((a, b) => a + b, 0) / weekly.length) : 0;

  // Completion distribution for today-like cards; approximate using overall tasks.
  const completedTasks = all.filter((t) => t.completed).length;
  const totalTasks = all.length;
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Weekly focus time estimate: completed tasks within 7 days * 25min
  let completedCount7 = 0;
  for (const day of days) {
    const any = all.filter((t) => {
      if (!t.completed) return false;
      const upd = t.updatedAt?.toDate ? t.updatedAt.toDate() : t.updatedAt ? new Date(t.updatedAt) : null;
      return upd ? isSameDate(upd, day) : false;
    });
    completedCount7 += any.length;
  }

  const focusTimeHours = Math.round((completedCount7 * 25) / 60 * 10) / 10;

  // Overdue risk heuristic: pending tasks with dueDate before today.
  const today = toDateOnly(now);
  const overdueRisk = (() => {
    const pending = all.filter((t) => !t.completed);
    if (!pending.length) return 0;
    const overdue = pending.filter((t) => {
      const due = t.dueDate?.toDate ? t.dueDate.toDate() : t.dueDate ? new Date(t.dueDate) : null;
      return due ? toDateOnly(due) < today : false;
    });
    return Math.round((overdue.length / pending.length) * 100);
  })();

  return {
    weekly: {
      points: weekly,
      avgProductivity: avg
    },
    cards: {
      completionRate,
      focusTimeHours,
      overdueRisk
    }
  };
}

async function getMonthlyAnalytics({ userId }) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysInMonth = end.getDate();

  const snap = await db.collection('tasks').where('userId', '==', userId).get();
  const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const points = Array.from({ length: daysInMonth }).map((_, idx) => {
    const day = new Date(start);
    day.setDate(idx + 1);
    const tasks = all.filter((t) => {
      const due = t.dueDate?.toDate ? t.dueDate.toDate() : t.dueDate ? new Date(t.dueDate) : null;
      if (due) return isSameDate(due, day);
      const upd = t.updatedAt?.toDate ? t.updatedAt.toDate() : t.updatedAt ? new Date(t.updatedAt) : null;
      return upd ? isSameDate(upd, day) : false;
    });
    return {
      day: idx + 1,
      productivity: computeProductivity({ tasks }),
      completed: tasks.filter((t) => t.completed).length,
      pending: tasks.filter((t) => !t.completed).length
    };
  });

  const activeDays = points.filter((p) => p.completed || p.pending).length;
  const avgProductivity = activeDays
    ? Math.round(points.reduce((sum, p) => sum + p.productivity, 0) / activeDays)
    : 0;

  return {
    month: now.toLocaleString('en', { month: 'long', year: 'numeric' }),
    points,
    avgProductivity
  };
}

module.exports = { getTodayAnalytics, getWeeklyAnalytics, getMonthlyAnalytics };

