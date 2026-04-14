import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import Button from "../../components/Button";
import Input from "../../components/Input";

const STEPS = { PHONE: "phone", OTP: "otp" };

export default function Auth() {
  const { t, i18n } = useTranslation();
  const { sendOtp, verifyOtp, signInAsGuest } = useAuth();

  const [step, setStep]     = useState(STEPS.PHONE);
  const [phone, setPhone]   = useState("");
  const [otp, setOtp]       = useState("");
  const [error, setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await sendOtp(phone);
      if (error) throw error;
      setStep(STEPS.OTP);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await verifyOtp(phone, otp);
      if (error) throw error;
      // AuthContext picks up the session change automatically
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
        <h1 className="text-4xl font-bold text-green-600">வீடு</h1>
        <p className="text-gray-400 text-sm mt-1">Veedu</p>
      </div>

      {step === STEPS.PHONE ? (
        <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
          <Input
            label={t("auth.phone_placeholder")}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 9876543210"
            required
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" full disabled={loading}>
            {loading ? "..." : t("auth.send_otp")}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          <p className="text-sm text-gray-500 text-center">
            OTP sent to <span className="font-medium text-gray-700">{phone}</span>
          </p>
          <Input
            label={t("auth.otp_placeholder")}
            type="number"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="123456"
            required
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" full disabled={loading}>
            {loading ? "..." : t("auth.verify")}
          </Button>
          <Button variant="ghost" full onClick={() => setStep(STEPS.PHONE)}>
            Change number
          </Button>
        </form>
      )}

      {/* Guest access */}
      {step === STEPS.PHONE && (
        <div className="mt-6 flex flex-col items-center gap-2">
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <Button
            variant="secondary"
            full
            disabled={loading}
            onClick={() => {
              signInAsGuest();
            }}
          >
            {t("auth.continue_as_guest")}
          </Button>
          <p className="text-xs text-gray-400 text-center">{t("auth.guest_note")}</p>
        </div>
      )}

      {/* Language toggle */}
      <button
        onClick={() => {
          const next = i18n.language === "en" ? "ta" : "en";
          i18n.changeLanguage(next);
          localStorage.setItem("lang", next);
        }}
        className="mt-8 text-center text-sm text-gray-400"
      >
        {i18n.language === "en" ? "தமிழில் காண்க" : "View in English"}
      </button>
    </div>
  );
}
