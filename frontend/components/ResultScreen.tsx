"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Store } from "./Icons";
import { Product, BranchStock } from "../lib/mockData";

const TIMER_SECONDS = 15;

function TimerRing({ seconds, total }: { seconds: number; total: number }) {
  const r = 18, circ = 2 * Math.PI * r;
  const progress = seconds / total;
  const dash = circ * progress;
  const urgent = seconds <= 10;
  return (
    <div style={{ position: 'relative', width: 48, height: 48, flexShrink: 0 }}>
      <svg width="48" height="48" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="24" cy="24" r={r} fill="none" stroke={urgent ? 'var(--err-bg)' : 'var(--primary-bg)'} strokeWidth="3"/>
        <circle cx="24" cy="24" r={r} fill="none"
          stroke={urgent ? 'var(--error)' : 'var(--primary)'}
          strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.9s linear, stroke 0.3s' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 800,
        color: urgent ? 'var(--error)' : 'var(--primary)',
      }}>
        {seconds}
      </div>
    </div>
  );
}

function ProductImage({ product }: { product: Product }) {
  const lines = product.imageLabel.split('\n');
  return (
    <div className="image-panel" style={{
      background: product.imageBg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
      minHeight: 0,
      flex: 1, // To fill the layout grid cell
    }}>
      {/* Subtle overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.18) 100%)',
        pointerEvents: 'none',
      }}/>
      {/* Striped placeholder */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `repeating-linear-gradient(
          45deg,
          rgba(255,255,255,0.03) 0px,
          rgba(255,255,255,0.03) 2px,
          transparent 2px,
          transparent 14px
        )`,
        pointerEvents: 'none',
      }}/>
      <div style={{
        position: 'relative', zIndex: 1,
        textAlign: 'center', padding: '0 24px',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: 16,
          background: 'rgba(255,255,255,0.12)',
          border: '1.5px solid rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', fontSize: 10, textAlign: 'center', lineHeight: 1.4 }}>
            product<br/>shot
          </div>
        </div>
        {lines.map((l, i) => (
          <div key={i} style={{
            fontSize: i === 0 ? 17 : 13,
            fontWeight: i === 0 ? 800 : 500,
            color: i === 0 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)',
            letterSpacing: i === 0 ? '-0.02em' : '0',
            marginTop: i === 0 ? 0 : 4,
          }}>
            {l}
          </div>
        ))}
        <div style={{
          marginTop: 12,
          display: 'inline-block',
          background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 6,
          padding: '3px 10px',
          fontSize: 11, color: 'rgba(255,255,255,0.7)',
          fontFamily: 'monospace', letterSpacing: '0.04em',
        }}>
          {product.sku}
        </div>
      </div>
      {/* Category badge */}
      <div style={{
        position: 'absolute', top: 16, left: 16,
        background: 'rgba(255,255,255,0.15)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: 6,
        padding: '4px 10px',
        fontSize: 11, fontWeight: 700,
        color: 'rgba(255,255,255,0.85)',
        letterSpacing: '0.06em', textTransform: 'uppercase',
        backdropFilter: 'blur(8px)',
      }}>
        {product.category}
      </div>
    </div>
  );
}

function BranchRow({ branch, isCurrentStore }: { branch: BranchStock; isCurrentStore: boolean }) {
  const out = branch.qty === 0;
  const low = branch.qty > 0 && branch.qty <= 5;
  const color = out ? 'var(--error)' : low ? 'var(--warning)' : 'var(--primary)';
  const bgColor = out ? 'var(--err-bg)' : low ? 'var(--warn-bg)' : 'var(--primary-bg)';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px',
      background: isCurrentStore ? 'var(--primary-bg)' : 'var(--surface)',
      borderRadius: 10,
      border: `1.5px solid ${isCurrentStore ? 'rgba(16,132,116,0.4)' : 'var(--border)'}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{ color: isCurrentStore ? 'var(--primary)' : 'var(--text-muted)' }}><Store /></div>
        <div style={{ fontSize: 13, fontWeight: isCurrentStore ? 700 : 500, color: isCurrentStore ? 'var(--primary)' : 'var(--text)' }}>
          {branch.name}
          {isCurrentStore && <span style={{ fontSize: 10, marginLeft: 6, opacity: 0.7 }}>· esta sucursal</span>}
        </div>
      </div>
      <div style={{
        background: bgColor,
        color,
        fontSize: 12, fontWeight: 800,
        padding: '3px 10px', borderRadius: 20,
        letterSpacing: '0.01em',
      }}>
        {out ? 'Agotado' : `${branch.qty} pza`}
      </div>
    </div>
  );
}

interface ResultScreenProps {
  product: Product;
  onBack: () => void;
  storeName: string;
}

export default function ResultScreen({ product, onBack, storeName }: ResultScreenProps) {
  const [secs, setSecs] = useState(TIMER_SECONDS);
  const hasSale = product.priceSale !== null;
  const discount = hasSale && product.priceSale ? Math.round((1 - product.priceSale / product.price) * 100) : 0;
  const totalStock = product.branches.reduce((a, b) => a + b.qty, 0);

  const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

  useEffect(() => {
    const id = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (secs <= 0) {
      onBack();
    }
  }, [secs, onBack]);

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        background: 'var(--surface)', borderBottom: `1px solid var(--border)`,
        padding: '0 24px', height: 68, flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--surface-alt)', border: `1.5px solid var(--border)`,
          borderRadius: 9, padding: '7px 16px',
          fontSize: 13, fontWeight: 700, color: 'var(--text)',
          cursor: 'pointer', transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#e6ebed'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-alt)'}
        >
          <ArrowLeft /> Regresar
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{storeName}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Verificador de Precios</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Nueva consulta en</div>
          <TimerRing seconds={secs} total={TIMER_SECONDS} />
        </div>
      </div>

      {/* Two-column body */}
      <div className="result-layout" style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 0 }}>

        {/* LEFT — Product image */}
        <ProductImage product={product} />

        {/* RIGHT — Details */}
        <div style={{
          background: 'var(--surface-alt)',
          overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
          padding: '28px 28px 24px',
          gap: 20,
        }}>
          {/* Name + style */}
          <div className="slide-up">
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
              {product.category} · {product.color} · Talla {product.size}
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.04em', lineHeight: 1.1, textWrap: 'balance' }}>
              {product.name}
            </h2>
          </div>

          {/* Price block */}
          <div className="slide-up slide-up-d1" style={{
            background: 'var(--surface)', borderRadius: 14,
            padding: '20px 22px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            border: hasSale ? `2px solid rgba(16,132,116,0.22)` : `1.5px solid var(--border)`,
          }}>
            {hasSale && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{
                  background: 'var(--primary)', color: 'white',
                  fontSize: 11, fontWeight: 900,
                  padding: '3px 10px', borderRadius: 20,
                  letterSpacing: '0.04em',
                }}>
                  -{discount}% OFF
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Precio especial</div>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 40, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.05em', lineHeight: 1 }}>
                {fmt(hasSale && product.priceSale ? product.priceSale : product.price)}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>MXN / pieza</div>
            </div>
            {hasSale && product.priceSale && (
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 16, color: 'var(--text-light)', textDecoration: 'line-through', fontWeight: 600 }}>
                  {fmt(product.price)} MXN
                </div>
                <div style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 800 }}>
                  Ahorras {fmt(product.price - product.priceSale)}
                </div>
              </div>
            )}
          </div>

          {/* Metadata: SKU + Style */}
          <div className="slide-up slide-up-d2" style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
          }}>
            {[
              { label: 'SKU', value: product.sku },
              { label: 'Estilo', value: product.style },
            ].map(m => (
              <div key={m.label} style={{
                background: 'var(--surface)', borderRadius: 10,
                padding: '12px 14px',
                border: `1.5px solid var(--border)`,
              }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-light)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 3 }}>{m.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontFamily: 'monospace', letterSpacing: '0.04em' }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Sizes */}
          {product.allSizes && product.allSizes.length > 0 && (
            <div className="slide-up slide-up-d3">
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>
                Tallas en este estilo
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {product.allSizes.map(sz => {
                  const isCurrent = sz === product.size;
                  const isAvailable = product.availableSizes?.includes(sz);
                  
                  let bg = 'var(--surface)';
                  let color = 'var(--text)';
                  let border = '1.5px solid var(--border)';
                  let textDeco = 'none';
                  let opacity = 1;
                  
                  if (isCurrent) {
                    bg = 'var(--primary)';
                    color = 'white';
                    border = '1.5px solid var(--primary)';
                  } else if (!isAvailable) {
                    bg = 'var(--surface-alt)';
                    color = 'var(--text-light)';
                    textDeco = 'line-through';
                    opacity = 0.5;
                  }
                  
                  return (
                    <div key={sz} style={{
                      background: bg,
                      color: color,
                      border: border,
                      textDecoration: textDeco,
                      opacity: opacity,
                      borderRadius: 8,
                      padding: '6px 12px',
                      fontSize: 13,
                      fontWeight: isCurrent ? 800 : 600,
                      fontFamily: 'monospace',
                    }}>
                      {sz}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Branches */}
          <div className="slide-up slide-up-d4">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                Existencias por sucursal
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                {totalStock} total
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {product.branches.map((br, i) => (
                <BranchRow key={br.name} branch={br} isCurrentStore={i === 0} />
              ))}
            </div>
          </div>

          {/* Timer notice */}
          <div className="slide-up" style={{
            animationDelay: '0.30s',
            marginTop: 'auto',
            paddingTop: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, color: secs <= 10 ? 'var(--error)' : 'var(--text-light)',
            fontSize: 12, fontWeight: 600,
            transition: 'color 0.3s',
          }}>
            <span style={{ fontSize: 14 }}>{secs <= 10 ? '⏱' : '○'}</span>
            Pantalla se reinicia en {secs} segundo{secs !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  );
}
