export type Motif =
  | 'pumpkin'
  | 'snowflake'
  | 'heart'
  | 'rocket'
  | 'crown'
  | 'controller'
  | 'flame'
  | 'star'
  | 'train'
  | 'clover'
  | 'bus'

/** Silhouette of a stamp. Shapes also set how much room it takes on a passport page. */
export type StampShape = 'circle' | 'postage' | 'ticket' | 'pennant' | 'hex' | 'scallop' | 'shield' | 'poster' | 'burst'

/** Some stamps move, some don't. Level 4+ stamps also get a foil shine. */
export type StampAnim = 'none' | 'spin' | 'float' | 'snow' | 'flicker' | 'pulse' | 'twinkle'

export type Role = 'rider' | 'cheerer' | 'subscriber' | 'conductor'

export interface Clip {
  id: string
  title: string
  duration: string
  views: string
  hue: number
}

/** A badge is unique to one Hype Train event on one channel. */
export interface BadgeDef {
  id: string
  eventName: string
  streamer: string
  date: string
  motif: Motif
  shape: StampShape
  anim: StampAnim
  colors: { bg: string; ink: string }
  holders: number
  blurb: string
  clips: Clip[]
  /** Still earnable (the live event) vs. retired forever. */
  live?: boolean
}

export interface EarnedBadge {
  badgeId: string
  /** Highest Hype Train level reached while riding, 1-5. Sets the stamp rim. */
  level: number
  role: Role
}

export interface Viewer {
  id: string
  name: string
  color: string
  avatarHue: number
  homeChannel: string
  memberSince: string
  subTier: 0 | 1 | 2 | 3
  trainsRidden: number
  badges: EarnedBadge[]
}

export interface ChatLine {
  id: string
  viewerId: string
  text: string
  system?: 'contribution' | 'train'
  /** When it was sent (ms). */
  at?: number
}
