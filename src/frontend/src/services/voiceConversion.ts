// Client-side voice conversion using Replicate API
// This handles the actual AI voice conversion since the backend cannot call external APIs

const REPLICATE_API_TOKEN = import.meta.env.VITE_REPLICATE_API_TOKEN || '';

interface ReplicateResponse {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string | string[];
  error?: string;
}

/**
 * Check if Replicate API token is configured
 */
export function isReplicateConfigured(): boolean {
  const token = REPLICATE_API_TOKEN.trim();
  return token.length > 0;
}

/**
 * Convert audio bytes to a data URL safely without stack overflow
 */
function bytesToDataURL(bytes: Uint8Array, mimeType: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const safeBytes = new Uint8Array(bytes);
    const blob = new Blob([safeBytes], { type: mimeType });
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert bytes to data URL'));
      }
    };
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Extract audio URL from Replicate output (handles string or array)
 */
function extractAudioURL(output: string | string[] | undefined): string {
  if (!output) {
    throw new Error('No output from Replicate');
  }
  
  if (typeof output === 'string') {
    return output;
  }
  
  if (Array.isArray(output) && output.length > 0) {
    return output[0];
  }
  
  throw new Error('Invalid output format from Replicate');
}

/**
 * Normalize fetch errors into user-friendly messages with step context
 */
function normalizeFetchError(error: unknown, step: string, response?: Response): Error {
  if (error instanceof TypeError) {
    // Network/CORS errors before HTTP response
    return new Error(
      `Network request failed while ${step}. Check your connection and verify the Replicate API token is configured correctly.`
    );
  }
  
  if (response && !response.ok) {
    return new Error(
      `Failed ${step} (HTTP ${response.status})`
    );
  }
  
  if (error instanceof Error) {
    return new Error(`Error ${step}: ${error.message}`);
  }
  
  return new Error(`Unknown error ${step}`);
}

export async function convertVoiceWithReplicate(
  audioFile: Uint8Array,
  voiceModelUrl: string,
  audioMimeType?: string,
  onProgress?: (status: string) => void
): Promise<Uint8Array> {
  // Hard fail if token is missing or empty
  const token = REPLICATE_API_TOKEN.trim();
  if (!token || token.length === 0) {
    throw new Error('Replicate API token not configured. Please add VITE_REPLICATE_API_TOKEN to your .env file to enable AI voice conversion.');
  }

  // Hard fail if model URL is missing
  if (!voiceModelUrl) {
    throw new Error('Voice model URL is required for conversion');
  }

  console.log('[Voice Conversion] Starting conversion pipeline');
  console.log('[Voice Conversion] Model URL:', voiceModelUrl);
  console.log('[Voice Conversion] Audio size:', audioFile.length, 'bytes');
  console.log('[Voice Conversion] Audio MIME type:', audioMimeType || 'audio/mpeg (default)');

  try {
    if (onProgress) onProgress('starting');

    // Convert audio bytes to data URL safely with proper MIME type
    const mimeType = audioMimeType || 'application/octet-stream';
    console.log('[Voice Conversion] Converting audio to data URL with MIME type:', mimeType);
    const audioDataUri = await bytesToDataURL(audioFile, mimeType);

    // Use Replicate's RVC model
    console.log('[Voice Conversion] Creating Replicate prediction...');
    let response: Response;
    try {
      response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: '0a9c7c558af4c0f20667c1bd1260ce32a2879944a0b9e44e1398660c077b1550',
          input: {
            song_input: audioDataUri,
            rvc_model: voiceModelUrl,
            pitch_change: 0,
            index_rate: 0.5,
            filter_radius: 3,
            rms_mix_rate: 0.25,
            protect: 0.33,
          },
        }),
      });
    } catch (error) {
      throw normalizeFetchError(error, 'contacting Replicate API');
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response');
      console.error('[Voice Conversion] Replicate API error:', response.status, errorText);
      throw new Error(`Failed to create prediction (HTTP ${response.status}): ${errorText}`);
    }

    const prediction: ReplicateResponse = await response.json();
    console.log('[Voice Conversion] Prediction created:', prediction.id);
    
    // Poll for completion
    const result = await pollPrediction(prediction.id, token, onProgress);
    
    // Extract audio URL from output
    const audioURL = extractAudioURL(result.output);
    console.log('[Voice Conversion] Conversion succeeded, downloading result from:', audioURL);

    if (onProgress) onProgress('downloading');

    // Download the converted audio
    let audioResponse: Response;
    try {
      audioResponse = await fetch(audioURL);
    } catch (error) {
      throw normalizeFetchError(error, 'downloading converted audio');
    }

    if (!audioResponse.ok) {
      console.error('[Voice Conversion] Download failed:', audioResponse.status);
      throw new Error(`Failed to download converted audio (HTTP ${audioResponse.status})`);
    }

    const audioBlob = await audioResponse.blob();
    const arrayBuffer = await audioBlob.arrayBuffer();
    
    console.log('[Voice Conversion] Download complete, size:', arrayBuffer.byteLength, 'bytes');
    
    if (onProgress) onProgress('succeeded');
    
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    console.error('[Voice Conversion] Pipeline failed:', error);
    throw error;
  }
}

let lastLoggedStatus: string | null = null;
let pollAttemptCount = 0;

async function pollPrediction(
  predictionId: string,
  token: string,
  onProgress?: (status: string) => void,
  maxAttempts = 60
): Promise<ReplicateResponse> {
  console.log('[Voice Conversion] Starting to poll prediction:', predictionId);
  lastLoggedStatus = null;
  pollAttemptCount = 0;

  for (let i = 0; i < maxAttempts; i++) {
    pollAttemptCount++;
    
    let response: Response;
    try {
      response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
    } catch (error) {
      throw normalizeFetchError(error, 'checking prediction status');
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response');
      console.error('[Voice Conversion] Status check failed:', response.status, errorText);
      throw new Error(`Failed to check prediction status (HTTP ${response.status}): ${errorText}`);
    }

    const prediction: ReplicateResponse = await response.json();
    
    // Log only on status changes to avoid spam
    if (prediction.status !== lastLoggedStatus) {
      console.log(`[Voice Conversion] Status changed to: ${prediction.status} (attempt ${pollAttemptCount})`);
      lastLoggedStatus = prediction.status;
    }
    
    if (onProgress) {
      onProgress(prediction.status);
    }

    if (prediction.status === 'succeeded') {
      console.log('[Voice Conversion] Prediction succeeded after', pollAttemptCount, 'attempts');
      return prediction;
    }

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      console.error('[Voice Conversion] Prediction failed/canceled:', prediction.error);
      throw new Error(prediction.error || `Voice conversion ${prediction.status}`);
    }

    // Wait 2 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.error('[Voice Conversion] Polling timed out after', maxAttempts, 'attempts');
  throw new Error('Voice conversion timed out after 2 minutes');
}
