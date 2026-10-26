// client/src/pages/Dashboard.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiChevronRight,
  FiClock,
  FiX,
  FiMail,
  FiRefreshCw,
  FiSend,
  FiUserMinus,
  FiUsers,
} from "react-icons/fi";
import { getDashboard } from "../api/dashboardApi.js";

const fmt = (n = 0) => Number(n).toLocaleString("en-US");
const STATUS_LABELS = {
  draft: "Draft",
  queued: "Queued",
  sending: "Sending",
  sent: "Accepted",
  partial: "Partial",
  failed: "Failed",
  canceled: "Canceled",
};
const STATUS_STYLES = {
  draft: "border-white/20 bg-white/10 text-white/75",
  queued: "border-sky-200/30 bg-sky-300/15 text-sky-100",
  sending: "border-amber-200/30 bg-amber-300/15 text-amber-100",
  sent: "border-emerald-200/30 bg-emerald-300/15 text-emerald-100",
  partial: "border-amber-200/30 bg-amber-300/15 text-amber-100",
  failed: "border-rose-200/30 bg-rose-300/15 text-rose-100",
  canceled: "border-white/20 bg-white/10 text-white/65",
};
const STATUS_DOT = {
  draft: "bg-white/50",
  queued: "bg-sky-300",
  sending: "bg-amber-300",
  sent: "bg-emerald-300",
  partial: "bg-amber-300",
  failed: "bg-rose-300",
  canceled: "bg-white/40",
};

function formatDate(value, options = { day: "numeric", month: "long" }) {
  if (!value) return "Not sent yet";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString(undefined, options);
}

function getErrorMessage(error) {
  return error?.response?.data?.message || "Dashboard data could not be refreshed. Please try again.";
}

/* ---------- shared visual helpers ---------- */

function GlassCard({ children, className = "", ...props }) {
  return (
    <div
      className={`rounded-[1.6rem] border border-white/35 bg-emerald-950/[0.34] shadow-[0_18px_60px_rgba(2,18,12,0.28)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/60 hover:bg-emerald-950/[0.44] hover:shadow-[0_24px_70px_rgba(2,18,12,0.36)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

function SectionEyebrow({ children }) {
  return (
    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-100/85">
      {children}
    </p>
  );
}

function MiniIcon({ children, className = "" }) {
  return (
    <span
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/40 bg-white/20 text-emerald-50 shadow-[0_6px_20px_rgba(2,18,12,0.18)] backdrop-blur-lg ${className}`}
    >
      {children}
    </span>
  );
}

/* ---------- delivery funnel ---------- */

function Funnel({ campaign }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!campaign) {
    return (
      <GlassCard className="p-7 sm:p-10">
        <SectionEyebrow>Campaign overview</SectionEyebrow>
        <h2 className="text-2xl font-semibold text-white">Your campaign activity will appear here</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-white/75">
          Create a campaign to see recipient and provider-acceptance results from your workspace.
        </p>
        <Link to="/campaigns/new" className="mt-5 inline-flex rounded-xl border border-emerald-100/30 bg-emerald-100/15 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-100/25">
          Create a campaign <FiChevronRight className="ml-1" />
        </Link>
      </GlassCard>
    );
  }

  const recipientCount = campaign.recipientCount || 0;
  const rows = [
    {
      label: "Recipients",
      value: recipientCount,
      rate: "Selected audience",
      color: "from-slate-300 to-slate-400",
      icon: FiUsers,
    },
    {
      label: "Accepted",
      value: campaign.sentCount || 0,
      rate: "Accepted by provider",
      color: "from-emerald-300 to-emerald-500",
      icon: FiSend,
    },
    {
      label: "Failed",
      value: campaign.failedCount || 0,
      rate: "Failed recipients",
      color: "from-teal-400 to-emerald-600",
      icon: FiAlertCircle,
    },
    {
      label: "Skipped",
      value: campaign.skippedCount || 0,
      rate: "Not eligible to send",
      color: "from-amber-300 to-orange-400",
      icon: FiUserMinus,
    },
    {
      label: "Queued",
      value: campaign.queuedCount || 0,
      rate: "Waiting to send",
      color: "from-emerald-700 to-green-900",
      icon: FiClock,
    },
  ];
  const campaignName = campaign.name || campaign.subject || "Untitled campaign";
  const status = STATUS_LABELS[campaign.status] || campaign.status;

  return (
    <GlassCard className="relative overflow-hidden p-6 sm:p-8 lg:p-10">
      <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-lime-200/25 blur-3xl" />

      <div className="relative">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <SectionEyebrow>Campaign overview</SectionEyebrow>
            <p className="flex items-center gap-2 text-sm font-medium text-white/90">
              <FiCalendar className="text-emerald-200" />
              Updated {formatDate(campaign.sentAt || campaign.updatedAt)}
            </p>
            <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-[-0.04em] text-white/95 sm:text-4xl lg:text-[2.7rem]">
              {campaignName}:{" "}
              <span className="bg-gradient-to-r from-emerald-200 to-teal-100 bg-clip-text text-transparent">
                {fmt(campaign.sentCount || 0)}
              </span>{" "}
              accepted
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/90 sm:text-base">
              Message acceptance means the configured email provider accepted the send; it does not confirm inbox delivery.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/45 bg-emerald-950/10 px-4 py-2 text-sm font-semibold text-emerald-50 backdrop-blur-lg">
            <span className={`h-2 w-2 rounded-full ${campaign.status === "sending" || campaign.status === "queued" ? "animate-pulse bg-amber-300" : STATUS_DOT[campaign.status] || "bg-white/50"}`} />
            {status}
          </div>
        </div>

        <div className="mt-9 space-y-5">
          {rows.map((row, i) => {
            const Icon = row.icon;
            const percent = recipientCount ? Math.min((row.value / recipientCount) * 100, 100) : 0;
            return (
              <div
                key={row.label}
                className="grid gap-2 sm:grid-cols-[8.5rem_minmax(0,1fr)_10.5rem] sm:items-center sm:gap-5"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/35 bg-white/[0.18] text-emerald-50 backdrop-blur-lg">
                    <Icon size={15} />
                  </span>
                  <span className="text-sm font-semibold text-white/95">
                    {row.label}
                  </span>
                </div>
                <div className="h-3.5 overflow-hidden rounded-full border border-white/70 bg-white/20 shadow-inner">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${row.color} transition-[width] duration-1000 ease-out motion-reduce:transition-none`}
                    style={{
                      width: mounted ? `${percent}%` : "0%",
                      transitionDelay: `${i * 120}ms`,
                    }}
                  />
                </div>
                <div className="flex items-baseline justify-between gap-3 sm:block sm:text-right">
                  <span className="text-base font-bold tabular-nums text-white/95">
                    {fmt(row.value)}
                  </span>
                  <span className="text-xs text-white/95 sm:mt-0.5 sm:block">
                    {row.rate}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}

/* ---------- KPI strip ---------- */

function KpiStrip({ contacts, campaigns, recentActivity }) {
  const kpis = [
    { label: "Subscribed contacts", value: contacts.subscribed, note: `${fmt(contacts.total)} total contacts`, icon: FiUsers },
    { label: "Accepted · last 30 days", value: recentActivity.accepted, note: "Accepted by email provider", icon: FiSend },
    { label: "Failed · last 30 days", value: recentActivity.failed, note: "Review campaign reports", icon: FiAlertCircle },
    { label: "Active campaigns", value: campaigns.active, note: `${fmt(campaigns.total)} campaigns in workspace`, icon: FiMail },
  ];
  const accents = [
    "from-emerald-600 to-teal-500",
    "from-sky-600 to-cyan-400",
    "from-amber-600 to-orange-400",
    "from-amber-600 to-orange-400",
  ];

  return (
    <section
      aria-label="Key numbers"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {kpis.map((k, i) => {
        const Icon = k.icon;
        return (
          <GlassCard key={k.label} className="group p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white/90">{k.label}</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-white/95">
                  {fmt(k.value)}
                </p>
              </div>
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${accents[i]} text-white shadow-lg transition duration-300 group-hover:rotate-[-6deg] group-hover:scale-110`}
              >
                <Icon size={19} />
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-white/20 pt-3 text-xs text-white/95">
              <FiCheckCircle className="text-emerald-200" />
              {k.note}
            </div>
          </GlassCard>
        );
      })}
    </section>
  );
}

/* ---------- 30-day activity chart ---------- */

function ActivityChart({ dailyActivity }) {
  const [metric, setMetric] = useState("accepted");
  const data = dailyActivity.map((day) => ({ ...day, value: day[metric] || 0 }));
  const max = Math.max(...data.map((day) => day.value), 1);
  const dateAt = (i) => formatDate(`${data[i]?.date}T12:00:00`, { day: "numeric", month: "short" });

  return (
    <GlassCard className="p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <SectionEyebrow>Delivery analytics</SectionEyebrow>
          <h2 className="text-xl font-semibold tracking-tight text-white/95">
            Activity in the last 30 days
          </h2>
          <p className="mt-1 text-sm text-white/95">
            Provider-accepted messages and failed recipient outcomes, based on campaign logs.
          </p>
        </div>
        <div
          role="group"
          aria-label="Choose metric"
          className="inline-flex rounded-xl border border-white/35 bg-white/[0.14] p-1 shadow-sm backdrop-blur-xl"
        >
          {[["accepted", "Accepted"], ["failed", "Failed"]].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMetric(value)}
              aria-pressed={metric === value}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition duration-200 focus-visible:outline-2 focus-visible:outline-emerald-700 ${
                metric === value
                  ? "bg-emerald-900 text-white shadow-md"
                  : "text-white/90 hover:bg-white/90 hover:text-emerald-950"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div
        role="img"
        aria-label={`${metric} messages per day for the last 30 days. Highest day: ${fmt(max)}.`}
        className="mt-8 flex h-48 items-end gap-1.5 sm:gap-2"
      >
        {data.map((day, i) => (
          <div
            key={day.date}
            title={`${dateAt(i)}: ${fmt(day.value)} ${metric}`}
            className={`group relative min-w-0 flex-1 rounded-t-md transition-all duration-300 hover:brightness-110 ${
              day.value === max && day.value > 0
                ? "bg-gradient-to-t from-emerald-900 to-emerald-500 shadow-[0_0_18px_rgba(16,130,85,0.18)]"
                : "bg-gradient-to-t from-teal-600/80 to-emerald-300/90"
            }`}
            style={{ height: `${day.value ? Math.max((day.value / max) * 100, 2) : 0}%` }}
          >
            <span className="absolute inset-x-0 -top-1 mx-auto h-1 rounded-full bg-white/80 opacity-0 transition group-hover:opacity-100" />
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between text-xs font-medium text-white/95">
        <span>{dateAt(0)}</span>
        <span>{dateAt(14)}</span>
        <span>{dateAt(29)}</span>
      </div>
      <div className="mt-5 flex items-center gap-2 text-xs text-white/95">
        <span className="h-2 w-2 rounded-full bg-emerald-700" />
        Daily {metric}
        <span className="ml-auto font-semibold text-white/95">
          Peak: {fmt(max === 1 && !data.some((day) => day.value) ? 0 : max)}
        </span>
      </div>
    </GlassCard>
  );
}

/* ---------- needs attention ---------- */

function Attention({ contacts, campaigns }) {
  const items = [];
  if (contacts.bounced > 0) {
    items.push({
      icon: FiAlertCircle,
      title: `${fmt(contacts.bounced)} bounced contact${contacts.bounced === 1 ? "" : "s"}`,
      body: "Review bounced addresses and update their contact status before future campaigns.",
      action: "Review contacts",
      href: "/contacts",
    });
  }
  if (campaigns.failed > 0) {
    items.push({
      icon: FiSend,
      title: `${fmt(campaigns.failed)} delivery failure${campaigns.failed === 1 ? "" : "s"}`,
      body: "Check recipient results in campaign reports to see which messages need attention.",
      action: "Review campaigns",
      href: "/campaigns",
    });
  }
  if (campaigns.active > 0) {
    items.push({
      icon: FiClock,
      title: `${fmt(campaigns.active)} campaign${campaigns.active === 1 ? "" : "s"} in progress`,
      body: "Queued and sending campaigns are updated automatically.",
      action: "View campaigns",
      href: "/campaigns",
    });
  }

  return (
    <GlassCard className="p-5 sm:p-6">
      <SectionEyebrow>Quick actions</SectionEyebrow>
      <h2 className="text-xl font-semibold tracking-tight text-white/95">
        Needs your attention
      </h2>
      <p className="mt-1 text-sm text-white/95">
        Live contact and campaign items that may need a closer look.
      </p>

      {items.length ? (
        <ul className="mt-5 space-y-3">
          {items.map(({ icon: Icon, title, body, action, href }) => (
            <li
              key={title}
              className="rounded-2xl border border-white/30 bg-white/[0.12] p-4 backdrop-blur-lg transition duration-200 hover:bg-white/[0.22]"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-300/15 text-emerald-100 ring-1 ring-emerald-100/25">
                  <Icon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-5 text-white/90">
                    {title}
                  </p>
                  <p className="mt-1.5 text-xs leading-5 text-white/95">
                    {body}
                  </p>
                  <Link
                    to={href}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-100 transition hover:gap-2 focus-visible:outline-2 focus-visible:outline-emerald-700"
                  >
                    {action}
                    <FiChevronRight size={14} />
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-5 rounded-2xl border border-emerald-100/25 bg-emerald-300/10 p-5">
          <p className="font-semibold text-emerald-50">You’re all caught up</p>
          <p className="mt-1 text-sm text-white/75">No bounced contacts, delivery failures, or active campaigns need attention.</p>
        </div>
      )}
    </GlassCard>
  );
}

/* ---------- recent campaigns ---------- */

function RecentCampaigns({ campaigns }) {
  return (
    <GlassCard className="overflow-hidden">
      <div className="flex flex-col justify-between gap-3 border-b border-white/25 px-5 py-5 sm:flex-row sm:items-center sm:px-7">
        <div>
          <SectionEyebrow>Campaign history</SectionEyebrow>
          <h2 className="text-xl font-semibold tracking-tight text-white/95">
            Recent campaigns
          </h2>
          <p className="mt-1 text-sm text-white/95">
            Recent campaign status and provider send results.
          </p>
        </div>
        <Link
          to="/campaigns"
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-emerald-100/30 bg-emerald-100/15 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-100/25 hover:shadow-md focus-visible:outline-2 focus-visible:outline-emerald-200"
        >
          View all campaigns
          <FiChevronRight size={16} />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-emerald-950/[0.22] text-xs uppercase tracking-wider text-white/95">
            <tr>
              <th scope="col" className="px-6 py-4 font-bold">
                Campaign
              </th>
              <th scope="col" className="px-5 py-4 font-bold">
                Status
              </th>
              <th scope="col" className="px-5 py-4 text-right font-bold">
                Recipients
              </th>
              <th scope="col" className="px-5 py-4 text-right font-bold">
                Accepted
              </th>
              <th scope="col" className="px-5 py-4 text-right font-bold">
                Failed
              </th>
              <th scope="col" className="px-6 py-4 text-right font-bold">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/15">
            {campaigns.map((campaign) => (
              <tr
                key={campaign._id}
                className="transition-colors duration-200 hover:bg-white/[0.16]"
              >
                <td className="px-6 py-4 font-semibold text-white/90">
                  <span className="block">{campaign.name || "Untitled campaign"}</span>
                  <span className="mt-1 block max-w-xs truncate text-xs font-normal text-white/60">{campaign.subject || "No subject line"}</span>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${STATUS_STYLES[campaign.status] || STATUS_STYLES.draft}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[campaign.status] || STATUS_DOT.draft}`}
                    />
                    {STATUS_LABELS[campaign.status] || campaign.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-right font-medium tabular-nums text-white/95">
                  {fmt(campaign.recipientCount)}
                </td>
                <td className="px-5 py-4 text-right font-medium tabular-nums text-white/95">
                  {fmt(campaign.sentCount)}
                </td>
                <td className="px-5 py-4 text-right font-medium tabular-nums text-white/95">
                  {fmt(campaign.failedCount)}
                </td>
                <td className="px-6 py-4 text-right text-white/75">{formatDate(campaign.sentAt || campaign.updatedAt, { day: "numeric", month: "short", year: "numeric" })}</td>
              </tr>
            ))}
            {campaigns.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-white/75">
                  No campaigns yet. Create your first campaign to see its progress here.
                  <Link to="/campaigns/new" className="ml-1 font-semibold text-emerald-100 underline underline-offset-2">Create campaign</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

/* ---------- dashboard page ---------- */

function DashboardToast({ toast, onDismiss }) {
  if (!toast) return null;
  const isError = toast.type === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={`fixed right-4 top-20 z-50 flex w-[min(24rem,calc(100vw-2rem))] items-start gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl ${
        isError
          ? "border-rose-200/30 bg-rose-950/90 text-rose-50"
          : "border-emerald-100/30 bg-emerald-950/90 text-emerald-50"
      }`}
    >
      {isError ? <FiAlertCircle className="mt-0.5 shrink-0" /> : <FiCheckCircle className="mt-0.5 shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{toast.title}</p>
        <p className="mt-1 text-xs leading-5 text-white/75">{toast.message}</p>
      </div>
      <button type="button" onClick={onDismiss} aria-label="Dismiss notification" className="rounded-md p-1 text-white/70 hover:bg-white/10 hover:text-white">
        <FiX size={16} />
      </button>
    </div>
  );
}

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const syncErrorRef = useRef("");

  const dismissToast = useCallback(() => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = null;
    setToast(null);
  }, []);

  const showToast = useCallback((type, title, message) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast({ type, title, message });
    toastTimer.current = window.setTimeout(() => {
      setToast(null);
      toastTimer.current = null;
    }, 6000);
  }, []);

  const refreshDashboard = useCallback(async ({ manual = false } = {}) => {
    if (manual) setRefreshing(true);
    try {
      const { data } = await getDashboard();
      setDashboard(data);
      const recovered = Boolean(syncErrorRef.current);
      syncErrorRef.current = "";
      setSyncError("");
      if (manual) {
        showToast("success", "Dashboard refreshed", "The latest workspace data is now up to date.");
      } else if (recovered) {
        showToast("success", "Connection restored", "Dashboard data is syncing normally again.");
      }
    } catch (error) {
      const message = getErrorMessage(error);
      const alreadyNotified = Boolean(syncErrorRef.current);
      syncErrorRef.current = message;
      setSyncError(message);
      if (manual || !alreadyNotified) {
        showToast("error", "Could not refresh dashboard", message);
      }
    } finally {
      setLoading(false);
      if (manual) setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (active) void refreshDashboard();
    };
    refresh();
    const interval = window.setInterval(refresh, 30_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [refreshDashboard]);

  useEffect(() => () => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
  }, []);

  const dailyActivity = dashboard?.dailyActivity || [];
  const recentActivity = dailyActivity.reduce(
    (summary, day) => ({
      accepted: summary.accepted + (day.accepted || 0),
      failed: summary.failed + (day.failed || 0),
    }),
    { accepted: 0, failed: 0 },
  );
  const contacts = dashboard?.contacts || { total: 0, subscribed: 0, bounced: 0 };
  const campaigns = dashboard?.campaigns || { total: 0, active: 0, failed: 0 };
  const lastSynced = dashboard?.generatedAt
    ? new Date(dashboard.generatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : "";

  return (
    <main className="relative min-h-screen overflow-hidden text-white/95">
      <DashboardToast toast={toast} onDismiss={dismissToast} />
      <div className="mx-auto max-w-[1440px] space-y-5 px-4 pt-[6px] pb-5 sm:space-y-6 sm:px-6 sm:pt-[6px] sm:pb-6 lg:px-10">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/[0.14] px-3.5 py-2 text-xs font-semibold tracking-wide text-white shadow-sm backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.13)]" />
              YOUR WORKSPACE
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl">
              Dashboard<span className="text-emerald-200">.</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/95 sm:text-base">
              Live contact and campaign performance from your workspace.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 rounded-2xl border border-white/30 bg-emerald-950/35 px-4 py-3 shadow-sm backdrop-blur-xl">
              <MiniIcon className="h-10 w-10 rounded-xl">
                <FiCalendar size={17} />
              </MiniIcon>
              <div>
                <p className="text-xs font-medium text-white/95">Reporting period</p>
                <p className="mt-0.5 text-sm font-semibold text-white/90">Last 30 days</p>
                {lastSynced && <p className="mt-0.5 text-xs text-white/60">Synced at {lastSynced} · Auto-sync every 30 seconds</p>}
              </div>
            </div>
            <button
              type="button"
              onClick={() => void refreshDashboard({ manual: true })}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-100/30 bg-emerald-100/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-100/25 disabled:cursor-wait disabled:opacity-60"
            >
              <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </header>

        {!dashboard && loading ? (
          <GlassCard className="p-10 text-center">
            <FiRefreshCw className="mx-auto animate-spin text-2xl text-emerald-200" />
            <p className="mt-4 font-semibold">Loading workspace data…</p>
          </GlassCard>
        ) : !dashboard ? (
          <GlassCard className="p-8 text-center">
            <FiAlertCircle className="mx-auto text-2xl text-rose-200" />
            <h2 className="mt-3 text-xl font-semibold">Dashboard data is unavailable</h2>
            <p className="mt-2 text-sm text-white/75">{syncError || "Please try again in a moment."}</p>
            <button type="button" onClick={() => void refreshDashboard({ manual: true })} className="mt-5 rounded-xl border border-emerald-100/30 bg-emerald-100/15 px-4 py-2.5 text-sm font-semibold hover:bg-emerald-100/25">
              Try again
            </button>
          </GlassCard>
        ) : (
          <>
            {syncError && <p role="status" className="rounded-xl border border-amber-200/25 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">Showing the last synced data. We’ll keep trying to reconnect automatically.</p>}
            <Funnel campaign={dashboard.recentCampaigns?.[0] || null} />
            <KpiStrip contacts={contacts} campaigns={campaigns} recentActivity={recentActivity} />

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)]">
              <ActivityChart dailyActivity={dailyActivity} />
              <Attention contacts={contacts} campaigns={campaigns} />
            </div>

            <RecentCampaigns campaigns={dashboard.recentCampaigns || []} />
          </>
        )}

        <footer className="flex flex-col items-center justify-between gap-2 px-2 pb-3 text-center text-xs text-white/80 sm:flex-row sm:text-left">
          <span>Campaign data reflects provider acceptance, not confirmed inbox delivery.</span>
          <span className="inline-flex items-center gap-1.5">
            Made for better conversations{" "}
            <span className="text-emerald-200">✦</span>
          </span>
        </footer>
      </div>
    </main>
  );
}
