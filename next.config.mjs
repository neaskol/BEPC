import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: false,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    // Stratégies de runtime cache
    runtimeCaching: [
      // ============================
      // Cache-Only : app shell critique
      // ============================
      {
        urlPattern: /^\/manifest\.json$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "app-shell",
          expiration: { maxEntries: 10, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /\/icons\/.+\.(png|ico|svg)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "app-shell",
          expiration: { maxEntries: 30, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },

      // ============================
      // Network-First : API calls et données de progression
      // EXCLUSIONS EXPLICITES : auth, génération IA, classement
      // ============================
      {
        // Exclure explicitement : /api/cours/generate, /api/auth/*, /api/classement
        urlPattern: ({ url }) => {
          const path = url.pathname;
          if (
            path.startsWith("/api/cours/generate") ||
            path.startsWith("/api/auth/") ||
            path.startsWith("/api/classement")
          ) {
            return false; // Ne pas mettre en cache
          }
          return path.startsWith("/api/");
        },
        handler: "NetworkFirst",
        options: {
          cacheName: "api-cache",
          networkTimeoutSeconds: 10,
          expiration: { maxEntries: 64, maxAgeSeconds: 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },

      // ============================
      // Stale-While-Revalidate : pages statiques, CSS/JS, cours, exercices
      // ============================
      {
        urlPattern: /\/_next\/static\/.+\.(js|css|woff2?)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-assets",
          expiration: { maxEntries: 128, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /\/_next\/image\?.+$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "next-image",
          expiration: { maxEntries: 64, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
      {
        // Pages de cours et exercices générés (URLs statiques, pas /api/cours/generate)
        urlPattern: ({ url }) => {
          const path = url.pathname;
          return (
            path.startsWith("/cours/") ||
            path.startsWith("/exercices/") ||
            path.startsWith("/flashcards/")
          );
        },
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "content-pages",
          expiration: { maxEntries: 128, maxAgeSeconds: 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        // Pages générales (dashboard, profil, etc.)
        urlPattern: ({ url }) => {
          const path = url.pathname;
          return (
            path === "/" ||
            path === "/dashboard" ||
            path.startsWith("/profil") ||
            path.startsWith("/badges") ||
            path.startsWith("/entrainement")
          );
        },
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "pages-cache",
          expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Compression gzip/brotli
  compress: true,

  // Optimisation images : WebP et AVIF
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 jours
  },

  // Headers de sécurité (complément à vercel.json)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com;",
          },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
