import { useGetConversionJobs } from '../hooks/useConversionJobs';
import { useModelNameLookup } from '../hooks/useModelNameLookup';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import InlineAlert from './InlineAlert';
import JobStatusCard from './JobStatusCard';

export default function JobsTable() {
  const { data: jobs, isLoading, error } = useGetConversionJobs();
  const getModelName = useModelNameLookup();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <InlineAlert variant="destructive" message="Failed to load conversion jobs" />;
  }

  if (!jobs || jobs.length === 0) {
    return null;
  }

  // Sort jobs by creation date (newest first)
  const sortedJobs = [...jobs].sort((a, b) => Number(b.createdAt - a.createdAt));

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Your Conversion Jobs</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedJobs.map((job) => (
          <JobStatusCard
            key={job.id.toString()}
            job={job}
            modelName={getModelName(job.modelId)}
          />
        ))}
      </div>
    </div>
  );
}

