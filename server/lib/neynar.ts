// Server-side Neynar API client for Farcaster interactions
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || "NEYNAR_API_DOCS";
const NEYNAR_BASE_URL = "https://api.neynar.com/v2";

export interface NeynarUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url?: string;
  follower_count: number;
}

export interface NeynarCast {
  hash: string;
  thread_hash: string;
  parent_hash?: string;
  author: NeynarUser;
  text: string;
  timestamp: string;
  replies: {
    count: number;
  };
  reactions: {
    likes_count: number;
    recasts_count: number;
  };
  embeds: any[];
  mentioned_profiles: NeynarUser[];
}

export class ServerNeynarClient {
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

  async getCastByHash(hash: string): Promise<NeynarCast | null> {
    try {
      const data = await this.makeRequest(`/farcaster/cast?identifier=${hash}&type=hash`);
      return data.cast;
    } catch (error) {
      // Cast not found or deleted
      if ((error as any).message?.includes('404') || (error as any).message?.includes('Cast not found')) {
        return null;
      }
      throw error;
    }
  }

  async verifyCastExists(hash: string): Promise<boolean> {
    try {
      const cast = await this.getCastByHash(hash);
      return cast !== null;
    } catch (error) {
      console.warn(`Error verifying cast ${hash}:`, error);
      return false;
    }
  }

  async getUserByFid(fid: number): Promise<NeynarUser | null> {
    try {
      const data = await this.makeRequest(`/farcaster/user/bulk?fids=${fid}`);
      return data.users[0] || null;
    } catch (error) {
      console.warn(`Error fetching user ${fid}:`, error);
      return null;
    }
  }
}

export const serverNeynarClient = new ServerNeynarClient();