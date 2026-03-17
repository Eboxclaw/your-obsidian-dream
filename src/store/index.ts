import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Note, KanbanBoard, KanbanCard, UIState, ViewMode, OnboardingState, UserRole } from '@/types';

const createId = () => crypto.randomUUID();
const now = () => new Date().toISOString();

const WELCOME_NOTE: Note = {
  id: 'welcome',
  title: 'Welcome to ViBo',
  content: `# Welcome to ViBo

Your second brain starts here. This is a **markdown-first** notebook with wikilinks, backlinks, and kanban boards.

## Getting Started

- Create notes with \`Cmd+N\`
- Open command palette with \`Cmd+K\`
- Link notes with \`[[wikilinks]]\`
- Organize work on the Kanban board

## Features

- Full markdown editing with live preview
- Bidirectional linking between notes
- Kanban boards with draggable cards
- Quick capture from the dashboard

> "The mind is not a vessel to be filled, but a fire to be kindled."
`,
  tags: ['getting-started'],
  created: now(),
  modified: now(),
  parentId: null,
  isFolder: false,
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

interface AppStore {
  // Notes
  notes: Note[];
  addNote: (title: string, parentId?: string | null) => Note;
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

  // UI
  ui: UIState;
  setView: (view: ViewMode) => void;
  setActiveNote: (id: string | null) => void;
  setActiveBoard: (id: string | null) => void;
  toggleInspector: () => void;
  toggleCommandPalette: () => void;
  toggleSidebar: () => void;
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      notes: [WELCOME_NOTE],

      addNote: (title, parentId = null) => {
        const note: Note = {
          id: createId(),
          title,
          content: '',
          tags: [],
          created: now(),
          modified: now(),
          parentId,
          isFolder: false,
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
                    c.id === columnId
                      ? { ...c, cardIds: [...c.cardIds, card.id] }
                      : c
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
              ? {
                  ...b,
                  columns: [...b.columns, { id: createId(), title, cardIds: [] }],
                }
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

      // UI
      ui: {
        activeView: 'dashboard' as ViewMode,
        activeNoteId: null,
        activeBoardId: 'default-board',
        inspectorOpen: true,
        commandPaletteOpen: false,
        sidebarCollapsed: false,
      },

      setView: (view) => set((s) => ({ ui: { ...s.ui, activeView: view } })),
      setActiveNote: (id) =>
        set((s) => ({ ui: { ...s.ui, activeNoteId: id } })),
      setActiveBoard: (id) =>
        set((s) => ({ ui: { ...s.ui, activeBoardId: id } })),
      toggleInspector: () =>
        set((s) => ({ ui: { ...s.ui, inspectorOpen: !s.ui.inspectorOpen } })),
      toggleCommandPalette: () =>
        set((s) => ({
          ui: { ...s.ui, commandPaletteOpen: !s.ui.commandPaletteOpen },
        })),
      toggleSidebar: () =>
        set((s) => ({
          ui: { ...s.ui, sidebarCollapsed: !s.ui.sidebarCollapsed },
        })),

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
