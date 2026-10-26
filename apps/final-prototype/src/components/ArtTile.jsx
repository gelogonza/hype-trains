// Placeholder art for an emote (rounded square) or badge (circle).
// `sparkle` is the creator version: reserved for the fan who made the art.
export default function ArtTile({ art, kind, size = 40, gold = false, sparkle = false, title }) {
  return (
    <span
      className={`art-tile art-tile--${kind}${gold ? ' art-tile--gold' : ''}${sparkle ? ' art-tile--sparkle' : ''}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.58), background: art.bg }}
      title={title}
      aria-hidden={title ? undefined : true}
    >
      {art.emoji}
      {sparkle && (
        <span className="sparkles" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <i key={i} style={{ '--i': i }} />
          ))}
        </span>
      )}
    </span>
  );
}
