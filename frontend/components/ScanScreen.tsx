"use client";

import React, { useRef, useState, useEffect } from "react";
import { Tag, Barcode, X } from "./Icons";
import { Product, PRODUCTS } from "../lib/mockData";

interface ScanScreenProps {
  storeName: string;
  onResult: (product: Product) => void;
}

export default function ScanScreen({ storeName, onResult }: ScanScreenProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { 
    inputRef.current?.focus(); 
  }, []);

  const lookup = (raw: string) => {
    const key = raw.trim();
    const product = PRODUCTS[key];
    if (product) { 
      setError(''); 
      onResult(product); 
    } else { 
      setError('No pudimos encontrar este producto. Por favor, verifica el código con un asociado'); 
      setBusy(false); 
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    setTimeout(() => lookup(code), 550);
  };

  const demo = (k: string) => {
    setCode(k); 
    setError(''); 
    setBusy(true);
    setTimeout(() => lookup(k), 600);
  };

  const demos = Object.entries(PRODUCTS).map(([k, v]) => ({ code: k, label: v.name, category: v.category }));

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        background: 'var(--surface)',
        borderBottom: `1px solid var(--border)`,
        padding: '0 28px',
        height: 68,
        display: 'flex', alignItems: 'center', gap: 14,
        flexShrink: 0,
      }}>
        <div style={{
          width: 38, height: 38, background: 'var(--primary)', borderRadius: 9,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
          flexShrink: 0,
        }}>
          <Tag />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', letterSpacing: '-0.02em' }}>{storeName}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Verificador de Precios</div>
        </div>
      </div>

      {/* Body */}
      <div className="scan-body" style={{ flex: 1 }}>
        {/* Icon + heading */}
        <div className="fade-in" style={{ textAlign: 'center' }}>
          <div style={{
            width: 88, height: 88, borderRadius: '50%',
            background: 'var(--primary-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 18px',
            color: 'var(--primary)',
          }}>
            <Barcode />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.04em', marginBottom: 8 }}>
            Consulta el precio
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 300, margin: '0 auto', lineHeight: 1.55 }}>
            Escanea el código de barras del artículo o ingrésalo manualmente
          </p>
        </div>

        {/* Input card */}
        <div className="fade-in" style={{
          background: 'var(--surface)', borderRadius: 18, padding: '28px 28px 24px',
          width: '100%', maxWidth: 480,
          boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.06)',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              Código de barras / SKU
            </label>
            <div style={{ position: 'relative' }}>
              <input ref={inputRef} value={code}
                onChange={e => { setCode(e.target.value); setError(''); }}
                placeholder="p. ej. 7401234567890"
                style={{
                  width: '100%', height: 54,
                  border: `2px solid ${error ? 'var(--error)' : 'var(--border)'}`,
                  borderRadius: 11, padding: '0 44px 0 16px',
                  fontSize: 16, fontFamily: 'inherit', fontWeight: 700,
                  color: 'var(--text)', outline: 'none',
                  transition: 'border-color 0.15s',
                  letterSpacing: '0.03em',
                }}
                onFocus={e => { if (!error) e.target.style.borderColor = 'var(--primary)'; }}
                onBlur={e => { if (!error) e.target.style.borderColor = 'var(--border)'; }}
              />
              {code && (
                <button type="button" onClick={() => { setCode(''); setError(''); inputRef.current?.focus(); }} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'var(--border)', border: 'none', borderRadius: '50%', width: 24, height: 24,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--text-muted)',
                }}>
                  <X />
                </button>
              )}
            </div>
            {error && (
              <div style={{ fontSize: 13, color: 'var(--error)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                ⚠ {error}
              </div>
            )}
            <button type="submit" disabled={!code.trim() || busy} style={{
              height: 54, background: (!code.trim() || busy) ? 'var(--border)' : 'var(--primary)',
              color: (!code.trim() || busy) ? 'var(--text-muted)' : 'white',
              border: 'none', borderRadius: 11,
              fontSize: 15, fontWeight: 800, cursor: (!code.trim() || busy) ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s', letterSpacing: '0.01em',
            }}
            onMouseEnter={e => { if (code.trim() && !busy) e.currentTarget.style.background = 'var(--primary-dark)'; }}
            onMouseLeave={e => { if (code.trim() && !busy) e.currentTarget.style.background = 'var(--primary)'; }}
            >
              {busy ? 'Buscando…' : 'Consultar precio'}
            </button>
          </form>
        </div>

        {/* Demo products */}
        <div className="fade-in" style={{ width: '100%', maxWidth: 480 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-light)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}>
            Productos de ejemplo
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
            {demos.map(d => (
              <button key={d.code} onClick={() => demo(d.code)} style={{
                background: 'var(--surface)', border: `1.5px solid var(--border)`,
                borderRadius: 11, padding: '10px 14px', textAlign: 'left',
                cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-bg)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)'; }}
              >
                <div style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 2 }}>{d.category}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{d.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
