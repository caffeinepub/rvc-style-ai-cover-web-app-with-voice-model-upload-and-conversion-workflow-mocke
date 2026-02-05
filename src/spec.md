# Specification

## Summary
**Goal:** Ensure voice conversion jobs reliably generate, save, and play the selected model’s converted audio (never silently falling back to the original audio).

**Planned changes:**
- Rebuild the client-side Replicate voice conversion flow to fail fast with clear UI errors when Replicate is not configured or conversion fails, and to prevent creating “completed” jobs containing unconverted/original audio.
- Update the conversion pipeline to resolve the user-selected model via the backend and pass its concrete model resource URL (derived from the stored model blob’s direct URL) into the Replicate conversion request.
- Store the downloaded converted audio bytes as the backend job’s completed blob so preview/download always uses the converted result.
- Rebuild completed-job audio preview to use a Blob/ObjectURL for playback (with correct play/stop toggling, cleanup via URL revocation, and user-facing playback errors).
- Replace Replicate request/response handling with robust output parsing (string URL vs list of URLs), safe binary handling for large audio (no unsafe base64 conversions), and UI status updates that reflect polling states and only complete after the converted audio is persisted.

**User-visible outcome:** Submitting audio with a selected model produces a completed job whose preview/download plays the actual model-converted output, with clear errors shown if Replicate/model resolution/conversion/playback fails.
