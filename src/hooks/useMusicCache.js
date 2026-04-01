import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Communicates with the music-caching Service Worker (public/sw.js).
 * Returns helpers to cache/uncache individual tracks and check status.
 *
 * @param {string[]} urls  – audio URLs to monitor for cache status
 */
export default function useMusicCache(urls = []) {
  const [cached, setCached] = useState({});
  const [loading, setLoading] = useState({});
  const urlsRef = useRef(urls);
  urlsRef.current = urls;

  const sw = useCallback(() => navigator.serviceWorker?.controller, []);

  // Bulk-check cache status whenever the URL list changes
  useEffect(() => {
    if (!navigator.serviceWorker) return;

    const handler = (e) => {
      const { type } = e.data || {};

      if (type === "CACHE_STATUS_BULK_RESULT") {
        setCached((prev) => ({ ...prev, ...e.data.statuses }));
      }
      if (type === "CACHE_STATUS_RESULT") {
        setCached((prev) => ({ ...prev, [e.data.url]: e.data.cached }));
      }
      if (type === "CACHE_TRACK_DONE") {
        setCached((prev) => ({ ...prev, [e.data.url]: e.data.ok }));
        setLoading((prev) => ({ ...prev, [e.data.url]: false }));
      }
      if (type === "UNCACHE_TRACK_DONE") {
        setCached((prev) => ({ ...prev, [e.data.url]: false }));
        setLoading((prev) => ({ ...prev, [e.data.url]: false }));
      }
    };

    navigator.serviceWorker.addEventListener("message", handler);

    // Wait for controller to be available, then request bulk status
    const requestBulk = () => {
      const ctrl = navigator.serviceWorker.controller;
      if (ctrl && urlsRef.current.length > 0) {
        ctrl.postMessage({ type: "CACHE_STATUS_BULK", urls: urlsRef.current });
      }
    };

    if (navigator.serviceWorker.controller) {
      requestBulk();
    } else {
      navigator.serviceWorker.addEventListener("controllerchange", requestBulk, { once: true });
    }

    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, [urls.join(",")]);

  const cacheTrack = useCallback((url) => {
    const ctrl = sw();
    if (!ctrl || !url) return;
    setLoading((prev) => ({ ...prev, [url]: true }));
    ctrl.postMessage({ type: "CACHE_TRACK", url });
  }, [sw]);

  const uncacheTrack = useCallback((url) => {
    const ctrl = sw();
    if (!ctrl || !url) return;
    setLoading((prev) => ({ ...prev, [url]: true }));
    ctrl.postMessage({ type: "UNCACHE_TRACK", url });
  }, [sw]);

  const cacheAll = useCallback((urlList) => {
    urlList.forEach((u) => cacheTrack(u));
  }, [cacheTrack]);

  const isCached = useCallback((url) => !!cached[url], [cached]);
  const isLoading = useCallback((url) => !!loading[url], [loading]);

  return { cached, loading, cacheTrack, uncacheTrack, cacheAll, isCached, isLoading };
}
