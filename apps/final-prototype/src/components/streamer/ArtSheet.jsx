import BottomSheet from '../BottomSheet.jsx';
import RequestForm from './RequestForm.jsx';
import ReviewSubmissions from './ReviewSubmissions.jsx';
import { canEditGoals, openRequestFor, submissionsFor, vaultItems } from '../../state/reducer.js';

// Requesting and reviewing fan art for a goal's reward, as a sheet over Stream Manager.
export default function ArtSheet({ state, dispatch }) {
  const { level, panel } = state.ui.artSheet;
  const request = openRequestFor(state, level);
  const close = () => dispatch({ type: 'OPEN_ART_SHEET', level: null });

  return (
    <BottomSheet title={`${panel === 'request' ? 'Request art' : 'Pick a reward'} · Goal ${level}`} onClose={close}>
      {panel === 'request' ? (
        <RequestForm level={level} dispatch={dispatch} />
      ) : (
        <ReviewSubmissions
          level={level}
          request={request}
          subs={request ? submissionsFor(state, request.id) : []}
          vault={vaultItems(state)}
          dispatch={dispatch}
          locked={!canEditGoals(state)}
        />
      )}
    </BottomSheet>
  );
}
