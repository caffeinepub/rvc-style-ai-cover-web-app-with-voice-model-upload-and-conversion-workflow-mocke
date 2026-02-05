import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { downloadExternalBlob } from '../utils/downloadExternalBlob';
import { ConversionJob } from '../backend';
import { useState } from 'react';

interface JobStatusCardProps {
  job: ConversionJob;
  jobId: string;
  modelName?: string;
}

export default function JobStatusCard({ job, jobId, modelName }: JobStatusCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  
  const isProcessing = job.status.__kind__ === 'processing';
  const isComplete = job.status.__kind__ === 'completed';

  const statusConfig = isProcessing
    ? {
        label: 'Processing',
        icon: Loader2,
        variant: 'default' as const,
        animate: true,
      }
    : {
        label: 'Complete',
        icon: CheckCircle2,
        variant: 'default' as const,
        animate: false,
      };

  const StatusIcon = statusConfig.icon;

  const handleDownload = async () => {
    if (!isComplete || job.status.__kind__ !== 'completed') {
      return;
    }

    try {
      setIsDownloading(true);
      const resultBlob = job.status.completed.blob;
      await downloadExternalBlob(resultBlob, `converted-audio-${jobId}.mp3`);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Use type narrowing to safely access the correct status fields
  const createdAt = job.status.__kind__ === 'processing'
    ? job.status.processing.uploadTime
    : job.status.completed.uploadTime;

  const updatedAt = job.status.__kind__ === 'completed'
    ? job.status.completed.processingTime
    : createdAt;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">Job #{jobId.slice(0, 8)}...</CardTitle>
            <CardDescription className="mt-1">
              Model: {modelName || 'Unknown Model'}
            </CardDescription>
          </div>
          <Badge variant={statusConfig.variant}>
            <StatusIcon
              className={`mr-1 h-3 w-3 ${statusConfig.animate ? 'animate-spin' : ''}`}
            />
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Created:</span>
              <span>{new Date(Number(createdAt) / 1000000).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Updated:</span>
              <span>{new Date(Number(updatedAt) / 1000000).toLocaleString()}</span>
            </div>
          </div>

          {isComplete && (
            <Button 
              onClick={handleDownload} 
              className="w-full" 
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download Result
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
