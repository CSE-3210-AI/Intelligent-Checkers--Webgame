import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import './GlobalBackgroundLayout.css';

export default function GlobalBackgroundLayout({ children }) {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('ambient-sound-enabled');
    return saved === null ? true : saved === 'true';
  });
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const voicesRef = useRef([]);
  const modIntervalRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('ambient-sound-enabled', String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    const markInteracted = () => setHasInteracted(true);
    window.addEventListener('pointerdown', markInteracted, { once: true });
    window.addEventListener('keydown', markInteracted, { once: true });

    return () => {
      window.removeEventListener('pointerdown', markInteracted);
      window.removeEventListener('keydown', markInteracted);
    };
  }, []);

  useEffect(() => {
    if (!soundEnabled || !hasInteracted) return undefined;

    if (!audioCtxRef.current) {
      const ctx = new window.AudioContext();
      const masterGain = ctx.createGain();
      const lowPass = ctx.createBiquadFilter();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      lowPass.type = 'lowpass';
      lowPass.frequency.value = 980;
      lowPass.Q.value = 0.7;

      masterGain.gain.value = 0.018;
      lfo.type = 'sine';
      lfo.frequency.value = 0.085;
      lfoGain.gain.value = 0.0035;

      const voiceA = ctx.createOscillator();
      voiceA.type = 'sine';
      voiceA.frequency.value = 123.47;
      const gainA = ctx.createGain();
      gainA.gain.value = 0.6;

      const voiceB = ctx.createOscillator();
      voiceB.type = 'triangle';
      voiceB.frequency.value = 164.81;
      const gainB = ctx.createGain();
      gainB.gain.value = 0.4;

      const voiceC = ctx.createOscillator();
      voiceC.type = 'sine';
      voiceC.frequency.value = 246.94;
      const gainC = ctx.createGain();
      gainC.gain.value = 0.22;

      voiceA.connect(gainA);
      voiceB.connect(gainB);
      voiceC.connect(gainC);
      gainA.connect(lowPass);
      gainB.connect(lowPass);
      gainC.connect(lowPass);
      lfo.connect(lfoGain);
      lfoGain.connect(masterGain.gain);
      lowPass.connect(masterGain);
      masterGain.connect(ctx.destination);

      voiceA.start();
      voiceB.start();
      voiceC.start();
      lfo.start();

      voicesRef.current = [voiceA, voiceB, voiceC, lfo];
      audioCtxRef.current = ctx;
      masterGainRef.current = masterGain;

      modIntervalRef.current = window.setInterval(() => {
        const drift = (Math.random() - 0.5) * 2.5;
        [voiceA, voiceB, voiceC].forEach((voice) => {
          voice.detune.setTargetAtTime(drift, ctx.currentTime, 2.4);
        });
      }, 5000);
    }

    void audioCtxRef.current.resume();

    const handleVisibility = () => {
      if (!audioCtxRef.current) return;
      if (document.hidden) {
        void audioCtxRef.current.suspend();
      } else if (soundEnabled) {
        void audioCtxRef.current.resume();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [soundEnabled, hasInteracted]);

  useEffect(() => {
    if (!soundEnabled && audioCtxRef.current) {
      void audioCtxRef.current.suspend();
    }
  }, [soundEnabled]);

  useEffect(() => {
    return () => {
      if (modIntervalRef.current) {
        window.clearInterval(modIntervalRef.current);
      }
      voicesRef.current.forEach((node) => {
        try {
          node.stop();
        } catch {
          // no-op for already stopped nodes
        }
      });
      if (masterGainRef.current) {
        masterGainRef.current.disconnect();
      }
      if (audioCtxRef.current) {
        void audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <div className="global-bg-container cyberpunk-theme">
      <div className="global-bg-image" aria-hidden="true" />
      <div className="global-bg-overlay" aria-hidden="true" />
      <button
        type="button"
        className="ambient-audio-toggle"
        aria-label={soundEnabled ? 'Mute ambient sound' : 'Enable ambient sound'}
        aria-pressed={soundEnabled}
        onClick={() => {
          setHasInteracted(true);
          setSoundEnabled((prev) => !prev);
        }}
      >
        {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        <span>{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
      </button>
      <div className="global-bg-content">{children}</div>
    </div>
  );
}
