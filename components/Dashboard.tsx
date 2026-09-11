"use client";

import { useMemo, useState } from "react";

type Mode = "Manual" | "Assisted" | "Autonomous";

const networks = [
  ["Facebook", "Meta adapter", "pending"],
  ["Instagram", "Meta adapter", "pending"],
  ["Threads", "Meta adapter", "pending"],
  ["YouTube", "Google OAuth", "pending"],
  ["TikTok", "Direct Post / Draft", "pending"],
  ["Snapchat", "Capability review", "blocked"],
  ["LinkedIn", "OAuth adapter", "pending"],
  ["X", "OAuth adapter", "pending"],
  ["Pinterest", "OAuth adapter", "pending"]
] as const;

const queue = [
  ["08:15", "Cox Paralegal Services", "Business services flyer", "Instagram + Facebook"],
  ["10:30", "MAIRDC", "Autonomous laboratory campaign", "LinkedIn + Threads"],
  ["12:45", "YIE YIE YIE", "AI finance platform teaser", "YouTube + X"],
  ["15:00", "Vehicle Export", "Overseas buyer campaign", "Facebook + Instagram"],
  ["18:30", "AACC", "Community awareness campaign", "Facebook + YouTube"]
];

export default function Dashboard() {
  const [mode, setMode] = useState<Mode>("Assisted");
  const [paused, setPaused] = useState(false);
  const configured = useMemo(() => networks.filter((x) => x[2] === "ready").length, []);

  async function emergencyStop() {
    setPaused(true);
    try { await fetch("/api/emergency-stop", { method: "POST" }); } catch {}
  }

  return (
    <main className="shell">
      <header className="header">
        <div className="brand">
          <div className="badge"><span className="dot"/> MAIRDC SYSTEM</div>
          <h1>Campaign Commander</h1>
          <p>Autonomous multi-brand advertising and social publishing control center.</p>
        </div>
        <div className="row">
          <label className="muted">Mode</label>
          <select className="btn" value={mode} onChange={(e)=>setMode(e.target.value as Mode)}>
            <option>Manual</option><option>Assisted</option><option>Autonomous</option>
          </select>
          <button className="btn danger" onClick={emergencyStop}>{paused ? "PUBLISHING PAUSED" : "STOP ALL POSTING"}</button>
        </div>
      </header>

      <section className="grid stats">
        <div className="card stat"><span>Daily campaign slots</span><strong>20</strong><small className="muted">Distributed by policy and platform limits</small></div>
        <div className="card stat"><span>Connected accounts</span><strong>{configured}</strong><small className="muted">No MAIRDC-imposed account ceiling</small></div>
        <div className="card stat"><span>Queued campaigns</span><strong>5</strong><small className="muted">Sample queue until database is connected</small></div>
        <div className="card stat"><span>System state</span><strong className={paused?"status-blocked":"status-ready"}>{paused?"PAUSED":"ARMED"}</strong><small className="muted">Live publishing requires OAuth credentials</small></div>
      </section>

      <section className="grid main">
        <div className="grid">
          <div className="card">
            <div className="row spread"><h2>Social network adapters</h2><span className="badge">9 adapters</span></div>
            <div className="networks">
              {networks.map(([name, note, status]) => <div className="network" key={name}><b>{name}</b><small>{note}</small><div className={`status-${status}`} style={{marginTop:8,fontSize:12,fontWeight:800}}>{status === "blocked" ? "REVIEW REQUIRED" : status.toUpperCase()}</div></div>)}
            </div>
          </div>

          <div className="card">
            <div className="row spread"><h2>Today&apos;s intelligent queue</h2><span className="badge">America/New_York</span></div>
            <div className="queue">
              {queue.map(([time,business,creative,dest]) => <div className="queueItem" key={time+business}><b>{time}</b><div><strong>{business}</strong><br/><small>{creative}</small></div><small>{dest}</small></div>)}
            </div>
          </div>
        </div>

        <aside className="grid">
          <div className="card">
            <h2>Autonomous campaign policy</h2>
            <p className="muted">Campaign Commander selects a brand, approved creative, eligible account, caption variation and posting slot while respecting platform-specific limits.</p>
            <div className="progress"><i/></div>
            <div className="row spread" style={{marginTop:8}}><small className="muted">Daily allocation</small><small>13 / 20 planned</small></div>
            <div className="actions"><button className="btn primary">New campaign</button><button className="btn">Media library</button><button className="btn">Connect account</button><button className="btn">Audit log</button></div>
          </div>

          <div className="card">
            <h2>Production checklist</h2>
            <table className="table"><tbody>
              <tr><td>Application shell</td><td className="status-ready">Ready</td></tr>
              <tr><td>Database schema</td><td className="status-ready">Ready</td></tr>
              <tr><td>Scheduler + retries</td><td className="status-ready">Ready</td></tr>
              <tr><td>Token encryption</td><td className="status-ready">Ready</td></tr>
              <tr><td>OAuth credentials</td><td className="status-pending">Needed</td></tr>
              <tr><td>Platform app review</td><td className="status-pending">External</td></tr>
            </tbody></table>
          </div>

          <div className="card"><h2>Safety controls</h2><p className="muted">Duplicate suppression, per-account daily caps, retry backoff, global pause, platform policy gates, and complete publish-attempt logging are built into the scheduler design.</p></div>
        </aside>
      </section>
      <footer className="footer">MAIRDC Campaign Commander · Production foundation v0.1</footer>
    </main>
  );
}
