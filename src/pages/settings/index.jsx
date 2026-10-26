import { NavLink, Outlet } from "react-router-dom";

const settingsLinks = [
  {
    to: "/settings/profile",
    label: "Profile",
    description: "Your personal and company details",
    icon: "👤",
  },
  {
    to: "/settings/notifications",
    label: "Notifications",
    description: "Manage email and account alerts",
    icon: "🔔",
  },
  {
    to: "/settings/sending",
    label: "Sending",
    description: "Configure sender details",
    icon: "✉️",
  },
  {
    to: "/settings/security",
    label: "Security",
    description: "Password and account security",
    icon: "🔐",
  },
];

export default function SettingsHome() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-500">
            Manage your profile, notifications, sending preferences and
            security.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <nav className="h-fit rounded-2xl border border-gray-200 bg-white p-3">
            {settingsLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `mb-1 flex items-center gap-3 rounded-xl p-3 transition ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`
                }
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <section className="min-w-0">
            <Outlet />
          </section>
        </div>
      </div>
    </main>
  );
}
