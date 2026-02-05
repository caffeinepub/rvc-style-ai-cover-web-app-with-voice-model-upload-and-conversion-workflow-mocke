# Specification

## Summary
**Goal:** Ensure cover-generation jobs use the selected voice model to produce audible vocals, progress through a real processing lifecycle, and surface backend errors clearly in the UI.

**Planned changes:**
- Update backend conversion job creation so the output audio blob is derived from the selected target voice model rather than echoing the uploaded input audio unchanged.
- Adjust backend job lifecycle so new jobs start in a processing state and transition to completed after a short asynchronous delay, enabling frontend polling to reflect real progression.
- Improve the Create Cover frontend flow to preserve and display backend error messages for invalid/missing target voice model IDs, and ensure the form remains usable after failures.

**User-visible outcome:** Creating a cover with a selected voice model results in an output download with audible vocals from that model; jobs show a brief processing state before completing; and invalid model selections show clear error messages without leaving the UI stuck.
