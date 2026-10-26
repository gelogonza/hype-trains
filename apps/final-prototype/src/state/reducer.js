import {
  DEFAULT_REWARDS,
  DEFAULT_SETTINGS,
  FAN_NAME,
  INITIAL_LADDER,
  INITIAL_REQUESTS,
  INITIAL_SUBMISSIONS,
} from '../data/climb.js';
import { climbReducer, isLive, makeClimbState, missedLevels } from './climbReducer.js';

// Root state: which role the tester is playing, the streamer's goals and climb settings, the
// community's art requests and submissions, and the climb. `sim` holds the prototype controls for
// the simulated crowd (outcome and speed).
//
// The streamer edits goals and settings in place in Stream Manager. Edits apply straight away,
// except while a climb is live: goals can't change mid-climb.

const clone = (x) => JSON.parse(JSON.stringify(x));

export function makeInitialState() {
  return {
    role: 'viewer',
    sim: { outcome: 'auto', speed: 1 },
    // editingLevel: the goal open in the inline editor. artSheet: { level, panel: 'request' | 'review' }.
    ui: { editingLevel: null, artSheet: null, fanRequestId: null, notice: null },
    goals: clone(INITIAL_LADDER),
    // Climb settings: segment length in minutes, and whether the final goal is a mystery.
    settings: { ...DEFAULT_SETTINGS },
    requests: clone(INITIAL_REQUESTS),
    submissions: clone(INITIAL_SUBMISSIONS),
    nextSubId: 1,
    climb: makeClimbState(DEFAULT_SETTINGS),
  };
}

// ---------- selectors ----------

export const canEditGoals = (state) => !isLive(state.climb);
export const openRequestFor = (state, level) => state.requests.find((r) => r.level === level && r.status === 'open') || null;
export const submissionsFor = (state, requestId) => state.submissions.filter((s) => s.requestId === requestId);
export const vaultItems = (state) => state.submissions.filter((s) => s.status === 'vault');
export const mySubmissions = (state) => state.submissions.filter((s) => s.mine);
export const openRequests = (state) => state.requests.filter((r) => r.status === 'open');

// Which goal (if any) uses this submission.
export function pickedLevelOf(state, submissionId) {
  return state.goals.find((l) => l.reward.submissionId === submissionId)?.level ?? null;
}

// ---------- helpers ----------

function setReward(state, level, reward) {
  // Whatever was picked for this goal before goes back to the vault.
  const previous = state.goals.find((l) => l.level === level).reward.submissionId;
  return {
    ...state,
    goals: state.goals.map((l) => (l.level === level ? { ...l, reward } : l)),
    submissions: state.submissions.map((s) => (s.id === previous ? { ...s, status: 'vault' } : s)),
  };
}

const withNotice = (state, notice) => ({ ...state, ui: { ...state.ui, notice } });

// ---------- reducer ----------

export function reducer(state, action) {
  switch (action.type) {
    case 'SET_ROLE':
      return { ...state, role: action.role, ui: { ...state.ui, notice: null } };

    // ----- streamer -----

    case 'EDIT_GOAL':
      if (action.level && !canEditGoals(state)) return state;
      return { ...state, ui: { ...state.ui, editingLevel: action.level, notice: null } };

    case 'OPEN_ART_SHEET':
      return { ...state, ui: { ...state.ui, artSheet: action.level ? { level: action.level, panel: action.panel } : null, notice: null } };

    case 'SET_SETTING': {
      if (!canEditGoals(state)) return state;
      const settings = { ...state.settings, ...action.settings };
      // A scheduled climb picks up the new length and mystery setting straight away.
      const climb =
        state.climb.phase === 'scheduled'
          ? { ...state.climb, seconds: settings.minutes * 60, timeLeft: settings.minutes * 60, mystery: settings.mystery }
          : state.climb;
      return { ...state, settings, climb };
    }

    case 'SET_CHALLENGE':
      if (!canEditGoals(state)) return state;
      return {
        ...state,
        goals: state.goals.map((l) => (l.level === action.level ? { ...l, challenge: action.text.slice(0, 80) } : l)),
      };

    case 'CREATE_REQUEST': {
      const brief = action.brief.trim();
      if (!brief || openRequestFor(state, action.level)) return state;
      const request = { id: `req-${state.nextSubId}`, level: action.level, kind: action.kind, brief, status: 'open' };
      return {
        ...state,
        nextSubId: state.nextSubId + 1,
        requests: [...state.requests, request],
        ui: { ...state.ui, artSheet: null, notice: 'Request posted' },
      };
    }

    case 'PICK_SUBMISSION': {
      const sub = state.submissions.find((s) => s.id === action.submissionId);
      if (!sub || !canEditGoals(state)) return state;
      let next = setReward(state, action.level, {
        id: `fan-${sub.id}`,
        kind: sub.kind,
        name: sub.name,
        art: sub.art,
        credit: sub.author,
        submissionId: sub.id,
      });
      // Picking for a goal closes that goal's open request; the other submissions go to the vault.
      const request = openRequestFor(next, action.level);
      next = {
        ...next,
        requests: next.requests.map((r) => (r === request ? { ...r, status: 'closed' } : r)),
        submissions: next.submissions.map((s) => {
          if (s.id === sub.id) return { ...s, status: 'picked' };
          if (request && s.requestId === request.id && s.status === 'submitted') return { ...s, status: 'vault' };
          return s;
        }),
      };
      return { ...next, ui: { ...next.ui, artSheet: null, notice: `Picked ${sub.name}` } };
    }

    case 'USE_DEFAULT_REWARD':
      if (!canEditGoals(state)) return state;
      return withNotice(setReward(state, action.level, DEFAULT_REWARDS[action.level]), 'Switched to default');

    // After a climb ends, schedule the next one with the same goals. Goals it didn't reach are
    // marked as carried over, and everyone keeps the rewards they earned.
    case 'NEXT_CLIMB': {
      if (isLive(state.climb)) return state;
      const climb = makeClimbState(state.settings, {
        carried: missedLevels(state.climb, state.goals).map((l) => l.level),
        earnedLevels: state.climb.earnedLevels,
        extraChat: [{ id: 'next', kind: 'system', text: '⛰ Next Community Climb coming up' }],
      });
      return { ...state, climb, ui: { ...state.ui, notice: 'Next climb scheduled' } };
    }

    case 'START_CLIMB':
      // Close the inline editor: goals lock once the climb starts.
      return { ...state, ui: { ...state.ui, editingLevel: null }, climb: climbReducer(state.climb, action, state.goals) };

    // ----- fan -----

    case 'FAN_OPEN_REQUEST':
      return { ...state, ui: { ...state.ui, fanRequestId: action.requestId, notice: null } };

    case 'FAN_SUBMIT': {
      const request = state.requests.find((r) => r.id === action.requestId && r.status === 'open');
      if (!request || !/^[A-Za-z0-9]{3,20}$/.test(action.name)) return state;
      const submission = {
        id: `sub-mine-${state.nextSubId}`,
        requestId: request.id,
        kind: request.kind,
        author: FAN_NAME,
        name: action.name,
        art: action.art,
        shortlisted: false,
        status: 'submitted',
        mine: true,
      };
      return {
        ...state,
        nextSubId: state.nextSubId + 1,
        submissions: [...state.submissions, submission],
        ui: { ...state.ui, fanRequestId: null, notice: 'Submitted' },
      };
    }

    case 'SET_SIM':
      return { ...state, sim: { ...state.sim, ...action.sim } };

    case 'RESET':
      // Everything goes back to the fixtures, but the tester keeps their role and prototype controls.
      return { ...makeInitialState(), role: state.role, sim: state.sim };

    // ----- the climb -----

    default: {
      const climb = climbReducer(state.climb, action, state.goals);
      return climb === state.climb ? state : { ...state, climb };
    }
  }
}
