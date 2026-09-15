import logo512 from '@/assets/brand/logo-512.png'
import logo192 from '@/assets/brand/logo-192.png'
import logo96 from '@/assets/brand/logo-96.png'
import logo64 from '@/assets/brand/logo-64.png'

export type LogoSize = 32 | 48 | 64 | 96 | 192 | 512

const RASTER: Record<LogoSize, string> = {
  32: logo64,
  48: logo96,
  64: logo96,
  96: logo192,
  192: logo512,
  512: logo512,
}

export interface LogoProps {
  size?: LogoSize
  className?: string
  title?: string
}

export function Logo({ size = 32, className = '', title = 'AgroMedConnect' }: LogoProps) {
  return (
    <img
      src={RASTER[size]}
      alt={title}
      width={size}
      height={size}
      className={`shrink-0 select-none ${className}`}
      draggable={false}
    />
  )
}
