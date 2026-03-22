import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Bot, Plus, Users, X, Pencil, Trash2, Check } from 'lucide-react';

type AgentTab = 'agents' | 'roles';

const MODELS = ['LFM2-350M-Extract', 'lfm-instruct', 'lfm-thinking'];

export function AgentView() {
  const { agents, roles, addAgent, updateAgent, toggleAgent, removeAgent, addRole, removeRole } = useStore();
  const [tab, setTab] = useState<AgentTab>('agents');

  // New / Edit agent form
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [model, setModel] = useState(MODELS[0]);
  const [selRoles, setSelRoles] = useState<string[]>([]);

  // Roles inline add
  const [showNewRole, setShowNewRole] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');

  const openNew = () => {
    setEditId(null);
    setName('');
    setDesc('');
    setModel(MODELS[0]);
    setSelRoles([]);
    setShowForm(true);
  };

  const openEdit = (a: typeof agents[0]) => {
    setEditId(a.id);
    setName(a.name);
    setDesc(a.description);
    setModel(a.model || MODELS[0]);
    setSelRoles(a.roleIds || []);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (editId) {
      updateAgent(editId, { name: name.trim(), description: desc.trim(), model, skillIds: [], roleIds: selRoles });
    } else {
      addAgent(name.trim(), desc.trim(), model, [], selRoles);
    }
    setShowForm(false);
  };

  const toggleRoleSel = (id: string) =>
    setSelRoles((p) => (p.includes(id) ? p.filter((r) => r !== id) : [...p, id]));

  const handleAddRole = () => {
    if (roleName.trim()) {
      addRole(roleName.trim(), roleDesc.trim());
      setRoleName('');
      setRoleDesc('');
      setShowNewRole(false);
    }
  };

  const tabs: { id: AgentTab; label: string; icon: typeof Bot }[] = [
    { id: 'agents', label: 'Agents', icon: Bot },
    { id: 'roles', label: 'Roles', icon: Users },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Tab bar */}
      <div className="flex border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium border-b-2 aether-transition ${
              tab === t.id
                ? 'text-foreground border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto px-5 py-5">
        {/* ===== AGENTS TAB ===== */}
        {tab === 'agents' && !showForm && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Active agents in your workspace</p>
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center gap-3 rounded-2xl border bg-card p-4 group">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{agent.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{agent.description}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">{agent.model || 'LFM2-350M-Extract'}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEdit(agent)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground hover:bg-muted aether-transition"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => removeAgent(agent.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 aether-transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => toggleAgent(agent.id)}
                    className={`rounded-lg px-3 py-1.5 text-[10px] font-medium aether-transition ${
                      agent.active
                        ? 'bg-primary/10 text-primary'
                        : 'border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {agent.active ? 'Active' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={openNew}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed p-4 text-xs text-muted-foreground hover:text-foreground hover:border-primary aether-transition"
            >
              <Plus className="h-4 w-4" />
              New Agent
            </button>
          </div>
        )}

        {/* ===== AGENT FORM (New / Edit) ===== */}
        {tab === 'agents' && showForm && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">{editId ? 'Edit Agent' : 'New Agent'}</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Agent name"
              className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary aether-transition"
              autoFocus
            />
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Description"
              className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary aether-transition"
            />

            {/* Model picker */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Model</label>
              <div className="flex flex-wrap gap-1.5">
                {MODELS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setModel(m)}
                    className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium border aether-transition ${
                      model === m
                        ? 'bg-primary/10 text-primary border-primary/30'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Roles multi-select */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Roles</label>
              {roles.length === 0 ? (
                <p className="text-[10px] text-muted-foreground/60">No roles defined yet. Add some in the Roles tab.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {roles.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => toggleRoleSel(r.id)}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium border aether-transition ${
                        selRoles.includes(r.id)
                          ? 'bg-primary/10 text-primary border-primary/30'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {selRoles.includes(r.id) && <Check className="h-3 w-3" />}
                      {r.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={handleSave} className="rounded-xl bg-primary px-5 py-2 text-xs font-medium text-primary-foreground">
                {editId ? 'Save' : 'Create'}
              </button>
              <button onClick={() => setShowForm(false)} className="rounded-xl border px-5 py-2 text-xs text-muted-foreground hover:text-foreground aether-transition">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ===== ROLES TAB ===== */}
        {tab === 'roles' && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Assign roles to control agent behavior</p>
            {roles.map((role) => (
              <div key={role.id} className="flex items-center gap-3 rounded-2xl border bg-card p-4 group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{role.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{role.description}</p>
                </div>
                <button
                  onClick={() => removeRole(role.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 aether-transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {showNewRole ? (
              <div className="rounded-2xl border border-dashed p-4 space-y-2">
                <input value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="Role name" className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary" autoFocus />
                <input value={roleDesc} onChange={(e) => setRoleDesc(e.target.value)} placeholder="Description" className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                <div className="flex gap-2">
                  <button onClick={handleAddRole} className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground">Add</button>
                  <button onClick={() => setShowNewRole(false)} className="text-xs text-muted-foreground">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowNewRole(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed p-4 text-xs text-muted-foreground hover:text-foreground hover:border-primary aether-transition">
                <Plus className="h-4 w-4" />
                Add Role
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
