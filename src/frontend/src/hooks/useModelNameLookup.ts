import { useGetVoiceModels } from './useVoiceModels';
import type { VoiceModelId } from '../backend';

export function useModelNameLookup() {
  const { data: models } = useGetVoiceModels();

  return (modelId: VoiceModelId): string => {
    if (!models) return 'Unknown Model';
    const model = models.find((m) => m.id === modelId);
    return model?.metadata.name || 'Unknown Model';
  };
}

