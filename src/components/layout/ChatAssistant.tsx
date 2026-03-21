import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { Bot, Send } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useStream, listenToProviderStream } from '@/lib/lfm';
import { agentProcess } from '@/lib/leapClient';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export function ChatAssistant() {
  const { ui, toggleInlineAgent } = useStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [mode, setMode] = useState<'local' | 'cloud'>('local');
  const [statusText, setStatusText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let unlistenLocal: (() => void) | null = null;
    let unlistenCloud: (() => void) | null = null;

    const setup = async () => {
      try {
        unlistenLocal = await useStream({
          onDelta: (token) => {
            setMessages((prev) => {
              if (prev.length === 0 || prev[prev.length - 1].role !== 'assistant') {
                return [...prev, { id: crypto.randomUUID(), role: 'assistant', text: token }];
              }
              const last = prev[prev.length - 1];
              const updated = [...prev.slice(0, prev.length - 1), { ...last, text: last.text + token }];
              return updated;
            });
          },
          onDone: () => {
            setStreaming(false);
            setStatusText('');
          },
          onError: (error) => {
            setStreaming(false);
            setStatusText(error);
          },
        });

        unlistenCloud = await listenToProviderStream({
          onDelta: (token) => {
            setMessages((prev) => {
              if (prev.length === 0 || prev[prev.length - 1].role !== 'assistant') {
                return [...prev, { id: crypto.randomUUID(), role: 'assistant', text: token }];
              }
              const last = prev[prev.length - 1];
              const updated = [...prev.slice(0, prev.length - 1), { ...last, text: last.text + token }];
              return updated;
            });
          },
          onDone: () => {
            setStreaming(false);
            setStatusText('');
          },
          onError: (error) => {
            setStreaming(false);
            setStatusText(error);
          },
        });
      } catch (err) {
        setStatusText(err instanceof Error ? err.message : 'Unable to connect stream listeners.');
      }
    };

    setup();

    return () => {
      if (unlistenLocal) {
        unlistenLocal();
      }
      if (unlistenCloud) {
        unlistenCloud();
      }
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, streaming]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || streaming) {
      return;
    }
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', text: trimmed }]);
    setInput('');
    setStreaming(true);
    setStatusText(mode === 'local' ? '🤖 Thinking locally...' : '🔒 Scrubbing personal data...');

    try {
      const ok = await agentProcess(trimmed);
      if (!ok) {
        setStreaming(false);
        setStatusText('Agent process was not accepted by backend.');
      }
    } catch (err) {
      setStreaming(false);
      setStatusText(err instanceof Error ? err.message : 'Unable to send message.');
    }
  };

  return (
    <Sheet open={ui.inlineAgentOpen} onOpenChange={() => toggleInlineAgent()}>
      <SheetContent side="bottom" className="h-[72vh] rounded-t-2xl border px-0">
        <SheetHeader className="border-b px-4 pb-3">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Bot className="h-4 w-4" />
            Chat Assistant
          </SheetTitle>
        </SheetHeader>

        <div ref={scrollRef} className="h-[calc(72vh-145px)] overflow-auto px-4 py-3 space-y-2">
          {messages.map((msg) => (
            <div key={msg.id} className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div className={msg.role === 'user' ? 'max-w-[80%] rounded-xl bg-primary px-3 py-2 text-xs text-primary-foreground' : 'max-w-[80%] rounded-xl bg-muted px-3 py-2 text-xs text-foreground'}>
                {msg.text}
              </div>
            </div>
          ))}
          {statusText ? <p className="text-[11px] text-muted-foreground">{statusText}</p> : null}
        </div>

        <div className="border-t px-4 py-3">
          <div className="mb-2 flex gap-2">
            <button onClick={() => setMode('local')} className={mode === 'local' ? 'rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium' : 'rounded-full border px-2.5 py-1 text-[10px]'}>Local</button>
            <button onClick={() => setMode('cloud')} className={mode === 'cloud' ? 'rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium' : 'rounded-full border px-2.5 py-1 text-[10px]'}>Cloud</button>
          </div>
          <div className="flex items-center gap-2 rounded-xl border px-3 py-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSend();
                }
              }}
              placeholder="Send a message"
              className="flex-1 bg-transparent text-sm outline-none"
            />
            <button onClick={handleSend} className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground" disabled={streaming}>
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
