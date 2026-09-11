"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";

type Mode = "Manual" | "Assisted" | "Autonomous";
type NetworkStatus = "ready" | "pending" | "blocked";
type NetworkRow = readonly [string, string, NetworkStatus, string];
type ConnectedAccount = { platform: string; status: string; display_name?: string };

const networks: readonly NetworkRow[] = [
  ["Facebook", "Meta adapter", "pending", "facebook"],
  ["Instagram", "Meta adapter", "pending", "instagram"],
  ["Threads", "Meta adapter", "pending", "threads"],
  ["YouTube", "Google OAuth", "pending", "youtube"],
  ["TikTok", "Direct Post / Draft", "pending", "tiktok"],
  ["Snapchat", "Capability review", "blocked", "snapchat"],
  ["LinkedIn", "OAuth adapter", "pending", "linkedin"],
  ["X", "OAuth adapter", "pending", "x"],
  ["Pinterest", "OAuth adapter", "pending", "pinterest"]
];

const queue = [
  ["08:15", "Cox Paralegal Services", "Business services flyer", "Instagram + Facebook"],
  ["10:30", "MAIRDC", "Autonomous laboratory campaign", "LinkedIn + Threads"],
  ["12:45", "YIE YIE YIE", "AI finance platform teaser", "YouTube + X"],
  ["15:00", "Vehicle Export", "Overseas buyer campaign", "Facebook + Instagram"],
  ["18:30", "AACC", "Community awareness campaign", "Facebook + YouTube"]
] as const;

export default function Dashboard() {
  const [mode, setMode] = useState<Mode>("Assisted");
  const [paused, setPaused] = useState(false);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetch("/api/accounts", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setAccounts(Array.isArray(data.accounts) ? data.accounts : []))
      .catch(() => setAccounts([]));

    const params = new URLSearchParams(window.location.search);
    const youtube = params.get("youtube");
    if (youtube === "connected") setNotice("YouTube connected successfully.");
    if (youtube === "error") setNotice(`YouTube connection failed: ${params.get("detail") || "unknown error"}`);
  }, []);

  const connectedPlatforms = useMemo(
    () => new Set(accounts.filter((a) => a.status === "connected").map((a) => a.platform)),
    [accounts],
  );

  const liveNetworks = useMemo(
    () => networks.map(([name, note, defaultStatus, platform]) => [
      name,
      note,
      connectedPlatforms.has(platform) ? "ready" : defaultStatus,
      platform,
    ] as const),
    [connectedPlatforms],
  );

  const configured = accounts.filter((a) => a.status === "connected").length;

  async function emergencyStop() {
    setPaused(true);
    try { await fetch("/api/emergency-stop", { method: "POST" }); } catch {}
  }

  function handleModeChange(e: ChangeEvent<HTMLSelectElement>) {
    setMode(e.target.value as Mode);
  }

  return (
    <main className="shell">
      <header className="header">
        <div className="brand">
          <div className="badge"><span className="dot"/> MAIRDC SYSTEM</div>
          <h1>Campaign Commander</h1>
          <p>Autonomous multi-brand advertising and social publishing control center.</p>
          {notice && <p className="badge" style={{marginTop:12}}>{notice}</p>}
        </div>
        <div className="row">
          <label className="muted">Mode</label>
          <select className="btn" value={mode} onChange={handleModeChange}>
            <option>Manual</option><option>Assisted</option><option>Autonomous</option>
          </select>
          <button className="btn danger" onClick={emergencyStop}>{paused ? "PUBLISHING PAUSED" : "STOP ALL POSTING"}</button>
        </div>
      </header>

      <section className="grid stats">
        <div className="card stat"><span>Daily campaign slots</span><strong>20</strong><small className="muted">Distributed by policy and platform limits</small></div>
        <div className="card stat"><span>Connected accounts</span><strong>{configured}</strong><small className="muted">No MAIRDC-imposed account ceiling</small></div>
        <div className="card stat"><span>Queued campaigns</span><strong>5</strong><small className="muted">Sample queue until campaigns are loaded</small></div>
        <div className="card stat"><span>System state</span><strong className={paused?"status-blocked":"status-ready"}>{paused?"PAUSED":"ARMED"}</strong><small className="muted">Publishing requires an authorized account</small></div>
      </section>

      <section className="grid main">
        <div className="grid">
          <div className="card">
            <div className="row spread"><h2>Social network adapters</h2><span className="badge">9 adapters</span></div>
            <div className="networks">
              {liveNetworks.map(([name, note, status, platform]) => (
                <div className="network" key={name}>
                  <b>{name}</b><small>{note}</small>
                  <div className={`status-${status}`} style={{marginTop:8,fontSize:12,fontWeight:800}}>{status === "blocked" ? "REVIEW REQUIRED" : status.toUpperCase()}</div>
                  {platform === "youtube" && (
                    <a className="btn primary" style={{display:"inline-block",marginTop:10,textDecoration:"none"}} href="/api/oauth/youtube/start">
                      {status === "ready" ? "Reconnect YouTube" : "Connect YouTube"}
                    </a>
                  )}
                </div>
              ))}
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
            <div className="actions"><button className="btn primary">New campaign</button><button className="btn">Media library</button><a className="btn" style={{textDecoration:"none",textAlign:"center"}} href="/api/oauth/youtube/start">Connect YouTube</a><button className="btn">Audit log</button></div>
          </div>

          <div className="card">
            <h2>Production checklist</h2>
            <table className="table"><tbody>
              <tr><td>Application shell</td><td className="status-ready">Ready</td></tr>
              <tr><td>Database schema</td><td className="status-ready">Ready</td></tr>
              <tr><td>Scheduler + retries</td><td className="status-ready">Ready</td></tr>
              <tr><td>Token encryption</td><td className="status-ready">Ready</td></tr>
              <tr><td>YouTube OAuth route</td><td className="status-ready">Ready</td></tr>
              <tr><td>Google OAuth credentials</td><td className={connectedPlatforms.has("youtube") ? "status-ready" : "status-pending"}>{connectedPlatforms.has("youtube") ? "Connected" : "Needed"}</td></tr>
            </tbody></table>
          </div>

          <div className="card"><h2>Safety controls</h2><p className="muted">Duplicate suppression, per-account daily caps, retry backoff, global pause, platform policy gates, and complete publish-attempt logging are built into the scheduler design.</p></div>
        </aside>
      </section>
      <footer className="footer">MAIRDC Campaign Commander · Production foundation v0.2</footer>
    </main>
  );
}
