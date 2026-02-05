import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Key, Loader2, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { saveToken, clearToken } from '../services/replicateToken';
import { validateReplicateToken } from '../services/replicateValidation';
import InlineAlert from './InlineAlert';

interface ReplicateTokenCardProps {
  currentToken: string | null;
}

export default function ReplicateTokenCard({ currentToken }: ReplicateTokenCardProps) {
  const [tokenInput, setTokenInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; error?: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const hasToken = !!currentToken;

  const handleTestToken = async () => {
    if (!tokenInput.trim()) {
      setValidationResult({ valid: false, error: 'Please enter a token' });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const result = await validateReplicateToken(tokenInput);
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveToken = async () => {
    if (!tokenInput.trim()) {
      setValidationResult({ valid: false, error: 'Please enter a token' });
      return;
    }

    setIsSaving(true);
    try {
      saveToken(tokenInput);
      setTokenInput('');
      setValidationResult(null);
    } catch (error) {
      setValidationResult({
        valid: false,
        error: error instanceof Error ? error.message : 'Failed to save token',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearToken = () => {
    clearToken();
    setTokenInput('');
    setValidationResult(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5 text-primary" />
          Replicate API Configuration
        </CardTitle>
        <CardDescription>
          Configure your Replicate API token for AI voice conversion. Your token is stored securely in your browser and is never uploaded to our servers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasToken ? (
          <div className="space-y-4">
            <InlineAlert
              variant="success"
              message="API token is configured and ready to use."
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={handleClearToken}
                className="w-full"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Token
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Note: Your token is stored only in your browser's local storage and is not sent to our backend.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <InlineAlert
              variant="info"
              message="To enable AI cover creation, enter your Replicate API token below. Get one from replicate.com."
            />

            <div className="space-y-2">
              <Label htmlFor="token-input">Replicate API Token</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="token-input"
                    type={showToken ? 'text' : 'password'}
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="r8_..."
                    disabled={isValidating || isSaving}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowToken(!showToken)}
                    disabled={isValidating || isSaving}
                  >
                    {showToken ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {validationResult && (
              <InlineAlert
                variant={validationResult.valid ? 'success' : 'destructive'}
                message={
                  validationResult.valid
                    ? 'Token is valid! Click "Save Token" to use it.'
                    : validationResult.error || 'Token validation failed'
                }
              />
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestToken}
                disabled={isValidating || isSaving || !tokenInput.trim()}
                className="flex-1"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : validationResult?.valid ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Valid
                  </>
                ) : validationResult?.valid === false ? (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Test Token
                  </>
                ) : (
                  'Test Token'
                )}
              </Button>
              <Button
                type="button"
                onClick={handleSaveToken}
                disabled={isValidating || isSaving || !tokenInput.trim()}
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Token'
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Your token is stored only in your browser's local storage and is never sent to our backend. It's used directly by your browser to call the Replicate API.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
