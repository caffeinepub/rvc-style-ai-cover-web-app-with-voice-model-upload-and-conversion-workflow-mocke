import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { VoiceModel, VoiceModelId, ModelMetadata } from '../backend';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';

export function useGetVoiceModels() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<VoiceModel[]>({
    queryKey: ['voiceModels'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getVoiceModelsByOwner();
    },
    enabled: !!actor && !!identity && !actorFetching,
  });
}

interface UploadVoiceModelParams {
  name: string;
  description: string;
  format: string;
  file: Uint8Array;
  onProgress?: (percentage: number) => void;
}

export function useUploadVoiceModel() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, description, format, file, onProgress }: UploadVoiceModelParams) => {
      if (!actor) throw new Error('Actor not available');

      const metadata: ModelMetadata = {
        name,
        description,
        format,
        trainingData: [],
        createdAt: BigInt(Date.now() * 1000000),
      };

      // Cast to Uint8Array<ArrayBuffer> to match backend interface
      const bytes = new Uint8Array(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer);
      let blob = ExternalBlob.fromBytes(bytes);
      if (onProgress) {
        blob = blob.withUploadProgress(onProgress);
      }

      return actor.uploadVoiceModel(metadata, blob);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voiceModels'] });
      toast.success('Voice model uploaded successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload voice model');
    },
  });
}

export function useDeleteVoiceModel() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (modelId: VoiceModelId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteVoiceModel(modelId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voiceModels'] });
      toast.success('Voice model deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete voice model');
    },
  });
}

