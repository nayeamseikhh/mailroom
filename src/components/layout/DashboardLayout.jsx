import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FiBarChart2,
  FiHome,
  FiInbox,
  FiLayout,
  FiLogOut,
  FiMenu,
  FiPlus,
  FiSend,
  FiSettings,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { useAuthContext } from "../../context/AuthContext.jsx";
import { getDashboardUsage } from "../../api/dashboardApi.js";

const NAV = [
  { label: "Dashboard", icon: FiHome, to: "/dashboard", end: true },
  { label: "Contacts", icon: FiUsers, to: "/contacts" },
  { label: "Campaigns", icon: FiSend, to: "/campaigns" },
  { label: "Templates", icon: FiLayout, to: "/templates" },
  { label: "Reports", icon: FiBarChart2, to: "/reports" },
  { label: "Inbox", icon: FiInbox, to: "/inbox" },
  { label: "Settings", icon: FiSettings, to: "/settings" },
];

const PAGE_DETAILS = {
  "/dashboard": ["Dashboard", "Monday, 19 October 2026"],
  "/contacts": ["Contacts", "Manage and grow your audience."],
  "/campaigns": ["Campaigns", "Create, schedule, and track your emails."],
  "/campaigns/new": ["New campaign", "Build an email your audience will love."],
  "/templates": ["Templates", "A great starting point for every send."],
  "/reports": ["Reports", "Understand how your campaigns are performing."],
  "/inbox": ["Inbox", "Read replies and messages from your connected mailbox."],
  "/settings": ["Settings", "Manage your workspace and preferences."],
};

function Sidebar({ open, onClose, usageData, usageLoading, usageError }) {
  const monthLabel = usageData
    ? new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
      }).format(new Date(usageData.monthStart))
    : "this month";

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-label="Close navigation"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-[#10231F] text-[#C4D2CE] transition-transform duration-200 motion-reduce:transition-none lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-6">
          <Link to="/dashboard" onClick={onClose} className="flex items-center gap-2.5 text-white">
            <span className="grid h-8 w-8 place-items-center rounded-md border border-emerald-200/25 bg-emerald-400/15 text-emerald-200 shadow-sm backdrop-blur">
              <FiSend aria-hidden="true" />
            </span>
            <span className="text-lg font-semibold tracking-tight">Mailroom</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white lg:hidden"
            aria-label="Close menu"
          >
            <FiX size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3" aria-label="Main">
          <ul className="space-y-1">
            {NAV.map(({ label, icon: Icon, to, end }) => (
              <li key={label}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] focus-visible:outline-2 focus-visible:outline-white ${
                      isActive
                        ? "bg-white/10 font-medium text-white"
                        : "hover:bg-white/5 hover:text-white"
                    }`
                  }
                >
                  <Icon size={18} aria-hidden="true" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="m-4 rounded-lg bg-white/5 p-4">
          <p className="text-sm font-medium text-white">Sending activity</p>
          {usageError ? (
            <p role="status" className="mt-1 text-xs text-amber-100">
              Usage unavailable
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm">
                {usageLoading ? "Loading usage…" : `${usageData?.acceptedThisMonth ?? 0} accepted`}
              </p>
              <p className="mt-1 text-xs text-white/65">
                Provider-accepted emails in {monthLabel}
              </p>
            </>
          )}
        </div>
      </aside>
    </>
  );
}

export default function DashboardLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [usageData, setUsageData] = useState(null);
  const [usageLoading, setUsageLoading] = useState(true);
  const [usageError, setUsageError] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const [title, subtitle] = PAGE_DETAILS[pathname] || ["Mailroom", ""];
  const initials = (user?.name || user?.email || "You").slice(0, 1).toUpperCase();
  const avatarUrl = user?.avatarUrl
    ? `${(import.meta.env.VITE_API_URL || "http://localhost:5001/api").replace(/\/api\/?$/, "")}${user.avatarUrl}`
    : "";

  useEffect(() => {
    let active = true;
    const syncUsage = async () => {
        if (!user?._id) {
          setUsageData(null);
          setUsageLoading(false);
          setUsageError(false);
          return;
        }
        try {
          const { data } = await getDashboardUsage();
        if (!active) return;
        setUsageData(data);
        setUsageError(false);
      } catch (error) {
        if (!active) return;
        setUsageError(true);
        if (error?.response?.status === 401) {
          window.clearInterval(intervalId);
          try {
            await logout();
          } catch (logoutError) {
            console.error("Could not clear an expired session:", logoutError);
          }
          if (active) navigate("/login", { replace: true });
          return;
        }
      } finally {
        if (active) setUsageLoading(false);
      }
    };

    let intervalId;
    syncUsage();
    intervalId = window.setInterval(syncUsage, 30_000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [user?._id, logout, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="mailroom-theme relative isolate min-h-screen bg-[#10231F] font-sans text-white lg:flex">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("https://res.cloudinary.com/c5gemcsi/image/upload/f_auto/q_auto/anaterate-leaves-4597501_cm0t2s.webp")' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-emerald-950/45"
      />
      <Sidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        usageData={usageData}
        usageLoading={usageLoading}
        usageError={usageError}
      />
      <div className="relative z-10 min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex min-h-[73px] items-center justify-between gap-4 border-b border-white/20 bg-emerald-950/55 px-5 py-4 text-white shadow-[0_8px_30px_rgba(2,18,12,0.18)] backdrop-blur sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="rounded p-1.5 text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white lg:hidden"
              aria-label="Open menu"
            >
              <FiMenu size={22} />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold">{title}</h1>
              <p className="truncate text-sm text-white/75">{subtitle}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {pathname !== "/campaigns/new" && (
              <Link
                to="/campaigns/new"
                className="inline-flex items-center gap-2 rounded-md bg-white/15 px-3 py-2.5 text-sm font-medium text-white hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-4"
              >
                <FiPlus aria-hidden="true" />
                <span className="hidden sm:inline">New campaign</span>
                <span className="sm:hidden">Create</span>
              </Link>
            )}
            <Link
              to="/settings/profile"
              className="flex min-w-0 items-center gap-2 rounded-full focus-visible:outline-2 focus-visible:outline-[#4F6DFF] sm:gap-3"
              aria-label="Edit profile"
              title="Edit profile"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" crossOrigin="use-credentials" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#DCE4FF] text-sm font-semibold text-[#2F4BE0]">{initials}</span>
              )}
              <span className="hidden min-w-0 text-left sm:block">
                <span className="block max-w-36 truncate text-sm font-medium text-white">
                  {user?.name || "Your profile"}
                </span>
                {user?.email && (
                  <span className="block max-w-36 truncate text-xs text-white/70">
                    {user.email}
                  </span>
                )}
              </span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-white/85 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white sm:px-3"
              aria-label="Sign out"
              title="Sign out"
            >
              <FiLogOut size={18} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
