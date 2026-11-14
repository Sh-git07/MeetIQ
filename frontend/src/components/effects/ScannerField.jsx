import React, { useEffect, useRef } from 'react';

const LABELS = [
  'Product launch',
  'New CFO named',
  'Partnership',
  'Funding round',
  'Pricing change',
  'Leadership move',
  'Hiring surge',
  'Open question',
  'Earnings note'
];

export function ScannerField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dots = [];
    let animationFrameId;
    let isTabVisible = !document.hidden;

    const pointer = {
      x: width * 0.6,
      y: height * 0.4,
      targetX: width * 0.6,
      targetY: height * 0.4,
      lastActive: -99999
    };
    const lensRadius = 120;

    function initDots() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      dots = [];
      const gridSpacing = width < 600 ? 34 : 40;
      for (let y = gridSpacing / 2; y < height; y += gridSpacing) {
        for (let x = gridSpacing / 2; x < width; x += gridSpacing) {
          dots.push({
            x,
            y,
            ox: 0,
            oy: 0,
            vx: 0,
            vy: 0,
            label: Math.random() < 0.06 ? LABELS[Math.floor(Math.random() * LABELS.length)] : null
          });
        }
      }
    }

    initDots();

    const handleResize = () => {
      initDots();
    };

    const handlePointerMove = (e) => {
      pointer.targetX = e.clientX;
      pointer.targetY = e.clientY;
      pointer.lastActive = performance.now();

      // Magnetic buttons logic
      if (!prefersReducedMotion && isFinePointer) {
        const buttons = document.querySelectorAll('.btn-primary, [data-magnetic="true"]');
        buttons.forEach((btn) => {
          const rect = btn.getBoundingClientRect();
          const btnCenterX = rect.left + rect.width / 2;
          const btnCenterY = rect.top + rect.height / 2;
          const dx = e.clientX - btnCenterX;
          const dy = e.clientY - btnCenterY;
          const dist = Math.hypot(dx, dy);
          if (dist < 80) {
            btn.style.transform = `translate(${dx * 0.14}px, ${dy * 0.16}px)`;
          } else {
            btn.style.transform = '';
          }
        });
      }
    };

    const handlePointerDown = (e) => {
      if (prefersReducedMotion) return;
      for (const d of dots) {
        const dx = d.x - e.clientX;
        const dy = d.y - e.clientY;
        const dist = Math.hypot(dx, dy);
        if (dist < 200 && dist > 0) {
          const force = (1 - dist / 200) * 7;
          d.vx += (dx / dist) * force;
          d.vy += (dy / dist) * force;
        }
      }
    };

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    function render(time) {
      if (!isTabVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Idle wandering if no cursor move for 3s
      const isLiveCursor = time - pointer.lastActive < 3000;
      if (!isLiveCursor || !isFinePointer) {
        const angle = time / 2800;
        pointer.targetX = width * 0.5 + Math.cos(angle * 0.8) * width * 0.34;
        pointer.targetY = height * 0.5 + Math.sin(angle * 1.1) * height * 0.3;
      }

      // Smooth lerp lens position
      pointer.x += (pointer.targetX - pointer.x) * 0.16;
      pointer.y += (pointer.targetY - pointer.y) * 0.16;

      ctx.font = '600 12px "DM Sans", sans-serif';
      ctx.textBaseline = 'middle';

      for (const d of dots) {
        const px = d.x + d.ox;
        const py = d.y + d.oy;
        const dx = px - pointer.x;
        const dy = py - pointer.y;
        const dist = Math.hypot(dx, dy);

        if (!prefersReducedMotion) {
          if (dist < lensRadius && dist > 0.1) {
            const push = (1 - dist / lensRadius) * 0.5;
            d.vx += (dx / dist) * push;
            d.vy += (dy / dist) * push;
          }
          // Spring back to base position
          d.vx -= d.ox * 0.07;
          d.vy -= d.oy * 0.07;
          d.vx *= 0.84;
          d.vy *= 0.84;
          d.ox += d.vx;
          d.oy += d.vy;
        }

        const k = dist < lensRadius ? 1 - dist / lensRadius : 0;
        const u = d.x / (width || 1);

        ctx.beginPath();
        ctx.arc(px, py, 1.3 + k * 2.2, 0, 6.283);
        if (k > 0) {
          // Yellow -> Red gradient tint by position
          const redVal = Math.round(233 - 3 * u);
          const greenVal = Math.round(208 - 197 * u);
          const blueVal = Math.round(34 - 25 * u);
          const alphaVal = 0.35 + 0.65 * k;
          ctx.fillStyle = `rgba(${redVal}, ${greenVal}, ${blueVal}, ${alphaVal})`;
        } else {
          ctx.fillStyle = 'rgba(27, 22, 48, 0.13)';
        }
        ctx.fill();

        // Reveal faint label for selected dots near lens
        if (d.label && k > 0.3) {
          ctx.globalAlpha = Math.min(1, k * 1.6);
          ctx.lineWidth = 5;
          ctx.strokeStyle = '#FAF3E8';
          ctx.strokeText(d.label, px + 11, py);
          ctx.fillStyle = '#1B1630';
          ctx.fillText(d.label, px + 11, py);
          ctx.globalAlpha = 1;
        }
      }

      // Dashed lens outline ring
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, lensRadius, 0, 6.283);
      ctx.strokeStyle = 'rgba(230, 11, 9, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 7]);
      ctx.stroke();
      ctx.setLineDash([]);

      animationFrameId = requestAnimationFrame(render);
    }

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="scanner-canvas"
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}
