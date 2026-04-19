"use client";

import { useEffect, useRef, useState } from "react";

let paypalSdkPromise = null;

function loadPayPalSdk({ clientId, currency }) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("PayPal SDK can only load in the browser."));
  }

  if (window.paypal?.Buttons) {
    return Promise.resolve(window.paypal);
  }

  if (paypalSdkPromise) {
    return paypalSdkPromise;
  }

  paypalSdkPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(
      'script[data-paypal-sdk="liu-unnie"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.paypal));
      existingScript.addEventListener("error", () =>
        reject(new Error("Failed to load the PayPal SDK.")),
      );
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      clientId,
    )}&currency=${encodeURIComponent(currency)}&intent=capture`;
    script.async = true;
    script.dataset.paypalSdk = "liu-unnie";
    script.onload = () => resolve(window.paypal);
    script.onerror = () =>
      reject(new Error("Failed to load the PayPal SDK."));
    document.body.appendChild(script);
  });

  return paypalSdkPromise;
}

export default function PayPalButton({
  amount,
  amountLabel = "Secure checkout amount",
  clientId,
  createOrder,
  currency = "USD",
  disabled = false,
  emptyClientIdMessage = "PayPal is not configured.",
  onApprove,
}) {
  const containerRef = useRef(null);
  const buttonsRef = useRef(null);
  const disabledRef = useRef(disabled);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    let cancelled = false;

    async function renderButtons() {
      if (!containerRef.current || !clientId) {
        setErrorMessage(clientId ? "" : emptyClientIdMessage);
        return;
      }

      setErrorMessage("");

      try {
        const paypal = await loadPayPalSdk({ clientId, currency });

        if (cancelled || !paypal?.Buttons || !containerRef.current) {
          return;
        }

        if (buttonsRef.current?.close) {
          await buttonsRef.current.close().catch(() => {});
        }

        containerRef.current.innerHTML = "";
        const buttons = paypal.Buttons({
          onClick: (_data, actions) => {
            if (!disabledRef.current) {
              return actions.resolve();
            }

            setErrorMessage("PayPal checkout is already in progress.");
            return actions.reject();
          },
          createOrder: async () => createOrder(),
          onApprove: async (data) => {
            await onApprove(data.orderID);
          },
          onError: (error) => {
            console.error(error);
            setErrorMessage(
              typeof error?.message === "string" && error.message
                ? error.message
                : "PayPal could not start the checkout flow.",
            );
          },
          onCancel: () => {
            setErrorMessage("");
          },
        });

        buttonsRef.current = buttons;
        await buttons.render(containerRef.current);
      } catch (error) {
        console.error(error);
        setErrorMessage(
          typeof error?.message === "string" && error.message
            ? error.message
            : "PayPal could not start the checkout flow.",
        );
      }
    }

    void renderButtons();

    return () => {
      cancelled = true;

      if (buttonsRef.current?.close) {
        void buttonsRef.current.close().catch(() => {});
      }

      buttonsRef.current = null;
    };
  }, [clientId, createOrder, currency, emptyClientIdMessage, onApprove]);

  return (
    <div>
      <div ref={containerRef} />
      {disabled ? (
        <p className="survey-paypal-note">
          Completing your PayPal payment...
        </p>
      ) : null}
      {Number.isFinite(Number(amount)) ? (
        <p className="survey-paypal-note">
          {amountLabel}: {currency} {Number(amount).toFixed(2)}
        </p>
      ) : null}
      {errorMessage ? <p className="survey-paypal-error">{errorMessage}</p> : null}
    </div>
  );
}
