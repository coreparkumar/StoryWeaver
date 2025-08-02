/**
 * Farcaster SDK Integration Hook
 * 
 * Provides seamless integration with Farcaster Mini App SDK for user authentication
 * and social features. This hook manages the SDK lifecycle, user data fetching,
 * and context sharing across the application.
 * 
 * Features:
 * - Automatic SDK initialization
 * - User authentication via Farcaster identity
 * - Enhanced user data from Neynar API
 * - Context sharing for components
 * - Error handling and loading states
 */

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { initializeFarcasterSDK, FarcasterSDK } from "@/lib/farcaster";
import { neynarClient } from "@/lib/neynar";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface FarcasterContextType {
  sdk: FarcasterSDK | null;
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  ready: () => Promise<void>;
}

const FarcasterContext = createContext<FarcasterContextType | undefined>(undefined);

export function FarcasterProvider({ children }: { children: ReactNode }) {
  const [sdk, setSdk] = useState<FarcasterSDK | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    initializeSDK();
  }, []);

  const initializeSDK = async () => {
    try {
      setIsLoading(true);
      const farcasterSDK = await initializeFarcasterSDK();
      setSdk(farcasterSDK);

      // Get user from SDK context
      if (farcasterSDK.context.user) {
        const farcasterUser = farcasterSDK.context.user;
        
        try {
          // Try to get more user details from Neynar
          const neynarUser = await neynarClient.getUserByFid(farcasterUser.fid);
          
          // Create or update user in our system
          const userData = {
            fid: farcasterUser.fid,
            username: neynarUser.username || farcasterUser.username || `user${farcasterUser.fid}`,
            displayName: neynarUser.display_name || farcasterUser.displayName || farcasterUser.username || `User ${farcasterUser.fid}`,
            pfpUrl: neynarUser.pfp_url || farcasterUser.pfpUrl,
            followerCount: neynarUser.follower_count || 0
          };

          const response = await apiRequest("POST", "/api/users", userData);
          const savedUser = await response.json();
          setUser(savedUser);
        } catch (neynarError: any) {
          // Suppress expected CSP and network errors in Farcaster iframe environment
          if (!neynarError?.message?.includes('Content Security Policy') && 
              !neynarError?.message?.includes('client.farcaster.xyz') &&
              !neynarError?.message?.includes('404')) {
            console.warn("Failed to fetch from Neynar, using SDK data:", neynarError);
          }
          
          // Fallback to SDK data
          const userData = {
            fid: farcasterUser.fid,
            username: farcasterUser.username || `user${farcasterUser.fid}`,
            displayName: farcasterUser.displayName || farcasterUser.username || `User ${farcasterUser.fid}`,
            pfpUrl: farcasterUser.pfpUrl,
            followerCount: 0
          };

          const response = await apiRequest("POST", "/api/users", userData);
          const savedUser = await response.json();
          setUser(savedUser);
        }
      }

      // Call ready() automatically after successful initialization
      console.log("Farcaster SDK ready");
      await farcasterSDK.actions.ready();
      
      // Cast actions are automatically available through manifest configuration
      console.log("Cast actions available via manifest at /.well-known/farcaster.json");
    } catch (err) {
      console.error("Failed to initialize Farcaster SDK:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  const ready = async () => {
    if (sdk) {
      await sdk.actions.ready();
    }
  };

  return (
    <FarcasterContext.Provider value={{ sdk, user, isLoading, error, ready }}>
      {children}
    </FarcasterContext.Provider>
  );
}

export function useFarcaster() {
  const context = useContext(FarcasterContext);
  if (context === undefined) {
    throw new Error("useFarcaster must be used within a FarcasterProvider");
  }
  return context;
}
