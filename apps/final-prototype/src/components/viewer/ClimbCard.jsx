import { HURRY_SECONDS, STREAMER } from '../../data/climb.js';
import {
  formatTime,
  getLevel,
  isAlmost,
  isFinished,
  isHeld,
  isHidden,
  liveChallenge,
  maxLevel,
  nextGoal,
  progress,
} from '../../state/climbReducer.js';
import ArtTile from '../ArtTile.jsx';
import ClimbMountain from '../ClimbMountain.jsx';
import Icon from '../Icon.jsx';

// The Community Climb, pinned to the top of chat. A mountain scene in Twitch's palette (not the
// Hype Train's bar) that covers every moment: scheduled, the climb and its clock, the push
// to a goal, a live challenge, a goal unlocked, the mystery reveal, the summit and the end.
// Tapping it opens the full climb (or the recap, once it's over).
export default function ClimbCard({ climb, ladder, onOpen }) {
  const n = maxLevel(ladder);
  const next = nextGoal(climb, ladder);
  const { to } = progress(climb, ladder);
  const moment = climb.activeMoment;
  const held = isHeld(climb);

  let tone = climb.phase;
  let status;
  let clock = null;

  if (climb.phase === 'scheduled') {
    status = (
      <b>
        {n} goals · {formatTime(climb.seconds)}
      </b>
    );
    clock = <span className="cc-pill">Soon</span>;
  } else if (held) {
    tone = 'held';
    status = (
      <>
        <b>Live:</b> {getLevel(ladder, liveChallenge(climb)).challenge}
      </>
    );
  } else if (moment?.type === 'unlock' || moment?.type === 'summit') {
    tone = 'celebrate';
    const level = getLevel(ladder, moment.level);
    const r = level.reward;
    status = climb.earnedLevels.includes(level.level) ? (
      <>
        <b>Goal {level.level} unlocked!</b> You got <ArtTile art={r.art} kind={r.kind} size={14} gold={r.gold} /> {r.name}
      </>
    ) : (
      <>
        <b>Goal {level.level} unlocked!</b> {level.challenge}
      </>
    );
  } else if (moment?.type === 'reveal') {
    tone = 'reveal';
    status = (
      <>
        <b>Revealed:</b> {getLevel(ladder, moment.level).challenge}
      </>
    );
  } else if (climb.phase === 'live') {
    if (isAlmost(climb, ladder)) {
      tone = 'almost';
      status = (
        <>
          <b>Almost!</b> {(to - climb.points).toLocaleString()} to go
        </>
      );
    } else {
      status = (
        <>
          <b>Goal {next.level}:</b> {isHidden(climb, ladder, next) ? '???' : next.challenge}
        </>
      );
    }
  } else if (climb.phase === 'complete') {
    status = (
      <>
        <b>Summit!</b>
      </>
    );
  } else {
    status = (
      <>
        <b>{climb.levelReached ? `Reached Goal ${climb.levelReached}` : 'Climb over'}</b>
      </>
    );
  }

  if (climb.phase === 'live') {
    clock = (
      <span className={`cc-pill${held ? ' cc-pill--held' : climb.timeLeft <= HURRY_SECONDS ? ' cc-pill--hurry' : ''}`}>
        <Icon name={held ? 'pause' : 'clock'} size={13} /> {formatTime(climb.timeLeft)}
      </span>
    );
  }

  const label = isFinished(climb) ? 'Open the Community Climb recap' : 'Open the Community Climb';

  return (
    <button className={`climb-card climb-card--${tone}`} onClick={onOpen} disabled={!onOpen} aria-label={label}>
      <span className="cc-head">
        <span className="cc-title">
          <Icon name="mountain" size={15} /> Community Climb
          {climb.phase !== 'scheduled' && (
            <span className="cc-count">
              {Math.min(climb.levelReached, n)}/{n}
            </span>
          )}
        </span>
        {clock}
        {onOpen && <Icon name="chevron" size={16} />}
      </span>
      <span className="cc-scene">
        <ClimbMountain climb={climb} ladder={ladder} height={64} />
        <span className="cc-status" aria-live="polite">
          {status}
        </span>
      </span>
      {held && <span className="sr-only">{STREAMER.name} is doing the challenge. The clock is paused.</span>}
    </button>
  );
}
