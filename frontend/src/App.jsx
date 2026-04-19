import { useState, Component } from "react";
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

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
        <p className="text-slate-400 text-sm">Something went wrong loading this view.</p>
        <p className="text-xs text-red-400 font-mono bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl max-w-xs break-all">
          {this.state.error?.message}
        </p>
        <button
          onClick={() => this.setState({ error: null })}
          className="text-xs text-teal-600 font-semibold mt-1"
        >
          Retry
        </button>
      </div>
    );
    return this.props.children;
  }
}

function MainApp({ user }) {
  const { isGuest } = useAuth();
  const { dark, toggle } = useTheme();
  const { household, loading, create, join, rename, newInvite, leave } = useHousehold(user);

  // Default to Household tab until they've joined/created one
  const [tab, setTab] = useState("finance");

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
        <ErrorBoundary key={tab}>
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
        </ErrorBoundary>
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
