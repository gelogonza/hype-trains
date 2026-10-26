import { STREAMER, SUPPORT_OPTIONS } from '../../data/climb.js';
import { challengeStatus, earnedRewards, isHidden, leadClimber, missedLevels } from '../../state/climbReducer.js';
import ArtTile from '../ArtTile.jsx';
import BottomSheet from '../BottomSheet.jsx';
import ClimbMountain from '../ClimbMountain.jsx';

// The end of the climb: the summit, or an early end (time ran out, or the streamer ended it).
// Either way, what the community reached still counts, and unreached goals come back next climb.
// It's a sheet over the stream, not a takeover: the streamer may still be doing challenges.
export default function Summary({ climb, ladder, dispatch, onReset }) {
  const close = () => dispatch({ type: 'TOGGLE_RECAP' });
  const summit = climb.phase === 'complete';
  const reached = ladder.filter((l) => l.level <= climb.levelReached);
  const missed = missedLevels(climb, ladder);
  const supportPoints = climb.donations.reduce((sum, d) => sum + d.points, 0);
  const supportLabels = climb.donations.map((d) => SUPPORT_OPTIONS.find((o) => o.id === d.optionId).label);
  const rewards = earnedRewards(climb, ladder);
  const creators = [...new Set(reached.map((l) => l.reward.credit).filter(Boolean))];
  const lead = leadClimber(climb);

  return (
    <BottomSheet title="Community Climb recap" onClose={close}>
      <div className={`summary${summit ? ' summary--summit' : ''}`}>
        <div className="cs-scene">
          <ClimbMountain climb={climb} ladder={ladder} height={120} labels />
        </div>
        <div className="summary-kicker">
          {summit ? 'Summit reached' : climb.endedBy === 'time' ? "Time's up" : `${STREAMER.name} ended the climb`}
        </div>
        <h2 className="summary-title">
          {summit
            ? `The community unlocked all ${ladder.length} goals 🎉`
            : climb.levelReached
              ? `The community reached Goal ${climb.levelReached}`
              : 'The climb ended before Goal 1'}
        </h2>
        {!summit && (
          <p className="summary-lede">
            Nothing reached is lost: {STREAMER.name} still does every unlocked challenge, and supporters keep their rewards.
          </p>
        )}

        {reached.length > 0 && (
          <section className="summary-section">
            <h3>Unlocked for everyone</h3>
            <ol className="summary-list">
              {reached.map((l) => {
                const status = challengeStatus(climb, l.level);
                return (
                  <li key={l.level}>
                    <span className="muted">Goal {l.level}</span> {l.challenge}
                    <span className={`summary-status summary-status--${status}`}>
                      {status === 'done' ? '✅ Done on stream' : status === 'live' ? '🔴 Happening now' : `⏳ ${STREAMER.name} will do it`}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        <section className="summary-section">
          <h3>Your rewards</h3>
          {rewards.length ? (
            <div className="summary-rewards">
              {rewards.map((r) => (
                <span key={r.id} className={`summary-reward${r.gold ? ' summary-reward--gold' : ''}`}>
                  <ArtTile art={r.art} kind={r.kind} size={20} gold={r.gold} /> {r.name}
                  {r.credit && <span className="muted small"> by {r.credit}</span>}
                </span>
              ))}
            </div>
          ) : (
            <p className="muted">None. Rewards go to people who supported the climb.</p>
          )}
        </section>

        {(lead || creators.length > 0) && (
          <section className="summary-section">
            <h3>Thanks to</h3>
            {lead && (
              <p>
                <b>{lead.me ? 'You' : lead.name}</b>, Lead Climber
              </p>
            )}
            {creators.length > 0 && <p>{creators.join(', ')} for the art</p>}
          </section>
        )}

        <section className="summary-section">
          <h3>What you did</h3>
          <p>
            Supported {climb.donations.length} {climb.donations.length === 1 ? 'time' : 'times'} (+
            {supportPoints.toLocaleString()} hype)
          </p>
          {supportLabels.length > 0 && <p className="muted small">{supportLabels.join(', ')}</p>}
        </section>

        <section className="summary-next">
          <div className="summary-next-kicker">Next climb</div>
          {missed.length > 0 ? (
            <>
              <p className="summary-next-title">Coming back next climb</p>
              <ul className="summary-next-list">
                {missed.map((l) =>
                  isHidden(climb, ladder, l) ? (
                    <li key={l.level}>
                      <span className="goal-reward goal-reward--mystery">?</span>
                      <span>
                        <strong>Goal {l.level}:</strong> still a mystery
                      </span>
                    </li>
                  ) : (
                    <li key={l.level}>
                      <ArtTile art={l.reward.art} kind={l.reward.kind} size={28} gold={l.reward.gold} />
                      <span>
                        <strong>Goal {l.level}:</strong> {l.challenge}
                        <span className="muted small">
                          {' '}· {l.reward.name}
                          {l.reward.credit && ` by ${l.reward.credit}`}
                        </span>
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </>
          ) : (
            <p className="summary-next-title">New goals, with art from the community</p>
          )}
          <button className={`tw-btn tw-btn--secondary tw-btn--lg${climb.reminder ? ' is-on' : ''}`} onClick={() => dispatch({ type: 'TOGGLE_REMINDER' })} aria-pressed={climb.reminder}>
            {climb.reminder ? '✓ We’ll remind you' : '🔔 Remind me about the next climb'}
          </button>
        </section>

        <button className="tw-btn tw-btn--primary tw-btn--lg" onClick={close}>Back to the stream</button>
        <button className="tw-btn tw-btn--secondary tw-btn--lg" onClick={onReset}>Reset prototype</button>
      </div>
    </BottomSheet>
  );
}
