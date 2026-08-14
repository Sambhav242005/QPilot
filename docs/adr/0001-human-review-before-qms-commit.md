# ADR 0001: Human Review Before QMS Commit

- Status: Accepted
- Date: 2026-08-14

## Decision

QPilot may extract fields, classify complaints, assess initial risk, and recommend a next action, but it must not commit a complaint to QMS without an explicit human review and confirmation.

## Rationale

Complaint documents can be incomplete or ambiguous. Separating AI recommendations from the system-of-record commit preserves QA accountability, makes corrections visible, and prevents an LLM from making an autonomous regulatory decision.

## Consequences

- The UI exposes a `Ready for Review` state and a separate review/commit panel.
- Missing fields remain visible instead of being silently guessed.
- The commit endpoint remains the only path that changes a reviewed complaint to a committed record.
