import ArtTile from '../ArtTile.jsx';
import Icon from '../Icon.jsx';
import { COMMUNITY_PROMPTS } from '../../data/climb.js';
import { canEditGoals, openRequestFor, submissionsFor, vaultItems } from '../../state/reducer.js';
import { challengeStatus, isHeld, isHidden } from '../../state/climbReducer.js';

const ACTION = {
  owed: { label: 'Start', icon: 'play' },
  live: { label: 'Done', icon: 'check' },
};

// One goal in Stream Manager: its challenge (with Start / Done while the climb runs), its reward
// with the fan art action, and an inline editor. Goals can only be edited while no climb is live.
export default function GoalRow({ state, dispatch, level }) {
  const { climb, goals } = state;
  const editing = state.ui.editingLevel === level.level;
  const editable = canEditGoals(state);
  const status = challengeStatus(climb, level.level);
  const held = isHeld(climb);
  const request = openRequestFor(state, level.level);
  const count = request ? submissionsFor(state, request.id).length : 0;
  const vault = vaultItems(state);
  const openArt = (panel) => dispatch({ type: 'OPEN_ART_SHEET', level: level.level, panel });
  const action =
    status === 'owed' && !held ? { type: 'START_CHALLENGE', level: level.level } : status === 'live' ? { type: 'FINISH_CHALLENGE', level: level.level } : null;

  return (
    <li className={`goal-row goal-row--${status}${editing ? ' is-editing' : ''}`}>
      <div className="goal-row-top">
        <span className="goal-row-level">Goal {level.level}</span>
        <span className="muted small">{level.threshold.toLocaleString()} hype</span>
        {isHidden(climb, goals, level) && <span className="tag tag--kind">Mystery</span>}
        {status === 'live' && <span className="sm-live">LIVE</span>}
        {status === 'done' && <span className="goal-row-done">✅</span>}
        <span className="goal-row-actions">
          {ACTION[status] && (
            <button className={`tw-btn ${status === 'live' ? 'tw-btn--danger' : 'tw-btn--primary'}`} disabled={!action} onClick={() => dispatch(action)}>
              <Icon name={ACTION[status].icon} size={14} /> {ACTION[status].label}
            </button>
          )}
          {editable && (
            <button className="tw-btn tw-btn--secondary" aria-expanded={editing} onClick={() => dispatch({ type: 'EDIT_GOAL', level: editing ? null : level.level })}>
              {editing ? (
                'Close'
              ) : (
                <>
                  <Icon name="pencil" size={13} /> Edit
                </>
              )}
            </button>
          )}
        </span>
      </div>

      {editing ? (
        <div className="goal-row-editor">
          <textarea
            className="text-input"
            rows={2}
            maxLength={80}
            value={level.challenge}
            placeholder="Write it the way you'd say it on stream"
            aria-label={`Challenge for goal ${level.level}`}
            onChange={(e) => dispatch({ type: 'SET_CHALLENGE', level: level.level, text: e.target.value })}
          />
          <div className="char-count">{level.challenge.length}/80</div>
          <details className="prompts">
            <summary>Ideas</summary>
            <ul>
              {COMMUNITY_PROMPTS.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </details>
        </div>
      ) : (
        <div className="goal-row-challenge">{level.challenge.trim() || <span className="warn">No challenge yet</span>}</div>
      )}

      <div className="goal-row-reward">
        <ArtTile art={level.reward.art} kind={level.reward.kind} size={26} gold={level.reward.gold} />
        <span className="goal-row-reward-text">
          <span>{level.reward.name}</span>
          <span className={`small${level.reward.credit ? ' fan-credit' : ' muted'}`}>
            {level.reward.credit ? `by ${level.reward.credit}` : 'Default'}
          </span>
        </span>
        {editing && level.reward.credit && (
          <button className="tw-btn tw-btn--secondary" onClick={() => dispatch({ type: 'USE_DEFAULT_REWARD', level: level.level })}>
            Use default
          </button>
        )}
        {editing && !request && vault.length > 0 && (
          <button className="tw-btn tw-btn--secondary" onClick={() => openArt('review')}>
            Vault ({vault.length})
          </button>
        )}
        {request ? (
          <button className={`tw-btn ${count ? 'tw-btn--primary' : 'tw-btn--secondary'}`} onClick={() => openArt('review')}>
            {count ? `Review (${count})` : 'Requested'}
          </button>
        ) : (
          <button className="tw-btn tw-btn--secondary" onClick={() => openArt('request')}>
            Request art
          </button>
        )}
      </div>
    </li>
  );
}
