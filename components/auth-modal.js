"use client";

import { useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { getAuthCopy } from "../lib/auth-copy";
import { normalizeSiteLanguage } from "../lib/language";
import { useAuth } from "./auth-provider";

function inferLanguage(pathname, searchParams) {
  return normalizeSiteLanguage(
    searchParams.get("lang") || (pathname === "/" ? "zh" : "ko"),
  );
}

export default function AuthModal() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const {
    authError,
    authNotice,
    closeAuthModal,
    isSubmittingAuth,
    modalState,
    pendingVerificationEmail,
    resendVerificationEmail,
    setAuthMode,
    signIn,
    signUp,
  } = useAuth();

  const language = inferLanguage(pathname, searchParams);
  const copy = useMemo(() => getAuthCopy(language), [language]);

  if (!modalState.isOpen) {
    return null;
  }

  const isSignIn = modalState.mode === "signIn";
  const showVerificationState =
    authNotice === "signup-verification" || authNotice === "verification-resent";

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      return;
    }

    const success = isSignIn
      ? await signIn({ email: email.trim(), password })
      : await signUp({ email: email.trim(), password });

    if (success) {
      setPassword("");
    }
  };

  return (
    <div className="auth-modal-overlay" role="presentation">
      <div aria-modal="true" className="auth-modal" role="dialog">
        <button
          aria-label={copy.close}
          className="auth-modal-close"
          onClick={closeAuthModal}
          type="button"
        >
          ×
        </button>

        {modalState.reason === "survey-submit" ? (
          <div className="auth-gate-banner">
            <strong>{copy.surveyGateTitle}</strong>
            <p>{copy.surveyGateText}</p>
          </div>
        ) : null}

        <div aria-label="auth mode" className="auth-modal-tabs" role="tablist">
          <button
            className={isSignIn ? "auth-tab active" : "auth-tab"}
            onClick={() => setAuthMode("signIn")}
            type="button"
          >
            {copy.login}
          </button>
          <button
            className={!isSignIn ? "auth-tab active" : "auth-tab"}
            onClick={() => setAuthMode("signUp")}
            type="button"
          >
            {copy.signup}
          </button>
        </div>

        <div className="auth-modal-copy">
          <h2>{isSignIn ? copy.modalTitleSignIn : copy.modalTitleSignUp}</h2>
          <p>
            {modalState.reason === "survey-submit"
              ? copy.modalSubtitleSubmit
              : copy.modalSubtitleDefault}
          </p>
        </div>

        {showVerificationState ? (
          <div className="auth-verification-state">
            <strong>{copy.verificationPendingTitle}</strong>
            <p>{copy.verificationPendingText}</p>
            {pendingVerificationEmail ? (
              <p className="auth-notice">{pendingVerificationEmail}</p>
            ) : null}
            <button
              className="auth-submit-button"
              disabled={isSubmittingAuth}
              onClick={() => void resendVerificationEmail()}
              type="button"
            >
              {isSubmittingAuth ? copy.loading : copy.resendVerification}
            </button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span>{copy.emailLabel}</span>
              <input
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                value={email}
              />
            </label>

            <label className="auth-field">
              <span>{copy.passwordLabel}</span>
              <input
                autoComplete={isSignIn ? "current-password" : "new-password"}
                minLength={6}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                value={password}
              />
            </label>

            <button className="auth-submit-button" disabled={isSubmittingAuth} type="submit">
              {isSubmittingAuth
                ? copy.loading
                : isSignIn
                  ? copy.submitSignIn
                  : copy.submitSignUp}
            </button>
          </form>
        )}

        {authNotice === "signup-verification" ? (
          <p className="auth-notice">{copy.verificationSent}</p>
        ) : null}
        {authNotice === "verification-resent" ? (
          <p className="auth-notice">{copy.verificationResent}</p>
        ) : null}
        {authError ? (
          <p className="auth-error">{authError || copy.authErrorDefault}</p>
        ) : null}

        {!showVerificationState ? (
          <button
            className="auth-switch-link"
            onClick={() => setAuthMode(isSignIn ? "signUp" : "signIn")}
            type="button"
          >
            {isSignIn ? copy.switchToSignUp : copy.switchToSignIn}
          </button>
        ) : (
          <button
            className="auth-switch-link"
            onClick={() => setAuthMode("signIn")}
            type="button"
          >
            {copy.switchToSignIn}
          </button>
        )}
      </div>
    </div>
  );
}
