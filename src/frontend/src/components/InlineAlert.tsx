import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface InlineAlertProps {
  variant?: 'default' | 'destructive' | 'success' | 'info';
  title?: string;
  message: string;
}

export default function InlineAlert({ variant = 'default', title, message }: InlineAlertProps) {
  const icons = {
    default: Info,
    destructive: AlertCircle,
    success: CheckCircle2,
    info: Info,
  };

  const Icon = icons[variant];
  const alertVariant = variant === 'success' || variant === 'info' ? 'default' : variant;

  return (
    <Alert variant={alertVariant} className={variant === 'success' ? 'border-primary/50 bg-primary/5' : ''}>
      <Icon className="h-4 w-4" />
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

