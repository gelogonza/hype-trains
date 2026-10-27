import { useEffect, useMemo, useRef } from 'react';
import { getLevel, isHidden, maxLevel, progress } from '../state/climbReducer.js';

// The Community Climb's scene: a trail up a mountain with a flag at each goal. The climber moves
// up as hype comes in, flags plant as goals unlock, the mystery goal hides behind a "?", and the
// sun sets as the clock runs down. A simple 2D take on Angelo Gonzalez's animated Hype Train.

const W = 360;
const CALM = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Catmull-Rom through the points, as cubic Béziers, so the trail is smooth.
function smoothPath(pts) {
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [p0, p1, p2, p3] = [pts[i - 1] || pts[i], pts[i], pts[i + 1], pts[i + 2] || pts[i + 1]];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}

// The trail rises left to right, dipping between goals like switchbacks.
function geometry(n, h, top) {
  const base = [16, h - 8];
  const stations = Array.from({ length: n }, (_, i) => [16 + ((i + 1) * (W - 44)) / n, h - 8 - ((i + 1) * (h - 8 - top)) / n]);
  const pts = [base];
  stations.forEach((s, i) => {
    const prev = i ? stations[i - 1] : base;
    pts.push([(prev[0] + s[0]) / 2, (prev[1] + s[1]) / 2 + h * 0.07], s);
  });
  return { base, stations, d: smoothPath(pts) };
}

// The trail only moves rightward, so a binary search on x finds the length along it.
function lengthAtX(path, x) {
  let lo = 0;
  let hi = path.getTotalLength();
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (path.getPointAtLength(mid).x < x) lo = mid;
    else hi = mid;
  }
  return lo;
}

function Flag({ x, y, size, state, hidden, label }) {
  return (
    <g transform={`translate(${x},${y})`} className={`cm-flag cm-flag--${state}`}>
      {hidden ? (
        <g className="cm-mystery">
          <circle cy={-size * 0.7} r={size * 0.62} />
          <text y={-size * 0.7} dy="0.36em" fontSize={size * 0.85}>?</text>
        </g>
      ) : (
        <>
          <line y1={0} y2={-size * 1.25} />
          <path className="cm-cloth" d={`M0,${-size * 1.25} L${size},${-size * 1.0} L0,${-size * 0.75} Z`} />
        </>
      )}
      {label && (
        <text className="cm-label" y={12} fontSize={9}>
          {label}
        </text>
      )}
    </g>
  );
}

export default function ClimbMountain({ climb, ladder, height = 70, labels = false }) {
  const n = maxLevel(ladder);
  const top = labels ? 34 : 26;
  const { base, stations, d } = useMemo(() => geometry(n, height, top), [n, height, top]);
  const pathRef = useRef(null);
  const climberRef = useRef(null);
  const at = useRef(null);
  const flag = labels ? 10 : 8;

  // Where the climber should be: between the last goal reached and the next, by progress.
  const { pct } = progress(climb, ladder);
  const fromX = climb.levelReached ? stations[climb.levelReached - 1][0] : base[0];
  const toX = climb.levelReached < n ? stations[climb.levelReached][0] : fromX;
  const targetX = fromX + ((toX - fromX) * (climb.levelReached < n ? pct : 0)) / 100;

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const target = lengthAtX(path, targetX);
    let raf = 0;
    const step = () => {
      at.current = at.current === null || CALM ? target : at.current + (target - at.current) * 0.08;
      const p = path.getPointAtLength(at.current);
      climberRef.current?.setAttribute('transform', `translate(${p.x},${p.y})`);
      if (Math.abs(target - at.current) > 0.3) raf = requestAnimationFrame(step);
    };
    step();
    return () => cancelAnimationFrame(raf);
  }, [targetX, d]);

  // The sun sets as the clock runs down; before the climb it's high, after a summit it's golden.
  const timeFrac = climb.phase === 'scheduled' ? 1 : climb.timeLeft / climb.seconds;
  const sky = climb.phase === 'complete' ? 'gold' : timeFrac > 0.5 ? 'day' : timeFrac > 0.2 ? 'dusk' : 'night';
  const sunY = height * 0.16 + (1 - timeFrac) * height * 0.7;

  const moment = climb.activeMoment;
  const burstAt = moment && (moment.type === 'unlock' || moment.type === 'summit') ? stations[moment.level - 1] : null;
  const id = labels ? 'cm-big' : 'cm-small';

  return (
    <svg className={`cm cm--${sky}`} viewBox={`0 0 ${W} ${height}`} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="cm-sky-top" />
          <stop offset="1" className="cm-sky-bottom" />
        </linearGradient>
      </defs>
      <rect width={W} height={height} fill={`url(#${id}-sky)`} />
      <circle className="cm-sun" cx={W * 0.86} cy={sunY} r={height * 0.13} />
      <polygon
        className="cm-far"
        points={`0,${height} ${W * 0.18},${height * 0.5} ${W * 0.34},${height * 0.72} ${W * 0.58},${height * 0.28} ${W * 0.74},${height * 0.55} ${W * 0.9},${height * 0.34} ${W},${height * 0.5} ${W},${height}`}
      />
      {/* The mountain the climb goes up: everything under the trail. */}
      <path className="cm-near" d={`${d} L${W},${stations[n - 1][1]} L${W},${height} L0,${height} L0,${base[1]} Z`} />
      <path className="cm-trail" d={d} ref={pathRef} />

      {stations.map(([x, y], i) => {
        const level = getLevel(ladder, i + 1);
        const state = climb.levelReached > i ? 'reached' : climb.levelReached === i && climb.phase === 'live' ? 'next' : 'locked';
        return (
          <Flag
            key={i}
            x={x}
            y={y}
            size={flag}
            state={i === n - 1 && climb.levelReached >= n ? 'summit' : state}
            hidden={isHidden(climb, ladder, level)}
            label={labels ? `Goal ${i + 1}` : null}
          />
        );
      })}

      {burstAt && !CALM && (
        <g key={moment.key} transform={`translate(${burstAt[0]},${burstAt[1] - flag})`} className="cm-burst">
          {Array.from({ length: 10 }, (_, i) => (
            <circle key={i} r={labels ? 2.6 : 2} style={{ '--a': `${i * 36}deg` }} />
          ))}
        </g>
      )}

      <g ref={climberRef} className={`cm-climber${climb.phase === 'live' ? ' is-moving' : ''}`}>
        <g transform={`translate(0,${labels ? -11 : -9})`}>
          <circle r={labels ? 9 : 7.5} />
          <text dy="0.35em" fontSize={labels ? 11 : 9}>🧗</text>
        </g>
      </g>
    </svg>
  );
}
