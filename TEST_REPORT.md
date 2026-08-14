# QPilot Test Report

Date: 2026-08-14

## Result

All required local verification passed.

| Check | Result |
|---|---:|
| Backend pytest | 150 passed, 3 skipped |
| Frontend Vitest | 15 files, 91 tests passed |
| Frontend TypeScript | Passed |
| Frontend ESLint | Passed |
| Frontend production build | Passed |
| Playwright E2E | 41 tests passed |

## Coverage represented

- Correction tests cover single-field updates, multiple-field corrections, reclassification, unrelated-field preservation, and no duplicate complaint creation.
- PDF tests cover valid extraction, empty PDFs, invalid types, file-size limits, safe filenames, and pipeline text handoff.
- The browser suite covers accessibility checks, correction/editing behavior, failure recovery, and the PDF → extraction → AI analysis → human review → QMS commit path.

## Notes

- The three skipped backend tests are opt-in live-AI checks.
- Playwright uses deterministic API mocks for browser repeatability; backend tests cover the real FastAPI boundary.
- Test output includes existing non-blocking warnings from Python 3.14/Pydantic compatibility, an unregistered optional `live` marker, and Redux’s intentional `File` test fixture warning.
