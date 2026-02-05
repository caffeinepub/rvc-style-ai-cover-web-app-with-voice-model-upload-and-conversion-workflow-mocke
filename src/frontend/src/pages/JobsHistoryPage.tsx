import AuthGate from '../components/AuthGate';
import JobsTable from '../components/JobsTable';
import EmptyStateHero from '../components/EmptyStateHero';
import { useGetConversionJobs } from '../hooks/useConversionJobs';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';

export default function JobsHistoryPage() {
  const { identity } = useInternetIdentity();
  const { data: jobs, isLoading } = useGetConversionJobs();
  const navigate = useNavigate();

  const isAuthenticated = !!identity;
  const hasJobs = jobs && jobs.length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Conversion Jobs</h1>
        <p className="text-muted-foreground">
          View and manage your AI cover conversion history
        </p>
      </div>

      <AuthGate>
        {!isLoading && !hasJobs ? (
          <EmptyStateHero
            title="No Conversion Jobs Yet"
            description="You haven't created any AI covers yet. Upload a voice model and create your first cover to get started."
            imageSrc="/assets/generated/rvc-icons-set.dim_512x512.png"
            action={
              <Button onClick={() => navigate({ to: '/create' })}>
                Create Your First Cover
              </Button>
            }
          />
        ) : (
          <JobsTable />
        )}
      </AuthGate>
    </div>
  );
}

