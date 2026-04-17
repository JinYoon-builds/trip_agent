"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { getAuthCopy } from "../lib/auth-copy";
import { useAuth } from "./auth-provider";

function getAccountLabel(user, profile) {
  const email = profile?.email || user?.email || "";

  if (!email) {
    return "";
  }

  if (email.length <= 22) {
    return email;
  }

  const [localPart] = email.split("@");

  if (localPart) {
    return localPart;
  }

  return `${email.slice(0, 19)}...`;
}

export default function AuthButtons({ language, compact = false }) {
  const { isAdmin, isAuthenticated, openAuthModal, profile, signOut, user } = useAuth();
  const copy = getAuthCopy(language);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const accountLabel = useMemo(() => getAccountLabel(user, profile), [profile, user]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsMenuOpen(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isMenuOpen]);

  if (isAuthenticated) {
    return (
      <div className={compact ? "auth-action-row compact" : "auth-action-row"}>
        <div className="auth-account-shell" ref={menuRef}>
          <button
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            className={compact ? "auth-account-button compact" : "auth-account-button"}
            onClick={() => setIsMenuOpen((current) => !current)}
            type="button"
          >
            <span aria-hidden="true" className="auth-account-icon">
              <svg viewBox="0 0 20 20" focusable="false">
                <path d="M10 10.2a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Zm0 1.8c-3.8 0-6.8 1.9-6.8 4.3 0 .4.3.7.7.7h12.2c.4 0 .7-.3.7-.7 0-2.4-3-4.3-6.8-4.3Z" />
              </svg>
            </span>
            <span className="auth-account-copy">
              <span className="auth-account-status">{copy.signedIn}</span>
              <span className="auth-account-label">{accountLabel || copy.accountFallback}</span>
            </span>
          </button>

          {isMenuOpen ? (
            <div className="auth-account-menu" role="menu">
              <Link
                className="auth-account-menu-link"
                href={`/account?lang=${language}`}
                onClick={() => setIsMenuOpen(false)}
              >
                {copy.myPage}
              </Link>
              {isAdmin ? (
                <Link
                  className="auth-account-menu-link"
                  href={`/admin?lang=${language}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {copy.admin}
                </Link>
              ) : null}
              <button
                className="auth-account-menu-button"
                onClick={() => {
                  setIsMenuOpen(false);
                  void signOut();
                }}
                type="button"
              >
                {copy.logout}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={compact ? "auth-action-row compact" : "auth-action-row"}>
      <button
        className="auth-link-chip"
        onClick={() => openAuthModal("signIn", "general")}
        type="button"
      >
        {copy.login}
      </button>
      <button
        className="auth-link-chip"
        onClick={() => openAuthModal("signUp", "general")}
        type="button"
      >
        {copy.signup}
      </button>
    </div>
  );
}
