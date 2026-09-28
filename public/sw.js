// Minimal service worker: makes OppWise installable as an app. Network-first, no caching of private data.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
