import {
  DEFAULT_REWARDS,
  FAN_NAME,
  INITIAL_LADDER,
  INITIAL_REQUESTS,
  INITIAL_SUBMISSIONS,
  STREAMER,
} from '../data/train.js';
import { makeTrainState, trainReducer } from './trainReducer.js';

// Root state: which role the tester is playing, the streamer's draft ladder, the published
// ladder the viewer's train uses, the community's art requests and submissions, and the train.
// `sim` holds the prototype controls for the simulated crowd (outcome and speed).

const clone = (x) => JSON.parse(JSON.stringify(x));

export function makeInitialState() {
  return {
    role: 'viewer',
    sim: { outcome: 'auto', speed: 1 },
    ui: { streamerTab: 'live', streamerLevel: null, streamerPanel: 'edit', fanRequestId: null, notice: null },
    draft: clone(INITIAL_LADDER),
    published: clone(INITIAL_LADDER),
    requests: clone(INITIAL_REQUESTS),
    submissions: clone(INITIAL_SUBMISSIONS),
    nextSubId: 1,
    train: makeTrainState(),
  };
}

// ---------- selectors ----------

export const hasUnpublishedChanges = (state) => JSON.stringify(state.draft) !== JSON.stringify(state.published);
export const canPublish = (state) => hasUnpublishedChanges(state) && state.draft.every((l) => l.challenge.trim().length > 0);
export const openRequestFor = (state, level) => state.requests.find((r) => r.level === level && r.status === 'open') || null;
export const submissionsFor = (state, requestId) => state.submissions.filter((s) => s.requestId === requestId);
export const vaultItems = (state) => state.submissions.filter((s) => s.status === 'vault');
export const mySubmissions = (state) => state.submissions.filter((s) => s.mine);
export const openRequests = (state) => state.requests.filter((r) => r.status === 'open');

// Which draft level (if any) uses this submission, and whether that's live yet.
export function pickedLevelOf(state, submissionId) {
  const draftLevel = state.draft.find((l) => l.reward.submissionId === submissionId);
  if (!draftLevel) return null;
  const live = state.published.some((l) => l.level === draftLevel.level && l.reward.submissionId === submissionId);
  return { level: draftLevel.level, live };
}

// ---------- helpers ----------

function setDraftReward(state, level, reward) {
  // Whatever was picked for this level before goes back to the vault.
  const previous = state.draft.find((l) => l.level === level).reward.submissionId;
  return {
    ...state,
    draft: state.draft.map((l) => (l.level === level ? { ...l, reward } : l)),
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

    case 'STREAMER_TAB':
      return { ...state, ui: { ...state.ui, streamerTab: action.tab, notice: null } };

    case 'STREAMER_OPEN_LEVEL':
      return { ...state, ui: { ...state.ui, streamerLevel: action.level, streamerPanel: 'edit', notice: null } };

    case 'STREAMER_PANEL':
      return { ...state, ui: { ...state.ui, streamerPanel: action.panel } };

    case 'SET_CHALLENGE':
      return {
        ...state,
        draft: state.draft.map((l) => (l.level === action.level ? { ...l, challenge: action.text.slice(0, 80) } : l)),
      };

    case 'CREATE_REQUEST': {
      const brief = action.brief.trim();
      if (!brief || openRequestFor(state, action.level)) return state;
      const request = { id: `req-${state.nextSubId}`, level: action.level, kind: action.kind, brief, status: 'open' };
      return {
        ...state,
        nextSubId: state.nextSubId + 1,
        requests: [...state.requests, request],
        ui: { ...state.ui, streamerPanel: 'edit', notice: 'Request posted. Fans can see it now.' },
      };
    }

    case 'PICK_SUBMISSION': {
      const sub = state.submissions.find((s) => s.id === action.submissionId);
      if (!sub) return state;
      let next = setDraftReward(state, action.level, {
        id: `fan-${sub.id}`,
        kind: sub.kind,
        name: sub.name,
        art: sub.art,
        credit: sub.author,
        submissionId: sub.id,
      });
      // Picking for a level closes that level's open request; the other submissions go to the vault.
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
      return {
        ...next,
        ui: { ...next.ui, streamerPanel: 'edit', notice: `Picked ${sub.name} by ${sub.author}. Publish to make it live.` },
      };
    }

    case 'USE_DEFAULT_REWARD':
      return withNotice(setDraftReward(state, action.level, DEFAULT_REWARDS[action.level]), 'Switched to the default reward.');

    case 'PUBLISH': {
      if (!canPublish(state)) return state;
      const published = clone(state.draft);
      const train = makeTrainState([{ id: 'publish', kind: 'system', text: `${STREAMER.name} set up a new Challenge Train` }]);
      return {
        ...state,
        published,
        train,
        ui: { ...state.ui, streamerTab: 'live', streamerLevel: null, notice: 'Published. Your new train is boarding.' },
      };
    }

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
        ui: { ...state.ui, fanRequestId: null, notice: 'Submitted. Mods will review it.' },
      };
    }

    case 'SET_SIM':
      return { ...state, sim: { ...state.sim, ...action.sim } };

    case 'RESET':
      // Everything goes back to the fixtures, but the tester keeps their role and prototype controls.
      return { ...makeInitialState(), role: state.role, sim: state.sim };

    // ----- viewer train -----

    default: {
      const train = trainReducer(state.train, action, state.published);
      return train === state.train ? state : { ...state, train };
    }
  }
}
