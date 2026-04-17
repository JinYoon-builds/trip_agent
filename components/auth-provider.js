"use client";

import {
  Suspense,
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { trackEvent } from "../lib/analytics";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";
import AuthModal from "./auth-modal";

const AuthContext = createContext(null);

async function readSessionProfile(session) {
  if (!session?.access_token) {
    return { user: null, profile: null };
  }

  const response = await fetch("/api/auth/session", {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    return { user: null, profile: null };
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "Failed to load current session.");
  }

  return {
    user: data?.user ?? null,
    profile: data?.profile ?? null,
    isEmailVerified: Boolean(data?.isEmailVerified),
  };
}

export function AuthProvider({ children }) {
  const [status, setStatus] = useState("loading");
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: "signIn",
    reason: "general",
  });
  const [authError, setAuthError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const client = getSupabaseBrowserClient();

    const syncSession = async (nextSession) => {
      if (!mountedRef.current) {
        return;
      }

      if (!nextSession) {
        setSession(null);
        setUser(null);
        setProfile(null);
        setIsEmailVerified(false);
        setStatus("ready");
        return;
      }

      setSession(nextSession);

      try {
        const nextState = await readSessionProfile(nextSession);

        if (!mountedRef.current) {
          return;
        }

        setUser(nextState.user);
        setProfile(nextState.profile);
        setIsEmailVerified(Boolean(nextState.isEmailVerified));
      } catch (error) {
        if (!mountedRef.current) {
          return;
        }

        console.error(error);
        setUser(null);
        setProfile(null);
        setIsEmailVerified(false);
      } finally {
        if (mountedRef.current) {
          setStatus("ready");
        }
      }
    };

    client.auth.getSession().then(({ data }) => {
      void syncSession(data.session ?? null);
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      void syncSession(nextSession ?? null);
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const openAuthModal = useCallback((mode = "signIn", reason = "general") => {
    setAuthError("");
    if (mode === "signIn") {
      setAuthNotice("");
    }
    setModalState({
      isOpen: true,
      mode,
      reason,
    });
    trackEvent("auth_modal_open", {
      auth_mode: mode,
      auth_reason: reason,
    });
  }, []);

  const closeAuthModal = useCallback(() => {
    if (isSubmittingAuth) {
      return;
    }

    setModalState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, [isSubmittingAuth]);

  const setAuthMode = useCallback((mode) => {
    setAuthError("");
    setAuthNotice("");
    setModalState((prev) => ({
      ...prev,
      mode,
    }));
  }, []);

  const signIn = useCallback(async ({ email, password }) => {
    setIsSubmittingAuth(true);
    setAuthError("");
    setAuthNotice("");

    try {
      const client = getSupabaseBrowserClient();
      const { error } = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      const nextSession = await client.auth.getSession();
      if (!nextSession.data.session?.user?.email_confirmed_at) {
        await client.auth.signOut();
        setAuthNotice("signup-verification");
        setPendingVerificationEmail(email);
        throw new Error("Email verification is required before you can log in.");
      }

      setModalState((prev) => ({
        ...prev,
        isOpen: false,
      }));
      return true;
    } catch (error) {
      console.error(error);
      setAuthError(error?.message || "Authentication failed.");
      return false;
    } finally {
      if (mountedRef.current) {
        setIsSubmittingAuth(false);
      }
    }
  }, []);

  const signUp = useCallback(async ({ email, password }) => {
    setIsSubmittingAuth(true);
    setAuthError("");
    setAuthNotice("");

    try {
      const client = getSupabaseBrowserClient();
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        await client.auth.signOut();
      }

      setPendingVerificationEmail(email);
      setAuthNotice("signup-verification");
      return true;
    } catch (error) {
      console.error(error);
      setAuthError(error?.message || "Authentication failed.");
      return false;
    } finally {
      if (mountedRef.current) {
        setIsSubmittingAuth(false);
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    const client = getSupabaseBrowserClient();
    await client.auth.signOut();
    setAuthError("");
    setAuthNotice("");
    setPendingVerificationEmail("");
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    if (!pendingVerificationEmail) {
      return false;
    }

    setIsSubmittingAuth(true);
    setAuthError("");

    try {
      const client = getSupabaseBrowserClient();
      const { error } = await client.auth.resend({
        type: "signup",
        email: pendingVerificationEmail,
        options: {
          emailRedirectTo:
            typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });

      if (error) {
        throw error;
      }

      setAuthNotice("verification-resent");
      return true;
    } catch (error) {
      console.error(error);
      setAuthError(error?.message || "Authentication failed.");
      return false;
    } finally {
      if (mountedRef.current) {
        setIsSubmittingAuth(false);
      }
    }
  }, [pendingVerificationEmail]);

  const contextValue = useMemo(
    () => ({
      status,
      session,
      user,
      profile,
      isAuthenticated: Boolean(session?.access_token && user),
      isEmailVerified,
      isAdmin: profile?.role === "admin",
      authError,
      authNotice,
      isSubmittingAuth,
      pendingVerificationEmail,
      modalState,
      openAuthModal,
      closeAuthModal,
      setAuthMode,
      signIn,
      signUp,
      signOut,
      resendVerificationEmail,
    }),
    [
      status,
      session,
      user,
      profile,
      isEmailVerified,
      authError,
      authNotice,
      isSubmittingAuth,
      pendingVerificationEmail,
      modalState,
      resendVerificationEmail,
    ],
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      <Suspense fallback={null}>
        <AuthModal />
      </Suspense>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
