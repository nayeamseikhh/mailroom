import { Navigate, Route, Routes } from "react-router-dom";

import CampaignCreate from "../pages/CampaignCreate.jsx";
import Campaigns from "../pages/Campaigns.jsx";
import Contacts from "../pages/Contacts.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import NotFound from "../pages/NotFound.jsx";
import Reports from "../pages/Reports.jsx";
import Templates from "../pages/Templates.jsx";
import Unsubscribe from "../pages/Unsubscribe.jsx";
import Inbox from "../pages/inbox/index.jsx";

import Login from "../pages/auth/Login.jsx";
import Register from "../pages/auth/Register.jsx";
import Settings from "../pages/Settings.jsx";
import Profile from "../pages/settings/profile.jsx";
import Notifications from "../pages/settings/notification.jsx";
import Sending from "../pages/settings/sending.jsx";
import Security from "../pages/settings/security.jsx";

import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import GuestRoute from "./GuestRoute.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/unsubscribe" element={<Unsubscribe />} />
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route
            path="/contact"
            element={<Navigate to="/contacts" replace />}
          />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/campaigns/new" element={<CampaignCreate />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/inbox" element={<Inbox />} />

          <Route path="/settings" element={<Settings />}>
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<Profile />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="sending" element={<Sending />} />
            <Route path="security" element={<Security />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
