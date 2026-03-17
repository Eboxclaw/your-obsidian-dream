import type { UserRole } from '@/types';

export interface NoteTemplate {
  id: string;
  title: string;
  content: string;
  tags: string[];
  roles: UserRole[];
}

export interface KanbanTemplate {
  id: string;
  title: string;
  columns: { title: string; cards: string[] }[];
  roles: UserRole[];
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  // General
  {
    id: 'nt-brainstorm',
    title: 'Brainstorm',
    content: `# Brainstorm: [Topic]\n\n## Problem\n\n\n## Ideas\n\n- \n- \n- \n\n## Next Steps\n\n- [ ] \n`,
    tags: ['brainstorm'],
    roles: ['general', 'writer', 'pm', 'developer', 'analyst', 'researcher'],
  },
  // Researcher
  {
    id: 'nt-literature-review',
    title: 'Literature Review',
    content: `# Literature Review: [Topic]\n\n## Research Question\n\n\n## Sources\n\n### Source 1\n- **Author:**\n- **Year:**\n- **Key Findings:**\n- **Relevance:**\n\n### Source 2\n- **Author:**\n- **Year:**\n- **Key Findings:**\n- **Relevance:**\n\n## Synthesis\n\n\n## Gaps in Literature\n\n\n## References\n\n`,
    tags: ['research', 'literature'],
    roles: ['researcher'],
  },
  {
    id: 'nt-experiment-log',
    title: 'Experiment Log',
    content: `# Experiment: [Name]\n\n**Date:** ${new Date().toISOString().slice(0, 10)}\n\n## Hypothesis\n\n\n## Methodology\n\n1. \n2. \n3. \n\n## Observations\n\n\n## Results\n\n\n## Conclusion\n\n`,
    tags: ['experiment', 'research'],
    roles: ['researcher', 'analyst'],
  },
  // Writer
  {
    id: 'nt-draft',
    title: 'Writing Draft',
    content: `# [Title]\n\n**Status:** Draft\n**Word Target:** 1000\n\n---\n\n## Hook\n\n\n## Body\n\n\n## Conclusion\n\n\n---\n\n## Revision Notes\n\n- \n`,
    tags: ['draft', 'writing'],
    roles: ['writer'],
  },
  {
    id: 'nt-character-sheet',
    title: 'Character Sheet',
    content: `# Character: [Name]\n\n## Basics\n- **Age:**\n- **Occupation:**\n- **Motivation:**\n\n## Personality\n- **Traits:**\n- **Flaws:**\n- **Strengths:**\n\n## Arc\n- **Beginning:**\n- **Turning Point:**\n- **Resolution:**\n\n## Notes\n\n`,
    tags: ['character', 'writing'],
    roles: ['writer'],
  },
  // PM
  {
    id: 'nt-meeting-notes',
    title: 'Meeting Notes',
    content: `# Meeting: [Title]\n\n**Date:** ${new Date().toISOString().slice(0, 10)}\n**Attendees:**\n\n---\n\n## Agenda\n\n1. \n2. \n3. \n\n## Discussion\n\n\n## Decisions\n\n- \n\n## Action Items\n\n- [ ] [Owner] — [Task] — [Due]\n- [ ] [Owner] — [Task] — [Due]\n\n## Next Meeting\n\n`,
    tags: ['meeting', 'project'],
    roles: ['pm'],
  },
  {
    id: 'nt-project-brief',
    title: 'Project Brief',
    content: `# Project Brief: [Name]\n\n## Overview\n\n\n## Objectives\n\n1. \n2. \n3. \n\n## Scope\n\n### In Scope\n- \n\n### Out of Scope\n- \n\n## Timeline\n\n| Milestone | Date | Status |\n|-----------|------|--------|\n| Kickoff   |      | ⬜     |\n| MVP       |      | ⬜     |\n| Launch    |      | ⬜     |\n\n## Stakeholders\n\n- \n\n## Risks\n\n- \n`,
    tags: ['project', 'brief'],
    roles: ['pm'],
  },
  // Developer
  {
    id: 'nt-architecture-doc',
    title: 'Architecture Doc',
    content: `# Architecture: [System Name]\n\n## Overview\n\n\n## Components\n\n### Component A\n- **Purpose:**\n- **Tech Stack:**\n- **API:**\n\n### Component B\n- **Purpose:**\n- **Tech Stack:**\n- **API:**\n\n## Data Flow\n\n\`\`\`\n[Diagram description]\n\`\`\`\n\n## Trade-offs\n\n| Decision | Option A | Option B | Chosen |\n|----------|----------|----------|--------|\n|          |          |          |        |\n\n## Open Questions\n\n- \n`,
    tags: ['architecture', 'dev'],
    roles: ['developer'],
  },
  {
    id: 'nt-bug-report',
    title: 'Bug Report',
    content: `# Bug: [Title]\n\n**Severity:** [Critical/High/Medium/Low]\n**Status:** Open\n\n## Steps to Reproduce\n\n1. \n2. \n3. \n\n## Expected Behavior\n\n\n## Actual Behavior\n\n\n## Environment\n\n- OS:\n- Browser:\n- Version:\n\n## Logs\n\n\`\`\`\n\n\`\`\`\n\n## Fix Notes\n\n`,
    tags: ['bug', 'dev'],
    roles: ['developer'],
  },
  // Analyst
  {
    id: 'nt-analysis-report',
    title: 'Analysis Report',
    content: `# Analysis: [Title]\n\n**Date:** ${new Date().toISOString().slice(0, 10)}\n**Dataset:**\n\n## Executive Summary\n\n\n## Methodology\n\n\n## Key Findings\n\n1. \n2. \n3. \n\n## Data\n\n| Metric | Value | Change |\n|--------|-------|--------|\n|        |       |        |\n\n## Recommendations\n\n- \n\n## Appendix\n\n`,
    tags: ['analysis', 'report'],
    roles: ['analyst'],
  },
  {
    id: 'nt-query-notebook',
    title: 'Query Notebook',
    content: `# Query Notebook: [Dataset]\n\n## Context\n\n\n## Queries\n\n### Query 1: [Description]\n\n\`\`\`sql\nSELECT * FROM table\nWHERE condition\n\`\`\`\n\n**Result:**\n\n### Query 2: [Description]\n\n\`\`\`sql\n\n\`\`\`\n\n**Result:**\n\n## Insights\n\n- \n`,
    tags: ['query', 'data'],
    roles: ['analyst', 'developer'],
  },
];

export const KANBAN_TEMPLATES: KanbanTemplate[] = [
  {
    id: 'kt-basic',
    title: 'Basic Board',
    columns: [
      { title: 'To Do', cards: [] },
      { title: 'In Progress', cards: [] },
      { title: 'Done', cards: [] },
    ],
    roles: ['general', 'writer', 'researcher', 'analyst'],
  },
  {
    id: 'kt-sprint',
    title: 'Sprint Board',
    columns: [
      { title: 'Backlog', cards: ['Review requirements'] },
      { title: 'Sprint', cards: [] },
      { title: 'In Progress', cards: [] },
      { title: 'Review', cards: [] },
      { title: 'Done', cards: [] },
    ],
    roles: ['developer', 'pm'],
  },
  {
    id: 'kt-content',
    title: 'Content Pipeline',
    columns: [
      { title: 'Ideas', cards: [] },
      { title: 'Drafting', cards: [] },
      { title: 'Editing', cards: [] },
      { title: 'Published', cards: [] },
    ],
    roles: ['writer'],
  },
  {
    id: 'kt-research',
    title: 'Research Pipeline',
    columns: [
      { title: 'To Read', cards: [] },
      { title: 'Reading', cards: [] },
      { title: 'Summarized', cards: [] },
      { title: 'Cited', cards: [] },
    ],
    roles: ['researcher'],
  },
  {
    id: 'kt-project',
    title: 'Project Tracker',
    columns: [
      { title: 'Not Started', cards: [] },
      { title: 'Planning', cards: [] },
      { title: 'Active', cards: [] },
      { title: 'Blocked', cards: [] },
      { title: 'Complete', cards: [] },
    ],
    roles: ['pm'],
  },
  {
    id: 'kt-data',
    title: 'Data Analysis',
    columns: [
      { title: 'Intake', cards: [] },
      { title: 'Exploring', cards: [] },
      { title: 'Modeling', cards: [] },
      { title: 'Reporting', cards: [] },
    ],
    roles: ['analyst'],
  },
];

export function getTemplatesForRole(role: UserRole | null) {
  if (!role) return { notes: NOTE_TEMPLATES, kanban: KANBAN_TEMPLATES };
  return {
    notes: NOTE_TEMPLATES.filter((t) => t.roles.includes(role)),
    kanban: KANBAN_TEMPLATES.filter((t) => t.roles.includes(role)),
  };
}
