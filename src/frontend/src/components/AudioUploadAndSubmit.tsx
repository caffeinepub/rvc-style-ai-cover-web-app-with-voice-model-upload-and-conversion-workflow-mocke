import { useState } from 'react';
import { useCreateConversionJob } from '../hooks/useConversionJobs';
import ModelSelect from './ModelSelect';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Music, Loader2 } from 'lucide-react';
import InlineAlert from './InlineAlert';
import { fileToBytes } from '../utils/fileToBytes';
import { extractActorErrorMessage } from '../utils/actorErrorMessage';

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
      // Clear any previous mutation errors when user changes file
      if (createJobMutation.isError) {
        createJobMutation.reset();
      }
    }
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId);
    setError(null);
    // Clear any previous mutation errors when user changes model
    if (createJobMutation.isError) {
      createJobMutation.reset();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUploadProgress(0);

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
        modelId: selectedModelId,
        audioFile: bytes,
        onProgress: setUploadProgress,
      });

      // Reset form on success
      setSelectedModelId('');
      setAudioFile(null);
      setUploadProgress(0);

      // Reset file input
      const fileInput = document.getElementById('audio-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: unknown) {
      // Extract clean error message from backend
      const cleanMessage = extractActorErrorMessage(err);
      setError(cleanMessage);
      // Reset upload progress on error so user can retry
      setUploadProgress(0);
    }
  };

  const isProcessing = createJobMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Audio</CardTitle>
        <CardDescription>
          Select a voice model and upload an audio file to create an AI cover
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ModelSelect
            value={selectedModelId}
            onChange={handleModelChange}
            disabled={isProcessing}
          />

          <div className="space-y-2">
            <Label htmlFor="audio-file">Audio File *</Label>
            <Input
              id="audio-file"
              type="file"
              onChange={handleFileChange}
              disabled={isProcessing}
              accept="audio/*,.mp3,.wav,.flac,.m4a,.ogg"
            />
            {audioFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {isProcessing && uploadProgress > 0 && (
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
              message="Conversion job created! Check the Jobs page to track progress."
            />
          )}

          <Button type="submit" disabled={isProcessing} className="w-full">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Job...
              </>
            ) : (
              <>
                <Music className="mr-2 h-4 w-4" />
                Create AI Cover
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
