import { query } from "../../../lib/db";

export async function GET() {
  if (!process.env.DATABASE_URL) return Response.json({ mode: "preview", accounts: [] });
  const accounts = await query(`select id,platform,display_name,external_account_id,status,expires_at,created_at from social_accounts order by created_at desc`);
  return Response.json({ mode: "database", accounts });
}
