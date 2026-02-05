/**
 * Extracts a user-readable error message from backend/agent errors.
 * Preserves backend-provided reason text while stripping noisy prefixes.
 */
export function extractActorErrorMessage(error: unknown): string {
  if (!error) return 'An unknown error occurred';

  // Handle Error objects
  if (error instanceof Error) {
    let message = error.message;

    // Strip common IC agent error prefixes
    // Example: "Call failed:\n  Canister: ...\n  Method: ...\n  \"Rejected\": IC0503: Error from Canister ...: Canister trapped: Invalid voice ID"
    const trappedMatch = message.match(/Canister trapped:\s*(.+?)(?:\n|$)/i);
    if (trappedMatch) {
      return trappedMatch[1].trim();
    }

    // Try to extract the actual rejection reason
    const rejectedMatch = message.match(/"Rejected":\s*(.+?)(?:\n|$)/i);
    if (rejectedMatch) {
      const rejectedText = rejectedMatch[1].trim();
      // Further extract trapped message if present
      const innerTrapped = rejectedText.match(/Canister trapped:\s*(.+?)$/i);
      if (innerTrapped) {
        return innerTrapped[1].trim();
      }
      return rejectedText;
    }

    // If no special pattern, return the message as-is
    return message;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Handle objects with message property
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return extractActorErrorMessage((error as { message: unknown }).message);
  }

  return 'An unknown error occurred';
}
