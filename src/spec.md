# Specification

## Summary
**Goal:** Rebuild the end-to-end AI cover creation job flow so jobs only complete after the frontend uploads the converted audio output, eliminating the current “acting up” behavior.

**Planned changes:**
- Rework the backend job lifecycle to stop timer-based auto-completion and instead support explicitly completing a job by attaching the converted output audio blob (with timestamps).
- Update backend APIs to (1) create a processing job with input audio, (2) complete an existing job with the converted output, and (3) enforce that only the job creator can complete their job.
- Update the frontend cover creation flow to run Replicate conversion first, then upload/save the converted output to complete the job, with clear step-by-step progress and English error handling + retry paths.
- Make Replicate token configuration robust in production by ensuring `VITE_REPLICATE_API_TOKEN` is present in the built frontend and blocking conversion with a prominent warning when missing/empty.

**User-visible outcome:** Users can submit an AI cover conversion and see the job remain in “processing” until conversion finishes and the converted audio is successfully saved; completed jobs play/download the converted output and show clear progress and errors (including a hard block if the Replicate token is not configured).
