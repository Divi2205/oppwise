"use client";
import { useEffect } from "react";
// Registers the service worker so the app can be installed (needed for the WhatsApp share target).
export default function ServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
