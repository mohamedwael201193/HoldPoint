import { Navigate, Route, Routes } from "react-router";
import AppShell from "./pages/AppShell";
import Dashboard from "./pages/Dashboard";
import Inbox from "./pages/Inbox";
import Judges from "./pages/Judges";
import Landing from "./pages/Landing";
import PermitDetail from "./pages/PermitDetail";
import ReliabilityPage from "./pages/Reliability";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="permits/:permitId" element={<PermitDetail />} />
        <Route path="inbox" element={<Inbox />} />
        <Route path="reliability" element={<ReliabilityPage />} />
      </Route>
      <Route path="/judges" element={<Judges />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
