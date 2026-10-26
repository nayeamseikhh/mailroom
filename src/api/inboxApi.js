import axiosInstance from "./axiosInstance.js";

export const getInboxMessages = async (beforeUid, folder = "inbox") => {
  const response = await axiosInstance.get("/inbox", {
    params: { folder, ...(beforeUid ? { before: beforeUid } : {}) },
  });
  return response.data;
};

export const getInboxMessage = async (uid, folder = "inbox") => {
  const response = await axiosInstance.get(`/inbox/${uid}`, { params: { folder } });
  return response.data;
};

export const updateInboxMessage = async (uid, action, folder) => {
  const response = await axiosInstance.post(`/inbox/${uid}/action`, { action, folder });
  return response.data;
};

export const updateInboxMessages = async (uids, action, folder) => {
  const response = await axiosInstance.post("/inbox/actions", { uids, action, folder });
  return response.data;
};

export const sendInboxEmail = async (message) => {
  const response = await axiosInstance.post("/inbox/send", message);
  return response.data;
};
