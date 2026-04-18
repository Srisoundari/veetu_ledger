import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { householdsApi } from "../../api/households.api";
import PageHeader from "../../components/PageHeader";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";

export default function Profile({ onBack }) {
  const { user, logout } = useAuth();
  const [name, setName]     = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState(null);

  useEffect(() => {
    householdsApi.me()
      .then((data) => { if (data?.name) setName(data.name); })
      .catch(() => {});
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await householdsApi.updateProfile(name.trim(), "en");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      <PageHeader title="Profile" onBack={onBack} />

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 flex flex-col gap-4">

        <Card>
          <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">Signed in as</p>
          <p className="font-medium text-gray-800 dark:text-slate-100 break-all">{user?.email}</p>
        </Card>

        <Card>
          <form onSubmit={saveProfile} className="flex flex-col gap-3">
            <Input
              label="Display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (e.g. Amma)"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            {saved  && <p className="text-xs text-teal-600">Saved!</p>}
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? "Saving..." : "Update name"}
            </Button>
          </form>
        </Card>

        <Button variant="secondary" full onClick={logout}>
          Sign out
        </Button>

      </div>
    </div>
  );
}
