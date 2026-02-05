import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { downloadExternalBlob } from '../utils/downloadExternalBlob';

// Temporary stub types until backend is restored
type ConversionJobId = bigint;
type VoiceModelId = bigint;
type ConversionJobStatus = 'pending' | 'processing' | 'failed' | 'complete';
type ConversionJob = {
  id: ConversionJobId;
  owner: string;
  modelId: VoiceModelId;
  status: ConversionJobStatus;
  createdAt: bigint;
  updatedAt: bigint;
};

interface JobStatusCardProps {
  job: ConversionJob;
  modelName?: string;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    variant: 'secondary' as const,
    animate: true,
  },
  processing: {
    label: 'Processing',
    icon: Loader2,
    variant: 'default' as const,
    animate: true,
  },
  complete: {
    label: 'Complete',
    icon: CheckCircle2,
    variant: 'default' as const,
    animate: false,
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    variant: 'destructive' as const,
    animate: false,
  },
};

export default function JobStatusCard({ job, modelName }: JobStatusCardProps) {
  const config = statusConfig[job.status];
  const StatusIcon = config.icon;

  const handleDownload = async () => {
    // Backend functionality removed - no result audio available
    console.log('Download not available - backend functionality removed');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">Job #{job.id.toString()}</CardTitle>
            <CardDescription className="mt-1">
              Model: {modelName || 'Unknown Model'}
            </CardDescription>
          </div>
          <Badge variant={config.variant}>
            <StatusIcon
              className={`mr-1 h-3 w-3 ${config.animate ? 'animate-spin' : ''}`}
            />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Created:</span>
              <span>{new Date(Number(job.createdAt) / 1000000).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Updated:</span>
              <span>{new Date(Number(job.updatedAt) / 1000000).toLocaleString()}</span>
            </div>
          </div>

          {job.status === 'complete' && (
            <Button onClick={handleDownload} className="w-full" disabled>
              <Download className="mr-2 h-4 w-4" />
              Download Result (Unavailable)
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
