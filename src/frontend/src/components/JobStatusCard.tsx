import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle2, Loader2, Play, Square } from 'lucide-react';
import { downloadExternalBlob } from '../utils/downloadExternalBlob';
import { ConversionJob } from '../backend';
import { useState, useEffect } from 'react';
import InlineAlert from './InlineAlert';

interface JobStatusCardProps {
  job: ConversionJob;
  jobId: string;
  modelName?: string;
}

export default function JobStatusCard({ job, jobId, modelName }: JobStatusCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [audioObjectURL, setAudioObjectURL] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  
  const isProcessing = job.status.__kind__ === 'processing';
  const isComplete = job.status.__kind__ === 'completed';

  // Cleanup audio and object URL on unmount or when audio changes
  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
      if (audioObjectURL) {
        URL.revokeObjectURL(audioObjectURL);
      }
    };
  }, [audio, audioObjectURL]);

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
      await downloadExternalBlob(resultBlob, `ai-cover-${jobId.slice(0, 8)}.mp3`);
    } catch (error) {
      console.error('Download failed:', error);
      setPlaybackError('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePlayPreview = async () => {
    if (!isComplete || job.status.__kind__ !== 'completed') {
      return;
    }

    setPlaybackError(null);

    try {
      // If already playing, stop it
      if (isPlaying && audio) {
        audio.pause();
        audio.currentTime = 0;
        setIsPlaying(false);
        return;
      }

      // Clean up previous audio if exists
      if (audio) {
        audio.pause();
        audio.src = '';
      }
      if (audioObjectURL) {
        URL.revokeObjectURL(audioObjectURL);
      }

      // Download the audio bytes and create a Blob URL
      const resultBlob = job.status.completed.blob;
      const bytes = await resultBlob.getBytes();
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      const objectURL = URL.createObjectURL(blob);
      
      setAudioObjectURL(objectURL);

      // Create and play audio
      const newAudio = new Audio(objectURL);
      
      newAudio.onended = () => {
        setIsPlaying(false);
      };
      
      newAudio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setPlaybackError('Failed to play audio. The file may be corrupted.');
        setIsPlaying(false);
      };

      await newAudio.play();
      setAudio(newAudio);
      setIsPlaying(true);
    } catch (error) {
      console.error('Playback failed:', error);
      setPlaybackError('Failed to load audio for preview. Please try downloading instead.');
      setIsPlaying(false);
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
            <CardTitle className="text-lg">AI Cover #{jobId.slice(0, 8)}...</CardTitle>
            <CardDescription className="mt-1">
              Voice Model: {modelName || 'Unknown Model'}
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

          {playbackError && (
            <InlineAlert variant="destructive" message={playbackError} />
          )}

          {isComplete && (
            <div className="flex gap-2">
              <Button 
                onClick={handlePlayPreview} 
                variant="outline"
                className="flex-1"
              >
                {isPlaying ? (
                  <>
                    <Square className="mr-2 h-4 w-4" />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Preview
                  </>
                )}
              </Button>
              <Button 
                onClick={handleDownload} 
                className="flex-1" 
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
                    Download
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
