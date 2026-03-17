export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  created: string;
  modified: string;
  parentId: string | null;
  isFolder: boolean;
}

export interface WikiLink {
  sourceId: string;
  targetTitle: string;
}

export interface KanbanBoard {
  id: string;
  title: string;
  columns: KanbanColumn[];
  created: string;
  modified: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  cardIds: string[];
}

export interface KanbanCard {
  id: string;
  title: string;
  description: string;
  noteId: string | null;
  subtasks: Subtask[];
  columnId: string;
  boardId: string;
  created: string;
}

export interface Subtask {
  id: string;
  text: string;
  done: boolean;
}

export type ViewMode = 'dashboard' | 'notebook' | 'kanban' | 'graph';

export type UserRole = 'general' | 'researcher' | 'writer' | 'pm' | 'developer' | 'analyst';

export interface OnboardingState {
  completed: boolean;
  step: number;
  role: UserRole | null;
  name: string;
  workspaceName: string;
  theme: 'dark' | 'midnight' | 'abyss';
  features: string[];
}

export interface UIState {
  activeView: ViewMode;
  activeNoteId: string | null;
  activeBoardId: string | null;
  inspectorOpen: boolean;
  commandPaletteOpen: boolean;
  sidebarCollapsed: boolean;
}
