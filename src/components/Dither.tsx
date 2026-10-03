import { createContext, useContext, useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { startDither, type DitherHandle } from '~/lib/dither'
import { cx } from './ui'

const DitherContext = createContext<(el: HTMLElement) => void>(() => {})

/** Run a car sweep over an element. Does nothing before mount or with reduced motion. */
export const useDriveBy = () => useContext(DitherContext)

/** Owns the one paint loop for every <DitherCanvas> below it. */
export function DitherProvider({ children, className }: { children: ReactNode; className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const handle = useRef<DitherHandle | null>(null)
  const driveBy = useRef((el: HTMLElement) => handle.current?.driveBy(el))

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const h = startDither(root)
    handle.current = h
    return () => {
      h.stop()
      handle.current = null
    }
  }, [])

  return (
    <DitherContext.Provider value={driveBy.current}>
      <div ref={rootRef} className={className ?? 'contents'}>
        {children}
      </div>
    </DitherContext.Provider>
  )
}

export type DitherMode = 'edges' | 'photo' | 'photoStill' | 'glow' | 'noise' | 'footer'

/** A canvas that the engine paints. Size it with className or style. */
export function DitherCanvas({
  mode,
  seed,
  className,
  style,
}: {
  mode: DitherMode
  seed?: number
  className?: string
  style?: CSSProperties
}) {
  return (
    <canvas
      data-mode={mode}
      data-seed={seed}
      aria-hidden="true"
      className={cx('pointer-events-none [image-rendering:pixelated]', className)}
      style={style}
    />
  )
}
