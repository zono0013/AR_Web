'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function OrientationTest() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [orientation, setOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;

    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let cube: THREE.Mesh;
    let videoTexture: THREE.VideoTexture;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // 初期化
    const init = () => {
      renderer = new THREE.WebGLRenderer({ alpha: true });
      renderer.setSize(width, height);
      containerRef.current?.appendChild(renderer.domElement);

      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.set(0, 1.6, 2);

      const light = new THREE.AmbientLight(0xffffff, 1);
      scene.add(light);

      // 目印の立方体
      const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
      cube = new THREE.Mesh(geometry, material);
      cube.position.set(0, 1.6, -1);
      scene.add(cube);

      // 背景（Plane with video）
      if (videoRef.current && videoRef.current.readyState >= 2) {
        videoTexture = new THREE.VideoTexture(videoRef.current);
        const backgroundGeometry = new THREE.PlaneGeometry(16, 9);
        const backgroundMaterial = new THREE.MeshBasicMaterial({ map: videoTexture });
        const backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
        backgroundMesh.position.z = -5;
        scene.add(backgroundMesh);
      }
    };

    // DeviceOrientationイベントの処理
    const handleOrientation = (event: DeviceOrientationEvent) => {
      setOrientation({
        alpha: event.alpha ?? 0,
        beta: event.beta ?? 0,
        gamma: event.gamma ?? 0,
      });

      // カメラの回転を設定（ZXY順のオイラー角）
      const alphaRad = THREE.MathUtils.degToRad(event.alpha ?? 0);
      const betaRad = THREE.MathUtils.degToRad(event.beta ?? 0);
      const gammaRad = THREE.MathUtils.degToRad(event.gamma ?? 0);
      const euler = new THREE.Euler(betaRad, gammaRad, alphaRad, 'ZXY');
      camera.quaternion.setFromEuler(euler);
    };

    // 描画ループ
    const animate = () => {
      requestAnimationFrame(animate);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
    };

    // 初期化＆イベント登録
    init();

    // iOSでのパーミッション要求対応
    const requestPermission = async () => {
      if (
        typeof (DeviceOrientationEvent as any).requestPermission === 'function'
      ) {
        try {
          const response = await (DeviceOrientationEvent as any).requestPermission();
          if (response === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        window.addEventListener('deviceorientation', handleOrientation);
      }
    };
    requestPermission();

    animate();

    // クリーンアップ
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      renderer.dispose();
    };
  }, [started]);

  return (
    <>
      {!started && (
        <button
          onClick={() => setStarted(true)}
          style={{
            position: 'absolute',
            zIndex: 10,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '1rem 2rem',
            fontSize: '1.2rem',
            backgroundColor: 'aquamarine',
          }}
        >
          Start AR
        </button>
      )}
      <div
        ref={containerRef}
        style={{ width: '100vw', height: '100vh', background: '#111' }}
      />
      <div
        style={{
          position: 'fixed',
          top: 10,
          left: 10,
          color: 'white',
          background: 'rgba(0,0,0,0.5)',
          padding: '10px',
          fontFamily: 'monospace',
          zIndex: 1000,
          userSelect: 'none',
        }}
      >
        <div>Alpha (Z): {orientation.alpha.toFixed(1)}</div>
        <div>Beta (X): {orientation.beta.toFixed(1)}</div>
        <div>Gamma (Y): {orientation.gamma.toFixed(1)}</div>
      </div>
    </>
  );
}
