export interface FarcasterSDK {
  actions: {
    ready: () => Promise<void>;
  };
  context: {
    user?: {
      fid: number;
      username: string;
      displayName: string;
      pfpUrl?: string;
    };
  };
  on: (event: string, callback: (data: any) => void) => void;
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
      fid: 12345,
      username: "alexchen",
      displayName: "Alex Chen",
      pfpUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"
    }
  },
  on: (event: string, callback: (data: any) => void) => {
    console.log(`Listening for event: ${event}`);
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
                           window.location.search.includes("fc_frame=");
      
      if (isInFarcaster) {
        try {
          // Import the actual Farcaster Mini App SDK
          const { sdk } = await import('@farcaster/miniapp-sdk');
          console.log("Running in Farcaster environment - using real SDK");
          
          // Get the context (which is a promise in the real SDK)
          const context = await sdk.context;
          
          return {
            actions: {
              ready: sdk.actions.ready
            },
            context: {
              user: context.user ? {
                fid: context.user.fid,
                username: context.user.username || `user${context.user.fid}`,
                displayName: context.user.displayName || context.user.username || `User ${context.user.fid}`,
                pfpUrl: context.user.pfpUrl
              } : undefined
            },
            on: (event: string, callback: (data: any) => void) => {
              // Adapt the SDK's event system to our interface
              sdk.on(event as any, callback);
            }
          };
        } catch (sdkError) {
          console.warn("Failed to load Farcaster SDK, using mock:", sdkError);
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
