import AuthGate from '../components/AuthGate';
import AudioUploadAndSubmit from '../components/AudioUploadAndSubmit';
import EmptyStateHero from '../components/EmptyStateHero';
import { useGetVoiceModels } from '../hooks/useVoiceModels';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';

export default function CreateCoverPage() {
  const { identity } = useInternetIdentity();
  const { data: models, isLoading } = useGetVoiceModels();
  const navigate = useNavigate();

  const isAuthenticated = !!identity;
  const hasModels = models && models.length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Create AI Cover</h1>
        <p className="text-muted-foreground">
          Transform any song with your voice models
        </p>
      </div>

      <AuthGate>
        {!isLoading && !hasModels ? (
          <EmptyStateHero
            title="No Voice Models Available"
            description="You need to upload at least one voice model before you can create AI covers. Upload a model to get started."
            imageSrc="/assets/generated/rvc-icons-set.dim_512x512.png"
            action={
              <Button onClick={() => navigate({ to: '/models' })}>
                Go to Voice Models
              </Button>
            }
          />
        ) : (
          <div className="max-w-2xl mx-auto">
            <AudioUploadAndSubmit />
          </div>
        )}
      </AuthGate>
    </div>
  );
}

