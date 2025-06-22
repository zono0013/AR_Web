'use client';

import { useEffect, useRef, useState } from 'react';

export default function MotionTest() {
  const [acc, setAcc] = useState({ x: 0, y: 0, z: 0 });
  const [vel, setVel] = useState({ x: 0, y: 0, z: 0 });
  const [pos, setPos] = useState({ x: 0, y: 0, z: 0 });

  const lastTimestamp = useRef<number | null>(null);
  const velocity = useRef({ x: 0, y: 0, z: 0 });
  const position = useRef({ x: 0, y: 0, z: 0 });

  const threshold = 0.1; // 加速度のしきい値（ノイズ除去）
  const friction = 0;  // 減衰係数（0.0〜1.0） 1に近いほど摩擦少ない

  useEffect(() => {
    function handleMotion(event: DeviceMotionEvent) {
      const accRaw = event.acceleration;
      if (!accRaw) return;

      const filter = (v: number | null) => {
        const value = typeof v === 'number' ? v : 0;
        return Math.abs(value) < threshold ? 0 : value;
      };

      const x = filter(accRaw.x);
      const y = filter(accRaw.y);
      const z = filter(accRaw.z);
      setAcc({ x, y, z });

      const currentTime = event.timeStamp;
      if (lastTimestamp.current != null) {
        const dt = (currentTime - lastTimestamp.current) / 1000;

        // 加速度がゼロに近ければ速度を減衰させる
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
      }

      lastTimestamp.current = currentTime;
    }

    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      (DeviceMotionEvent as any).requestPermission()
        .then((response: string) => {
          if (response === 'granted') {
            window.addEventListener('devicemotion', handleMotion);
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>DeviceMotion 推定位置サンプル</h1>
      <p>加速度 (m/s²): x: {acc.x.toFixed(3)}, y: {acc.y.toFixed(3)}, z: {acc.z.toFixed(3)}</p>
      <p>速度 (m/s): x: {vel.x.toFixed(3)}, y: {vel.y.toFixed(3)}, z: {vel.z.toFixed(3)}</p>
      <p>推定位置 (m): x: {pos.x.toFixed(3)}, y: {pos.y.toFixed(3)}, z: {pos.z.toFixed(3)}</p>
    </div>
  );
}
