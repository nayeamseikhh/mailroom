
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  login as loginApi,
  register as registerApi,
  logout as logoutApi,
  getCurrentUser,
  updateCurrentUser,
  uploadAvatar as uploadAvatarApi,
} from "../api/authApi.js";

export const AuthContext = createContext(null);

const AUTH_SESSION_KEY = "mailroom-authenticated";
const AUTH_TOKEN_KEY = "mailroom-auth-token";

// Reuse an in-flight session request if the provider mounts again.
let sessionRequest = null;

function restoreCurrentUser() {
  const hasStoredSession =
    window.localStorage.getItem(AUTH_SESSION_KEY) ||
    window.sessionStorage.getItem(AUTH_SESSION_KEY) ||
    window.localStorage.getItem(AUTH_TOKEN_KEY) ||
    window.sessionStorage.getItem(AUTH_TOKEN_KEY);

  if (!hasStoredSession) return Promise.resolve(null);

  if (!sessionRequest) {
    sessionRequest = getCurrentUser()
      .then(({ data }) => data?.user ?? null)
      .finally(() => {
        sessionRequest = null;
      });
  }

  return sessionRequest;
}

function rememberAuthenticatedSession(storage, token) {
  const otherStorage =
    storage === window.localStorage
      ? window.sessionStorage
      : window.localStorage;

  otherStorage.removeItem(AUTH_SESSION_KEY);
  otherStorage.removeItem(AUTH_TOKEN_KEY);
  storage.setItem(AUTH_SESSION_KEY, "1");
  if (token) {
    storage.setItem(AUTH_TOKEN_KEY, token);
  }
}

function clearAuthenticatedSession() {
  window.localStorage.removeItem(AUTH_SESSION_KEY);
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.sessionStorage.removeItem(AUTH_SESSION_KEY);
  window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      try {
        const currentUser = await restoreCurrentUser();

        if (active) {
          setUser(currentUser);
        }
      } catch (error) {
        // A 401 means there is no valid session.
        // Do not automatically retry a 401 or 429 response.
        if (active) {
          setUser(null);

          if (error?.response?.status === 401) {
            clearAuthenticatedSession();
          } else if (error?.response?.status === 429) {
            console.warn(
              "Session check was rate-limited. Please wait before retrying.",
            );
          } else {
            console.error(
              "Unable to restore the authentication session:",
              error,
            );
          }
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  const login = async ({ email, password, remember }) => {
    const { data } = await loginApi({
      email,
      password,
      remember,
    });

    setUser(data?.user ?? null);
    rememberAuthenticatedSession(
      remember ? window.localStorage : window.sessionStorage,
      data?.token,
    );
    return data;
  };

  const register = async ({ name, email, password }) => {
    const { data } = await registerApi({
      name,
      email,
      password,
    });

    setUser(data?.user ?? null);
    rememberAuthenticatedSession(window.localStorage, data?.token);
    return data;
  };

  const logout = async () => {
    try {
      await logoutApi();
    } finally {
      clearAuthenticatedSession();
      setUser(null);
    }
  };

  const updateProfile = async (profile) => {
    const { data } = await updateCurrentUser(profile);

    const updatedUser = data?.user ?? null;
    setUser(updatedUser);

    return updatedUser;
  };

  const updateAvatar = async (file) => {
    const { data } = await uploadAvatarApi(file);

    const updatedUser = data?.user ?? null;
    setUser(updatedUser);

    return updatedUser;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        loading,
        login,
        register,
        logout,
        updateProfile,
        updateAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuthContext must be used within an AuthProvider",
    );
  }

  return context;
};
