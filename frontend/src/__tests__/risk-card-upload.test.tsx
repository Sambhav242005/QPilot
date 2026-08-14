import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { makeStore } from '@/store/store'
import { RiskAssessmentCard } from '@/components/copilot/RiskAssessmentCard'
import { ChatComposer } from '@/components/copilot/ChatComposer'

const renderWithStore = (ui: React.ReactElement) => {
  const store = makeStore()
  return render(<Provider store={store}>{ui}</Provider>)
}

describe('RiskAssessmentCard', () => {
  const mockAssessment = {
    severity: 'Minor' as const,
    risk_factors: [
      { factor: 'Minor packaging issue', severity: 'Minor' as const, reasoning: 'Cosmetic defect only.' },
    ],
    reasoning: 'Low severity packaging defect',
    recommended_action: 'Monitor and document',
    confidence: 'High' as const,
  }

  it('renders severity badge', () => {
    renderWithStore(
      <RiskAssessmentCard assessment={mockAssessment} />
    )
    const badges = screen.getAllByText(/minor/i)
    expect(badges.length).toBeGreaterThan(0)
  })

  it('renders risk factors list', () => {
    renderWithStore(
      <RiskAssessmentCard assessment={mockAssessment} />
    )
    expect(screen.getByText(/minor packaging issue/i)).toBeInTheDocument()
  })

  it('renders recommended action', () => {
    renderWithStore(
      <RiskAssessmentCard assessment={mockAssessment} />
    )
    expect(screen.getByText(/monitor and document/i)).toBeInTheDocument()
  })
})

describe('ChatComposer', () => {
  it('renders text input', () => {
    renderWithStore(<ChatComposer onSend={vi.fn()} disabled={false} />)
    expect(screen.getByPlaceholderText(/ask me/i)).toBeInTheDocument()
  })

  it('renders send button', () => {
    renderWithStore(<ChatComposer onSend={vi.fn()} disabled={false} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })
})
