import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { toast } from 'sonner';
import { ConversionJob, ExternalBlob } from '../backend';
import { extractActorErrorMessage } from '../utils/actorErrorMessage';
import { convertVoiceWithReplicate } from '../services/voiceConversion';

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
  onStatus?: (status: string) => void;
}

export function useCreateConversionJob() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ modelId, audioFile, onProgress, onStatus }: CreateConversionJobParams) => {
      if (!actor) throw new Error('Actor not available');

      // Step 1: Fetch the selected model to get its audio URL
      if (onProgress) onProgress(5);
      if (onStatus) onStatus('Fetching voice model...');

      const model = await actor.getVoiceModel(modelId);
      if (!model) {
        throw new Error('Selected voice model not found');
      }

      // Get the direct URL for the model audio
      const modelAudioURL = model.audio.getDirectURL();
      if (!modelAudioURL) {
        throw new Error('Voice model has no valid audio URL');
      }

      // Step 2: Perform actual AI voice conversion using Replicate API
      if (onProgress) onProgress(10);
      if (onStatus) onStatus('Starting AI conversion...');

      const convertedAudio = await convertVoiceWithReplicate(
        audioFile,
        modelAudioURL,
        (replicateStatus) => {
          // Map Replicate status to progress and user-facing messages
          if (replicateStatus === 'starting') {
            if (onProgress) onProgress(20);
            if (onStatus) onStatus('Preparing conversion...');
          } else if (replicateStatus === 'processing') {
            if (onProgress) onProgress(50);
            if (onStatus) onStatus('Converting voice with AI model...');
          } else if (replicateStatus === 'downloading') {
            if (onProgress) onProgress(75);
            if (onStatus) onStatus('Downloading converted audio...');
          } else if (replicateStatus === 'succeeded') {
            if (onProgress) onProgress(85);
            if (onStatus) onStatus('Finalizing...');
          }
        }
      );

      if (onProgress) onProgress(90);
      if (onStatus) onStatus('Saving to backend...');

      // Step 3: Create ExternalBlob with the converted audio
      const audioBuffer = new Uint8Array(convertedAudio.buffer.slice(
        convertedAudio.byteOffset,
        convertedAudio.byteOffset + convertedAudio.byteLength
      )) as Uint8Array<ArrayBuffer>;
      
      const audioBlob = ExternalBlob.fromBytes(audioBuffer);

      // Step 4: Save the job to backend with converted audio
      try {
        const jobId = await actor.makeVoiceConversionJob('', modelId, audioBlob);
        
        if (onProgress) onProgress(100);
        if (onStatus) onStatus('Complete!');
        
        return jobId;
      } catch (error) {
        // Extract and re-throw with clean error message
        const cleanMessage = extractActorErrorMessage(error);
        throw new Error(cleanMessage);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversionJobs'] });
      toast.success('AI voice conversion completed successfully!');
    },
    onError: (error: Error) => {
      const message = error.message || 'Voice conversion failed';
      toast.error(message);
    },
  });
}
