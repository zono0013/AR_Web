'use client';
import React, { useEffect } from 'react';

export default function ModelViewerClient() {
  useEffect(() => {
    import('@google/model-viewer');
  }, []);

  return (
    <>
      { /* @ts-expect-error - model-viewer is not a valid HTML element, but it is a valid custom element */}
      <model-viewer src="/models/pancakes.glb" ios-src="/models/pancakes.usdz" ar auto-rotate camera-controls style={{ width: '100%', height: '100vh' }}/>
    </>
  );
}
