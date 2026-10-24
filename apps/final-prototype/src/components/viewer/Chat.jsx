import { useEffect, useMemo, useRef } from 'react';
import { DEFAULT_REWARDS } from '../../data/train.js';
import ArtTile from '../ArtTile.jsx';
import Icon from '../Icon.jsx';

// Chat rows styled like Twitch: badges, colored bold name, message. Sub, gift and cheer events
// are Twitch's highlighted notices. Emote codes (like PepperFace) render as the emote.

function Message({ text, emotes }) {
  return text.split(/(\s+)/).map((w, i) => {
    const e = emotes.get(w);
    return e ? <ArtTile key={i} art={e.art} kind="emote" size={24} title={w} /> : w;
  });
}

const Conductor = () => (
  <span className="chat-badge chat-badge--conductor" title="Conductor">
    <Icon name="crown" size={12} />
  </span>
);

const Broadcaster = () => (
  <span className="chat-badge chat-badge--broadcaster" title="Broadcaster">
    <Icon name="camera" size={12} />
  </span>
);

function ChatLine({ line, emotes, crowns }) {
  if (line.kind === 'system') {
    return <li className="chat-line chat-line--system">{line.text}</li>;
  }
  if (line.kind === 'support') {
    const bits = /^cheered/.test(line.text);
    return (
      <li className={`chat-notice${line.me ? ' chat-notice--me' : ''}`}>
        <span className="chat-notice-icon" aria-hidden="true">
          <Icon name={bits ? 'bits' : /gift/.test(line.text) ? 'gift' : 'star'} size={16} />
        </span>
        <span>
          {crowns.has(line.author) && <Conductor />}
          <b style={{ color: line.me ? undefined : line.color }}>{line.me ? 'You' : line.author}</b>{' '}
          {line.me ? line.text.replace(/^is /, 'are ') : line.text}
          {line.hype && <span className="chat-notice-hype"> +{line.hype.toLocaleString()} hype</span>}
        </span>
      </li>
    );
  }
  if (line.kind === 'streamer') {
    return (
      <li className="chat-line">
        <Broadcaster />
        <span className="chat-author" style={{ color: '#ff7f50' }}>{line.author}</span>: <Message text={line.text} emotes={emotes} />
      </li>
    );
  }
  if (line.kind === 'you') {
    return (
      <li className="chat-line">
        {crowns.has(line.author) && <Conductor />}
        {line.badges?.map((b) => (
          <span key={b.name} className="chat-badge-wrap">
            <ArtTile art={b.art} kind="badge" size={18} gold={b.gold} title={b.name} />
          </span>
        ))}
        <span className="chat-author chat-author--you">you</span>: <Message text={line.text} emotes={emotes} />
      </li>
    );
  }
  return (
    <li className="chat-line">
      {crowns.has(line.author) && <Conductor />}
      <span className="chat-author" style={{ color: line.color }}>{line.author}</span>: <Message text={line.text} emotes={emotes} />
    </li>
  );
}

// `crowns` holds the names of the current Conductors (top Bits, top Subs), who get the crown badge.
export default function Chat({ lines, ladder, crowns = new Set() }) {
  const scrollRef = useRef(null);
  const emotes = useMemo(() => {
    const all = [...ladder.map((l) => l.reward), ...Object.values(DEFAULT_REWARDS)].filter((r) => r.kind === 'emote');
    return new Map(all.map((r) => [r.name, r]));
  }, [ladder]);

  // Scroll only the chat container (scrollIntoView would also scroll the phone frame).
  useEffect(() => {
    const el = scrollRef.current;
    el?.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [lines.length]);

  return (
    <section className="chat" aria-label="Stream chat" ref={scrollRef}>
      <ul className="chat-list" aria-live="polite">
        <li className="chat-line chat-line--welcome">Welcome to the chat room!</li>
        {lines.map((line) => (
          <ChatLine key={line.id} line={line} emotes={emotes} crowns={crowns} />
        ))}
      </ul>
    </section>
  );
}
