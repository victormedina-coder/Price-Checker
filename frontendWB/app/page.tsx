"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import ScreenSaver from "../components/ScreenSaver";
import BranchLoginScreen from "../components/BranchLoginScreen";
import ScanScreen from "../components/ScanScreen";
import ResultScreen from "../components/ResultScreen";
import { Location, Product } from "../lib/types";

const IDLE_TIMEOUT = 15; // seconds before screensaver

export default function Home() {
  const [branch, setBranch] = useState<Location | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [screensaver, setScreensaver] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const idleRef = useRef<NodeJS.Timeout | null>(null);

  const resetIdle = useCallback(() => {
    if (idleRef.current) clearTimeout(idleRef.current);
    if (screensaver) return; // let screensaver handle its own click
    idleRef.current = setTimeout(() => setScreensaver(true), IDLE_TIMEOUT * 1000);
  }, [screensaver]);

  useEffect(() => {
    // Manejo de eventos de inactividad
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    const handleEvent = () => resetIdle();
    
    events.forEach(e => window.addEventListener(e, handleEvent, { passive: true }));
    resetIdle();
    
    // Manejo de conexión de red
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set inicial de estado de red
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
    }

    return () => {
      events.forEach(e => window.removeEventListener(e, handleEvent));
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (idleRef.current) clearTimeout(idleRef.current);
    };
  }, [resetIdle]);

  const handleDismissScreensaver = () => {
    setScreensaver(false);
    if (idleRef.current) clearTimeout(idleRef.current);
    idleRef.current = setTimeout(() => setScreensaver(true), IDLE_TIMEOUT * 1000);
  };

  const storeName = branch ? `Western Brothers — ${branch.name}` : 'Western Brothers';

  if (isOffline) {
    return (
      <div style={{
        width: '100%', minHeight: '100vh', 
        display: 'flex', flexDirection: 'column', 
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--surface-alt)',
        padding: 32, textAlign: 'center'
      }}>
        <div style={{
          width: 88, height: 88, borderRadius: '50%',
          background: 'var(--err-bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 18px',
          color: 'var(--error)',
          fontSize: 32, fontWeight: 900
        }}>
          !
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.04em', marginBottom: 12 }}>
          Sin conexión
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto', lineHeight: 1.55 }}>
          Problemas de conexión a Internet. Por favor, acércate a un asociado.
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', position: 'relative' }}>
      {product ? (
        <ResultScreen
          key={product.name}
          product={product} 
          onBack={() => setProduct(null)} 
          storeName={storeName} 
        />
      ) : (
        <ScanScreen 
          onResult={setProduct} 
          storeName={storeName} 
        />
      )}
      
      {!branch && !screensaver && (
        <BranchLoginScreen onLogin={setBranch} />
      )}
      
      {screensaver && (
        <ScreenSaver onDismiss={handleDismissScreensaver} />
      )}
    </div>
  );
}
