import { useEffect, useState } from "react";
import { getSettings, updateNotifications } from "../../api/settingsApi.js";

const defaults = {
  campaignUpdates: true,
  weeklyReports: true,
  productUpdates: false,
  securityAlerts: true,
};

const options = [
  [
    "campaignUpdates",
    "Campaign updates",
    "Receive campaign status notifications.",
  ],
  ["weeklyReports", "Weekly reports", "Receive weekly performance summaries."],
  [
    "productUpdates",
    "Product updates",
    "Receive feature and product announcements.",
  ],
  [
    "securityAlerts",
    "Security alerts",
    "Receive important account security notifications.",
  ],
];

export default function Notifications() {
  const [preferences, setPreferences] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getSettings()
      .then(({ data }) => {
        setPreferences({ ...defaults, ...data.notifications });
      })
      .catch((err) =>
        setError(err.response?.data?.message || "Could not load preferences."),
      )
      .finally(() => setLoading(false));
  }, []);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const { data } = await updateNotifications(preferences);
      setPreferences({ ...defaults, ...data.notifications });
      setMessage("Notification preferences saved.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not save preferences.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <div className="rounded-2xl bg-white p-6">Loading...</div>;

  return (
    <form
      onSubmit={save}
      className="rounded-2xl border border-gray-200 bg-white p-6"
    >
      <h2 className="text-xl font-bold">Notifications</h2>
      <p className="mb-6 mt-2 text-sm text-gray-500">
        Choose which notifications you want to receive.
      </p>

      {options.map(([key, label, description]) => (
        <label
          key={key}
          className="flex cursor-pointer items-start justify-between gap-4 border-t border-gray-100 py-5"
        >
          <span>
            <span className="block font-medium text-gray-800">{label}</span>
            <span className="mt-1 block text-sm text-gray-500">
              {description}
            </span>
          </span>
          <input
            type="checkbox"
            checked={Boolean(preferences[key])}
            onChange={(event) =>
              setPreferences((current) => ({
                ...current,
                [key]: event.target.checked,
              }))
            }
            className="mt-1 h-5 w-5 accent-indigo-600"
          />
        </label>
      ))}

      {error && (
        <p role="alert" className="mb-3 text-sm text-red-600">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="mb-3 text-sm text-green-700">
          {message}
        </p>
      )}

      <button
        disabled={saving}
        className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save preferences"}
      </button>
    </form>
  );
}
