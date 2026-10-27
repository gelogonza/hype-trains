import BottomSheet from '../BottomSheet.jsx';
import ArtTile from '../ArtTile.jsx';
import ClimbMountain from '../ClimbMountain.jsx';
import GoalList from '../GoalList.jsx';
import Icon from '../Icon.jsx';
import Leaderboard from '../Leaderboard.jsx';
import { formatTime, isHeld, isHidden, isLive, maxLevel, nextGoal, progress } from '../../state/climbReducer.js';

// The full Community Climb, opened from the pinned card: the mountain, where the climb is, what
// the next goal unlocks, ways to contribute, every goal, and the leaderboard. Before the climb
// starts it's a preview, which is where the anticipation builds.
export default function ClimbSheet({ climb, ladder, dispatch, onClose }) {
  const next = nextGoal(climb, ladder);
  const { to } = progress(climb, ladder);
  const scheduled = climb.phase === 'scheduled';
  const open = (tab) => dispatch({ type: 'OPEN_SHEET', sheet: 'support', tab });
  const hidden = next && isHidden(climb, ladder, next);

  return (
    <BottomSheet title="Community Climb" onClose={onClose}>
      <div className="cs-scene">
        <ClimbMountain climb={climb} ladder={ladder} height={150} labels />
      </div>

      <div className="cs-status">
        {scheduled ? (
          <>
            <div className="cs-status-main">
              <b>Starts soon</b>
              <span className="muted small">
                {maxLevel(ladder)} goals · {formatTime(climb.seconds)}
              </span>
            </div>
            <button className={`tw-btn tw-btn--secondary${climb.reminder ? ' is-on' : ''}`} aria-pressed={climb.reminder} onClick={() => dispatch({ type: 'TOGGLE_REMINDER' })}>
              <Icon name="bell" size={14} /> {climb.reminder ? 'On' : 'Notify'}
            </button>
          </>
        ) : (
          <>
            <div className="cs-status-main">
              <b>{next ? `Goal ${next.level} of ${maxLevel(ladder)}` : 'Summit!'}</b>
              {next && (
                <span className="muted small">
                  {climb.points.toLocaleString()} / {to.toLocaleString()}
                </span>
              )}
            </div>
            {isLive(climb) && (
              <span className={`cs-clock${isHeld(climb) ? ' is-held' : ''}`}>
                <Icon name={isHeld(climb) ? 'pause' : 'clock'} size={14} /> {formatTime(climb.timeLeft)}
              </span>
            )}
          </>
        )}
      </div>

      {next && !scheduled && (
        <section className="cs-next">
          <h3 className="cs-next-title">Goal {next.level}</h3>
          <div className="cs-unlock">
            <span className="cs-unlock-label">Everyone</span>
            <span>
              {hidden ? '???' : next.challenge}
            </span>
          </div>
          <div className="cs-unlock">
            <span className="cs-unlock-label">You</span>
            {hidden ? (
              <span>???</span>
            ) : (
              <span className="cs-unlock-reward">
                <ArtTile art={next.reward.art} kind={next.reward.kind} size={28} gold={next.reward.gold} />
                <span>
                  <b>{next.reward.name}</b>
                  {next.reward.credit && <span className="fan-credit small"> by {next.reward.credit}</span>}
                </span>
              </span>
            )}
          </div>
          {isLive(climb) && (
            <div className="cs-actions">
              <button className="tw-btn tw-btn--primary" onClick={() => open('gift')}>
                <Icon name="gift" size={16} /> Gift a Sub
              </button>
              <button className="tw-btn tw-btn--secondary" onClick={() => open('bits')}>
                <Icon name="bits" size={16} /> Cheer
              </button>
            </div>
          )}
        </section>
      )}

      <section className="sheet-section">
        <h3 className="sheet-heading">Goals</h3>
        <GoalList climb={climb} ladder={ladder} />
      </section>

      {!scheduled && (
        <section className="sheet-section">
          <h3 className="sheet-heading">Top climbers</h3>
          <Leaderboard climb={climb} />
        </section>
      )}
    </BottomSheet>
  );
}
