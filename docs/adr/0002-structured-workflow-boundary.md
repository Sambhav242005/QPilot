# ADR 0002: Structured AI Workflow at the FastAPI Boundary

- Status: Accepted
- Date: 2026-08-14

## Decision

FastAPI owns complaint persistence and business rules. LangGraph owns the typed extraction, classification, risk, and completeness workflow. Next.js consumes validated REST responses and never calls the LLM directly.

## Rationale

This boundary keeps API keys and database writes server-side, allows the LLM provider to be swapped, and gives tests a deterministic seam for malformed or incomplete AI output.

## Consequences

- AI outputs are validated with Pydantic schemas before persistence.
- Frontend state stores normalized structured analysis alongside the chat transcript.
- API and workflow tests can mock the LLM without requiring browser or network access.
