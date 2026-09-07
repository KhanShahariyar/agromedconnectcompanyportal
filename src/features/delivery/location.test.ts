import { describe, it, expect } from 'vitest'
import { googleMapsDirections } from './DeliveryLocation'

describe('googleMapsDirections', () => {
  it('navigates to the exact coordinate when one was captured', () => {
    const url = googleMapsDirections({ lat: 23.4607, lng: 89.8429, precision: 'exact' }, 'Char Bhadrasan')
    expect(url).toBe('https://www.google.com/maps/dir/?api=1&destination=23.4607%2C89.8429')
  })

  it('falls back to the written address when no pin exists, rather than giving up', () => {
    const url = googleMapsDirections({ lat: null, lng: null, precision: 'none' }, 'Gangni Bazar, Meherpur')
    expect(url).toContain('destination=Gangni%20Bazar%2C%20Meherpur')
  })

  it('always points at Google Maps, for every role', () => {
    for (const loc of [
      { lat: 1, lng: 2, precision: 'exact' as const },
      { lat: null, lng: null, precision: 'none' as const },
    ]) {
      expect(googleMapsDirections(loc, 'x')).toMatch(/^https:\/\/www\.google\.com\/maps\/dir\//)
    }
  })
})
