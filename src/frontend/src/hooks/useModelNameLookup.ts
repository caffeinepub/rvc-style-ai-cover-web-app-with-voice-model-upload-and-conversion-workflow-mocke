import { useGetVoiceModels } from './useVoiceModels';

export function useModelNameLookup() {
  const { data: models } = useGetVoiceModels();

  return (modelId: string): string => {
    if (!models) return 'Unknown Model';
    const modelWithId = models.find((m) => m.id === modelId);
    return modelWithId?.model.name || 'Unknown Model';
  };
}
