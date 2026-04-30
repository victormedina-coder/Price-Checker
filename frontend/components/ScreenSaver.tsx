"use client";

import React, { useEffect, useState } from "react";
import { Tag } from "./Icons";

interface ScreenSaverProps {
  onDismiss: () => void;
}

export default function ScreenSaver({ onDismiss }: ScreenSaverProps) {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!time) return null; // Avoid hydration mismatch

  const hh = String(time.getHours()).padStart(2, '0');
  const mm = String(time.getMinutes()).padStart(2, '0');
  const days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const dateStr = `${days[time.getDay()]}, ${time.getDate()} de ${months[time.getMonth()]}`;

  return (
    <div
      onClick={onDismiss}
      onTouchStart={onDismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: '#07211e',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        animation: 'ssFadeIn 0.6s ease both',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Animated background blobs */}
      {[
        { size: 480, top: '-10%', left: '-8%',  delay: '0s',   dur: '9s'  },
        { size: 360, top: '55%',  left: '60%',  delay: '2s',   dur: '11s' },
        { size: 280, top: '20%',  left: '70%',  delay: '4s',   dur: '7s'  },
        { size: 200, top: '75%',  left: '5%',   delay: '1.5s', dur: '8s'  },
      ].map((b, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: b.size, height: b.size,
          borderRadius: '50%',
          top: b.top, left: b.left,
          background: `radial-gradient(circle, var(--primary) 0%, transparent 70%)`,
          opacity: 0.16,
          animation: `ssPulse ${b.dur} ease-in-out ${b.delay} infinite`,
          pointerEvents: 'none',
        }}/>
      ))}

      {/* Ripple rings */}
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          position: 'absolute',
          width: 180, height: 180,
          borderRadius: '50%',
          border: `1.5px solid var(--primary)`,
          opacity: 0.25,
          animation: `ssRing 3.6s ease-out ${i * 1.2}s infinite`,
          pointerEvents: 'none',
        }}/>
      ))}

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 8,
        animation: 'ssFloat 6s ease-in-out infinite',
      }}>
        {/* Brand mark */}
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 8,
          boxShadow: `0 0 40px var(--primary)`,
        }}>
          <div style={{ color: 'white' }}><Tag /></div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: `var(--primary)`, opacity: 0.8, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          Ariat México
        </div>

        {/* Clock */}
        <div style={{
          fontSize: 88, fontWeight: 900,
          color: 'white', letterSpacing: '-0.06em',
          lineHeight: 1, marginTop: 4,
          textShadow: `0 0 60px var(--primary)`,
        }}>
          {hh}<span style={{ opacity: 0.4, animation: 'ssTextFade 1s ease-in-out infinite' }}>:</span>{mm}
        </div>

        <div style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.02em' }}>
          {dateStr}
        </div>

        {/* Divider */}
        <div style={{ width: 40, height: 2, background: `var(--primary)`, opacity: 0.6, borderRadius: 2, margin: '16px 0 12px' }}/>

        {/* CTA */}
        <div style={{
          fontSize: 14, fontWeight: 700,
          color: 'rgba(255,255,255,0.35)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          animation: 'ssTextFade 2.5s ease-in-out infinite',
        }}>
          Toca para comenzar
        </div>
      </div>

      {/* Subtle grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(16,132,116,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(16,132,116,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
      }}/>
    </div>
  );
}
