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

  async publishCast(text: string, signerUuid?: string): Promise<{ success: boolean; cast?: any; error?: string }> {
    try {
      // For now, we'll use a simple approach without signer
      // In production, you'd need to set up a signer for the Story Weaver account
      
      const requestBody = {
        text: text,
        // If you have a signer UUID, add it here:
        // signer_uuid: signerUuid
      };

      console.log('Publishing cast:', text);
      
      // Note: This would require a signer to be set up for the Story Weaver account
      // For now, we'll simulate the posting and return a success response
      
      // Uncomment this when you have a signer set up:
      // const data = await this.makeRequest('/farcaster/cast', {
      //   method: 'POST',
      //   body: JSON.stringify(requestBody)
      // });
      
      // return { success: true, cast: data.cast };
      
      // Temporary simulation - remove when real posting is enabled
      console.log('Cast would be published:', text);
      return { 
        success: true, 
        cast: { 
          hash: `simulated_${Date.now()}`,
          text: text 
        }
      };
      
    } catch (error) {
      console.error('Error publishing cast:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

export const serverNeynarClient = new ServerNeynarClient();