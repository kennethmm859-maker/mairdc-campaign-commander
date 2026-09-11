import { encryptSecret } from "../../../../../lib/crypto";
import { query } from "../../../../../lib/db";
import { exchangeYouTubeCode, getYouTubeChannel, verifyOAuthState } from "../../../../../lib/googleOAuth";

function redirectWithStatus(request: Request, status: string, detail?: string) {
  const origin = new URL(request.url).origin;
  const url = new URL("/", origin);
  url.searchParams.set("youtube", status);
  if (detail) url.searchParams.set("detail", detail.slice(0, 180));
  return Response.redirect(url, 302);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state") || "";
  const code = url.searchParams.get("code") || "";
  const oauthError = url.searchParams.get("error");

  if (oauthError) return redirectWithStatus(request, "error", oauthError);
  if (!state || !verifyOAuthState(state)) return redirectWithStatus(request, "error", "Invalid or expired OAuth state");
  if (!code) return redirectWithStatus(request, "error", "Google did not return an authorization code");

  try {
    const origin = url.origin;
    const token = await exchangeYouTubeCode(code, origin);
    const channel = await getYouTubeChannel(token.access_token);
    const expiresAt = token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null;
    const scopes = (token.scope || "").split(/\s+/).filter(Boolean);
    const accessTokenEnc = encryptSecret(token.access_token);
    const refreshTokenEnc = token.refresh_token ? encryptSecret(token.refresh_token) : null;

    await query(
      `insert into social_accounts
        (platform, display_name, external_account_id, access_token_enc, refresh_token_enc, scopes, status, expires_at)
       values ('youtube',$1,$2,$3,$4,$5::text[],'connected',$6)
       on conflict (platform, external_account_id) do update set
         display_name=excluded.display_name,
         access_token_enc=excluded.access_token_enc,
         refresh_token_enc=coalesce(excluded.refresh_token_enc, social_accounts.refresh_token_enc),
         scopes=excluded.scopes,
         status='connected',
         expires_at=excluded.expires_at,
         updated_at=now()`,
      [channel.title, channel.id, accessTokenEnc, refreshTokenEnc, scopes, expiresAt],
    );

    await query(
      `insert into audit_events (actor,event_type,details)
       values ('oauth:google','youtube_account_connected',$1::jsonb)`,
      [JSON.stringify({ channelId: channel.id, channelTitle: channel.title, scopes })],
    );

    return redirectWithStatus(request, "connected");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return redirectWithStatus(request, "error", message);
  }
}
