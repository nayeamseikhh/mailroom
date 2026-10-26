
import { useEffect, useState } from "react";
import {
  FiArrowLeft,
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiEdit3,
  FiHelpCircle,
  FiMail,
  FiPlus,
  FiSend,
  FiSettings,
  FiTrash2,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { getContacts } from "../api/contactApi.js";
import { getLists } from "../api/listApi.js";
import { getSettings } from "../api/settingsApi.js";
import {
  createCampaign,
  deleteCampaign,
  getCampaign,
  getCampaignPreview,
  getCampaignReadiness,
  sendCampaign,
  sendCampaignTest,
  updateCampaign,
} from "../api/campaignApi.js";
import { renderPersonalization } from "../utils/personalization.js";

const EMPTY_MESSAGE = {
  senderName: "",
  senderEmail: "",
  cc: "",
  bcc: "",
  replyTo: "",
  subject: "",
  previewText: "",
  body: "",
  audienceListId: "",
  audienceListIds: [],
};

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Could not complete the request. Please try again."
  );
}

function Section({ icon: Icon, title, description, children, action }) {
  return (
    <section className="border-b border-white/15 px-5 py-5 sm:px-7">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-emerald-100/25 bg-emerald-300/15 text-emerald-100 shadow-[0_6px_18px_rgba(2,18,12,0.18)]">
            <Icon size={18} />
          </span>
          <div>
            <h3 className="font-semibold text-white">{title}</h3>
            <p className="mt-1 text-sm leading-5 text-white/65">
              {description}
            </p>
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children, hint }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-white/80">
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-xs leading-5 text-white/55">{hint}</p>
      )}
    </div>
  );
}

function TextInput({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-emerald-100/25 bg-emerald-950/55 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-emerald-200/70 focus:bg-emerald-950/80 focus:ring-2 focus:ring-emerald-200/15 ${className}`}
    />
  );
}

function parseEmails(value) {
  return value
    .split(/[;,\n]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function CampaignComposer({ draftId }) {
  const location = useLocation();
  const navigate = useNavigate();
  const template = location.state?.template || null;
  const templateName = typeof template === "string" ? template : template?.name || "";
  const templateStarter = typeof template === "object" && template
    ? {
      subject: template.subject || "",
      previewText: template.previewText || "",
      body: template.body || "",
    }
    : {};

  const [message, setMessage] = useState(() => ({
    ...EMPTY_MESSAGE,
    ...templateStarter,
  }));
  const [lists, setLists] = useState([]);
  const [availableContacts, setAvailableContacts] = useState([]);
  const [previewContacts, setPreviewContacts] = useState([]);
  const [contactIds, setContactIds] = useState([]);
  const [previewContactId, setPreviewContactId] = useState("");
  const [testAddress, setTestAddress] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [audienceInfo, setAudienceInfo] = useState({ key: "", count: null, error: false });
  const [loadingLists, setLoadingLists] = useState(true);
  const [smtpStatus, setSmtpStatus] = useState("checking");
  const [smtpSender, setSmtpSender] = useState("");
  const [smtpErrorMessage, setSmtpErrorMessage] = useState("");
  const [loadedCampaignId, setLoadedCampaignId] = useState(null);

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  const [showSenderEditor, setShowSenderEditor] = useState(false);
  const [showRecipientsEditor, setShowRecipientsEditor] = useState(true);
  const [showSubjectEditor, setShowSubjectEditor] = useState(true);
  const [showDesignEditor, setShowDesignEditor] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const [recipientInput, setRecipientInput] = useState("");
  const [recipientEmails, setRecipientEmails] = useState([]);
  const [fallbackValues, setFallbackValues] = useState({ name: "there" });
  const loadingCampaign = Boolean(draftId) && loadedCampaignId !== draftId;

  const selectedListIds = message.audienceListIds?.length
    ? message.audienceListIds
    : message.audienceListId
      ? [message.audienceListId]
      : [];
  const audienceKey = [...selectedListIds].sort().join(",");
  const selectedContactIdsKey = contactIds.join(",");
  const selectedAudiences = lists.filter((list) => selectedListIds.includes(list._id));
  const audienceInfoMatches = audienceInfo.key === audienceKey;
  const audienceCount = audienceInfoMatches ? audienceInfo.count : null;
  const audienceError = audienceInfoMatches && audienceInfo.error;
  const smtpConfigured = smtpStatus === "connected";
  const displayedPreviewContacts = audienceKey ? previewContacts : availableContacts;
  const selectedContact = displayedPreviewContacts.find((contact) => contact._id === previewContactId) ||
    displayedPreviewContacts.find((contact) => contactIds.includes(contact._id)) ||
    displayedPreviewContacts[0] ||
    null;
  const renderedSubject = renderPersonalization(message.subject, selectedContact, fallbackValues);
  const renderedBody = renderPersonalization(message.body, selectedContact, fallbackValues);

  const updateMessage = (field, value) => {
    setMessage((current) => ({ ...current, [field]: value }));
    setNotice("");
    setError("");
    setSavedAt("");
  };

  const insertPlaceholder = (field, token) => {
    updateMessage(field, `${message[field] || ""}{{${token}}}`);
  };

  useEffect(() => {
    let cancelled = false;

    getLists({ limit: 100 })
      .then((response) => {
        const items = Array.isArray(response.data)
          ? response.data
          : response.data?.lists;

        if (!Array.isArray(items)) {
          throw new Error("Invalid contact list response.");
        }

        if (!cancelled) setLists(items);
      })
      .catch((loadError) => {
        if (!cancelled) setError(getErrorMessage(loadError));
      })
      .finally(() => {
        if (!cancelled) setLoadingLists(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!audienceKey) return undefined;
    const listIds = audienceKey.split(",");
    const selectedIds = new Set(selectedContactIdsKey.split(",").filter(Boolean));
    Promise.all(listIds.map((listId) => getContacts({
      listId,
      status: "Subscribed",
      page: 1,
      limit: 100,
    })))
      .then((responses) => {
        if (cancelled) return;
        const contacts = responses.flatMap((response) => response.data?.contacts || []);
        const selected = availableContacts.filter((contact) => selectedIds.has(contact._id));
        const unique = new Map([...contacts, ...selected].map((contact) => [contact._id, contact]));
        setPreviewContacts([...unique.values()]);
        setPreviewContactId((current) => unique.has(current) ? current : [...unique.keys()][0] || "");
      })
      .catch((loadError) => {
        if (!cancelled) setError(getErrorMessage(loadError));
      });
    return () => { cancelled = true; };
  }, [audienceKey, availableContacts, selectedContactIdsKey]);

  useEffect(() => {
    let cancelled = false;
    getContacts({
      status: "Subscribed",
      page: 1,
      limit: 100,
    })
      .then(({ data }) => {
        if (!cancelled) {
          const contacts = data?.contacts || [];
          setAvailableContacts(contacts);
          setPreviewContactId((current) => (
            contacts.some((contact) => contact._id === current)
              ? current
              : contacts[0]?._id || ""
          ));
        }
      })
      .catch((loadError) => {
        if (!cancelled) setError(getErrorMessage(loadError));
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    getCampaignReadiness()
      .then(({ data }) => {
        if (cancelled) return;
        setSmtpStatus(
          !data?.smtpConfigured
            ? "unconfigured"
            : data?.smtpConnected
              ? "connected"
              : "disconnected",
        );
        setSmtpSender(data?.verifiedSender || "");
        setSmtpErrorMessage(data?.error || "");
        setMessage((current) => ({
          ...current,
          senderEmail: current.senderEmail || data?.verifiedSender || "",
        }));
      })
      .catch((loadError) => {
        if (!cancelled) {
          setSmtpStatus("unavailable");
          setError(getErrorMessage(loadError));
        }
      });

    getSettings()
      .then(({ data }) => {
        if (cancelled) return;
        setMessage((current) => ({
          ...current,
          senderName: current.senderName || data?.sending?.senderName || "",
          senderEmail: current.senderEmail || data?.sending?.senderEmail || "",
          replyTo: current.replyTo || data?.sending?.replyToEmail || "",
        }));
        if (!data?.sending?.senderName || !data?.sending?.senderEmail) {
          setShowSenderEditor(true);
        }
      })
      .catch((loadError) => {
        if (!cancelled) setError(getErrorMessage(loadError));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!draftId) return undefined;

    let cancelled = false;

    getCampaign(draftId)
      .then(({ data }) => {
        if (cancelled) return;
        const campaign = data?.campaign;
        if (!campaign) throw new Error("Campaign was not returned by the server.");
        setMessage({
          ...EMPTY_MESSAGE,
          ...campaign,
          audienceListId: campaign.audienceListId || "",
          audienceListIds: campaign.audienceListIds?.length
            ? campaign.audienceListIds
            : campaign.audienceListId
              ? [campaign.audienceListId]
              : [],
          cc: Array.isArray(campaign.cc) ? campaign.cc.join(", ") : campaign.cc || "",
          bcc: Array.isArray(campaign.bcc) ? campaign.bcc.join(", ") : campaign.bcc || "",
        });
        setRecipientEmails(campaign.recipients || []);
        setContactIds(campaign.contactIds || []);
        setFallbackValues(campaign.fallbackValues || { name: "there" });
        setNotice("Draft loaded from your workspace.");
      })
      .catch((loadError) => {
        if (!cancelled) setError(getErrorMessage(loadError));
      })
      .finally(() => {
        if (!cancelled) setLoadedCampaignId(draftId);
      });

    return () => {
      cancelled = true;
    };
  }, [draftId]);

  useEffect(() => {
    if (!audienceKey) return undefined;
    let cancelled = false;
    const listIds = audienceKey.split(",");
    Promise.all(listIds.map((listId) => getContacts({
      listId,
      status: "Subscribed",
      page: 1,
      limit: 1,
    })))
      .then((responses) => {
        if (!cancelled) {
          setAudienceInfo({
            key: audienceKey,
            count: responses.reduce((sum, response) => sum + (response.data?.pagination?.total ?? 0), 0),
            error: false,
          });
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setAudienceInfo({ key: audienceKey, count: null, error: true });
          setError(getErrorMessage(loadError));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [audienceKey]);

  const addRecipients = () => {
    const entered = parseEmails(recipientInput);

    if (!entered.length) return;

    const invalid = entered.find((email) => !isValidEmail(email));

    if (invalid) {
      setError(`"${invalid}" is not a valid email address.`);
      return;
    }

    setRecipientEmails((current) =>
      [...new Set([...current, ...entered])],
    );
    setRecipientInput("");
    setNotice("");
    setError("");
  };

  const removeRecipient = (emailToRemove) => {
    setRecipientEmails((current) =>
      current.filter((email) => email !== emailToRemove),
    );
  };

  const getCampaignPayload = () => {
    return {
      name: message.subject.trim() || "Untitled campaign",
      senderName: message.senderName,
      senderEmail: message.senderEmail,
      recipients: [...new Set(recipientEmails)],
      contactIds: [...new Set(contactIds)],
      cc: parseEmails(message.cc),
      bcc: parseEmails(message.bcc),
      replyTo: message.replyTo,
      subject: message.subject,
      previewText: message.previewText,
      body: message.body,
      audienceListId: message.audienceListId || null,
      audienceListIds: selectedListIds,
      fallbackValues,
    };
  };

  const persistDraft = async () => {
    const payload = getCampaignPayload();
    const response = draftId
      ? await updateCampaign(draftId, payload)
      : await createCampaign(payload);
    const campaign = response.data?.campaign;
    if (!campaign?._id) throw new Error("Campaign could not be saved.");

    setSavedAt(campaign.updatedAt || new Date().toISOString());
    setNotice("Draft saved to your workspace.");
    if (!draftId) {
      navigate(`/campaigns/new?draft=${encodeURIComponent(campaign._id)}`, {
        replace: true,
        state: location.state,
      });
    }
    return campaign;
  };

  const handleSaveDraft = async (event) => {
    event?.preventDefault();

    try {
      setSaving(true);
      setError("");
      await persistDraft();
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = async () => {
    if (draftId) {
      try {
        await deleteCampaign(draftId);
      } catch (discardError) {
        setError(getErrorMessage(discardError));
        return;
      }
    }

    navigate("/campaigns");
  };

  const handleTestSend = async () => {
    if (!isValidEmail(testAddress.trim())) {
      setError("Enter a valid test email address.");
      return;
    }
    setTestSending(true);
    setError("");
    try {
      const campaign = await persistDraft();
      const { data } = await sendCampaignTest(campaign._id, {
        to: testAddress.trim(),
        contactId: selectedContact?._id,
      });
      setNotice(data.accepted ? "Test message accepted by the email provider." : "The provider did not accept the test message.");
    } catch (testError) {
      setError(getErrorMessage(testError));
    } finally {
      setTestSending(false);
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();

    const manualRecipients = [
      ...new Set(recipientEmails),
    ];

    const invalid = manualRecipients.find(
      (email) => !isValidEmail(email),
    );

    if (!manualRecipients.length && !contactIds.length && !selectedListIds.length) {
      setError("Select individual contacts or at least one contact list.");
      return;
    }

    if (invalid) {
      setError(`"${invalid}" is not a valid email address.`);
      return;
    }

    if (selectedListIds.length && audienceError) {
      setError("Could not load contacts from the selected lists.");
      return;
    }

    if (selectedListIds.length && audienceCount === null) {
      setError("Wait for the contact count to finish loading.");
      return;
    }

    if (selectedListIds.length && audienceCount === 0 && !manualRecipients.length && !contactIds.length) {
      setError("The selected lists have no subscribed contacts.");
      return;
    }

    if (!message.senderName.trim() || !isValidEmail(message.senderEmail)) {
      setError("Enter a valid sender name and email address.");
      setShowSenderEditor(true);
      return;
    }

    if (smtpSender && message.senderEmail.toLowerCase() !== smtpSender.toLowerCase()) {
      setError(`Sender email must match the verified SMTP address (${smtpSender}).`);
      setShowSenderEditor(true);
      return;
    }

    if (!message.subject.trim()) {
      setError("Add a subject line before continuing.");
      setShowSubjectEditor(true);
      return;
    }

    if (!message.body.trim()) {
      setError("Write your email content before continuing.");
      setShowDesignEditor(true);
      return;
    }

    if (!smtpConfigured) {
      setError("Email delivery is not configured. Add your account SMTP details in Settings > Sending before sending.");
      return;
    }

    setError("");
    setSending(true);
    try {
      const campaign = await persistDraft();
      const { data: audiencePreview } = await getCampaignPreview(campaign._id);
      if (!audiencePreview.eligibleCount) {
        setError(`No subscribed contacts are eligible. ${audiencePreview.skippedCount} selected contact(s) will be skipped.`);
        return;
      }
      if (audiencePreview.unresolved?.length) {
        setError(`Resolve missing personalization values before sending: ${audiencePreview.unresolved.join(", ")}.`);
        setShowSubjectEditor(true);
        setShowDesignEditor(true);
        return;
      }
      const confirmation = [
        `Sender: ${message.senderName} <${message.senderEmail}>`,
        `Subject: ${audiencePreview.sample.subject}`,
        `Selected contacts: ${audiencePreview.selectedCount}`,
        `Eligible: ${audiencePreview.eligibleCount}`,
        `Skipped or suppressed: ${audiencePreview.skippedCount}`,
        `Preview: ${audiencePreview.sample.body.slice(0, 600)}`,
        "",
        "Queue and send this real campaign?",
      ].join("\n");
      if (!window.confirm(confirmation)) return;
      await sendCampaign(campaign._id);
      navigate("/campaigns", {
        state: { notice: "Campaign queued. You can track delivery progress in the campaign list." },
      });
    } catch (sendError) {
      setError(getErrorMessage(sendError));
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link
          to="/campaigns"
          className="inline-flex items-center gap-2 text-sm font-medium text-white/70 hover:text-emerald-100"
        >
          <FiArrowLeft /> Back to campaigns
        </Link>

        {savedAt && (
          <span className="text-xs text-white/60">
            Saved{" "}
            {new Intl.DateTimeFormat(undefined, {
              hour: "numeric",
              minute: "2-digit",
            }).format(new Date(savedAt))}
          </span>
        )}
      </div>

      <section className="overflow-hidden rounded-3xl border border-white/20 bg-emerald-950/35 shadow-[0_18px_60px_rgba(2,18,12,0.28)] backdrop-blur-xl">
        <header className="flex items-center justify-between gap-3 border-b border-white/15 px-5 py-4 sm:px-7">
          <div>
            <h2 className="text-lg font-semibold">
              {draftId ? "Edit campaign" : "Create campaign"}
            </h2>
            <p className="mt-1 text-sm text-white/65">
              Set up your sender, recipients, subject, and email design.
            </p>
            {templateName && (
              <p className="mt-1 text-xs text-white/55">
                Starting with template: {templateName}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving || sending || loadingCampaign}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-emerald-100/25 bg-emerald-300/10 px-3 py-2 text-sm text-white/85 transition hover:bg-emerald-300/20 disabled:opacity-50"
          >
            <FiCheck /> {saving ? "Saving..." : "Save draft"}
          </button>
        </header>

        <form onSubmit={handleSend}>
          {loadingCampaign && (
            <div role="status" className="mx-5 mt-5 rounded-xl border border-emerald-100/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-50 sm:mx-7">
              Loading campaign details...
            </div>
          )}

          {error && (
            <div role="alert" className="mx-5 mt-5 rounded-xl border border-rose-200/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100 sm:mx-7">
              {error}
            </div>
          )}

          {notice && (
            <div role="status" className="mx-5 mt-5 rounded-xl border border-emerald-100/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-50 sm:mx-7">
              {notice}
            </div>
          )}

          {smtpStatus !== "connected" && smtpStatus !== "checking" && (
            <div role="status" className="mx-5 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200/25 bg-amber-300/10 px-4 py-3 text-sm text-amber-100 sm:mx-7">
              <div className="flex-1">
                {smtpStatus === "unconfigured"
                  ? "Account email delivery is not configured. You can save drafts, but sending stays disabled until you add SMTP details in Settings > Sending."
                  : smtpStatus === "disconnected"
                    ? (smtpErrorMessage || "SMTP settings are present, but the server could not connect to the mail provider. Check your SMTP host, port, and credentials.")
                    : "Could not verify the SMTP connection. Check the API server and try again."}
              </div>
              <Link
                to="/settings/sending"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-300/30 bg-amber-400/20 px-3 py-1.5 text-xs font-semibold text-amber-50 transition hover:bg-amber-400/30"
              >
                Go to Settings &gt; Sending
              </Link>
            </div>
          )}

          {smtpStatus === "checking" && (
            <div role="status" className="mx-5 mt-5 rounded-xl border border-emerald-100/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-50 sm:mx-7">
              Verifying secure email delivery connection...
            </div>
          )}

          {smtpStatus === "connected" && (
            <div role="status" className="mx-5 mt-5 rounded-xl border border-emerald-200/25 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-50 sm:mx-7">
              Email provider connected{smtpSender ? ` · verified sender ${smtpSender}` : ""}.
            </div>
          )}

          <Section
            icon={FiUser}
            title="Sender"
            description="The name and email address recipients will see."
            action={
              <button
                type="button"
                onClick={() => setShowSenderEditor((value) => !value)}
                className="text-sm font-semibold text-emerald-200 hover:text-emerald-100 hover:underline"
              >
                {showSenderEditor ? "Cancel" : "Manage sender"}
              </button>
            }
          >
            <div className="rounded-xl border border-white/15 bg-emerald-900/25 p-3">
              <p className="font-medium">{message.senderName || "Sender name"}</p>
              <p className="mt-1 text-sm text-white/70">
                {message.senderEmail || "sender@example.com"}
              </p>
              <p className="mt-2 text-xs text-white/55">
                Use the verified sender address configured by your email provider{smtpSender ? `: ${smtpSender}` : "."}
              </p>
            </div>

            {showSenderEditor && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Sender name">
                  <TextInput
                    value={message.senderName}
                    onChange={(e) => updateMessage("senderName", e.target.value)}
                    placeholder="Your name or company"
                    maxLength={100}
                  />
                </Field>
                <Field label="Sender email">
                  <TextInput
                    type="email"
                    value={message.senderEmail}
                    onChange={(e) => updateMessage("senderEmail", e.target.value)}
                    placeholder="you@yourdomain.com"
                    maxLength={254}
                  />
                </Field>
              </div>
            )}
          </Section>

          <Section
            icon={FiUsers}
            title="Recipients"
            description="Select subscribed contacts from the shared workspace or a contact list."
            action={
              <button
                type="button"
                onClick={() => setShowRecipientsEditor((value) => !value)}
                className="text-sm font-semibold text-emerald-200 hover:text-emerald-100"
              >
                {showRecipientsEditor ? "Hide" : "Add recipients"}
              </button>
            }
          >
            {showRecipientsEditor && (
              <div className="space-y-4">
                <Field label="Add an individual subscribed contact">
                  <select
                    value=""
                    onChange={(event) => {
                      const id = event.target.value;
                      if (id) setContactIds((current) => [...new Set([...current, id])]);
                    }}
                    className="w-full rounded-xl border border-emerald-100/25 bg-emerald-950/55 px-3 py-2.5 text-sm text-white"
                  >
                    <option value="">{availableContacts.length ? "Choose a contact" : "Loading subscribed contacts…"}</option>
                    {availableContacts.filter((contact) => !contactIds.includes(contact._id)).map((contact) => (
                      <option key={contact._id} value={contact._id}>{contact.name} · {contact.email}</option>
                    ))}
                  </select>
                </Field>
                {contactIds.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {contactIds.map((id) => {
                      const contact = availableContacts.find((item) => item._id === id);
                      return (
                        <span key={id} className="inline-flex items-center gap-2 rounded-full border border-emerald-100/20 bg-emerald-300/15 px-3 py-1.5 text-xs text-emerald-50">
                          {contact?.name || contact?.email || "Contact"}
                          <button type="button" aria-label={`Remove ${contact?.email || "contact"}`} onClick={() => setContactIds((current) => current.filter((item) => item !== id))}><FiTrash2 /></button>
                        </span>
                      );
                    })}
                  </div>
                )}
                <Field
                  label="Add subscribed contact email"
                  hint="Addresses must belong to subscribed contacts in the shared workspace."
                >
                  <div className="flex gap-2">
                    <TextInput
                      value={recipientInput}
                      onChange={(e) => setRecipientInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addRecipients();
                        }
                      }}
                      placeholder="person@example.com, another@example.com"
                    />
                    <button
                      type="button"
                      onClick={addRecipients}
                      className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-emerald-100/25 bg-emerald-300/20 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-300/30"
                    >
                      <FiPlus /> Add
                    </button>
                  </div>
                </Field>

                {recipientEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {recipientEmails.map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center gap-2 rounded-full border border-emerald-100/20 bg-emerald-300/15 px-3 py-1.5 text-xs text-emerald-50"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => removeRecipient(email)}
                          aria-label={`Remove ${email}`}
                        >
                          <FiTrash2 />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <Field label="Or choose one or more contact lists" hint="Contacts appearing in multiple selected lists are deduplicated before sending.">
                  <select
                    multiple
                    value={selectedListIds}
                    onChange={(event) => {
                      const ids = [...event.target.selectedOptions].map((option) => option.value);
                      setMessage((current) => ({
                        ...current,
                        audienceListIds: ids,
                        audienceListId: ids[0] || "",
                      }));
                    }}
                    disabled={loadingLists}
                    className="min-h-28 w-full rounded-xl border border-emerald-100/25 bg-emerald-950/55 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-emerald-200/70 focus:ring-2 focus:ring-emerald-200/15"
                  >
                    {loadingLists && <option disabled>Loading lists…</option>}
                    {lists.map((list) => (
                      <option key={list._id} value={list._id}>
                        {list.name}
                      </option>
                    ))}
                  </select>
                </Field>

                {selectedListIds.length > 0 && (
                  <p role="status" className="text-sm text-white/65">
                    {audienceError
                      ? "Could not load subscribers."
                      : audienceCount === null
                        ? "Loading subscribed contacts..."
                        : `${selectedAudiences.map((list) => list.name).join(", ")}: ${audienceCount} subscribed list member(s); overlapping contacts are deduplicated when sending.`}
                  </p>
                )}
              </div>
            )}
          </Section>

          <Section
            icon={FiMail}
            title="Subject"
            description="Add a subject line for this campaign."
            action={
              <button
                type="button"
                onClick={() => setShowSubjectEditor((value) => !value)}
                className="text-sm font-semibold text-emerald-200 hover:text-emerald-100"
              >
                {showSubjectEditor ? "Hide" : "Add a subject"}
              </button>
            }
          >
            {showSubjectEditor && (
              <div className="space-y-4">
                <Field label="Subject line">
                  <TextInput
                    value={message.subject}
                    onChange={(e) => updateMessage("subject", e.target.value)}
                    placeholder="Write a clear, engaging subject"
                    maxLength={200}
                    required
                  />
                </Field>
                <Field label="Preview text" hint="Optional text shown beside the subject in many inboxes.">
                  <TextInput
                    value={message.previewText}
                    onChange={(e) => updateMessage("previewText", e.target.value)}
                    placeholder="A short preview of your email"
                    maxLength={250}
                  />
                </Field>
                <div>
                  <p className="mb-2 text-xs font-medium text-white/70">Insert personalization</p>
                  <div className="flex flex-wrap gap-2">
                    {["name", "email", "companyName", "customFields.industry"].map((token) => (
                      <button key={token} type="button" onClick={() => insertPlaceholder("subject", token)} className="rounded-full border border-emerald-100/25 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-100 transition hover:bg-emerald-300/20">{`{{${token}}}`}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Section>

          <Section
            icon={FiEdit3}
            title="Design"
            description="Create your email content."
            action={
              <button
                type="button"
                onClick={() => setShowDesignEditor((value) => !value)}
                className="text-sm font-semibold text-emerald-200 hover:text-emerald-100"
              >
                {showDesignEditor ? "Hide editor" : "Start designing"}
              </button>
            }
          >
            {showDesignEditor && (
              <div className="space-y-4">
                <Field label="Email content">
                  <textarea
                    value={message.body}
                    onChange={(e) => updateMessage("body", e.target.value)}
                    placeholder={"Hi there,\n\nWrite your campaign message here...\n\nBest,\nYour team"}
                    rows={12}
                    className="w-full resize-y rounded-xl border border-emerald-100/25 bg-emerald-950/55 px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/40 focus:border-emerald-200/70 focus:ring-2 focus:ring-emerald-200/15"
                    required
                  />
                </Field>
                <div>
                  <p className="mb-2 text-xs font-medium text-white/70">Insert personalization</p>
                  <div className="flex flex-wrap gap-2">
                    {["name", "email", "companyName", "customFields.industry"].map((token) => (
                      <button key={token} type="button" onClick={() => insertPlaceholder("body", token)} className="rounded-full border border-emerald-100/25 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-100 transition hover:bg-emerald-300/20">{`{{${token}}}`}</button>
                    ))}
                  </div>
                </div>
                <Field label="Missing name fallback">
                  <TextInput
                    value={fallbackValues.name ?? ""}
                    onChange={(event) => setFallbackValues((current) => ({ ...current, name: event.target.value }))}
                    placeholder="there"
                    maxLength={100}
                  />
                </Field>
                <section className="rounded-2xl border border-white/15 bg-emerald-900/25 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Personalized preview</h4>
                      <p className="mt-1 text-xs text-white/60">Variables: {`{{name}}, {{email}}, {{companyName}}, {{customFields.industry}}`}</p>
                    </div>
                    <select value={selectedContact?._id || ""} onChange={(event) => setPreviewContactId(event.target.value)} className="max-w-full rounded-xl border border-emerald-100/25 bg-emerald-950/55 px-2 py-1.5 text-xs text-white">
                      {displayedPreviewContacts.map((contact) => <option key={contact._id} value={contact._id}>{contact.name} · {contact.email}</option>)}
                    </select>
                  </div>
                  <p className="text-sm font-medium">{renderedSubject.rendered || "Subject preview"}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/85">{renderedBody.rendered || "Email body preview"}</p>
                  {([...renderedSubject.unresolved, ...renderedBody.unresolved].length > 0) && (
                    <p role="alert" className="mt-3 text-xs text-amber-700">
                      Unresolved values for this preview: {[...new Set([...renderedSubject.unresolved, ...renderedBody.unresolved])].map((field) => `{{${field}}}`).join(", ")}
                    </p>
                  )}
                </section>
                <p className="text-xs text-white/55">
                  Your message is sent as text and a safe, formatted HTML version.
                </p>
              </div>
            )}
          </Section>

          <Section
            icon={FiSettings}
            title="Additional settings"
            description="Configure reply-to and copy recipients."
            action={
              <button
                type="button"
                onClick={() => setShowSettings((value) => !value)}
                className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-200 hover:text-emerald-100"
              >
                {showSettings ? "Hide settings" : "Edit settings"}
                {showSettings ? <FiChevronUp /> : <FiChevronDown />}
              </button>
            }
          >
            {showSettings && (
              <div className="space-y-4">
                <Field label="Reply-to email">
                  <TextInput
                    type="email"
                    value={message.replyTo}
                    onChange={(e) => updateMessage("replyTo", e.target.value)}
                    placeholder="replies@yourdomain.com"
                  />
                </Field>
                <Field label="CC recipients">
                  <TextInput
                    value={message.cc}
                    onChange={(e) => updateMessage("cc", e.target.value)}
                    placeholder="Optional: person@example.com"
                  />
                </Field>
                <Field label="BCC recipients">
                  <TextInput
                    value={message.bcc}
                    onChange={(e) => updateMessage("bcc", e.target.value)}
                    placeholder="Optional: person@example.com"
                  />
                </Field>

              </div>
            )}
          </Section>

          <footer className="flex flex-col gap-3 border-t border-white/15 bg-emerald-950/25 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div className="flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor="campaign-test-address">Test email address</label>
              <TextInput
                id="campaign-test-address"
                type="email"
                value={testAddress}
                onChange={(event) => setTestAddress(event.target.value)}
                placeholder="Test address"
                className="w-44 rounded-full"
              />
              <button
                type="button"
                onClick={handleTestSend}
                disabled={saving || testSending || sending || !smtpConfigured}
                className="rounded-full border border-emerald-100/25 bg-emerald-300/10 px-3 py-2.5 text-sm font-medium text-emerald-50 transition hover:bg-emerald-300/20 disabled:opacity-50"
              >
                {testSending ? "Sending test…" : "Send test"}
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving || sending || loadingCampaign}
                className="rounded-full border border-emerald-100/25 bg-emerald-300/10 px-4 py-2.5 text-sm font-medium text-emerald-50 transition hover:bg-emerald-300/20 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save draft"}
              </button>
              <button
                type="button"
                onClick={handleDiscard}
                disabled={saving || sending || loadingCampaign}
                className="inline-flex items-center gap-2 rounded-full px-3 py-2.5 text-sm text-white/65 transition hover:bg-rose-300/10 hover:text-rose-200"
              >
                <FiTrash2 /> Discard
              </button>
            </div>

            <button
              type="submit"
              disabled={saving || sending || loadingCampaign || !smtpConfigured}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-100/25 bg-emerald-500/70 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-400/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiSend /> {sending ? "Queueing..." : smtpConfigured === false ? "Configure email delivery" : "Send campaign"}
            </button>
          </footer>
        </form>
      </section>

      <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-white/55">
        <FiHelpCircle />
        Campaigns and drafts are saved to your workspace. Delivery progress is available in the campaign list.
      </p>
    </main>
  );
}

export default function CampaignCreate() {
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get("draft");

  return <CampaignComposer draftId={draftId} />;
}
