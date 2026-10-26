import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteImapSettings,
  deleteSmtpSettings,
  getSettings,
  testImapSettings,
  testSmtpSettings,
  updateImapSettings,
  updateSending,
  updateSmtpSettings,
} from "../../api/settingsApi.js";
import { useAuthContext } from "../../context/AuthContext.jsx";

const sendingDefaults = {
  senderName: "",
  senderEmail: "",
  replyToEmail: "",
};

const smtpDefaults = {
  host: "",
  port: 587,
  secure: false,
  username: "",
  password: "",
  senderEmail: "",
};

const imapDefaults = {
  host: "",
  port: 993,
  secure: true,
  username: "",
  password: "",
  mailbox: "INBOX",
};

const fieldClass =
  "w-full rounded-xl border border-white/10 bg-emerald-950/30 px-4 py-3 text-gray-100 outline-none placeholder:text-gray-500 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/10";
const labelClass = "mb-1 block text-sm font-medium text-gray-300";
const cardClass = "space-y-5 rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/10 backdrop-blur";
const buttonClass =
  "rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-5 py-3 font-semibold text-emerald-100 backdrop-blur transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50";

const smtpFormFromSettings = (smtp = {}, defaultEmail = "") => ({
  host: smtp.host || "",
  port: smtp.port || 587,
  secure: Boolean(smtp.secure),
  username: smtp.username || "",
  password: "",
  senderEmail: smtp.senderEmail || defaultEmail,
});

const imapFormFromSettings = (imap = {}) => ({
  host: imap.host || "",
  port: imap.port || 993,
  secure: imap.secure !== false,
  username: imap.username || "",
  password: "",
  mailbox: imap.mailbox || "INBOX",
});

const cleanSmtpPayload = (form) => ({
  host: typeof form.host === "string" ? form.host.trim().toLowerCase() : "",
  port: Number(form.port),
  secure: Boolean(form.secure),
  username: typeof form.username === "string" ? form.username.trim() : "",
  password: typeof form.password === "string" ? form.password : "",
  senderEmail: typeof form.senderEmail === "string" ? form.senderEmail.trim().toLowerCase() : "",
});

const cleanImapPayload = (form) => ({
  host: typeof form.host === "string" ? form.host.trim().toLowerCase() : "",
  port: Number(form.port),
  secure: Boolean(form.secure),
  username: typeof form.username === "string" ? form.username.trim() : "",
  password: typeof form.password === "string" ? form.password : "",
  mailbox: typeof form.mailbox === "string" ? form.mailbox.trim() : "INBOX",
});

export default function Sending() {
  const { user } = useAuthContext();
  const [form, setForm] = useState(sendingDefaults);
  const [smtpForm, setSmtpForm] = useState(smtpDefaults);
  const [imapForm, setImapForm] = useState(imapDefaults);
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const [imapConfigured, setImapConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [smtpMessage, setSmtpMessage] = useState("");
  const [smtpError, setSmtpError] = useState("");
  const [testedConfiguration, setTestedConfiguration] = useState("");
  const [testingImap, setTestingImap] = useState(false);
  const [savingImap, setSavingImap] = useState(false);
  const [removingImap, setRemovingImap] = useState(false);
  const [imapMessage, setImapMessage] = useState("");
  const [imapError, setImapError] = useState("");
  const [testedImapConfiguration, setTestedImapConfiguration] = useState("");

  useEffect(() => {
    getSettings()
      .then(({ data }) => {
        setForm({
          ...sendingDefaults,
          senderName: user?.name || "",
          senderEmail: user?.email || "",
          ...data.sending,
        });
        setSmtpForm(smtpFormFromSettings(data.smtp, user?.email || ""));
        setSmtpConfigured(Boolean(data.smtp?.configured));
        setImapForm(imapFormFromSettings(data.imap));
        setImapConfigured(Boolean(data.imap?.configured));
      })
      .catch((err) =>
        setError(
          err.response?.data?.message || "Could not load sending settings.",
        ),
      )
      .finally(() => setLoading(false));
  }, [user?.email, user?.name]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const { data } = await updateSending(form);
      setForm({ ...sendingDefaults, ...data.sending });
      setMessage("Sender defaults saved.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not save sender defaults.",
      );
    } finally {
      setSaving(false);
    }
  };

  const saveSmtp = async (event) => {
    event.preventDefault();
    setSaving(true);
    setSmtpMessage("");
    setSmtpError("");

    try {
      const { data } = await updateSmtpSettings(cleanSmtpPayload(smtpForm));
      setSmtpConfigured(true);
      setSmtpForm(smtpFormFromSettings(data.smtp, user?.email || ""));
      setForm((current) => ({ ...current, ...data.sending }));
      setSmtpMessage("Your account SMTP settings are securely saved.");
    } catch (err) {
      setSmtpError(
        err.response?.data?.message || "Could not save account SMTP settings.",
      );
    } finally {
      setSaving(false);
    }
  };

  const testSmtp = async () => {
    setTesting(true);
    setSmtpMessage("");
    setSmtpError("");
    const payload = cleanSmtpPayload(smtpForm);
    const tested = JSON.stringify(payload);
    try {
      await testSmtpSettings(payload);
      setTestedConfiguration(tested);
      setSmtpMessage("Connection successful. The SMTP account is ready.");
    } catch (err) {
      setTestedConfiguration("");
      setSmtpError(
        err.response?.data?.message || "Could not verify this SMTP connection.",
      );
    } finally {
      setTesting(false);
    }
  };

  const removeSmtp = async () => {
    setRemoving(true);
    setSmtpMessage("");
    setSmtpError("");
    try {
      const { data } = await deleteSmtpSettings();
      setSmtpConfigured(false);
      setSmtpForm(smtpFormFromSettings(data.smtp, user?.email || ""));
      setTestedConfiguration("");
      setSmtpMessage("Account SMTP settings removed.");
    } catch (err) {
      setSmtpError(
        err.response?.data?.message || "Could not remove SMTP settings.",
      );
    } finally {
      setRemoving(false);
    }
  };

  const changeSmtp = (event) => {
    const { name, value, checked, type } = event.target;
    setTestedConfiguration("");
    setSmtpMessage("");
    setSmtpForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  const changeImap = (event) => {
    const { name, value, checked, type } = event.target;
    setTestedImapConfiguration("");
    setImapMessage("");
    setImapForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const testImap = async () => {
    setTestingImap(true);
    setImapMessage("");
    setImapError("");
    const payload = cleanImapPayload(imapForm);
    const tested = JSON.stringify(payload);
    try {
      const { data } = await testImapSettings(payload);
      setTestedImapConfiguration(tested);
      setImapMessage(`Connection successful. Mailbox “${data.mailbox}” is ready to monitor.`);
    } catch (err) {
      setTestedImapConfiguration("");
      setImapError(err.response?.data?.message || "Could not verify this IMAP connection.");
    } finally {
      setTestingImap(false);
    }
  };

  const saveImap = async (event) => {
    event.preventDefault();
    setSavingImap(true);
    setImapMessage("");
    setImapError("");
    try {
      const { data } = await updateImapSettings(cleanImapPayload(imapForm));
      setImapConfigured(true);
      setImapForm(imapFormFromSettings(data.imap));
      setTestedImapConfiguration("");
      setImapMessage("Your account IMAP settings are securely saved.");
    } catch (err) {
      setImapError(err.response?.data?.message || "Could not save account IMAP settings.");
    } finally {
      setSavingImap(false);
    }
  };

  const removeImap = async () => {
    setRemovingImap(true);
    setImapMessage("");
    setImapError("");
    try {
      const { data } = await deleteImapSettings();
      setImapConfigured(false);
      setImapForm(imapFormFromSettings(data.imap));
      setTestedImapConfiguration("");
      setImapMessage("Account IMAP settings removed.");
    } catch (err) {
      setImapError(err.response?.data?.message || "Could not remove IMAP settings.");
    } finally {
      setRemovingImap(false);
    }
  };

  const smtpConfigurationTested =
    testedConfiguration === JSON.stringify(smtpForm);
  const imapConfigurationTested =
    testedImapConfiguration === JSON.stringify(imapForm);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-gray-300">
        Loading sending settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className={cardClass}>
        <div>
          <h2 className="text-xl font-bold text-gray-100">Sender defaults</h2>
          <p className="mt-2 text-sm text-gray-400">
            These details are prefilled when you create campaigns.
          </p>
        </div>

        {[
          ["senderName", "Sender name", "text"],
          ["senderEmail", "Sender email", "email"],
          ["replyToEmail", "Reply-to email", "email"],
        ].map(([name, label, type]) => (
          <div key={name}>
            <label htmlFor={name} className={labelClass}>
              {label}
            </label>
            <input
              id={name}
              name={name}
              type={type}
              required={name !== "replyToEmail"}
              value={form[name]}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  [name]: event.target.value,
                }))
              }
              className={fieldClass}
            />
          </div>
        ))}

        {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
        {message && <p role="status" className="text-sm text-emerald-300">{message}</p>}

        <button type="submit" disabled={saving} className={buttonClass}>
          {saving ? "Saving..." : "Save sender defaults"}
        </button>
      </form>

      <form onSubmit={saveSmtp} className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-100">Private email delivery</h2>
            <p className="mt-2 text-sm text-gray-400">
              Campaigns use this account’s SMTP credentials, not a shared sender.
            </p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-medium ${
            smtpConfigured
              ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
              : "border-amber-300/20 bg-amber-400/10 text-amber-200"
          }`}>
            {smtpConfigured ? "Configured" : "Not configured"}
          </span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="smtp-host" className={labelClass}>SMTP host</label>
            <input id="smtp-host" name="host" required value={smtpForm.host} onChange={changeSmtp} placeholder="smtp.example.com" className={fieldClass} />
          </div>
          <div>
            <label htmlFor="smtp-port" className={labelClass}>Port</label>
            <input id="smtp-port" name="port" type="number" min="1" max="65535" required value={smtpForm.port} onChange={changeSmtp} className={fieldClass} />
          </div>
          <div>
            <label htmlFor="smtp-username" className={labelClass}>SMTP username</label>
            <input id="smtp-username" name="username" type="text" required autoComplete="username" value={smtpForm.username} onChange={changeSmtp} placeholder="Your full email address or mailbox username" className={fieldClass} />
          </div>
          <div>
            <label htmlFor="smtp-password" className={labelClass}>
              App password {smtpConfigured && <span className="font-normal text-gray-500">(leave blank to keep current)</span>}
            </label>
            <input id="smtp-password" name="password" type="password" required={!smtpConfigured} autoComplete="new-password" value={smtpForm.password} onChange={changeSmtp} className={fieldClass} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="smtp-sender-email" className={labelClass}>Authorized sender email</label>
            <input id="smtp-sender-email" name="senderEmail" type="email" required value={smtpForm.senderEmail} onChange={changeSmtp} className={fieldClass} />
          </div>
        </div>

        <label className="flex items-center gap-3 text-sm text-gray-300">
          <input
            name="secure"
            type="checkbox"
            checked={smtpForm.secure}
            onChange={changeSmtp}
            className="h-4 w-4 accent-emerald-400"
          />
          Use implicit TLS (typically port 465; otherwise require STARTTLS)
        </label>

        <p className="rounded-xl border border-emerald-300/10 bg-emerald-400/5 p-3 text-sm text-gray-300">
          For Gmail, SMTP username must be your full Google email address, not
          a display name. Put “Mailroom” in Sender name above. Create a Google
          App Password with 2-Step Verification enabled and enter it here;
          spaces are removed automatically. Credentials are encrypted before
          storage and never returned by the server. Custom business email
          servers are supported when their SMTP host is approved by the server
          administrator.
        </p>

        {smtpError && <p role="alert" className="text-sm text-rose-300">{smtpError}</p>}
        {smtpMessage && <p role="status" className="text-sm text-emerald-300">{smtpMessage}</p>}

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving || !smtpConfigurationTested} className={buttonClass}>
            {saving ? "Saving..." : smtpConfigurationTested ? "Save SMTP settings" : "Test connection before saving"}
          </button>
          <button type="button" onClick={testSmtp} disabled={testing || (!smtpConfigured && !smtpForm.password)} className={buttonClass}>
            {testing ? "Testing..." : "Test connection"}
          </button>
          {smtpConfigured && (
            <button type="button" onClick={removeSmtp} disabled={removing} className="rounded-xl border border-rose-300/20 bg-rose-400/5 px-5 py-3 font-semibold text-rose-200 backdrop-blur transition hover:bg-rose-400/10 disabled:opacity-50">
              {removing ? "Removing..." : "Remove SMTP settings"}
            </button>
          )}
        </div>
      </form>

      <form onSubmit={saveImap} className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-100">Inbox monitoring (IMAP)</h2>
            <p className="mt-2 text-sm text-gray-400">
              Connect your mailbox to browse received messages, search folders, and manage email in Inbox.
            </p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-medium ${
            imapConfigured
              ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
              : "border-amber-300/20 bg-amber-400/10 text-amber-200"
          }`}>
            {imapConfigured ? "Connected" : "Not connected"}
          </span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="imap-host" className={labelClass}>IMAP host</label>
            <input id="imap-host" name="host" required value={imapForm.host} onChange={changeImap} placeholder="imap.yourbusiness.com" className={fieldClass} />
          </div>
          <div>
            <label htmlFor="imap-port" className={labelClass}>Port</label>
            <input id="imap-port" name="port" type="number" min="1" max="65535" required value={imapForm.port} onChange={changeImap} className={fieldClass} />
          </div>
          <div>
            <label htmlFor="imap-username" className={labelClass}>Mailbox username</label>
            <input id="imap-username" name="username" type="text" required autoComplete="username" value={imapForm.username} onChange={changeImap} placeholder="you@yourbusiness.com" className={fieldClass} />
          </div>
          <div>
            <label htmlFor="imap-password" className={labelClass}>
              Password or app password {imapConfigured && <span className="font-normal text-gray-500">(leave blank to keep current)</span>}
            </label>
            <input id="imap-password" name="password" type="password" required={!imapConfigured} autoComplete="new-password" value={imapForm.password} onChange={changeImap} className={fieldClass} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="imap-mailbox" className={labelClass}>Inbox folder</label>
            <input id="imap-mailbox" name="mailbox" required value={imapForm.mailbox} onChange={changeImap} placeholder="INBOX" className={fieldClass} />
            <p className="mt-1 text-xs text-gray-500">Usually “INBOX”. Other folders such as Sent and Archive are detected automatically when your provider exposes them.</p>
          </div>
        </div>

        <label className="flex items-center gap-3 text-sm text-gray-300">
          <input
            name="secure"
            type="checkbox"
            checked={imapForm.secure}
            onChange={changeImap}
            className="h-4 w-4 accent-emerald-400"
          />
          Use implicit TLS (typically port 993; turn off for STARTTLS on port 143)
        </label>

        <p className="rounded-xl border border-emerald-300/10 bg-emerald-400/5 p-3 text-sm text-gray-300">
          IMAP credentials are encrypted and private to your account. For custom
          business email, ask the server administrator to approve your exact
          IMAP host. Mail is fetched from the provider when Inbox is opened;
          Mailroom does not copy or store mailbox messages.
        </p>

        {imapError && <p role="alert" className="text-sm text-rose-300">{imapError}</p>}
        {imapMessage && <p role="status" className="text-sm text-emerald-300">{imapMessage}</p>}

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={savingImap || !imapConfigurationTested} className={buttonClass}>
            {savingImap ? "Saving..." : imapConfigurationTested ? "Save IMAP settings" : "Test connection before saving"}
          </button>
          <button type="button" onClick={testImap} disabled={testingImap || (!imapConfigured && !imapForm.password)} className={buttonClass}>
            {testingImap ? "Testing..." : "Test IMAP connection"}
          </button>
          {imapConfigured && (
            <button type="button" onClick={removeImap} disabled={removingImap} className="rounded-xl border border-rose-300/20 bg-rose-400/5 px-5 py-3 font-semibold text-rose-200 backdrop-blur transition hover:bg-rose-400/10 disabled:opacity-50">
              {removingImap ? "Removing..." : "Disconnect IMAP"}
            </button>
          )}
          {imapConfigured && <Link to="/inbox" className={`${buttonClass} inline-flex items-center`}>Open Inbox</Link>}
        </div>
      </form>
    </div>
  );
}
