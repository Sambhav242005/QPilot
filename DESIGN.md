# QPilot — UI/UX Design Specification

## 1. Product Design Philosophy

QPilot is an enterprise B2B application for pharmaceutical quality personnel. The design communicates:

- **Professionalism**: Clean, trustworthy interface suitable for regulated environments
- **Clarity**: High information density with strong visual hierarchy
- **Control**: Human always has final authority over AI recommendations
- **Intelligence**: AI copilot feels sophisticated, not gimmicky

The AI copilot is a capable assistant embedded in a serious workflow tool, not a consumer chatbot.

## 2. Application Shell

```
┌──────────────────────────────────────────────────────────────────────┐
│  QPilot    [Complaint #1234]            [Status: Processing]  [···] │
├──────────────────────────────────┬───────────────────────────────────┤
│                                  │                                   │
│        COMPLAINT WORKSPACE       │         AI COPILOT               │
│                                  │                                   │
│   ┌─────────────────────────┐   │   ┌───────────────────────────┐  │
│   │                         │   │   │  Messages                 │  │
│   │   Complaint Form        │   │   │  ...                      │  │
│   │                         │   │   │                           │  │
│   │                         │   │   │  Risk Assessment Card     │  │
│   │                         │   │   │                           │  │
│   └─────────────────────────┘   │   │  Recommendations          │  │
│                                  │   │                           │  │
│   ┌─────────────────────────┐   │   └───────────────────────────┘  │
│   │  Upload Area            │   │                                   │
│   └─────────────────────────┘   │   ┌───────────────────────────┐  │
│                                  │   │  [Type message...]  [→]  │  │
│   ┌─────────────────────────┐   │   └───────────────────────────┘  │
│   │  Review / Commit        │   │                                   │
│   └─────────────────────────┘   │                                   │
│                                  │                                   │
├──────────────────────────────────┴───────────────────────────────────┤
│  © 2025 QPilot  ·  AI Complaint Intelligence                       │
└──────────────────────────────────────────────────────────────────────┘
```

## 3. Page Structure

Single-page application. One primary view: the Complaint Workspace.

### 3.1 Header

- **Left**: QPilot logo/wordmark
- **Center**: Complaint identifier (e.g., "Complaint #1234" or "New Complaint")
- **Right**: Status badge, options menu

### 3.2 Main Content (Left Panel — 60%)

Contains the complaint form, file upload, and review/commit controls.

### 3.3 Copilot Panel (Right Panel — 40%)

Contains AI conversation, analysis cards, and input composer.

### 3.4 Footer

Minimal. Copyright and version info only.

## 4. Complaint Form

### 4.1 Layout

Vertical form layout with clear field grouping.

```
COMPLAINT DETAILS
─────────────────────────────────────────────────

Complaint Source          Product Name
[Select...]              [                    ]

Customer Name            Product Strength
[                    ]  [                    ]

Batch / Lot Number       Product Grade
[                    ]  [                    ]

─────────────────────────────────────────────────

COMPLAINT INFORMATION
─────────────────────────────────────────────────

Complaint Date           Affected Quantity
[                    ]  [                    ]

Manufacturing Date       Expiry Date
[                    ]  [                    ]

─────────────────────────────────────────────────

COMPLAINT DESCRIPTION
─────────────────────────────────────────────────
[                                                        ]
[                                                        ]
[                                                        ]
```

### 4.2 Field States

#### Empty/Initial State

```
Product Name
┌─────────────────────────────┐
│ Product name                │
│                             │
└─────────────────────────────┘
  Awaiting AI extraction
```

#### Populated State

```
Product Name
┌─────────────────────────────┐
│ Amoxicillin Capsules        │
│                             │
└─────────────────────────────┘
  ✓ Extracted from complaint
```

#### Manually Edited State

```
Product Name
┌─────────────────────────────┐
│ Amoxicillin 500mg Capsules  │
│                             │
└─────────────────────────────┘
  ✎ Manually edited
```

#### Missing/Required State

```
Batch Number
┌─────────────────────────────┐
│                             │
│                             │
└─────────────────────────────┘
  ⚠ Required — not provided in complaint
```

### 4.3 Field Types

| Field | Input Type |
|-------|-----------|
| Complaint Source | Dropdown (Pharmacy, Hospital, Distributor, Patient, Other) |
| Customer Name | Text input |
| Product Name | Text input |
| Product Strength | Text input |
| Product Grade | Text input |
| Batch / Lot Number | Text input |
| Affected Quantity | Text input |
| Manufacturing Date | Date picker |
| Expiry Date | Date picker |
| Complaint Date | Date picker (defaults to today) |
| Complaint Category | Read-only (AI-populated) |
| Complaint Description | Textarea |

### 4.4 Completeness Badge

Displayed at top of form:

```
┌──────────────────────────────┐
│  Complaint Completeness  78% │
│  ████████████████░░░░░░░░░░  │
│  Missing: Expiry date, Mfg   │
│  date                        │
└──────────────────────────────┘
```

## 5. AI Copilot Panel

### 5.1 Empty/Ready State

```
┌──────────────────────────────────────┐
│                                      │
│          🤖                          │
│                                      │
│   Ready to process a new complaint.  │
│                                      │
│   Enter complaint details or upload  │
│   a document to begin.               │
│                                      │
└──────────────────────────────────────┘
```

### 5.2 Processing State

```
┌──────────────────────────────────────┐
│                                      │
│   Processing complaint...            │
│   ● Extracting fields                │
│   ● Classifying complaint            │
│   ○ Assessing risk                   │
│                                      │
└──────────────────────────────────────┘
```

### 5.3 Analysis Complete State

```
┌──────────────────────────────────────┐
│  Messages                           │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ 📄 Complaint processed.      │   │
│  │                              │   │
│  │ Extracted 8 of 10 fields.   │   │
│  │ Complaint classified as     │   │
│  │ Product Defect —             │   │
│  │ Discoloration.               │   │
│  │                              │   │
│  │ Risk: Major                  │   │
│  │ Confidence: High             │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  RISK ASSESSMENT             │   │
│  │  ─────────────────────────   │   │
│  │  Severity                    │   │
│  │  ▪ Major                     │   │
│  │                              │   │
│  │  Risk Factors                │   │
│  │  • Product defect reported   │   │
│  │  • Batch identified          │   │
│  │  • Affected quantity known   │   │
│  │                              │   │
│  │  Reasoning                   │   │
│  │  Discoloration in solid      │   │
│  │  dosage form indicates       │   │
│  │  potential quality impact    │   │
│  │  requiring investigation.    │   │
│  │                              │   │
│  │  Recommended Action          │   │
│  │  Route to QA investigation   │   │
│  │  and evaluate affected batch.│   │
│  │                              │   │
│  │  Confidence: High            │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  CLASSIFICATION              │   │
│  │  ─────────────────────────   │   │
│  │  Product Defect              │   │
│  │  Discoloration               │   │
│  │                              │   │
│  │  Physical appearance change  │   │
│  │  in solid dosage form        │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  RECOMMENDATIONS             │   │
│  │  ─────────────────────────   │   │
│  │  1. Review batch mfg records │   │
│  │  2. Inspect retained samples │   │
│  │  3. Evaluate storage cond.   │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ [Type message...]      [→]  │   │
│  └──────────────────────────────┘   │
└──────────────────────────────────────┘
```

## 6. Input/Chat Composer

### 6.1 Location

Bottom of the AI Copilot panel.

### 6.2 Design

```
┌──────────────────────────────────────────┐
│  Type message or correction...     [→]  │
└──────────────────────────────────────────┘
```

- Single-line text input with send button
- Expands to multi-line on longer input
- Enter sends, Shift+Enter adds newline
- Send button disabled when empty
- Clear visual affordance for typing

### 6.3 Upload Button

Small upload icon next to the send button:

```
┌──────────────────────────────────────────┐
│  Type message...                  [📎][→] │
└──────────────────────────────────────────┘
```

## 7. File Upload

### 7.1 Upload Area

```
┌──────────────────────────────────────────┐
│                                          │
│         📁 Drop PDF here                 │
│         or click to browse               │
│                                          │
│         Supported: PDF (max 10MB)        │
│                                          │
└──────────────────────────────────────────┘
```

### 7.2 Upload Progress

```
┌──────────────────────────────────────────┐
│  📄 complaint_2025_001.pdf    2.3 MB    │
│  ████████████████████░░░░░░  72%        │
│  Processing document...                  │
└──────────────────────────────────────────┘
```

### 7.3 Upload Complete

```
┌──────────────────────────────────────────┐
│  ✓ complaint_2025_001.pdf    2.3 MB     │
│    Text extracted — 847 words            │
└──────────────────────────────────────────┘
```

### 7.4 Upload Error

```
┌──────────────────────────────────────────┐
│  ✗ complaint_2025_001.pdf               │
│    Error: File is empty or unreadable    │
│                            [Retry] [×]  │
└──────────────────────────────────────────┘
```

## 8. Extraction States

### 8.1 Processing Indicator

When AI is processing, show in copilot panel:

```
● Extracting complaint fields...
● Classifying complaint...
○ Assessing risk...
```

Progress dots animate. Completed steps show filled circle. Pending steps show empty circle.

### 8.2 Extraction Complete

Brief summary message:

```
Extraction complete. 8 of 10 fields populated.
2 fields require follow-up.
```

### 8.3 Extraction Failed

```
Processing encountered an issue.
The AI model could not parse this complaint.
You can try re-processing or enter fields manually.
[Retry Processing] [Enter Manually]
```

## 9. Complaint Status

### 9.1 Status Badge

Displayed in header and form:

| Status | Badge Style | Text |
|--------|------------|------|
| DRAFT | Gray | Draft |
| PROCESSING | Blue pulsing | Processing |
| READY_FOR_REVIEW | Amber | Ready for Review |
| READY_TO_COMMIT | Green outline | Ready to Commit |
| COMMITTED | Green solid | Committed |
| PROCESSING_FAILED | Red | Failed |

### 9.2 Status Flow Indicator

Optional horizontal progress indicator:

```
Draft → Processing → Review → Commit → Done
  ●        ●           ○        ○        ○
```

## 10. Risk Assessment Card

### 10.1 Layout

```
┌──────────────────────────────────────────┐
│  🛡️  RISK ASSESSMENT                     │
│  ──────────────────────────────────────  │
│                                          │
│  Severity                                │
│  ┌──────────────────────────────────┐   │
│  │  ■ Major                        │   │
│  └──────────────────────────────────┘   │
│                                          │
│  Risk Factors                            │
│  • Product defect reported               │
│  • Affected quantity identified          │
│  • Batch number available                │
│                                          │
│  Reasoning                               │
│  Discoloration in solid dosage form      │
│  indicates potential quality impact      │
│  requiring investigation.                │
│                                          │
│  Recommended Action                      │
│  Route to QA investigation and evaluate  │
│  the affected batch for moisture ingress │
│  or packaging failure.                   │
│                                          │
│  Confidence: ■■■■□ High                  │
│                                          │
└──────────────────────────────────────────┘
```

### 10.2 Severity Colors

| Severity | Color |
|----------|-------|
| Critical | Red |
| Major | Amber/Orange |
| Minor | Blue |
| Low | Gray |

### 10.3 Confidence Indicator

Horizontal bar with label:

```
Confidence: ■■■■□ High
```

- High (4/5 filled)
- Medium (3/5 filled)
- Low (2/5 filled)

## 11. Classification Display

### 11.1 Inline in Copilot

```
┌──────────────────────────────────────┐
│  CLASSIFICATION                      │
│  ─────────────────                   │
│  Product Defect                      │
│  Discoloration                       │
│                                      │
│  Physical appearance change in       │
│  solid dosage form indicating        │
│  potential quality deviation.        │
└──────────────────────────────────────┘
```

### 11.2 On Complaint Form

Category field shows classification with small badge:

```
Complaint Category
┌─────────────────────────────┐
│ Product Defect              │  ← read-only, AI-populated
│ Discoloration               │
└─────────────────────────────┘
```

## 12. Missing Information Display

### 12.1 In Form

Missing required fields show warning state:

```
Expiry Date
┌─────────────────────────────┐
│                             │
└─────────────────────────────┘
  ⚠ Not provided — required for full assessment
```

### 12.2 In Copilot

```
┌──────────────────────────────────────┐
│  MISSING INFORMATION                 │
│  ─────────────────                   │
│  The following fields were not found │
│  in the complaint:                   │
│                                      │
│  • Expiry date                       │
│  • Manufacturing date                │
│                                      │
│  You can provide these via the form  │
│  or tell me in chat.                 │
└──────────────────────────────────────┘
```

## 13. User Correction Experience

### 13.1 Via Chat

User types:

```
Actually, the batch number is BMX240602 and the quantity is 48 capsules
```

System responds:

```
Updated:
  • Batch Number: AMX240602 → BMX240602
  • Affected Quantity: 12 capsules → 48 capsules

Risk assessment has been re-evaluated.
```

### 13.2 Via Form

User edits field directly in form. On blur or explicit save:

```
Field updated.
Dependent analysis will be refreshed on next processing.
```

## 14. Review State

### 14.1 Review Panel

When complaint is READY_FOR_REVIEW:

```
┌──────────────────────────────────────────┐
│  📋 REVIEW COMPLAINT                     │
│  ──────────────────────────────────────  │
│                                          │
│  All AI-generated content is shown below.│
│  Review each section before committing.  │
│                                          │
│  ┌─ Complaint Details ──────────────┐   │
│  │  Source: Pharmacy                 │   │
│  │  Customer: Apollo Pharmacy        │   │
│  │  Product: Amoxicillin Capsules    │   │
│  │  ...                              │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ┌─ Risk Assessment ────────────────┐   │
│  │  Severity: Major                  │   │
│  │  ...                              │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ┌─ Classification ─────────────────┐   │
│  │  Category: Product Defect         │   │
│  │  Subcategory: Discoloration       │   │
│  └──────────────────────────────────┘   │
│                                          │
│  [Edit] [Approve & Commit]              │
│                                          │
└──────────────────────────────────────────┘
```

### 14.2 Review Actions

- **Edit**: Returns to edit mode, allows field changes
- **Approve & Commit**: Final confirmation before QMS commit

## 15. Commit-to-QMS Experience

### 15.1 Commit Button

Only enabled when complaint is READY_TO_COMMIT:

```
┌──────────────────────────────────────────┐
│  ✓ Complaint reviewed and approved       │
│                                          │
│  [ Commit to QMS ]                       │
│                                          │
└──────────────────────────────────────────┘
```

### 15.2 Commit Confirmation

Modal dialog:

```
┌──────────────────────────────────────────┐
│  Commit to QMS                          │
│  ─────────────────                      │
│                                          │
│  This will create an official QMS       │
│  complaint record. This action cannot   │
│  be undone.                              │
│                                          │
│  Complaint: Amoxicillin Capsules        │
│  Batch: BMX240602                       │
│  Severity: Major                        │
│                                          │
│  [Cancel]  [Confirm Commit]             │
│                                          │
└──────────────────────────────────────────┘
```

### 15.3 Post-Commit

```
┌──────────────────────────────────────────┐
│  ✓ Committed to QMS                     │
│  ─────────────────                      │
│                                          │
│  Complaint ID: QMS-2025-001234          │
│  Committed: Jan 15, 2025 at 11:00 AM   │
│                                          │
│  [View Record]  [New Complaint]         │
│                                          │
└──────────────────────────────────────────┘
```

## 16. Error States

### 16.1 Network Error

```
┌──────────────────────────────────────┐
│  ⚠ Connection lost                   │
│                                      │
│  Unable to reach the server.         │
│  Check your connection and try again.│
│                                      │
│  [Retry]                             │
└──────────────────────────────────────┘
```

### 16.2 Processing Error

```
┌──────────────────────────────────────┐
│  ⚠ Processing failed                 │
│                                      │
│  The AI model could not process      │
│  this complaint. This may be due to  │
│  a temporary service issue.          │
│                                      │
│  [Retry]  [Enter fields manually]   │
└──────────────────────────────────────┘
```

### 16.3 Validation Error

```
┌──────────────────────────────────────┐
│  ⚠ Cannot commit                     │
│                                      │
│  The following required fields are   │
│  missing:                            │
│  • Product name                      │
│  • Batch number                      │
│                                      │
│  Please complete these fields before │
│  committing.                         │
└──────────────────────────────────────┘
```

## 17. Loading States

### 17.1 Initial Load

```
┌──────────────────────────────────────┐
│  Loading complaint...                │
│  ○○○○○                              │
└──────────────────────────────────────┘
```

### 17.2 Field Extraction

Individual fields show loading skeleton:

```
Product Name
┌─────────────────────────────┐
│ ░░░░░░░░░░░░░░░░            │
└─────────────────────────────┘
  Extracting...
```

## 18. Empty States

### 18.1 No Complaint Loaded

```
┌──────────────────────────────────────┐
│                                      │
│         📝                          │
│                                      │
│   No complaint loaded.               │
│                                      │
│   Enter a complaint description or  │
│   upload a PDF to get started.       │
│                                      │
└──────────────────────────────────────┘
```

### 18.2 No Previous Complaints

```
┌──────────────────────────────────────┐
│                                      │
│   No complaints yet.                 │
│                                      │
│   Start by describing a customer    │
│   complaint in the copilot.         │
│                                      │
└──────────────────────────────────────┘
```

## 19. Typography

### 19.1 Font Family

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

### 19.2 Type Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Page title | 24px | 600 | 32px |
| Section heading | 18px | 600 | 28px |
| Card heading | 16px | 600 | 24px |
| Body text | 14px | 400 | 20px |
| Small text | 12px | 400 | 16px |
| Caption | 11px | 500 | 16px |
| Badge text | 11px | 600 | 16px |

### 19.3 Monospace

For batch numbers, codes, IDs:

```css
font-family: 'JetBrains Mono', 'Fira Code', monospace;
```

## 20. Color System

### 20.1 Base Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#FFFFFF` | Main background |
| `--bg-secondary` | `#F8FAFC` | Panel backgrounds |
| `--bg-tertiary` | `#F1F5F9` | Hover states |
| `--border-default` | `#E2E8F0` | Default borders |
| `--border-strong` | `#CBD5E1` | Emphasized borders |
| `--text-primary` | `#0F172A` | Primary text |
| `--text-secondary` | `#475569` | Secondary text |
| `--text-tertiary` | `#94A3B8` | Muted text |

### 20.2 Semantic Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#2563EB` | Links, primary actions |
| `--color-primary-hover` | `#1D4ED8` | Hover state |
| `--color-success` | `#16A34A` | Success states |
| `--color-warning` | `#D97706` | Warnings |
| `--color-error` | `#DC2626` | Errors |
| `--color-info` | `#0EA5E9` | Information |

### 20.3 Severity Colors

| Severity | Color | Background |
|----------|-------|------------|
| Critical | `#DC2626` | `#FEF2F2` |
| Major | `#D97706` | `#FFFBEB` |
| Minor | `#2563EB` | `#EFF6FF` |
| Low | `#64748B` | `#F8FAFC` |

### 20.4 Status Colors

| Status | Color |
|--------|-------|
| DRAFT | `#64748B` |
| PROCESSING | `#2563EB` |
| READY_FOR_REVIEW | `#D97706` |
| READY_TO_COMMIT | `#16A34A` |
| COMMITTED | `#15803D` |
| PROCESSING_FAILED | `#DC2626` |

## 21. Spacing

### 21.1 Spacing Scale

| Token | Value |
|-------|-------|
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-5` | `20px` |
| `--space-6` | `24px` |
| `--space-8` | `32px` |
| `--space-10` | `40px` |
| `--space-12` | `48px` |

### 21.2 Layout Spacing

| Element | Padding/Margin |
|---------|---------------|
| Page | `--space-6` |
| Panel | `--space-5` |
| Card | `--space-4` |
| Form field gap | `--space-4` |
| Field label to input | `--space-1` |
| Section separator | `--space-6` |

## 22. Components

### 22.1 Buttons

| Variant | Usage |
|---------|-------|
| Primary | Main actions (Commit, Submit) |
| Secondary | Alternative actions (Cancel, Edit) |
| Ghost | Tertiary actions, inline |
| Danger | Destructive actions |

### 22.2 Inputs

| Type | Usage |
|------|-------|
| Text | Short text fields |
| Textarea | Complaint description |
| Select | Complaint source |
| Date | Date fields |
| File | PDF upload |

### 22.3 Cards

White background, subtle border, 8px border-radius:

```
┌─────────────────────────────┐
│  Card content               │
│                             │
└─────────────────────────────┘
```

### 22.4 Badges

Small, rounded, colored labels:

```
[ Major ]  [ Processing ]  [ Product Defect ]
```

### 22.5 Toast Notifications

Bottom-right corner, auto-dismiss after 5 seconds:

```
┌──────────────────────────────────────┐
│  ✓ Complaint committed successfully  │
└──────────────────────────────────────┘
```

## 23. Responsive Behavior

### 23.1 Desktop (≥1280px)

Full two-panel layout as designed.

### 23.2 Tablet (768px–1279px)

- Panels stack vertically
- Complaint form on top
- Copilot panel below
- Collapsible copilot

### 23.3 Mobile (<768px)

- Single column layout
- Tab navigation between form and copilot
- Simplified header

**Note**: Desktop-first. Mobile is secondary for MVP.

## 24. Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Keyboard navigation | All interactive elements focusable |
| Focus visible | Visible focus ring on all inputs |
| Color contrast | WCAG AA minimum (4.5:1 text) |
| Screen reader | ARIA labels on interactive elements |
| Error announcements | Live regions for status updates |
| Form labels | Associated labels for all inputs |
| Skip link | Skip to main content |

## 25. Interaction Principles

1. **Immediate feedback**: Every user action has visual response within 100ms
2. **Progressive disclosure**: Show essential info first, details on demand
3. **Non-destructive**: User can always undo or go back
4. **Clear ownership**: AI outputs clearly labeled as AI-generated
5. **Human authority**: Final actions (commit) require explicit human confirmation
6. **Graceful degradation**: Errors don't break the experience
7. **Consistent patterns**: Similar interactions use identical UI patterns
