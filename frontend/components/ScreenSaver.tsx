"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import lifestyleImg from "../assets/images/Small JPG-S25_GRP_WEST_Saunders_Dublin_Shot14_6677_RTL.jpg";
import logoBlanco from "../assets/logos/Logo_Ariat_Horizontal_bco.png";

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

  if (!time) return null;

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
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        animation: 'ssFadeIn 0.6s ease both',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Background lifestyle image */}
      <Image
        src={lifestyleImg}
        alt=""
        fill
        style={{ objectFit: 'cover', objectPosition: 'center top' }}
        priority
      />

      {/* Dark overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'linear-gradient(135deg, rgba(15,8,3,0.82) 0%, rgba(15,8,3,0.60) 100%)',
      }}/>

      {/* Animated blobs */}
      {[
        { size: 480, top: '-10%', left: '-8%',  delay: '0s',   dur: '9s'  },
        { size: 360, top: '55%',  left: '60%',  delay: '2s',   dur: '11s' },
        { size: 280, top: '20%',  left: '70%',  delay: '4s',   dur: '7s'  },
        { size: 200, top: '75%',  left: '5%',   delay: '1.5s', dur: '8s'  },
      ].map((b, i) => (
        <div key={i} style={{
          position: 'absolute', zIndex: 2,
          width: b.size, height: b.size,
          borderRadius: '50%',
          top: b.top, left: b.left,
          background: `radial-gradient(circle, var(--primary) 0%, transparent 70%)`,
          opacity: 0.12,
          animation: `ssPulse ${b.dur} ease-in-out ${b.delay} infinite`,
          pointerEvents: 'none',
        }}/>
      ))}

      {/* Ripple rings */}
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          position: 'absolute', zIndex: 2,
          width: 180, height: 180,
          borderRadius: '50%',
          border: `1.5px solid rgba(245,240,232,0.28)`,
          animation: `ssRing 3.6s ease-out ${i * 1.2}s infinite`,
          pointerEvents: 'none',
        }}/>
      ))}

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 3,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 8,
        animation: 'ssFloat 6s ease-in-out infinite',
      }}>
        {/* Logo — contenedor con ratio exacto del área visible del PNG */}
        <div style={{ position: 'relative', height: 36, width: 198, flexShrink: 0, opacity: 0.92, marginBottom: 4 }}>
          <Image src={logoBlanco} alt="Ariat" fill sizes="198px" style={{ objectFit: 'cover', objectPosition: 'center' }} />
        </div>

        {/* Clock */}
        <div style={{
          fontSize: 88, fontWeight: 900,
          color: 'white', letterSpacing: '-0.06em',
          lineHeight: 1, marginTop: 4,
          fontFamily: 'var(--font-heading)',
          textShadow: `0 0 60px rgba(198,136,61,0.7)`,
        }}>
          {hh}<span style={{ opacity: 0.4, animation: 'ssTextFade 1s ease-in-out infinite' }}>:</span>{mm}
        </div>

        <div style={{
          fontSize: 15, fontWeight: 500,
          color: 'rgba(245,240,232,0.65)',
          letterSpacing: '0.03em',
          fontFamily: 'var(--font-body)',
        }}>
          {dateStr}
        </div>

        {/* Divider */}
        <div style={{
          width: 40, height: 2,
          background: 'var(--primary)',
          opacity: 0.5, borderRadius: 2,
          margin: '14px 0 10px',
        }}/>

        {/* CTA */}
        <div style={{
          fontSize: 13, fontWeight: 600,
          color: 'rgba(245,240,232,0.65)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-body)',
          animation: 'ssTextFade 2.5s ease-in-out infinite',
        }}>
          Toca para comenzar
        </div>
      </div>

      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
        backgroundImage: `
          linear-gradient(rgba(198,136,61,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(198,136,61,0.06) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
      }}/>
    </div>
  );
}
