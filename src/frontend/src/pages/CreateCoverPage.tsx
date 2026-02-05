import { useGetVoiceModels } from '../hooks/useVoiceModels';
import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import AudioUploadAndSubmit from '../components/AudioUploadAndSubmit';
import AppLayout from '../components/AppLayout';
import AuthGate from '../components/AuthGate';
import ReplicateTokenCard from '../components/ReplicateTokenCard';
import { isReplicateConfigured } from '../services/voiceConversion';
import { useReplicateToken } from '../hooks/useReplicateToken';

export default function CreateCoverPage() {
  const { data: models, isLoading } = useGetVoiceModels();
  const navigate = useNavigate();
  const currentToken = useReplicateToken();
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
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Create AI Cover</h1>
            <p className="text-muted-foreground">
              Upload an audio file and select a voice model to create your AI cover
            </p>
          </div>

          {!replicateConfigured && (
            <ReplicateTokenCard currentToken={currentToken} />
          )}

          <AudioUploadAndSubmit />
        </div>
      </AuthGate>
    </AppLayout>
  );
}
