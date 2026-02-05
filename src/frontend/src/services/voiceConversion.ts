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
 * Convert audio bytes to a data URL safely without stack overflow
 */
function bytesToDataURL(bytes: Uint8Array, mimeType: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create a new Uint8Array to ensure we have a proper ArrayBuffer
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

export async function convertVoiceWithReplicate(
  audioFile: Uint8Array,
  voiceModelUrl: string,
  onProgress?: (status: string) => void
): Promise<Uint8Array> {
  // Hard fail if token is missing
  if (!REPLICATE_API_TOKEN) {
    throw new Error('Replicate API token not configured. Please add VITE_REPLICATE_API_TOKEN to your .env file to enable AI voice conversion.');
  }

  // Hard fail if model URL is missing
  if (!voiceModelUrl) {
    throw new Error('Voice model URL is required for conversion');
  }

  try {
    if (onProgress) onProgress('starting');

    // Convert audio bytes to data URL safely
    const audioDataUri = await bytesToDataURL(audioFile, 'audio/mpeg');

    // Use Replicate's RVC model
    // Using the public RVC model: https://replicate.com/zsxkib/realistic-voice-cloning
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
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

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Replicate API error (${response.status}): ${errorText}`);
    }

    const prediction: ReplicateResponse = await response.json();
    
    // Poll for completion
    const result = await pollPrediction(prediction.id, onProgress);
    
    // Extract audio URL from output
    const audioURL = extractAudioURL(result.output);

    if (onProgress) onProgress('downloading');

    // Download the converted audio
    const audioResponse = await fetch(audioURL);
    if (!audioResponse.ok) {
      throw new Error(`Failed to download converted audio (${audioResponse.status})`);
    }

    const audioBlob = await audioResponse.blob();
    const arrayBuffer = await audioBlob.arrayBuffer();
    
    if (onProgress) onProgress('succeeded');
    
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    console.error('Voice conversion error:', error);
    throw error;
  }
}

async function pollPrediction(
  predictionId: string,
  onProgress?: (status: string) => void,
  maxAttempts = 60
): Promise<ReplicateResponse> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to check prediction status (${response.status})`);
    }

    const prediction: ReplicateResponse = await response.json();
    
    if (onProgress) {
      onProgress(prediction.status);
    }

    if (prediction.status === 'succeeded') {
      return prediction;
    }

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      throw new Error(prediction.error || `Voice conversion ${prediction.status}`);
    }

    // Wait 2 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error('Voice conversion timed out after 2 minutes');
}
