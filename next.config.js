import { randomBytes } from "node:crypto";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // A random session-signing key per build, used only when SESSION_SECRET isn't set.
  // It is only referenced from server code (lib/auth.js), so it never reaches the browser.
  env: { OPPWISE_BUILD_SECRET: process.env.SESSION_SECRET ? "" : randomBytes(32).toString("hex") },
  experimental: {
    // Keep the database drivers out of the server bundle (PGlite ships WASM).
    serverComponentsExternalPackages: ["@electric-sql/pglite", "pg"],
    // Make sure PGlite's WASM/data files are deployed alongside the server functions.
    outputFileTracingIncludes: { "/**": ["./node_modules/@electric-sql/pglite/dist/**"] },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};
export default nextConfig;
