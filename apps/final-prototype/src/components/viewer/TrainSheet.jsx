import BottomSheet from '../BottomSheet.jsx';
import ArtTile from '../ArtTile.jsx';
import Icon from '../Icon.jsx';
import Leaderboard from '../Leaderboard.jsx';
import ChallengeList from '../ChallengeList.jsx';
import { KICKOFF_NEEDED, STREAMER } from '../../data/train.js';
import { climbingLevel, formatTime, isHeld, isLive, progress } from '../../state/trainReducer.js';

// The expanded Challenge Train, like tapping Twitch's Hype Train banner: where the train is, what
// the next level unlocks, ways to contribute, the leaderboard, and every challenge's status.
export default function TrainSheet({ train, ladder, dispatch, onClose }) {
  const next = climbingLevel(train, ladder);
  const { to, pct } = progress(train, ladder);
  const live = isLive(train);
  const open = (tab) => dispatch({ type: 'OPEN_SHEET', sheet: 'support', tab });

  return (
    <BottomSheet title="Challenge Train" onClose={onClose}>
      <div className="ts-status">
        <span className="banner-level">
          <small>LVL</small>
          {next ? next.level : train.levelReached}
        </span>
        <div className="ts-status-body">
          <div className="ts-status-row">
            <b>
              {train.phase === 'boarding'
                ? `${train.boarded} of ${KICKOFF_NEEDED} to start`
                : next
                  ? `${Math.round(pct)}% to Level ${next.level}`
                  : 'All levels unlocked'}
            </b>
            {train.phase === 'running' && (
              <span className="ts-clock">
                <Icon name={isHeld(train) ? 'pause' : 'clock'} size={14} /> {formatTime(train.timeLeft)}
                {isHeld(train) && ' paused'}
              </span>
            )}
          </div>
          <div className="tw-progress">
            <span style={{ width: `${train.phase === 'boarding' ? (train.boarded / KICKOFF_NEEDED) * 100 : pct}%` }} />
          </div>
          {next && train.phase !== 'boarding' && (
            <div className="muted small">
              {train.points.toLocaleString()} / {to.toLocaleString()} hype
            </div>
          )}
        </div>
      </div>

      {next && (
        <section className="ts-card">
          <h3 className="ts-card-title">Level {next.level} unlocks</h3>
          <div className="ts-unlock">
            <span className="ts-unlock-label">Everyone</span>
            <span>
              {next.challenge}
              <span className="muted small"> · {STREAMER.name} picks when to do it</span>
            </span>
          </div>
          <div className="ts-unlock">
            <span className="ts-unlock-label">Supporters</span>
            <span className="ts-unlock-reward">
              <ArtTile art={next.reward.art} kind={next.reward.kind} size={28} gold={next.reward.gold} />
              <span>
                <b>{next.reward.name}</b> {next.reward.kind}
                {next.reward.credit && <span className="fan-credit small"> · art by {next.reward.credit}</span>}
              </span>
            </span>
          </div>
          {live && (
            <div className="ts-actions">
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
        <h3 className="sheet-heading">Top contributors</h3>
        <Leaderboard train={train} />
      </section>

      <section className="sheet-section">
        <h3 className="sheet-heading">Challenges</h3>
        <ChallengeList train={train} ladder={ladder} />
      </section>
    </BottomSheet>
  );
}
