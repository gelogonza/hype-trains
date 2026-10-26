import { useCallback, useEffect, useReducer, useRef } from 'react';
import { reducer, makeInitialState } from './state/reducer.js';
import { isLive } from './state/climbReducer.js';
import { crowdActions } from './state/crowd.js';
import RoleSwitch from './components/RoleSwitch.jsx';
import ViewerApp from './components/viewer/ViewerApp.jsx';
import StreamerApp from './components/streamer/StreamerApp.jsx';
import FanApp from './components/fan/FanApp.jsx';

// How long each on-stream moment (start, goal unlocked, mystery revealed, summit) shows.
const MOMENT_MS = 4500;

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, makeInitialState);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);
  const { climb, sim } = state;
  const climbRef = useRef(climb);
  climbRef.current = climb;

  // The climb's clock and the simulated crowd. They only run while the climb is on screen (the
  // viewer, or the streamer's Stream Manager), so nothing happens off-screen.
  const onScreen = state.role === 'viewer' || (state.role === 'streamer' && state.ui.streamerTab === 'live');
  const watching = onScreen && (isLive(climb) || climb.phase === 'scheduled');
  useEffect(() => {
    if (!watching) return;
    const t = setInterval(() => {
      dispatch({ type: 'TICK' });
      crowdActions(climbRef.current, sim.outcome).forEach(dispatch);
    }, 1000 / sim.speed);
    return () => clearInterval(t);
  }, [watching, sim.outcome, sim.speed]);

  // Play queued on-stream moments one at a time.
  useEffect(() => {
    if (!climb.activeMoment && climb.moments.length) dispatch({ type: 'SHOW_NEXT_MOMENT' });
  }, [climb.activeMoment, climb.moments.length]);

  useEffect(() => {
    if (!climb.activeMoment) return;
    const t = setTimeout(() => dispatch({ type: 'DISMISS_MOMENT' }), MOMENT_MS);
    return () => clearTimeout(t);
  }, [climb.activeMoment]);

  return (
    <div className="app-shell">
      <RoleSwitch
        role={state.role}
        onChange={(role) => dispatch({ type: 'SET_ROLE', role })}
        onReset={reset}
        sim={sim}
        onSim={(next) => dispatch({ type: 'SET_SIM', sim: next })}
        onSkip={() => dispatch({ type: 'TICK', seconds: 30 })}
        onStart={() => dispatch({ type: 'START_CLIMB' })}
        canStart={climb.phase === 'scheduled'}
      />
      <main className="phone">
        <div className="status-bar" aria-hidden="true">
          <span>9:41</span>
          <span className="status-bar-icons">▂▄▆ 5G ▮</span>
        </div>
        {state.role === 'viewer' && <ViewerApp state={state} dispatch={dispatch} onReset={reset} />}
        {state.role === 'streamer' && <StreamerApp state={state} dispatch={dispatch} />}
        {state.role === 'fan' && <FanApp state={state} dispatch={dispatch} />}
      </main>
    </div>
  );
}
