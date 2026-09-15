import { describe, it, expect } from 'vitest'
import { givenName } from './Dashboard'

describe('givenName', () => {
  it('skips the honorific that opens most Bangladeshi names', () => {

    expect(givenName('Md. Rahim Uddin')).toBe('Rahim')
    expect(givenName('Mst. Shapla Begum')).toBe('Shapla')
  })

  it('leaves a name with no honorific alone', () => {
    expect(givenName('Nasrin Akter')).toBe('Nasrin')
  })

  it('falls back to the whole string rather than greeting nobody', () => {
    expect(givenName('Md.')).toBe('Md.')
    expect(givenName('')).toBe('')
  })
})
