const { db } = require('../../firebase/admin');
const { ApiError } = require('../../utils/apiError');
const aiService = require('./aiService');

const SYSTEM = `You are Planora AI. Be concise and actionable.
Return ONLY plain text (no JSON, no markdown headings).
If user asks for planning, provide prioritized next steps.
If user asks for productivity, propose a focus block and a tiny next action.`;

function summarizeConversation(messages) {
  // Lightweight memory: last few turns.
  return messages
    .slice(-8)
    .map((m) => `${m.role === 'user' ? 'User' : 'AI'}: ${m.text}`)
    .join('\n');
}

async function getTaskContext({ userId }) {
  const snap = await db
    .collection('tasks')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(12)
    .get();

  const tasks = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (!tasks.length) return 'No saved tasks yet.';

  return tasks
    .map((t) => {
      const due = t.dueDate?.toDate ? t.dueDate.toDate().toISOString() : t.dueDate || 'unscheduled';
      return `- ${t.title} | ${t.completed ? 'completed' : 'pending'} | ${t.priority || 'Medium'} | ${t.category || 'Work'} | due ${due}`;
    })
    .join('\n');
}

async function listRecentConversations({ userId }) {
  // Conversations are stored as docs in /chats where doc contains messages.
  // For simplicity: return distinct chat threads from chat docs.
  const snap = await db
    .collection('chats')
    .where('userId', '==', userId)
    .orderBy('updatedAt', 'desc')
    .limit(10)
    .get();

  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function getChatHistory({ userId, chatId }) {
  const doc = await db.collection('chats').doc(chatId).get();
  if (!doc.exists) throw new ApiError(404, 'Chat not found');
  const data = doc.data();
  if (data.userId !== userId) throw new ApiError(403, 'Forbidden');

  return data.messages || [];
}

async function sendMessage({ userId, message, chatId }) {
  const existingChatId = chatId;

  let threadRef;
  if (existingChatId) {
    threadRef = db.collection('chats').doc(existingChatId);
    const doc = await threadRef.get();
    if (doc.exists && doc.data().userId !== userId) {
      throw new ApiError(403, 'Forbidden');
    }
  } else {
    threadRef = db.collection('chats').doc();
  }

  const now = new Date();

  const prevMessages = [];
  if (existingChatId) {
    const doc = await db.collection('chats').doc(existingChatId).get();
    if (doc.exists) prevMessages.push(...(doc.data().messages || []));
  }

  const nextMessages = [...prevMessages, { role: 'user', text: message, createdAt: now }];

  const context = summarizeConversation(nextMessages);
  const taskContext = await getTaskContext({ userId });

  const prompt = `Saved task context:\n${taskContext}\n\nConversation so far:\n${context}\n\nUser message: ${message}`;
  let aiText;
  try {
    aiText = await aiService.generateText({ prompt, systemInstruction: SYSTEM });
  } catch (e) {
    aiText =
      'I could not reach the AI planner service right now, but your message was saved. Try a small next step from your current task list, then send another message in a moment.';
  }

  const reply = { role: 'ai', text: aiText, createdAt: new Date() };
  const finalMessages = [...nextMessages, reply];

  await threadRef.set(
    {
      userId,
      updatedAt: new Date(),
      messages: finalMessages,
      lastUserMessage: message
    },
    { merge: true }
  );

  // Update lightweight AI memory (optional).
  try {
    await db.collection('ai_memory').add({
      userId,
      type: 'chat',
      payload: { chatId: threadRef.id, lastUser: message, lastAi: aiText },
      createdAt: new Date()
    });
  } catch (e) {
    // non-fatal
  }

  return { chatId: threadRef.id, message: aiText };
}

module.exports = { listRecentConversations, getChatHistory, sendMessage };

