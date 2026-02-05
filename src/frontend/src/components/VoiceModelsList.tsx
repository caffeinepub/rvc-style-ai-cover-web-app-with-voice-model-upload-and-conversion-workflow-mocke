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
import { Trash2, Calendar } from 'lucide-react';

export default function VoiceModelsList() {
  const { data: models, isLoading } = useGetVoiceModels();
  const deleteMutation = useDeleteVoiceModel();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-full" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (!models || models.length === 0) {
    return null;
  }

  const handleDelete = async (modelId: string) => {
    await deleteMutation.mutateAsync(modelId);
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Your Models</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {models.map((modelWithId) => (
          <Card key={modelWithId.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{modelWithId.model.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {modelWithId.model.description || 'No description'}
                  </CardDescription>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Voice Model</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{modelWithId.model.name}"? This action cannot be
                        undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(modelWithId.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {new Date(Number(modelWithId.model.snapshotTime) / 1000000).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
