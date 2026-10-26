import { useState } from "react";
import { changePassword } from "../../api/settingsApi.js";

export default function Security() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (form.newPassword.length < 12) {
      setError("Your new password must contain at least 12 characters.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }

    setSaving(true);

    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setMessage("Password changed successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not change password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6"
    >
      <div>
        <h2 className="text-xl font-bold">Security</h2>
        <p className="mt-2 text-sm text-gray-500">
          Change your account password.
        </p>
      </div>

      {[
        ["currentPassword", "Current password"],
        ["newPassword", "New password"],
        ["confirmPassword", "Confirm new password"],
      ].map(([name, label]) => (
        <div key={name}>
          <label
            htmlFor={name}
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
          <input
            id={name}
            type="password"
            autoComplete="new-password"
            required
            minLength={name === "currentPassword" ? undefined : 12}
            value={form[name]}
            onChange={(event) =>
              setForm((current) => ({ ...current, [name]: event.target.value }))
            }
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      ))}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm text-green-700">
          {message}
        </p>
      )}

      <button
        disabled={saving}
        className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
      >
        {saving ? "Updating..." : "Change password"}
      </button>
    </form>
  );
}
