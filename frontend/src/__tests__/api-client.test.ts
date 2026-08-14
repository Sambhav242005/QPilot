import { describe, it, expect, vi, beforeEach } from 'vitest'
import { complaintApi } from '@/services/api'

const mockFetch = vi.fn()
global.fetch = mockFetch

const mockResponse = (data: unknown, ok = true, status = 200) =>
  Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
    headers: new Headers({ 'content-type': 'application/json' }),
  })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('API Client', () => {
  it('getById returns data on success', async () => {
    const complaint = { id: 'c1', rawInput: 'test', status: 'pending' }
    mockFetch.mockReturnValueOnce(mockResponse(complaint))

    const result = await complaintApi.getById('c1')

    expect(result).toBeDefined()
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/complaints/c1'),
      expect.anything()
    )
  })

  it('getById returns error on failure', async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ error: 'Not found' }, false, 404))

    const result = await complaintApi.getById('nonexistent')
    expect(result.success).toBe(false)
  })

  it('create sends POST request', async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ id: 'new-123', status: 'pending' }))

    const result = await complaintApi.create({ rawInput: 'test input' })
    expect(result).toBeDefined()
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/complaints'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('process sends POST with complaintId', async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ status: 'processing' }))

    await complaintApi.process('c1')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/complaints/c1/process'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('commit sends POST with complaintId', async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ status: 'committed' }))

    await complaintApi.commit('c1')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/complaints/c1/commit'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('sendMessage sends chat message', async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ role: 'assistant', content: 'I can help with that' }))

    const result = await complaintApi.sendMessage('c1', 'help me')
    expect(result).toBeDefined()
  })
})
