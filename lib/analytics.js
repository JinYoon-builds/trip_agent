function analyticsReady() {
  return (
    typeof window !== "undefined" &&
    (typeof window.gtag === "function" || Array.isArray(window.dataLayer))
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

function pushDataLayerEvent(eventName, params = {}) {
  if (!Array.isArray(window.dataLayer)) {
    return;
  }

  window.dataLayer.push({
    event: eventName,
    ...params,
  });
}

export function trackEvent(eventName, params = {}) {
  if (!analyticsReady() || !eventName) {
    return;
  }

  const sanitizedParams = sanitizeAnalyticsParams(params);

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, sanitizedParams);
    return;
  }

  pushDataLayerEvent(eventName, sanitizedParams);
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
  const sanitizedParams = sanitizeAnalyticsParams({
    page_path: normalizedPath,
    page_title: pageTitle || document.title,
    page_location: normalizedLocation,
    ...params,
  });

  if (typeof window.gtag === "function") {
    window.gtag("event", "page_view", sanitizedParams);
    return;
  }

  pushDataLayerEvent("page_view", sanitizedParams);
}
