# Specification

## Summary
**Goal:** Prevent the vague “Load failed” error during AI cover creation by adding clear, step-specific errors, basic configuration checks, and safer audio upload handling.

**Planned changes:**
- Add improved error handling around Replicate API calls in the cover creation flow, converting fetch/network and HTTP errors into clear, user-facing messages that identify the failing step (create prediction, poll prediction, download result) and include HTTP status/response text when available.
- Add a preflight configuration check on the Create Cover page to detect a missing/empty `VITE_REPLICATE_API_TOKEN`, block submission, and show an on-page explanation for how to configure it.
- Use the uploaded audio file’s MIME type (with safe fallbacks) when converting audio bytes to a data URL, instead of always using `audio/mpeg`.
- Add lightweight console-level diagnostic logging across the cover creation pipeline (model URL fetch, Replicate create/poll, result download, backend save) without logging the Replicate API token and without excessive poll spam.

**User-visible outcome:** When cover creation fails, users see a clear, actionable error message indicating which step failed (and HTTP details when available), they are warned and blocked if the Replicate token is not configured, and non-MP3 uploads are less likely to fail during conversion.
