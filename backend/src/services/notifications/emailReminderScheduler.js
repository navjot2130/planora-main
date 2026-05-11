const { auth, db } = require('../../firebase/admin');
const { sendReminderEmail } = require('../email/emailService');

const CHECK_INTERVAL_MS = Number(process.env.EMAIL_REMINDER_INTERVAL_MS || 60 * 1000);
const SEND_WINDOW_MS = Number(process.env.EMAIL_REMINDER_WINDOW_MS || 90 * 1000);

let timer = null;
let running = false;

function normalizeDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') {
    const d = value.toDate();
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getLeadMinutes(profile) {
  const value = Number(profile?.preferences?.reminderLeadMinutes ?? 15);
  if (!Number.isFinite(value)) return 15;
  return Math.max(0, Math.min(240, value));
}

function shouldSend({ nowMs, triggerAtMs }) {
  return nowMs >= triggerAtMs && nowMs <= triggerAtMs + SEND_WINDOW_MS;
}

function notificationDocId({ type, itemId, phase, triggerAtMs }) {
  return `${type}_${itemId}_${phase}_${triggerAtMs}`;
}

async function wasAlreadySent({ type, itemId, phase, triggerAtMs }) {
  const id = notificationDocId({ type, itemId, phase, triggerAtMs });
  const doc = await db.collection('email_notifications').doc(id).get();
  return doc.exists;
}

async function markSent({ type, itemId, phase, triggerAtMs, userId, email, title }) {
  const id = notificationDocId({ type, itemId, phase, triggerAtMs });
  await db.collection('email_notifications').doc(id).set({
    type,
    itemId,
    phase,
    triggerAt: new Date(triggerAtMs),
    userId,
    email,
    title,
    sentAt: new Date()
  });
}

async function getProfile(userId) {
  const doc = await db.collection('profiles').doc(userId).get();
  return doc.exists ? doc.data() : null;
}

async function getUserEmail(userId) {
  const user = await auth.getUser(userId);
  return user.email || null;
}

function buildTaskEmail({ task, dueDate, phase, leadMinutes }) {
  const when = dueDate.toLocaleString();
  const prefix = phase === 'lead' ? `Upcoming task in ${leadMinutes} minute(s)` : 'Task is due now';
  return {
    subject: `Planora reminder: ${task.title}`,
    text: `${prefix}\n\nTask: ${task.title}\nTime: ${when}\nPriority: ${task.priority || 'Medium'}\nCategory: ${task.category || 'Work'}\n\n${task.description || ''}`.trim()
  };
}

function buildReminderEmail({ reminder, remindAt, phase, leadMinutes }) {
  const when = remindAt.toLocaleString();
  const prefix = phase === 'lead' ? `Upcoming reminder in ${leadMinutes} minute(s)` : 'Reminder time is now';
  return {
    subject: `Planora reminder: ${reminder.title}`,
    text: `${prefix}\n\nReminder: ${reminder.title}\nTime: ${when}`
  };
}

async function sendDueNotification({ type, item, scheduledAt, phase, triggerAtMs, leadMinutes }) {
  const userId = item.userId;
  if (!userId || !item.id) return;
  if (await wasAlreadySent({ type, itemId: item.id, phase, triggerAtMs })) return;

  const email = await getUserEmail(userId);
  if (!email) return;

  const message =
    type === 'task'
      ? buildTaskEmail({ task: item, dueDate: scheduledAt, phase, leadMinutes })
      : buildReminderEmail({ reminder: item, remindAt: scheduledAt, phase, leadMinutes });

  const result = await sendReminderEmail({
    to: email,
    subject: message.subject,
    text: message.text
  });

  if (result.sent) {
    await markSent({
      type,
      itemId: item.id,
      phase,
      triggerAtMs,
      userId,
      email,
      title: item.title
    });
  }
}

async function processItem({ type, item, scheduledAt, nowMs, profile }) {
  if (!scheduledAt) return;

  const leadMinutes = getLeadMinutes(profile);
  const leadTriggerAtMs = scheduledAt.getTime() - leadMinutes * 60 * 1000;
  const exactTriggerAtMs = scheduledAt.getTime();

  if (leadMinutes > 0 && shouldSend({ nowMs, triggerAtMs: leadTriggerAtMs })) {
    await sendDueNotification({
      type,
      item,
      scheduledAt,
      phase: 'lead',
      triggerAtMs: leadTriggerAtMs,
      leadMinutes
    });
  }

  if (shouldSend({ nowMs, triggerAtMs: exactTriggerAtMs })) {
    await sendDueNotification({
      type,
      item,
      scheduledAt,
      phase: 'exact',
      triggerAtMs: exactTriggerAtMs,
      leadMinutes
    });
  }
}

async function checkEmailReminders() {
  if (running) return;
  running = true;

  try {
    const nowMs = Date.now();
    const [tasksSnap, remindersSnap] = await Promise.all([
      db.collection('tasks').where('completed', '==', false).get(),
      db.collection('reminders').where('completed', '==', false).get()
    ]);

    const profileCache = new Map();
    async function profileFor(userId) {
      if (!profileCache.has(userId)) {
        profileCache.set(userId, await getProfile(userId));
      }
      return profileCache.get(userId);
    }

    for (const doc of tasksSnap.docs) {
      const task = { id: doc.id, ...doc.data() };
      const scheduledAt = normalizeDate(task.dueDate);
      await processItem({
        type: 'task',
        item: task,
        scheduledAt,
        nowMs,
        profile: await profileFor(task.userId)
      });
    }

    for (const doc of remindersSnap.docs) {
      const reminder = { id: doc.id, ...doc.data() };
      const scheduledAt = normalizeDate(reminder.remindAt);
      await processItem({
        type: 'reminder',
        item: reminder,
        scheduledAt,
        nowMs,
        profile: await profileFor(reminder.userId)
      });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[email-reminders] check failed', error);
  } finally {
    running = false;
  }
}

function startEmailReminderScheduler() {
  if (timer || String(process.env.EMAIL_REMINDERS_ENABLED || 'true').toLowerCase() === 'false') return;

  timer = setInterval(checkEmailReminders, CHECK_INTERVAL_MS);
  checkEmailReminders();

  // eslint-disable-next-line no-console
  console.log(`[email-reminders] Scheduler started, interval ${CHECK_INTERVAL_MS}ms`);
}

module.exports = { checkEmailReminders, startEmailReminderScheduler };
