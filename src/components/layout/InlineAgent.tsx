import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Bot, Send, X, Plus, WifiOff } from 'lucide-react';

function generateResponse(input: string, noteCount: number): string {
  const lower = input.toLowerCase();
  if (lower.includes('summarize') || lower.includes('summary'))
    return `You have **${noteCount} notes** in your vault. I can help you organize and summarize them.`;
  if (lower.includes('note') || lower.includes('create a new note'))
    return "I can help you create a note! Use the **+** button or tell me what you'd like to write about.";
  if (lower.includes('task') || lower.includes('create a new task'))
    return "Ready to create a task! Head to the **Tasks** tab or I can set one up for you.";
  return "I'm your local assistant. I can help with notes, tasks, brainstorming, and more. What would you like to do?";
}

export function InlineAgent() {
  const {
    ui, notes, agentSessions,
    toggleInlineAgent, addAgentSession, removeAgentSession,
    setActiveAgentSession, addMessageToSession,
  } = useStore();

  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const session = agentSessions.find((s) => s.id === ui.activeAgentSessionId) ?? agentSessions[0];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [session?.messages.length]);

  // Auto-focus input when agent opens, and apply pending action
  useEffect(() => {
    if (ui.inlineAgentOpen) {
      setTimeout(() => {
        if (pendingAction) {
          setInput(pendingAction);
          setPendingAction(null);
        }
        inputRef.current?.focus();
      }, 100);
    }
  }, [ui.inlineAgentOpen, pendingAction]);

  const handleSend = (text?: string) => {
    const msg = text || input.trim();
    if (!msg || !session || isThinking) return;
    const userMsg = { id: crypto.randomUUID(), role: 'user' as const, text: msg, timestamp: new Date().toISOString() };
    addMessageToSession(session.id, userMsg);
    setInput('');
    setIsThinking(true);

    setTimeout(() => {
      const response = generateResponse(msg, notes.length);
      addMessageToSession(session.id, {
        id: crypto.randomUUID(),
        role: 'agent',
        text: response,
        timestamp: new Date().toISOString(),
      });
      setIsThinking(false);
    }, 500 + Math.random() * 600);
  };

  const handleQuickAction = (action: string) => {
    if (!ui.inlineAgentOpen) {
      setPendingAction(action);
      toggleInlineAgent();
    } else {
      setInput(action);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  if (!ui.inlineAgentOpen) {
    return (
      <div className="shrink-0 border-t bg-card">
        <button
          onClick={toggleInlineAgent}
          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left aether-transition hover:bg-surface-hover"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
            <Bot className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="flex-1 text-sm text-muted-foreground">Ask assistant...</span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <WifiOff className="h-3 w-3" />
            Offline
          </span>
        </button>
        {/* Quick actions when collapsed */}
        <div className="flex gap-1.5 px-4 pb-2">
          <button
            onClick={() => handleQuickAction('Create a new note')}
            className="rounded-full border px-2.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground aether-transition"
          >
            New Note
          </button>
          <button
            onClick={() => handleQuickAction('Create a new task')}
            className="rounded-full border px-2.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground aether-transition"
          >
            New Task
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="shrink-0 flex flex-col border-t bg-card" style={{ maxHeight: '50vh' }}>
      {/* Session tabs */}
      <div className="flex items-center gap-1 border-b px-3 py-1.5 overflow-x-auto">
        {agentSessions.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setActiveAgentSession(s.id)}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium shrink-0 aether-transition ${
              s.id === session?.id
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>{i + 1}</span>
            {agentSessions.length > 1 && (
              <X
                className="h-2.5 w-2.5 opacity-50 hover:opacity-100"
                onClick={(e) => { e.stopPropagation(); removeAgentSession(s.id); }}
              />
            )}
          </button>
        ))}
        {agentSessions.length < 5 && (
          <button
            onClick={() => addAgentSession()}
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground aether-transition"
          >
            <Plus className="h-3 w-3" />
          </button>
        )}
        <div className="ml-auto">
          <button onClick={toggleInlineAgent} className="text-muted-foreground hover:text-foreground p-1">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-auto px-4 py-3 space-y-2.5" style={{ minHeight: 120 }}>
        {session?.messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              {msg.text.split(/(\*\*.*?\*\*)/).map((part, j) =>
                part.startsWith('**') && part.endsWith('**') ? (
                  <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>
                ) : (
                  <span key={j}>{part}</span>
                )
              )}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex justify-start">
            <div className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
              Thinking…
            </div>
          </div>
        )}
      </div>

      {/* Input + chips */}
      <div className="border-t px-3 py-2">
        <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2 focus-within:border-foreground/30 aether-transition">
          <Bot className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            disabled={isThinking}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isThinking}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-30 aether-transition"
          >
            <Send className="h-3 w-3" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-1.5 px-1">
          <div className="flex gap-1.5">
            <button
              onClick={() => handleQuickAction('Create a new note')}
              className="rounded-full border px-2.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground aether-transition"
            >
              New Note
            </button>
            <button
              onClick={() => handleQuickAction('Create a new task')}
              className="rounded-full border px-2.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground aether-transition"
            >
              New Task
            </button>
          </div>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <WifiOff className="h-2.5 w-2.5" />
            Offline
          </span>
        </div>
      </div>
    </div>
  );
}
