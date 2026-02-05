import { useGetVoiceModels } from '../hooks/useVoiceModels';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { VoiceModelId } from '../backend';

interface ModelSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function ModelSelect({ value, onChange, disabled }: ModelSelectProps) {
  const { data: models, isLoading } = useGetVoiceModels();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Voice Model</Label>
        <div className="flex items-center gap-2 h-10 px-3 py-2 border border-input rounded-md bg-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading models...</span>
        </div>
      </div>
    );
  }

  if (!models || models.length === 0) {
    return (
      <div className="space-y-2">
        <Label>Voice Model</Label>
        <div className="h-10 px-3 py-2 border border-input rounded-md bg-muted flex items-center">
          <span className="text-sm text-muted-foreground">No models available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="model-select">Voice Model *</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="model-select">
          <SelectValue placeholder="Select a voice model" />
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.id.toString()} value={model.id.toString()}>
              {model.metadata.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

