import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function PushBridge() {
  const navigate = useNavigate()

  useEffect(() => {

    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; to?: string } | null
      if (data?.type === 'agromed:navigate' && typeof data.to === 'string') navigate(data.to)
    }
    navigator.serviceWorker?.addEventListener('message', onMessage)
    return () => navigator.serviceWorker?.removeEventListener('message', onMessage)
  }, [navigate])

  return null
}
