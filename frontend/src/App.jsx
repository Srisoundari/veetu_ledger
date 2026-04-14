import { useState } from "react";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { useHousehold } from "./hooks/useHousehold";
import Auth from "./screens/Auth/Auth";
import HouseholdSetup from "./screens/HouseholdSetup/HouseholdSetup";
import Expenses from "./screens/Expenses/Expenses";
import Projects from "./screens/Projects/Projects";
import SharedList from "./screens/SharedList/SharedList";
import Profile from "./screens/Profile/Profile";
import BottomNav from "./components/BottomNav";
import TopBar from "./components/TopBar";
import GuestBanner from "./components/GuestBanner";
import Spinner from "./components/Spinner";

// ── Main app (authenticated) ──────────────────────────────────────
function MainApp({ user }) {
  const [tab, setTab] = useState("expenses");
  const { isGuest } = useAuth();
  const { household, loading, create, join } = useHousehold(user);

  if (!isGuest && loading) return <Spinner />;

  // Guests skip household setup — data lives locally
  if (!isGuest && !household) {
    return (
      <HouseholdSetup
        onDone={async (mode, value) => {
          if (mode === "create") await create(value);
          else await join(value);
        }}
      />
    );
  }

  const mainTabs = ["expenses", "projects", "list"];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <TopBar
        onHome={() => setTab("expenses")}
        onProfile={() => setTab("profile")}
      />
      <GuestBanner />
      <div className="flex-1 overflow-hidden flex flex-col">
        {tab === "expenses" && <Expenses />}
        {tab === "projects" && <Projects />}
        {tab === "list"     && <SharedList />}
        {tab === "profile"  && (
          <Profile
            household={household}
            onBack={() => setTab("expenses")}
          />
        )}
      </div>
      {mainTabs.includes(tab) && (
        <BottomNav active={tab} onChange={setTab} />
      )}
    </div>
  );
}

// ── Root — handles auth gate ──────────────────────────────────────
function Root() {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;
  if (!user)   return <Auth />;
  return <MainApp user={user} />;
}

// ── App — provides context ────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
