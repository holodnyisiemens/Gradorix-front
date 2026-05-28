import Particles, { ParticlesProvider } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { ISourceOptions } from '@tsparticles/engine';
import type { Season } from '@shared/store/seasonStore';

const OPTIONS: Record<NonNullable<Season>, ISourceOptions> = {
  winter: {
    fullScreen: { enable: false },
    fpsLimit: 60,
    particles: {
      number: { value: 80 },
      shape: {
        type: 'emoji',
        options: {
          emoji: { value: '❄️', padding: 4 },
        },
      },
      opacity: { value: { min: 0.4, max: 0.9 } },
      size: { value: { min: 6, max: 12 } },
      move: {
        direction: 'bottom',
        enable: true,
        speed: { min: 1, max: 3.5 },
        straight: false,
        outModes: { default: 'out' },
      },
      wobble: {
        enable: true,
        distance: 12,
        speed: { angle: 8 },
      },
    },
  },

  spring: {
    fullScreen: { enable: false },
    fpsLimit: 60,
    particles: {
      number: { value: 45 },
      shape: {
        type: 'emoji',
        options: {
          emoji: { value: '🌸', padding: 4 },
        },
      },
      opacity: { value: { min: 0.6, max: 1 } },
      size: { value: { min: 8, max: 14 } },
      move: {
        direction: 'bottom',
        enable: true,
        speed: { min: 0.6, max: 2 },
        straight: false,
        outModes: { default: 'out' },
      },
      rotate: {
        value: { min: 0, max: 360 },
        animation: { enable: true, speed: 7, sync: false },
      },
      wobble: {
        enable: true,
        distance: 18,
        speed: { angle: 5 },
      },
    },
  },

  summer: {
    fullScreen: { enable: false },
    fpsLimit: 60,
    particles: {
      number: { value: 40 },
      shape: {
        type: 'emoji',
        options: {
          emoji: { value: '☀️', padding: 4 },
        },
      },
      opacity: {
        value: { min: 0.2, max: 0.9 },
        animation: { enable: true, speed: 0.7, sync: false },
      },
      size: { value: { min: 6, max: 12 } },
      move: {
        enable: true,
        speed: { min: 0.2, max: 1.5 },
        direction: 'none',
        random: true,
        straight: false,
        outModes: { default: 'bounce' },
      },
    },
  },

  autumn: {
    fullScreen: { enable: false },
    fpsLimit: 60,
    particles: {
      number: { value: 50 },
      shape: {
        type: 'emoji',
        options: {
          emoji: { value: '🍂', padding: 4 },
        },
      },
      opacity: { value: { min: 0.5, max: 0.95 } },
      size: { value: { min: 8, max: 14 } },
      move: {
        direction: 'bottom-right',
        enable: true,
        speed: { min: 1.5, max: 4 },
        straight: false,
        outModes: { default: 'out' },
      },
      rotate: {
        value: { min: 0, max: 360 },
        animation: { enable: true, speed: 14, sync: false },
      },
      wobble: {
        enable: true,
        distance: 22,
        speed: { angle: 12 },
      },
    },
  },
};

export function SeasonalEffect({ season }: { season: Season }) {
  if (!season) return null;

  return (
    <ParticlesProvider init={loadSlim}>
      <Particles
        key={season}
        options={OPTIONS[season]}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 9998,
        }}
      />
    </ParticlesProvider>
  );
}
