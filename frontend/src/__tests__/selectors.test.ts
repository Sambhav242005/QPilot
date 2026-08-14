import { describe, it, expect } from 'vitest'
import { makeStore } from '@/store/store'
import { updateFormField, resetForm } from '@/store/slices/complaintSlice'
import { addMessage } from '@/store/slices/copilotSlice'

describe('Redux Selectors', () => {
  it('complaint state updates via updateFormField', () => {
    const store = makeStore()
    store.dispatch(updateFormField({ field: 'productName', value: 'Aspirin' }))
    const state = store.getState()
    expect(state.complaint.formData.productName).toBe('Aspirin')
  })

  it('copilot state updates via addMessage', () => {
    const store = makeStore()
    store.dispatch(addMessage({ role: 'user', content: 'hello' }))
    const state = store.getState()
    expect(state.copilot.messages.length).toBeGreaterThan(0)
  })

  it('complaint formData has expected fields', () => {
    const store = makeStore()
    const state = store.getState()
    expect(state.complaint.formData).toHaveProperty('productName')
    expect(state.complaint.formData).toHaveProperty('batchLotNumber')
    expect(state.complaint.formData).toHaveProperty('customerName')
  })

  it('resetForm clears formData', () => {
    const store = makeStore()
    store.dispatch(updateFormField({ field: 'productName', value: 'Aspirin' }))
    store.dispatch(resetForm())
    const state = store.getState()
    expect(state.complaint.formData.productName).toBe('')
  })
})
