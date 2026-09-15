import { beforeEach, describe, expect, it, vi } from 'vitest'

const getToken = vi.fn<() => Promise<string | null>>()
const deleteToken = vi.fn(async () => true)

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({})),
}))

vi.mock('./firebase-config', () => ({
  firebaseConfig: { projectId: 'agromedconnect-67db1' },
  VAPID_PUBLIC_KEY: 'B' + 'A'.repeat(86),
}))

vi.mock('firebase/messaging', () => ({
  isSupported: vi.fn(async () => true),
  getMessaging: vi.fn(() => ({})),
  getToken: (...args: unknown[]) => getToken(...(args as [])),
  deleteToken: (...args: unknown[]) => deleteToken(...(args as [])),
  onMessage: vi.fn(() => () => {}),
}))

const { registerPush, unregisterPush } = await import('./push')

function createStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() { return map.size },
    key: (i: number) => [...map.keys()][i] ?? null,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { map.set(k, String(v)) },
    removeItem: (k: string) => { map.delete(k) },
    clear: () => { map.clear() },
  } as Storage
}

let store: Storage

const STORAGE_KEY = 'agromed.portal.push.token'
const USER_KEY = 'agromed.portal.push.user'

function grantPermission(state: NotificationPermission) {
  vi.stubGlobal('Notification', {
    permission: state,
    requestPermission: vi.fn(async () => state),
  })
}

type Registrar = (token: string, platform: 'web') => Promise<void>

describe('web push registration', () => {
  let register: ReturnType<typeof vi.fn<Registrar>>
  let remove: ReturnType<typeof vi.fn<Registrar>>

  beforeEach(() => {
    store = createStorage()
    vi.stubGlobal('localStorage', store)
    vi.clearAllMocks()
    register = vi.fn<Registrar>(async () => {})
    remove = vi.fn<Registrar>(async () => {})
    grantPermission('granted')

    vi.stubGlobal('navigator', { ...navigator, serviceWorker: undefined })
  })

  it('registers a new token and remembers it', async () => {
    getToken.mockResolvedValue('token-1')

    await registerPush('user-1', register, remove)

    expect(register).toHaveBeenCalledWith('token-1', 'web')
    expect(store.getItem(STORAGE_KEY)).toBe('token-1')
    expect(store.getItem(USER_KEY)).toBe('user-1')
  })

  it('does not re-register an unchanged token for the same user', async () => {
    store.setItem(STORAGE_KEY, 'token-1')
    store.setItem(USER_KEY, 'user-1')
    getToken.mockResolvedValue('token-1')

    await registerPush('user-1', register, remove)

    expect(register).not.toHaveBeenCalled()
  })

  it('withdraws the previous token when Firebase rotates it', async () => {

    store.setItem(STORAGE_KEY, 'old-token')
    store.setItem(USER_KEY, 'user-1')
    getToken.mockResolvedValue('new-token')

    await registerPush('user-1', register, remove)

    expect(remove).toHaveBeenCalledWith('old-token', 'web')
    expect(register).toHaveBeenCalledWith('new-token', 'web')
  })

  it('re-registers the same browser when a different user signs in', async () => {
    store.setItem(STORAGE_KEY, 'token-1')
    store.setItem(USER_KEY, 'user-1')
    getToken.mockResolvedValue('token-1')

    await registerPush('user-2', register, remove)

    expect(register).toHaveBeenCalledWith('token-1', 'web')
    expect(store.getItem(USER_KEY)).toBe('user-2')
  })

  it('asks for nothing and registers nothing when permission was refused', async () => {
    grantPermission('denied')
    getToken.mockResolvedValue('token-1')

    await registerPush('user-1', register, remove)

    expect(register).not.toHaveBeenCalled()
    expect(getToken).not.toHaveBeenCalled()
  })

  it('does not register when the user dismisses the permission prompt', async () => {
    vi.stubGlobal('Notification', {
      permission: 'default',
      requestPermission: vi.fn(async () => 'default' as NotificationPermission),
    })
    getToken.mockResolvedValue('token-1')

    await registerPush('user-1', register, remove)

    expect(register).not.toHaveBeenCalled()
  })

  it('survives a browser that cannot produce a token', async () => {
    getToken.mockResolvedValue(null)

    await expect(registerPush('user-1', register, remove)).resolves.toBeUndefined()
    expect(register).not.toHaveBeenCalled()
  })

  it('does not let a failed registration escape into the sign-in path', async () => {
    getToken.mockRejectedValue(new Error('no service worker'))

    await expect(registerPush('user-1', register, remove)).resolves.toBeUndefined()
  })
})

describe('web push sign-out', () => {
  let remove: ReturnType<typeof vi.fn<Registrar>>

  beforeEach(() => {
    store = createStorage()
    vi.stubGlobal('localStorage', store)
    vi.clearAllMocks()
    remove = vi.fn<Registrar>(async () => {})
    grantPermission('granted')
  })

  it("withdraws only this browser's token", async () => {
    store.setItem(STORAGE_KEY, 'token-1')
    store.setItem(USER_KEY, 'user-1')

    await unregisterPush(remove)

    expect(remove).toHaveBeenCalledTimes(1)
    expect(remove).toHaveBeenCalledWith('token-1', 'web')
  })

  it('forgets the token so the next sign-in registers again', async () => {
    store.setItem(STORAGE_KEY, 'token-1')
    store.setItem(USER_KEY, 'user-1')

    await unregisterPush(remove)

    expect(store.getItem(STORAGE_KEY)).toBeNull()
    expect(store.getItem(USER_KEY)).toBeNull()
  })

  it('is a no-op when nothing was registered', async () => {
    await unregisterPush(remove)

    expect(remove).not.toHaveBeenCalled()
  })

  it('still forgets locally when the server call fails', async () => {

    store.setItem(STORAGE_KEY, 'token-1')
    remove.mockRejectedValue(new Error('offline'))

    await unregisterPush(remove)

    expect(store.getItem(STORAGE_KEY)).toBeNull()
  })
})

describe('the VAPID key this project ships', () => {
  it('is a decodable 87-character P-256 public key', async () => {

    const actual = await vi.importActual<typeof import('./firebase-config')>('./firebase-config')
    expect(actual.VAPID_PUBLIC_KEY).toMatch(/^[A-Za-z0-9_-]{87}$/)
  })
})
