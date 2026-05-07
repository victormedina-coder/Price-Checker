"use client";

import React from "react";
import Image from "next/image";
import logoNegro from "../assets/logos/WesternBrothers-Logotipo-Horizontal-Negro.png";

export default function MaintenanceScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'var(--surface-alt)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 32, textAlign: 'center',
    }}>
      {/* Logo */}
      <div style={{ position: 'relative', height: 24, width: 376, flexShrink: 0, marginBottom: 40, opacity: 0.6 }}>
        <Image src={logoNegro} alt="Western Brothers" fill sizes="376px" style={{ objectFit: 'cover', objectPosition: 'center' }} />
      </div>

      {/* Icono */}
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'var(--primary-bg)',
        border: '2px solid var(--primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 36, marginBottom: 24,
      }}>
        🔧
      </div>

      {/* Título */}
      <h1 style={{
        fontSize: 28, fontWeight: 900,
        color: 'var(--text)', letterSpacing: '-0.04em',
        marginBottom: 12,
        fontFamily: 'var(--font-heading)',
      }}>
        En Mantenimiento
      </h1>

      {/* Descripción */}
      <p style={{
        fontSize: 15, color: 'var(--text-muted)',
        maxWidth: 380, lineHeight: 1.6, marginBottom: 32,
        fontFamily: 'var(--font-body)',
      }}>
        El verificador de precios está temporalmente fuera de servicio.
        Por favor, acércate a un asociado para consultar precios.
      </p>

      {/* Divider */}
      <div style={{
        width: 40, height: 2,
        background: 'var(--primary)',
        opacity: 0.4, borderRadius: 2,
      }}/>
    </div>
  );
}
