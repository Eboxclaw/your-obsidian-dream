import { useState } from 'react';
import { useStore } from '@/store';
import { Bot, Plus, Search, Zap, Users, X } from 'lucide-react';

type AgentTab = 'agents' | 'skills' | 'roles';

export function AgentView() {
  const { agents, skills, roles, addAgent, toggleAgent, removeAgent, addSkill, addRole } = useStore();
  const [tab, setTab] = useState<AgentTab>('agents');
  const [showNewAgent, setShowNewAgent] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [showNewSkill, setShowNewSkill] = useState(false);
  const [showNewRole, setShowNewRole] = useState(false);
  const [skillName, setSkillName] = useState('');
  const [skillDesc, setSkillDesc] = useState('');
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');

  const handleAddAgent = () => {
    if (newName.trim()) {
      addAgent(newName.trim(), newDesc.trim());
      setNewName('');
      setNewDesc('');
      setShowNewAgent(false);
    }
  };

  const handleAddSkill = () => {
    if (skillName.trim()) {
      addSkill(skillName.trim(), skillDesc.trim());
      setSkillName('');
      setSkillDesc('');
      setShowNewSkill(false);
    }
  };

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
    { id: 'skills', label: 'Skills', icon: Zap },
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
        {tab === 'agents' && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Active agents in your workspace</p>
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center gap-3 rounded-2xl border bg-card p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{agent.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{agent.description}</p>
                </div>
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
            ))}

            {showNewAgent ? (
              <div className="rounded-2xl border border-dashed p-4 space-y-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Agent name"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary aether-transition"
                  autoFocus
                />
                <input
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Description"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary aether-transition"
                />
                <div className="flex gap-2">
                  <button onClick={handleAddAgent} className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground">Create</button>
                  <button onClick={() => setShowNewAgent(false)} className="text-xs text-muted-foreground">Cancel</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNewAgent(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed p-4 text-xs text-muted-foreground hover:text-foreground hover:border-primary aether-transition"
              >
                <Plus className="h-4 w-4" />
                New Agent
              </button>
            )}
          </div>
        )}

        {tab === 'skills' && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Define what your agents can do</p>
            {skills.map((skill) => (
              <div key={skill.id} className="rounded-2xl border bg-card p-4">
                <p className="text-sm font-medium text-foreground">{skill.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{skill.description}</p>
              </div>
            ))}
            {showNewSkill ? (
              <div className="rounded-2xl border border-dashed p-4 space-y-2">
                <input value={skillName} onChange={(e) => setSkillName(e.target.value)} placeholder="Skill name" className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary" autoFocus />
                <input value={skillDesc} onChange={(e) => setSkillDesc(e.target.value)} placeholder="Description (markdown)" className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                <div className="flex gap-2">
                  <button onClick={handleAddSkill} className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground">Add</button>
                  <button onClick={() => setShowNewSkill(false)} className="text-xs text-muted-foreground">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowNewSkill(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed p-4 text-xs text-muted-foreground hover:text-foreground hover:border-primary aether-transition">
                <Plus className="h-4 w-4" />
                Add Skill
              </button>
            )}
          </div>
        )}

        {tab === 'roles' && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Assign roles to control agent behavior</p>
            {roles.map((role) => (
              <div key={role.id} className="rounded-2xl border bg-card p-4">
                <p className="text-sm font-medium text-foreground">{role.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{role.description}</p>
              </div>
            ))}
            {showNewRole ? (
              <div className="rounded-2xl border border-dashed p-4 space-y-2">
                <input value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="Role name" className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary" autoFocus />
                <input value={roleDesc} onChange={(e) => setRoleDesc(e.target.value)} placeholder="Description (markdown)" className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
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
