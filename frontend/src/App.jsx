import { useState, useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { useHousehold } from "./hooks/useHousehold";
import Auth from "./screens/Auth/Auth";
import Dashboard from "./screens/Dashboard/Dashboard";
import Finance from "./screens/Finance/Finance";
import SharedList from "./screens/SharedList/SharedList";
import Household from "./screens/Household/Household";
import Profile from "./screens/Profile/Profile";
import BottomNav from "./components/BottomNav";
import TopBar from "./components/TopBar";
import GuestBanner from "./components/GuestBanner";
import Spinner from "./components/Spinner";
import FloatingAssistant from "./components/FloatingAssistant";
import { useTheme } from "./hooks/useTheme";

function MainApp({ user }) {
  const { isGuest } = useAuth();
  const { dark, toggle } = useTheme();
  const { household, loading, create, join, rename, newInvite, leave } = useHousehold(user);

  // Default to Household tab until they've joined/created one
  const [tab, setTab] = useState("finance");
  useEffect(() => {
    if (!isGuest && !loading && !household) setTab("household");
  }, [isGuest, loading, household]);

  if (!isGuest && loading) return <Spinner />;

  const bottomTabs = ["dashboard", "finance", "list", "household"];

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <TopBar
        onHome={() => setTab("finance")}
        onProfile={() => setTab("profile")}
        dark={dark}
        onToggleTheme={toggle}
      />
      <GuestBanner />
      <div className="flex-1 overflow-hidden flex flex-col">
        {tab === "dashboard" && <Dashboard setTab={setTab} />}
        {tab === "finance"   && <Finance />}
        {tab === "list"      && <SharedList />}
        {tab === "household" && (
          <Household
            household={household}
            onCreate={create}
            onJoin={join}
            onRename={rename}
            onNewInvite={newInvite}
            onLeave={leave}
          />
        )}
        {tab === "profile" && (
          <Profile onBack={() => setTab("finance")} />
        )}
      </div>
      {bottomTabs.includes(tab) && (
        <BottomNav active={tab} onChange={setTab} />
      )}
      {!isGuest && ["finance", "list"].includes(tab) && (
        <FloatingAssistant
          onSaved={(type) => {
            if (type === "expense")        setTab("finance");
            else if (type === "list_item") setTab("list");
          }}
        />
      )}
    </div>
  );
}

function Root() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user)   return <Auth />;
  return <MainApp user={user} />;
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
