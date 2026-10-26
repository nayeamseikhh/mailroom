import axiosInstance from "./axiosInstance.js";

// Get all settings
export const getSettings = async () => {
  const response = await axiosInstance.get("/settings");
  return response;
};

// Update profile information
export const updateProfile = async (profileData) => {
  const response = await axiosInstance.patch("/settings/profile", profileData);
  return response;
};

// Update notification preferences
export const updateNotifications = async (notificationData) => {
  const response = await axiosInstance.patch(
    "/settings/notifications",
    notificationData,
  );
  return response;
};

// Update sending settings
export const updateSending = async (sendingData) => {
  const response = await axiosInstance.patch("/settings/sending", sendingData);
  return response;
};

export const updateSmtpSettings = (smtpData) =>
  axiosInstance.put("/settings/smtp", smtpData);

export const testSmtpSettings = (smtpData) =>
  axiosInstance.post("/settings/smtp/test", smtpData);

export const deleteSmtpSettings = () =>
  axiosInstance.delete("/settings/smtp");

export const updateImapSettings = (imapData) =>
  axiosInstance.put("/settings/imap", imapData);

export const testImapSettings = (imapData) =>
  axiosInstance.post("/settings/imap/test", imapData);

export const deleteImapSettings = () =>
  axiosInstance.delete("/settings/imap");

// Change account password
export const changePassword = async (passwordData) => {
  const response = await axiosInstance.put("/auth/password", passwordData);
  return response;
};
