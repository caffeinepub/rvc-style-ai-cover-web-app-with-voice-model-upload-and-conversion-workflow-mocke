import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { ConversionJob, ConversionJobId, VoiceModelId } from '../backend';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';

export function useGetConversionJobs() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<ConversionJob[]>({
    queryKey: ['conversionJobs'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getConversionJobsByOwner();
    },
    enabled: !!actor && !!identity && !actorFetching,
    refetchInterval: (query) => {
      const jobs = query.state.data;
      if (!jobs) return false;
      
      // Refetch every 3 seconds if there are pending or processing jobs
      const hasActiveJobs = jobs.some(
        (job) => job.status === 'pending' || job.status === 'processing'
      );
      return hasActiveJobs ? 3000 : false;
    },
  });
}

export function useGetConversionJob(jobId: ConversionJobId) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<ConversionJob | null>({
    queryKey: ['conversionJob', jobId.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getConversionJob(jobId);
    },
    enabled: !!actor && !!identity && !actorFetching,
    refetchInterval: (query) => {
      const job = query.state.data;
      if (!job) return false;
      
      // Refetch every 3 seconds if job is pending or processing
      return job.status === 'pending' || job.status === 'processing' ? 3000 : false;
    },
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

      // Cast to Uint8Array<ArrayBuffer> to match backend interface
      const bytes = new Uint8Array(audioFile.buffer.slice(audioFile.byteOffset, audioFile.byteOffset + audioFile.byteLength) as ArrayBuffer);
      let blob = ExternalBlob.fromBytes(bytes);
      if (onProgress) {
        blob = blob.withUploadProgress(onProgress);
      }

      const jobId = await actor.createConversionJob(modelId, blob);
      
      // Automatically trigger processing
      await actor.processConversionJob(jobId);
      
      return jobId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversionJobs'] });
      toast.success('Conversion job created and processing started');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create conversion job');
    },
  });
}

