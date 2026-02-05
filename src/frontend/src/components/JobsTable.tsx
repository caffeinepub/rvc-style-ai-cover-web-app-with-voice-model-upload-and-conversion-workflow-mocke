import { useGetConversionJobs } from '../hooks/useConversionJobs';
import { useModelNameLookup } from '../hooks/useModelNameLookup';
import JobStatusCard from './JobStatusCard';

export default function JobsTable() {
  const { data: jobs, isLoading } = useGetConversionJobs();
  const getModelName = useModelNameLookup();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-48 bg-muted rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return null;
  }

  // Generate unique keys for jobs and sort by creation date (newest first)
  const jobsWithKeys = jobs.map((job, index) => {
    const createdAt = job.status.__kind__ === 'processing'
      ? job.status.processing.uploadTime
      : job.status.completed.uploadTime;
    
    return {
      job,
      key: `${job.targetVoiceId}-${createdAt.toString()}-${index}`,
      createdAt,
    };
  });

  const sortedJobs = [...jobsWithKeys].sort((a, b) => {
    return Number(b.createdAt - a.createdAt);
  });

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Your Jobs</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedJobs.map(({ job, key }) => (
          <JobStatusCard
            key={key}
            job={job}
            jobId={key}
            modelName={getModelName(job.targetVoiceId)}
          />
        ))}
      </div>
    </div>
  );
}
