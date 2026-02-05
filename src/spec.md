# Specification

## Summary
**Goal:** Build an RVC-style AI cover web app where signed-in users can upload/manage voice models, submit mocked audio conversion jobs, and view/download results.

**Planned changes:**
- Add app navigation and pages: Voice Models, Create Cover, and Jobs/History with clear English headings, helper text, and primary actions.
- Integrate Internet Identity sign-in/sign-out and scope all models and jobs to the authenticated principal.
- Backend (single Motoko actor) support for voice models: chunked upload of raw model bytes, store metadata, list/get, and delete (principal-scoped).
- Frontend Voice Models UI: upload form with metadata + file picker, list models, delete with confirmation, and progress/success/error states via React Query.
- Backend conversion workflow: create jobs referencing a model + chunked source-audio upload, track status, list/get status, and download result audio bytes (principal-scoped).
- Frontend Create Cover UI: pick model, upload source audio, submit job, and poll job status until completed/failed; provide download when complete.
- Mock backend processing: mark jobs processing then complete with deterministic placeholder audio (at minimum pass-through of source bytes); fail with English errors on invalid inputs.
- Jobs/History UI: list jobs with timestamps/model/status, view job details, download completed results, and show English error messages for failures.
- Apply a cohesive music/creator visual theme across the app (avoid default styling and avoid a blue/purple palette).
- Add and use generated static branding/hero/empty-state images from `frontend/public/assets/generated`.

**User-visible outcome:** A signed-in user can upload voice models, create an AI cover job by uploading audio and selecting a model, watch the job progress (mocked), and browse job history to download completed result audio.
