# QPilot — Skill Map

> Which skill to use for which task during development.
> When context window compresses, refer back here to remember which skill to load.

## Purpose

This document maps development tasks to the appropriate agent skills. During long sessions with context compression, this file ensures the correct skill is loaded for each task type.

**When context compresses, re-read this file first.**

---

## Skill-to-Task Mapping

### Phase 0 — Repository Setup

| Task | Skill | Why |
|------|-------|-----|
| Initialize Next.js project | `android-cli` or manual setup | Project scaffolding |
| Initialize Python project | `uv` | Python package management |
| Set up Docker Compose | Manual | Docker config |
| Configure linting/formatting | Manual | Tool config |

### Phase 1-7 — Backend Core

| Task | Skill | Why |
|------|-------|-----|
| Design Pydantic schemas | `domain-modeling` | Domain model design |
| Design API contracts | `design-an-interface` | API design |
| Implement FastAPI endpoints | `read-the-damn-docs` | FastAPI docs |
| Implement LangGraph workflow | `read-the-damn-docs` | LangGraph docs |
| Implement LLM service | `read-the-damn-docs` | OpenAI API docs |
| Database schema design | `domain-modeling` | Data model |
| Write backend tests | `tdd` | Test-driven development |

### Phase 8-12 — Frontend Core

| Task | Skill | Why |
|------|-------|-----|
| Design UI components | `ui-ux-pro-max` | UI design |
| Implement React components | `frontend-design` | Frontend build |
| Set up Redux | `read-the-damn-docs` | Redux Toolkit docs |
| Style with Tailwind | `frontend-design` | Styling |
| Implement streaming UI | `frontend-design` | Live updates |

### Phase 13-17 — Features

| Task | Skill | Why |
|------|-------|-----|
| User corrections flow | `domain-modeling` | Workflow design |
| PDF ingestion | `read-the-damn-docs` | PDF library docs |
| Review/commit workflow | `domain-modeling` | Business rules |
| Completeness checker | `tdd` | Deterministic logic |
| Duplicate detection | `domain-modeling` | Similarity logic |

### Phase 18-24 — Testing

| Task | Skill | Why |
|------|-------|-----|
| Write unit tests | `tdd` | Test-first approach |
| Write integration tests | `tdd` | API/DB tests |
| Write E2E tests | `read-the-damn-docs` | Playwright docs |
| AI reliability tests | `evaluation` | LLM evaluation |
| Security tests | Manual | Security review |
| Accessibility tests | `web-design-guidelines` | A11y standards |

### Phase 25-27 — Polish & Demo

| Task | Skill | Why |
|------|-------|-----|
| UX polish | `ui-ux-polish` | Iterative refinement |
| Accessibility audit | `web-design-guidelines` | Standards |
| Demo preparation | Manual | Walkthrough |
| Documentation | Manual | README/docs |

---

## Context Compression Resilience

### Problem

When context window compresses during long sessions, skill instructions may be lost. This section ensures critical skills are reloaded.

### Rules

1. **Before any coding task**: Check this SKILL_MAP.md for the appropriate skill.
2. **Before testing**: Load `tdd` skill.
3. **Before UI work**: Load `ui-ux-pro-max` or `frontend-design`.
4. **Before API work**: Load `read-the-damn-docs` for the relevant framework.
5. **Before domain logic**: Load `domain-modeling`.
6. **Before evaluation**: Load `evaluation`.

### Skill Reload Triggers

| Trigger | Action |
|---------|--------|
| Starting a new phase | Re-read SKILL_MAP.md |
| Context feels thin | Reload relevant skill |
| Unsure which pattern to use | Check skill instructions |
| Before writing tests | Load `tdd` |
| Before UI components | Load `frontend-design` |
| Before API endpoints | Load `read-the-damn-docs` |
| Before domain logic | Load `domain-modeling` |

### Key Skills to Remember

| Skill | When to Use |
|-------|-------------|
| `tdd` | Any test writing |
| `read-the-damn-docs` | Any third-party library integration |
| `domain-modeling` | Any business logic or schema design |
| `ui-ux-pro-max` | Any UI design decisions |
| `frontend-design` | Any React/component implementation |
| `evaluation` | Any AI/LLM quality assessment |
| `web-design-guidelines` | Any accessibility or standards review |

---

## Quick Reference

### Backend Development
```
Schema design     → domain-modeling
API design        → design-an-interface
FastAPI endpoints → read-the-damn-docs (FastAPI)
LangGraph workflow → read-the-damn-docs (LangGraph)
LLM integration   → read-the-damn-docs (OpenAI API)
Database          → read-the-damn-docs (SQLAlchemy/Alembic)
Tests             → tdd
```

### Frontend Development
```
UI design         → ui-ux-pro-max
Components        → frontend-design
Redux             → read-the-damn-docs (Redux Toolkit)
Styling           → frontend-design (Tailwind)
Streaming UI      → frontend-design
Tests             → tdd
```

### Quality & Testing
```
Unit tests        → tdd
Integration tests → tdd
E2E tests         → read-the-damn-docs (Playwright)
AI evaluation     → evaluation
Accessibility     → web-design-guidelines
Security          → Manual review
```
