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
  audioMimeType?: string;
  onProgress?: (percentage: number) => void;
  onStatus?: (status: string) => void;
}

export function useCreateConversionJob() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ modelId, audioFile, audioMimeType, onProgress, onStatus }: CreateConversionJobParams) => {
      if (!actor) throw new Error('Actor not available');

      console.log('[Job Pipeline] Starting create-then-complete flow for model:', modelId);

      // Step 1: Fetch the selected model to get its audio URL
      if (onProgress) onProgress(5);
      if (onStatus) onStatus('Fetching voice model...');

      const model = await actor.getVoiceModel(modelId);
      if (!model) {
        throw new Error('Selected voice model not found');
      }

      const modelAudioURL = model.audio.getDirectURL();
      if (!modelAudioURL) {
        throw new Error('Voice model has no valid audio URL');
      }

      console.log('[Job Pipeline] Model fetched, audio URL:', modelAudioURL);

      // Step 2: Create processing job with input audio
      if (onProgress) onProgress(10);
      if (onStatus) onStatus('Uploading input audio...');

      const inputAudioBuffer = new Uint8Array(audioFile.buffer.slice(
        audioFile.byteOffset,
        audioFile.byteOffset + audioFile.byteLength
      )) as Uint8Array<ArrayBuffer>;
      
      const inputBlob = ExternalBlob.fromBytes(inputAudioBuffer).withUploadProgress((percentage) => {
        // Map upload progress to 10-20% range
        const mappedProgress = 10 + (percentage * 0.1);
        if (onProgress) onProgress(Math.round(mappedProgress));
      });

      let jobId: string;
      try {
        jobId = await actor.makeVoiceConversionJob('', modelId, inputBlob);
        console.log('[Job Pipeline] Processing job created:', jobId);
      } catch (error) {
        const cleanMessage = extractActorErrorMessage(error);
        throw new Error(`Failed to create job: ${cleanMessage}`);
      }

      // Invalidate queries so the job appears as processing
      queryClient.invalidateQueries({ queryKey: ['conversionJobs'] });

      // Step 3: Run Replicate conversion
      if (onProgress) onProgress(20);
      if (onStatus) onStatus('Contacting Replicate API...');

      let convertedAudio: Uint8Array;
      try {
        convertedAudio = await convertVoiceWithReplicate(
          audioFile,
          modelAudioURL,
          audioMimeType,
          (replicateStatus) => {
            // Map Replicate status to progress (20-80% range)
            if (replicateStatus === 'starting') {
              if (onProgress) onProgress(25);
              if (onStatus) onStatus('Preparing conversion...');
            } else if (replicateStatus === 'processing') {
              if (onProgress) onProgress(50);
              if (onStatus) onStatus('Converting voice with AI model...');
            } else if (replicateStatus === 'downloading') {
              if (onProgress) onProgress(75);
              if (onStatus) onStatus('Downloading converted audio...');
            } else if (replicateStatus === 'succeeded') {
              if (onProgress) onProgress(80);
              if (onStatus) onStatus('Conversion complete!');
            }
          }
        );
      } catch (error) {
        console.error('[Job Pipeline] Replicate conversion failed:', error);
        // Job remains in processing state; user can retry
        throw error;
      }

      console.log('[Job Pipeline] Replicate conversion succeeded, uploading output...');

      // Step 4: Complete the job with converted output
      if (onProgress) onProgress(85);
      if (onStatus) onStatus('Saving converted audio...');

      const outputAudioBuffer = new Uint8Array(convertedAudio.buffer.slice(
        convertedAudio.byteOffset,
        convertedAudio.byteOffset + convertedAudio.byteLength
      )) as Uint8Array<ArrayBuffer>;
      
      const outputBlob = ExternalBlob.fromBytes(outputAudioBuffer).withUploadProgress((percentage) => {
        // Map upload progress to 85-95% range
        const mappedProgress = 85 + (percentage * 0.1);
        if (onProgress) onProgress(Math.round(mappedProgress));
      });

      try {
        await actor.completeVoiceConversionJob(jobId, outputBlob);
        console.log('[Job Pipeline] Job completed successfully:', jobId);
      } catch (error) {
        console.error('[Job Pipeline] Failed to complete job:', error);
        const cleanMessage = extractActorErrorMessage(error);
        throw new Error(`Failed to save result: ${cleanMessage}`);
      }

      if (onProgress) onProgress(100);
      if (onStatus) onStatus('Complete!');

      return jobId;
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
