import React, { useEffect, useRef, useState } from 'react';
import './ScrollReveal.css';

// Envuelve una sección para que aparezca con un fade-up sutil al entrar
// en viewport (scroll), reutilizando el mismo lenguaje de animación
// (`cubic-bezier(0.16, 1, 0.3, 1)`) ya usado en el resto de la app.
export default function ScrollReveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`scroll-reveal ${visible ? 'scroll-reveal-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
