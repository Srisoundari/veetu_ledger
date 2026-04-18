import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { householdsApi } from "../../api/households.api";
import PageHeader from "../../components/PageHeader";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Spinner from "../../components/Spinner";
import PageInfo from "../../components/PageInfo";

// ── No household: create or join ──────────────────────────────────
function HouseholdSetup({ onCreate, onJoin }) {
  const [mode, setMode]       = useState(null); // null | "create" | "join"
  const [name, setName]       = useState("");
  const [code, setCode]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const handle = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "create") await onCreate(name.trim());
      else await onJoin(code.trim().toUpperCase());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full px-6 justify-center">
      <div className="text-center mb-8">
        <p className="text-4xl mb-3">🏠</p>
        <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">Set up your household</h2>
        <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Create a new one or join with an invite code</p>
      </div>

      {!mode && (
        <div className="flex flex-col gap-3">
          <Button full onClick={() => setMode("create")}>Create household</Button>
          <Button full variant="secondary" onClick={() => setMode("join")}>Join with code</Button>
        </div>
      )}

      {mode === "create" && (
        <form onSubmit={handle} className="flex flex-col gap-4">
          <Input
            label="Household name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Our Home"
            required
            autoFocus
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" full disabled={loading || !name.trim()}>
            {loading ? "Creating..." : "Create"}
          </Button>
          <Button variant="ghost" full onClick={() => { setMode(null); setError(null); }}>
            ← Back
          </Button>
        </form>
      )}

      {mode === "join" && (
        <form onSubmit={handle} className="flex flex-col gap-4">
          <Input
            label="Invite code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            required
            autoFocus
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" full disabled={loading || code.length < 6}>
            {loading ? "Joining..." : "Join"}
          </Button>
          <Button variant="ghost" full onClick={() => { setMode(null); setError(null); }}>
            ← Back
          </Button>
        </form>
      )}
    </div>
  );
}

// ── Has household: full CRUD ──────────────────────────────────────
export default function Household({ household, onCreate, onJoin, onRename, onNewInvite, onLeave }) {
  const { user } = useAuth();

  const [members, setMembers]             = useState([]);
  const [membersLoading, setML]           = useState(true);
  const [editing, setEditing]             = useState(false);
  const [newName, setNewName]             = useState("");
  const [renaming, setRenaming]           = useState(false);
  const [renameError, setRenameError]     = useState(null);
  const [copied, setCopied]               = useState(false);
  const [newingInvite, setNewingInvite]   = useState(false);
  const [leaving, setLeaving]             = useState(false);
  const [confirmLeave, setConfirmLeave]   = useState(false);

  useEffect(() => {
    if (!household) { setML(false); return; }
    setML(true);
    householdsApi.members()
      .then(setMembers)
      .catch(() => setMembers([]))
      .finally(() => setML(false));
  }, [household?.id]);

  if (!household) {
    return <HouseholdSetup onCreate={onCreate} onJoin={onJoin} />;
  }

  const copyCode = () => {
    navigator.clipboard.writeText(household.invite_code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setRenaming(true);
    setRenameError(null);
    try {
      await onRename(newName.trim());
      setEditing(false);
      setNewName("");
    } catch (err) {
      setRenameError(err.message);
    } finally {
      setRenaming(false);
    }
  };

  const handleNewInvite = async () => {
    setNewingInvite(true);
    try { await onNewInvite(); } finally { setNewingInvite(false); }
  };

  const handleLeave = async () => {
    setLeaving(true);
    try { await onLeave(); } finally { setLeaving(false); }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      <PageHeader title="Household" action={
        <PageInfo text="Manage your household. Share the invite code with family so they can join and access the shared expense list and projects. All members see the same data." />
      } />

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 flex flex-col gap-4">

        {/* Name */}
        <Card>
          {editing ? (
            <form onSubmit={handleRename} className="flex flex-col gap-2">
              <Input
                label="Household name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={household.name}
                autoFocus
              />
              {renameError && <p className="text-xs text-red-500">{renameError}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={renaming || !newName.trim()}>
                  {renaming ? "Saving..." : "Save"}
                </Button>
                <Button variant="secondary" onClick={() => { setEditing(false); setRenameError(null); }}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">Household name</p>
                <p className="font-semibold text-gray-800 dark:text-slate-100 text-lg">{household.name}</p>
              </div>
              <button
                onClick={() => { setEditing(true); setNewName(household.name); }}
                className="text-sm text-teal-600 font-medium px-2 py-1 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-lg"
              >
                Edit
              </button>
            </div>
          )}
        </Card>

        {/* Invite code */}
        <Card>
          <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">Invite code</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">Share with family to join your household</p>
          <div className="flex items-center gap-3 mb-3">
            <span className="font-mono text-2xl font-bold text-teal-700 dark:text-teal-300 tracking-widest">
              {household.invite_code}
            </span>
            <button
              onClick={copyCode}
              className="text-xs text-teal-600 border border-teal-200 dark:border-teal-700 px-3 py-1.5 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/30"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button
            onClick={handleNewInvite}
            disabled={newingInvite}
            className="text-xs text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 underline"
          >
            {newingInvite ? "Generating..." : "Generate new code"}
          </button>
        </Card>

        {/* Members */}
        <Card>
          <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-3">
            Members {!membersLoading && `· ${members.length}`}
          </p>
          {membersLoading ? (
            <Spinner />
          ) : members.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-slate-500">No members found</p>
          ) : (
            <div className="flex flex-col gap-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-semibold text-sm flex items-center justify-center shrink-0">
                    {(m.name || m.id)?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate">
                      {m.name || <span className="text-gray-400 italic">Unnamed</span>}
                      {m.id === user?.id && (
                        <span className="ml-2 text-xs text-teal-600 font-normal">(you)</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Leave */}
        {confirmLeave ? (
          <Card>
            <p className="text-sm text-gray-700 dark:text-slate-200 mb-3 font-medium">Leave this household?</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">
              You'll need a new invite code to rejoin. Your data stays in the household.
            </p>
            <div className="flex gap-2">
              <Button variant="danger" disabled={leaving} onClick={handleLeave}>
                {leaving ? "Leaving..." : "Yes, leave"}
              </Button>
              <Button variant="secondary" onClick={() => setConfirmLeave(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        ) : (
          <button
            onClick={() => setConfirmLeave(true)}
            className="text-sm text-red-400 hover:text-red-500 text-center w-full py-2"
          >
            Leave household
          </button>
        )}

      </div>
    </div>
  );
}
