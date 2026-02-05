import { useGetVoiceModels } from '../hooks/useVoiceModels';
import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import AudioUploadAndSubmit from '../components/AudioUploadAndSubmit';
import AppLayout from '../components/AppLayout';
import AuthGate from '../components/AuthGate';
import InlineAlert from '../components/InlineAlert';
import { isReplicateConfigured } from '../services/voiceConversion';

export default function CreateCoverPage() {
  const { data: models, isLoading } = useGetVoiceModels();
  const navigate = useNavigate();
  const replicateConfigured = isReplicateConfigured();

  const hasModels = models && models.length > 0;

  useEffect(() => {
    if (!isLoading && !hasModels) {
      navigate({ to: '/models' });
    }
  }, [isLoading, hasModels, navigate]);

  if (isLoading) {
    return (
      <AppLayout>
        <AuthGate>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </AuthGate>
      </AppLayout>
    );
  }

  if (!hasModels) {
    return null;
  }

  return (
    <AppLayout>
      <AuthGate>
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Create AI Cover</h1>
            <p className="text-muted-foreground">
              Upload an audio file and select a voice model to create your AI cover
            </p>
          </div>

          {!replicateConfigured && (
            <InlineAlert
              variant="info"
              message="To enable AI cover creation, add your Replicate API token to the .env file as VITE_REPLICATE_API_TOKEN. You can get a token from replicate.com."
              className="mb-6"
            />
          )}

          <AudioUploadAndSubmit />
        </div>
      </AuthGate>
    </AppLayout>
  );
}
