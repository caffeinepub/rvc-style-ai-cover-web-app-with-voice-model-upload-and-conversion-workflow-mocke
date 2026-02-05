import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { toast } from 'sonner';
import { VoiceModelWithId, ExternalBlob } from '../backend';

export function useGetVoiceModels() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<VoiceModelWithId[]>({
    queryKey: ['voiceModels'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOwnVoiceModelsWithIds();
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
      
      // Create ExternalBlob with upload progress tracking
      // Cast to Uint8Array<ArrayBuffer> to satisfy type requirements
      const fileBuffer = new Uint8Array(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength)) as Uint8Array<ArrayBuffer>;
      let voiceBlob = ExternalBlob.fromBytes(fileBuffer);
      if (onProgress) {
        voiceBlob = voiceBlob.withUploadProgress(onProgress);
      }
      
      return actor.uploadNewVoiceModel(name, description, voiceBlob);
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
    mutationFn: async (modelId: string) => {
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
