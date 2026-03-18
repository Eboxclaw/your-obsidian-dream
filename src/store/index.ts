import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Note, KanbanBoard, KanbanCard, UIState, ViewMode, OnboardingState, UserRole, AgentConfig, AgentSkill, AgentRole, AgentSession, AgentMessage, Folder, CustomTemplate } from '@/types';

const createId = () => crypto.randomUUID();
const now = () => new Date().toISOString();

const WELCOME_NOTE: Note = {
  id: 'welcome',
  title: 'Welcome to ViBo',
  content: `# Welcome to ViBo\n\nYour second brain starts here. This is a **markdown-first** notebook with wikilinks, backlinks, and kanban boards.\n\n## Getting Started\n\n- Create notes with \`Cmd+N\`\n- Open command palette with \`Cmd+K\`\n- Link notes with \`[[wikilinks]]\`\n- Organize work on the Kanban board\n\n> "The mind is not a vessel to be filled, but a fire to be kindled."\n`,
  tags: ['getting-started'],
  created: now(),
  modified: now(),
  parentId: null,
  isFolder: false,
  isPrivate: false,
  folderId: null,
};

const DEFAULT_BOARD: KanbanBoard = {
  id: 'default-board',
  title: 'Project Board',
  columns: [
    { id: 'col-todo', title: 'To Do', cardIds: ['card-1'] },
    { id: 'col-progress', title: 'In Progress', cardIds: [] },
    { id: 'col-done', title: 'Done', cardIds: [] },
  ],
  created: now(),
  modified: now(),
  folderId: null,
};

const DEFAULT_CARDS: KanbanCard[] = [
  {
    id: 'card-1',
    title: 'Explore ViBo features',
    description: 'Try creating notes, linking them, and using the kanban board.',
    noteId: 'welcome',
    subtasks: [
      { id: 'st-1', text: 'Create a new note', done: false },
      { id: 'st-2', text: 'Try wikilinks', done: false },
      { id: 'st-3', text: 'Move a kanban card', done: false },
    ],
    columnId: 'col-todo',
    boardId: 'default-board',
    created: now(),
  },
];

const DEFAULT_AGENTS: AgentConfig[] = [
  { id: 'assistant', name: 'General Assistant', description: 'Helps with notes, tasks, and brainstorming', model: 'gpt-4o', skillIds: [], roleIds: [], icon: 'bot', active: true },
  { id: 'researcher', name: 'Research Agent', description: 'Summarizes and analyzes your notes', model: 'gpt-4o', skillIds: [], roleIds: [], icon: 'search', active: true },
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
  name: 'My Vault',
  created: now(),
  parentId: null,
};

interface AppStore {
  // Folders
  folders: Folder[];
  addFolder: (name: string, parentId?: string | null) => Folder;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;

  // Notes
  notes: Note[];
  addNote: (title: string, parentId?: string | null, isPrivate?: boolean) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  getNoteById: (id: string) => Note | undefined;
  getNoteByTitle: (title: string) => Note | undefined;

  // Kanban
  boards: KanbanBoard[];
  cards: KanbanCard[];
  addBoard: (title: string) => KanbanBoard;
  addCard: (boardId: string, columnId: string, title: string) => KanbanCard;
  updateCard: (id: string, updates: Partial<KanbanCard>) => void;
  deleteCard: (id: string) => void;
  moveCard: (cardId: string, fromColId: string, toColId: string, newIndex: number) => void;
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

  // Onboarding
  onboarding: OnboardingState;
  setOnboarding: (data: Partial<OnboardingState>) => void;
  completeOnboarding: () => void;
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Folders
      folders: [DEFAULT_FOLDER],

      addFolder: (name, parentId = null) => {
        const folder: Folder = { id: createId(), name, created: now(), parentId };
        set((s) => ({ folders: [...s.folders, folder] }));
        return folder;
      },

      renameFolder: (id, name) =>
        set((s) => ({ folders: s.folders.map((f) => (f.id === id ? { ...f, name } : f)) })),

      deleteFolder: (id) =>
        set((s) => ({
          folders: s.folders.filter((f) => f.id !== id),
          notes: s.notes.map((n) => (n.folderId === id ? { ...n, folderId: null } : n)),
          boards: s.boards.map((b) => (b.folderId === id ? { ...b, folderId: null } : b)),
          ui: s.ui.activeFolderId === id ? { ...s.ui, activeFolderId: null } : s.ui,
        })),

      // Notes
      notes: [WELCOME_NOTE],

      addNote: (title, parentId = null, isPrivate = false) => {
        const activeFolderId = get().ui.activeFolderId;
        const note: Note = {
          id: createId(),
          title,
          content: '',
          tags: [],
          created: now(),
          modified: now(),
          parentId,
          isFolder: false,
          isPrivate,
          folderId: activeFolderId,
        };
        set((s) => ({ notes: [...s.notes, note] }));
        return note;
      },

      updateNote: (id, updates) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, ...updates, modified: now() } : n
          ),
        })),

      deleteNote: (id) =>
        set((s) => ({
          notes: s.notes.filter((n) => n.id !== id),
          ui: s.ui.activeNoteId === id ? { ...s.ui, activeNoteId: null } : s.ui,
        })),

      getNoteById: (id) => get().notes.find((n) => n.id === id),
      getNoteByTitle: (title) =>
        get().notes.find((n) => n.title.toLowerCase() === title.toLowerCase()),

      // Kanban
      boards: [DEFAULT_BOARD],
      cards: DEFAULT_CARDS,

      addBoard: (title) => {
        const activeFolderId = get().ui.activeFolderId;
        const board: KanbanBoard = {
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
      },

      addCard: (boardId, columnId, title) => {
        const card: KanbanCard = {
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
      },

      updateCard: (id, updates) =>
        set((s) => ({
          cards: s.cards.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),

      deleteCard: (id) =>
        set((s) => ({
          cards: s.cards.filter((c) => c.id !== id),
          boards: s.boards.map((b) => ({
            ...b,
            columns: b.columns.map((col) => ({
              ...col,
              cardIds: col.cardIds.filter((cId) => cId !== id),
            })),
          })),
        })),

      moveCard: (cardId, fromColId, toColId, newIndex) =>
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
        })),

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

      // Agents
      agents: DEFAULT_AGENTS,
      skills: [],
      roles: [],
      agentSessions: DEFAULT_SESSIONS,

      addAgent: (name, description) =>
        set((s) => ({
          agents: [...s.agents, { id: createId(), name, description, icon: 'bot', active: true }],
        })),

      toggleAgent: (id) =>
        set((s) => ({
          agents: s.agents.map((a) => (a.id === id ? { ...a, active: !a.active } : a)),
        })),

      removeAgent: (id) =>
        set((s) => ({ agents: s.agents.filter((a) => a.id !== id) })),

      addSkill: (name, description) =>
        set((s) => ({ skills: [...s.skills, { id: createId(), name, description }] })),

      addRole: (name, description) =>
        set((s) => ({ roles: [...s.roles, { id: createId(), name, description }] })),

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
        return session;
      },

      removeAgentSession: (id) =>
        set((s) => ({
          agentSessions: s.agentSessions.filter((ss) => ss.id !== id),
          ui: s.ui.activeAgentSessionId === id
            ? { ...s.ui, activeAgentSessionId: s.agentSessions[0]?.id ?? null }
            : s.ui,
        })),

      addMessageToSession: (sessionId, msg) =>
        set((s) => ({
          agentSessions: s.agentSessions.map((ss) =>
            ss.id === sessionId ? { ...ss, messages: [...ss.messages, msg] } : ss
          ),
        })),

      // Custom Templates
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

      // UI
      ui: {
        activeView: 'dashboard' as ViewMode,
        activeNoteId: null,
        activeBoardId: 'default-board',
        inspectorOpen: true,
        commandPaletteOpen: false,
        sidebarCollapsed: false,
        fabOpen: false,
        inlineAgentOpen: false,
        activeAgentSessionId: 'session-1',
        notesTab: 'all' as const,
        activeFolderId: null,
      },

      setView: (view) => set((s) => ({ ui: { ...s.ui, activeView: view } })),
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

      // Onboarding
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
    }),
    {
      name: 'vibo-store',
    }
  )
);
