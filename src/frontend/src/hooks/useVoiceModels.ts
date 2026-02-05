import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { toast } from 'sonner';

// Temporary stub types until backend is restored
type VoiceModelId = bigint;
type VoiceModel = {
  id: VoiceModelId;
  owner: string;
  metadata: ModelMetadata;
  createdAt: bigint;
};
type ModelMetadata = {
  name: string;
  description: string;
  format: string;
  trainingData: string[];
  createdAt: bigint;
};

export function useGetVoiceModels() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<VoiceModel[]>({
    queryKey: ['voiceModels'],
    queryFn: async () => {
      // Backend functionality removed - return empty array
      return [];
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
      
      // Backend functionality removed
      throw new Error('Voice model upload is currently unavailable. Backend functionality needs to be restored.');
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
      
      // Backend functionality removed
      throw new Error('Voice model deletion is currently unavailable. Backend functionality needs to be restored.');
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
