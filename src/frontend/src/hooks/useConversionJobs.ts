import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { toast } from 'sonner';

// Temporary stub types until backend is restored
type ConversionJobId = bigint;
type VoiceModelId = bigint;
type ConversionJobStatus = 'pending' | 'processing' | 'failed' | 'complete';
type ConversionJob = {
  id: ConversionJobId;
  owner: string;
  modelId: VoiceModelId;
  status: ConversionJobStatus;
  createdAt: bigint;
  updatedAt: bigint;
};

export function useGetConversionJobs() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<ConversionJob[]>({
    queryKey: ['conversionJobs'],
    queryFn: async () => {
      // Backend functionality removed - return empty array
      return [];
    },
    enabled: !!actor && !!identity && !actorFetching,
    refetchInterval: (query) => {
      const jobs = query.state.data || [];
      const hasActiveJobs = jobs.some(
        (job) => job.status === 'pending' || job.status === 'processing'
      );
      return hasActiveJobs ? 5000 : false;
    },
  });
}

export function useGetConversionJob(jobId: ConversionJobId | null) {
  const { actor } = useActor();

  return useQuery<ConversionJob | null>({
    queryKey: ['conversionJob', jobId?.toString()],
    queryFn: async () => {
      // Backend functionality removed
      return null;
    },
    enabled: !!actor && !!jobId,
  });
}

interface CreateConversionJobParams {
  modelId: VoiceModelId;
  audioFile: Uint8Array;
  onProgress?: (percentage: number) => void;
}

export function useCreateConversionJob() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ modelId, audioFile, onProgress }: CreateConversionJobParams) => {
      if (!actor) throw new Error('Actor not available');

      // Backend functionality removed
      throw new Error('Conversion job creation is currently unavailable. Backend functionality needs to be restored.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversionJobs'] });
      toast.success('Conversion job created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create conversion job');
    },
  });
}
