// All fixture data for the Challenge Train prototype.
// Nothing here is real: the streamer, fans, chat, submissions and points are seeded fakes.

export const STREAMER = {
  name: 'PixelPaloma',
  avatar: '🦜',
  game: 'Cozy Farm Sim',
  title: 'cozy farm day 🌱 Challenge Train is ON, !train for the ladder',
  viewers: 1284,
};

// The people the tester plays in each role.
export const USER_NAME = 'you';
export const FAN_NAME = '@sketchy_sam';
export const MOD_NAME = '@mod_rae';

// Like the current Hype Train: it departs once enough people support, and each level has a
// countdown that resets when the level is reached. Times are shortened for testing.
export const KICKOFF_NEEDED = 3;
export const LEVEL_SECONDS = 60;
export const HURRY_SECONDS = 15;

// How many contributors the leaderboard lists (the runner train, when on, gives each a carriage).
export const LEADERBOARD_SIZE = 5;

// Cumulative point thresholds, one per level.
export const THRESHOLDS = [1000, 3000, 6000, 10000];

// Placeholder "art". A fan picks an emoji and a background color; no real images are uploaded.
export const ART_EMOJI = ['🐱', '🎤', '🌶️', '🦜', '🍵', '👑', '🎩', '🔥', '🐸', '🥔', '⭐', '🧣'];
export const ART_COLORS = ['#3b1f6e', '#1f4f6e', '#2f5d50', '#6b2f4a', '#5a4a2a', '#4a4a52'];

// Questions that help the streamer write challenges for their own community.
export const COMMUNITY_PROMPTS = [
  'What does your chat always beg you to do?',
  "What's a running joke in your stream?",
  'What would make your chat lose its mind?',
];

// Default rewards, used when no fan art has been picked for a level.
export const DEFAULT_REWARDS = {
  1: { id: 'default-1', kind: 'emote', name: 'TrainWave', art: { emoji: '👋', bg: '#4a4a52' }, credit: null },
  2: { id: 'default-2', kind: 'badge', name: 'Train Rider', art: { emoji: '🚂', bg: '#4a4a52' }, credit: null },
  3: { id: 'default-3', kind: 'emote', name: 'TrainHype', art: { emoji: '🔥', bg: '#4a4a52' }, credit: null },
  4: { id: 'default-4', kind: 'badge', name: 'Hair Raiser', art: { emoji: '🏆', bg: '#4a4a52' }, credit: null, gold: true },
};

// The ladder from the last train. It starts as both the published ladder and the streamer's draft.
export const INITIAL_LADDER = [
  {
    level: 1,
    threshold: THRESHOLDS[0],
    challenge: "Do an impression of chat's favorite NPC",
    reward: { id: 'fan-hypeheart', kind: 'emote', name: 'HypeHeart', art: { emoji: '💜', bg: '#3b1f6e' }, credit: '@kiwi_kat' },
  },
  {
    level: 2,
    threshold: THRESHOLDS[1],
    challenge: 'Sing the cozy crew theme song',
    reward: DEFAULT_REWARDS[2],
  },
  {
    level: 3,
    threshold: THRESHOLDS[2],
    challenge: 'Eat The Pepper live',
    reward: { id: 'fan-pepperface', kind: 'emote', name: 'PepperFace', art: { emoji: '🌶️', bg: '#6b2f4a' }, credit: '@LoafBoss' },
  },
  {
    level: 4,
    threshold: THRESHOLDS[3],
    challenge: "Dye my hair live, in chat's color",
    reward: DEFAULT_REWARDS[4],
  },
];

// What the streamer says when they start each level's challenge on stream.
export const STREAMER_REACTIONS = {
  1: 'Okay chat, you asked for it. NPC impression, here we go 😂',
  2: 'Clearing my throat... this is the cozy crew theme song 🎤',
  3: 'Getting The Pepper. My mom is going to see this. Worth it 🌶️',
  4: "Hair dye is out. You chose this, chat 💜",
};

// What the streamer says when time runs out, by the last level reached.
export const STREAMER_TIMEOUT = {
  0: "Aww, so close! We'll get the train going next time 💜",
  1: "Time's up! Level 1 still counts, NPC impression incoming 😂",
  2: "Time's up! Level 2 it is. The rest comes back next train 💜",
  3: 'SO close to the final level! Hair dye is coming back next train 👀',
};

// Art requests the streamer has opened for the community.
export const INITIAL_REQUESTS = [
  { id: 'req-l2', level: 2, kind: 'badge', brief: "Badge for the 'cozy crew'", status: 'open' },
];

// Fan submissions. Two are shortlisted by a mod (fixture); one is in the vault from an earlier request.
export const INITIAL_SUBMISSIONS = [
  { id: 'sub-1', requestId: 'req-l2', kind: 'badge', author: '@mossy_toad', name: 'CozyCrew', art: { emoji: '🍵', bg: '#2f5d50' }, shortlisted: true, status: 'submitted', mine: false },
  { id: 'sub-2', requestId: 'req-l2', kind: 'badge', author: '@quietfern', name: 'BlanketGang', art: { emoji: '🧣', bg: '#6b2f4a' }, shortlisted: true, status: 'submitted', mine: false },
  { id: 'sub-3', requestId: 'req-l2', kind: 'badge', author: '@pebble_art', name: 'CrewMug', art: { emoji: '🐸', bg: '#5a4a2a' }, shortlisted: false, status: 'submitted', mine: false },
  { id: 'sub-v1', requestId: null, kind: 'emote', author: '@kiwi_kat', name: 'PalomaWave', art: { emoji: '🦜', bg: '#1f4f6e' }, shortlisted: false, status: 'vault', mine: false },
];

// Support options and their fixture point values.
export const SUPPORT_OPTIONS = [
  { id: 'sub-t1', group: 'sub', label: 'Tier 1 Sub', short: 'Tier 1', points: 500 },
  { id: 'sub-t2', group: 'sub', label: 'Tier 2 Sub', short: 'Tier 2', points: 1000 },
  { id: 'sub-t3', group: 'sub', label: 'Tier 3 Sub', short: 'Tier 3', points: 2500 },
  { id: 'gift-1', group: 'gift', label: '1 Gift Sub', short: '×1', points: 500 },
  { id: 'gift-5', group: 'gift', label: '5 Gift Subs', short: '×5', points: 2500, highlight: true },
  { id: 'gift-10', group: 'gift', label: '10 Gift Subs', short: '×10', points: 5000 },
  { id: 'bits-100', group: 'bits', label: '100 Bits', short: '100', points: 100 },
  { id: 'bits-500', group: 'bits', label: '500 Bits', short: '500', points: 500 },
  { id: 'bits-1000', group: 'bits', label: '1000 Bits', short: '1000', points: 1000 },
];

export const SUPPORT_GROUPS = [
  { id: 'sub', title: 'Subscribe', note: 'Sub to the channel' },
  { id: 'gift', title: 'Gift Subs', note: 'Give subs to others in chat' },
  { id: 'bits', title: 'Bits', note: '1 point per Bit' },
];

// Seeded chat from fake viewers.
export const SEED_CHAT = [
  { id: 'seed-1', kind: 'viewer', author: 'mossy_toad', color: '#00c8af', text: 'the train is back lets gooo' },
  { id: 'seed-2', kind: 'viewer', author: 'kiwi_kat', color: '#ff7f50', text: 'my HypeHeart emote is on level 1 again 🥹' },
  { id: 'seed-3', kind: 'viewer', author: 'LoafBoss', color: '#1e90ff', text: 'pepper level when' },
  { id: 'seed-4', kind: 'support', author: 'mossy_toad', color: '#00c8af', text: 'subscribed at Tier 1', hype: 500 },
  { id: 'seed-4b', kind: 'system', text: 'The Challenge Train is boarding! 2 more contributions to start it.' },
  { id: 'seed-5', kind: 'viewer', author: 'quietfern', color: '#9acd32', text: 'first time here, what is this train thing' },
  { id: 'seed-6', kind: 'viewer', author: 'mossy_toad', color: '#00c8af', text: 'hi @quietfern welcome in 👋' },
];

// The simulated crowd: who else supports and chats while the train runs.
export const CROWD = [
  { author: 'mossy_toad', color: '#00c8af' },
  { author: 'kiwi_kat', color: '#ff7f50' },
  { author: 'LoafBoss', color: '#1e90ff' },
  { author: 'quietfern', color: '#9acd32' },
  { author: 'pebble_art', color: '#daa520' },
  { author: 'cozycrow', color: '#ff69b4' },
  { author: 'turnip_tim', color: '#b28dff' },
];

// How often the crowd supports per second, by prototype outcome. "auto" usually stalls around
// Level 2 or 3, so the tester's own support decides whether the train makes it.
export const CROWD_RATE = { auto: 0.09, success: 0.2, fail: 0.035 };

// What the crowd spends, as [option id, weight].
export const CROWD_MIX = [
  ['bits-100', 0.35],
  ['bits-500', 0.25],
  ['sub-t1', 0.25],
  ['gift-1', 0.1],
  ['gift-5', 0.05],
];

export const CROWD_LINES = {
  boarding: ['train is boarding!!', 'get on get on', 'one more sub and we go', 'ALL ABOARD 🚂'],
  running: ['LETS GOOOO', 'CHOO CHOO 🚂', 'we are NOT missing this level', 'pepper level when', 'faster faster', 'HYPE', 'clock is ticking chat!!', '💜💜💜'],
};
