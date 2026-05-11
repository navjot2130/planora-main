import React, { useEffect, useRef, useState } from 'react';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { chatApi } from '../api/chatApi.js';

function bubbleStyles(role) {
  return role === 'user'
    ? { background: 'rgba(59,130,246,.12)', border: '1px solid rgba(59,130,246,.22)', alignSelf: 'flex-end' }
    : { background: 'rgba(255,255,255,.25)', border: '1px solid var(--border)', alignSelf: 'flex-start' };
}

export default function ChatPage() {
  const [messages, setMessages] = useState([{ role: 'ai', text: 'Welcome to Planora Chat. Tell me what you need help with.' }]);
  const [conversations, setConversations] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [draft, setDraft] = useState('Help me prioritize my pending tasks.');
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState(null);
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo?.({ top: 999999, behavior: 'smooth' });
  }, [messages, isThinking]);

  const loadConversations = async () => {
    try {
      const res = await chatApi.listConversations();
      setConversations(res?.data?.conversations || []);
    } catch {
      setConversations([]);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const openConversation = async (id) => {
    setError(null);
    try {
      const res = await chatApi.getHistory(id);
      setChatId(id);
      setMessages(res?.data?.history || []);
    } catch (e) {
      setError(e?.message || 'Failed to load chat history');
    }
  };

  const onSend = async () => {
    const text = draft.trim();
    if (!text || isThinking) return;

    setDraft('');
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setIsThinking(true);

    try {
      const res = await chatApi.sendMessage({ message: text, chatId });
      const nextChatId = res?.data?.chatId;
      if (nextChatId) setChatId(nextChatId);
      setMessages((prev) => [...prev, { role: 'ai', text: res?.data?.message || 'I could not generate a response.' }]);
      await loadConversations();
    } catch (e) {
      setError(e?.message || 'Failed to send message');
    } finally {
      setIsThinking(false);
    }
  };

  const reset = () => {
    setChatId(null);
    setMessages([{ role: 'ai', text: 'New chat started. What do you want to accomplish today?' }]);
  };

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontWeight: 950, fontSize: 28 }}>Chat Assistant</div>
          <div className="muted" style={{ marginTop: 6 }}>Context-aware productivity help from your saved tasks.</div>
        </div>
        <Button variant="ghost" onClick={reset}>New chat</Button>
      </div>

      {error ? <div className="badge" style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,.35)' }}>{error}</div> : null}

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 18, alignItems: 'start' }}>
        <Card style={{ padding: 16 }}>
          <div style={{ fontWeight: 900 }}>History</div>
          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
            {conversations.length ? conversations.map((c) => (
              <button key={c.id} className="btn btnGhost" onClick={() => openConversation(c.id)} style={{ justifyContent: 'flex-start' }}>
                {(c.lastUserMessage || 'Conversation').slice(0, 42)}
              </button>
            )) : <div className="muted">No saved chats yet.</div>}
          </div>
        </Card>

        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ height: 560, display: 'flex', flexDirection: 'column' }}>
            <div ref={listRef} style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.map((m, idx) => (
                <div key={idx} style={{ display: 'flex' }}>
                  <div style={{ ...bubbleStyles(m.role), padding: 12, borderRadius: 16, maxWidth: 760 }}>
                    <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 12, color: 'var(--muted)' }}>{m.role === 'user' ? 'You' : 'Planora AI'}</div>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{m.text}</div>
                  </div>
                </div>
              ))}
              {isThinking ? <div className="muted">Planora AI is thinking...</div> : null}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', padding: 14 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={2}
                  className="input"
                  placeholder="Ask for planning, focus, or study help"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      onSend();
                    }
                  }}
                />
                <Button variant="primary" onClick={onSend} disabled={isThinking}>Send</Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
