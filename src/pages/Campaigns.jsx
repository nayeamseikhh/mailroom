import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiPlus, FiSearch } from "react-icons/fi";
import { cancelCampaign, createCampaign, getCampaignReport, getCampaigns, sendCampaign } from "../api/campaignApi.js";
import { getCampaignDrafts, removeCampaignDrafts } from "../utils/campaignDrafts.js";

const FILTERS = ["All campaigns", "Draft", "Queued", "Sending", "Accepted", "Partial", "Failed", "Canceled"];
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
  draft: "bg-[#F0F2F1] text-[#64716D]",
  queued: "bg-[#FFF4E8] text-[#8A4B0F]",
  sending: "bg-[#EEF1FF] text-[#354CCB]",
  sent: "bg-[#EAF7EF] text-[#21734D]",
  partial: "bg-[#FFF4E8] text-[#8A4B0F]",
  failed: "bg-[#FCECEC] text-[#A33D3D]",
  canceled: "bg-[#F0F2F1] text-[#64716D]",
};

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getErrorMessage(error) {
  return error?.response?.data?.message || error?.message || "Could not load campaigns.";
}

export default function Campaigns() {
  const location = useLocation();
  const [campaigns, setCampaigns] = useState([]);
  const [filter, setFilter] = useState("All campaigns");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState(location.state?.notice || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState("");
  const [legacyDrafts, setLegacyDrafts] = useState(getCampaignDrafts);
  const [importingDrafts, setImportingDrafts] = useState(false);
  const [reportId, setReportId] = useState("");
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const { data } = await getCampaigns();
        if (active) {
          setCampaigns(Array.isArray(data?.campaigns) ? data.campaigns : []);
          setError("");
        }
      } catch (loadError) {
        if (active) setError(getErrorMessage(loadError));
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    const interval = window.setInterval(load, 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const filteredCampaigns = useMemo(() => campaigns.filter((campaign) => {
    const matchesFilter = filter === "All campaigns" || STATUS_LABELS[campaign.status] === filter;
    const matchesSearch = `${campaign.name} ${campaign.subject}`.toLowerCase().includes(search.trim().toLowerCase());
    return matchesFilter && matchesSearch;
  }), [campaigns, filter, search]);

  const sentCampaigns = campaigns.filter((campaign) => ["sent", "partial"].includes(campaign.status));
  const deliveredCount = campaigns.reduce((total, campaign) => total + (campaign.sentCount || 0), 0);
  const failedCount = campaigns.reduce((total, campaign) => total + (campaign.failedCount || 0), 0);

  const retryCampaign = async (campaign) => {
    if (!window.confirm("Retry delivery for the recipients that were not sent successfully?")) return;
    setRetryingId(campaign._id);
    setError("");
    try {
      const { data } = await sendCampaign(campaign._id);
      setCampaigns((current) => current.map((item) => item._id === campaign._id ? data.campaign : item));
      setNotice(data.message);
    } catch (retryError) {
      setError(getErrorMessage(retryError));
    } finally {
      setRetryingId("");
    }
  };

  const toggleReport = async (campaign) => {
    if (reportId === campaign._id) {
      setReportId("");
      setReport(null);
      return;
    }
    setReportId(campaign._id);
    setReportLoading(true);
    setError("");
    try {
      const { data } = await getCampaignReport(campaign._id);
      setReport(data);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setReportLoading(false);
    }
  };

  const cancelQueuedCampaign = async (campaign) => {
    if (!window.confirm("Cancel this campaign and stop any messages not yet started?")) return;
    try {
      const { data } = await cancelCampaign(campaign._id);
      setCampaigns((current) => current.map((item) => item._id === campaign._id ? data.campaign : item));
    } catch (cancelError) {
      setError(getErrorMessage(cancelError));
    }
  };

  const importLegacyDrafts = async () => {
    setImportingDrafts(true);
    setError("");
    const imported = [];
    const importedIds = [];
    let failed = 0;
    let firstFailure = "";

    for (const draft of legacyDrafts) {
      const splitEmails = (value) => (Array.isArray(value) ? value : String(value || "").split(/[;,\n]+/))
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);
      try {
        const { data } = await createCampaign({
          name: draft.name || draft.subject || "Untitled campaign",
          senderName: draft.senderName || "",
          senderEmail: draft.senderEmail || "",
          recipients: [...new Set([...splitEmails(draft.recipients), ...splitEmails(draft.to)])],
          cc: splitEmails(draft.cc),
          bcc: splitEmails(draft.bcc),
          replyTo: draft.replyTo || "",
          subject: draft.subject || "",
          previewText: draft.previewText || "",
          body: draft.body || "",
          audienceListId: draft.audienceListId || null,
        });
        imported.push(data.campaign);
        importedIds.push(draft.id);
      } catch (importError) {
        failed += 1;
        firstFailure ||= getErrorMessage(importError);
      }
    }

    try {
      const remaining = removeCampaignDrafts(importedIds);
      setLegacyDrafts(remaining);
      setCampaigns((current) => [...imported, ...current]);
      if (failed) {
        setError(`${failed} draft(s) could not be imported and remain saved on this device. ${firstFailure}`);
      }
      if (imported.length) {
        setNotice(`${imported.length} previous draft(s) imported into your workspace.`);
      }
    } catch (storageError) {
      setError(`Imported campaigns could not be removed from this device's saved drafts: ${getErrorMessage(storageError)}`);
    } finally {
      setImportingDrafts(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-5 py-8 sm:px-8">
      {notice && <div role="status" className="rounded-lg border border-[#B9E3CF] bg-[#EDF9F2] px-4 py-3 text-sm text-[#176B48]">{notice}</div>}
      {error && <div role="alert" className="rounded-lg border border-[#F0C9A8] bg-[#FFF4E8] px-4 py-3 text-sm text-[#8A4B0F]">{error}</div>}
      {legacyDrafts.length > 0 && (
        <div className="flex flex-col gap-3 rounded-lg border border-[#DCE2DF] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#44524D]">{legacyDrafts.length} earlier draft(s) are saved on this device and can be imported into your workspace.</p>
          <button type="button" onClick={importLegacyDrafts} disabled={importingDrafts} className="shrink-0 rounded-md border border-[#DCE2DF] px-3 py-2 text-sm font-medium text-[#2F4BE0] hover:bg-[#F7F9F8] disabled:opacity-50">{importingDrafts ? "Importing..." : "Import device drafts"}</button>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["Campaigns accepted", sentCampaigns.length, "At least one message accepted by the provider"],
          ["Messages accepted", deliveredCount, "Accepted by the configured mail server"],
          ["Delivery failures", failedCount, "Messages that need attention"],
        ].map(([label, value, note]) => (
          <article key={label} className="rounded-xl border border-[#DCE2DF] bg-white p-5">
            <p className="text-sm text-[#5B6B67]">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value.toLocaleString()}</p>
            <p className="mt-1 text-xs text-[#71807B]">{note}</p>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-[#DCE2DF] bg-white">
        <div className="flex flex-col gap-4 border-b border-[#E8ECEA] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-lg font-semibold">Campaigns</h2><p className="mt-1 text-sm text-[#5B6B67]">Manage drafts and monitor delivery from your workspace.</p></div>
          <Link to="/campaigns/new" className="inline-flex items-center justify-center gap-2 rounded-md bg-[#2F4BE0] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#2640C2]"><FiPlus />Create campaign</Link>
        </div>

        <div className="flex flex-col gap-3 px-5 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Campaign status">
            {FILTERS.map((item) => <button key={item} type="button" role="tab" aria-selected={filter === item} onClick={() => setFilter(item)} className={`whitespace-nowrap rounded-md px-3 py-2 text-sm ${filter === item ? "bg-[#EEF1FF] font-medium text-[#2F4BE0]" : "text-[#5B6B67] hover:bg-[#F7F9F8]"}`}>{item}</button>)}
          </div>
          <label className="relative block w-full sm:max-w-xs"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#87938F]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search campaigns" className="w-full rounded-md border border-[#DCE2DF] py-2 pl-9 pr-3 text-sm outline-none focus:border-[#4F6DFF]" /></label>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-205 text-left text-sm">
            <thead className="border-y border-[#E8ECEA] bg-[#F7F9F8] text-xs uppercase tracking-wide text-[#71807B]"><tr><th className="px-5 py-3 font-medium">Campaign</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Recipients</th><th className="px-5 py-3 font-medium">Accepted</th><th className="px-5 py-3 font-medium">Failed</th><th className="px-5 py-3 font-medium">Updated</th><th className="px-3 py-3" /></tr></thead>
            <tbody className="divide-y divide-[#E8ECEA]">
              {filteredCampaigns.map((campaign) => (
                <tr key={campaign._id} className="hover:bg-[#FBFCFB]">
                  <td className="px-5 py-4"><span className="block font-medium">{campaign.name || "Untitled campaign"}</span><span className="mt-1 block text-xs text-[#71807B]">{campaign.subject || "No subject line"}</span>{campaign.lastError && <span className="mt-1 block max-w-72 text-xs text-[#A33D3D]">{campaign.lastError}</span>}</td>
                  <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[campaign.status] || STATUS_STYLES.draft}`}>{STATUS_LABELS[campaign.status] || campaign.status}</span></td>
                  <td className="px-5 py-4 text-[#5B6B67]"><span>{(campaign.recipientCount || campaign.manualRecipientCount || 0).toLocaleString()}</span>{campaign.queuedCount > 0 && <span className="block text-xs text-[#71807B]">{campaign.queuedCount} queued</span>}</td>
                  <td className="px-5 py-4 tabular-nums">{(campaign.sentCount || 0).toLocaleString()}</td>
                  <td className="px-5 py-4 tabular-nums">{(campaign.failedCount || 0).toLocaleString()}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-[#5B6B67]">{formatDate(campaign.sentAt || campaign.updatedAt)}</td>
                  <td className="px-3 py-4">
                    {campaign.status === "draft" ? (
                      <Link to={`/campaigns/new?draft=${encodeURIComponent(campaign._id)}`} aria-label={`Edit ${campaign.name || "campaign"}`} className="rounded p-2 text-sm font-medium text-[#2F4BE0] hover:bg-[#EEF1FF]">Edit</Link>
                    ) : (
                      <>
                        <button type="button" onClick={() => toggleReport(campaign)} className="rounded p-2 text-sm font-medium text-[#2F4BE0] hover:bg-[#EEF1FF]">{reportId === campaign._id ? "Hide report" : "Report"}</button>
                        {["failed", "partial"].includes(campaign.status) && <button type="button" disabled={retryingId === campaign._id} onClick={() => retryCampaign(campaign)} className="rounded p-2 text-sm font-medium text-[#2F4BE0] hover:bg-[#EEF1FF] disabled:opacity-50">{retryingId === campaign._id ? "Queueing..." : "Retry"}</button>}
                      </>
                    )}
                    {["queued", "sending"].includes(campaign.status) && <button type="button" onClick={() => cancelQueuedCampaign(campaign)} className="ml-1 rounded p-2 text-xs text-[#A33D3D] hover:bg-rose-50">Cancel</button>}
                  </td>
                </tr>
              ))}
              {reportId && (
                <tr>
                  <td colSpan="7" className="bg-[#FBFCFB] px-5 py-4">
                    {reportLoading ? <p role="status" className="text-sm text-[#71807B]">Loading recipient report…</p> : report?.campaign?._id === reportId ? (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-4 text-xs text-[#5B6B67]">
                          {Object.entries(report.counts || {}).map(([status, count]) => <span key={status} className="capitalize">{status}: {count}</span>)}
                          <span>Started: {formatDateTime(report.campaign.startedAt)}</span>
                          <span>Completed: {formatDateTime(report.campaign.completedAt)}</span>
                        </div>
                        {report.recipients?.length > 0 ? <div className="max-h-56 overflow-auto rounded border bg-white"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-gray-50"><tr><th className="p-2">Recipient</th><th className="p-2">Status</th><th className="p-2">Retries</th><th className="p-2">Provider/error</th></tr></thead><tbody>{report.recipients.map((item) => <tr key={item.recipient} className="border-t"><td className="p-2">{item.recipient}</td><td className="p-2 capitalize">{item.status}</td><td className="p-2">{item.retryCount}</td><td className="p-2">{item.error || item.providerMessageId || "—"}</td></tr>)}</tbody></table></div> : <p className="text-sm text-[#71807B]">No recipient results yet.</p>}
                      </div>
                    ) : null}
                  </td>
                </tr>
              )}
              {!loading && filteredCampaigns.length === 0 && <tr><td colSpan="7" className="px-5 py-12 text-center text-sm text-[#71807B]">{campaigns.length ? "No campaigns match your search or status." : "No campaigns yet. Create your first campaign to get started."}</td></tr>}
              {loading && <tr><td colSpan="7" className="px-5 py-12 text-center text-sm text-[#71807B]">Loading campaigns...</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[#E8ECEA] px-5 py-3 text-xs text-[#71807B]">Showing {filteredCampaigns.length} of {campaigns.length} workspace campaigns</div>
      </section>
    </main>
  );
}
