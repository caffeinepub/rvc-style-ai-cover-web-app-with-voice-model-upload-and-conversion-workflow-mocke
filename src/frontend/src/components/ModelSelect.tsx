import { useGetVoiceModels } from '../hooks/useVoiceModels';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// Temporary stub type until backend is restored
type VoiceModelId = bigint;

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
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Loading models..." />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  if (!models || models.length === 0) {
    return (
      <div className="space-y-2">
        <Label>Voice Model</Label>
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="No models available" />
          </SelectTrigger>
        </Select>
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
