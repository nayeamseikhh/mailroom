
import axiosInstance from "./axiosInstance.js";

/**
 * Register a new user.
 */
export const register = async (user) => {
  const response = await axiosInstance.post("/auth/register", user);
  return response;
};

/**
 * Log in a user.
 */
export const login = async (credentials) => {
  const response = await axiosInstance.post("/auth/login", credentials);
  return response;
};

/**
 * Get the currently authenticated user.
 * This requires a valid session or token accepted by the backend.
 */
export const getCurrentUser = async () => {
  const response = await axiosInstance.get("/auth/me");
  return response;
};

/**
 * Update the current user's profile.
 */
export const updateCurrentUser = async (profile) => {
  const response = await axiosInstance.put("/auth/me", profile);
  return response;
};

/**
 * Upload the current user's avatar.
 */
export const uploadAvatar = async (file) => {
  if (!(file instanceof File)) {
    throw new Error("Please select a valid avatar file.");
  }

  const formData = new FormData();
  formData.append("avatar", file);

  return axiosInstance.put("/auth/avatar", formData);
};

/**
 * Log out the current user.
 */
export const logout = async () => {
  return axiosInstance.post("/auth/logout");
};


// import axiosInstance from "./axiosInstance.js";

// export const login = (credentials) =>
//   axiosInstance.post("/auth/login", credentials);

// export const register = (user) =>
//   axiosInstance.post("/auth/register", user);

// export const logout = () =>
//   axiosInstance.post("/auth/logout");

// export const getCurrentUser = () =>
//   axiosInstance.get("/auth/me");

// export const updateCurrentUser = (profile) =>
//   axiosInstance.put("/auth/me", profile);

// export const uploadAvatar = (file) => {
//   const form = new FormData();
//   form.append("avatar", file);

//   return axiosInstance.put("/auth/avatar", form);
// };