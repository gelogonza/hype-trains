import { FAN_NAME, STREAMER } from '../../data/train.js';
import FanHome from './FanHome.jsx';
import SubmitArt from './SubmitArt.jsx';

export default function FanApp({ state, dispatch }) {
  const request = state.requests.find((r) => r.id === state.ui.fanRequestId && r.status === 'open');
  return (
    <div className="role-screen">
      <header className="role-header">
        <span className="channel-avatar-img channel-avatar-img--fan" aria-hidden="true">🎨</span>
        <div>
          <div className="role-header-title">Art requests · {STREAMER.name}</div>
          <div className="role-header-sub">Signed in as {FAN_NAME}</div>
        </div>
      </header>
      {state.ui.notice && <div className="notice" role="status">{state.ui.notice}</div>}
      {request ? <SubmitArt request={request} dispatch={dispatch} /> : <FanHome state={state} dispatch={dispatch} />}
    </div>
  );
}
