/* Voice narration player for the guided tour (pre-recorded ElevenLabs clips in /audio). */
(function (GH) {
  'use strict';
  const KEY = 'ghsim:voice:v1';
  const N = () => GH.narration || { map: {} };
  let enabled = true;
  try { const v = localStorage.getItem(KEY); if (v != null) enabled = v === '1'; } catch (e) { /* ignore */ }
  const audio = new Audio();
  audio.preload = 'auto';
  let current = null, blocked = false, lastHint = 0, failed = new Set();

  const voice = GH.voice = {
    isEnabled: () => enabled,
    has: (key) => !!N().map[key] && !failed.has(key),
    current: () => current,
    speaking: () => !!current && !audio.paused && !audio.ended,
    blocked: () => blocked,
    setEnabled(on) {
      enabled = !!on;
      try { localStorage.setItem(KEY, enabled ? '1' : '0'); } catch (e) { /* ignore */ }
      if (!enabled) voice.stop();
      GH.bus.emit('voice:state');
    },
    toggle() { voice.setEnabled(!enabled); return enabled; },
    play(key, opts) {
      opts = opts || {};
      if (!enabled && !opts.force) return false;
      const n = N().map[key];
      if (!n || failed.has(key)) { if (!opts.keep) voice.stop(); return false; }
      if (opts.force && !enabled) voice.setEnabled(true);
      current = key;
      try { audio.pause(); } catch (e) { /* */ }
      audio.src = n.src;
      try { audio.currentTime = 0; } catch (e) { /* */ }
      const p = audio.play();
      if (p && p.catch) p.then(() => { blocked = false; GH.bus.emit('voice:state'); }).catch((err) => {
        if (err && err.name === 'NotAllowedError') { blocked = true; }
        GH.bus.emit('voice:state');
      });
      GH.bus.emit('voice:state');
      return true;
    },
    // Short spoken feedback (hints / cheers). Rate-limited so it never becomes noisy.
    say(group) {
      if (!enabled) return;
      const now = Date.now(); if (now - lastHint < 4000) return;
      const keys = Object.keys(N().map).filter(k => k.startsWith(group + ':') && !failed.has(k));
      if (!keys.length) return;
      lastHint = now;
      voice.play(keys[Math.floor(Math.random() * keys.length)]);
    },
    stop() { try { audio.pause(); } catch (e) { /* */ } current = null; GH.bus.emit('voice:state'); },
    pauseOrResume(key) {
      if (current === key && !audio.paused && !audio.ended) { audio.pause(); GH.bus.emit('voice:state'); return; }
      if (current === key && audio.paused && !audio.ended && audio.currentTime > 0) { audio.play().catch(() => {}); GH.bus.emit('voice:state'); return; }
      voice.play(key, { force: true });
    }
  };
  ['play', 'playing', 'pause', 'ended'].forEach(ev => audio.addEventListener(ev, () => GH.bus.emit('voice:state')));
  audio.addEventListener('error', () => { if (current) failed.add(current); current = null; GH.bus.emit('voice:state'); });

  // Unlock audio on the first interaction if the browser blocked autoplay.
  const unlock = () => { if (blocked && enabled && current) { blocked = false; audio.play().catch(() => { blocked = true; }); } };
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
})(window.GH);
