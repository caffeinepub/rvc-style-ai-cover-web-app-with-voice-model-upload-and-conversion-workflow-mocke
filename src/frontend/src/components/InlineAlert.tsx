import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

interface InlineAlertProps {
  variant: 'success' | 'error' | 'info' | 'destructive';
  message: string;
  className?: string;
}

export default function InlineAlert({ variant, message, className = '' }: InlineAlertProps) {
  const styles = {
    success: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900 text-green-800 dark:text-green-200',
    error: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900 text-red-800 dark:text-red-200',
    info: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-200',
    destructive: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900 text-red-800 dark:text-red-200',
  };

  const icons = {
    success: <CheckCircle className="h-5 w-5 flex-shrink-0" />,
    error: <XCircle className="h-5 w-5 flex-shrink-0" />,
    info: <Info className="h-5 w-5 flex-shrink-0" />,
    destructive: <AlertCircle className="h-5 w-5 flex-shrink-0" />,
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${styles[variant]} ${className}`}>
      {icons[variant]}
      <p className="text-sm flex-1">{message}</p>
    </div>
  );
}
