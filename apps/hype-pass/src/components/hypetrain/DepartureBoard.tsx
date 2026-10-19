import { AnimatePresence, motion } from 'framer-motion'
import css from './hypetrain.module.css'

/** One split-flap cell: flips whenever its text changes. */
function Flap({ text, wide }: { text: string; wide?: boolean }) {
  return (
    <span className={`${css.flap} ${wide ? css.flapWide : ''}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={text}
          initial={{ rotateX: -90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          exit={{ rotateX: 90, opacity: 0 }}
          transition={{ duration: 0.28 }}
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

export function fmt(sec: number) {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
}

export function DepartureBoard({ rows }: { rows: { label: string; value: string; time?: string }[] }) {
  return (
    <div className={css.board} role="status" aria-live="polite">
      {rows.map((r) => (
        <div key={r.label} className={css.boardRow}>
          <span className={css.boardLabel}>{r.label}</span>
          <Flap text={r.value.toUpperCase()} wide />
          {r.time !== undefined && <Flap text={r.time} />}
        </div>
      ))}
    </div>
  )
}
