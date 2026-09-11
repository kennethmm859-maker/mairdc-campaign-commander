import { query } from "../../../../lib/db";
import { decryptSecret } from "../../../../lib/crypto";
import { getAdapter } from "../../../../lib/platforms/registry";
import type { Platform } from "../../../../lib/platforms/types";

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!process.env.DATABASE_URL) return Response.json({ ok: true, mode: "preview", processed: 0 });

  const pause = await query<{value:string}>(`select value from system_settings where key='global_pause' limit 1`);
  if (pause[0]?.value === "true") return Response.json({ ok: true, paused: true, processed: 0 });

  const jobs = await query<any>(`
    with due as (
      select sp.id from scheduled_posts sp
      where sp.status='queued' and sp.scheduled_for <= now()
      order by sp.scheduled_for asc
      for update skip locked
      limit 10
    )
    update scheduled_posts sp set status='publishing', updated_at=now()
    from due where sp.id=due.id
    returning sp.*
  `);

  const results: unknown[] = [];
  for (const job of jobs) {
    try {
      const accounts = await query<any>(`select * from social_accounts where id=$1 limit 1`, [job.social_account_id]);
      const account = accounts[0];
      if (!account) throw new Error("Social account not found");
      const adapter = getAdapter(account.platform as Platform);
      const published = await adapter.publish({ accountId: account.external_account_id, caption: job.caption, mediaUrl: job.media_url, mediaType: job.media_type, title: job.title }, decryptSecret(account.access_token_enc));
      await query(`update scheduled_posts set status='published',external_post_id=$2,published_at=now(),updated_at=now() where id=$1`, [job.id,published.externalId]);
      await query(`insert into publish_attempts (scheduled_post_id,status,response) values ($1,'success',$2::jsonb)`, [job.id,JSON.stringify(published.raw ?? published)]);
      results.push({ id: job.id, ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await query(`update scheduled_posts set status=case when attempt_count+1>=max_attempts then 'failed' else 'queued' end, attempt_count=attempt_count+1,last_error=$2,scheduled_for=now()+interval '30 minutes',updated_at=now() where id=$1`, [job.id,message]);
      await query(`insert into publish_attempts (scheduled_post_id,status,error_message) values ($1,'failed',$2)`, [job.id,message]);
      results.push({ id: job.id, ok: false, error: message });
    }
  }
  return Response.json({ ok: true, processed: jobs.length, results });
}
