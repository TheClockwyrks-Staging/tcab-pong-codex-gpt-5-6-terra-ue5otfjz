import { describe, expect, it } from "vitest";
import { game } from "./game";

function setup() {
  const muted = { value: false };
  const api = {
    input: { register: () => {}, layout: () => null },
    audio: { define: () => {} },
    diagnostics: { register: () => {} },
  } as never;
  const [state, debug] = game.initialize(api) as [
    import("./game").CaromState,
    import("./game").CaromDebugApi,
  ];
  const frame = {
    input: {
      value: () => 0,
      pressed: () => false,
      pointer: () => ({
        x: 0,
        y: 0,
        down: false,
        device: "mouse",
        buttons: [],
      }),
      pointerPressed: () => false,
      pointerReleased: () => false,
      pointerSamples: () => [],
      pointerContacts: () => [],
      wheel: () => ({ x: 0, y: 0 }),
    },
    audio: {
      play: () => {},
      muted: () => muted.value,
      setMuted: (v: boolean) => {
        muted.value = v;
      },
      loop: () => {},
      stop: () => {},
      looping: () => false,
    },
    frame: () => ({ frame: 0, time: 0, dt: 0 }),
    viewport: () => ({}),
  } as never;
  return { state, debug, frame };
}

describe("Carom simulation", () => {
  it("parks a fresh ball and serves it after the countdown", () => {
    const { state, debug, frame } = setup();
    const countdown = debug.setScreen(state, "countdown");
    const next = game.update(countdown, frame, 1);
    expect(next.screen).toBe("playing");
    expect(next.ball?.held).toBe(false);
    expect(Math.hypot(next.ball?.vx ?? 0, next.ball?.vy ?? 0)).toBeCloseTo(520);
  });

  it("debug poses do not mutate their input", () => {
    const { state, debug } = setup();
    const placed = debug.setBallPosition(state, 99, 88);
    expect(state.ball?.x).toBe(640);
    expect(placed.ball).toMatchObject({ x: 99, y: 88 });
    expect(debug.snapshot(placed).ball?.speed).toBe(0);
  });
});
