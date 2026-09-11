import { youtubeAuthorizationUrl } from "../../../../../lib/googleOAuth";

export async function GET(request: Request) {
  try {
    const origin = new URL(request.url).origin;
    return Response.redirect(youtubeAuthorizationUrl(origin), 302);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 503 });
  }
}
