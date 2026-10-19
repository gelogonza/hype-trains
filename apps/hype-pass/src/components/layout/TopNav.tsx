import { useEffect, useRef, useState } from 'react'
import { ME_ID, VIEWER_BY_ID } from '../../data/viewers'
import { setUiTheme, useUiTheme } from '../../state/uiTheme'
import { Avatar } from '../ui/Avatar'
import { Icon } from './Icons'
import css from './desktop.module.css'

/** Twitch's "Dark Theme" switch, as it appears in the user menu. */
export function DarkThemeSwitch() {
  const theme = useUiTheme()
  const on = theme === 'dark'
  return (
    <label className={css.switchRow}>
      <span>Dark Theme</span>
      <button
        role="switch"
        aria-checked={on}
        className={`${css.switch} ${on ? css.switchOn : ''}`}
        onClick={() => setUiTheme(on ? 'light' : 'dark')}
      >
        <i />
      </button>
    </label>
  )
}

function UserMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const me = VIEWER_BY_ID[ME_ID]
  useEffect(() => {
    if (!open) return
    const off = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('pointerdown', off)
    window.addEventListener('keydown', esc)
    return () => {
      window.removeEventListener('pointerdown', off)
      window.removeEventListener('keydown', esc)
    }
  }, [open])
  return (
    <div className={css.userMenu} ref={ref}>
      <button className={css.avatarBtn} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="User menu">
        <Avatar viewer={me} size={30} />
      </button>
      {open && (
        <div className={css.menu} role="menu">
          <div className={css.menuHead}>
            <Avatar viewer={me} size={40} />
            <strong>{me.name}</strong>
          </div>
          <hr />
          <a role="menuitem">Channel</a>
          <a role="menuitem">Creator Dashboard</a>
          <a role="menuitem">Subscriptions</a>
          <a role="menuitem">Settings</a>
          <hr />
          <DarkThemeSwitch />
        </div>
      )}
    </div>
  )
}

/** Twitch web top bar. Desktop only. */
export function TopNav() {
  return (
    <header className={css.nav}>
      <div className={css.navLeft}>
        <span className={css.logo} aria-label="Twitch">
          <Icon name="glitch" size={28} />
        </span>
        <a className={css.navLink}>Following</a>
        <a className={css.navLink}>Browse</a>
        <button className={css.iconBtn} aria-label="More">
          <Icon name="dots" />
        </button>
      </div>
      <form className={css.search} role="search" onSubmit={(e) => e.preventDefault()}>
        <input placeholder="Search" aria-label="Search" />
        <button aria-label="Search">
          <Icon name="search" />
        </button>
      </form>
      <div className={css.navRight}>
        <button className={css.iconBtn} aria-label="Prime">
          <Icon name="crown" />
        </button>
        <button className={css.iconBtn} aria-label="Notifications">
          <Icon name="inbox" />
        </button>
        <button className={css.iconBtn} aria-label="Whispers">
          <Icon name="whisper" />
        </button>
        <button className={css.iconBtn} aria-label="Get Bits">
          <Icon name="bits" />
        </button>
        <button className={css.adFree}>
          <Icon name="crown" size={16} /> GO Ad-Free for Free
        </button>
        <UserMenu />
      </div>
    </header>
  )
}
