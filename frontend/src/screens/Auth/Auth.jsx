import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import Button from "../../components/Button";
import Input from "../../components/Input";

export default function Auth() {
  const { t } = useTranslation();
  const { signIn, signUp, signInAsGuest } = useAuth();

  const [isSignUp, setIsSignUp]       = useState(false);
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [error, setError]             = useState(null);
  const [loading, setLoading]         = useState(false);
  const [checkEmail, setCheckEmail]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password);
      if (error) throw error;
      if (isSignUp) setCheckEmail(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col justify-center px-6">
      {/* Logo */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">VeetuLedger</h1>
      </div>

      {checkEmail && (
        <div className="bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 rounded-2xl p-4 text-center mb-4">
          <p className="text-teal-800 dark:text-teal-200 font-medium">Check your email</p>
          <p className="text-slate-900 dark:text-slate-300 text-sm mt-1">We sent a confirmation link to <strong>{email}</strong></p>
        </div>
      )}

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
        className="mt-4 text-sm text-slate-900 dark:text-slate-300 text-center"
      >
        {isSignUp ? t("auth.have_account") : t("auth.no_account")}
      </button>

      {/* Guest access */}
      <div className="mt-6 flex flex-col items-center gap-2">
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
          <span className="text-xs text-gray-400 dark:text-slate-500">or</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
        </div>
        <Button variant="secondary" full disabled={loading} onClick={signInAsGuest}>
          {t("auth.continue_as_guest")}
        </Button>
        <p className="text-xs text-gray-400 dark:text-slate-500 text-center">{t("auth.guest_note")}</p>
      </div>

    </div>
  );
}
