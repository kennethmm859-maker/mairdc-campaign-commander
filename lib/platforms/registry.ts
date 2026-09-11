import type { Platform, SocialAdapter } from "./types";

class PendingAdapter implements SocialAdapter {
  constructor(public platform: Platform) {}
  async publish() { throw new Error(`${this.platform} adapter is installed but not enabled. Complete OAuth/app approval first.`); }
}

const platforms: Platform[] = ["facebook","instagram","threads","youtube","tiktok","snapchat","linkedin","x","pinterest"];
const adapters = new Map<Platform, SocialAdapter>(platforms.map((p)=>[p,new PendingAdapter(p)]));

export function getAdapter(platform: Platform) {
  const adapter = adapters.get(platform);
  if (!adapter) throw new Error(`Unsupported platform: ${platform}`);
  return adapter;
}
