import React, { useEffect, useRef } from 'react';

const CATEGORY_COLORS = {
  0: '#E60B09', // product
  1: '#1B1630', // people / leadership
  2: '#D4A300', // financial
  3: '#3F7D58', // press / news
  product: '#E60B09',
  people: '#1B1630',
  leadership: '#1B1630',
  financial: '#D4A300',
  financials: '#D4A300',
  pricing: '#D4A300',
  press: '#3F7D58',
  news: '#3F7D58'
};

const SAMPLE_HERO_DATA = [
  ['Microsoft Blog', '4d ago', 0],
  ['Reuters', '21d ago', 1],
  ['Bloomberg', '9d ago', 2],
  ['SEC filing', '12d ago', 2],
  ['TechCrunch', '2d ago', 0],
  ['LinkedIn', '6d ago', 1],
  ['Press release', '4d ago', 3],
  ['The Verge', '15d ago', 3],
  ['Earnings call', '27d ago', 2],
  ['Partner portal', '8d ago', 0]
];

const STARS = Array.from({ length: 44 }, () => [
  Math.random(),
  Math.random(),
  Math.random()
]);

export function Constellation({
  mode = 'hero',
  company = 'Microsoft',
  meetingType = 'Partnership',
  meetingDate = 'briefing for 15 Nov, 3:00 pm',
  sources = [],
  verifiedIds = [],
  stage = 'planning',
  status = 'running'
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let animationFrameId;
    let isTabVisible = !document.hidden;

    const pointer = {
      x: -999,
      y: -999,
      isInside: false
    };

    let mx = 0;
    let my = 0;
    let assembleProgress = mode === 'hero' ? 0 : 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    // Map source nodes
    let nodeItems = [];
    if (mode === 'hero') {
      nodeItems = SAMPLE_HERO_DATA.map((item, i) => ({
        id: `hero_${i}`,
        title: item[0],
        age: item[1],
        color: CATEGORY_COLORS[item[2]] || '#E60B09',
        angle: (i / 10) * Math.PI * 2 + Math.random(),
        radiusRatio: 0.36 + (i % 3) * 0.17,
        inclination: [0.55, 1.05, 0.25][i % 3],
        speed: 0.00016 * (i % 2 ? 1 : -1) * (1 + (i % 3) * 0.35),
        radius: 5 + ((i * 7) % 5),
        visibility: 1,
        isVerified: 1,
        ox: 0,
        oy: 0,
        vx: 0,
        vy: 0
      }));
    }

    const handlePointerEnter = () => {
      pointer.isInside = true;
    };

    const handlePointerLeave = () => {
      pointer.isInside = false;
      pointer.x = -999;
      pointer.y = -999;
    };

    const handlePointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    };

    canvas.addEventListener('pointerenter', handlePointerEnter);
    canvas.addEventListener('pointerleave', handlePointerLeave);
    canvas.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('resize', resize);

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    function mix(a, b, t) {
      return a + (b - a) * t;
    }

    function render(time) {
      if (!isTabVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Determine target assemble state
      let targetAssemble = 0;
      if (mode === 'hero') {
        targetAssemble = pointer.isInside || Math.sin(time / 4300) > 0.5 ? 1 : 0;
      } else {
        targetAssemble = stage === 'completed' || status === 'completed' ? 1 : 0;
      }

      assembleProgress += (targetAssemble - assembleProgress) * (prefersReducedMotion ? 1 : 0.035);
      const easeAssemble = assembleProgress * assembleProgress * (3 - 2 * assembleProgress);

      const cx = width / 2;
      const cy = height / 2;
      const maxRadius = (Math.min(width, height) / 2) * 1.02;
      const hasPointer = pointer.x > -900;

      // Parallax easing toward pointer
      const targetMx = hasPointer ? (pointer.x - cx) / maxRadius : 0;
      const targetMy = hasPointer ? (pointer.y - cy) / maxRadius : 0;
      mx += (targetMx - mx) * 0.06;
      my += (targetMy - my) * 0.06;

      // 1. Draw background twinkling stars
      STARS.forEach((s) => {
        const starAlpha =
          (0.08 + 0.16 * Math.abs(Math.sin(time / 1200 + s[2] * 9))) * (1 - easeAssemble);
        ctx.fillStyle = `rgba(27, 22, 48, ${starAlpha})`;
        ctx.fillRect(s[0] * width, s[1] * height, 1.7, 1.7);
      });

      // Briefing sheet dimensions when assembled
      const sheetWidth = Math.min(width * 0.84, 340);
      const sheetHeight = height * 0.92;
      const sheetLeft = cx - sheetWidth / 2;
      const sheetTop = cy - sheetHeight / 2;
      const rowWidth = sheetWidth - 40;
      const titleX = sheetLeft + 34;
      const titleY = sheetTop + 38;

      // Core center position interpolates to top of briefing sheet
      const coreX = mix(cx, titleX, easeAssemble);
      const coreY = mix(cy, titleY, easeAssemble);

      // In research mode, dynamically update nodeItems from real sources
      if (mode === 'research') {
        if (!sources || sources.length === 0) {
          nodeItems = [];
        } else {
          nodeItems = sources.map((s, i) => {
            const existing = nodeItems.find((n) => n.id === String(s.id));
            const isVer =
              verifiedIds.includes(String(s.id)) ||
              stage === 'verifying' ||
              stage === 'generating' ||
              stage === 'completed';
            const catColor = CATEGORY_COLORS[s.category] || '#3F7D58';
            if (existing) {
              existing.isVerified = isVer ? 1 : 0;
              existing.title = s.title || s.publisher;
              existing.age = s.published_at ? s.published_at : 'date unavailable';
              existing.color = catColor;
              return existing;
            }
            return {
              id: String(s.id),
              title: s.title || s.publisher,
              age: s.published_at ? s.published_at : 'date unavailable',
              color: catColor,
              angle: (i / Math.max(sources.length, 1)) * Math.PI * 2 + Math.random(),
              radiusRatio: 0.36 + (i % 3) * 0.17,
              inclination: [0.55, 1.05, 0.25][i % 3],
              speed: 0.00016 * (i % 2 ? 1 : -1) * (1 + (i % 3) * 0.35),
              radius: 5 + ((i * 7) % 5),
              visibility: 1,
              isVerified: isVer ? 1 : 0,
              ox: 0,
              oy: 0,
              vx: 0,
              vy: 0
            };
          });
        }
      }

      // Calculate 3D orbits and depths
      const computedNodes = nodeItems.map((n, i) => {
        const angle = n.angle + (prefersReducedMotion ? 0 : time * n.speed);
        const ringRadius = n.radiusRatio * maxRadius;
        const x3D = Math.cos(angle) * ringRadius;
        const y3D = Math.sin(angle) * ringRadius * Math.cos(n.inclination);
        const z3D = Math.sin(angle) * ringRadius * Math.sin(n.inclination);

        let baseX = cx + x3D + mx * z3D * 0.25 + n.ox;
        let baseY = cy + y3D + my * z3D * 0.25 + n.oy;

        const dx = pointer.x - baseX;
        const dy = pointer.y - baseY;
        const dist = Math.hypot(dx, dy);

        let attractX = 0;
        let attractY = 0;
        if (hasPointer && dist < 140 && !prefersReducedMotion) {
          const force = (1 - dist / 140) * 0.2;
          attractX = dx * force;
          attractY = dy * force;
        }

        n.vx += (attractX - n.ox) * 0.08;
        n.vy += (attractY - n.oy) * 0.08;
        n.vx *= 0.8;
        n.vy *= 0.8;
        n.ox += n.vx;
        n.oy += n.vy;

        return {
          node: n,
          index: i,
          baseX,
          baseY,
          depth: z3D,
          scale: 1 + z3D / (maxRadius * 2),
          nearCursor: hasPointer && dist < 110 ? 1 - dist / 110 : 0
        };
      });

      // Sort by pseudo depth
      computedNodes.sort((a, b) => a.depth - b.depth);

      // 2. Orbital rings (dotted ellipses)
      if (easeAssemble < 0.98) {
        ctx.setLineDash([2, 8]);
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(230, 11, 9, ${0.2 * (1 - easeAssemble)})`;
        [0.36, 0.53, 0.7].forEach((k) => {
          ctx.beginPath();
          ctx.ellipse(cx, cy, k * maxRadius, k * maxRadius * 0.78, 0, 0, Math.PI * 2);
          ctx.stroke();
        });
        ctx.setLineDash([]);
      }

      // 3. Central core ambient glow
      const haloGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius * 0.6);
      haloGrad.addColorStop(0, `rgba(233, 208, 34, ${0.3 * (1 - easeAssemble)})`);
      haloGrad.addColorStop(1, 'rgba(233, 208, 34, 0)');
      ctx.fillStyle = haloGrad;
      ctx.fillRect(0, 0, width, height);

      // 4. Briefing sheet (appears on assemble)
      if (easeAssemble > 0.01) {
        ctx.save();
        ctx.globalAlpha = easeAssemble;
        ctx.shadowColor = 'rgba(27, 22, 48, 0.25)';
        ctx.shadowBlur = 40;
        ctx.shadowOffsetY = 16;
        ctx.fillStyle = '#FDF8EF'; // Raised cream
        ctx.beginPath();
        ctx.roundRect(sheetLeft, sheetTop, sheetWidth, sheetHeight, 20);
        ctx.fill();
        ctx.restore();

        ctx.globalAlpha = easeAssemble;
        ctx.strokeStyle = 'rgba(27, 22, 48, 0.14)';
        ctx.beginPath();
        ctx.moveTo(sheetLeft + 20, sheetTop + 70);
        ctx.lineTo(sheetLeft + sheetWidth - 20, sheetTop + 70);
        ctx.stroke();

        ctx.fillStyle = '#665F75';
        ctx.font = '400 11.5px "JetBrains Mono", monospace';
        ctx.textBaseline = 'middle';
        const sourceCount = nodeItems.length;
        ctx.fillText(
          `${sourceCount} sources · 30-day window verified`,
          sheetLeft + 20,
          sheetTop + sheetHeight - 20
        );
        ctx.globalAlpha = 1;
      }

      // 5. Lines and signal dots connecting core to nodes
      if (easeAssemble < 0.95) {
        computedNodes.forEach((item) => {
          const n = item.node;
          const lineGrad = ctx.createLinearGradient(cx, cy, item.baseX, item.baseY);
          lineGrad.addColorStop(
            0,
            `rgba(230, 11, 9, ${(0.1 + item.nearCursor * 0.4) * (1 - easeAssemble)})`
          );
          lineGrad.addColorStop(1, n.color);

          ctx.strokeStyle = lineGrad;
          ctx.lineWidth = 1 + item.nearCursor;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(item.baseX, item.baseY);
          ctx.stroke();

          // Signal dot travelling along line
          const progress = ((time / 2800) + item.index * 0.37) % 1;
          ctx.globalAlpha = 0.7 * Math.sin(progress * Math.PI) * (1 - easeAssemble);
          ctx.fillStyle = n.color;
          ctx.beginPath();
          ctx.arc(
            mix(cx, item.baseX, progress),
            mix(cy, item.baseY, progress),
            2.4,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.globalAlpha = 1;

          // Inter-node links
          computedNodes.forEach((other) => {
            if (other.index > item.index) {
              const d = Math.hypot(other.baseX - item.baseX, other.baseY - item.baseY);
              if (d < 110) {
                ctx.strokeStyle = `rgba(27, 22, 48, ${0.14 * (1 - d / 110) * (1 - easeAssemble)})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(item.baseX, item.baseY);
                ctx.lineTo(other.baseX, other.baseY);
                ctx.stroke();
              }
            }
          });
        });
      }

      // 6. Draw Nodes (orbiting dots or sheet rows)
      ctx.font = '500 12px "DM Sans", sans-serif';
      computedNodes.forEach((item) => {
        const n = item.node;
        const rowIndex = nodeItems.indexOf(n);
        const sheetRowY =
          sheetTop + 94 + rowIndex * ((sheetHeight - 134) / Math.max(nodeItems.length, 1));
        const posX = mix(item.baseX, cx, easeAssemble);
        const posY = mix(item.baseY, sheetRowY, easeAssemble);
        const nodeR = n.radius * item.scale;
        const curW = mix(2 * nodeR, rowWidth, easeAssemble);
        const curH = mix(2 * nodeR, 26, easeAssemble);

        ctx.save();
        ctx.globalAlpha = mix(Math.min(1, 0.5 + (item.scale - 0.85) * 1.6), 1, easeAssemble);

        if (status === 'failed') {
          ctx.globalAlpha = 0.3;
        }

        if (item.nearCursor > 0 && easeAssemble < 0.5) {
          ctx.shadowColor = n.color;
          ctx.shadowBlur = 18 * item.nearCursor;
        }

        ctx.beginPath();
        ctx.roundRect(posX - curW / 2, posY - curH / 2, curW, curH, curH / 2);

        // Solid vs dashed (verified vs unverified)
        if (n.isVerified === 0 && easeAssemble < 0.5) {
          ctx.fillStyle = 'rgba(250, 243, 232, 0.9)';
          ctx.fill();
          ctx.setLineDash([3, 3]);
          ctx.strokeStyle = n.color;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          ctx.fillStyle = easeAssemble > 0.5 ? '#FAF3E8' : n.color;
          ctx.fill();
          if (easeAssemble > 0.5) {
            ctx.strokeStyle = 'rgba(27, 22, 48, 0.08)';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
        ctx.restore();

        // Node labels
        const labelAlpha = Math.max(easeAssemble, item.nearCursor);
        if (labelAlpha > 0.05) {
          ctx.globalAlpha = labelAlpha;
          ctx.fillStyle = '#1B1630';
          if (easeAssemble > 0.5) {
            ctx.textAlign = 'left';
            const check = n.isVerified ? '✓ ' : '';
            ctx.fillText(`${check}${n.title.slice(0, 24)}`, posX - curW / 2 + 12, posY);
            ctx.fillStyle = n.color;
            ctx.textAlign = 'right';
            ctx.fillText(n.age, posX + curW / 2 - 12, posY);
          } else {
            ctx.textAlign = 'left';
            ctx.fillText(`${n.title} · ${n.age}`, posX + nodeR + 8, posY);
          }
          ctx.textAlign = 'left';
          ctx.globalAlpha = 1;
        }
      });

      // 7. Company Core (Center glowing disc)
      const coreRadius = mix(30, 11, easeAssemble);
      const coreGrad = ctx.createLinearGradient(
        coreX - coreRadius,
        coreY - coreRadius,
        coreX + coreRadius,
        coreY + coreRadius
      );
      coreGrad.addColorStop(0, '#E9D022');
      coreGrad.addColorStop(1, '#E60B09');

      // Slow expanding pulse ring
      if (easeAssemble < 0.9 && status !== 'failed' && !prefersReducedMotion) {
        const pulse = (time % 3800) / 3800;
        ctx.beginPath();
        ctx.arc(coreX, coreY, coreRadius + pulse * 60, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(230, 11, 9, ${0.25 * (1 - pulse) * (1 - easeAssemble)})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.save();
      if (status === 'failed') {
        // Red failure ring on failed
        ctx.shadowColor = '#C21A12';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#C21A12';
      } else {
        ctx.shadowColor = 'rgba(230, 11, 9, 0.6)';
        ctx.shadowBlur = 24 * (1 - easeAssemble) + 6;
        ctx.fillStyle = coreGrad;
      }
      ctx.beginPath();
      ctx.arc(coreX, coreY, coreRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Company name on core in orbit mode
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = 1 - easeAssemble;
      ctx.fillStyle = '#1B1630';
      ctx.font = '800 13px "Bricolage Grotesque", sans-serif';
      ctx.fillText((company || 'Microsoft').slice(0, 10), coreX, coreY);

      // Sheet title when assembled
      if (easeAssemble > 0.2) {
        ctx.globalAlpha = easeAssemble;
        ctx.fillStyle = '#1B1630';
        ctx.textAlign = 'left';
        ctx.font = '800 17px "Bricolage Grotesque", sans-serif';
        ctx.fillText(`${company} · ${meetingType}`, titleX + 20, titleY - 6);

        ctx.fillStyle = '#665F75';
        ctx.font = '400 11.5px "JetBrains Mono", monospace';
        ctx.fillText(meetingDate, titleX + 20, titleY + 14);
      }

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    }

    animationFrameId = requestAnimationFrame(render);

    return () => {
      canvas.removeEventListener('pointerenter', handlePointerEnter);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
      canvas.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mode, company, meetingType, meetingDate, sources, verifiedIds, stage, status]);

  return (
    <div className="relative w-full h-[min(86vh,780px)] min-h-[380px]">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={
          mode === 'hero'
            ? 'Sources orbit the company core and assemble into a one-page briefing'
            : `Live research constellation for ${company}: verified sources assembling into briefing`
        }
        className="absolute inset-0 w-full h-full block"
      />
    </div>
  );
}
