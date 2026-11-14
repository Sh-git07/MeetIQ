import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function TextMagnifier() {
  const location = useLocation();

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    if (prefersReducedMotion || !isFinePointer) return;

    let wordsList = [];
    let animationFrameId;

    const wrapWords = () => {
      wordsList = [];
      const root = document.getElementById('main-content') || document.querySelector('main') || document.body;
      if (!root) return;

      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
            const parent = node.parentElement;
            if (
              !parent ||
              parent.closest(
                'button, .btn-primary, .btn-ghost, input, select, textarea, canvas, nav, sup, .text-gradient, .terminal-box, .log-box, script, style, .no-magnify'
              )
            ) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      const textNodes = [];
      while (walker.nextNode()) {
        textNodes.push(walker.currentNode);
      }

      textNodes.forEach((node) => {
        const parts = node.nodeValue.split(/(\s+)/);
        const fragment = document.createDocumentFragment();

        parts.forEach((p) => {
          if (!p) return;
          if (/^\s+$/.test(p)) {
            fragment.append(p);
          } else {
            const span = document.createElement('span');
            span.className = 'wd';
            span.textContent = p;
            fragment.append(span);
            wordsList.push({
              el: span,
              currentScale: 1,
              targetScale: 1,
              x: 0,
              y: 0
            });
          }
        });

        node.replaceWith(fragment);
      });

      measureWords();
    };

    const measureWords = () => {
      wordsList.forEach((w) => {
        const rect = w.el.getBoundingClientRect();
        w.x = rect.left + rect.width / 2 + window.scrollX;
        w.y = rect.top + rect.height / 2 + window.scrollY;
      });
    };

    let pointerX = -9999;
    let pointerY = -9999;

    const handlePointerMove = (e) => {
      pointerX = e.clientX + window.scrollX;
      pointerY = e.clientY + window.scrollY;
    };

    const handleScroll = () => {
      measureWords();
    };

    // Delay word wrapping slightly so route components finish mounting
    const timer1 = setTimeout(wrapWords, 250);
    const timer2 = setTimeout(measureWords, 750);

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', measureWords);

    function loop() {
      for (const w of wordsList) {
        const dist = Math.hypot(w.x - pointerX, w.y - pointerY);
        const scaleBoost = dist < 80 ? 0.06 * Math.pow(1 - dist / 80, 1.4) : 0;
        w.targetScale = 1 + scaleBoost;
        w.currentScale += (w.targetScale - w.currentScale) * 0.18;

        if (Math.abs(w.currentScale - 1) > 0.001 || Math.abs(w.targetScale - 1) > 0.001) {
          w.el.style.transform = `scale(${w.currentScale.toFixed(3)})`;
        } else if (w.el.style.transform) {
          w.el.style.transform = '';
        }
      }
      animationFrameId = requestAnimationFrame(loop);
    }

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', measureWords);
      cancelAnimationFrame(animationFrameId);
    };
  }, [location.pathname]);

  return null;
}
