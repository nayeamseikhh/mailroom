import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiArchive,
  FiArrowLeft,
  FiAlertTriangle,
  FiCheck,
  FiChevronLeft,
  FiEdit2,
  FiInbox,
  FiMail,
  FiRefreshCw,
  FiSearch,
  FiSend,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import {
  getInboxMessage,
  getInboxMessages,
  sendInboxEmail,
  updateInboxMessage,
  updateInboxMessages,
} from "../../api/inboxApi.js";

const FOLDERS = [
  { id: "inbox", label: "Inbox", icon: FiInbox },
  { id: "sent", label: "Sent", icon: FiSend },
  { id: "all", label: "All mail", icon: FiMail },
  { id: "spam", label: "Spam", icon: FiAlertTriangle },
  { id: "trash", label: "Trash", icon: FiTrash2 },
];

function getErrorMessage(error) {
  return error?.response?.data?.message || "Could not complete the request. Please try again.";
}

function formatDate(value, full = false) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, full
    ? { dateStyle: "medium", timeStyle: "short" }
    : { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" },
  ).format(date);
}

function senderName(person) {
  return person?.name || person?.address || "Unknown sender";
}

function initials(person) {
  const words = senderName(person).trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? `${words[0][0]}${words[1][0]}` : (words[0] || "?").slice(0, 2)).toUpperCase();
}

function SetupNotice() {
  return (
    <section className="rounded-xl border border-[#DCE2DF] bg-white p-5">
      <h2 className="font-semibold">Inbox is temporarily unavailable</h2>
      <p className="mt-1 text-sm text-[#5B6B67]">
        Shared mailbox access has been disabled to protect account privacy. Inbox will return when each account can connect its own mailbox.
      </p>
    </section>
  );
}

function IconAction({ title, onClick, disabled, children, danger = false }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`grid h-8 w-8 place-items-center rounded-md transition disabled:opacity-50 ${
        danger ? "text-[#B42318] hover:bg-rose-50" : "text-[#52605B] hover:bg-[#EEF1EF]"
      }`}
    >
      {children}
    </button>
  );
}

function ComposeDialog({ onClose, onSend, sending, error }) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    await onSend({ to, subject, body });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="compose-title" className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-xl bg-white shadow-2xl sm:max-w-xl sm:rounded-xl">
        <header className="flex items-center justify-between bg-[#F2F4F1] px-4 py-3">
          <h2 id="compose-title" className="text-sm font-semibold">New message</h2>
          <IconAction title="Close compose" onClick={onClose}><FiX /></IconAction>
        </header>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="divide-y divide-[#E8ECEA] px-4">
            <label className="flex items-center gap-3 py-3 text-sm">
              <span className="w-14 text-[#71807B]">To</span>
              <input autoFocus required type="email" value={to} onChange={(event) => setTo(event.target.value)} className="min-w-0 flex-1 outline-none" placeholder="recipient@example.com" />
            </label>
            <label className="flex items-center gap-3 py-3 text-sm">
              <span className="w-14 text-[#71807B]">Subject</span>
              <input required maxLength={200} value={subject} onChange={(event) => setSubject(event.target.value)} className="min-w-0 flex-1 outline-none" placeholder="Subject" />
            </label>
          </div>
          <label className="sr-only" htmlFor="compose-body">Message</label>
          <textarea id="compose-body" required maxLength={100000} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write your message…" className="min-h-56 flex-1 resize-y px-4 py-3 text-sm leading-6 outline-none" />
          {error && <p role="alert" className="px-4 pb-2 text-sm text-rose-700">{error}</p>}
          <footer className="flex items-center justify-between border-t border-[#E8ECEA] px-4 py-3">
            <button type="submit" disabled={sending} className="inline-flex items-center gap-2 rounded-md bg-[#2F4BE0] px-4 py-2 text-sm font-medium text-white hover:bg-[#2640C2] disabled:opacity-60">
              <FiSend /> {sending ? "Sending…" : "Send"}
            </button>
            <span className="text-xs text-[#87938F]">Sent using configured SMTP</span>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default function Inbox() {
  const [folder, setFolder] = useState("inbox");
  const [messages, setMessages] = useState([]);
  const [selectedUid, setSelectedUid] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [selectedUids, setSelectedUids] = useState([]);
  const [search, setSearch] = useState("");
  const [loadedFolder, setLoadedFolder] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [acting, setActing] = useState(false);
  const [sending, setSending] = useState(false);
  const [folderError, setFolderError] = useState(null);
  const [composeError, setComposeError] = useState("");
  const [nextBefore, setNextBefore] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [mobileReaderOpen, setMobileReaderOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const refreshInbox = useCallback(async () => {
    setRefreshing(true);
    setFolderError(null);
    try {
      const result = await getInboxMessages(undefined, folder);
      const nextMessages = result.messages || [];
      setMessages(nextMessages);
      setNextBefore(result.nextBefore || null);
      setSelectedUids([]);
      setSelectedUid((current) => (
        nextMessages.some((item) => item.uid === current)
          ? current
          : nextMessages[0]?.uid ?? null
      ));
    } catch (requestError) {
      setFolderError({ folder, message: getErrorMessage(requestError) });
      setMessages([]);
      setSelectedUid(null);
      setSelectedMessage(null);
      setNextBefore(null);
    } finally {
      setRefreshing(false);
    }
  }, [folder]);

  useEffect(() => {
    let active = true;
    getInboxMessages(undefined, folder)
      .then((result) => {
        if (!active) return;
        const nextMessages = result.messages || [];
        setMessages(nextMessages);
        setNextBefore(result.nextBefore || null);
        setSelectedUids([]);
        setSelectedUid(nextMessages[0]?.uid ?? null);
        setMobileReaderOpen(false);
      })
      .catch((requestError) => {
        if (!active) return;
        setFolderError({ folder, message: getErrorMessage(requestError) });
        setMessages([]);
        setNextBefore(null);
        setSelectedUids([]);
        setSelectedUid(null);
        setMobileReaderOpen(false);
      })
      .finally(() => {
        if (active) setLoadedFolder(folder);
      });
    return () => { active = false; };
  }, [folder]);

  useEffect(() => {
    if (selectedUid == null || loadedFolder !== folder) return undefined;
    let active = true;
    getInboxMessage(selectedUid, folder)
      .then((result) => {
        if (active) setSelectedMessage({ uid: selectedUid, folder, message: result.message });
      })
      .catch((requestError) => {
        if (active) setSelectedMessage({ uid: selectedUid, folder, error: getErrorMessage(requestError) });
      });
    return () => { active = false; };
  }, [folder, loadedFolder, selectedUid]);

  const filteredMessages = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return messages;
    return messages.filter((item) => (
      [item.subject, item.from?.name, item.from?.address]
        .some((value) => value?.toLowerCase().includes(query))
    ));
  }, [messages, search]);

  const loading = loadedFolder !== folder;
  const error = folderError?.folder === folder ? folderError.message : "";
  const selected = selectedMessage?.uid === selectedUid && selectedMessage?.folder === folder
    ? selectedMessage
    : null;
  const message = selected?.message;
  const notConfigured = error.toLowerCase().includes("inbox is not configured");
  const folderTitle = FOLDERS.find((item) => item.id === folder)?.label || "Inbox";
  const replyHref = message?.from?.address
    ? `mailto:${message.from.address}?subject=${encodeURIComponent(/^re:/i.test(message.subject || "") ? message.subject : `Re: ${message.subject || ""}`)}`
    : "";
  const visibleSelection = loadedFolder === folder ? selectedUids : [];
  const allVisibleSelected = filteredMessages.length > 0 && filteredMessages.every((item) => visibleSelection.includes(item.uid));

  const loadOlder = async () => {
    if (!nextBefore || loadingOlder) return;
    setLoadingOlder(true);
    setFolderError(null);
    try {
      const result = await getInboxMessages(nextBefore, folder);
      setMessages((current) => {
        const existing = new Set(current.map((item) => item.uid));
        return [...current, ...(result.messages || []).filter((item) => !existing.has(item.uid))];
      });
      setNextBefore(result.nextBefore || null);
    } catch (requestError) {
      setFolderError({ folder, message: getErrorMessage(requestError) });
    } finally {
      setLoadingOlder(false);
    }
  };

  const actOnMessages = async (uids, action) => {
    if (!uids.length || acting) return;
    setActing(true);
    setFolderError(null);
    setNotice("");
    let succeeded = [];
    try {
      if (uids.length === 1) {
        await updateInboxMessage(uids[0], action, folder);
        succeeded = [...uids];
      } else {
        const result = await updateInboxMessages(uids, action, folder);
        succeeded = result.updated || [];
        if (result.failed?.length) {
          setFolderError({ folder, message: result.failed[0].message });
        }
      }
    } catch (requestError) {
      setFolderError({ folder, message: getErrorMessage(requestError) });
    }
    if (succeeded.length && succeeded.length === uids.length) {
      setNotice(uids.length === 1 ? "Email updated." : `${uids.length} emails updated.`);
    } else if (succeeded.length) {
      setNotice(`${succeeded.length} emails updated; some could not be changed.`);
    }
    const removed = new Set(succeeded);
    setMessages((current) => current.filter((item) => !removed.has(item.uid)));
    setSelectedUids((current) => current.filter((uid) => !removed.has(uid)));
    if (removed.has(selectedUid)) {
      setSelectedUid(null);
      setSelectedMessage(null);
    }
    setActing(false);
  };

  const sendMessage = async (draft) => {
    setSending(true);
    setComposeError("");
    try {
      await sendInboxEmail(draft);
      setComposeOpen(false);
      setNotice("Email sent.");
      if (folder === "sent") await refreshInbox();
    } catch (sendError) {
      setComposeError(getErrorMessage(sendError));
    } finally {
      setSending(false);
    }
  };

  const toggleSelected = (uid) => {
    setSelectedUids((current) => current.includes(uid)
      ? current.filter((item) => item !== uid)
      : [...current, uid]);
  };

  const toggleAllVisible = () => {
    setSelectedUids((current) => allVisibleSelected
      ? current.filter((uid) => !filteredMessages.some((item) => item.uid === uid))
      : [...new Set([...current, ...filteredMessages.map((item) => item.uid)])]);
  };

  const actionButtons = (uid) => (
    <>
      {folder !== "all" && folder !== "trash" && folder !== "spam" && (
        <IconAction title="Archive" disabled={acting} onClick={() => actOnMessages([uid], "archive")}><FiArchive size={16} /></IconAction>
      )}
      {folder === "spam" || folder === "trash" ? (
        <IconAction title="Move to Inbox" disabled={acting} onClick={() => actOnMessages([uid], "restore")}><FiInbox size={16} /></IconAction>
      ) : (
        <IconAction title="Move to Trash" disabled={acting} onClick={() => actOnMessages([uid], "trash")}><FiTrash2 size={16} /></IconAction>
      )}
      {folder === "trash" || folder === "spam" ? (
        <IconAction title="Delete forever" danger disabled={acting} onClick={() => actOnMessages([uid], "deleteForever")}><FiX size={16} /></IconAction>
      ) : folder !== "spam" ? (
        <IconAction title="Report spam" danger disabled={acting} onClick={() => actOnMessages([uid], "spam")}><FiAlertTriangle size={16} /></IconAction>
      ) : null}
    </>
  );

  return (
    <main className="px-3 py-4 text-white/90 sm:px-5 sm:py-5 lg:px-6">
      <div className="mx-auto max-w-[1500px]">
        <section className="grid min-h-[calc(100vh-125px)] overflow-hidden rounded-xl border border-white/20 bg-emerald-950/35 shadow-sm backdrop-blur-xl lg:grid-cols-[200px_minmax(0,1fr)]">
          <aside className="hidden border-r border-white/15 bg-emerald-950/25 p-3 lg:block">
            <button type="button" onClick={() => { setComposeError(""); setComposeOpen(true); }} className="mb-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#D3E3FD] px-4 text-sm font-medium text-[#174EA6] shadow-sm hover:shadow">
              <FiEdit2 size={17} /> Compose
            </button>
            <nav aria-label="Inbox folders" className="space-y-1">
              {FOLDERS.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => setFolder(id)} disabled={acting || loadingOlder} aria-current={folder === id ? "page" : undefined} className={`flex w-full items-center gap-3 rounded-full px-4 py-2 text-left text-sm disabled:opacity-60 ${folder === id ? "bg-white/15 font-semibold text-white" : "text-white/75 hover:bg-white/10 hover:text-white"}`}>
                  <Icon size={17} /> {label}
                  {id === "inbox" && messages.some((item) => item.unread) && <span className="ml-auto text-xs">{messages.filter((item) => item.unread).length}</span>}
                </button>
              ))}
            </nav>
          </aside>

          <div className="flex min-w-0 flex-col">
            <header className="flex flex-wrap items-center gap-2 border-b border-white/15 px-3 py-2.5 sm:px-4">
              <button type="button" onClick={() => { setComposeError(""); setComposeOpen(true); }} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#D3E3FD] px-3 text-sm font-medium text-[#174EA6] hover:bg-[#C4D8F4] lg:hidden">
                <FiEdit2 size={15} /> Compose
              </button>
              <button type="button" onClick={toggleAllVisible} aria-label="Select all emails" title="Select all" className={`grid h-8 w-8 place-items-center rounded-md border ${allVisibleSelected ? "border-[#4F6DFF] bg-[#EEF1FF] text-[#2F4BE0]" : "border-[#DCE2DF] text-[#5B6B67]"} `}>
                <FiCheck size={16} />
              </button>
              {visibleSelection.length ? (
                <>
                  <span className="mr-1 text-xs text-[#5B6B67]">{visibleSelection.length} selected</span>
                  {folder !== "all" && folder !== "trash" && folder !== "spam" && <IconAction title="Archive selected" disabled={acting} onClick={() => actOnMessages(visibleSelection, "archive")}><FiArchive size={16} /></IconAction>}
                  {folder === "trash" || folder === "spam"
                    ? <IconAction title="Move selected to Inbox" disabled={acting} onClick={() => actOnMessages(visibleSelection, "restore")}><FiInbox size={16} /></IconAction>
                    : <IconAction title="Move selected to Trash" disabled={acting} onClick={() => actOnMessages(visibleSelection, "trash")}><FiTrash2 size={16} /></IconAction>}
                  {folder === "trash" || folder === "spam"
                    ? <IconAction title="Delete selected forever" danger disabled={acting} onClick={() => actOnMessages(visibleSelection, "deleteForever")}><FiX size={16} /></IconAction>
                    : folder !== "spam" && <IconAction title="Report selected as spam" danger disabled={acting} onClick={() => actOnMessages(visibleSelection, "spam")}><FiAlertTriangle size={16} /></IconAction>}
                </>
              ) : (
                <span className="mx-1 text-sm font-medium text-white/90">{folderTitle}</span>
              )}
              <div className="ml-auto flex min-w-0 items-center gap-2">
                <label className="relative min-w-0 sm:w-60">
                  <FiSearch className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#87938F]" size={15} />
                  <span className="sr-only">Search emails</span>
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search mail" className="w-full rounded-full bg-[#F1F3F4] py-2 pl-8 pr-3 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-[#AEBBB6]" />
                </label>
                <IconAction title="Refresh" onClick={refreshInbox} disabled={refreshing}><FiRefreshCw className={refreshing ? "animate-spin" : ""} size={15} /></IconAction>
              </div>
            </header>

            <nav aria-label="Inbox folders" className="flex gap-1 overflow-x-auto border-b border-[#E8ECEA] px-3 py-2 lg:hidden">
              {FOLDERS.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" onClick={() => setFolder(id)} disabled={acting || loadingOlder} aria-current={folder === id ? "page" : undefined} className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs disabled:opacity-60 ${folder === id ? "bg-white/15 font-semibold text-white" : "text-white/75 hover:bg-white/10 hover:text-white"}`}>
                  <Icon size={14} /> {label}
                </button>
              ))}
            </nav>

            {error && !notConfigured && (
              <div role="alert" className="flex items-center gap-2 bg-rose-50 px-4 py-2 text-xs text-rose-800">
                <FiAlertCircle className="shrink-0" />
                <span className="min-w-0 flex-1">{error}</span>
                <button type="button" onClick={refreshInbox} className="font-medium underline">Retry</button>
              </div>
            )}
            {notice && <div role="status" className="flex items-center justify-between bg-emerald-50 px-4 py-2 text-xs text-emerald-800">{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss notice"><FiX /></button></div>}

            {notConfigured ? (
              <div className="p-4"><SetupNotice onRetry={refreshInbox} busy={refreshing} /></div>
            ) : (
              <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(300px,390px)_minmax(0,1fr)]">
                <section className={`min-h-0 flex-col lg:flex lg:border-r lg:border-[#E8ECEA] ${mobileReaderOpen ? "hidden" : "flex"}`} aria-label={`${folderTitle} email list`}>
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    {loading ? (
                      <div className="space-y-1 p-3">{[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="h-14 animate-pulse rounded-md bg-[#F5F6F6]" />)}</div>
                    ) : filteredMessages.length ? (
                      <ul className="divide-y divide-white/10">
                        {filteredMessages.map((item) => (
                          <li key={item.uid} className={`group flex items-center gap-2 px-3 py-2 hover:bg-white/[0.10] ${selectedUid === item.uid ? "bg-emerald-300/15" : ""}`}>
                            <input type="checkbox" aria-label={`Select email from ${senderName(item.from)}`} checked={visibleSelection.includes(item.uid)} onChange={() => toggleSelected(item.uid)} className="h-4 w-4 shrink-0 accent-[#1A73E8]" />
                            <button type="button" onClick={() => { setSelectedUid(item.uid); setMobileReaderOpen(true); }} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#E7EBFF] text-[11px] font-semibold text-[#344CCB]">{initials(item.from)}</span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center justify-between gap-2">
                                  <span className={`truncate text-[13px] ${item.unread ? "font-bold text-white" : "font-medium text-white/85"}`}>{senderName(item.from)}</span>
                                  <time className="shrink-0 text-[10px] text-white/60">{formatDate(item.date)}</time>
                                </span>
                                <span className={`mt-0.5 block truncate text-xs ${item.unread ? "font-semibold text-white" : "text-white/70"}`}>{item.subject || "(No subject)"} <span className="font-normal text-white/55">— {item.snippet || item.from?.address || ""}</span></span>
                              </span>
                            </button>
                            <span className="hidden shrink-0 items-center gap-0.5 group-hover:flex group-focus-within:flex">{actionButtons(item.uid)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
                        <FiInbox className="text-[#AAB5B0]" size={25} />
                        <p className="mt-3 text-sm font-medium">{search.trim() ? "No matching emails" : `No emails in ${folderTitle}`}</p>
                        <p className="mt-1 text-xs text-[#87938F]">{search.trim() ? "Try another search." : "Messages will appear here when available."}</p>
                      </div>
                    )}
                    {nextBefore && !search.trim() && <button type="button" onClick={loadOlder} disabled={loadingOlder} className="m-3 w-[calc(100%-1.5rem)] rounded-md border border-[#DCE2DF] px-3 py-2 text-xs text-[#344CCB] hover:bg-[#F7F9F8] disabled:opacity-60">{loadingOlder ? "Loading…" : "Load older emails"}</button>}
                  </div>
                </section>

                <article className={`min-w-0 flex-col ${mobileReaderOpen ? "flex" : "hidden lg:flex"}`} aria-label="Email reader">
                  {mobileReaderOpen && <button type="button" onClick={() => setMobileReaderOpen(false)} className="inline-flex items-center gap-2 border-b border-[#E8ECEA] px-3 py-2.5 text-xs text-[#5B6B67] lg:hidden"><FiArrowLeft /> Back to {folderTitle}</button>}
                  {selected?.error ? (
                    <p role="alert" className="m-5 rounded-md bg-rose-50 p-3 text-sm text-rose-800">{selected.error}</p>
                  ) : message ? (
                    <>
                      <header className="flex flex-wrap items-center gap-1 border-b border-[#E8ECEA] px-3 py-2">
                        <IconAction title="Back to message list" onClick={() => setMobileReaderOpen(false)}><FiChevronLeft size={17} /></IconAction>
                        {actionButtons(message.uid)}
                        <span className="ml-auto flex items-center gap-2">
                          {replyHref && <a href={replyHref} className="inline-flex items-center gap-1.5 rounded-md bg-[#1A73E8] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1765CC]"><FiSend size={13} /> Reply</a>}
                        </span>
                      </header>
                      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
                        <h2 className="break-words text-lg font-normal text-[#202124]">{message.subject || "(No subject)"}</h2>
                        <div className="mt-4 flex items-start gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#E7EBFF] text-xs font-semibold text-[#344CCB]">{initials(message.from)}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline gap-x-2">
                              <span className="text-xs font-semibold">{senderName(message.from)}</span>
                              <span className="break-all text-[11px] text-[#70757A]">&lt;{message.from?.address}&gt;</span>
                            </div>
                            <p className="mt-1 text-[11px] text-[#70757A]">to {message.to?.address || "me"} · {formatDate(message.date, true)}</p>
                          </div>
                        </div>
                        <div className="ml-0 mt-5 whitespace-pre-wrap break-words text-[13px] leading-6 text-[#202124] sm:ml-12">
                          {message.text || "This email has no plain-text body to display."}
                        </div>
                        {message.truncated && <p className="ml-0 mt-4 text-xs text-[#87938F] sm:ml-12">The displayed message was shortened.</p>}
                      </div>
                    </>
                  ) : (
                    <div className="flex min-h-64 flex-1 flex-col items-center justify-center px-5 text-center text-[#70757A]">
                      <FiMail size={24} />
                      <p className="mt-3 text-xs">{loading ? "Loading emails…" : "Select an email to read"}</p>
                    </div>
                  )}
                </article>
              </div>
            )}
          </div>
        </section>
      </div>

      {composeOpen && (
        <ComposeDialog
          onClose={() => setComposeOpen(false)}
          onSend={sendMessage}
          sending={sending}
          error={composeError}
        />
      )}
    </main>
  );
}
