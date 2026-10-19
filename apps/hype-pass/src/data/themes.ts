/** Hype Train scenes. The scene follows the game being streamed unless the streamer picks one. */
export type ThemeId = 'spooky' | 'battle'
export type ThemeChoice = 'auto' | ThemeId
export type GameId = 'hollow' | 'fortnite'

export const GAMES: Record<GameId, { name: string; theme: ThemeId; title: string }> = {
  hollow: { name: 'Hollow Lantern', theme: 'spooky', title: '🎃 SPOOKY SPECIAL — Hollow Lantern all night, Hype Train every hour' },
  fortnite: { name: 'Fortnite', theme: 'battle', title: '🚌 STORM NIGHT — squads with chat, Battle Bus every hour' },
}

export interface Theme {
  label: string
  /** What the Hype Train is called in this scene. */
  vehicle: string
  emoji: string
  /** "Station" / "Zone" — what one level is called. */
  unit: string
  stations: string[]
  rewards: string[]
  cleared: string
  arrived: string
  joined: string
  /** The one-night event stamp for this scene. */
  stamp: {
    eventName: string
    motif: 'pumpkin' | 'bus'
    shape: 'scallop' | 'shield'
    anim: 'flicker' | 'float'
    colors: { bg: string; ink: string }
    blurb: string
  }
  hypeLines: string[]
  idleLines: string[]
}

export const THEMES: Record<ThemeId, Theme> = {
  spooky: {
    label: 'Spooky Night',
    vehicle: 'Haunted Express',
    emoji: '🎃',
    unit: 'Station',
    stations: ['Spawn Point', 'Loot Junction', 'Boss Gate', 'Speedrun Summit', 'Victory Terminal'],
    rewards: ['🎃 Jack-o emote unlock', 'Chat goes spooky-purple', 'Streamer picks chat’s dare', 'Animated stamp rim', 'Golden Spooky Special stamp'],
    cleared: 'LEVEL CLEARED!',
    arrived: 'ARRIVED! 🏁',
    joined: '🚃 Your carriage joined the train!',
    stamp: {
      eventName: 'Spooky Special',
      motif: 'pumpkin',
      shape: 'scallop',
      anim: 'flicker',
      colors: { bg: '#ff9f1a', ink: '#3b1a00' },
      blurb: 'The Halloween night run. Ride this train to stamp it before it leaves the station for good.',
    },
    hypeLines: ['ALL ABOARD 🚂', 'CHOO CHOO', 'LETS GOOOO', 'next station!!', 'we are NOT missing this train', 'stamp me 🎃', 'HYPE', 'level 5 or bust', 'I need that pumpkin stamp'],
    idleLines: ['that jump was CLEAN', 'LUL', 'pixel you missed the chest again', 'the music on this level slaps', 'KEKW', 'this boss looks mean', 'Pog', 'hydrate check 💧'],
  },
  battle: {
    label: 'Battle Royale',
    vehicle: 'Battle Bus',
    emoji: '🚌',
    unit: 'Zone',
    stations: ['Jump Zone', 'Loot Lake', 'Storm Edge', 'Final Circle', 'Victory Royale'],
    rewards: ['🦙 Llama emote unlock', 'Chat skydives (glider effect)', 'Chat picks the next drop', 'Animated stamp rim', 'Golden Storm Night stamp'],
    cleared: 'ZONE CLEARED!',
    arrived: 'VICTORY ROYALE! 🏆',
    joined: '🪂 You jumped in — your glider’s in the drop!',
    stamp: {
      eventName: 'Storm Night',
      motif: 'bus',
      shape: 'shield',
      anim: 'float',
      colors: { bg: '#2f7bff', ink: '#06204f' },
      blurb: 'The Battle Bus night drop. Jump in to stamp it before the storm closes for good.',
    },
    hypeLines: ['THANK THE BUS DRIVER 🚌', 'WHERE WE DROPPING', 'JUMP JUMP JUMP', 'storm is closing!!', 'victory royale or bust', 'I need that bus stamp', 'gliders out 🪂', 'HYPE', 'LETS GOOOO'],
    idleLines: ['that edit was CRACKED', 'LUL', 'pixel hot dropping again', 'nice build', 'KEKW', '200 pumped 💀', 'Pog', 'loot the llama!!'],
  },
}

export function resolveTheme(game: GameId, choice: ThemeChoice): ThemeId {
  return choice === 'auto' ? GAMES[game].theme : choice
}

/** Lets a link open straight into a scene: ?game=fortnite or ?scene=battle. */
export function themeFromUrl(): { game?: GameId; themeChoice?: ThemeChoice } {
  const q = new URLSearchParams(location.search)
  const out: { game?: GameId; themeChoice?: ThemeChoice } = {}
  const g = q.get('game')
  if (g === 'fortnite' || g === 'hollow') out.game = g
  const sc = q.get('scene')
  if (sc === 'battle' || sc === 'spooky') out.themeChoice = sc
  return out
}
