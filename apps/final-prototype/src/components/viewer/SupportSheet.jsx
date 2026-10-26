import { useState } from 'react';
import BottomSheet from '../BottomSheet.jsx';
import ArtTile from '../ArtTile.jsx';
import Icon from '../Icon.jsx';
import { HURRY_SECONDS, STREAMER, SUPPORT_GROUPS, SUPPORT_OPTIONS } from '../../data/climb.js';
import { formatTime, isHeld, isHidden, isLive, nextGoal } from '../../state/climbReducer.js';

const ICON = { sub: 'star', gift: 'gift', bits: 'bits' };

// Twitch's Subscribe / Gift Subs / Bits sheet, with what each option does for the climb.
export default function SupportSheet({ climb, ladder, dispatch, onClose }) {
  const [tab, setTab] = useState(climb.sheetTab || 'gift');
  const level = nextGoal(climb, ladder);
  const live = isLive(climb) && level;
  const pending = SUPPORT_OPTIONS.find((o) => o.id === climb.pendingSupport);

  const hidden = live && isHidden(climb, ladder, level);
  const status = !live ? (
    <div className="sheet-status">
      <Icon name="mountain" size={16} />
      {climb.phase === 'scheduled'
        ? `The Community Climb hasn't started yet, so this won't count toward a goal.`
        : 'The Community Climb is over. Your support still shows in chat.'}
    </div>
  ) : (
    <div className={`sheet-status${!isHeld(climb) && climb.timeLeft <= HURRY_SECONDS ? ' sheet-status--hurry' : ''}`}>
      <Icon name={isHeld(climb) ? 'pause' : 'clock'} size={16} /> {formatTime(climb.timeLeft)} left in the climb · next: Goal {level.level}
      {isHeld(climb) && ' (paused for the challenge)'}
    </div>
  );

  if (pending) {
    const after = climb.points + pending.points;
    return (
      <BottomSheet title="Confirm" onClose={onClose}>
        <div className="confirm">
          <span className="confirm-icon">
            <Icon name={ICON[pending.group]} size={28} />
          </span>
          <div className="confirm-item">{pending.label}</div>
          {live && <div className="confirm-points">+{pending.points.toLocaleString()} hype</div>}
          {live && (
            <p className="confirm-effect">
              {after >= level.threshold
                ? `This unlocks Goal ${level.level}!`
                : `${(level.threshold - after).toLocaleString()} more to Goal ${level.level} after this.`}
            </p>
          )}
          <div className="proto-label">Prototype: no real payment</div>
          <div className="confirm-actions">
            <button className="tw-btn tw-btn--secondary tw-btn--lg" onClick={() => dispatch({ type: 'CANCEL_SUPPORT' })}>Back</button>
            <button className="tw-btn tw-btn--primary tw-btn--lg" onClick={() => dispatch({ type: 'CONFIRM_SUPPORT' })}>Confirm</button>
          </div>
        </div>
      </BottomSheet>
    );
  }

  const group = SUPPORT_GROUPS.find((g) => g.id === tab);
  return (
    <BottomSheet title={`Support ${STREAMER.name}`} onClose={onClose}>
      <div className="tw-tabs" role="tablist" aria-label="Ways to support">
        {SUPPORT_GROUPS.map((g) => (
          <button key={g.id} role="tab" aria-selected={tab === g.id} className={tab === g.id ? 'is-active' : ''} onClick={() => setTab(g.id)}>
            {g.title}
          </button>
        ))}
      </div>
      {status}
      {live && !hidden && (
        <div className="sheet-reward">
          <ArtTile art={level.reward.art} kind={level.reward.kind} size={32} gold={level.reward.gold} />
          <span>
            Support now and earn <b>{level.reward.name}</b> when Goal {level.level} unlocks
            {level.reward.credit && <span className="muted"> · art by {level.reward.credit}</span>}
          </span>
        </div>
      )}
      {hidden && <div className="sheet-reward">Support now to unlock the mystery goal and its secret reward.</div>}
      <p className="sheet-note">{group.note}</p>
      <ul className="option-list">
        {SUPPORT_OPTIONS.filter((o) => o.group === tab).map((o) => (
          <li key={o.id}>
            <button className="option-row" onClick={() => dispatch({ type: 'SELECT_SUPPORT', optionId: o.id })}>
              <span className="option-icon">
                <Icon name={ICON[o.group]} />
              </span>
              <span className="option-text">
                <span className="option-name">
                  {o.label}
                  {o.highlight && <span className="tw-tag">Most popular</span>}
                </span>
                {live && <span className="option-hype">+{o.points.toLocaleString()} hype</span>}
              </span>
              <Icon name="chevronRight" size={16} />
            </button>
          </li>
        ))}
      </ul>
    </BottomSheet>
  );
}
