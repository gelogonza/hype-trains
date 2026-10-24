import { useCallback, useEffect, useReducer, useRef } from 'react';
import { reducer, makeInitialState } from './state/reducer.js';
import { isLive } from './state/trainReducer.js';
import { crowdActions } from './state/crowd.js';
import RoleSwitch from './components/RoleSwitch.jsx';
import ViewerApp from './components/viewer/ViewerApp.jsx';
import StreamerApp from './components/streamer/StreamerApp.jsx';
import FanApp from './components/fan/FanApp.jsx';

const LEVEL_UP_MS = 4500;

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, makeInitialState);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);
  const { train, sim } = state;
  const trainRef = useRef(train);
  trainRef.current = train;

  // The train's clock and the simulated crowd. They only run while the train is on screen (the
  // viewer, or the streamer's Live tab), so nothing happens off-screen.
  const onScreen = state.role === 'viewer' || (state.role === 'streamer' && state.ui.streamerTab === 'live');
  const watching = onScreen && isLive(train);
  useEffect(() => {
    if (!watching) return;
    const t = setInterval(() => {
      dispatch({ type: 'TICK' });
      crowdActions(trainRef.current, sim.outcome).forEach(dispatch);
    }, 1000 / sim.speed);
    return () => clearInterval(t);
  }, [watching, sim.outcome, sim.speed]);

  // Play queued level-up moments one at a time.
  useEffect(() => {
    if (!train.activeLevelUp && train.levelUpQueue.length) dispatch({ type: 'SHOW_NEXT_LEVEL_UP' });
  }, [train.activeLevelUp, train.levelUpQueue.length]);

  useEffect(() => {
    if (!train.activeLevelUp) return;
    const t = setTimeout(() => dispatch({ type: 'DISMISS_LEVEL_UP' }), LEVEL_UP_MS);
    return () => clearTimeout(t);
  }, [train.activeLevelUp]);

  return (
    <div className="app-shell">
      <RoleSwitch
        role={state.role}
        onChange={(role) => dispatch({ type: 'SET_ROLE', role })}
        onReset={reset}
        sim={sim}
        onSim={(next) => dispatch({ type: 'SET_SIM', sim: next })}
        onSkip={() => dispatch({ type: 'TICK', seconds: 15 })}
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
