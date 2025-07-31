import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useFarcaster } from "./use-farcaster";
import { useToast } from "./use-toast";

interface LockStatus {
  isLocked: boolean;
  lockedBy?: string;
  lockedByFid?: number;
  expiresAt?: string;
}

interface StoryLock {
  id: string;
  storyId: string;
  lockedByFid: number;
  lockedAt: string;
  expiresAt: string;
}

export function useStoryLock(storyId: string) {
  const { user: currentUser } = useFarcaster();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLockAcquired, setIsLockAcquired] = useState(false);

  // Check lock status
  const { data: lockStatus, refetch: refetchLockStatus } = useQuery<LockStatus>({
    queryKey: [`/api/stories/${storyId}/lock`],
    refetchInterval: 5000, // Check every 5 seconds
    enabled: !!storyId,
  });

  // Acquire lock mutation
  const acquireLockMutation = useMutation({
    mutationFn: async (): Promise<StoryLock> => {
      if (!currentUser) throw new Error("User not authenticated");
      const response = await apiRequest("POST", `/api/stories/${storyId}/lock`, {
        userFid: currentUser.fid,
      });
      return response.json();
    },
    onSuccess: (lock: StoryLock) => {
      setIsLockAcquired(true);
      queryClient.invalidateQueries({ queryKey: [`/api/stories/${storyId}/lock`] });
      toast({
        title: "Writing Lock Acquired",
        description: "You can now write to this story. Lock expires in 1 minute.",
      });
    },
    onError: (error: any) => {
      if (error.status === 423) {
        toast({
          title: "Story is Being Edited",
          description: `${error.lockedBy} is currently writing. Try again in a moment.`,
          variant: "destructive",
        });
      } else if (error.status === 403) {
        toast({
          title: "Like Required",
          description: "You must like the story before you can write to it.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to Acquire Lock",
          description: "Unable to get writing permission. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  // Release lock mutation
  const releaseLockMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) throw new Error("User not authenticated");
      const response = await apiRequest("DELETE", `/api/stories/${storyId}/lock`, {
        userFid: currentUser.fid,
      });
      return response.json();
    },
    onSuccess: () => {
      setIsLockAcquired(false);
      queryClient.invalidateQueries({ queryKey: [`/api/stories/${storyId}/lock`] });
    },
  });

  const acquireLock = useCallback(() => {
    if (!currentUser) return;
    acquireLockMutation.mutate();
  }, [currentUser, acquireLockMutation]);

  const releaseLock = useCallback(() => {
    if (!currentUser) return;
    releaseLockMutation.mutate();
  }, [currentUser, releaseLockMutation]);

  const isMyLock = lockStatus?.isLocked && lockStatus.lockedByFid === currentUser?.fid;
  const canWrite = isMyLock || isLockAcquired;

  return {
    lockStatus,
    isMyLock,
    canWrite,
    isAcquiring: acquireLockMutation.isPending,
    isReleasing: releaseLockMutation.isPending,
    acquireLock,
    releaseLock,
    refetchLockStatus,
  };
}