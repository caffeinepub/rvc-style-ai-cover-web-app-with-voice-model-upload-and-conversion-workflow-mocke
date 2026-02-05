import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, AlertCircle, Loader2, Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { ConversionJob } from '../backend';
import { downloadExternalBlob } from '../utils/downloadExternalBlob';

interface JobStatusCardProps {
  job: ConversionJob;
  modelName?: string;
}

export default function JobStatusCard({ job, modelName }: JobStatusCardProps) {
  const statusConfig = {
    pending: {
      icon: Clock,
      label: 'Pending',
      variant: 'secondary' as const,
      color: 'text-muted-foreground',
      animate: false,
    },
    processing: {
      icon: Loader2,
      label: 'Processing',
      variant: 'default' as const,
      color: 'text-primary',
      animate: true,
    },
    complete: {
      icon: CheckCircle2,
      label: 'Complete',
      variant: 'default' as const,
      color: 'text-primary',
      animate: false,
    },
    failed: {
      icon: AlertCircle,
      label: 'Failed',
      variant: 'destructive' as const,
      color: 'text-destructive',
      animate: false,
    },
  };

  const config = statusConfig[job.status];
  const Icon = config.icon;

  const handleDownload = async () => {
    if (job.resultAudio) {
      await downloadExternalBlob(job.resultAudio, `cover-${job.id}.mp3`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg">Job #{job.id.toString()}</CardTitle>
            <CardDescription>
              {modelName && `Model: ${modelName} • `}
              Created {formatDistanceToNow(new Date(Number(job.createdAt) / 1000000), { addSuffix: true })}
            </CardDescription>
          </div>
          <Badge variant={config.variant} className="flex items-center gap-1 flex-shrink-0">
            <Icon className={`h-3 w-3 ${config.color} ${config.animate ? 'animate-spin' : ''}`} />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Last updated {formatDistanceToNow(new Date(Number(job.updatedAt) / 1000000), { addSuffix: true })}
          </div>

          {job.status === 'complete' && job.resultAudio && (
            <Button onClick={handleDownload} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download Result
            </Button>
          )}

          {job.status === 'failed' && (
            <div className="text-sm text-destructive">
              Conversion failed. Please try again with a different audio file or model.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

