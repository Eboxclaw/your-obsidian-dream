export interface Folder {
  id: string;
  name: string;
  created: string;
  parentId: string | null;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  created: string;
  modified: string;
  parentId: string | null;
  isFolder: boolean;
  isPrivate: boolean;
  folderId: string | null;
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
  folderId: string | null;
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

export type ViewMode = 'dashboard' | 'notebook' | 'kanban' | 'graph' | 'agent' | 'templates' | 'settings';

export type UserRole = 'general' | 'researcher' | 'writer' | 'pm' | 'developer' | 'analyst';

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  model: string;
  skillIds: string[];
  roleIds: string[];
  icon: string;
  active: boolean;
}

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
}

export interface AgentRole {
  id: string;
  name: string;
  description: string;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: string;
}

export interface AgentSession {
  id: string;
  title: string;
  messages: AgentMessage[];
}

export interface CustomTemplate {
  id: string;
  type: 'note' | 'task';
  title: string;
  content: string;
  tags: string[];
  columns?: { title: string; cards: string[] }[];
  created: string;
}

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
  fabOpen: boolean;
  inlineAgentOpen: boolean;
  activeAgentSessionId: string | null;
  notesTab: 'all' | 'private';
  activeFolderId: string | null;
}
