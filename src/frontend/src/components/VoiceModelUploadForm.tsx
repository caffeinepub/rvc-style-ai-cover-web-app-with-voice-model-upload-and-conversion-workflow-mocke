import { useState } from 'react';
import { useUploadVoiceModel } from '../hooks/useVoiceModels';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Upload, Loader2 } from 'lucide-react';
import InlineAlert from './InlineAlert';
import { fileToBytes } from '../utils/fileToBytes';

export default function VoiceModelUploadForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadMutation = useUploadVoiceModel();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter a model name');
      return;
    }

    if (!file) {
      setError('Please select a model file');
      return;
    }

    try {
      const bytes = await fileToBytes(file);
      await uploadMutation.mutateAsync({
        name: name.trim(),
        description: description.trim(),
        format: format.trim() || file.name.split('.').pop() || 'unknown',
        file: bytes,
        onProgress: setUploadProgress,
      });

      // Reset form
      setName('');
      setDescription('');
      setFormat('');
      setFile(null);
      setUploadProgress(0);
      
      // Reset file input
      const fileInput = document.getElementById('model-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      setError(err.message || 'Failed to upload model');
    }
  };

  const isUploading = uploadMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Voice Model</CardTitle>
        <CardDescription>
          Upload a voice model file to use for creating AI covers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="model-name">Model Name *</Label>
            <Input
              id="model-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Voice Model"
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model-description">Description</Label>
            <Textarea
              id="model-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your voice model..."
              rows={3}
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model-format">Format</Label>
            <Input
              id="model-format"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              placeholder="e.g., pth, onnx, zip (optional)"
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model-file">Model File *</Label>
            <Input
              id="model-file"
              type="file"
              onChange={handleFileChange}
              disabled={isUploading}
              accept=".pth,.onnx,.pt,.bin,.zip"
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {isUploading && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {error && <InlineAlert variant="destructive" message={error} />}

          {uploadMutation.isSuccess && (
            <InlineAlert variant="success" message="Model uploaded successfully!" />
          )}

          <Button type="submit" disabled={isUploading} className="w-full">
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Model
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
