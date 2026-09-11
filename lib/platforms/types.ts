export type Platform = "facebook"|"instagram"|"threads"|"youtube"|"tiktok"|"snapchat"|"linkedin"|"x"|"pinterest";
export type PublishPayload = { accountId: string; caption: string; mediaUrl: string; mediaType: "image"|"video"; title?: string; };
export type PublishResult = { externalId: string; status: "published"|"submitted"|"draft"; raw?: unknown };
export interface SocialAdapter { platform: Platform; publish(payload: PublishPayload, accessToken: string): Promise<PublishResult>; }
