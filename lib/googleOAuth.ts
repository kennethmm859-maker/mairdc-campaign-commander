import crypto from "node:crypto";

export const YOUTUBE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtube.upload",
] as const;

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function baseUrl(origin?: string) {
  const explicit = process.env.APP_BASE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(/\/$/, "");
  if (vercel) return vercel.startsWith("http") ? vercel : `https://${vercel}`;

  if (origin) return origin.replace(/\/$/, "");
  throw new Error("APP_BASE_URL is not configured");
}

export function googleOAuthConfig(origin?: string) {
  const appBaseUrl = baseUrl(origin);
  return {
    clientId: required("GOOGLE_CLIENT_ID"),
    clientSecret: required("GOOGLE_CLIENT_SECRET"),
    redirectUri: `${appBaseUrl}/api/oauth/youtube/callback`,
    appBaseUrl,
  };
}

function stateKey() {
  const raw = required("TOKEN_ENCRYPTION_KEY");
  if (!/^[a-fA-F0-9]{64}$/.test(raw)) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be 64 hex characters");
  }
  return Buffer.from(raw, "hex");
}

export function createOAuthState() {
  const payload = `${Date.now()}.${crypto.randomBytes(18).toString("base64url")}`;
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", stateKey()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyOAuthState(state: string, maxAgeMs = 10 * 60 * 1000) {
  const [encoded, suppliedSignature] = state.split(".");
  if (!encoded || !suppliedSignature) return false;

  const expectedSignature = crypto.createHmac("sha256", stateKey()).update(encoded).digest("base64url");
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) return false;

  try {
    const payload = Buffer.from(encoded, "base64url").toString("utf8");
    const timestamp = Number(payload.split(".")[0]);
    return Number.isFinite(timestamp) && Date.now() - timestamp >= 0 && Date.now() - timestamp <= maxAgeMs;
  } catch {
    return false;
  }
}

export function youtubeAuthorizationUrl(origin?: string) {
  const { clientId, redirectUri } = googleOAuthConfig(origin);
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", YOUTUBE_SCOPES.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", createOAuthState());
  return url;
}

type GoogleTokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
};

export async function exchangeYouTubeCode(code: string, origin?: string): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret, redirectUri } = googleOAuthConfig(origin);
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const data = (await response.json()) as GoogleTokenResponse & { error?: string; error_description?: string };
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Google token exchange failed");
  }
  return data;
}

export async function getYouTubeChannel(accessToken: string) {
  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("part", "id,snippet");
  url.searchParams.set("mine", "true");

  const response = await fetch(url, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const data = (await response.json()) as {
    items?: Array<{ id: string; snippet?: { title?: string } }>;
    error?: { message?: string };
  };
  if (!response.ok) throw new Error(data.error?.message || "Unable to read YouTube channel");
  const channel = data.items?.[0];
  if (!channel?.id) throw new Error("No YouTube channel is available for this Google account");
  return { id: channel.id, title: channel.snippet?.title || "YouTube Channel" };
}
