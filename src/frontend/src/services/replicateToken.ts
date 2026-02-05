// Client-side token persistence service
// Stores Replicate API token in browser localStorage (never sent to backend)

const TOKEN_STORAGE_KEY = 'replicate_api_token';

type TokenChangeListener = () => void;
const listeners = new Set<TokenChangeListener>();

/**
 * Get the saved runtime token from browser storage
 */
export function getSavedToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to read token from localStorage:', error);
    return null;
  }
}

/**
 * Save a token to browser storage
 */
export function saveToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token.trim());
    notifyListeners();
  } catch (error) {
    console.error('Failed to save token to localStorage:', error);
    throw new Error('Failed to save token to browser storage');
  }
}

/**
 * Clear the saved token from browser storage
 */
export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    notifyListeners();
  } catch (error) {
    console.error('Failed to clear token from localStorage:', error);
    throw new Error('Failed to clear token from browser storage');
  }
}

/**
 * Subscribe to token changes
 */
export function subscribeToTokenChanges(listener: TokenChangeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Notify all listeners of token changes
 */
function notifyListeners(): void {
  listeners.forEach(listener => listener());
}
