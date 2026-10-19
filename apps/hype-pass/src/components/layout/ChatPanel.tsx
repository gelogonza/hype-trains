import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { BADGES, LIVE_BADGE_ID, STREAMER } from '../../data/badges'
import type { ChatLine, EarnedBadge } from '../../data/types'
import { ME_ID, VIEWER_BY_ID } from '../../data/viewers'
import { useStation } from '../../state/useStation'
import { ChatBadge } from '../ui/Stamp'
import { Icon } from './Icons'
import css from './layout.module.css'

/** The one stamp a viewer shows in this channel's chat: the live event first, then their best ride here. */
function featured(badges: EarnedBadge[]): EarnedBadge | undefined {
  const live = badges.find((b) => b.badgeId === LIVE_BADGE_ID)
  if (live) return live
  return badges
    .filter((b) => BADGES[b.badgeId].streamer === STREAMER)
    .sort((a, b) => b.level - a.level)[0]
}

function Message({ line, myBadges, onName }: { line: ChatLine; myBadges: EarnedBadge[]; onName: (id: string) => void }) {
  const v = VIEWER_BY_ID[line.viewerId]
  const badge = featured(v.id === ME_ID ? myBadges : v.badges)
  const time = line.at ? new Date(line.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
  return (
    <li className={line.system ? css.msgSystem : css.msg}>
      {time && <span className={css.time}>{time}</span>}
      {badge && (
        <span className={css.msgBadge}>
          <ChatBadge earned={badge} />
        </span>
      )}
      {v.subTier > 0 && (
        <span className={css.subBadge} title={`Tier ${v.subTier} sub`}>
          {v.subTier}
        </span>
      )}
      <button className={css.name} style={{ color: v.color }} onClick={() => onName(v.id)}>
        {v.name}
      </button>
      <span className={css.text}>
        {line.system ? ' ' : ': '}
        {line.text}
      </span>
    </li>
  )
}

/** Top gifters pinned at the top of chat (seeded totals + gifts this train). */
function useTopGifters() {
  const { state } = useStation()
  return useMemo(() => {
    const base: Record<string, number> = { v1: 201, v7: 170, v3: 96 }
    for (const c of state.feed) if (c.kind === 'gift5') base[c.viewerId] = (base[c.viewerId] ?? 0) + 5
    return Object.entries(base)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
  }, [state.feed])
}

export function ChatPanel({ onName, banner }: { onName: (id: string) => void; banner?: ReactNode }) {
  const { state, sendChat } = useStation()
  const list = useRef<HTMLUListElement>(null)
  const [draft, setDraft] = useState('')
  const pinned = useRef(true)
  const gifters = useTopGifters()

  useEffect(() => {
    const el = list.current
    if (el && pinned.current) el.scrollTop = el.scrollHeight
  }, [state.chat])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    sendChat(text)
    setDraft('')
    pinned.current = true
  }

  const aboard = state.phase === 'running' || state.phase === 'boarding'

  return (
    <section className={css.chat} aria-label="Stream chat">
      <header className={css.chatHead}>
        <button className={css.iconBtnSm} aria-label="Collapse chat">
          <Icon name="collapse" />
        </button>
        <span>Stream Chat</span>
        <button className={css.iconBtnSm} aria-label="Community">
          <Icon name="users" />
        </button>
      </header>
      <div className={css.gifters} aria-label="Top gifters">
        {gifters.map(([id, n], i) => (
          <button key={id} className={css.gifter} onClick={() => onName(id)}>
            <span>{['👑', '🥈', '🥉'][i]}</span>
            <b style={{ color: VIEWER_BY_ID[id].color }}>{VIEWER_BY_ID[id].name}</b>
            <Icon name="gift" size={14} /> {n}
          </button>
        ))}
      </div>
      {banner}
      <ul
        ref={list}
        className={css.chatList}
        onScroll={(e) => {
          const el = e.currentTarget
          pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40
        }}
      >
        <li className={css.chatWelcome}>
          Welcome to the chat room! Tap any name to see their <strong>Hype Pass</strong>.
        </li>
        {state.chat.map((l) => (
          <Message key={l.id} line={l} myBadges={state.myBadges} onName={onName} />
        ))}
      </ul>
      <form className={css.chatForm} onSubmit={submit}>
        <div className={css.inputRow}>
          {aboard && (
            <button type="button" className={css.aboardChip} onClick={() => sendChat('ALL ABOARD 🚂')}>
              🚂 All aboard
            </button>
          )}
          <div className={css.inputWrap}>
            <input
              className={css.chatInput}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={aboard ? 'Chat to ride the train (free)…' : 'Send a message'}
              aria-label="Send a message"
              enterKeyHint="send"
            />
            <span className={css.emote} aria-hidden>
              <Icon name="emote" />
            </span>
          </div>
          <button className={css.chatSend} type="submit" aria-label="Send">
            ➤
          </button>
        </div>
        <div className={css.chatFoot}>
          <span className={css.points}>
            <Icon name="points" size={18} /> 1,240
          </span>
          <button type="button" className={css.iconBtnSm} aria-label="Chat settings">
            <Icon name="gear" />
          </button>
          <button type="submit" className={css.chatBtn}>
            Chat
          </button>
        </div>
      </form>
    </section>
  )
}
