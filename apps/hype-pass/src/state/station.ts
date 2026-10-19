import type { ChatLine, EarnedBadge, Role } from '../data/types'
import { LIVE_BADGE_ID } from '../data/badges'
import { ME_ID, VIEWER_BY_ID } from '../data/viewers'
import { THEMES, resolveTheme, type GameId, type ThemeChoice } from '../data/themes'

export type Phase = 'idle' | 'boarding' | 'running' | 'arrived' | 'delayed'
export type Kind = 'chat' | 'bits100' | 'bits500' | 'sub' | 'gift1' | 'gift5'

export const LEVEL_GOALS = [300, 420, 560, 720, 900]
export const LEVEL_TIME = 45
export const BOARDING_NEEDED = 3
export const BOARDING_TIME = 40
/** Free chat hype can carry at most this share of any level, so it never completes one alone. */
export const FREE_CAP = 0.3

export const STATIONS = [
  { name: 'Spawn Point', reward: '🎃 Jack-o emote unlock' },
  { name: 'Loot Junction', reward: 'Chat goes spooky-purple' },
  { name: 'Boss Gate', reward: 'Streamer picks chat’s dare' },
  { name: 'Speedrun Summit', reward: 'Animated stamp rim' },
  { name: 'Victory Terminal', reward: 'Golden Spooky Special stamp' },
]

export const KIND_INFO: Record<Kind, { points: number; role: Role; verb: string }> = {
  chat: { points: 6, role: 'rider', verb: 'hyped the train' },
  bits100: { points: 15, role: 'cheerer', verb: 'cheered 100 Bits' },
  bits500: { points: 75, role: 'cheerer', verb: 'cheered 500 Bits' },
  sub: { points: 120, role: 'subscriber', verb: 'subscribed' },
  gift1: { points: 120, role: 'conductor', verb: 'gifted a sub' },
  gift5: { points: 500, role: 'conductor', verb: 'gifted 5 subs' },
}

const ROLE_RANK: Record<Role, number> = { rider: 0, cheerer: 1, subscriber: 2, conductor: 3 }

export interface Contribution {
  id: string
  viewerId: string
  kind: Kind
  points: number
}

export type Outcome = 'auto' | 'success' | 'fail'

export interface StationState {
  phase: Phase
  level: number
  points: number
  freePoints: number
  timeLeft: number
  boarded: number
  completed: number
  /** Total contributions this train, used for the crowd-size readout. */
  contribs: number
  feed: Contribution[]
  riders: Record<string, Role>
  chat: ChatLine[]
  myBadges: EarnedBadge[]
  /** Set when a stamp was just earned, so the UI can celebrate it. */
  newStamp: EarnedBadge | null
  levelUpKey: number
  speed: number
  outcome: Outcome
  /** Channel setup: what's being streamed and how the streamer dressed the Hype Train. */
  game: GameId
  themeChoice: ThemeChoice
  /** Object URL of a streamer-uploaded backdrop, if any. */
  backdrop: string | null
  /** Stamps you chose to feature on your Hype Pass (max 5). null = pick automatically. */
  myFeatured: string[] | null
}

export function initialState(myBadges: EarnedBadge[]): StationState {
  return {
    phase: 'idle',
    level: 1,
    points: 0,
    freePoints: 0,
    timeLeft: 0,
    boarded: 0,
    completed: 0,
    contribs: 0,
    feed: [],
    riders: {},
    chat: [],
    myBadges,
    newStamp: null,
    levelUpKey: 0,
    speed: 1,
    outcome: 'auto',
    game: 'hollow',
    themeChoice: 'auto',
    backdrop: null,
    myFeatured: null,
  }
}

export type Action =
  | { type: 'tick' }
  | { type: 'chat'; line: ChatLine }
  | { type: 'contribute'; c: Contribution; line: ChatLine }
  | { type: 'clearStamp' }
  | { type: 'setSpeed'; speed: number }
  | { type: 'setOutcome'; outcome: Outcome }
  | { type: 'reset' }
  | { type: 'setChannel'; game?: GameId; themeChoice?: ThemeChoice; backdrop?: string | null }
  | { type: 'toggleFeatured'; badgeId: string }

const MAX_CHAT = 80

function pushChat(chat: ChatLine[], line: ChatLine) {
  const next = [...chat, line.at ? line : { ...line, at: Date.now() }]
  return next.length > MAX_CHAT ? next.slice(next.length - MAX_CHAT) : next
}

function finish(s: StationState, phase: 'arrived' | 'delayed'): StationState {
  const completed = phase === 'arrived' ? 5 : s.completed
  const myRole = s.riders[ME_ID]
  let myBadges = s.myBadges
  let newStamp: EarnedBadge | null = null
  if (myRole) {
    // Everyone who rode gets the event stamp; how far the train got sets the rim.
    newStamp = { badgeId: LIVE_BADGE_ID, level: Math.max(1, completed), role: myRole }
    myBadges = [newStamp, ...s.myBadges.filter((b) => b.badgeId !== LIVE_BADGE_ID)]
  }
  return { ...s, phase, completed, myBadges, newStamp, timeLeft: 0 }
}

function addPoints(s: StationState, c: Contribution): StationState {
  let { points, freePoints } = s
  let gained = c.points
  if (c.kind === 'chat') {
    const cap = LEVEL_GOALS[s.level - 1] * FREE_CAP
    gained = Math.max(0, Math.min(gained, cap - freePoints))
    freePoints += gained
  }
  points += gained
  let next: StationState = { ...s, points, freePoints }
  const goal = LEVEL_GOALS[s.level - 1]
  if (points >= goal) {
    next = { ...next, completed: s.level, levelUpKey: s.levelUpKey + 1 }
    if (s.level === 5) return finish(next, 'arrived')
    next = {
      ...next,
      level: s.level + 1,
      points: Math.min(points - goal, LEVEL_GOALS[s.level] * 0.5),
      freePoints: 0,
      timeLeft: LEVEL_TIME,
    }
  }
  return next
}

export function reducer(s: StationState, a: Action): StationState {
  switch (a.type) {
    case 'chat':
      return { ...s, chat: pushChat(s.chat, a.line) }

    case 'contribute': {
      if (s.phase === 'arrived' || s.phase === 'delayed') return s
      const prevRole = s.riders[a.c.viewerId]
      const role = KIND_INFO[a.c.kind].role
      const riders = {
        ...s.riders,
        [a.c.viewerId]: prevRole && ROLE_RANK[prevRole] >= ROLE_RANK[role] ? prevRole : role,
      }
      let next: StationState = {
        ...s,
        riders,
        contribs: s.contribs + 1,
        chat: pushChat(s.chat, a.line),
        feed: [a.c, ...s.feed].slice(0, 30),
      }
      if (s.phase === 'idle' || s.phase === 'boarding') {
        // Chat taps don't board the train, but they do count you as a rider.
        if (a.c.kind === 'chat') return next
        const boarded = s.boarded + 1
        if (boarded >= BOARDING_NEEDED) {
          return addPoints({ ...next, boarded, phase: 'running', timeLeft: LEVEL_TIME }, a.c)
        }
        return { ...next, boarded, phase: 'boarding', timeLeft: s.phase === 'idle' ? BOARDING_TIME : s.timeLeft }
      }
      return addPoints(next, a.c)
    }

    case 'tick': {
      if (s.phase === 'running') {
        if (s.timeLeft <= 1) return finish(s, 'delayed')
        return { ...s, timeLeft: s.timeLeft - 1 }
      }
      if (s.phase === 'boarding') {
        if (s.timeLeft <= 1) return { ...s, phase: 'idle', boarded: 0, timeLeft: 0, riders: {}, feed: [], contribs: 0 }
        return { ...s, timeLeft: s.timeLeft - 1 }
      }
      return s
    }

    case 'clearStamp':
      return { ...s, newStamp: null }

    case 'setSpeed':
      return { ...s, speed: a.speed }

    case 'setOutcome':
      return { ...s, outcome: a.outcome }

    case 'toggleFeatured': {
      const current = s.myFeatured ?? featuredStamps(s.myBadges).map((b) => b.badgeId)
      const next = current.includes(a.badgeId)
        ? current.filter((id) => id !== a.badgeId)
        : current.length < MAX_FEATURED
          ? [...current, a.badgeId]
          : current
      return { ...s, myFeatured: next }
    }

    case 'setChannel': {
      const { type: _, ...patch } = a
      return { ...s, ...patch }
    }

    case 'reset': {
      const fresh = initialState(s.myBadges.filter((b) => b.badgeId !== LIVE_BADGE_ID))
      return { ...fresh, chat: s.chat, speed: s.speed, outcome: s.outcome, game: s.game, themeChoice: s.themeChoice, backdrop: s.backdrop, myFeatured: s.myFeatured }
    }
  }
}

export function viewerName(id: string) {
  return VIEWER_BY_ID[id]?.name ?? id
}

export function themeOf(s: Pick<StationState, 'game' | 'themeChoice'>) {
  return THEMES[resolveTheme(s.game, s.themeChoice)]
}

/** Station names follow the scene (Spawn Point… vs Jump Zone…). */
export function stationName(s: Pick<StationState, 'game' | 'themeChoice'>, i: number) {
  return themeOf(s).stations[i]
}

export function rewardFor(s: Pick<StationState, 'game' | 'themeChoice'>, i: number) {
  return themeOf(s).rewards[i]
}

export const MAX_FEATURED = 5

/**
 * The stamps shown on the front of a Hype Pass. Uses the owner's picks when they've made any,
 * otherwise the live event first, then the highest tiers.
 */
export function featuredStamps(badges: EarnedBadge[], chosen?: string[] | null): EarnedBadge[] {
  if (chosen) return chosen.map((id) => badges.find((b) => b.badgeId === id)).filter((b): b is EarnedBadge => !!b).slice(0, MAX_FEATURED)
  return [...badges]
    .sort((a, b) => Number(b.badgeId === LIVE_BADGE_ID) - Number(a.badgeId === LIVE_BADGE_ID) || b.level - a.level)
    .slice(0, MAX_FEATURED)
}
