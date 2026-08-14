# Known Limitations

QPilot is an MVP assessment project, not a certified pharmaceutical QMS.

- Authentication, authorization, and multi-tenant isolation are not implemented.
- PDF ingestion extracts embedded text; production OCR for scanned documents is out of scope.
- The live AI path requires an OpenAI-compatible provider and configured server-side credentials.
- The demo workflow is English-only and uses a local SQLite database by default.
- E2E browser tests mock FastAPI responses so they remain deterministic; backend integration tests cover the real API boundary.
- No export, regulatory submission, complaint list, or visual regression workflow is included in this MVP.
