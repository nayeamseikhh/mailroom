import { FiBell, FiMail, FiShield, FiUser } from "react-icons/fi";
import { NavLink, Outlet } from "react-router-dom";

const sections = [
  {
    label: "Profile",
    path: "/settings/profile",
    icon: FiUser,
  },
  {
    label: "Notifications",
    path: "/settings/notifications",
    icon: FiBell,
  },
  {
    label: "Sending",
    path: "/settings/sending",
    icon: FiMail,
  },
  {
    label: "Security",
    path: "/settings/security",
    icon: FiShield,
  },
];

export default function Settings() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-5 py-8 sm:px-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-sm text-gray-500">
          Manage your account, preferences and sending configuration.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav
          aria-label="Settings sections"
          className="h-fit rounded-xl border border-[#DCE2DF] bg-white p-2"
        >
          {sections.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `mb-1 flex items-center gap-3 rounded-md px-3 py-3 text-sm transition ${
                  isActive
                    ? "bg-[#EEF1FF] font-medium text-[#2F4BE0]"
                    : "text-[#5B6B67] hover:bg-[#F7F9F8]"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </main>
  );
}
