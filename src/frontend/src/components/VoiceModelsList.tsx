import { useGetVoiceModels, useDeleteVoiceModel } from '../hooks/useVoiceModels';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2, Music, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import InlineAlert from './InlineAlert';

export default function VoiceModelsList() {
  const { data: models, isLoading, error } = useGetVoiceModels();
  const deleteMutation = useDeleteVoiceModel();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <InlineAlert variant="destructive" message="Failed to load voice models" />;
  }

  if (!models || models.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Your Voice Models</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {models.map((model) => (
          <Card key={model.id.toString()} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Music className="h-5 w-5 text-primary flex-shrink-0" />
                  <CardTitle className="text-lg truncate">{model.metadata.name}</CardTitle>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Voice Model</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{model.metadata.name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate(model.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              {model.metadata.description && (
                <CardDescription className="line-clamp-2">{model.metadata.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <Badge variant="secondary">{model.metadata.format}</Badge>
                <span className="text-muted-foreground">
                  {formatDistanceToNow(new Date(Number(model.createdAt) / 1000000), { addSuffix: true })}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

