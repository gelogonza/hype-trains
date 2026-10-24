import { useCallback, useState } from 'react';
import { conductors, isFinished } from '../../state/trainReducer.js';
import StreamArea from './StreamArea.jsx';
import ChannelInfo from './ChannelInfo.jsx';
import TrainBanner from './TrainBanner.jsx';
import ChatLeaderboard from './ChatLeaderboard.jsx';
import Chat from './Chat.jsx';
import ChatInput from './ChatInput.jsx';
import SupportSheet from './SupportSheet.jsx';
import EmotePicker from './EmotePicker.jsx';
import TrainSheet from './TrainSheet.jsx';
import Summary from './Summary.jsx';

// The Twitch mobile watch page: player, channel row, then chat with the Challenge Train and the
// leaderboard pinned on top, and the message bar at the bottom.
export default function ViewerApp({ state, dispatch, onReset }) {
  const { train, published: ladder } = state;
  const [draft, setDraft] = useState('');
  const close = useCallback(() => dispatch({ type: 'CLOSE_SHEET' }), [dispatch]);
  const open = (sheet, tab) => dispatch({ type: 'OPEN_SHEET', sheet, tab });
  const finished = isFinished(train);
  const { bits, subs } = conductors(train);
  const crowns = new Set([bits?.name, subs?.name].filter(Boolean));

  return (
    <>
      <StreamArea train={train} ladder={ladder} />
      <ChannelInfo onSubscribe={() => open('support', 'sub')} />
      <div className="chat-pane">
        <div className="chat-pinned">
          <TrainBanner train={train} ladder={ladder} onOpen={() => (finished ? dispatch({ type: 'TOGGLE_RECAP' }) : open('train'))} />
          <ChatLeaderboard train={train} onOpen={() => open('train')} />
        </div>
        <Chat lines={train.chat} ladder={ladder} crowns={crowns} />
      </div>
      <ChatInput
        draft={draft}
        setDraft={setDraft}
        onOpen={open}
        emoteDot={train.earnedLevels.length > 0}
        onSend={() => {
          dispatch({ type: 'SEND_CHAT', text: draft });
          setDraft('');
        }}
      />

      {train.sheet === 'support' && <SupportSheet train={train} ladder={ladder} dispatch={dispatch} onClose={close} />}
      {train.sheet === 'emotes' && (
        <EmotePicker
          train={train}
          ladder={ladder}
          onClose={close}
          onUse={(name) => {
            setDraft((d) => `${d}${d && !d.endsWith(' ') ? ' ' : ''}${name} `);
            close();
          }}
        />
      )}
      {train.sheet === 'train' && <TrainSheet train={train} ladder={ladder} dispatch={dispatch} onClose={close} />}
      {finished && train.recapOpen && !train.sheet && <Summary train={train} ladder={ladder} dispatch={dispatch} onReset={onReset} />}
    </>
  );
}
