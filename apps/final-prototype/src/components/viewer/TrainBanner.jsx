import { KICKOFF_NEEDED, HURRY_SECONDS, STREAMER } from '../../data/train.js';
import { climbingLevel, formatTime, getLevel, isFinished, isHeld, liveChallenge, maxLevel, progress } from '../../state/trainReducer.js';
import ArtTile from '../ArtTile.jsx';
import Icon from '../Icon.jsx';

// The Challenge Train, pinned to the top of chat where Twitch pins the Hype Train. One banner
// covers every moment: boarding, the level and its clock, a live challenge, a level just
// completed, and the end. Tapping it opens the full panel (or the recap, once it's over).
export default function TrainBanner({ train, ladder, onOpen, compact = false }) {
  const next = climbingLevel(train, ladder);
  const { pct } = progress(train, ladder);
  const held = isHeld(train);
  // A live challenge outranks the level-complete moment: it's what's happening on stream.
  const celebrating = !held && train.activeLevelUp && getLevel(ladder, train.activeLevelUp);
  const live = held && getLevel(ladder, liveChallenge(train));

  let tone = 'running';
  let lvl = next ? next.level : maxLevel(ladder);
  let title = 'Challenge Train';
  let line;
  let right = null;
  let bar = pct;

  if (celebrating) {
    tone = 'celebrate';
    lvl = celebrating.level;
    title = `Level ${celebrating.level} complete!`;
    const earned = train.earnedLevels.includes(celebrating.level);
    const r = celebrating.reward;
    line = earned ? (
      <>
        You got <ArtTile art={r.art} kind={r.kind} size={16} gold={r.gold} /> <b>{r.name}</b>
        {r.credit && <span className="banner-credit"> · art by {r.credit}</span>}
      </>
    ) : (
      <>Unlocked: {celebrating.challenge}</>
    );
    bar = 100;
  } else if (train.phase === 'boarding') {
    tone = 'boarding';
    title = 'Challenge Train is coming!';
    const need = KICKOFF_NEEDED - train.boarded;
    line = `${need} more ${need === 1 ? 'contribution' : 'contributions'} to start it`;
    right = (
      <span className="banner-pips" aria-label={`${train.boarded} of ${KICKOFF_NEEDED}`}>
        {Array.from({ length: KICKOFF_NEEDED }, (_, i) => (
          <i key={i} className={i < train.boarded ? 'on' : ''} />
        ))}
      </span>
    );
    bar = (train.boarded / KICKOFF_NEEDED) * 100;
  } else if (held) {
    tone = 'held';
    title = 'Challenge live on stream';
    line = live.challenge;
    right = (
      <span className="banner-clock">
        <Icon name="pause" size={14} /> {formatTime(train.timeLeft)}
      </span>
    );
  } else if (train.phase === 'running') {
    line = (
      <>
        <span className="banner-dim">Next:</span> {next.challenge}
      </>
    );
    right = (
      <span className={`banner-clock${train.timeLeft <= HURRY_SECONDS ? ' banner-clock--hurry' : ''}`}>
        <Icon name="clock" size={14} /> {formatTime(train.timeLeft)}
      </span>
    );
  } else if (train.phase === 'complete') {
    tone = 'done';
    title = 'Challenge Train complete!';
    line = `All ${maxLevel(ladder)} levels unlocked · see recap`;
  } else {
    tone = 'ended';
    lvl = train.levelReached;
    title = train.levelReached ? `Challenge Train ended at Level ${train.levelReached}` : 'Challenge Train ended';
    line = 'Missed levels come back next train · see recap';
  }

  const finished = isFinished(train);
  const label = finished ? 'Open the Challenge Train recap' : 'Open the Challenge Train';

  return (
    <button
      className={`train-banner train-banner--${tone}${compact ? ' train-banner--compact' : ''}`}
      onClick={onOpen}
      disabled={!onOpen}
      aria-label={`${title}. ${label}`}
    >
      <span className="banner-level" aria-hidden="true">
        <small>LVL</small>
        {lvl}
      </span>
      <span className="banner-body">
        <span className="banner-title">
          <Icon name="train" size={14} /> {title}
        </span>
        <span className="banner-line">{line}</span>
      </span>
      <span className="banner-right">
        {right}
        {onOpen && <Icon name="chevron" size={16} />}
      </span>
      <span className="banner-track" aria-hidden="true">
        <span className="banner-fill" style={{ width: `${bar}%` }} />
      </span>
      {held && <span className="sr-only">{STREAMER.name} is doing the challenge. The timer is paused.</span>}
    </button>
  );
}
