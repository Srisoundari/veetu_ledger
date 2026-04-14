import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import Button from "../../components/Button";
import Input from "../../components/Input";

export default function Auth() {
  const { t } = useTranslation();
  const { signIn, signUp, signInAsGuest } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password);
      if (error) throw error;
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-6">
      {/* Logo */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-green-600">VeetuLedger</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label={t("auth.email")}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
        <Input
          label={t("auth.password")}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" full disabled={loading}>
          {loading ? "..." : isSignUp ? t("auth.sign_up") : t("auth.sign_in")}
        </Button>
      </form>

      <button
        onClick={() => { setIsSignUp((v) => !v); setError(null); }}
        className="mt-4 text-sm text-green-600 text-center"
      >
        {isSignUp ? t("auth.have_account") : t("auth.no_account")}
      </button>

      {/* Guest access */}
      <div className="mt-6 flex flex-col items-center gap-2">
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <Button variant="secondary" full disabled={loading} onClick={signInAsGuest}>
          {t("auth.continue_as_guest")}
        </Button>
        <p className="text-xs text-gray-400 text-center">{t("auth.guest_note")}</p>
      </div>

    </div>
  );
}
