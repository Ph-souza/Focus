const fs = require('fs');
const path = require('path');

const inputPath = 'C:/Users/phillipe.pimenta/Downloads/nexus_focus_landing_phone_mockup_focus.html';
const html = fs.readFileSync(inputPath, 'utf8');

// 1. Extract styles
const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/g);
let cssContent = '';
if (styleMatch) {
  cssContent = styleMatch.map(s => s.replace(/<\/?style[^>]*>/g, '')).join('\n');
}

// 2. Extract body
let bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
let bodyContent = bodyMatch ? bodyMatch[1] : html;

// 3. Extract and remove scripts
const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
let scripts = [];
let match;
while ((match = scriptRegex.exec(bodyContent)) !== null) {
  if (match[1].trim()) {
    scripts.push(match[1]);
  }
}
bodyContent = bodyContent.replace(scriptRegex, '');

// Clean up references to the removed head/body
fs.writeFileSync('public/assets/landing.html', bodyContent);
fs.writeFileSync('src/components/LandingPage.css', cssContent);

// 4. Generate TSX
const tsxContent = `import React, { useEffect, useRef, useState } from 'react';
import './LandingPage.css';

export function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState<string>('');

  useEffect(() => {
    fetch('/assets/landing.html')
      .then(res => res.text())
      .then(text => {
        setHtml(text);
      })
      .catch(err => console.error('Error loading landing page', err));
  }, []);

  useEffect(() => {
    if (!html || !containerRef.current) return;
    
    // Once HTML is injected, we run the extracted scripts manually
    const stage = document.querySelector('.phone-showcase');
    const scene = document.querySelector('.phone-scene');
    const button = document.querySelector('.motion-toggle');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = window.matchMedia('(hover:hover) and (pointer:fine)');
    
    let paused = false, frame = 0;
    
    if (stage && scene && button) {
      const fit = () => {
        const scale = Math.min(1, stage.clientWidth / 600);
        const height = window.innerWidth <= 680 ? 960 : 835;
        (scene as HTMLElement).style.setProperty('--scene-scale', String(scale));
        (stage as HTMLElement).style.height = \`\${height * scale}px\`;
        (stage as HTMLElement).style.minHeight = \`\${height * scale}px\`;
      };
      
      new ResizeObserver(fit).observe(stage);
      fit();
      
      const reset = () => {
        cancelAnimationFrame(frame);
        (scene as HTMLElement).style.setProperty('--mx', '0px');
        (scene as HTMLElement).style.setProperty('--my', '0px');
      };
      
      const sync = () => {
        stage.classList.toggle('motion-paused', paused || reduced.matches);
        button.setAttribute('aria-pressed', String(paused));
        button.textContent = paused ? '▶ Retomar movimento' : '⏸ Pausar movimento';
        reset();
      };
      
      button.addEventListener('click', () => { paused = !paused; sync(); });
      reduced.addEventListener('change', sync);
      sync();
      
      stage.addEventListener('pointermove', (e: any) => {
        if (paused || reduced.matches || !pointer.matches) return;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const rect = stage.getBoundingClientRect();
          (scene as HTMLElement).style.setProperty('--mx', \`\${((e.clientX - rect.left) / rect.width - .5) * 13}px\`);
          (scene as HTMLElement).style.setProperty('--my', \`\${((e.clientY - rect.top) / rect.height - .5) * 10}px\`);
        });
      });
      
      stage.addEventListener('pointerleave', reset);
      
      let visible = true;
      const visibility = () => stage.classList.toggle('motion-offscreen', !visible || document.hidden);
      new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        visibility();
      }, { threshold: 0 }).observe(stage);
      document.addEventListener('visibilitychange', visibility);
    }

    const seal = document.querySelector('.guarantee-motion');
    if (seal) {
      const toggle = seal.querySelector('.guarantee-toggle');
      let sealPaused = false, sealVisible = true;
      if (toggle) {
        toggle.addEventListener('click', () => {
          sealPaused = !sealPaused;
          seal.classList.toggle('is-paused', sealPaused);
          toggle.setAttribute('aria-pressed', String(sealPaused));
          const label = sealPaused ? 'Retomar animação do selo' : 'Pausar animação do selo';
          toggle.setAttribute('aria-label', label);
          (toggle as HTMLElement).title = label;
          toggle.textContent = sealPaused ? '▶' : '⏸';
        });
      }
      const updateVisibility = () => seal.classList.toggle('is-offscreen', !sealVisible || document.hidden);
      new IntersectionObserver(entries => {
        sealVisible = entries[0].isIntersecting;
        updateVisibility();
      }, { threshold: 0 }).observe(seal);
      document.addEventListener('visibilitychange', updateVisibility);
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => { 
        if (entry.isIntersecting) { 
          entry.target.classList.add('in'); 
          observer.unobserve(entry.target); 
        } 
      });
    }, { threshold: .12 });
    
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    document.querySelectorAll('.faq-q').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        if (!item) return;
        const open = item.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
        if (!open) item.classList.add('open');
      });
    });

  }, [html]);

  return <div ref={containerRef} className="landing-page-container" dangerouslySetInnerHTML={{ __html: html }} />;
}
`;

fs.writeFileSync('src/components/LandingPage.tsx', tsxContent);
console.log('Done!');
