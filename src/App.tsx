import React, { useEffect, useRef } from 'react';

import { draw } from './draw';

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext('2d')!;

    requestAnimationFrame(function tick() {
      draw(ctx);
      requestAnimationFrame(tick);
    });
  }, []);

  return (
    <div className="App">
      <canvas ref={canvasRef} width={600} height={600} />
    </div>
  );
}
