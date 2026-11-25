'use client';

import {useRef, useState} from 'react';

// Pintu yang bisa diketuk. Ketukan ketiga membukanya sedikit.
export default function Pintu() {
  const [n, setN] = useState(0);
  const audio = useRef(null);
  const buka = n >= 3;

  const bunyi = () => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const c = (audio.current ||= new Ctx());
      c.resume();
      const t = c.currentTime;
      const o = c.createOscillator();
      const g = c.createGain();
      o.frequency.setValueAtTime(170, t);
      o.frequency.exponentialRampToValueAtTime(55, t + 0.14);
      g.gain.setValueAtTime(0.7, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + 0.24);
    } catch {}
  };

  const ketuk = () => {
    if (buka) return setN(0);
    bunyi();
    navigator.vibrate?.(35);
    setN(n + 1);
  };

  return (
    <div className="panggung">
      <button type="button" className={`pintu${buka ? ' terbuka' : ''}`} onClick={ketuk} aria-label={buka ? 'Tutup pintu' : `Ketuk pintu, sudah ${n} dari 3 ketukan`}>
        <span className="dalam" aria-hidden="true">
          <span className="mata" />
          <span className="mata" />
        </span>
        {/* key membuat animasi guncangan terulang di tiap ketukan */}
        <span className={`daun${n > 0 && !buka ? ' guncang' : ''}`} key={n} aria-hidden="true">
          <span className="plat">05</span>
          <span className="panel" />
          <span className="panel" />
          <span className="gagang" />
        </span>
        {n > 0 && !buka && <span className={`tulisan-tok tok-${n}`} key={`t${n}`} aria-hidden="true">tok!</span>}
      </button>
      <p className="petunjuk" aria-live="polite">
        {buka ? (
          <>Ada yang menunggu ceritamu. <a href="#tulis">Tulis sekarang</a></>
        ) : n === 0 ? (
          'Berani ketuk tiga kali?'
        ) : n === 1 ? (
          'Satu...'
        ) : (
          'Dua... sekali lagi.'
        )}
      </p>
    </div>
  );
}
