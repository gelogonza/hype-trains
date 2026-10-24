// Placeholder art for an emote (rounded square) or badge (circle).
export default function ArtTile({ art, kind, size = 40, gold = false, title }) {
  return (
    <span
      className={`art-tile art-tile--${kind}${gold ? ' art-tile--gold' : ''}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.58), background: art.bg }}
      title={title}
      aria-hidden={title ? undefined : true}
    >
      {art.emoji}
    </span>
  );
}
