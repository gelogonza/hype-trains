import React from 'react';
import { TemplateView } from './TemplateView.js';

export class BattleBoss extends React.Component {
  state = {
    role: 'viewer', screen: 'stream', pollOpen: false, overlay: null,
    signedIn: false, signingIn: false,
    pollNo: 0, phase: 'none', a: '', b: '', sA: 0, sB: 0, tA: 0, tB: 0, timeLeft: 120, totalTime: 120,
    winner: null, settled: false, overridden: false, overrideOpen: false, overtimeUsed: false,
    pausedBy: '', myTeam: null, myBits: 0, myTapPts: 0, lastTap: 0, tapFlash: false,
    balance: 12000, pack: 500, customOn: false, customText: '', bitsPhase: 'review', bitsMsg: '', failNext: false,
    txSeq: 0, processed: {}, lastTx: null, feed: [], notice: '',
    draftA: 'Call of Duty', draftB: 'Fortnite', queue: null,
    editing: false, editA: '', editB: '', confirmCancel: false, log: [],
    pins: [], minBitsOverride: null, mockSilent: false
  };

  // ---- Integration seams. Swap each body for the real service later. ----
  services = {
    auth: {
      // SWAP POINT: Twitch sign-in for viewers; role lookup for streamer and moderators.
      signIn: () => new Promise((resolve) => setTimeout(() => resolve({ handle: 'tidepool_tess' }), 900))
    },
    bits: {
      // SWAP POINT: Twitch's native Bits flow. Resolve { ok: true, txId, amount } only on a confirmed
      // transaction. The txId is what makes duplicate events detectable.
      contribute: (amount, txId, simulateFailure) => new Promise((resolve) => setTimeout(() => {
        if (simulateFailure) resolve({ ok: false, reason: 'declined' });
        else resolve({ ok: true, txId: txId, amount: amount });
      }, 1300))
    },
    activity: {
      // SWAP POINT: confirmed contribution events from the backend.
      mockEvent: () => {
        const names = ['pixelmoth', 'gravy_goblin', 'sir_snorts', 'lumi_bean', 'kettlecorn', 'moss_dad', 'zerodawn', 'quietfox'];
        const amounts = [100, 100, 250, 500, 1000];
        return {
          name: names[Math.floor(Math.random() * names.length)],
          team: Math.random() < 0.55 ? 'a' : 'b',
          amount: amounts[Math.floor(Math.random() * amounts.length)]
        };
      }
    },
    pins: {
      // SWAP POINT: persist pins server-side; optionally mirror to the Twitch profile if supported.
    }
  };

  componentDidMount() { this.timer = setInterval(() => this.tick(), 1000); }
  componentWillUnmount() { clearInterval(this.timer); }

  cfg() {
    const p = this.props;
    return {
      ppb: p.pointsPerBit ?? 1, tapPts: p.tapPoints ?? 1, maxTap: p.maxTapPoints ?? 30,
      cool: p.tapCooldownMs ?? 1000, tieRule: p.tieRule ?? 'streamer_decides',
      noPart: p.noParticipationRule ?? 'streamer_decides', ot: p.overtimeSeconds ?? 30
    };
  }
  minBits() { return this.state.minBitsOverride !== null ? this.state.minBitsOverride : (this.props.rewardMinBits ?? 100); }
  fmt(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  mmss(t) { return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); }
  roleName(r) { return r === 'streamer' ? 'Streamer' : (r === 'mod' ? 'Moderator' : 'Viewer'); }
  teamColor(k) { return k === 'a' ? '#ff7a3d' : '#4fc9ff'; }
  teamName(k) { return k === 'a' ? (this.state.a || 'Choice A') : (this.state.b || 'Choice B'); }
  addLog(text) { return [{ id: Date.now() + '-' + Math.random(), text: text }].concat(this.state.log).slice(0, 5); }
  addFeed(feed, item) { return [Object.assign({ id: Date.now() + '-' + Math.random() }, item)].concat(feed).slice(0, 3); }
  flashNotice(text) {
    this.setState({ notice: text });
    setTimeout(() => this.setState({ notice: '' }), 4500);
  }
  draftProblem(x, y) {
    const p = x.trim(), q = y.trim();
    if (!p || !q) return 'Both choices need a name.';
    if (p.toLowerCase() === q.toLowerCase()) return 'The two choices must be different.';
    return '';
  }
  winLabel(s) {
    if (s.winner === 'a' || s.winner === 'b') return this.teamName(s.winner) + ' wins';
    if (s.winner === 'tie') return s.settled ? 'Tied: no winner' : 'It is a tie';
    if (s.winner === 'none') return s.settled ? 'No winner' : 'Nobody took part';
    return '';
  }

  // Pin record for the signed-in viewer. Revokes a pin for this poll if the result changed.
  pinsFor(s, winner, overridden) {
    const pins = s.pins.map((p) => (p.pollNo === s.pollNo && !p.revoked && !p.sample)
      ? Object.assign({}, p, { revoked: true, note: 'Revoked: the result for this poll changed' }) : p);
    if ((winner === 'a' || winner === 'b') && s.myTeam === winner && s.myBits >= this.minBits()) {
      pins.unshift({
        id: 'pin-' + s.pollNo + '-' + Date.now(), pollNo: s.pollNo, sample: false, revoked: false,
        title: this.teamName(winner) + ' winner pin', detail: 'Poll ' + s.pollNo + ': ' + s.a + ' vs ' + s.b,
        bits: s.myBits, team: winner, overridden: overridden,
        note: overridden ? 'Awarded after the streamer overrode the result' : ''
      });
    }
    return pins;
  }

  finish(s, fa, fb) {
    const c = this.cfg();
    const total = fa + fb;
    const out = { phase: 'ended', timeLeft: 0, overrideOpen: false };
    let winner, settled = false;
    if (total === 0) {
      winner = 'none'; settled = c.noPart === 'no_winner';
    } else if (fa === fb) {
      if (c.tieRule === 'overtime' && !s.overtimeUsed) {
        return { phase: 'live', timeLeft: c.ot, overtimeUsed: true, log: this.addLog('Poll ' + s.pollNo + ' tied: overtime started'),
          notice: 'Tie! Overtime: ' + c.ot + ' more seconds.' };
      }
      winner = 'tie'; settled = c.tieRule === 'no_winner';
    } else {
      winner = fa > fb ? 'a' : 'b'; settled = true;
    }
    out.winner = winner; out.settled = settled;
    out.log = this.addLog('Poll ' + s.pollNo + ' ended: ' + (winner === 'a' || winner === 'b' ? this.teamName(winner) + ' won' : (settled ? 'no winner' : 'decision needed')));
    if (settled && (winner === 'a' || winner === 'b')) out.pins = this.pinsFor(s, winner, false);
    return out;
  }

  tick() {
    const s = this.state;
    if (s.phase !== 'live') return;
    const c = this.cfg();
    const left = s.timeLeft - 1;
    let sA = s.sA, sB = s.sB, tA = s.tA, tB = s.tB, feed = s.feed;
    if (!s.mockSilent) {
      if (Math.random() < 0.45) {
        const e = this.services.activity.mockEvent();
        const pts = Math.round(e.amount * c.ppb);
        if (e.team === 'a') sA += pts; else sB += pts;
        feed = this.addFeed(feed, { name: e.name, text: 'contributed ' + this.fmt(e.amount) + ' Bits to ' + this.teamName(e.team), color: this.teamColor(e.team) });
      }
      if (Math.random() < 0.35) {
        const tp = 2 + Math.floor(Math.random() * 5);
        if (Math.random() < 0.5) { sA += tp; tA += tp; } else { sB += tp; tB += tp; }
      }
    }
    const next = { timeLeft: left, sA: sA, sB: sB, tA: tA, tB: tB, feed: feed };
    if (left <= 0) Object.assign(next, this.finish(s, sA, sB));
    this.setState(next);
  }

  launch(a, b, who) {
    const secs = this.props.pollSeconds ?? 120;
    const n = this.state.pollNo + 1;
    this.setState({
      pollNo: n, phase: 'live', a: a, b: b, sA: 0, sB: 0, tA: 0, tB: 0, timeLeft: secs, totalTime: secs,
      winner: null, settled: false, overridden: false, overrideOpen: false, overtimeUsed: false,
      pausedBy: '', myTeam: null, myBits: 0, myTapPts: 0, lastTap: 0, feed: [], notice: '',
      editing: false, confirmCancel: false, pollOpen: this.state.role === 'viewer', overlay: null,
      log: this.addLog(who + ' launched Poll ' + n + ': ' + a + ' vs ' + b)
    });
  }

  launchDraft() {
    const s = this.state;
    if (s.role !== 'streamer' || s.phase === 'live' || s.phase === 'paused' || (s.phase === 'ended' && !s.settled)) return;
    if (this.draftProblem(s.draftA, s.draftB)) return;
    this.launch(s.draftA.trim(), s.draftB.trim(), 'Streamer');
    this.setState({ draftA: '', draftB: '' });
  }

  queueDraft() {
    const s = this.state;
    if (s.role !== 'streamer' || this.draftProblem(s.draftA, s.draftB)) return;
    this.setState({
      queue: { a: s.draftA.trim(), b: s.draftB.trim() }, draftA: '', draftB: '',
      log: this.addLog('Streamer queued the next poll: ' + s.draftA.trim() + ' vs ' + s.draftB.trim())
    });
  }

  launchQueue() {
    const s = this.state;
    if (!s.queue || s.phase === 'live' || s.phase === 'paused' || (s.phase === 'ended' && !s.settled)) return;
    const q = s.queue;
    this.launch(q.a, q.b, this.roleName(s.role));
    this.setState({ queue: null });
  }

  decide(x, isOverride) {
    const s = this.state;
    if (s.role !== 'streamer' || s.phase !== 'ended') return;
    if (isOverride && s.winner === x) { this.setState({ overrideOpen: false }); return; }
    if (!isOverride && s.settled) return;
    const label = x === 'none' ? 'no winner' : this.teamName(x);
    const was = s.winner === 'a' || s.winner === 'b' ? this.teamName(s.winner) : (s.winner === 'none' ? 'no winner' : 'a tie');
    this.setState({
      winner: x, settled: true, overrideOpen: false, overridden: isOverride ? true : s.overridden,
      pins: this.pinsFor(s, x, isOverride),
      log: this.addLog(isOverride ? 'Streamer OVERRODE Poll ' + s.pollNo + ': ' + was + ' changed to ' + label : 'Streamer declared ' + label + ' for Poll ' + s.pollNo)
    });
  }

  pickTeam(k) {
    const s = this.state;
    if (s.role !== 'viewer' || s.phase !== 'live' || s.myTeam) return;
    if (!s.signedIn) { this.setState({ overlay: 'signin' }); return; }
    this.setState({ myTeam: k });
  }

  signIn() {
    this.setState({ signingIn: true });
    this.services.auth.signIn().then(() => this.setState({ signingIn: false, signedIn: true, overlay: null }));
  }

  tap() {
    const s = this.state, c = this.cfg();
    if (s.role !== 'viewer' || s.phase !== 'live' || !s.myTeam) return;
    const now = Date.now();
    if (now - s.lastTap < c.cool) return;
    if (s.myTapPts >= c.maxTap) return;
    const add = Math.min(c.tapPts, c.maxTap - s.myTapPts);
    const next = { lastTap: now, myTapPts: s.myTapPts + add, tapFlash: true };
    if (s.myTeam === 'a') { next.sA = s.sA + add; next.tA = s.tA + add; } else { next.sB = s.sB + add; next.tB = s.tB + add; }
    this.setState(next);
    setTimeout(() => this.setState({ tapFlash: false }), c.cool + 60);
  }

  openBits() {
    const s = this.state;
    if (s.phase !== 'live' || !s.myTeam || s.pack <= 0) return;
    this.setState({ overlay: 'bits', bitsPhase: 'review', bitsMsg: '' });
  }

  // Score changes only here, and only for a confirmed, non-duplicate event during a live poll.
  applyConfirmation(res, team) {
    const cur = this.state, c = this.cfg();
    if (!res.ok) {
      this.setState({ bitsPhase: 'fail', failNext: false, bitsMsg: 'The contribution was not completed. Nothing was added to the score and no Bits were spent.',
        log: this.addLog('A Bits contribution failed and was not counted') });
      return;
    }
    if (cur.processed[res.txId]) {
      this.setState({ log: this.addLog('Ignored duplicate Bits event ' + res.txId + ' (not counted again)') });
      this.flashNotice('Duplicate confirmation ignored. It was not counted again.');
      return;
    }
    if (cur.phase !== 'live') {
      this.setState({ bitsPhase: 'fail', bitsMsg: 'The poll was closed or paused before this contribution finished. It was not counted.',
        log: this.addLog('Bits event ' + res.txId + ' arrived after the poll stopped (not counted)') });
      return;
    }
    const pts = Math.round(res.amount * c.ppb);
    const processed = Object.assign({}, cur.processed);
    processed[res.txId] = true;
    const next = {
      bitsPhase: 'ok', balance: cur.balance - res.amount, myBits: cur.myBits + res.amount, processed: processed,
      lastTx: { txId: res.txId, amount: res.amount, team: team },
      feed: this.addFeed(cur.feed, { name: 'You', text: 'contributed ' + this.fmt(res.amount) + ' Bits to ' + this.teamName(team), color: this.teamColor(team) })
    };
    if (team === 'a') next.sA = cur.sA + pts; else next.sB = cur.sB + pts;
    this.setState(next);
  }

  confirmBits() {
    const s = this.state;
    if (s.bitsPhase === 'pending' || s.balance < s.pack || s.pack <= 0 || s.phase !== 'live') return;
    const txId = 'tx_' + s.pollNo + '_' + (s.txSeq + 1);
    const team = s.myTeam;
    this.setState({ bitsPhase: 'pending', txSeq: s.txSeq + 1 });
    this.services.bits.contribute(s.pack, txId, s.failNext).then((res) => this.applyConfirmation(res, team));
  }

  setRole(r) {
    const s = this.state;
    this.setState({
      role: r, screen: r === 'viewer' ? 'stream' : 'controls', overlay: null,
      pollOpen: r === 'viewer' && s.phase === 'live' && !s.myTeam, editing: false, confirmCancel: false, overrideOpen: false
    });
  }

  render() {
    return React.createElement(TemplateView, { values: this.renderVals() });
  }

  renderVals() {
    const s = this.state, c = this.cfg();
    const accent = this.props.accent ?? '#7a3ff2';
    const total = s.sA + s.sB;
    const pctA = total === 0 ? 0 : Math.round((s.sA / total) * 100);
    const pctB = total === 0 ? 0 : 100 - pctA;
    const isViewer = s.role === 'viewer';
    const hasPoll = s.phase !== 'none';
    const live = s.phase === 'live', paused = s.phase === 'paused';
    const ended = s.phase === 'ended', cancelled = s.phase === 'cancelled';
    const running = live || paused;
    const minBits = this.minBits();
    const winText = this.winLabel(s);
    const winColor = (s.winner === 'a' || s.winner === 'b') ? this.teamColor(s.winner) : '#efeff1';
    const myName = s.myTeam ? this.teamName(s.myTeam) : '';
    const hasPin = s.pins.some((p) => p.pollNo === s.pollNo && !p.revoked && !p.sample);
    const activePins = s.pins.filter((p) => !p.revoked);
    const bitsSelPts = Math.round(s.pack * c.ppb);
    const tapReady = s.myTapPts < c.maxTap && (Date.now() - s.lastTap >= c.cool);
    const tapMaxed = s.myTapPts >= c.maxTap;
    const roleBtn = (r) => ({ bg: s.role === r ? '#1b1a17' : 'transparent', fg: s.role === r ? '#f4f1ea' : '#1b1a17', border: '#1b1a17' });
    const rv = roleBtn('viewer'), rm = roleBtn('mod'), rs = roleBtn('streamer');
    const draftProblem = (s.draftA || s.draftB) ? this.draftProblem(s.draftA, s.draftB) : 'Enter two choices to launch or queue a poll.';
    const editProblem = this.draftProblem(s.editA, s.editB);
    const blocked = running || (ended && !s.settled);
    const needsDecision = ended && !s.settled;

    const mkTeam = (k) => {
      const mine = s.myTeam === k;
      const other = !!s.myTeam && !mine;
      const sc = k === 'a' ? s.sA : s.sB;
      const tp = k === 'a' ? s.tA : s.tB;
      return {
        label: k === 'a' ? 'A' : 'B', isA: k === 'a', isB: k === 'b',
        name: this.teamName(k), color: this.teamColor(k),
        scoreText: this.fmt(sc), pct: k === 'a' ? pctA : pctB,
        breakdown: 'Bits ' + this.fmt(sc - tp) + ' pts - Taps ' + this.fmt(tp) + ' pts',
        bg: mine ? '#241d3d' : '#1f1f25', border: mine ? this.teamColor(k) : '#2a2a31',
        opacity: other ? 0.6 : 1,
        isMine: mine, lockedOut: other && isViewer,
        isWinner: ended && s.settled && s.winner === k,
        canJoin: isViewer && live && !s.myTeam,
        join: () => this.pickTeam(k)
      };
    };

    let cardEyebrow = 'WAITING', cardTitle = 'Next poll coming up', cardSub = 'The streamer will launch the first poll soon.', cardButton = 'Open poll';
    if (live) { cardEyebrow = 'POLL LIVE'; cardTitle = s.a + ' vs ' + s.b; cardSub = s.myTeam ? 'You are on ' + myName + '. Tap or contribute Bits to push it ahead.' : 'Pick a team, then tap for free or back it with Bits.'; cardButton = s.myTeam ? 'Open poll' : 'Choose your team'; }
    if (paused) { cardEyebrow = 'PAUSED'; cardTitle = s.a + ' vs ' + s.b; cardSub = 'Paused by the ' + s.pausedBy.toLowerCase() + '. Taps and contributions are on hold.'; }
    if (ended) { cardEyebrow = 'POLL CLOSED'; cardTitle = winText; cardSub = s.settled ? 'Final result. A moderator or the streamer launches the next poll.' : 'Waiting for the streamer to decide what happens next.'; cardButton = 'See result'; }
    if (cancelled) { cardEyebrow = 'CANCELLED'; cardTitle = s.a + ' vs ' + s.b; cardSub = 'This poll was cancelled. Waiting for the next one.'; cardButton = 'Details'; }

    let bannerText = '', bannerBg = '#26262c', bannerColor = '#efeff1';
    if (live) { bannerText = s.overtimeUsed ? 'Overtime - contributions open' : 'Live - contributions open'; bannerBg = '#12301f'; bannerColor = '#8be5ae'; }
    if (paused) { bannerText = 'Paused by ' + s.pausedBy.toLowerCase(); bannerBg = '#3a2f0d'; bannerColor = '#ffd36a'; }
    if (ended) { bannerText = s.settled ? 'Closed - contributions off' : 'Closed - waiting for the streamer'; }
    if (cancelled) { bannerText = 'Poll cancelled'; bannerBg = '#3a1616'; bannerColor = '#ffb3b3'; }

    let phaseLabel = 'NO POLL';
    if (live) phaseLabel = 'LIVE'; if (paused) phaseLabel = 'PAUSED'; if (cancelled) phaseLabel = 'CANCELLED';
    if (ended) phaseLabel = s.settled ? 'ENDED' : 'DECISION NEEDED';

    let resultSub = '';
    if (ended) {
      if (!s.settled) resultSub = s.winner === 'tie' ? 'Scores are level. The streamer will decide what happens next.' : 'Nobody tapped or contributed. The streamer will decide what happens next.';
      else if (s.winner === 'tie' || s.winner === 'none') resultSub = 'No pins are awarded for this poll.';
      else resultSub = 'The higher score wins. Final: ' + this.fmt(s.sA) + ' to ' + this.fmt(s.sB) + ' pts.';
    }
    let yourResult = '', pinStatus = '';
    if (isViewer && ended) {
      if (!s.myTeam) { yourResult = 'You did not join a team in this poll.'; pinStatus = ''; }
      else {
        const w = s.winner;
        yourResult = ((w === 'a' || w === 'b') ? (s.myTeam === w ? 'Your team won. ' : 'Your team lost this one. ') : (s.settled ? 'No winner this time. ' : 'Result pending. ')) +
          'You gave ' + this.fmt(s.myBits) + ' Bits and ' + s.myTapPts + ' tap points.';
        if (!s.settled) pinStatus = 'Pins are awarded once the result is final.';
        else if (w === 'a' || w === 'b') {
          if (s.myTeam !== w) pinStatus = 'Only the winning team earns pins.';
          else if (hasPin) pinStatus = 'Winner pin earned. It is in your collection.';
          else pinStatus = 'Your team won, but the pin needs at least ' + this.fmt(minBits) + ' Bits. You contributed ' + this.fmt(s.myBits) + '.';
        } else pinStatus = 'No winner, so no pins for this poll.';
      }
    }

    let permissionText = 'Streamer: you can create, queue and launch polls, manage any running poll, decide ties and override results.';
    if (s.role === 'mod') permissionText = 'Moderator: you can edit, pause, resume, restart and cancel polls the streamer started, and launch what the streamer queued. You cannot create polls, decide ties or override results.';

    const tieText = c.tieRule === 'overtime' ? 'Tie rule: ' + c.ot + ' seconds of overtime, then the streamer decides.' : (c.tieRule === 'no_winner' ? 'Tie rule: no winner and no pins.' : 'Tie rule: the streamer decides.');
    const noneText = c.noPart === 'no_winner' ? 'No participation: no winner and no pins.' : 'No participation: the streamer decides.';
    const logItems = s.log.length ? s.log : [{ id: 'none', text: 'No actions yet.' }];
    const launchBlock = running ? 'A poll is already running.' : (needsDecision ? 'Decide the previous result first.' : (draftProblem || ''));
    const pinList = s.pins.map((p) => ({
      id: p.id, title: p.title, detail: p.detail,
      earned: p.sample ? 'Sample from an earlier stream' : 'Won in Poll ' + p.pollNo,
      bitsText: this.fmt(p.bits) + ' Bits',
      color: this.teamColor(p.team), isA: p.team === 'a', isB: p.team === 'b',
      note: p.revoked ? (p.note || 'Revoked') : (p.note || ''), hasNote: !!(p.revoked ? (p.note || 'Revoked') : p.note),
      opacity: p.revoked ? 0.45 : 1
    }));
    const showParticipate = isViewer && live && !!s.myTeam;

    return {
      accent: accent,
      isStream: s.screen === 'stream', isControls: s.screen === 'controls', isProfile: s.screen === 'profile',
      isViewer: isViewer, isPrivileged: !isViewer, roleLabel: this.roleName(s.role), isStreamer: s.role === 'streamer',
      timeText: this.mmss(s.timeLeft),
      timePct: running || ended ? Math.max(0, Math.round((s.timeLeft / s.totalTime) * 100)) : 0,
      chatLines: [
        { name: 'pixelmoth', color: '#4fc9ff', text: 'chat decides tonight, love it' },
        { name: 'gravy_goblin', color: '#ff9a68', text: 'dropping Bits on my pick' },
        { name: 'lumi_bean', color: '#c9a7ff', text: 'hype train moving!!' },
        { name: 'quietfox', color: '#ffd23f', text: 'poll card is up, check below' }
      ],
      hasPoll: hasPoll, pollRunning: running, pollNo: s.pollNo, nameA: this.teamName('a'), nameB: this.teamName('b'),
      cardEyebrow: cardEyebrow, cardTitle: cardTitle, cardSub: cardSub, cardButton: cardButton,
      pctA: pctA, pctB: pctB,
      pinCount: activePins.length, noPins: s.pins.length === 0, pinList: pinList, minBitsText: this.fmt(minBits),

      pollOpen: s.pollOpen, bannerText: bannerText, bannerBg: bannerBg, bannerColor: bannerColor,
      hasNotice: !!s.notice, notice: s.notice,
      showResult: ended, winText: winText, winColor: winColor, resultSub: resultSub, overridden: s.overridden,
      showViewerResult: isViewer && ended && !!s.myTeam, yourResult: yourResult, pinStatus: pinStatus,
      showPinButton: isViewer && ended && hasPin,
      teams: [mkTeam('a'), mkTeam('b')],
      showPickHint: isViewer && live && !s.myTeam,
      showStaffNote: !isViewer,
      showImpact: isViewer && (live || paused),
      bitsRateText: c.ppb === 1 ? '1 point per Bit' : c.ppb + ' points per Bit',
      tapRateText: c.tapPts + ' pt per tap, max ' + c.maxTap + ' per poll',
      impactBitsText: '+' + this.fmt(bitsSelPts) + ' pts for ' + this.fmt(s.pack) + ' Bits',
      impactTapText: '+' + c.tapPts + ' pt per tap',
      impactPtsText: this.fmt(bitsSelPts),
      tapBarW: Math.max(2, Math.min(100, Math.round((c.tapPts / Math.max(1, bitsSelPts)) * 100))),
      showParticipate: showParticipate,
      tapReady: showParticipate && tapReady, tapWait: showParticipate && !tapReady && !tapMaxed, tapMaxed: showParticipate && tapMaxed,
      tapPtsText: String(c.tapPts), myTapPts: s.myTapPts, maxTap: c.maxTap,
      coolText: (c.cool / 1000) + ' s', tapProgPct: Math.min(100, Math.round((s.myTapPts / c.maxTap) * 100)),
      showClosedNote: isViewer && !live && !!s.myTeam && hasPoll,
      closedExtra: paused ? 'They return if the poll resumes.' : '',
      showFeed: live || paused, feedItems: s.feed,
      myTeamName: myName, myTeamColor: s.myTeam ? this.teamColor(s.myTeam) : '#efeff1',
      myBitsText: this.fmt(s.myBits), packLabel: this.fmt(s.pack),
      pinPct: minBits === 0 ? 100 : Math.min(100, Math.round((s.myBits / minBits) * 100)),
      packs: [100, 500, 1000, 2500].map((n) => ({
        label: this.fmt(n) + ' Bits', span: 'auto',
        bg: (!s.customOn && s.pack === n) ? '#2b1f4f' : '#1f1f25', border: (!s.customOn && s.pack === n) ? accent : '#35353d',
        pick: () => this.setState({ pack: n, customOn: false })
      })).concat([{
        label: 'Custom amount', span: '1 / -1',
        bg: s.customOn ? '#2b1f4f' : '#1f1f25', border: s.customOn ? accent : '#35353d',
        pick: () => this.setState({ customOn: true, pack: parseInt(this.state.customText, 10) || 0 })
      }]),
      showCustom: s.customOn, customText: s.customText, customError: s.customOn && s.pack <= 0,
      affordMsg: s.pack <= 0 ? 'Enter an amount of at least 1 Bit.' : 'Not enough Bits for this amount.',

      showSignin: s.overlay === 'signin', idleSignin: !s.signingIn, signingIn: s.signingIn,
      showBits: s.overlay === 'bits', balanceText: this.fmt(s.balance),
      bitsReview: s.bitsPhase === 'review', bitsPending: s.bitsPhase === 'pending',
      bitsOk: s.bitsPhase === 'ok', bitsFail: s.bitsPhase === 'fail', bitsMsg: s.bitsMsg,
      bitsCanClose: s.bitsPhase !== 'pending',
      canAfford: s.balance >= s.pack && s.pack > 0, cannotAfford: s.balance < s.pack || s.pack <= 0,
      showDemo: s.overlay === 'demo', failLabel: s.failNext ? 'On' : 'Off', silentLabel: s.mockSilent ? 'Silent' : 'Active',
      roleBgViewer: rv.bg, roleFgViewer: rv.fg, roleBorderViewer: rv.border,
      roleBgMod: rm.bg, roleFgMod: rm.fg, roleBorderMod: rm.border,
      roleBgStreamer: rs.bg, roleFgStreamer: rs.fg, roleBorderStreamer: rs.border,

      permissionText: permissionText,
      ctlTitle: hasPoll ? 'Poll ' + s.pollNo + ': ' + s.a + ' vs ' + s.b : 'No poll yet',
      phaseLabel: phaseLabel, isRunning: running, pollLive: live, pollPaused: paused,
      needsDecision: needsDecision, canDecide: needsDecision && s.role === 'streamer', waitDecision: needsDecision && s.role === 'mod',
      canOvertime: needsDecision && !s.overtimeUsed, otText: c.ot + ' s',
      settledResult: ended && s.settled,
      canOverride: ended && s.settled && s.role === 'streamer', modOverrideNote: ended && s.settled && s.role === 'mod',
      overrideOpen: s.overrideOpen,
      editing: s.editing, editA: s.editA, editB: s.editB, editError: !!editProblem, editErrorText: editProblem,
      confirmCancel: s.confirmCancel,
      hasQueue: !!s.queue, queueText: s.queue ? s.queue.a + ' vs ' + s.queue.b : '',
      canLaunch: !blocked, cannotLaunch: blocked, queueBlockText: running ? 'A poll is still running. Launch is available after it ends.' : 'Decide the previous result before launching.',
      noQueueForMod: s.role === 'mod' && !s.queue,
      createTitle: s.pollNo === 0 ? 'Create the first poll' : 'Create the next poll',
      draftA: s.draftA, draftB: s.draftB,
      draftError: !!draftProblem && (!!s.draftA || !!s.draftB), draftErrorText: draftProblem,
      canLaunchDraft: !blocked && !draftProblem, cannotLaunchDraft: blocked || !!draftProblem, launchBlockText: launchBlock,
      pollLenText: this.mmss(this.props.pollSeconds ?? 120),
      suggestions: [['Call of Duty', 'Fortnite'], ['Valorant', 'Apex Legends'], ['Minecraft', 'Roblox']].map((p) => ({
        label: p[0] + ' vs ' + p[1], pick: () => this.setState({ draftA: p[0], draftB: p[1] })
      })),
      ruleScore: 'Scoring: ' + (c.ppb === 1 ? '1 point per confirmed Bit.' : c.ppb + ' points per confirmed Bit.'),
      ruleTap: 'Taps: ' + c.tapPts + ' pt each, one every ' + (c.cool / 1000) + ' s, up to ' + c.maxTap + ' pts per viewer per poll.',
      ruleTie: tieText, ruleNone: noneText,
      logItems: logItems,

      openDemo: () => this.setState({ overlay: 'demo' }),
      closeOverlay: () => { if (this.state.signingIn || (this.state.bitsPhase === 'pending' && this.state.overlay === 'bits')) return; this.setState({ overlay: null }); },
      openControls: () => this.setState({ screen: 'controls' }),
      backToStream: () => this.setState({ screen: 'stream' }),
      openProfile: () => this.setState({ screen: 'profile', pollOpen: false }),
      openPoll: () => this.setState({ pollOpen: true }),
      closePoll: () => this.setState({ pollOpen: false }),
      signIn: () => this.signIn(),
      tap: () => this.tap(),
      openBits: () => this.openBits(),
      confirmBits: () => this.confirmBits(),
      retryBits: () => this.setState({ bitsPhase: 'review', bitsMsg: '' }),
      addBits: () => this.setState({ balance: this.state.balance + 5000 }),
      setCustom: (e) => { const raw = String(e.target.value).replace(/[^0-9]/g, '').slice(0, 7); this.setState({ customText: raw, pack: parseInt(raw, 10) || 0, customOn: true }); },
      asViewer: () => this.setRole('viewer'),
      asMod: () => this.setRole('mod'),
      asStreamer: () => this.setRole('streamer'),
      quickStart: () => { this.setState({ role: 'viewer', screen: 'stream' }); this.launch('Call of Duty', 'Fortnite', 'Streamer'); },
      skipAhead: () => { if (this.state.phase === 'live') this.setState({ timeLeft: Math.min(this.state.timeLeft, 10), overlay: null }); else this.setState({ overlay: null }); },
      endTie: () => {
        const st = this.state;
        if (st.phase !== 'live') { this.setState({ overlay: null }); return; }
        const v = Math.max(st.sA, st.sB, 100);
        this.setState({ sA: v, sB: v, tA: Math.min(st.tA, v), tB: Math.min(st.tB, v), timeLeft: 2, overlay: null });
      },
      endNone: () => {
        if (this.state.phase !== 'live') { this.setState({ overlay: null }); return; }
        this.setState({ sA: 0, sB: 0, tA: 0, tB: 0, myBits: 0, myTapPts: 0, mockSilent: true, timeLeft: 2, overlay: null });
      },
      toggleSilent: () => this.setState({ mockSilent: !this.state.mockSilent }),
      toggleFail: () => this.setState({ failNext: !this.state.failNext }),
      sendDuplicate: () => {
        const lt = this.state.lastTx;
        if (!lt) { this.setState({ overlay: null }); this.flashNotice('Make a Bits contribution first, then replay it.'); return; }
        this.setState({ overlay: null });
        this.applyConfirmation({ ok: true, txId: lt.txId, amount: lt.amount }, lt.team);
      },
      seedPins: () => {
        const sample = [
          { id: 'sample-1', pollNo: -1, sample: true, revoked: false, title: 'Valorant winner pin', detail: 'Earlier stream: Valorant vs Apex Legends', bits: 250, team: 'a', overridden: false, note: '' },
          { id: 'sample-2', pollNo: -2, sample: true, revoked: false, title: 'Roblox winner pin', detail: 'Earlier stream: Minecraft vs Roblox', bits: 1000, team: 'b', overridden: false, note: '' }
        ];
        const st = this.state;
        if (st.pins.some((p) => p.sample)) { this.setState({ overlay: null }); return; }
        this.setState({ pins: st.pins.concat(sample), overlay: null });
      },
      resetAll: () => this.setState({
        role: 'viewer', screen: 'stream', pollOpen: false, overlay: null, signedIn: false, pollNo: 0, phase: 'none',
        a: '', b: '', sA: 0, sB: 0, tA: 0, tB: 0, winner: null, settled: false, overridden: false, overrideOpen: false, overtimeUsed: false,
        myTeam: null, myBits: 0, myTapPts: 0, lastTap: 0, balance: 12000, feed: [], notice: '', processed: {}, lastTx: null, txSeq: 0,
        draftA: 'Call of Duty', draftB: 'Fortnite', queue: null, editing: false, confirmCancel: false, log: [], failNext: false,
        pins: [], minBitsOverride: null, mockSilent: false
      }),
      setDraftA: (e) => this.setState({ draftA: e.target.value }),
      setDraftB: (e) => this.setState({ draftB: e.target.value }),
      setEditA: (e) => this.setState({ editA: e.target.value }),
      setEditB: (e) => this.setState({ editB: e.target.value }),
      launchDraft: () => this.launchDraft(),
      queueDraft: () => this.queueDraft(),
      launchQueue: () => this.launchQueue(),
      clearQueue: () => this.setState({ queue: null, log: this.addLog('Streamer removed the queued poll') }),
      pausePoll: () => { const st = this.state; if (st.phase === 'live') this.setState({ phase: 'paused', pausedBy: this.roleName(st.role), log: this.addLog(this.roleName(st.role) + ' paused Poll ' + st.pollNo) }); },
      resumePoll: () => { const st = this.state; if (st.phase === 'paused') this.setState({ phase: 'live', log: this.addLog(this.roleName(st.role) + ' resumed Poll ' + st.pollNo) }); },
      restartPoll: () => { const st = this.state; if (st.phase === 'live' || st.phase === 'paused') this.setState({ phase: 'live', timeLeft: st.totalTime, confirmCancel: false, log: this.addLog(this.roleName(st.role) + ' restarted the clock on Poll ' + st.pollNo) }); },
      startEdit: () => this.setState({ editing: true, editA: this.state.a, editB: this.state.b, confirmCancel: false }),
      stopEdit: () => this.setState({ editing: false }),
      saveEdit: () => { const st = this.state; if (this.draftProblem(st.editA, st.editB)) return; this.setState({ a: st.editA.trim(), b: st.editB.trim(), editing: false, log: this.addLog(this.roleName(st.role) + ' edited the choices on Poll ' + st.pollNo) }); },
      askCancel: () => this.setState({ confirmCancel: true, editing: false }),
      keepPoll: () => this.setState({ confirmCancel: false }),
      doCancel: () => { const st = this.state; this.setState({ phase: 'cancelled', confirmCancel: false, log: this.addLog(this.roleName(st.role) + ' cancelled Poll ' + st.pollNo) }); },
      declareA: () => this.decide('a', false),
      declareB: () => this.decide('b', false),
      declareNone: () => this.decide('none', false),
      runOvertime: () => { const st = this.state; if (st.role === 'streamer' && st.phase === 'ended' && !st.settled && !st.overtimeUsed) this.setState({ phase: 'live', timeLeft: c.ot, overtimeUsed: true, winner: null, log: this.addLog('Streamer started ' + c.ot + ' s of overtime on Poll ' + st.pollNo) }); },
      openOverride: () => this.setState({ overrideOpen: true }),
      closeOverride: () => this.setState({ overrideOpen: false }),
      overrideA: () => this.decide('a', true),
      overrideB: () => this.decide('b', true),
      overrideNone: () => this.decide('none', true),
      minDown: () => this.setState({ minBitsOverride: Math.max(0, this.minBits() - 50) }),
      minUp: () => this.setState({ minBitsOverride: this.minBits() + 50 })
    };
  }
}
