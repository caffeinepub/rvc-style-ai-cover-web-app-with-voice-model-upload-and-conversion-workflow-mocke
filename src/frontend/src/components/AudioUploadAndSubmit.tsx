import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, Loader2 } from 'lucide-react';
import InlineAlert from './InlineAlert';
import ModelSelect from './ModelSelect';
import { useCreateConversionJob } from '../hooks/useConversionJobs';
import { fileToBytes } from '../utils/fileToBytes';

export default function AudioUploadAndSubmit() {
  const [selectedModelId, setSelectedModelId] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const createJobMutation = useCreateConversionJob();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedModelId) {
      setError('Please select a voice model');
      return;
    }

    if (!audioFile) {
      setError('Please select an audio file');
      return;
    }

    try {
      const bytes = await fileToBytes(audioFile);
      await createJobMutation.mutateAsync({
        modelId: BigInt(selectedModelId),
        audioFile: bytes,
        onProgress: setUploadProgress,
      });

      // Reset form
      setSelectedModelId('');
      setAudioFile(null);
      setUploadProgress(0);
      
      const fileInput = document.getElementById('audio-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      setError(err.message || 'Failed to create conversion job');
    }
  };

  const isSubmitting = createJobMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create AI Cover</CardTitle>
        <CardDescription>
          Select a voice model and upload your source audio to create an AI cover
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ModelSelect
            value={selectedModelId}
            onChange={setSelectedModelId}
            disabled={isSubmitting}
          />

          <div className="space-y-2">
            <Label htmlFor="audio-file">Source Audio *</Label>
            <Input
              id="audio-file"
              type="file"
              onChange={handleFileChange}
              disabled={isSubmitting}
              accept="audio/*,.mp3,.wav,.flac,.m4a,.ogg"
            />
            {audioFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {isSubmitting && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {error && <InlineAlert variant="destructive" message={error} />}

          {createJobMutation.isSuccess && (
            <InlineAlert
              variant="success"
              message="Conversion job created! Processing will begin shortly. Check the Jobs page for status."
            />
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Job...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Create Cover
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

