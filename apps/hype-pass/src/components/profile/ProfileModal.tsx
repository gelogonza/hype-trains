import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { LIVE_BADGE_ID } from '../../data/badges'
import type { EarnedBadge } from '../../data/types'
import { ME_ID, VIEWER_BY_ID } from '../../data/viewers'
import { MAX_FEATURED, featuredStamps } from '../../state/station'
import { useStation } from '../../state/useStation'
import { Sheet } from '../ui/Sheet'
import { BadgeDetail } from './BadgeDetail'
import { HoloCard } from './HoloCard'
import { Passport } from './Passport'
import { Ticket } from './Ticket'
import css from './profile.module.css'

interface Props {
  viewerId: string | null
  onClose: () => void
  /** Open straight to the passport (e.g. right after earning a stamp). */
  startOnPassport?: boolean
  highlight?: string
}

export function ProfileModal({ viewerId, onClose, startOnPassport, highlight }: Props) {
  const { state, contribute, dispatch } = useStation()
  const [following, setFollowing] = useState(false)
  const [gifted, setGifted] = useState(false)
  // Gifting from someone's pass is a real gift sub, so it also pushes a running Hype Train.
  const gift = () => {
    if (state.phase === 'running' || state.phase === 'boarding') contribute('gift1')
    setGifted(true)
    setTimeout(() => setGifted(false), 2000)
  }
  const [flipped, setFlipped] = useState(false)
  const [detail, setDetail] = useState<EarnedBadge | null>(null)
  // The card is dealt in with a spin when the pass opens, not when coming back from a stamp.
  const [intro, setIntro] = useState(true)

  useEffect(() => {
    setFlipped(!!startOnPassport)
    setDetail(null)
    setIntro(true)
    setFollowing(false)
  }, [viewerId, startOnPassport])

  const openDetail = (b: EarnedBadge) => {
    setIntro(false)
    setDetail(b)
  }

  const viewer = viewerId ? VIEWER_BY_ID[viewerId] : null
  const badges = viewer ? (viewer.id === ME_ID ? state.myBadges : viewer.badges) : []
  const isMe = viewer?.id === ME_ID
  const featured = featuredStamps(badges, isMe ? state.myFeatured : null)
  // Your own pass counts the train you just rode.
  const shown =
    viewer && isMe && badges.some((b) => b.badgeId === LIVE_BADGE_ID)
      ? { ...viewer, trainsRidden: viewer.trainsRidden + 1 }
      : viewer

  const actions = isMe ? (
    <p className={css.cardNote}>Your pass. Every Hype Train you ride stamps it.</p>
  ) : (
    <>
      <button className={css.cardPrimary} onClick={gift}>
        {gifted ? '🎉 Gifted!' : '🎁 Gift a Sub'}
      </button>
      <button className={css.cardBtn}>Whisper</button>
      <button className={`${css.cardBtn} ${following ? css.cardOn : ''}`} onClick={() => setFollowing((f) => !f)} aria-pressed={following}>
        {following ? '✓ Following' : '♥ Follow'}
      </button>
    </>
  )

  return (
    <Sheet open={!!viewer} onClose={onClose} label={viewer ? `${viewer.name}'s Hype Pass` : 'Hype Pass'} bare>
      {viewer && (
        <div className={css.wrap}>
          <AnimatePresence mode="wait" initial={false}>
            {detail ? (
              <motion.div
                key="detail"
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 40, opacity: 0 }}
                transition={{ duration: 0.22 }}
              >
                <BadgeDetail
                  earned={detail}
                  ownerName={viewer.name}
                  onBack={() => setDetail(null)}
                  feature={
                    isMe
                      ? {
                          on: featured.some((f) => f.badgeId === detail.badgeId),
                          full: featured.length >= MAX_FEATURED,
                          toggle: () => dispatch({ type: 'toggleFeatured', badgeId: detail.badgeId }),
                        }
                      : undefined
                  }
                />
              </motion.div>
            ) : (
              <motion.div
                key="card"
                initial={{ x: -40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -40, opacity: 0 }}
                transition={{ duration: 0.22 }}
              >
                <HoloCard
                  flipped={flipped}
                  onFlip={setFlipped}
                  intro={intro}
                  front={<Ticket viewer={shown!} badges={badges} featured={featured} isMe={isMe} onFlip={() => setFlipped(true)} onOpenStamp={openDetail} actions={actions} />}
                  back={
                    <Passport
                      viewer={viewer}
                      badges={badges}
                      onFlip={() => setFlipped(false)}
                      onOpen={openDetail}
                      highlight={highlight}
                    />
                  }
                />
                <p className={css.gesture}>Tap to flip · drag or flick to spin</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </Sheet>
  )
}
