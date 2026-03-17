import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store';
import { Bot, Send, Sparkles, FileText, Columns3, Lightbulb, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: string;
}

const SUGGESTIONS = [
  { label: 'Summarize my recent notes', icon: FileText },
  { label: 'Create a project plan', icon: Columns3 },
  { label: 'Suggest connections between notes', icon: Sparkles },
  { label: 'Help me brainstorm', icon: Lightbulb },
];

function generateAgentResponse(input: string, notes: { title: string }[]): string {
  const lower = input.toLowerCase();
  if (lower.includes('summarize') || lower.includes('summary')) {
    if (notes.length === 0) return "You don't have any notes yet. Create some notes and I can help summarize them.";
    return `You have **${notes.length} notes** in your vault. Here's a quick overview:\n\n${notes.slice(0, 5).map((n, i) => `${i + 1}. **${n.title}**`).join('\n')}\n\n${notes.length > 5 ? `...and ${notes.length - 5} more.` : ''}\n\nWould you like me to dive deeper into any of these?`;
  }
  if (lower.includes('project plan') || lower.includes('plan')) {
    return "I'd suggest creating a **Kanban board** with these columns:\n\n1. **Planning** — Define scope and requirements\n2. **In Progress** — Active work items\n3. **Review** — Items awaiting feedback\n4. **Done** — Completed tasks\n\nWould you like me to help you set this up? You can create a board from the **Kanban** view using a template.";
  }
  if (lower.includes('connect') || lower.includes('link')) {
    return "To find connections between notes, try using **[[wikilinks]]** in your notes. Type `[[` in the editor to search and link to other notes. You can also check the **Graph View** to visualize all connections.\n\nThe **Inspector** panel shows backlinks — notes that reference the current note.";
  }
  if (lower.includes('brainstorm')) {
    return "Let's brainstorm! Here's a framework:\n\n1. **Define the problem** — What are you trying to solve?\n2. **Diverge** — Generate as many ideas as possible\n3. **Converge** — Group and evaluate ideas\n4. **Refine** — Pick the top 3 and flesh them out\n\nTry creating a note from the **Brainstorm** template to get started. What topic should we explore?";
  }
  return `I can help you with:\n\n- **Summarizing notes** — Get an overview of your vault\n- **Project planning** — Set up boards and workflows\n- **Finding connections** — Discover links between ideas\n- **Brainstorming** — Structured idea generation\n\nWhat would you like to explore?`;
}

export function AgentView() {
  const { notes } = useStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'agent',
      text: "Hi! I'm your ViBo assistant. I can help you organize notes, plan projects, and find connections in your vault. What would you like to do?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim() || isThinking) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setIsThinking(true);

    // Simulate agent thinking
    setTimeout(() => {
      const response = generateAgentResponse(text, notes);
      const agentMsg: Message = {
        id: crypto.randomUUID(),
        role: 'agent',
        text: response,
        timestamp: new Date().toISOString(),
      };
      setMessages((m) => [...m, agentMsg]);
      setIsThinking(false);
    }, 600 + Math.random() * 800);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
          <Bot className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-medium text-foreground">Agent</h2>
          <p className="text-[10px] text-muted-foreground">Local assistant · No data leaves your device</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-auto px-4 py-4">
        <div className="mx-auto max-w-xl space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface text-foreground border'
                }`}
              >
                {msg.text.split('\n').map((line, i) => (
                  <p key={i} className={i > 0 ? 'mt-1' : ''}>
                    {line.split(/(\*\*.*?\*\*)/).map((part, j) =>
                      part.startsWith('**') && part.endsWith('**') ? (
                        <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>
                      ) : (
                        <span key={j}>{part}</span>
                      )
                    )}
                  </p>
                ))}
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-lg border bg-surface px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Thinking…
              </div>
            </div>
          )}
        </div>

        {/* Suggestions (only if 1 message) */}
        {messages.length <= 1 && (
          <div className="mx-auto mt-6 max-w-xl">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Suggestions
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => sendMessage(s.label)}
                  className="flex items-center gap-2 rounded-md border bg-surface px-3 py-2.5 text-left text-xs text-foreground hover:bg-surface-hover aether-transition"
                >
                  <s.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t px-4 py-3">
        <div className="mx-auto flex max-w-xl items-center gap-2 rounded-md border bg-surface px-3 py-2 focus-within:border-primary aether-transition">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder="Ask anything…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            disabled={isThinking}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isThinking}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30 aether-transition"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
