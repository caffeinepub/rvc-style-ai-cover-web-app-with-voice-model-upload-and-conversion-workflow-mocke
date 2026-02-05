import AuthGate from '../components/AuthGate';
import VoiceModelUploadForm from '../components/VoiceModelUploadForm';
import VoiceModelsList from '../components/VoiceModelsList';
import EmptyStateHero from '../components/EmptyStateHero';
import { useGetVoiceModels } from '../hooks/useVoiceModels';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

export default function VoiceModelsPage() {
  const { identity } = useInternetIdentity();
  const { data: models, isLoading } = useGetVoiceModels();

  const isAuthenticated = !!identity;
  const hasModels = models && models.length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Voice Models</h1>
        <p className="text-muted-foreground">
          Upload and manage your voice models for creating AI covers
        </p>
      </div>

      <AuthGate>
        <div className="grid gap-8 lg:grid-cols-2">
          <VoiceModelUploadForm />
          <div className="lg:col-span-2">
            {!isLoading && !hasModels ? (
              <EmptyStateHero
                title="No Voice Models Yet"
                description="Upload your first voice model to start creating AI covers. Models can be in PTH, ONNX, or other supported formats."
                imageSrc="/assets/generated/studio-illustration.dim_1600x900.png"
              />
            ) : (
              <VoiceModelsList />
            )}
          </div>
        </div>
      </AuthGate>
    </div>
  );
}

