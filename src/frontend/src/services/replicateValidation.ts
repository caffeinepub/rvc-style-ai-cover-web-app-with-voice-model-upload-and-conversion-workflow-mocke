// Client-side Replicate API token validation
// Makes a lightweight API request to verify the token works

interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Test a Replicate API token by making a lightweight API request
 * Returns success/error result suitable for UI display
 */
export async function validateReplicateToken(token: string): Promise<ValidationResult> {
  const trimmedToken = token.trim();
  
  if (!trimmedToken) {
    return {
      valid: false,
      error: 'Token cannot be empty',
    };
  }

  try {
    // Make a simple GET request to list predictions (lightweight endpoint)
    const response = await fetch('https://api.replicate.com/v1/predictions?page_size=1', {
      method: 'GET',
      headers: {
        'Authorization': `Token ${trimmedToken}`,
      },
    });

    if (response.ok) {
      return { valid: true };
    }

    if (response.status === 401) {
      return {
        valid: false,
        error: 'Invalid token. Please check your Replicate API token.',
      };
    }

    if (response.status === 403) {
      return {
        valid: false,
        error: 'Token does not have required permissions.',
      };
    }

    return {
      valid: false,
      error: `Validation failed (HTTP ${response.status})`,
    };
  } catch (error) {
    if (error instanceof TypeError) {
      return {
        valid: false,
        error: 'Network error. Please check your connection.',
      };
    }

    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
    };
  }
}
