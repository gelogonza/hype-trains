import { useState } from 'react';
import BottomSheet from '../BottomSheet.jsx';
import ArtTile from '../ArtTile.jsx';
import Icon from '../Icon.jsx';
import { HURRY_SECONDS, KICKOFF_NEEDED, STREAMER, SUPPORT_GROUPS, SUPPORT_OPTIONS } from '../../data/train.js';
import { climbingLevel, formatTime, isHeld, isLive } from '../../state/trainReducer.js';

const ICON = { sub: 'star', gift: 'gift', bits: 'bits' };

// Twitch's Subscribe / Gift Subs / Bits sheet, with what each option does for the train.
export default function SupportSheet({ train, ladder, dispatch, onClose }) {
  const [tab, setTab] = useState(train.sheetTab || 'gift');
  const level = climbingLevel(train, ladder);
  const live = isLive(train) && level;
  const pending = SUPPORT_OPTIONS.find((o) => o.id === train.pendingSupport);

  const status = !live ? (
    <div className="sheet-status">The Challenge Train isn't running right now. Your support still shows in chat.</div>
  ) : train.phase === 'boarding' ? (
    <div className="sheet-status">
      <Icon name="train" size={16} /> {KICKOFF_NEEDED - train.boarded} more to start the Challenge Train. Yours counts.
    </div>
  ) : (
    <div className={`sheet-status${!isHeld(train) && train.timeLeft <= HURRY_SECONDS ? ' sheet-status--hurry' : ''}`}>
      <Icon name={isHeld(train) ? 'pause' : 'clock'} size={16} /> {formatTime(train.timeLeft)} left to reach Level {level.level}
      {isHeld(train) && ' (paused for the challenge)'}
    </div>
  );

  if (pending) {
    const after = train.points + pending.points;
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
                ? `This reaches Level ${level.level}.`
                : `${(level.threshold - after).toLocaleString()} more to Level ${level.level} after this.`}
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
      {live && (
        <div className="sheet-reward">
          <ArtTile art={level.reward.art} kind={level.reward.kind} size={32} gold={level.reward.gold} />
          <span>
            Support now and earn <b>{level.reward.name}</b> when Level {level.level} unlocks
            {level.reward.credit && <span className="muted"> · art by {level.reward.credit}</span>}
          </span>
        </div>
      )}
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
