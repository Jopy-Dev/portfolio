"use client";

import { type RefObject, useEffect, useRef } from "react";

type CursorPosition = {
  x: number;
  y: number;
};

type BubbleColors = {
  fill: string;
  stroke: string;
};

type BubbleCursorTrailProps = {
  cursorPositionRef: RefObject<CursorPosition>;
  enabled: boolean;
};

type Particle = {
  lifeSpan: number;
  initialLifeSpan: number;
  velocity: { x: number; y: number };
  position: { x: number; y: number };
  baseDimension: number;
};

function createParticle(x: number, y: number): Particle {
  const initialLifeSpan = Math.floor(Math.random() * 60 + 60);
  return {
    initialLifeSpan,
    lifeSpan: initialLifeSpan,
    velocity: {
      x: (Math.random() < 0.5 ? -1 : 1) * (Math.random() / 10),
      y: 0.4 + Math.random(),
    },
    position: { x, y },
    baseDimension: 4,
  };
}

function updateParticle(
  particle: Particle,
  context: CanvasRenderingContext2D,
  colors: BubbleColors,
) {
  advanceParticle(particle);
  drawParticle(particle, context, colors);
}

function advanceParticle(particle: Particle) {
  particle.position.x += particle.velocity.x;
  particle.position.y += particle.velocity.y;
  particle.velocity.x += ((Math.random() < 0.5 ? -1 : 1) * 2) / 75;
  particle.velocity.y += Math.random() / 600;
  particle.lifeSpan--;
}

function drawParticle(
  particle: Particle,
  context: CanvasRenderingContext2D,
  colors: BubbleColors,
) {
  const scale =
    0.2 +
    (particle.initialLifeSpan - particle.lifeSpan) / particle.initialLifeSpan;

  context.fillStyle = colors.fill;
  context.strokeStyle = colors.stroke;
  context.beginPath();
  context.arc(
    particle.position.x - (particle.baseDimension / 2) * scale,
    particle.position.y - particle.baseDimension / 2,
    particle.baseDimension * scale,
    0,
    2 * Math.PI,
  );

  context.stroke();
  context.fill();
  context.closePath();
}

function drawParticles(
  particles: Particle[],
  context: CanvasRenderingContext2D,
  colors: BubbleColors,
) {
  for (let index = 0; index < particles.length; index++) {
    const particle = particles[index];
    if (particle) updateParticle(particle, context, colors);
  }
}

function removeDeadParticles(particles: Particle[]) {
  for (let index = particles.length - 1; index >= 0; index--) {
    if ((particles[index]?.lifeSpan ?? 0) < 0) particles.splice(index, 1);
  }
}

export function BubbleCursorTrail({
  cursorPositionRef,
  enabled,
}: BubbleCursorTrailProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    if (!finePointer.matches || prefersReducedMotion.matches) return;

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const tokens = getComputedStyle(document.documentElement);
    const colors: BubbleColors = {
      fill: tokens.getPropertyValue("--color-bubble-fill").trim(),
      stroke: tokens.getPropertyValue("--color-bubble-stroke").trim(),
    };

    const onWindowResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const addParticle = () => {
      particlesRef.current.push(
        createParticle(
          cursorPositionRef.current.x,
          cursorPositionRef.current.y,
        ),
      );
    };

    const updateParticles = () => {
      if (particlesRef.current.length === 0) return;

      context.clearRect(0, 0, canvas.width, canvas.height);

      drawParticles(particlesRef.current, context, colors);
      removeDeadParticles(particlesRef.current);

      if (particlesRef.current.length === 0) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    const loop = () => {
      updateParticles();
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    onWindowResize();
    document.body.addEventListener("mousemove", addParticle);
    window.addEventListener("resize", onWindowResize);
    loop();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      document.body.removeEventListener("mousemove", addParticle);
      window.removeEventListener("resize", onWindowResize);
    };
  }, [cursorPositionRef, enabled]);

  return <canvas ref={canvasRef} className="bubble-cursor-trail" />;
}
