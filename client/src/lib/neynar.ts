// Neynar API client for Farcaster interactions
const NEYNAR_API_KEY = import.meta.env.VITE_NEYNAR_API_KEY || "NEYNAR_API_DOCS";
const NEYNAR_BASE_URL = "https://api.neynar.com/v2";

export interface NeynarUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url?: string;
  follower_count: number;
}

export interface NeynarReaction {
  type: "like" | "recast";
  hash: string;
  reactor: NeynarUser;
  timestamp: string;
}

export class NeynarClient {
  private apiKey: string;

  constructor(apiKey: string = NEYNAR_API_KEY) {
    this.apiKey = apiKey;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${NEYNAR_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        "x-api-key": this.apiKey,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Neynar API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getUserByFid(fid: number): Promise<NeynarUser> {
    const data = await this.makeRequest(`/farcaster/user/bulk?fids=${fid}`);
    return data.users[0];
  }

  async getCastReactions(hash: string): Promise<NeynarReaction[]> {
    const data = await this.makeRequest(`/farcaster/reaction/cast?hash=${hash}&types=likes,recasts`);
    return data.reactions;
  }

  async publishReaction(signerUuid: string, reactionType: "like" | "recast", target: string) {
    return this.makeRequest("/farcaster/reaction", {
      method: "POST",
      body: JSON.stringify({
        signer_uuid: signerUuid,
        reaction_type: reactionType,
        target,
      }),
    });
  }

  async deleteReaction(signerUuid: string, reactionType: "like" | "recast", target: string) {
    return this.makeRequest("/farcaster/reaction", {
      method: "DELETE",
      body: JSON.stringify({
        signer_uuid: signerUuid,
        reaction_type: reactionType,
        target,
      }),
    });
  }
}

export const neynarClient = new NeynarClient();
