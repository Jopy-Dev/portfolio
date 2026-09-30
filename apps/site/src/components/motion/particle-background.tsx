"use client";

import { useEffect, useRef, useState } from "react";

const PARTICLE_COUNT = 100;

type ParticleDescriptor = {
  id: number;
  size: number;
  opacity: number;
  left: number;
  top: number;
  duration: number;
};

type PausableTween = {
  paused: (value: boolean) => void;
};

function createParticles(): ParticleDescriptor[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, id) => ({
    id,
    size: Math.random() * 3 + 1,
    opacity: Math.random(),
    left: Math.random() * window.innerWidth,
    top: Math.random() * (window.innerHeight + 1),
    duration: Math.random() * 10 + 10,
  }));
}

export function ParticleBackground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<ParticleDescriptor[]>([]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () =>
      setParticles(media.matches ? [] : createParticles());
    syncPreference();
    media.addEventListener("change", syncPreference);
    return () => media.removeEventListener("change", syncPreference);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || particles.length === 0) return;
    let cancelled = false;
    let context: { revert: () => void } | undefined;
    let tweens: PausableTween[] = [];
    let removeVisibilityListener: () => void = () => {};
    void import("gsap").then(({ gsap }) => {
      if (cancelled) return;
      context = gsap.context(() => {
        tweens = Array.from(
          root.querySelectorAll<HTMLElement>(".particle"),
          (particle, index) => {
            const descriptor = particles[index];
            if (!descriptor) return [];
            return [
              gsap.to(particle, {
                y: window.innerHeight,
                duration: descriptor.duration,
                opacity: 0,
                repeat: -1,
                ease: "none",
              }),
            ];
          },
        ).flat();
      }, root);
      const syncVisibility = () => {
        for (const tween of tweens) tween.paused(document.hidden);
      };
      document.addEventListener("visibilitychange", syncVisibility);
      removeVisibilityListener = () =>
        document.removeEventListener("visibilitychange", syncVisibility);
    });
    return () => {
      cancelled = true;
      removeVisibilityListener();
      context?.revert();
    };
  }, [particles]);

  return (
    <div ref={rootRef} className="particle-field" aria-hidden="true">
      {particles.map((particle) => (
        <span
          className="particle"
          key={particle.id}
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            left: `${particle.left}px`,
            top: `${particle.top}px`,
          }}
        />
      ))}
    </div>
  );
}
