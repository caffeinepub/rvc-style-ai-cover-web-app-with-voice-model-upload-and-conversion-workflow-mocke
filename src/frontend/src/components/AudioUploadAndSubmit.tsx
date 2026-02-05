import { useState } from 'react';
import { useCreateConversionJob } from '../hooks/useConversionJobs';
import ModelSelect from './ModelSelect';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Music, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import InlineAlert from './InlineAlert';
import { fileToBytes } from '../utils/fileToBytes';
import { isReplicateConfigured } from '../services/voiceConversion';

export default function AudioUploadAndSubmit() {
  const [selectedModelId, setSelectedModelId] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  const createJobMutation = useCreateConversionJob();
  const replicateConfigured = isReplicateConfigured();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setError(null);
      setProcessingStatus('');
      setUploadProgress(0);
      if (createJobMutation.isError) {
        createJobMutation.reset();
      }
    }
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId);
    setError(null);
    setProcessingStatus('');
    setUploadProgress(0);
    if (createJobMutation.isError) {
      createJobMutation.reset();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUploadProgress(0);
    setProcessingStatus('');

    // Preflight check for Replicate token
    if (!replicateConfigured) {
      setError('Replicate API token is not configured. Please add VITE_REPLICATE_API_TOKEN to your .env file to enable AI voice conversion.');
      return;
    }

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
      
      // Pass the file's MIME type (with fallback)
      const mimeType = audioFile.type || 'application/octet-stream';
      
      await createJobMutation.mutateAsync({
        modelId: selectedModelId,
        audioFile: bytes,
        audioMimeType: mimeType,
        onProgress: (percentage) => {
          setUploadProgress(percentage);
        },
        onStatus: (status) => {
          setProcessingStatus(status);
        },
      });

      // Reset form on success
      setSelectedModelId('');
      setAudioFile(null);
      setUploadProgress(0);
      setProcessingStatus('');

      // Reset file input
      const fileInput = document.getElementById('audio-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Voice conversion failed';
      setError(errorMessage);
      setUploadProgress(0);
      setProcessingStatus('');
    }
  };

  const isProcessing = createJobMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Upload Audio
        </CardTitle>
        <CardDescription>
          Select a voice model and upload an audio file to create an AI cover with voice conversion
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!replicateConfigured && (
          <InlineAlert
            variant="destructive"
            message="AI cover creation requires a Replicate API token. Please add VITE_REPLICATE_API_TOKEN to your .env file."
            className="mb-4"
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <ModelSelect
            value={selectedModelId}
            onChange={handleModelChange}
            disabled={isProcessing || !replicateConfigured}
          />

          <div className="space-y-2">
            <Label htmlFor="audio-file">Audio File *</Label>
            <Input
              id="audio-file"
              type="file"
              onChange={handleFileChange}
              disabled={isProcessing || !replicateConfigured}
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
                <span className="text-muted-foreground">{processingStatus}</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {error && <InlineAlert variant="destructive" message={error} />}

          {createJobMutation.isSuccess && (
            <InlineAlert
              variant="success"
              message="AI voice conversion completed! Check the Jobs page to preview and download your cover."
            />
          )}

          <Button type="submit" disabled={isProcessing || !replicateConfigured} className="w-full">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Converting Voice...
              </>
            ) : !replicateConfigured ? (
              <>
                <AlertCircle className="mr-2 h-4 w-4" />
                API Token Required
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
