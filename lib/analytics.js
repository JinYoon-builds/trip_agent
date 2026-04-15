function analyticsReady() {
  return (
    typeof window !== "undefined" &&
    typeof window.gtag === "function"
  );
}

function sanitizeAnalyticsValue(value) {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  return undefined;
}

function sanitizeAnalyticsParams(params) {
  return Object.entries(params).reduce((accumulator, [key, value]) => {
    const sanitizedValue = sanitizeAnalyticsValue(value);

    if (typeof sanitizedValue !== "undefined") {
      accumulator[key] = sanitizedValue;
    }

    return accumulator;
  }, {});
}

export function trackEvent(eventName, params = {}) {
  if (!analyticsReady() || !eventName) {
    return;
  }

  window.gtag("event", eventName, sanitizeAnalyticsParams(params));
}

export function trackPageView({
  pagePath,
  pageTitle,
  pageLocation,
  ...params
} = {}) {
  if (!analyticsReady()) {
    return;
  }

  const fallbackPath = `${window.location.pathname}${window.location.search}`;
  const normalizedPath = pagePath || fallbackPath;
  const normalizedLocation =
    pageLocation || `${window.location.origin}${normalizedPath}`;

  window.gtag(
    "event",
    "page_view",
    sanitizeAnalyticsParams({
      page_path: normalizedPath,
      page_title: pageTitle || document.title,
      page_location: normalizedLocation,
      ...params,
    }),
  );
}
