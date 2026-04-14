import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { householdsApi } from "../../api/households.api";
import PageHeader from "../../components/PageHeader";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";

export default function Profile({ onBack, household }) {
  const { user, logout } = useAuth();
  const [name, setName]     = useState("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState(null);

  const inviteCode = household?.invite_code;

  const copyCode = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await householdsApi.updateProfile(name.trim(), "en");
      setSaved(true);
      setName("");
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Profile" onBack={onBack} />

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 flex flex-col gap-4">

        {/* Account */}
        <Card>
          <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Account</p>
          <p className="font-medium text-gray-800 break-all">{user?.email}</p>
        </Card>

        {/* Household */}
        {household ? (
          <Card>
            <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Household</p>
            <p className="font-semibold text-gray-800 mb-3">{household.name}</p>

            <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Invite code</p>
            <p className="text-xs text-gray-400 mb-2">Share this with family to join your household</p>
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl font-bold text-green-700 tracking-widest">
                {inviteCode}
              </span>
              <button
                onClick={copyCode}
                className="text-xs text-green-600 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </Card>
        ) : (
          <Card>
            <p className="text-sm text-gray-400">No household linked yet</p>
          </Card>
        )}

        {/* Display name */}
        <Card>
          <form onSubmit={saveProfile} className="flex flex-col gap-3">
            <Input
              label="Display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (e.g. Amma)"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            {saved  && <p className="text-xs text-green-600">Saved!</p>}
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? "Saving..." : "Update name"}
            </Button>
          </form>
        </Card>

        {/* Sign out */}
        <Button variant="secondary" full onClick={logout}>
          Sign out
        </Button>

      </div>
    </div>
  );
}
