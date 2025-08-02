export interface FarcasterSDK {
  actions: {
    ready: () => Promise<void>;
  };
  context: {
    user?: {
      fid: number;
      username?: string;
      displayName?: string;
      pfpUrl?: string;
    };
    client?: {
      platformType?: 'web' | 'mobile';
      clientFid: number;
      added: boolean;
    };
    location?: {
      type: 'cast_embed' | 'cast_share' | 'notification' | 'open_miniapp' | 'launcher' | 'channel';
    };
  };
  quickAuth?: {
    fetch: (url: string, options?: RequestInit) => Promise<Response>;
    getToken: () => Promise<{ token: string }>;
  };
}

// Mock SDK for development - replace with actual Farcaster Mini App SDK
export const createMockSDK = (): FarcasterSDK => ({
  actions: {
    ready: async () => {
      console.log("Farcaster SDK ready");
    }
  },
  context: {
    user: {
      fid: 977521, // User's actual FID
      username: "worthifyme",
      displayName: "Story Creator",
      pfpUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"
    },
    client: {
      platformType: 'web',
      clientFid: 977521,
      added: false
    },
    location: {
      type: 'open_miniapp'
    }
  },
  quickAuth: {
    fetch: async (url: string, options?: RequestInit) => {
      // Mock authenticated fetch for development
      return fetch(url, options);
    },
    getToken: async () => {
      return { token: 'mock-jwt-token-for-development' };
    }
  }
});

// Initialize SDK
export const initializeFarcasterSDK = async (): Promise<FarcasterSDK> => {
  try {
    // Try to load actual Farcaster SDK
    if (typeof window !== "undefined") {
      // Check if running in Farcaster Mini App environment
      const isInFarcaster = window.location.search.includes("miniApp=true") || 
                           window.location.pathname.startsWith("/mini") ||
                           window.location.search.includes("fc_frame=") ||
                           window.parent !== window; // Running in iframe (Farcaster client)
      
      if (isInFarcaster) {
        try {
          // Import the actual Farcaster Mini App SDK
          const { sdk } = await import('@farcaster/miniapp-sdk');
          console.log("Running in Farcaster environment - using real SDK");
          
          // Context may be a promise in some versions
          const context = await Promise.resolve(sdk.context);
          
          return {
            actions: {
              ready: sdk.actions.ready
            },
            context: {
              user: context.user ? {
                fid: context.user.fid,
                username: context.user.username,
                displayName: context.user.displayName,
                pfpUrl: context.user.pfpUrl
              } : undefined,
              client: context.client,
              location: context.location
            },
            quickAuth: sdk.quickAuth ? {
              fetch: sdk.quickAuth.fetch,
              getToken: sdk.quickAuth.getToken
            } : undefined
          };
        } catch (sdkError: any) {
          // Suppress expected CSP and network errors in Farcaster iframe environment
          if (!sdkError?.message?.includes('Content Security Policy') && 
              !sdkError?.message?.includes('client.farcaster.xyz') &&
              !sdkError?.message?.includes('404')) {
            console.warn("Failed to load Farcaster SDK, using mock:", sdkError);
          }
          return createMockSDK();
        }
      }
    }
    
    // Fallback to mock SDK for development
    console.log("Running outside Farcaster - using mock SDK");
    return createMockSDK();
  } catch (error) {
    console.error("Failed to initialize Farcaster SDK:", error);
    return createMockSDK();
  }
};
