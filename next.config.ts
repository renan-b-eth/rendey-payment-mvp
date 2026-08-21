import type { NextConfig } from "next";

// =============================================================================
// Next.js Configuration — Valence Payment Platform
//
// serverExternalPackages keeps native Node modules (better-sqlite3) OUT of
// the Turbopack bundle: they are resolved at runtime through Node's native
// module loading instead of being compiled, which prevents build failures
// caused by native bindings (.node files) during the production build.
// =============================================================================

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
