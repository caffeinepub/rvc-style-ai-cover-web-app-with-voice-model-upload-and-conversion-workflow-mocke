import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { toast } from 'sonner';
import { ConversionJob, ExternalBlob } from '../backend';
import { extractActorErrorMessage } from '../utils/actorErrorMessage';

export function useGetConversionJobs() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<ConversionJob[]>({
    queryKey: ['conversionJobs'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllConversionJobs();
    },
    enabled: !!actor && !!identity && !actorFetching,
    refetchInterval: (query) => {
      const jobs = query.state.data || [];
      const hasActiveJobs = jobs.some(
        (job) => job.status.__kind__ === 'processing'
      );
      return hasActiveJobs ? 5000 : false;
    },
  });
}

export function useGetConversionJob(jobId: string | null) {
  const { actor } = useActor();

  return useQuery<ConversionJob | null>({
    queryKey: ['conversionJob', jobId],
    queryFn: async () => {
      if (!actor || !jobId) return null;
      return actor.getJob(jobId);
    },
    enabled: !!actor && !!jobId,
  });
}

interface CreateConversionJobParams {
  modelId: string;
  audioFile: Uint8Array;
  onProgress?: (percentage: number) => void;
}

export function useCreateConversionJob() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ modelId, audioFile, onProgress }: CreateConversionJobParams) => {
      if (!actor) throw new Error('Actor not available');

      // Create ExternalBlob with upload progress tracking
      // Cast to Uint8Array<ArrayBuffer> to satisfy type requirements
      const audioBuffer = new Uint8Array(audioFile.buffer.slice(audioFile.byteOffset, audioFile.byteOffset + audioFile.byteLength)) as Uint8Array<ArrayBuffer>;
      let audioBlob = ExternalBlob.fromBytes(audioBuffer);
      if (onProgress) {
        audioBlob = audioBlob.withUploadProgress(onProgress);
      }

      try {
        // Use empty string for sourceVoiceId as it's not used in the current implementation
        return await actor.makeVoiceConversionJob('', modelId, audioBlob);
      } catch (error) {
        // Extract and re-throw with clean error message
        const cleanMessage = extractActorErrorMessage(error);
        throw new Error(cleanMessage);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversionJobs'] });
      toast.success('Conversion job created successfully');
    },
    onError: (error: Error) => {
      const message = extractActorErrorMessage(error);
      toast.error(message);
    },
  });
}
