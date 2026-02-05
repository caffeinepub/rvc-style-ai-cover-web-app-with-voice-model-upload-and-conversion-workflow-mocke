import { useGetVoiceModels } from './useVoiceModels';

// Temporary stub type until backend is restored
type VoiceModelId = bigint;

export function useModelNameLookup() {
  const { data: models } = useGetVoiceModels();

  return (modelId: VoiceModelId): string => {
    if (!models) return 'Unknown Model';
    const model = models.find((m) => m.id === modelId);
    return model?.metadata.name || 'Unknown Model';
  };
}
