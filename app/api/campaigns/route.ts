import { query } from "../../../lib/db";

export async function GET() {
  if (!process.env.DATABASE_URL) return Response.json({ mode: "preview", campaigns: [] });
  const campaigns = await query("select * from campaigns order by created_at desc limit 100");
  return Response.json({ mode: "database", campaigns });
}

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) return Response.json({ error: "DATABASE_URL is required" }, { status: 503 });
  const body = await req.json();
  const rows = await query(
    `insert into campaigns (business_id,name,status,daily_slot_target,start_at,end_at,created_by)
     values ($1,$2,'draft',$3,$4,$5,$6) returning *`,
    [body.businessId, body.name, Math.min(Math.max(Number(body.dailySlotTarget ?? 1),1),20), body.startAt ?? null, body.endAt ?? null, body.createdBy ?? "admin"]
  );
  return Response.json(rows[0], { status: 201 });
}
