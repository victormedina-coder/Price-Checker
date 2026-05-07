"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowLeft } from "./Icons";
import { Location } from "../lib/types";
import { getLocations, authLocation } from "../lib/api";
import logoBlanco from "../assets/logos/Logo_Stetson_bco.png";

function PinKeypad({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
      {keys.map((k, i) => {
        if (k === '') return <div key={i} />;
        const isDel = k === '⌫';
        return (
          <button key={i} type="button"
            onClick={() => {
              if (isDel) onChange(value.slice(0, -1));
              else if (value.length < 4) onChange(value + k);
            }}
            style={{
              height: 60, borderRadius: 12,
              background: isDel ? 'var(--surface-alt)' : 'var(--surface)',
              border: `1.5px solid var(--border)`,
              fontSize: isDel ? 20 : 22,
              fontWeight: isDel ? 400 : 700,
              color: isDel ? 'var(--text-muted)' : 'var(--text)',
              cursor: 'pointer',
              transition: 'background 0.1s, transform 0.08s',
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = isDel ? '#e6ebed' : 'var(--primary-bg)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = isDel ? 'var(--surface-alt)' : 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.94)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {k}
          </button>
        );
      })}
    </div>
  );
}

interface BranchLoginScreenProps {
  onLogin: (location: Location) => void;
}

export default function BranchLoginScreen({ onLogin }: BranchLoginScreenProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Location | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getLocations()
      .then(setLocations)
      .catch(() => setError("No se pudieron cargar las sucursales."))
      .finally(() => setLoading(false));
  }, []);

  const handlePinChange = async (val: string) => {
    setPin(val);
    setError('');
    if (val.length === 4 && selected) {
      try {
        await authLocation(selected.id, val);
        setSuccess(true);
        setTimeout(() => onLogin(selected), 700);
      } catch {
        setShake(true);
        setError('Clave incorrecta');
        setTimeout(() => { setShake(false); setPin(''); }, 600);
      }
    }
  };

  const step = selected ? 'pin' : 'branch';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(20,8,12,0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div className="fade-in" style={{
        background: 'var(--surface)',
        borderRadius: 24,
        width: '100%',
        maxWidth: 560,
        overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
      }}>
        {/* Modal header */}
        <div style={{
          background: 'var(--primary)',
          padding: '28px 32px 24px',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(circle at 90% 10%, rgba(255,255,255,0.08), transparent 60%)',
            pointerEvents: 'none',
          }}/>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ position: 'relative', height: 30, width: 184, flexShrink: 0, opacity: 0.95 }}>
              <Image src={logoBlanco} alt="Stetson" fill sizes="184px" style={{ objectFit: 'cover', objectPosition: 'center' }} />
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500, letterSpacing: '0.03em' }}>
              Verificador de Precios
            </div>
          </div>
          {/* Steps */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {['Seleccionar sucursal', 'Ingresar clave'].map((label, i) => {
              const active = (i === 0 && step === 'branch') || (i === 1 && step === 'pin');
              const done = i === 0 && step === 'pin';
              return (
                <React.Fragment key={i}>
                  {i > 0 && <div style={{ flex: 1, height: 1.5, background: done ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)', borderRadius: 1 }}/>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: done ? 'rgba(255,255,255,0.3)' : active ? 'white' : 'rgba(255,255,255,0.1)',
                      border: `1.5px solid ${done || active ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800,
                      color: done ? 'rgba(255,255,255,0.8)' : active ? 'var(--primary)' : 'rgba(255,255,255,0.4)',
                      flexShrink: 0,
                    }}>
                      {done ? '✓' : i + 1}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: done || active ? 700 : 500, color: done || active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
                      {label}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Modal body */}
        <div style={{ padding: '28px 32px 32px' }}>

          {/* STEP 1 — branch selection */}
          {step === 'branch' && (
            <div className="fade-in">
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 16 }}>
                Selecciona tu sucursal para continuar:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {loading && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24, gridColumn: '1 / -1' }}>
                    Cargando sucursales...
                  </div>
                )}
                {!loading && locations.map(br => (
                  <button key={br.id} onClick={() => { setSelected(br); setPin(''); setError(''); }} style={{
                    background: selected?.id === br.id ? 'var(--primary-bg)' : 'var(--surface-alt)',
                    border: `2px solid ${selected?.id === br.id ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: 14, padding: '16px 18px',
                    textAlign: 'left', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (selected?.id !== br.id) { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.background = 'var(--primary-bg)'; }}}
                  onMouseLeave={e => { if (selected?.id !== br.id) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'var(--surface-alt)'; }}}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: selected?.id === br.id ? 'var(--primary)' : 'var(--text)' }}>{br.name}</div>
                      {selected?.id === br.id && (
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11 }}>✓</div>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{br.city}</div>
                  </button>
                ))}
              </div>
              <button
                disabled={!selected}
                onClick={() => { setPin(''); setError(''); }}
                style={{
                  width: '100%', height: 52, marginTop: 20,
                  background: selected ? 'var(--primary)' : 'var(--border)',
                  color: selected ? 'white' : 'var(--text-muted)',
                  border: 'none', borderRadius: 12,
                  fontSize: 15, fontWeight: 800, cursor: selected ? 'pointer' : 'not-allowed',
                  transition: 'background 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
                onMouseEnter={e => { if (selected) e.currentTarget.style.background = 'var(--primary-dark)'; }}
                onMouseLeave={e => { if (selected) e.currentTarget.style.background = 'var(--primary)'; }}
              >
                Continuar {selected ? `· ${selected.name}` : ''}
              </button>
            </div>
          )}

          {/* STEP 2 — PIN entry */}
          {step === 'pin' && selected && (
            <div className="fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <button onClick={() => { setSelected(null); setPin(''); setError(''); }} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 700, color: 'var(--primary)', padding: 0,
                }}>
                  <ArrowLeft /> Cambiar
                </button>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>
                  Ingresa la clave de <strong style={{ color: 'var(--text)' }}>{selected.name}</strong>
                </div>
              </div>

              {/* PIN dots */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 16, marginBottom: 24,
              }}>
                {[0,1,2,3].map(i => {
                  const filled = i < pin.length;
                  const isError = error && !success;
                  return (
                    <div key={i} style={{
                      width: 18, height: 18, borderRadius: '50%',
                      background: success ? 'var(--primary)' : isError ? 'var(--error)' : filled ? 'var(--text)' : 'transparent',
                      border: `2.5px solid ${success ? 'var(--primary)' : isError ? 'var(--error)' : filled ? 'var(--text)' : 'var(--border)'}`,
                      transition: 'all 0.15s',
                      animation: shake ? `shake 0.5s ease` : 'none',
                    }}/>
                  );
                })}
              </div>

              {error && (
                <div style={{
                  textAlign: 'center', fontSize: 13, fontWeight: 700,
                  color: 'var(--error)', marginBottom: 16,
                }}>
                  ⚠ {error}
                </div>
              )}
              {success && (
                <div style={{
                  textAlign: 'center', fontSize: 14, fontWeight: 800,
                  color: 'var(--primary)', marginBottom: 16,
                }}>
                  ✓ Acceso concedido
                </div>
              )}

              <PinKeypad value={pin} onChange={handlePinChange} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
