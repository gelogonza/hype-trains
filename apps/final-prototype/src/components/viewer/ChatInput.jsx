import Icon from '../Icon.jsx';

// Twitch's message bar: the input with an emote button inside, then Bits and gift subs.
export default function ChatInput({ draft, setDraft, onSend, onOpen, emoteDot }) {
  return (
    <form
      className="chat-input"
      onSubmit={(e) => {
        e.preventDefault();
        onSend();
      }}
    >
      <div className="chat-input-field">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Send a message"
          aria-label="Send a message"
          maxLength={200}
          enterKeyHint="send"
        />
        <button type="button" className="chat-input-emote" onClick={() => onOpen('emotes')} aria-label="Emotes">
          <Icon name="emote" />
          {emoteDot && <span className="dot" aria-hidden="true" />}
        </button>
      </div>
      {draft.trim() ? (
        <button type="submit" className="chat-input-btn chat-input-btn--send" aria-label="Send">
          <Icon name="send" />
        </button>
      ) : (
        <>
          <button type="button" className="chat-input-btn" onClick={() => onOpen('support', 'bits')} aria-label="Cheer Bits">
            <Icon name="bits" />
          </button>
          <button type="button" className="chat-input-btn" onClick={() => onOpen('support', 'gift')} aria-label="Gift subs">
            <Icon name="gift" />
          </button>
        </>
      )}
    </form>
  );
}
