import { useState, useEffect } from "react";
import { DashboardView } from "@/components/DashboardView";
import { NotebookView } from "@/components/NotebookView";
import { KanbanView } from "@/components/KanbanView";
import { KnowledgeGraph } from "@/components/KnowledgeGraph";
import { SettingsView } from "@/components/SettingsView";
import { AgentsView } from "@/components/AgentsView";
import { ChatAssistant } from "@/components/ChatAssistant";
import { CommandPalette } from "@/components/CommandPalette";
import { BottomNav } from "@/components/BottomNav";
import { NewNoteDialog } from "@/components/NewNoteDialog";
import { LockScreen } from "@/components/LockScreen";
import { OnboardingWizard, isOnboardingDone } from "@/components/OnboardingWizard";
import type { OnboardingConfig } from "@/components/OnboardingWizard";
import { StoreProvider, useStore } from "@/lib/store";
import { getEncryptedNotes, decryptData } from "@/lib/crypto";
import { Plus, MessageCircle, X } from "lucide-react";
import logo from "@/assets/logo.svg";
import type { Note } from "@/lib/types";

function WorkspaceContent() {
  const { activeView } = useStore();
  const [newNoteOpen, setNewNoteOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Default to light mode; user can switch to dark in settings
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  return (
    <div className="h-[100dvh] flex flex-col w-full bg-background">
      {/* Top bar */}
      <header className="h-11 flex items-center border-b border-border px-3 gap-2 bg-card/60 backdrop-blur-xl shrink-0 shadow-ambient safe-area-top">
        <img src={logo} alt="ViBo AI" className="h-6 w-6" />
        <span className="text-sm font-bold text-foreground tracking-tight">ViBo AI</span>
        <div className="ml-auto flex items-center gap-1">
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground tracking-wider">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Local · Private
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden relative">
        {activeView === "dashboard" && <DashboardView />}
        {activeView === "notebook" && <NotebookView />}
        {activeView === "kanban" && <KanbanView />}
        {activeView === "graph" && <KnowledgeGraph />}
        {activeView === "settings" && <SettingsView />}
        {activeView === "agents" && <AgentsView />}

        {/* Floating new note button */}
        <button
          onClick={() => setNewNoteOpen(true)}
          className={`absolute right-4 z-40 h-12 w-12 rounded-full bg-foreground text-background shadow-floating hover:opacity-90 transition-all hover:scale-105 flex items-center justify-center ${
            chatOpen ? "bottom-[340px]" : "bottom-4"
          }`}
        >
          <Plus className="h-5 w-5" />
        </button>
      </main>

      {/* Persistent Chat Assistant */}
      <div className={`shrink-0 border-t border-border bg-card/60 backdrop-blur-xl transition-all duration-300 overflow-hidden ${
        chatOpen ? "h-[320px]" : "h-10"
      }`}>
        {!chatOpen ? (
          <button
            onClick={() => setChatOpen(true)}
            className="w-full h-10 flex items-center gap-2 px-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs font-medium">Ask assistant...</span>
          </button>
        ) : (
          <div className="h-full flex flex-col">
            <button
              onClick={() => setChatOpen(false)}
              className="flex items-center justify-between px-4 h-8 shrink-0 text-muted-foreground hover:text-foreground"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest">Assistant</span>
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="flex-1 min-h-0">
              <ChatAssistant compact />
            </div>
          </div>
        )}
      </div>

      <BottomNav />
      <CommandPalette />
      <NewNoteDialog open={newNoteOpen} onOpenChange={setNewNoteOpen} />
    </div>
  );
}

const Index = () => {
  const [phase, setPhase] = useState<"onboarding" | "lock" | "app">("onboarding");
  const [pin, setPin] = useState("");
  const [initialNotes, setInitialNotes] = useState<Note[]>([]);

  useEffect(() => {
    if (isOnboardingDone()) {
      setPhase("lock");
    }
  }, []);

  const handleOnboardingComplete = (_config: OnboardingConfig) => {
    setPhase("lock");
  };

  const handleUnlock = async (enteredPin: string) => {
    setPin(enteredPin);
    const encrypted = getEncryptedNotes();
    if (encrypted) {
      try {
        const decrypted = await decryptData(encrypted, enteredPin);
        setInitialNotes(JSON.parse(decrypted));
      } catch {
        setInitialNotes([]);
      }
    } else {
      setInitialNotes([]);
    }
    setPhase("app");
  };

  if (phase === "onboarding") {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  if (phase === "lock") {
    return <LockScreen onUnlock={handleUnlock} />;
  }

  return (
    <StoreProvider pin={pin} initialNotes={initialNotes}>
      <WorkspaceContent />
    </StoreProvider>
  );
};

export default Index;
