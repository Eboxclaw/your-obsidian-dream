import { create } from 'zustand';
import type {
  Note,
  KanbanBoard,
  KanbanCard,
  UIState,
  ViewMode,
  OnboardingState,
  UserRole,
  AgentConfig,
  AgentSkill,
  AgentRole,
  AgentSession,
  AgentMessage,
  Folder,
  CustomTemplate,
} from '@/lib/types';
import * as tc from '@/lib/tauriClient';
import * as cryptoClient from '@/lib/crypto';

const createId = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const DEV_BOOTSTRAP_MODE = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEV_BOOTSTRAP === 'true';

type BackendHydrationSnapshot = {
  notes: Note[];
  folders: Folder[];
  boards: KanbanBoard[];
  agents: AgentConfig[];
  sessions: AgentSession[];
  vaultStatus: { initialized: boolean; unlocked: boolean; biometricAvailable: boolean };
};

type HydrationSnapshot = BackendHydrationSnapshot & {
  diagnosticsMode: 'backend-only' | 'dev-bootstrap';
  fallbackDataActive: boolean;
};

const DEFAULT_AGENTS: AgentConfig[] = [
  { id: 'assistant', name: 'General Assistant', description: 'Helps with notes, tasks, and brainstorming', model: 'LFM2-350M-Extract', skillIds: [], roleIds: [], icon: 'bot', active: true },
  { id: 'researcher', name: 'Research Agent', description: 'Summarizes and analyzes your notes', model: 'LFM2-350M-Extract', skillIds: [], roleIds: [], icon: 'search', active: true },
];

const DEFAULT_SESSIONS: AgentSession[] = [
  {
    id: 'session-1',
    title: 'Session 1',
    messages: [
      { id: 'welcome-msg', role: 'agent', text: "Hey! I can help you create notes, tasks, or just chat. What would you like to do?", timestamp: now() },
    ],
  },
];

const DEFAULT_FOLDER: Folder = {
  id: 'default-folder',
  name: 'General',
  created: now(),
  parentId: null,
};

const WELCOME_NOTE: Note = {
  id: 'welcome-note',
  title: 'Welcome to ViBo',
  content: '# Welcome to ViBo\n\nYour private, local-first AI notebook.\n\n- **Notes** — write in Markdown, link with [[wikilinks]]\n- **Kanban** — track tasks across boards\n- **Graph** — visualize your knowledge\n- **Agents** — run local AI tasks\n',
  tags: ['welcome'],
  created: now(),
  modified: now(),
  parentId: null,
  isFolder: false,
  isPrivate: false,
  folderId: 'default-folder',
};

const DEFAULT_BOARD: KanbanBoard = {
  id: 'default-board',
  title: 'My Board',
  columns: [
    { id: 'col-todo', title: 'To Do', cardIds: [] },
    { id: 'col-progress', title: 'In Progress', cardIds: [] },
    { id: 'col-done', title: 'Done', cardIds: [] },
  ],
  created: now(),
  modified: now(),
  folderId: null,
};

const DEFAULT_CARDS: KanbanCard[] = [];

async function loadBackendHydrationSnapshot(): Promise<BackendHydrationSnapshot> {
  const [notes, folders, boards, agents, sessions, vaultStatus] = await Promise.all([
    tc.noteList(),
    tc.folderList(),
    tc.boardList(),
    tc.agentList(),
    tc.sessionList(),
    cryptoClient.vaultGetStatus(),
  ]);

  return {
    notes,
    folders,
    boards,
    agents,
    sessions,
    vaultStatus: vaultStatus !== null ? vaultStatus : { initialized: false, unlocked: false, biometricAvailable: false },
  };
}

function applyDevBootstrapSnapshot(snapshot: BackendHydrationSnapshot): HydrationSnapshot {
  if (!DEV_BOOTSTRAP_MODE) {
    return {
      ...snapshot,
      diagnosticsMode: 'backend-only',
      fallbackDataActive: false,
    };
  }

  const fallbackDataActive =
    snapshot.notes.length === 0
    || snapshot.folders.length === 0
    || snapshot.boards.length === 0
    || snapshot.agents.length === 0
    || snapshot.sessions.length === 0;

  return {
    notes: snapshot.notes.length > 0 ? snapshot.notes : [WELCOME_NOTE],
    folders: snapshot.folders.length > 0 ? snapshot.folders : [DEFAULT_FOLDER],
    boards: snapshot.boards.length > 0 ? snapshot.boards : [DEFAULT_BOARD],
    agents: snapshot.agents.length > 0 ? snapshot.agents : DEFAULT_AGENTS,
    sessions: snapshot.sessions.length > 0 ? snapshot.sessions : DEFAULT_SESSIONS,
    vaultStatus: snapshot.vaultStatus,
    diagnosticsMode: 'dev-bootstrap',
    fallbackDataActive,
  };
}

function logHydrationInvariant(snapshot: HydrationSnapshot): void {
  if (snapshot.fallbackDataActive) {
    console.warn('[store] Dev bootstrap fallback data is active.');
  }
}


// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

interface AppStore {
  // Hydration
  hydrated: boolean;
  hydrate: () => Promise<void>;

  // Folders
  folders: Folder[];
  addFolder: (name: string, parentId?: string | null) => Promise<Folder | null>;
  renameFolder: (id: string, name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;

  // Notes
  notes: Note[];
  addNote: (title: string, parentId?: string | null, isPrivate?: boolean) => Promise<Note | null>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  getNoteById: (id: string) => Note | undefined;
  getNoteByTitle: (title: string) => Note | undefined;

  // Kanban
  boards: KanbanBoard[];
  cards: KanbanCard[];
  addBoard: (title: string) => Promise<KanbanBoard | null>;
  addCard: (boardId: string, columnId: string, title: string) => Promise<KanbanCard | null>;
  updateCard: (id: string, updates: Partial<KanbanCard>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  moveCard: (cardId: string, fromColId: string, toColId: string, newIndex: number) => Promise<void>;
  addColumn: (boardId: string, title: string) => void;
  deleteColumn: (boardId: string, columnId: string) => void;
  renameColumn: (boardId: string, columnId: string, title: string) => void;

  // Agents
  agents: AgentConfig[];
  skills: AgentSkill[];
  roles: AgentRole[];
  agentSessions: AgentSession[];
  addAgent: (name: string, description: string, model?: string, skillIds?: string[], roleIds?: string[]) => void;
  updateAgent: (id: string, updates: Partial<AgentConfig>) => void;
  toggleAgent: (id: string) => void;
  removeAgent: (id: string) => void;
  addSkill: (name: string, description: string) => void;
  removeSkill: (id: string) => void;
  addRole: (name: string, description: string) => void;
  removeRole: (id: string) => void;
  addAgentSession: () => AgentSession;
  removeAgentSession: (id: string) => void;
  addMessageToSession: (sessionId: string, msg: AgentMessage) => void;

  // Custom Templates
  customTemplates: CustomTemplate[];
  addCustomTemplate: (template: Omit<CustomTemplate, 'id' | 'created'>) => CustomTemplate;
  updateCustomTemplate: (id: string, updates: Partial<CustomTemplate>) => void;
  deleteCustomTemplate: (id: string) => void;

  // UI
  ui: UIState;
  setView: (view: ViewMode) => void;
  navigate: (view: ViewMode) => void;
  setActiveNote: (id: string | null) => void;
  setActiveBoard: (id: string | null) => void;
  setActiveFolder: (id: string | null) => void;
  toggleInspector: () => void;
  toggleCommandPalette: () => void;
  toggleSidebar: () => void;
  toggleFab: () => void;
  toggleInlineAgent: () => void;
  setActiveAgentSession: (id: string | null) => void;
  setNotesTab: (tab: 'all' | 'private') => void;

  // Vault
  vaultStatus: { initialized: boolean; unlocked: boolean; biometricAvailable: boolean };
  refreshVaultStatus: () => Promise<void>;
  unlockWithPin: (pin: string) => Promise<boolean>;
  unlockWithBiometric: () => Promise<boolean>;
  lockVault: () => Promise<boolean>;

  // Onboarding
  onboarding: OnboardingState;
  setOnboarding: (data: Partial<OnboardingState>) => void;
  completeOnboarding: () => void;
  resetAllData: () => Promise<boolean>;
}

export const useStore = create<AppStore>()(
  (set, get) => ({
    // -----------------------------------------------------------------
    // Hydration — load all data from Rust on mount
    // -----------------------------------------------------------------
    hydrated: false,

    hydrate: async () => {
      const backendSnapshot = await loadBackendHydrationSnapshot();
      const hydrationSnapshot = applyDevBootstrapSnapshot(backendSnapshot);
      logHydrationInvariant(hydrationSnapshot);

      set((s) => ({
        hydrated: true,
        notes: hydrationSnapshot.notes,
        folders: hydrationSnapshot.folders,
        boards: hydrationSnapshot.boards,
        agents: hydrationSnapshot.agents,
        agentSessions: hydrationSnapshot.sessions,
        vaultStatus: hydrationSnapshot.vaultStatus,
        ui: {
          ...s.ui,
          activeBoardId: hydrationSnapshot.boards[0] ? hydrationSnapshot.boards[0].id : null,
          activeAgentSessionId: hydrationSnapshot.sessions[0] ? hydrationSnapshot.sessions[0].id : null,
          diagnosticsMode: hydrationSnapshot.diagnosticsMode,
          fallbackDataActive: hydrationSnapshot.fallbackDataActive,
        },
      }));
    },

    // -----------------------------------------------------------------
    // Folders
    // -----------------------------------------------------------------
    folders: [],

    addFolder: async (name, parentId = null) => {
      try {
        const created = await tc.folderCreate(name, parentId);
        if (!created) {
          if (!DEV_BOOTSTRAP_MODE) return null;
        }
        const folder = created || { id: createId(), name, created: now(), parentId: parentId || null };
        set((s) => ({ folders: [...s.folders, folder] }));
        return folder;
      } catch (error) {
        console.error('addFolder failed', error);
        return null;
      }
    },

    renameFolder: async (id, name) => {
      try {
        const ok = await tc.folderRename(id, name);
        if (ok || DEV_BOOTSTRAP_MODE) {
          set((s) => ({ folders: s.folders.map((f) => (f.id === id ? { ...f, name } : f)) }));
        }
      } catch (error) {
        console.error('renameFolder failed', error);
      }
    },

    deleteFolder: async (id) => {
      try {
        const ok = await tc.folderDelete(id);
        if (ok || DEV_BOOTSTRAP_MODE) {
          set((s) => ({
            folders: s.folders.filter((f) => f.id !== id),
            notes: s.notes.map((n) => (n.folderId === id ? { ...n, folderId: null } : n)),
            boards: s.boards.map((b) => (b.folderId === id ? { ...b, folderId: null } : b)),
            ui: s.ui.activeFolderId === id ? { ...s.ui, activeFolderId: null } : s.ui,
          }));
        }
      } catch (error) {
        console.error('deleteFolder failed', error);
      }
    },

    // -----------------------------------------------------------------
    // Notes
    // -----------------------------------------------------------------
    notes: [],

    addNote: async (title, parentId = null, isPrivate = false) => {
      const activeFolderId = get().ui.activeFolderId;
      try {
        const created = await tc.noteCreate(title, '', activeFolderId);
        if (!created) {
          if (!DEV_BOOTSTRAP_MODE) return null;
        }
        const note: Note = created || {
          id: createId(),
          title,
          content: '',
          tags: [],
          created: now(),
          modified: now(),
          parentId: parentId || null,
          isFolder: false,
          isPrivate,
          folderId: activeFolderId,
        };
        set((s) => ({ notes: [...s.notes, note] }));
        return note;
      } catch (error) {
        console.error('addNote failed', error);
        return null;
      }
    },

    updateNote: async (id, updates) => {
      try {
        const existing = get().notes.find((n) => n.id === id);
        if (!existing) return;
        const nextNote = { ...existing, ...updates, modified: now() };
        const saved = await tc.noteUpdate(id, nextNote.title, nextNote.content, nextNote.tags);
        if (saved || DEV_BOOTSTRAP_MODE) {
          set((s) => ({
            notes: s.notes.map((n) =>
              n.id === id ? nextNote : n
            ),
          }));
        }
      } catch (error) {
        console.error('updateNote failed', error);
      }
    },

    deleteNote: async (id) => {
      try {
        const ok = await tc.noteDelete(id);
        if (ok || DEV_BOOTSTRAP_MODE) {
          set((s) => ({
            notes: s.notes.filter((n) => n.id !== id),
            ui: s.ui.activeNoteId === id ? { ...s.ui, activeNoteId: null } : s.ui,
          }));
        }
      } catch (error) {
        console.error('deleteNote failed', error);
      }
    },

    getNoteById: (id) => get().notes.find((n) => n.id === id),
    getNoteByTitle: (title) =>
      get().notes.find((n) => n.title.toLowerCase() === title.toLowerCase()),

    // -----------------------------------------------------------------
    // Kanban
    // -----------------------------------------------------------------
    boards: [],
    cards: [],

    addBoard: async (title) => {
      const activeFolderId = get().ui.activeFolderId;
      try {
        const created = await tc.boardCreate(title, activeFolderId);
        if (!created) {
          if (!DEV_BOOTSTRAP_MODE) return null;
        }
        const board: KanbanBoard = created || {
          id: createId(),
          title,
          columns: [
            { id: createId(), title: 'To Do', cardIds: [] },
            { id: createId(), title: 'In Progress', cardIds: [] },
            { id: createId(), title: 'Done', cardIds: [] },
          ],
          created: now(),
          modified: now(),
          folderId: activeFolderId,
        };
        set((s) => ({ boards: [...s.boards, board] }));
        return board;
      } catch (error) {
        console.error('addBoard failed', error);
        return null;
      }
    },



    addCard: async (boardId, columnId, title) => {
      try {
        const created = await tc.cardCreate({ title, description: '', noteId: null, subtasks: [], columnId, boardId });
        if (!created) {
          if (!DEV_BOOTSTRAP_MODE) return null;
        }
        const card: KanbanCard = created || {
          id: createId(),
          title,
          description: '',
          noteId: null,
          subtasks: [],
          columnId,
          boardId,
          created: now(),
        };
        set((s) => ({
          cards: [...s.cards, card],
          boards: s.boards.map((b) =>
            b.id === boardId
              ? {
                  ...b,
                  modified: now(),
                  columns: b.columns.map((c) =>
                    c.id === columnId ? { ...c, cardIds: [...c.cardIds, card.id] } : c
                  ),
                }
              : b
          ),
        }));
        return card;
      } catch (error) {
        console.error('addCard failed', error);
        return null;
      }
    },

    updateCard: async (id, updates) => {
      try {
        const existing = get().cards.find((c) => c.id === id);
        if (!existing) return;
        const nextCard = { ...existing, ...updates };
        const saved = await tc.cardUpdate(nextCard);
        if (saved || DEV_BOOTSTRAP_MODE) {
          set((s) => ({
            cards: s.cards.map((c) => (c.id === id ? nextCard : c)),
          }));
        }
      } catch (error) {
        console.error('updateCard failed', error);
      }
    },

    deleteCard: async (id) => {
      try {
        const ok = await tc.cardDelete(id);
        if (ok || DEV_BOOTSTRAP_MODE) {
          set((s) => ({
            cards: s.cards.filter((c) => c.id !== id),
            boards: s.boards.map((b) => ({
              ...b,
              columns: b.columns.map((col) => ({
                ...col,
                cardIds: col.cardIds.filter((cId) => cId !== id),
              })),
            })),
          }));
        }
      } catch (error) {
        console.error('deleteCard failed', error);
      }
    },

    moveCard: async (cardId, fromColId, toColId, newIndex) => {
      try {
        const ok = await tc.cardMove(cardId, fromColId, toColId, newIndex);
        if (ok || DEV_BOOTSTRAP_MODE) {
          set((s) => ({
            cards: s.cards.map((c) =>
              c.id === cardId ? { ...c, columnId: toColId } : c
            ),
            boards: s.boards.map((b) => ({
              ...b,
              columns: b.columns.map((col) => {
                if (col.id === fromColId && col.id === toColId) {
                  const ids = col.cardIds.filter((id) => id !== cardId);
                  ids.splice(newIndex, 0, cardId);
                  return { ...col, cardIds: ids };
                }
                if (col.id === fromColId) {
                  return { ...col, cardIds: col.cardIds.filter((id) => id !== cardId) };
                }
                if (col.id === toColId) {
                  const ids = [...col.cardIds];
                  ids.splice(newIndex, 0, cardId);
                  return { ...col, cardIds: ids };
                }
                return col;
              }),
            })),
          }));
        }
      } catch (error) {
        console.error('moveCard failed', error);
      }
    },

    addColumn: (boardId, title) =>
      set((s) => ({
        boards: s.boards.map((b) =>
          b.id === boardId
            ? { ...b, columns: [...b.columns, { id: createId(), title, cardIds: [] }] }
            : b
        ),
      })),

    deleteColumn: (boardId, columnId) =>
      set((s) => ({
        boards: s.boards.map((b) =>
          b.id === boardId
            ? { ...b, columns: b.columns.filter((c) => c.id !== columnId) }
            : b
        ),
        cards: s.cards.filter(
          (c) => !(c.boardId === boardId && c.columnId === columnId)
        ),
      })),

    renameColumn: (boardId, columnId, title) =>
      set((s) => ({
        boards: s.boards.map((b) =>
          b.id === boardId
            ? {
                ...b,
                columns: b.columns.map((c) =>
                  c.id === columnId ? { ...c, title } : c
                ),
              }
            : b
        ),
      })),

    // -----------------------------------------------------------------
    // Agents
    // -----------------------------------------------------------------
    agents: DEV_BOOTSTRAP_MODE ? DEFAULT_AGENTS : [],
    skills: [],
    roles: [],
    agentSessions: DEV_BOOTSTRAP_MODE ? DEFAULT_SESSIONS : [],

    addAgent: (name, description, model = 'LFM2-350M-Extract', skillIds = [], roleIds = []) => {
      const agent: AgentConfig = { id: createId(), name, description, model, skillIds, roleIds, icon: 'bot', active: true };
      set((s) => ({ agents: [...s.agents, agent] }));
      tc.agentCreate({ name, description, model, skillIds, roleIds, icon: 'bot', active: true });
    },

    updateAgent: (id, updates) =>
      set((s) => ({
        agents: s.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      })),

    toggleAgent: (id) =>
      set((s) => ({
        agents: s.agents.map((a) => (a.id === id ? { ...a, active: !a.active } : a)),
      })),

    removeAgent: (id) => {
      tc.agentDelete(id);
      set((s) => ({ agents: s.agents.filter((a) => a.id !== id) }));
    },

    addSkill: (name, description) =>
      set((s) => ({ skills: [...s.skills, { id: createId(), name, description }] })),

    removeSkill: (id) =>
      set((s) => ({ skills: s.skills.filter((sk) => sk.id !== id) })),

    addRole: (name, description) =>
      set((s) => ({ roles: [...s.roles, { id: createId(), name, description }] })),

    removeRole: (id) =>
      set((s) => ({ roles: s.roles.filter((r) => r.id !== id) })),

    addAgentSession: () => {
      const session: AgentSession = {
        id: createId(),
        title: `Session ${get().agentSessions.length + 1}`,
        messages: [
          { id: createId(), role: 'agent', text: "Hey! How can I help you?", timestamp: now() },
        ],
      };
      set((s) => ({
        agentSessions: [...s.agentSessions, session].slice(-5),
        ui: { ...s.ui, activeAgentSessionId: session.id },
      }));
      tc.sessionCreate(session.title);
      return session;
    },

    removeAgentSession: (id) =>
      set((s) => {
        const remaining = s.agentSessions.filter((ss) => ss.id !== id);
        const firstId = remaining.length > 0 ? remaining[0].id : null;
        tc.sessionDelete(id);
        return {
          agentSessions: remaining,
          ui: s.ui.activeAgentSessionId === id
            ? { ...s.ui, activeAgentSessionId: firstId }
            : s.ui,
        };
      }),

    addMessageToSession: (sessionId, msg) =>
      set((s) => ({
        agentSessions: s.agentSessions.map((ss) =>
          ss.id === sessionId ? { ...ss, messages: [...ss.messages, msg] } : ss
        ),
      })),

    // -----------------------------------------------------------------
    // Custom Templates
    // -----------------------------------------------------------------
    customTemplates: [],

    addCustomTemplate: (template) => {
      const ct: CustomTemplate = { ...template, id: createId(), created: now() };
      set((s) => ({ customTemplates: [...s.customTemplates, ct] }));
      return ct;
    },

    updateCustomTemplate: (id, updates) =>
      set((s) => ({
        customTemplates: s.customTemplates.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      })),

    deleteCustomTemplate: (id) =>
      set((s) => ({ customTemplates: s.customTemplates.filter((t) => t.id !== id) })),

    // -----------------------------------------------------------------
    // UI (ephemeral, no persistence needed)
    // -----------------------------------------------------------------
    ui: {
      activeView: 'dashboard' as ViewMode,
      activeNoteId: null,
      activeBoardId: null,
      inspectorOpen: true,
      commandPaletteOpen: false,
      sidebarCollapsed: false,
      fabOpen: false,
      inlineAgentOpen: false,
      activeAgentSessionId: DEV_BOOTSTRAP_MODE ? 'session-1' : null,
      notesTab: 'all' as const,
      activeFolderId: null,
      diagnosticsMode: DEV_BOOTSTRAP_MODE ? 'dev-bootstrap' : 'backend-only',
      fallbackDataActive: false,
    },

    setView: (view) => set((s) => ({ ui: { ...s.ui, activeView: view } })),
    navigate: (view) => set((s) => ({ ui: { ...s.ui, activeView: view } })),
    setActiveNote: (id) => set((s) => ({ ui: { ...s.ui, activeNoteId: id } })),
    setActiveBoard: (id) => set((s) => ({ ui: { ...s.ui, activeBoardId: id } })),
    setActiveFolder: (id) => set((s) => ({ ui: { ...s.ui, activeFolderId: id } })),
    toggleInspector: () => set((s) => ({ ui: { ...s.ui, inspectorOpen: !s.ui.inspectorOpen } })),
    toggleCommandPalette: () => set((s) => ({ ui: { ...s.ui, commandPaletteOpen: !s.ui.commandPaletteOpen } })),
    toggleSidebar: () => set((s) => ({ ui: { ...s.ui, sidebarCollapsed: !s.ui.sidebarCollapsed } })),
    toggleFab: () => set((s) => ({ ui: { ...s.ui, fabOpen: !s.ui.fabOpen } })),
    toggleInlineAgent: () => set((s) => ({ ui: { ...s.ui, inlineAgentOpen: !s.ui.inlineAgentOpen } })),
    setActiveAgentSession: (id) => set((s) => ({ ui: { ...s.ui, activeAgentSessionId: id } })),
    setNotesTab: (tab) => set((s) => ({ ui: { ...s.ui, notesTab: tab } })),

    // -----------------------------------------------------------------
    // Vault
    // -----------------------------------------------------------------
    vaultStatus: { initialized: false, unlocked: false, biometricAvailable: false },

    refreshVaultStatus: async () => {
      const status = await cryptoClient.vaultGetStatus();
      if (status !== null) {
        set(() => ({ vaultStatus: status }));
      }
    },

    unlockWithPin: async (pin) => {
      const ok = await cryptoClient.vaultUnlock(pin);
      const status = await cryptoClient.vaultGetStatus();
      if (status !== null) {
        set(() => ({ vaultStatus: status }));
      }
      return ok;
    },

    unlockWithBiometric: async () => {
      const ok = await cryptoClient.biometricUnlock();
      const status = await cryptoClient.vaultGetStatus();
      if (status !== null) {
        set(() => ({ vaultStatus: status }));
      }
      return ok;
    },

    lockVault: async () => {
      const ok = await cryptoClient.vaultLock();
      const status = await cryptoClient.vaultGetStatus();
      if (status !== null) {
        set(() => ({ vaultStatus: status }));
      }
      return ok;
    },

    // -----------------------------------------------------------------
    // Onboarding
    // -----------------------------------------------------------------
    onboarding: {
      completed: false,
      step: 0,
      role: null,
      name: '',
      workspaceName: 'My Vault',
      theme: 'dark' as const,
      features: ['wikilinks', 'kanban', 'graph'],
    },

    setOnboarding: (data) =>
      set((s) => ({
        onboarding: { ...s.onboarding, ...data, completed: true },
      })),

    completeOnboarding: () =>
      set((s) => ({
        onboarding: { ...s.onboarding, completed: true },
      })),

    resetAllData: async () => {
      const resetOk = await tc.storageResetAll();
      if (!resetOk) {
        return false;
      }

      set((s) => ({
        notes: DEV_BOOTSTRAP_MODE ? [WELCOME_NOTE] : [],
        folders: DEV_BOOTSTRAP_MODE ? [DEFAULT_FOLDER] : [],
        boards: DEV_BOOTSTRAP_MODE ? [DEFAULT_BOARD] : [],
        cards: DEFAULT_CARDS,
        agents: DEV_BOOTSTRAP_MODE ? DEFAULT_AGENTS : [],
        agentSessions: DEV_BOOTSTRAP_MODE ? DEFAULT_SESSIONS : [],
        customTemplates: [],
        ui: {
          ...s.ui,
          activeView: 'dashboard',
          activeNoteId: null,
          activeBoardId: DEV_BOOTSTRAP_MODE ? 'default-board' : null,
          activeFolderId: null,
          activeAgentSessionId: DEV_BOOTSTRAP_MODE ? 'session-1' : null,
          diagnosticsMode: DEV_BOOTSTRAP_MODE ? 'dev-bootstrap' : 'backend-only',
          fallbackDataActive: DEV_BOOTSTRAP_MODE,
        },
      }));

      return true;
    },
  })
);
