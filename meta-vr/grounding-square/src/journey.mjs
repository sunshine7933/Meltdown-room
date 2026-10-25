// Pure experience state: shared between XR interactions and unit tests.
export const SYMBOLS = Object.freeze(['Moon', 'Star', 'Sun', 'Comet']);
export const BREATH_SECONDS = 16; // Two gentle 4-in / 4-out breathing cycles.

export function createJourney() {
  return { breathElapsed: 0, breathing: false, breathCompleted: false,
    collected: [], reflectionOpen: false, reducedMotion: false };
}
export function beginBreathing(journey) {
  if (journey.breathCompleted) return false;
  journey.breathing = true;
  return true;
}
export function advanceBreathing(journey, seconds) {
  if (!journey.breathing || journey.breathCompleted) return false;
  journey.breathElapsed = Math.min(BREATH_SECONDS, journey.breathElapsed + Math.max(0, seconds));
  if (journey.breathElapsed >= BREATH_SECONDS) {
    journey.breathing = false;
    journey.breathCompleted = true;
    return true;
  }
  return false;
}
export function collect(journey, symbol) {
  if (!SYMBOLS.includes(symbol) || journey.collected.includes(symbol)) return false;
  journey.collected.push(symbol);
  return true;
}
export function canReflect(journey) {
  return journey.breathCompleted && journey.collected.length === SYMBOLS.length;
}
export function openReflection(journey) {
  if (!canReflect(journey)) return false;
  journey.reflectionOpen = true;
  return true;
}
export function resetJourney(journey) {
  const motion = journey.reducedMotion;
  Object.assign(journey, createJourney());
  journey.reducedMotion = motion;
}
export function breathLabel(journey) {
  if (journey.breathCompleted) return 'Breathing complete · you did it';
  if (!journey.breathing) return 'Choose BREATHE to begin';
  const phase = Math.floor(journey.breathElapsed / 4) % 2;
  const remaining = 4 - Math.floor(journey.breathElapsed % 4);
  return `${phase === 0 ? 'Breathe in' : 'Breathe out'} · ${remaining}`;
}
