// Pitch detection utility using pitchfinder's YIN
// Exports: detectPitch(pcm: Int16Array): number | null
// TODO: Implement smoothing and note conversion.

import { YIN } from 'pitchfinder';

// Revert threshold to default (0.1) and increase gain for sensitivity
const yin = YIN({ sampleRate: 16000, threshold: 0.1 });

export function detectPitch(pcm: Int16Array): number | null {
  // Convert Int16Array to Float32Array in range [-1, 1], apply gain
  const float32 = new Float32Array(pcm.length);
  for (let i = 0; i < pcm.length; i++) {
    float32[i] = (pcm[i] / 32768) * 1.5; // 1.5x gain
  }
  // Use YIN to detect frequency
  const freq = yin(float32);
  return freq || null;
} 