import { useCallback, useState } from 'react';
import { isFinished } from '../../state/climbReducer.js';
import StreamArea from './StreamArea.jsx';
import ChannelInfo from './ChannelInfo.jsx';
import ClimbCard from './ClimbCard.jsx';
import ChatLeaderboard from './ChatLeaderboard.jsx';
import Chat from './Chat.jsx';
import ChatInput from './ChatInput.jsx';
import SupportSheet from './SupportSheet.jsx';
import EmotePicker from './EmotePicker.jsx';
import ClimbSheet from './ClimbSheet.jsx';
import Summary from './Summary.jsx';

// The Twitch mobile watch page: player, channel row, then chat with the Community Climb and the
// leaderboard pinned on top, and the message bar at the bottom.
export default function ViewerApp({ state, dispatch, onReset }) {
  const { climb, published: ladder } = state;
  const [draft, setDraft] = useState('');
  const close = useCallback(() => dispatch({ type: 'CLOSE_SHEET' }), [dispatch]);
  const open = (sheet, tab) => dispatch({ type: 'OPEN_SHEET', sheet, tab });
  const finished = isFinished(climb);

  return (
    <>
      <StreamArea climb={climb} ladder={ladder} />
      <ChannelInfo onSubscribe={() => open('support', 'sub')} />
      <div className="chat-pane">
        <div className="chat-pinned">
          <ClimbCard climb={climb} ladder={ladder} onOpen={() => (finished ? dispatch({ type: 'TOGGLE_RECAP' }) : open('climb'))} />
          <ChatLeaderboard climb={climb} onOpen={() => open('climb')} />
        </div>
        <Chat lines={climb.chat} ladder={ladder} />
      </div>
      <ChatInput
        draft={draft}
        setDraft={setDraft}
        onOpen={open}
        emoteDot={climb.earnedLevels.length > 0}
        onSend={() => {
          dispatch({ type: 'SEND_CHAT', text: draft });
          setDraft('');
        }}
      />

      {climb.sheet === 'support' && <SupportSheet climb={climb} ladder={ladder} dispatch={dispatch} onClose={close} />}
      {climb.sheet === 'emotes' && (
        <EmotePicker
          climb={climb}
          ladder={ladder}
          onClose={close}
          onUse={(name) => {
            setDraft((d) => `${d}${d && !d.endsWith(' ') ? ' ' : ''}${name} `);
            close();
          }}
        />
      )}
      {climb.sheet === 'climb' && <ClimbSheet climb={climb} ladder={ladder} dispatch={dispatch} onClose={close} />}
      {finished && climb.recapOpen && !climb.sheet && <Summary climb={climb} ladder={ladder} dispatch={dispatch} onReset={onReset} />}
    </>
  );
}
