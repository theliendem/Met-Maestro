// Note utility functions
// Exports: freqToNote, noteToString, getCents
// Implements frequency-to-note conversion, cents calculation, and formatting.

const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const A4_FREQ = 440;
const A4_MIDI = 69;

export function freqToNote(freq: number): { note: string, octave: number, midi: number } {
  if (!freq || freq <= 0) return { note: '', octave: 0, midi: 0 };
  const midi = Math.round(12 * Math.log2(freq / A4_FREQ) + A4_MIDI);
  const noteIdx = ((midi % 12) + 12) % 12;
  const note = NOTE_NAMES[noteIdx];
  const octave = Math.floor(midi / 12) - 1;
  return { note, octave, midi };
}

export function getCents(freq: number, midi: number): number {
  if (!freq || freq <= 0) return 0;
  const refFreq = A4_FREQ * Math.pow(2, (midi - A4_MIDI) / 12);
  return Math.round(1200 * Math.log2(freq / refFreq));
}

export function noteToString(note: string, octave: number): string {
  return note ? `${note}${octave}` : '—';
} 