# Specification

## Summary
**Goal:** Let users configure the Replicate API token in-app (store it in the browser) and use it at runtime for voice conversion.

**Planned changes:**
- Add UI in the Create Cover flow to enter, save, reveal/mask, and clear a Replicate API token, with clear English messaging that it’s stored client-side (not sent to the backend).
- Persist the token on the client and update Replicate configuration checks and voice conversion to use the saved token first, falling back to `import.meta.env.VITE_REPLICATE_API_TOKEN`.
- Add a “Test token” action that validates the token via a Replicate API request and displays success/error, enabling the Create Cover flow immediately on success.
- Ensure voice conversion remains blocked with a clear error when no valid token is available, and never send/store the token in the Motoko backend.

**User-visible outcome:** Users can paste a Replicate API token in the app, test it, save or clear it, and run voice conversion without editing `.env`, with the token stored only in their browser.
