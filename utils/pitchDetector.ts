// Pitch detection utility using pitchfinder's YIN
// Exports: detectPitch(pcm: Int16Array): number | null
// TODO: Implement smoothing and note conversion.

import { YIN } from 'pitchfinder';

const yin = YIN({ sampleRate: 16000 });

export function detectPitch(pcm: Int16Array): number | null {
  // Convert Int16Array to Float32Array in range [-1, 1]
  const float32 = new Float32Array(pcm.length);
  for (let i = 0; i < pcm.length; i++) {
    float32[i] = pcm[i] / 32768;
  }
  // Use YIN to detect frequency
  const freq = yin(float32);
  return freq || null;
} 