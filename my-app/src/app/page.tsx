'use client';

import {useEffect, useRef, useState} from 'react';
import * as THREE from 'three';

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);


  useEffect(() => {
    if (!started) return;

    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let box: THREE.Mesh;
    let videoTexture: THREE.VideoTexture;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const initThree = async () => {
      renderer = new THREE.WebGLRenderer({ alpha: true });
      renderer.setSize(width, height);
      containerRef.current?.appendChild(renderer.domElement);

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.set(0, 0, 0);

      const ambient = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambient);

      const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      const material = new THREE.MeshBasicMaterial({ color: 0xff6600 });
      box = new THREE.Mesh(geometry, material);
      box.position.set(1, 0, 0); // 視線の高さで、2m前方
      scene.add(box);

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

      const animate = () => {
        requestAnimationFrame(animate);
        box.rotation.x += 0.01;
        box.rotation.y += 0.01;
        renderer.render(scene, camera);
      };

      animate();
    };

    const updateOrientation = (event: DeviceOrientationEvent) => {
      if (!camera) return;

      const alpha = event.alpha ? THREE.MathUtils.degToRad(event.alpha) : 0; // z軸回転（方位）
      const beta = event.beta ? THREE.MathUtils.degToRad(event.beta) : 0;   // x軸回転（前後傾き）
      const gamma = event.gamma ? THREE.MathUtils.degToRad(event.gamma) : 0; // y軸回転（左右傾き）

      // z, x, y の順に回転行列を作る（Tait-Bryan angles Z-X'-Y''）
      const euler = new THREE.Euler(beta, gamma, alpha, 'ZXY');
      camera.quaternion.setFromEuler(euler);
    };

    const requestPermission = async () => {
      if (
        typeof (DeviceOrientationEvent as any).requestPermission === 'function'
      ) {
        try {
          const response = await (DeviceOrientationEvent as any).requestPermission();
          if (response === 'granted') {
            window.addEventListener('deviceorientation', updateOrientation);
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        window.addEventListener('deviceorientation', updateOrientation);
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

    startCamera();
    initThree();
    requestPermission();

    return () => {
      window.removeEventListener('deviceorientation', updateOrientation);
      renderer?.dispose();
    };
  }, [started]); // 依存配列にstartedを追加


  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
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
          }}
        >
          Start AR
        </button>
      )}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} id="canvas" />
    </div>
  );
}