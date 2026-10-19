import { AnimatePresence, MotionConfig } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import type { EarnedBadge } from './data/types'
import { ME_ID } from './data/viewers'
import { DemoPanel } from './components/DemoPanel'
import { HypeTrainBanner } from './components/hypetrain/HypeTrainBanner'
import { StationView } from './components/hypetrain/StationView'
import { About, ChannelHeader } from './components/layout/ChannelHeader'
import { Sidebar } from './components/layout/Sidebar'
import { TopNav } from './components/layout/TopNav'
import { ChatPanel } from './components/layout/ChatPanel'
import { StreamPlayer } from './components/layout/StreamPlayer'
import { ProfileModal } from './components/profile/ProfileModal'
import { BadgeReveal } from './components/BadgeReveal'
import { StationProvider, useStation } from './state/useStation'
import css from './components/app.module.css'

const showDemo = new URLSearchParams(location.search).has('demo')

function Shell() {
  const { state, dispatch } = useStation()
  const [profile, setProfile] = useState<{ id: string; passport?: boolean; highlight?: string } | null>(null)
  const [stationOpen, setStationOpen] = useState(false)

  const openMyPassport = useCallback(() => {
    const highlight = state.newStamp?.badgeId
    setStationOpen(false)
    setProfile({ id: ME_ID, passport: true, highlight })
    dispatch({ type: 'clearStamp' })
  }, [state.newStamp, dispatch])

  // Badge reveal: give the final level-clear burst a beat, then take over the screen.
  const [reveal, setReveal] = useState<EarnedBadge | null>(null)
  useEffect(() => {
    if (!state.newStamp) return
    const earned = state.newStamp
    const t = setTimeout(() => setReveal(earned), 1600)
    return () => clearTimeout(t)
  }, [state.newStamp])
  const closeReveal = useCallback(() => {
    setReveal(null)
    dispatch({ type: 'clearStamp' })
  }, [dispatch])
  const revealToPassport = useCallback(() => {
    setReveal(null)
    openMyPassport()
  }, [openMyPassport])

  const closeProfile = useCallback(() => setProfile(null), [])
  const closeStation = useCallback(() => setStationOpen(false), [])

  return (
    <div className={css.app}>
      <TopNav />
      <div className={css.body}>
        <Sidebar />
        <main className={css.stage}>
          <StreamPlayer />
          <ChannelHeader />
          <About />
        </main>

        <div className={css.side}>
          <ChatPanel
            onName={(id) => setProfile({ id })}
            banner={<HypeTrainBanner onOpen={() => setStationOpen(true)} onPassport={openMyPassport} paused={stationOpen || !!profile} />}
          />
        </div>
      </div>

      <StationView open={stationOpen} onClose={closeStation} onOpenPassport={openMyPassport} />
      <ProfileModal
        viewerId={profile?.id ?? null}
        startOnPassport={profile?.passport}
        highlight={profile?.highlight}
        onClose={closeProfile}
      />

      <AnimatePresence>
        {reveal && <BadgeReveal key="reveal" earned={reveal} state={state} onPassport={revealToPassport} onClose={closeReveal} />}
      </AnimatePresence>

      {showDemo && <DemoPanel />}
    </div>
  )
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <StationProvider>
        <Shell />
      </StationProvider>
    </MotionConfig>
  )
}
