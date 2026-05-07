"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Barcode, X } from "./Icons";
import { Product } from "../lib/types";
import { getProduct, ProductNotFoundError, ServiceUnavailableError } from "../lib/api";
import logoNegro from "../assets/logos/WesternBrothers-Logotipo-Horizontal-Negro.png";

interface ScanScreenProps {
  storeName: string;
  onResult: (product: Product) => void;
}

export default function ScanScreen({ storeName, onResult }: ScanScreenProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [serviceDown, setServiceDown] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const validateCode = (raw: string): string | null => {
    const v = raw.trim();
    if (v.length < 3)  return 'El código es demasiado corto. Verifica el artículo.';
    if (v.length > 30) return 'El código es demasiado largo. Verifica el artículo.';
    if (!/^[a-zA-Z0-9\-]+$/.test(v)) return 'El código contiene caracteres no válidos. Intenta escanearlo de nuevo.';
    return null;
  };

  const lookup = async (raw: string) => {
    const key = raw.trim();
    setServiceDown(false);
    try {
      const product = await getProduct(key);
      setError('');
      onResult(product);
    } catch (e) {
      if (e instanceof ServiceUnavailableError) {
        setServiceDown(true);
        setError('');
      } else if (e instanceof ProductNotFoundError) {
        setError('No pudimos encontrar este producto. Por favor, verifica el código con un asociado.');
      } else {
        setError('Ocurrió un error inesperado. Intenta de nuevo.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || busy) return;
    const validationError = validateCode(code);
    if (validationError) { setError(validationError); return; }
    setBusy(true);
    lookup(code);
  };

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
        <div style={{ position: 'relative', height: 24, width: 376, flexShrink: 0 }}>
          <Image src={logoNegro} alt="Western Brothers" fill sizes="376px" priority style={{ objectFit: 'cover', objectPosition: 'center' }} />
        </div>
        <div style={{ height: 20, width: 1, background: 'var(--border)', flexShrink: 0 }} />
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
          {storeName.includes('—') ? storeName.split('—')[1].trim() : 'Verificador de Precios'}
        </div>
      </div>

      {/* Body */}
      <div className="scan-body" style={{ flex: 1 }}>
        {/* Icon + heading */}
        <div className="fade-in" style={{ textAlign: 'center' }}>

          {/* Scanner target */}
          <div style={{ position: 'relative', width: 136, height: 136, margin: '0 auto 20px' }}>

            {/* Fondo */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'var(--primary-bg)',
              borderRadius: 10,
            }}/>

            {/* Ícono de barras */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--primary)', opacity: 0.5,
            }}>
              <Barcode />
            </div>

            {/* Línea de escaneo */}
            <div style={{
              position: 'absolute', left: 10, right: 10, height: 2,
              background: 'linear-gradient(90deg, transparent 0%, var(--primary) 30%, var(--primary) 70%, transparent 100%)',
              boxShadow: '0 0 10px 2px var(--primary)',
              borderRadius: 1,
              animation: 'scanLine 2s ease-in-out infinite',
            }}/>

            {/* Esquinas — top-left */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: 18, height: 18,
              borderTop: '3px solid var(--primary)', borderLeft: '3px solid var(--primary)', borderRadius: '4px 0 0 0' }}/>
            {/* Esquinas — top-right */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: 18, height: 18,
              borderTop: '3px solid var(--primary)', borderRight: '3px solid var(--primary)', borderRadius: '0 4px 0 0' }}/>
            {/* Esquinas — bottom-left */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: 18, height: 18,
              borderBottom: '3px solid var(--primary)', borderLeft: '3px solid var(--primary)', borderRadius: '0 0 0 4px' }}/>
            {/* Esquinas — bottom-right */}
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 18, height: 18,
              borderBottom: '3px solid var(--primary)', borderRight: '3px solid var(--primary)', borderRadius: '0 0 4px 0' }}/>
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.04em', marginBottom: 8 }}>
            Escanea el código de barras
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 300, margin: '0 auto', lineHeight: 1.55 }}>
            Apunta el escáner a la etiqueta del artículo, o ingrésalo manualmente
          </p>
        </div>

        {/* Servicio no disponible */}
        {serviceDown && (
          <div className="fade-in" style={{
            width: '100%', maxWidth: 480,
            background: 'var(--err-bg)',
            border: '1.5px solid var(--error)',
            borderRadius: 14, padding: '18px 22px',
            display: 'flex', alignItems: 'flex-start', gap: 14,
          }}>
            <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>⚠️</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--error)', marginBottom: 4 }}>
                Servicio no disponible temporalmente
              </div>
              <div style={{ fontSize: 13, color: 'var(--error)', opacity: 0.85, lineHeight: 1.5 }}>
                No fue posible conectar con el catálogo. Verifica la conexión a internet o consulta con un asociado.
              </div>
            </div>
          </div>
        )}

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
                onChange={e => { setCode(e.target.value); setError(''); setServiceDown(false); }}
                placeholder="p. ej. 7506552409252"
                inputMode="none"
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
                <button type="button" onClick={() => { setCode(''); setError(''); setServiceDown(false); inputRef.current?.focus(); }} style={{
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
      </div>
    </div>
  );
}
