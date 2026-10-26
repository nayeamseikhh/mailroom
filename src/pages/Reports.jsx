import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiDownload, FiInfo, FiRefreshCw } from "react-icons/fi";
import { getReports } from "../api/reportApi.js";

const PERIODS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
];
const NUMBER_FORMAT = new Intl.NumberFormat();

function formatDate(value, options = { day: "numeric", month: "short", year: "numeric" }) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString(undefined, options);
}

function getErrorMessage(error) {
  return error?.response?.data?.message || "Reports could not be loaded. Please try again.";
}

function exportReport(campaigns) {
  const rows = [
    ["Campaign", "Last activity", "Accepted by provider", "Failed", "Acceptance rate"],
    ...campaigns.map((campaign) => [
      campaign.name,
      formatDate(campaign.lastActivityAt),
      campaign.accepted,
      campaign.failed,
      `${campaign.acceptanceRate}%`,
    ]),
  ];
  const csv = rows
    .map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "mailroom-campaign-report.csv";
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function Reports() {
  const [days, setDays] = useState(30);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = useCallback(async () => {
    try {
      const response = await getReports({ days });
      setReport(response.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [days]);

  const retryReport = () => {
    setLoading(true);
    setError("");
    loadReport();
  };

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const summary = report?.summary || {
    accepted: 0,
    failed: 0,
    attempted: 0,
    campaigns: 0,
    acceptanceRate: 0,
  };
  const daily = report?.daily || [];
  const campaigns = report?.campaigns || [];
  const maxAccepted = Math.max(...daily.map((item) => item.accepted), 0);
  const metrics = [
    { label: "Accepted by provider", value: NUMBER_FORMAT.format(summary.accepted), detail: "Messages accepted for sending" },
    { label: "Failed", value: NUMBER_FORMAT.format(summary.failed), detail: "Messages not accepted" },
    { label: "Acceptance rate", value: `${summary.acceptanceRate}%`, detail: "Accepted out of attempted messages" },
    { label: "Campaigns with activity", value: NUMBER_FORMAT.format(summary.campaigns), detail: "Campaigns in this period" },
  ];

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-5 py-8 sm:px-8">
      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <span>{error}</span>
          <button type="button" onClick={retryReport} className="inline-flex items-center gap-2 font-medium hover:underline"><FiRefreshCw />Retry</button>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Campaign report summary">
        {metrics.map((metric) => (
          <article key={metric.label} className="rounded-xl border border-[#DCE2DF] bg-white p-5">
            <p className="text-sm text-[#5B6B67]">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold">{loading ? "—" : metric.value}</p>
            <p className="mt-2 text-xs text-[#87938F]">{metric.detail}</p>
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-[#DCE2DF] bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Accepted messages over time</h2>
            <p className="mt-1 text-sm text-[#5B6B67]">Messages accepted by your email provider each day.</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="report-period">Report period</label>
            <select
              id="report-period"
              value={days}
              onChange={(event) => {
                setLoading(true);
                setError("");
                setDays(Number(event.target.value));
              }}
              className="rounded-md border border-[#DCE2DF] bg-white px-3 py-2 text-sm outline-none focus:border-[#4F6DFF]"
            >
              {PERIODS.map((option) => <option key={option.days} value={option.days}>{option.label}</option>)}
            </select>
            <button
              type="button"
              onClick={() => exportReport(campaigns)}
              disabled={loading || campaigns.length === 0}
              className="inline-flex items-center gap-2 rounded-md border border-[#CBD3CF] px-3 py-2 text-sm font-medium hover:bg-[#F7F9F8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiDownload />Export
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 flex h-56 items-center justify-center text-sm text-[#87938F]" role="status">Loading report…</div>
        ) : daily.length === 0 || maxAccepted === 0 ? (
          <div className="mt-8 flex h-56 items-center justify-center rounded-lg bg-[#F7F9F8] text-sm text-[#71807B]">
            No accepted messages in this period.
          </div>
        ) : (
          <>
            <div className="mt-8 flex h-56 items-end gap-1 border-b border-l border-[#E8ECEA] px-2 sm:gap-2 sm:px-4" aria-label="Daily accepted messages">
              {daily.map((item) => {
                const height = item.accepted ? Math.max((item.accepted / maxAccepted) * 100, 2) : 0;
                return (
                  <div key={item.date} className="group relative flex h-full flex-1 items-end">
                    <span className="absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[#10231F] px-2 py-1 text-[10px] text-white group-hover:block">
                      {formatDate(item.date, { day: "numeric", month: "short" })}: {NUMBER_FORMAT.format(item.accepted)}
                    </span>
                    <div className="w-full rounded-t-sm bg-[#AEBBFF] transition-colors group-hover:bg-[#4F6DFF]" style={{ height: `${height}%` }} />
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex justify-between pl-2 text-xs text-[#87938F] sm:pl-4">
              <span>{formatDate(daily[0]?.date, { day: "numeric", month: "short" })}</span>
              <span>{formatDate(daily.at(-1)?.date, { day: "numeric", month: "short" })}</span>
            </div>
          </>
        )}
        <div className="mt-5 flex flex-wrap items-center gap-5 text-xs text-[#5B6B67]">
          <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-[#4F6DFF]" />Messages accepted by provider</span>
          <span className="inline-flex items-center gap-1 text-[#87938F]"><FiInfo />Provider acceptance does not confirm inbox delivery.</span>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-[#DCE2DF] bg-white">
        <div className="flex items-center justify-between gap-3 p-5">
          <div><h2 className="text-lg font-semibold">Campaign performance</h2><p className="mt-1 text-sm text-[#5B6B67]">Accepted and failed messages during the selected period.</p></div>
          <Link to="/campaigns" className="text-sm font-medium text-[#2F4BE0] hover:underline">All campaigns</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-y border-[#E8ECEA] bg-[#F7F9F8] text-xs uppercase tracking-wide text-[#71807B]">
              <tr><th className="px-5 py-3 font-medium">Campaign</th><th className="px-5 py-3 font-medium">Last activity</th><th className="px-5 py-3 text-right font-medium">Accepted</th><th className="px-5 py-3 text-right font-medium">Failed</th><th className="px-5 py-3 text-right font-medium">Acceptance rate</th></tr>
            </thead>
            <tbody className="divide-y divide-[#E8ECEA]">
              {campaigns.map((campaign) => (
                <tr key={campaign._id} className="hover:bg-[#FBFCFB]">
                  <td className="px-5 py-4 font-medium">{campaign.name}</td>
                  <td className="px-5 py-4 text-[#5B6B67]">{formatDate(campaign.lastActivityAt)}</td>
                  <td className="px-5 py-4 text-right text-[#5B6B67]">{NUMBER_FORMAT.format(campaign.accepted)}</td>
                  <td className="px-5 py-4 text-right text-[#5B6B67]">{NUMBER_FORMAT.format(campaign.failed)}</td>
                  <td className="px-5 py-4 text-right text-[#5B6B67]">{campaign.acceptanceRate}%</td>
                </tr>
              ))}
              {!loading && campaigns.length === 0 && (
                <tr><td colSpan="5" className="px-5 py-10 text-center text-sm text-[#87938F]">No campaign activity in this period.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
