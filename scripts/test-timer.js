const Timer = require('../utils/timer').default;

const INTERVAL = 500; // 120 BPM (500ms per beat)
const NUM_TICKS = 20;
let count = 0;
let lastTime = Date.now();

const timer = new Timer(() => {
  const now = Date.now();
  const drift = now - lastTime - INTERVAL;
  console.log(`Tick ${count + 1}: Drift = ${drift}ms`);
  lastTime = now;
  count++;
  if (count >= NUM_TICKS) {
    timer.stop();
    console.log('Test complete.');
  }
}, INTERVAL, { immediate: true });

timer.start(); 