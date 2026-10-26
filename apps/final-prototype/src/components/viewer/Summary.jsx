import { challengeStatus, earnedRewards, isHidden, leadClimber, missedLevels } from '../../state/climbReducer.js';
import ArtTile from '../ArtTile.jsx';
import BottomSheet from '../BottomSheet.jsx';
import ClimbMountain from '../ClimbMountain.jsx';

const STATUS = { owed: '⏳', live: '🔴', done: '✅' };

// The end of the climb: the summit, or an early end. What the community reached still counts,
// and unreached goals come back next climb. It's a sheet over the stream, not a takeover, and
// kept to as few words as possible.
export default function Summary({ climb, ladder, dispatch, onReset }) {
  const close = () => dispatch({ type: 'TOGGLE_RECAP' });
  const summit = climb.phase === 'complete';
  const reached = ladder.filter((l) => l.level <= climb.levelReached);
  const missed = missedLevels(climb, ladder);
  const rewards = earnedRewards(climb, ladder);
  const lead = leadClimber(climb);

  return (
    <BottomSheet title="Community Climb" onClose={close}>
      <div className={`summary${summit ? ' summary--summit' : ''}`}>
        <div className="cs-scene">
          <ClimbMountain climb={climb} ladder={ladder} height={120} labels />
        </div>
        <h2 className="summary-title">
          {summit ? 'Summit! 🎉' : climb.levelReached ? `Reached Goal ${climb.levelReached}` : 'No goals this time'}
        </h2>
        {lead && (
          <p className="summary-lede">
            ⛰ Lead Climber: <b>{lead.me ? 'you' : lead.name}</b>
          </p>
        )}

        {reached.length > 0 && (
          <section className="summary-section">
            <h3>Unlocked</h3>
            <ol className="summary-list">
              {reached.map((l) => (
                <li key={l.level}>
                  <span aria-label={challengeStatus(climb, l.level)}>{STATUS[challengeStatus(climb, l.level)]}</span> {l.challenge}
                </li>
              ))}
            </ol>
          </section>
        )}

        {rewards.length > 0 && (
          <section className="summary-section">
            <h3>You got</h3>
            <div className="summary-rewards">
              {rewards.map((r) => (
                <span key={r.id} className={`summary-reward${r.gold ? ' summary-reward--gold' : ''}`}>
                  <ArtTile art={r.art} kind={r.kind} size={20} gold={r.gold} /> {r.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {missed.length > 0 && (
          <section className="summary-next">
            <div className="summary-next-kicker">Next climb</div>
            <ul className="summary-next-list">
              {missed.map((l) =>
                isHidden(climb, ladder, l) ? (
                  <li key={l.level}>
                    <span className="goal-reward goal-reward--mystery">?</span> Mystery
                  </li>
                ) : (
                  <li key={l.level}>
                    <ArtTile art={l.reward.art} kind={l.reward.kind} size={28} gold={l.reward.gold} /> {l.challenge}
                  </li>
                ),
              )}
            </ul>
            <button className={`tw-btn tw-btn--secondary tw-btn--lg${climb.reminder ? ' is-on' : ''}`} onClick={() => dispatch({ type: 'TOGGLE_REMINDER' })} aria-pressed={climb.reminder}>
              {climb.reminder ? '✓ Reminder on' : '🔔 Remind me'}
            </button>
          </section>
        )}

        <button className="tw-btn tw-btn--primary tw-btn--lg" onClick={close}>Back to stream</button>
        <button className="tw-btn tw-btn--secondary tw-btn--lg" onClick={onReset}>Reset prototype</button>
      </div>
    </BottomSheet>
  );
}
