import { STREAMER, SUPPORT_OPTIONS } from '../../data/train.js';
import { challengeStatus, earnedRewards, missedLevels } from '../../state/trainReducer.js';
import ArtTile from '../ArtTile.jsx';
import BottomSheet from '../BottomSheet.jsx';

// The end of the train: the happy path (every level) or the recovery path (time ran out).
// Either way, what the group reached still counts, and the next train is teased.
// It's a sheet over the stream, not a takeover: the streamer may still be doing challenges.
export default function Summary({ train, ladder, dispatch, onReset }) {
  const close = () => dispatch({ type: 'TOGGLE_RECAP' });
  const complete = train.phase === 'complete';
  const reached = ladder.filter((l) => l.level <= train.levelReached);
  const missed = missedLevels(train, ladder);
  const supportPoints = train.donations.reduce((sum, d) => sum + d.points, 0);
  const supportLabels = train.donations.map((d) => SUPPORT_OPTIONS.find((o) => o.id === d.optionId).label);
  const rewards = earnedRewards(train, ladder);
  const creators = [...new Set(reached.map((l) => l.reward.credit).filter(Boolean))];

  return (
    <BottomSheet title="Challenge Train recap" onClose={close}>
      <div className={`summary${complete ? '' : ' summary--ended'}`}>
        <div className="summary-kicker">{complete ? 'Challenge Train complete' : "Time's up"}</div>
        <h2 className="summary-title">
          {complete
            ? `You all made it to Level ${ladder.length} 🎉`
            : train.levelReached
              ? `The train stopped at Level ${train.levelReached}`
              : 'The train stopped before Level 1'}
        </h2>
        {!complete && (
          <p className="summary-lede">
            {train.levelReached
              ? 'Nothing reached is lost. The streamer still owes every challenge below, and supporters keep their rewards.'
              : 'Nobody loses anything. The whole ladder comes back next train.'}
          </p>
        )}

        {reached.length > 0 && (
          <section className="summary-section">
            <h3>The group unlocked</h3>
            <ol className="summary-list">
              {reached.map((l) => {
                const status = challengeStatus(train, l.level);
                return (
                  <li key={l.level}>
                    <span className="muted">Lv {l.level}</span> {l.challenge}
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
            <p className="muted">None. Rewards go to people who supported the train.</p>
          )}
        </section>

        {creators.length > 0 && (
          <section className="summary-section">
            <h3>Made by the community</h3>
            <p>Thanks to {creators.join(', ')} for the art.</p>
          </section>
        )}

        <section className="summary-section">
          <h3>What you did</h3>
          <p>
            Supported {train.donations.length} {train.donations.length === 1 ? 'time' : 'times'} (+
            {supportPoints.toLocaleString()} hype)
          </p>
          {supportLabels.length > 0 && <p className="muted small">{supportLabels.join(', ')}</p>}
        </section>

        <section className="summary-next">
          <div className="summary-next-kicker">Next train</div>
          {missed.length > 0 ? (
            <>
              <p className="summary-next-title">Still waiting at the station</p>
              <ul className="summary-next-list">
                {missed.map((l) => (
                  <li key={l.level}>
                    <ArtTile art={l.reward.art} kind={l.reward.kind} size={28} gold={l.reward.gold} />
                    <span>
                      <strong>Lv {l.level}:</strong> {l.challenge}
                      <span className="muted small">
                        {' '}· {l.reward.name}
                        {l.reward.credit && ` by ${l.reward.credit}`}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="summary-next-title">A new ladder of challenges, with art from the community</p>
          )}
          <button className={`tw-btn tw-btn--secondary tw-btn--lg${train.reminder ? ' is-on' : ''}`} onClick={() => dispatch({ type: 'TOGGLE_REMINDER' })} aria-pressed={train.reminder}>
            {train.reminder ? '✓ We’ll remind you' : '🔔 Remind me when it’s back'}
          </button>
        </section>

        <button className="tw-btn tw-btn--primary tw-btn--lg" onClick={close}>Back to the stream</button>
        <button className="tw-btn tw-btn--secondary tw-btn--lg" onClick={onReset}>Reset prototype</button>
      </div>
    </BottomSheet>
  );
}
