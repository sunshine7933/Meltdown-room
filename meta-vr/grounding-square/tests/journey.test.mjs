import assert from 'node:assert/strict';
import test from 'node:test';
import { createJourney, beginBreathing, advanceBreathing, collect, canReflect,
  openReflection, resetJourney, breathLabel, SYMBOLS } from '../src/journey.mjs';

test('reflection requires a complete breathing activity and six unique symbols', () => {
  const state = createJourney();
  assert.equal(openReflection(state), false);
  assert.equal(beginBreathing(state), true);
  assert.equal(advanceBreathing(state, 8), false);
  assert.equal(breathLabel(state), 'Breathe in · 4');
  assert.equal(advanceBreathing(state, 8), true);
  assert.equal(state.breathCompleted, true);
  for (const symbol of SYMBOLS) assert.equal(collect(state, symbol), true);
  assert.equal(canReflect(state), true);
  assert.equal(openReflection(state), true);
});
test('duplicates and invented symbols cannot advance progress', () => {
  const state = createJourney();
  assert.equal(collect(state, 'Earth'), true);
  assert.equal(collect(state, 'Earth'), false);
  assert.equal(collect(state, 'Puzzle piece'), false);
  assert.deepEqual(state.collected, ['Earth']);
});
test('breathing cannot skip steps and reset restores journey', () => {
  const state = createJourney();
  assert.equal(advanceBreathing(state, 50), false);
  beginBreathing(state);
  assert.equal(advanceBreathing(state, -5), false);
  assert.equal(state.breathElapsed, 0);
  state.reducedMotion = true;
  collect(state, 'Water');
  resetJourney(state);
  assert.equal(canReflect(state), false);
  assert.deepEqual(state.collected, []);
  assert.equal(state.reducedMotion, true);
});
