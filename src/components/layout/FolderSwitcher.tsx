import { useState } from 'react';
import { useStore } from '@/lib/store';
import { FolderOpen, ChevronDown, Plus, Check } from 'lucide-react';

export function FolderSwitcher() {
  const { folders, ui, setActiveFolder, addFolder } = useStore();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const activeFolder = folders.find((f) => f.id === ui.activeFolderId);
  const label = activeFolder ? activeFolder.name : 'All Folders';

  const handleCreate = () => {
    if (newName.trim()) {
      const folder = addFolder(newName.trim());
      setActiveFolder(folder.id);
      setNewName('');
      setCreating(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface-hover aether-transition"
      >
        <FolderOpen className="h-3.5 w-3.5" />
        <span className="truncate max-w-[120px]">{label}</span>
        <ChevronDown className={`h-3 w-3 aether-transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setCreating(false); }} />
          <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl border bg-popover p-1.5 shadow-lg animate-fade-in">
            {/* All folders option */}
            <button
              onClick={() => { setActiveFolder(null); setOpen(false); }}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs aether-transition ${
                !ui.activeFolderId ? 'bg-accent/10 text-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover'
              }`}
            >
              <FolderOpen className="h-3.5 w-3.5" />
              <span>All Folders</span>
              {!ui.activeFolderId && <Check className="h-3 w-3 ml-auto text-accent" />}
            </button>

            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => { setActiveFolder(folder.id); setOpen(false); }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs aether-transition ${
                  ui.activeFolderId === folder.id ? 'bg-accent/10 text-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover'
                }`}
              >
                <FolderOpen className="h-3.5 w-3.5" />
                <span className="truncate">{folder.name}</span>
                {ui.activeFolderId === folder.id && <Check className="h-3 w-3 ml-auto text-accent" />}
              </button>
            ))}

            <div className="my-1 border-t" />

            {creating ? (
              <div className="flex items-center gap-1 px-2">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false); }}
                  placeholder="Folder name"
                  className="flex-1 rounded-md border bg-background px-2 py-1.5 text-xs outline-none focus:border-accent"
                />
                <button onClick={handleCreate} className="rounded-md bg-accent px-2 py-1.5 text-xs text-accent-foreground font-medium">
                  Add
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-surface-hover aether-transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Folder</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
