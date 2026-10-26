import { useEffect, useRef, useState } from "react";
import { FiCamera } from "react-icons/fi";
import { useAuthContext } from "../../context/AuthContext.jsx";
import { API_HOST_URL } from "../../api/axiosInstance.js";

const emptyProfile = { name: "", email: "", company: "", phone: "", timezone: "Asia/Dhaka" };
const avatarSource = (url) => url ? `${API_HOST_URL}${url}` : "";

export default function Profile() {
  const { user, updateProfile, updateAvatar } = useAuthContext();
  const [form, setForm] = useState(emptyProfile);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInput = useRef(null);

  useEffect(() => { if (user) setForm({ ...emptyProfile, ...user }); }, [user]);
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try { await updateProfile(form); setMessage("Your profile has been saved."); }
    catch (err) { setError(err.response?.data?.message || "Could not save your profile."); }
    finally { setSaving(false); }
  };

  const upload = async (event) => {
    const [file] = event.target.files;
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setError("Choose a JPG, PNG, or WebP image smaller than 2 MB."); event.target.value = ""; return;
    }
    setUploading(true); setError(""); setMessage("");
    try { await updateAvatar(file); setMessage("Your profile photo has been updated."); }
    catch (err) { setError(err.response?.data?.message || "Could not upload your profile photo."); }
    finally { setUploading(false); event.target.value = ""; }
  };

  const fields = [["name", "Full name", "text", true], ["email", "Email address", "email", true], ["company", "Company name", "text", false], ["phone", "Phone number", "tel", false]];
  const avatar = avatarSource(user?.avatarUrl);
  const initial = (user?.name || user?.email || "U").trim().charAt(0).toUpperCase();

  return <div className="rounded-2xl border border-gray-200 bg-white p-6">
    <div className="mb-8 flex items-center gap-4">
      <div className="relative shrink-0">
        {avatar ? <img src={avatar} alt="Your profile" crossOrigin="use-credentials" className="h-16 w-16 rounded-full object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-700">{initial}</div>}
        <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading} aria-label="Change profile photo" className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"><FiCamera size={14} /></button>
        <input ref={fileInput} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} />
      </div>
      <div><h2 className="text-xl font-bold text-gray-900">Profile details</h2><p className="text-sm text-gray-500">{uploading ? "Uploading photo..." : "Update the information associated with your account."}</p></div>
    </div>
    {error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}
    {message && <p role="status" className="mb-4 text-sm text-green-700">{message}</p>}
    <form onSubmit={save} className="space-y-5">
      {fields.map(([name, label, type, required]) => <div key={name}><label htmlFor={name} className="mb-1 block text-sm font-medium text-gray-700">{label}</label><input id={name} name={name} type={type} required={required} value={form[name] || ""} onChange={change} className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></div>)}
      <div><label htmlFor="timezone" className="mb-1 block text-sm font-medium text-gray-700">Time zone</label><select id="timezone" name="timezone" value={form.timezone} onChange={change} className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3"><option value="Asia/Dhaka">Asia/Dhaka (Bangladesh)</option><option value="UTC">UTC</option><option value="Asia/Kolkata">Asia/Kolkata</option><option value="Europe/London">Europe/London</option><option value="America/New_York">America/New_York</option></select></div>
      <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? "Saving..." : "Save profile"}</button>
    </form>
  </div>;
}
