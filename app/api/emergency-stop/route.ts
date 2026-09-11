import { query } from "../../../lib/db";

export async function POST() {
  if (!process.env.DATABASE_URL) return Response.json({ ok: true, mode: "preview", paused: true });
  await query(`insert into system_settings (key,value,updated_at) values ('global_pause','true',now()) on conflict (key) do update set value='true',updated_at=now()`);
  await query(`insert into audit_events (actor,event_type,details) values ('admin','GLOBAL_PAUSE','{}'::jsonb)`);
  return Response.json({ ok: true, paused: true });
}
