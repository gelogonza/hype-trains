import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { WIDE, useMedia } from './useMedia'
import css from './Sheet.module.css'

interface Props {
  open: boolean
  onClose: () => void
  label: string
  children: ReactNode
  /** Visual skin of the panel. */
  tone?: 'dark' | 'station'
  tall?: boolean
  /** No panel at all: the content (e.g. the Hype Pass card) floats over the backdrop, centered. */
  bare?: boolean
}

/** Bottom sheet on phones (drag down to dismiss); centered dialog on wider screens. */
export function Sheet({ open, onClose, label, children, tone = 'dark', tall, bare }: Props) {
  const wide = useMedia(WIDE) || !!bare
  const drag = useDragControls()
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    panel.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className={`${css.root} ${bare ? css.rootCenter : ''}`}>
          <motion.div
            className={css.backdrop}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            tabIndex={-1}
            className={`${css.panel} ${bare ? css.bare : css[tone]} ${tall ? css.tall : ''} ${tone === 'station' ? 'theme-dark' : ''}`}
            initial={bare ? { opacity: 0, scale: 0.8, y: 40 } : wide ? { opacity: 0, scale: 0.94, y: 20 } : { y: '100%' }}
            animate={wide ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
            exit={wide ? { opacity: 0, scale: 0.96, y: 10 } : { y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            drag={wide ? false : 'y'}
            dragListener={false}
            dragControls={drag}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 600) onClose()
            }}
          >
            {!wide && (
              <div className={css.grabber} onPointerDown={(e) => drag.start(e)} aria-hidden>
                <span />
              </div>
            )}
            <button className={css.close} onClick={onClose} aria-label="Close">
              ✕
            </button>
            <div className={css.body}>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
