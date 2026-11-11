import { useAuth } from "./auth/AuthContext";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";

function Splash() {
  return (
    <div className="splash" role="status" aria-label="Loading Imprint">
      <span className="brand-mark msz" aria-hidden="true">
        neurology
      </span>
      <span className="spinner spinner-clay" />
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <Splash />;
  return user ? <DashboardPage /> : <LoginPage />;
}
