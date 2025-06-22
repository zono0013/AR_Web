'use client';
import dynamic from 'next/dynamic';

const ModelViewerClient = dynamic(() => import('@/components/ModelViewerClient'), {
  ssr: false, // 👈 サーバーではレンダリングしない
});

export default function ARQuickLookPage() {
  return (
    <main style={{ textAlign: 'center', padding: '2rem' }}>
      <h1>AR Quick Look モック</h1>
      <p>iOS Safariで以下のモデルをタップしてAR体験できます。</p>

      <ModelViewerClient />
    </main>
  );
}
