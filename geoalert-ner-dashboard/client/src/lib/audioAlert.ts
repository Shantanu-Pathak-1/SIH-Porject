// Emergency Alarm & Audio Siren Generator using Web Audio API

// Tier 1: Loud 2-Tone Emergency Evacuation Siren
export function playEmergencySirenSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.4);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.8);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 1.2);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.6);
  } catch (err) {
    console.warn("Audio alarm playback notice:", err);
  }
}

// Tier 2: Soft 2-Note Caution Notification Chime for Nearby Areas
export function playCautionChimeSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.25); // A5

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.7);
  } catch (err) {
    console.warn("Caution chime playback notice:", err);
  }
}

// Unified Tiered Alert Dispatcher (Browser Push + Audio)
export function triggerTieredAlert(
  tier: "EMERGENCY_EVACUATION" | "NEARBY_CAUTION" | "SAFE",
  title: string,
  body: string
) {
  if (tier === "EMERGENCY_EVACUATION") {
    playEmergencySirenSound();
  } else if (tier === "NEARBY_CAUTION") {
    playCautionChimeSound();
  }

  if (typeof window === "undefined" || !("Notification" in window)) return;

  const showNotification = () => {
    new Notification(title, {
      body,
      icon: "/favicon.ico",
      tag: tier,
      renotify: true,
    });
  };

  if (Notification.permission === "granted") {
    showNotification();
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        showNotification();
      }
    });
  }
}

export function triggerBrowserPushNotification(title: string, body: string) {
  triggerTieredAlert("EMERGENCY_EVACUATION", title, body);
}
