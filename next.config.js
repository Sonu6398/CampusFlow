/** @type {import('next').NextConfig} */

// Amplify exposes environment variables at BUILD time but not always to the
// SSR runtime. We inline the server-side vars we need into the build so they
// are baked into the server bundle (server-only, never sent to the browser).
const PASS_THROUGH = [
  "GROQ_API_KEY",
  "GROQVAL",
  "GROQ_MODEL_EXTRACT",
  "GROQ_MODEL_CHAT",
  "SESSION_SECRET",
  "STORE",
  "DDB_TABLE",
  "CF_AWS_REGION",
  "CF_AWS_ACCESS_KEY_ID",
  "CF_AWS_SECRET_ACCESS_KEY",
];

const env = {};
for (const key of PASS_THROUGH) {
  if (process.env[key]) env[key] = process.env[key];
}

const nextConfig = {
  reactStrictMode: true,
  env,
};

module.exports = nextConfig;
