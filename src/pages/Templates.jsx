import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowUpRight, FiEye, FiPlus, FiRefreshCw, FiTrash2 } from "react-icons/fi";
import { createTemplate, deleteTemplate, getTemplates } from "../api/templateApi.js";

const EMPTY_TEMPLATE = {
  name: "",
  category: "General",
  subject: "",
  previewText: "",
  body: "",
  color: "#E4E8FF",
  accent: "#4F6DFF",
  blocks: ["text", "button"],
};

function getErrorMessage(error) {
  return error?.response?.data?.message || error?.message || "Templates could not be loaded. Please try again.";
}

function formatUpdatedAt(value) {
  if (!value) return "Updated date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Updated date unavailable";
  const elapsedDays = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
  if (elapsedDays === 0) return "Updated today";
  if (elapsedDays === 1) return "Updated yesterday";
  if (elapsedDays < 30) return `Updated ${elapsedDays} days ago`;
  if (elapsedDays < 365) return `Updated ${Math.floor(elapsedDays / 30)} months ago`;
  return `Updated ${Math.floor(elapsedDays / 365)} years ago`;
}

function TemplatePreview({ template, compact = false }) {
  return (
    <div className={`overflow-hidden rounded-t-lg p-4 ${compact ? "h-64" : "h-48"}`} style={{ backgroundColor: template.color || "#E4E8FF" }}>
      <div className="mail-template-paper mx-auto h-full max-w-[260px] overflow-hidden rounded-md bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between"><span className="h-2 w-12 rounded-full" style={{ backgroundColor: template.accent || "#4F6DFF" }} /><span className="h-1.5 w-7 rounded bg-[#E8ECEA]" /></div>
        <p className="line-clamp-2 text-xs font-semibold text-[#26332F]">{template.subject || template.name}</p>
        {template.previewText && <p className="mt-1 line-clamp-2 text-[10px] text-[#71807B]">{template.previewText}</p>}
        <p className="mt-3 line-clamp-5 whitespace-pre-wrap text-[10px] leading-4 text-[#5B6B67]">{template.body || "Add email copy to this template."}</p>
        <div className="mx-auto mt-3 h-5 w-16 rounded-sm" style={{ backgroundColor: template.accent || "#4F6DFF" }} />
      </div>
    </div>
  );
}

function TemplateForm({ template, onChange, onSubmit, onCancel, saving }) {
  const update = (field) => (event) => onChange((current) => ({ ...current, [field]: event.target.value }));

  return (
    <form onSubmit={onSubmit} className="space-y-4 p-5">
      <label className="block space-y-1.5 text-sm font-medium">
        Template name
        <input value={template.name} onChange={update("name")} required maxLength={120} className="w-full rounded-md border border-[#DCE2DF] px-3 py-2 font-normal outline-none focus:border-[#4F6DFF]" />
      </label>
      <label className="block space-y-1.5 text-sm font-medium">
        Category
        <input value={template.category} onChange={update("category")} maxLength={80} className="w-full rounded-md border border-[#DCE2DF] px-3 py-2 font-normal outline-none focus:border-[#4F6DFF]" />
      </label>
      <label className="block space-y-1.5 text-sm font-medium">
        Subject line
        <input value={template.subject} onChange={update("subject")} maxLength={200} className="w-full rounded-md border border-[#DCE2DF] px-3 py-2 font-normal outline-none focus:border-[#4F6DFF]" />
      </label>
      <label className="block space-y-1.5 text-sm font-medium">
        Preview text
        <input value={template.previewText} onChange={update("previewText")} maxLength={250} className="w-full rounded-md border border-[#DCE2DF] px-3 py-2 font-normal outline-none focus:border-[#4F6DFF]" />
      </label>
      <label className="block space-y-1.5 text-sm font-medium">
        Email content
        <textarea value={template.body} onChange={update("body")} rows={6} maxLength={100000} className="w-full resize-y rounded-md border border-[#DCE2DF] px-3 py-2 font-normal outline-none focus:border-[#4F6DFF]" />
      </label>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} disabled={saving} className="rounded-md border border-[#CBD3CF] px-3 py-2 text-sm font-medium hover:bg-[#F7F9F8] disabled:opacity-50">Cancel</button>
        <button type="submit" disabled={saving} className="rounded-md bg-[#2F4BE0] px-4 py-2 text-sm font-medium text-white hover:bg-[#243CC1] disabled:opacity-50">{saving ? "Saving…" : "Save template"}</button>
      </div>
    </form>
  );
}

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [category, setCategory] = useState("All templates");
  const [preview, setPreview] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_TEMPLATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  const loadTemplates = useCallback(async () => {
    try {
      const response = await getTemplates();
      if (!Array.isArray(response.data?.templates)) throw new Error("The server returned an invalid template list.");
      setTemplates(response.data.templates);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshTemplates = () => {
    setLoading(true);
    setError("");
    loadTemplates();
  };

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const categories = ["All templates", ...new Set(templates.map((item) => item.category).filter(Boolean))];
  const shownTemplates = templates.filter((template) => category === "All templates" || template.category === category);

  async function handleCreate(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await createTemplate(form);
      const created = response.data?.template;
      if (!created?._id) throw new Error("The server did not return the saved template.");
      setTemplates((current) => [created, ...current]);
      setCategory("All templates");
      setForm(EMPTY_TEMPLATE);
      setShowForm(false);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(template) {
    if (!window.confirm(`Delete "${template.name}"? This cannot be undone.`)) return;
    setDeletingId(template._id);
    setError("");
    try {
      await deleteTemplate(template._id);
      setTemplates((current) => current.filter((item) => item._id !== template._id));
      setPreview((current) => current?._id === template._id ? null : current);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setDeletingId("");
    }
  }

  const buildTemplateState = (template) => ({
    template: {
      name: template.name,
      subject: template.subject || "",
      previewText: template.previewText || "",
      body: template.body || "",
    },
  });

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-5 py-8 sm:px-8">
      <section className="flex flex-col gap-4 rounded-xl bg-[#10231F] p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="max-w-xl"><p className="text-sm font-medium text-[#AABBB5]">Make it yours</p><h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Start with a template you created.</h2><p className="mt-2 text-sm leading-relaxed text-[#C4D2CE]">Save reusable email content and start new campaigns with it.</p></div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" onClick={() => { setForm(EMPTY_TEMPLATE); setShowForm(true); }} className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-[#16201E] hover:bg-[#EAF0ED]"><FiPlus />Create template</button>
          <Link to="/campaigns/new" className="inline-flex items-center justify-center gap-2 rounded-md border border-white/30 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10">Start from scratch</Link>
        </div>
      </section>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <span>{error}</span><button type="button" onClick={refreshTemplates} className="inline-flex items-center gap-2 font-medium hover:underline"><FiRefreshCw />Refresh</button>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Template category">
        {categories.map((item) => <button key={item} type="button" role="tab" aria-selected={category === item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm ${category === item ? "border-[#2F4BE0] bg-[#EEF1FF] font-medium text-[#2F4BE0]" : "border-[#DCE2DF] bg-white text-[#5B6B67] hover:border-[#AEBBB6]"}`}>{item}</button>)}
      </div>

      {loading ? (
        <div role="status" className="rounded-xl border border-[#DCE2DF] bg-white py-16 text-center text-sm text-[#71807B]">Loading templates…</div>
      ) : shownTemplates.length ? (
        <section aria-label="Email templates" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {shownTemplates.map((template) => (
            <article key={template._id} className="overflow-hidden rounded-xl border border-[#DCE2DF] bg-white transition-shadow hover:shadow-md">
              <TemplatePreview template={template} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><span className="rounded-full bg-[#F0F2F1] px-2.5 py-1 text-xs text-[#5B6B67]">{template.category || "General"}</span><h2 className="mt-3 font-semibold">{template.name}</h2><p className="mt-1 text-xs text-[#87938F]">{formatUpdatedAt(template.updatedAt)}</p></div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setPreview(template)} className="rounded-md border border-[#DCE2DF] p-2 text-[#5B6B67] hover:bg-[#F7F9F8]" aria-label={`Preview ${template.name}`}><FiEye /></button>
                    <button type="button" onClick={() => handleDelete(template)} disabled={deletingId === template._id} className="rounded-md border border-[#DCE2DF] p-2 text-[#8B3B3B] hover:bg-rose-50 disabled:opacity-50" aria-label={`Delete ${template.name}`}><FiTrash2 /></button>
                  </div>
                </div>
                <Link to="/campaigns/new" state={buildTemplateState(template)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-[#CBD3CF] px-3 py-2 text-sm font-medium hover:border-[#4F6DFF] hover:text-[#2F4BE0]">Use this template <FiArrowUpRight /></Link>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="rounded-xl border border-dashed border-[#CBD3CF] bg-white px-5 py-14 text-center">
          <h2 className="font-semibold text-[#26332F]">{templates.length ? "No templates in this category" : "No templates yet"}</h2>
          <p className="mt-2 text-sm text-[#71807B]">{templates.length ? "Choose another category to see your templates." : "Create a reusable email template to see it here."}</p>
          {!templates.length && <button type="button" onClick={() => setShowForm(true)} className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#2F4BE0] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#243CC1]"><FiPlus />Create template</button>}
        </section>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#10231F]/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setShowForm(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="template-form-title" className="my-8 w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E8ECEA] p-5"><h2 id="template-form-title" className="text-lg font-semibold">Create email template</h2><button type="button" onClick={() => setShowForm(false)} disabled={saving} className="rounded-md px-3 py-1.5 text-sm text-[#5B6B67] hover:bg-[#F0F2F1] disabled:opacity-50">Close</button></div>
            <TemplateForm template={form} onChange={setForm} onSubmit={handleCreate} onCancel={() => setShowForm(false)} saving={saving} />
          </section>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10231F]/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreview(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="template-preview-title" className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between p-5"><div><p className="text-xs font-medium uppercase tracking-wide text-[#71807B]">{preview.category || "General"} template</p><h2 id="template-preview-title" className="mt-1 text-lg font-semibold">{preview.name}</h2></div><button type="button" onClick={() => setPreview(null)} className="rounded-md px-3 py-1.5 text-sm text-[#5B6B67] hover:bg-[#F0F2F1]">Close</button></div>
            <TemplatePreview template={preview} compact />
            <div className="p-5"><Link to="/campaigns/new" state={buildTemplateState(preview)} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#2F4BE0] px-4 py-2.5 text-sm font-medium text-white">Use this template <FiArrowUpRight /></Link></div>
          </section>
        </div>
      )}
    </main>
  );
}
