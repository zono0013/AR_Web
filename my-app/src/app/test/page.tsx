'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function ARCameraControl() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [acc, setAcc] = useState({ x: 0, y: 0, z: 0 });
  const [vel, setVel] = useState({ x: 0, y: 0, z: 0 });
  const [pos, setPos] = useState({ x: 0, y: 0, z: 0 });

  const lastTimestamp = useRef<number | null>(null);
  const velocity = useRef({ x: 0, y: 0, z: 0 });
  const position = useRef({ x: 0, y: 0, z: 0 });

  const threshold = 0.1;　// 加速度のしきい値（ノイズ除去）
  const friction = 0.2; // 減衰係数（0.0〜1.0） 1に近いほど摩擦少ない

  useEffect(() => {
    if (!started) return;

    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let cube: THREE.Mesh;
    let videoTexture: THREE.VideoTexture;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const init = () => {
      renderer = new THREE.WebGLRenderer({ alpha: true });
      renderer.setSize(width, height);
      containerRef.current?.appendChild(renderer.domElement);

      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.set(0, 0, 0); // 初期位置

      const light = new THREE.AmbientLight(0xffffff, 1);
      scene.add(light);

      const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
      cube = new THREE.Mesh(geometry, material);
      cube.position.set(0, 4, 0);
      scene.add(cube);

      // 背景（Plane with video）
      if (videoRef.current && videoRef.current.readyState >= 2) {
        videoTexture = new THREE.VideoTexture(videoRef.current);
        const backgroundGeometry = new THREE.PlaneGeometry(16, 9);
        backgroundGeometry.scale(1, 1, 1);
        const backgroundMaterial = new THREE.MeshBasicMaterial({ map: videoTexture });
        const backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
        backgroundMesh.position.z = -5;
        scene.add(backgroundMesh);
      }
    };

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const alphaRad = THREE.MathUtils.degToRad(event.alpha ?? 0);
      const betaRad = THREE.MathUtils.degToRad(event.beta ?? 0);
      const gammaRad = THREE.MathUtils.degToRad(event.gamma ?? 0);
      const euler = new THREE.Euler(betaRad, gammaRad, alphaRad, 'ZXY');
      camera.quaternion.setFromEuler(euler);
    };

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.acceleration;
      if (!acc) return;

      const filter = (v: number | null) => {
        const val = typeof v === 'number' ? v : 0;
        return Math.abs(val) < threshold ? 0 : val;
      };

      const x = filter(acc.x);
      const y = filter(acc.y);
      const z = filter(acc.z);
      setAcc({ x, y, z });

      const currentTime = event.timeStamp;
      if (lastTimestamp.current != null) {
        const dt = (currentTime - lastTimestamp.current) / 1000;

        if (x === 0) velocity.current.x *= friction;
        else velocity.current.x += x * dt;

        if (y === 0) velocity.current.y *= friction;
        else velocity.current.y += y * dt;

        if (z === 0) velocity.current.z *= friction;
        else velocity.current.z += z * dt;

        setVel({ ...velocity.current });

        position.current.x += velocity.current.x * dt;
        position.current.y += velocity.current.y * dt;
        position.current.z += velocity.current.z * dt;
        setPos({ ...position.current });

        // カメラ位置更新
        camera.position.set(
          position.current.x,
          position.current.y,
          position.current.z
        );
      }
      lastTimestamp.current = currentTime;
    };

    const requestPermissions = async () => {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try {
          const res1 = await (DeviceOrientationEvent as any).requestPermission();
          const res2 = await (DeviceMotionEvent as any).requestPermission?.();
          if (res1 === 'granted' && res2 === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
            window.addEventListener('devicemotion', handleMotion);
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        window.addEventListener('deviceorientation', handleOrientation);
        window.addEventListener('devicemotion', handleMotion);
      }
    };

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        console.error('カメラの取得に失敗しました', err);
      }
    };

    init();
    requestPermissions();
    startCamera();

    const animate = () => {
      requestAnimationFrame(animate);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('devicemotion', handleMotion);
      renderer.dispose();
    };
  }, [started]);

  return (
    <>
      <video
        ref={videoRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: -1,
        }}
        autoPlay
        muted
        playsInline
      />
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
      <div style={{padding: 20}}>
        <h1>DeviceMotion 推定位置サンプル</h1>
        <p>加速度 (m/s²): x: {acc.x.toFixed(3)}, y: {acc.y.toFixed(3)}, z: {acc.z.toFixed(3)}</p>
        <p>速度 (m/s): x: {vel.x.toFixed(3)}, y: {vel.y.toFixed(3)}, z: {vel.z.toFixed(3)}</p>
        <p>推定位置 (m): x: {pos.x.toFixed(3)}, y: {pos.y.toFixed(3)}, z: {pos.z.toFixed(3)}</p>
      </div>
      <div
        ref={containerRef}
        style={{width: '100vw', height: '100vh'}}
      />
    </>
  );
}
