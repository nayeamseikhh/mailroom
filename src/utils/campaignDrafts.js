const STORAGE_KEY = "mailroom-campaign-drafts";

export function getCampaignDrafts() {
  try {
    const storedDrafts = window.localStorage.getItem(STORAGE_KEY);
    if (!storedDrafts) return [];

    const drafts = JSON.parse(storedDrafts);
    if (!Array.isArray(drafts)) {
      throw new Error("Saved campaign drafts must be a list.");
    }
    return drafts;
  } catch (error) {
    console.error("Could not read saved campaign drafts.", error);
    return [];
  }
}

export function saveCampaignDraft(draft) {
  const drafts = getCampaignDrafts();
  const savedDraft = {
    ...draft,
    id: draft.id || `draft-${Date.now()}`,
    updatedAt: new Date().toISOString(),
    status: "Draft",
  };
  const nextDrafts = [
    savedDraft,
    ...drafts.filter((item) => item.id !== savedDraft.id),
  ];

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextDrafts));
  return savedDraft;
}

export function removeCampaignDrafts(ids) {
  const draftIds = new Set(ids);
  const remaining = getCampaignDrafts().filter((draft) => !draftIds.has(draft.id));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  return remaining;
}
