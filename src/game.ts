import type { Game, InitApi, UpdateApi } from "@clockwyrks/simple-2d";
import type { DeepReadonly } from "ts-essentials";
import * as K from "./constants";

export type Screen =
  "title" | "howto" | "countdown" | "playing" | "paused" | "matchover";
export type Mode = "solo" | "versus";
export type Side = "left" | "right";
export interface PaddleState {
  readonly cy: number;
  readonly vy: number;
  readonly driven: boolean;
  readonly drivenVy: number;
}
export interface AiState {
  readonly tracking: boolean;
  readonly movement: boolean;
}
export interface TrailSample {
  readonly x: number;
  readonly y: number;
  readonly t: number;
}
export interface BallState {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly spin: number;
  readonly held: boolean;
  readonly holdTimer: number;
  readonly serveSign: 1 | -1;
  readonly trail: readonly TrailSample[];
}
export interface ObstacleState {
  readonly index: number;
  readonly cx: number;
  readonly cy: number;
}
export interface CaromState {
  readonly screen: Screen;
  readonly mode: Mode;
  readonly menuIndex: number;
  readonly titleIndex: number;
  readonly resumeScreen: "countdown" | "playing";
  readonly score: { readonly p1: number; readonly p2: number };
  readonly winner: Side | null;
  readonly paddles: { readonly left: PaddleState; readonly right: PaddleState };
  readonly ai: AiState;
  readonly receiver: Side;
  readonly ball: BallState | null;
  readonly obstacles: readonly ObstacleState[];
  readonly simTime: number;
  readonly muted: boolean;
}
type Snapshot = CaromState & {
  readonly version: number;
  readonly ball: (BallState & { readonly speed: number }) | null;
};
export interface CaromDebugApi {
  readonly version: number;
  clearWorld(s: DeepReadonly<CaromState>): CaromState;
  spawnBall(s: DeepReadonly<CaromState>): CaromState;
  spawnObstacle(s: DeepReadonly<CaromState>, i: number): CaromState;
  reset(s: DeepReadonly<CaromState>): CaromState;
  reconcile(s: DeepReadonly<CaromState>): CaromState;
  setScreen(s: DeepReadonly<CaromState>, v: Screen): CaromState;
  setMode(s: DeepReadonly<CaromState>, v: Mode): CaromState;
  setMenuIndex(s: DeepReadonly<CaromState>, v: number): CaromState;
  setTitleIndex(s: DeepReadonly<CaromState>, v: number): CaromState;
  setResumeScreen(
    s: DeepReadonly<CaromState>,
    v: "countdown" | "playing",
  ): CaromState;
  setScore(s: DeepReadonly<CaromState>, p1: number, p2: number): CaromState;
  setWinner(s: DeepReadonly<CaromState>, v: Side | null): CaromState;
  setReceiver(s: DeepReadonly<CaromState>, v: Side): CaromState;
  setPaddleCy(s: DeepReadonly<CaromState>, side: Side, v: number): CaromState;
  setPaddleVy(s: DeepReadonly<CaromState>, side: Side, v: number): CaromState;
  setPaddleDriven(
    s: DeepReadonly<CaromState>,
    side: Side,
    v: boolean,
  ): CaromState;
  setBallPosition(
    s: DeepReadonly<CaromState>,
    x: number,
    y: number,
  ): CaromState;
  setBallVelocity(
    s: DeepReadonly<CaromState>,
    x: number,
    y: number,
  ): CaromState;
  setBallSpin(s: DeepReadonly<CaromState>, v: number): CaromState;
  setBallHeld(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setBallHoldTimer(s: DeepReadonly<CaromState>, v: number): CaromState;
  setBallServeSign(s: DeepReadonly<CaromState>, v: 1 | -1): CaromState;
  drawBallServeSign(s: DeepReadonly<CaromState>): CaromState;
  setAiTracking(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setAiMovement(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setMuted(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  snapshot(s: DeepReadonly<CaromState>): Snapshot;
  menuItemRect(
    s: DeepReadonly<CaromState>,
    i: number,
  ): { x: number; y: number; w: number; h: number } | null;
}
export const BACKGROUND = "#07121d";
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const draw = (): 1 | -1 => (Math.random() < 0.5 ? -1 : 1);
const ob = (index: number): ObstacleState => ({
  index,
  cx: K.OBSTACLE_CENTERS[index].x,
  cy: K.OBSTACLE_CENTERS[index].y,
});
const park = (): BallState => ({
  x: K.FIELD_CX,
  y: K.FIELD_CY,
  vx: 0,
  vy: 0,
  spin: 0,
  held: true,
  holdTimer: K.HOLD_TIME,
  serveSign: draw(),
  trail: [],
});
const fresh = (muted = false): CaromState => ({
  screen: "title",
  mode: "solo",
  menuIndex: 0,
  titleIndex: 0,
  resumeScreen: "playing",
  score: { p1: 0, p2: 0 },
  winner: null,
  paddles: {
    left: { cy: K.FIELD_CY, vy: 0, driven: false, drivenVy: 0 },
    right: { cy: K.FIELD_CY, vy: 0, driven: false, drivenVy: 0 },
  },
  ai: { tracking: true, movement: true },
  receiver: "left",
  ball: park(),
  obstacles: [ob(0), ob(1)],
  simTime: 0,
  muted,
});
const copy = (s: DeepReadonly<CaromState>): CaromState => ({
  ...s,
  score: { ...s.score },
  paddles: { left: { ...s.paddles.left }, right: { ...s.paddles.right } },
  ai: { ...s.ai },
  ball: s.ball ? { ...s.ball, trail: [...s.ball.trail] } : null,
  obstacles: [...s.obstacles],
});
const ball = (s: DeepReadonly<CaromState>) => {
  if (!s.ball) throw new Error("Carom: no ball");
  return { ...s.ball, trail: [...s.ball.trail] };
};
const items = (x: Screen): readonly string[] =>
  x === "title"
    ? K.TITLE_ITEMS
    : x === "paused"
      ? K.PAUSE_ITEMS
      : x === "matchover"
        ? K.MATCHOVER_ITEMS
        : x === "howto"
          ? ["BACK TO MENU"]
          : [];
const menuRect = (x: Screen, i: number) =>
  i < 0 || i >= items(x).length
    ? null
    : { x: 430, y: x === "howto" ? 570 : 310 + i * 70, w: 420, h: 52 };
function paddle(p: PaddleState, vy: number, dt: number): PaddleState {
  const cy = clamp(p.cy + vy * dt, K.PADDLE_MIN_CY, K.PADDLE_MAX_CY);
  return { ...p, cy, vy: dt && cy !== p.cy + vy * dt ? (cy - p.cy) / dt : vy };
}
function match(s: CaromState, mode = s.mode): CaromState {
  return {
    ...s,
    mode,
    screen: "countdown",
    resumeScreen: "playing",
    menuIndex: 0,
    score: { p1: 0, p2: 0 },
    winner: null,
    receiver: "left",
    ball: park(),
    paddles: {
      left: { ...s.paddles.left, cy: K.FIELD_CY, vy: 0 },
      right: { ...s.paddles.right, cy: K.FIELD_CY, vy: 0 },
    },
  };
}
function home(s: CaromState): CaromState {
  const n = fresh(s.muted);
  return {
    ...n,
    titleIndex: s.titleIndex,
    menuIndex: s.titleIndex,
    simTime: s.simTime,
  };
}
function face(
  b: BallState,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
): "left" | "right" | "top" | "bottom" | null {
  if (!(
    b.x > x0 - K.BALL_R &&
    b.x < x1 + K.BALL_R &&
    b.y > y0 - K.BALL_R &&
    b.y < y1 + K.BALL_R
  ))
    return null;
  const d: [
    ["left" | "right" | "top" | "bottom", number],
    ...["left" | "right" | "top" | "bottom", number][],
  ] = [
    ["left", b.x - (x0 - K.BALL_R)],
    ["right", x1 + K.BALL_R - b.x],
    ["top", b.y - (y0 - K.BALL_R)],
    ["bottom", y1 + K.BALL_R - b.y],
  ];
  return d.reduce((a, v) => (v[1] < a[1] ? v : a))[0];
}
function simulate(s: CaromState, api: UpdateApi, dt: number): CaromState {
  let b = s.ball;
  if (!b) return s;
  if (b.held) {
    const hold = b.holdTimer - dt;
    if (hold > 0) return { ...s, ball: { ...b, holdTimer: hold } };
    const dir = s.receiver === "left" ? -1 : 1;
    return {
      ...s,
      screen: "playing",
      ball: {
        ...b,
        held: false,
        holdTimer: 0,
        vx: dir * K.SERVE_SPEED * Math.cos(K.SERVE_ANGLE),
        vy: b.serveSign * K.SERVE_SPEED * Math.sin(K.SERVE_ANGLE),
        trail: [],
      },
    };
  }
  let point: Side | null = null;
  const n = Math.max(
    1,
    Math.ceil((Math.hypot(b.vx, b.vy) * dt) / K.MAX_SUBSTEP),
  );
  for (let i = 0; i < n && !point; i++) {
    const h = dt / n;
    const sp = Math.hypot(b.vx, b.vy);
    const a = sp ? (b.spin / sp) * h : 0;
    const vx: number = b.vx * Math.cos(a) - b.vy * Math.sin(a);
    const vy: number = b.vx * Math.sin(a) + b.vy * Math.cos(a);
    b = {
      ...b,
      vx,
      vy,
      spin: b.spin * Math.pow(0.5, h / K.SPIN_HALFLIFE),
      x: b.x + vx * h,
      y: b.y + vy * h,
    };
    if (b.y - K.BALL_R < 0 && b.vy < 0) {
      b = { ...b, y: K.BALL_R, vy: -b.vy };
      api.audio.play(K.CUES.wallBounce);
    } else if (b.y + K.BALL_R > K.FIELD_H && b.vy > 0) {
      b = { ...b, y: K.FIELD_H - K.BALL_R, vy: -b.vy };
      api.audio.play(K.CUES.wallBounce);
    }
    for (const side of ["left", "right"] as const) {
      const p = s.paddles[side],
        f = face(
          b,
          side === "left" ? K.P1_X0 : K.P2_X0,
          side === "left" ? K.P1_X1 : K.P2_X1,
          p.cy - K.PADDLE_HALF,
          p.cy + K.PADDLE_HALF,
        );
      if (!f) continue;
      if (f === "left" || f === "right") {
        const v = Math.min(Math.hypot(b.vx, b.vy) * K.SPEED_MULT, K.SPEED_CAP);
        const theta: number =
          clamp((b.y - p.cy) / K.PADDLE_HALF, -1, 1) * K.MAX_BOUNCE_ANGLE;
        const dir = side === "left" ? 1 : -1;
        b = {
          ...b,
          x: side === "left" ? K.P1_X1 + K.BALL_R : K.P2_X0 - K.BALL_R,
          vx: dir * v * Math.cos(theta),
          vy: v * Math.sin(theta),
          spin: clamp(
            b.spin + p.vy * K.SPIN_FROM_PADDLE,
            -K.SPIN_CLAMP,
            K.SPIN_CLAMP,
          ),
        };
        api.audio.play(K.CUES.paddleHit);
      } else {
        const top = f === "top";
        b = {
          ...b,
          y: top
            ? p.cy - K.PADDLE_HALF - K.BALL_R
            : p.cy + K.PADDLE_HALF + K.BALL_R,
          vy: (top && b.vy > 0) || (!top && b.vy < 0) ? -b.vy : b.vy,
        };
        api.audio.play(K.CUES.wallBounce);
      }
    }
    for (const o of s.obstacles) {
      const r = K.OBSTACLES[o.index],
        f = face(b, r.x0, r.x1, r.y0, r.y1);
      if (!f) continue;
      b =
        f === "left"
          ? { ...b, x: r.x0 - K.BALL_R, vx: b.vx > 0 ? -b.vx : b.vx }
          : f === "right"
            ? { ...b, x: r.x1 + K.BALL_R, vx: b.vx < 0 ? -b.vx : b.vx }
            : f === "top"
              ? { ...b, y: r.y0 - K.BALL_R, vy: b.vy > 0 ? -b.vy : b.vy }
              : { ...b, y: r.y1 + K.BALL_R, vy: b.vy < 0 ? -b.vy : b.vy };
      api.audio.play(K.CUES.obstacleBounce);
    }
    if (b.x - K.BALL_R > K.FIELD_W) point = "left";
    if (b.x + K.BALL_R < 0) point = "right";
  }
  if (!point) return { ...s, ball: b };
  api.audio.play(K.CUES.score);
  const score =
      point === "left"
        ? { p1: s.score.p1 + 1, p2: s.score.p2 }
        : { p1: s.score.p1, p2: s.score.p2 },
    winner =
      score.p1 >= K.WIN_SCORE && score.p1 - score.p2 >= K.WIN_LEAD
        ? "left"
        : score.p2 >= K.WIN_SCORE && score.p2 - score.p1 >= K.WIN_LEAD
          ? "right"
          : null;
  return winner
    ? { ...s, score, winner, screen: "matchover", menuIndex: 0, ball: b }
    : {
        ...s,
        score,
        receiver: point === "left" ? "right" : "left",
        screen: "countdown",
        ball: park(),
      };
}
function controls(s: CaromState, api: UpdateApi, dt: number): CaromState {
  const hv = (side: Side) =>
    (api.input.value(side === "left" ? "p1-down" : "p2-down") -
      api.input.value(side === "left" ? "p1-up" : "p2-up")) *
    K.PADDLE_SPEED;
  const l = s.paddles.left.driven
    ? paddle(s.paddles.left, s.paddles.left.drivenVy, dt)
    : paddle(s.paddles.left, hv("left"), dt);
  let v = hv("right");
  if (s.mode === "solo" && !s.paddles.right.driven) {
    const tracking =
        s.ai.tracking && s.screen === "playing" && s.ball && s.ball.vx > 0,
      target = tracking ? s.ball.y - s.ball.vy * K.AI_REACT : K.AI_HOME_Y,
      d = target - s.paddles.right.cy;
    v =
      !s.ai.movement ||
      Math.abs(d) <= (tracking ? K.AI_DEADZONE : K.AI_HOME_DEADZONE)
        ? 0
        : Math.sign(d) * Math.min(K.AI_SPEED, Math.abs(d) / Math.max(dt, 1e-9));
  }
  const r = s.paddles.right.driven
    ? paddle(s.paddles.right, s.paddles.right.drivenVy, dt)
    : paddle(s.paddles.right, v, dt);
  return { ...s, paddles: { left: l, right: r } };
}
function navigation(s: CaromState, api: UpdateApi): CaromState {
  const up = api.input.pressed("p1-up") || api.input.pressed("p2-up"),
    down = api.input.pressed("p1-down") || api.input.pressed("p2-down"),
    confirm = api.input.pressed("confirm"),
    back = api.input.pressed("back"),
    pause = api.input.pressed("pause");
  if ((s.screen === "playing" || s.screen === "countdown") && pause)
    return { ...s, screen: "paused", resumeScreen: s.screen, menuIndex: 0 };
  if (s.screen === "paused" && (pause || back))
    return { ...s, screen: s.resumeScreen };
  if (
    (s.screen === "howto" && (confirm || back)) ||
    (s.screen === "matchover" && back)
  )
    return home(s);
  const a = items(s.screen);
  if (!a.length) return s;
  if (up || down)
    return {
      ...s,
      menuIndex: (s.menuIndex + (up ? -1 : 1) + a.length) % a.length,
    };
  if (!confirm) return s;
  if (s.screen === "title") {
    const q = { ...s, titleIndex: s.menuIndex };
    return s.menuIndex < 2
      ? match(q, s.menuIndex === 0 ? "solo" : "versus")
      : { ...q, screen: "howto", menuIndex: 0 };
  }
  if (s.screen === "paused")
    return s.menuIndex === 0
      ? { ...s, screen: s.resumeScreen }
      : s.menuIndex === 1
        ? match(s)
        : home(s);
  return s.menuIndex === 0 ? match(s) : home(s);
}
const debug: CaromDebugApi = {
  version: K.CAROM_DEBUG_VERSION,
  clearWorld: (s) => ({ ...copy(s), ball: null, obstacles: [] }),
  spawnBall: (s) => ({ ...copy(s), ball: park() }),
  spawnObstacle: (s, i) => {
    if (!K.OBSTACLE_CENTERS[i]) throw Error("Carom: invalid obstacle");
    return {
      ...copy(s),
      obstacles: [...s.obstacles.filter((x) => x.index !== i), ob(i)].sort(
        (a, b) => a.index - b.index,
      ),
    };
  },
  reset: (s) => fresh(s.muted),
  reconcile: (s) => copy(s),
  setScreen: (s, v) => ({ ...copy(s), screen: v }),
  setMode: (s, v) => ({ ...copy(s), mode: v }),
  setMenuIndex: (s, v) => ({ ...copy(s), menuIndex: v }),
  setTitleIndex: (s, v) => ({ ...copy(s), titleIndex: v }),
  setResumeScreen: (s, v) => ({ ...copy(s), resumeScreen: v }),
  setScore: (s, p1, p2) => ({ ...copy(s), score: { p1, p2 } }),
  setWinner: (s, v) => ({ ...copy(s), winner: v }),
  setReceiver: (s, v) => ({ ...copy(s), receiver: v }),
  setPaddleCy: (s, x, v) => {
    const n = copy(s);
    return { ...n, paddles: { ...n.paddles, [x]: { ...n.paddles[x], cy: v } } };
  },
  setPaddleVy: (s, x, v) => {
    const n = copy(s);
    return {
      ...n,
      paddles: { ...n.paddles, [x]: { ...n.paddles[x], drivenVy: v } },
    };
  },
  setPaddleDriven: (s, x, v) => {
    const n = copy(s);
    return {
      ...n,
      paddles: { ...n.paddles, [x]: { ...n.paddles[x], driven: v } },
    };
  },
  setBallPosition: (s, x, y) => ({ ...copy(s), ball: { ...ball(s), x, y } }),
  setBallVelocity: (s, x, y) => ({
    ...copy(s),
    ball: { ...ball(s), vx: x, vy: y },
  }),
  setBallSpin: (s, v) => ({ ...copy(s), ball: { ...ball(s), spin: v } }),
  setBallHeld: (s, v) => ({ ...copy(s), ball: { ...ball(s), held: v } }),
  setBallHoldTimer: (s, v) => ({
    ...copy(s),
    ball: { ...ball(s), holdTimer: v },
  }),
  setBallServeSign: (s, v) => ({
    ...copy(s),
    ball: { ...ball(s), serveSign: v },
  }),
  drawBallServeSign: (s) => ({
    ...copy(s),
    ball: { ...ball(s), serveSign: draw() },
  }),
  setAiTracking: (s, v) => ({ ...copy(s), ai: { ...s.ai, tracking: v } }),
  setAiMovement: (s, v) => ({ ...copy(s), ai: { ...s.ai, movement: v } }),
  setMuted: (s, v) => ({ ...copy(s), muted: v }),
  snapshot: (s) => ({
    ...copy(s),
    version: K.CAROM_DEBUG_VERSION,
    ball: s.ball
      ? {
          ...s.ball,
          trail: [...s.ball.trail],
          speed: Math.hypot(s.ball.vx, s.ball.vy),
        }
      : null,
  }),
  menuItemRect: (s, i) => menuRect(s.screen, i),
};
export const game: Game<CaromState, CaromDebugApi> = {
  initialize(api: InitApi<CaromState>) {
    K.ACTIONS.forEach((a) =>
      api.input.register(a, { keys: [...K.BINDINGS[a]] }),
    );
    api.audio.define(K.CUES.paddleHit, {
      wave: "square",
      freq: 540,
      durationMs: 45,
    });
    api.audio.define(K.CUES.wallBounce, { freq: 260, durationMs: 55 });
    api.audio.define(K.CUES.obstacleBounce, {
      wave: "triangle",
      freq: 380,
      durationMs: 60,
    });
    api.audio.define(K.CUES.score, {
      wave: "sine",
      freq: 660,
      freqTo: 990,
      durationMs: 160,
    });
    api.diagnostics.register("screen", (s) => s.screen);
    api.diagnostics.register("score", (s) => `${s.score.p1}-${s.score.p2}`);
    api.diagnostics.register("ball", (s) =>
      s.ball ? `${s.ball.x.toFixed(0)}, ${s.ball.y.toFixed(0)}` : "none",
    );
    return [fresh(), debug];
  },
  update(state, api, dt) {
    let s = copy(state);
    if (api.input.pressed("mute")) api.audio.setMuted(!api.audio.muted());
    s = navigation(s, api);
    if (s.screen === "countdown" || s.screen === "playing") {
      s = controls(s, api, dt);
      s = simulate(s, api, dt);
      if (s.ball) {
        const t = s.simTime + dt;
        s = {
          ...s,
          ball: {
            ...s.ball,
            trail: [...s.ball.trail, { x: s.ball.x, y: s.ball.y, t }].filter(
              (v) => v.t >= t - K.TRAIL_TIME,
            ),
          },
        };
      }
    }
    return { ...s, simTime: s.simTime + dt, muted: api.audio.muted() };
  },
  render(state, api) {
    const c = api.ctx;
    c.fillStyle = BACKGROUND;
    c.fillRect(0, 0, K.FIELD_W, K.FIELD_H);
    c.strokeStyle = "#214457";
    c.setLineDash([12, 15]);
    c.beginPath();
    c.moveTo(K.NET_X, 35);
    c.lineTo(K.NET_X, K.FIELD_H - 35);
    c.stroke();
    c.setLineDash([]);
    for (const o of state.obstacles) {
      c.fillStyle = "#f1a64a";
      c.beginPath();
      c.roundRect(o.cx - 10, o.cy - 70, 20, 140, 10);
      c.fill();
    }
    for (const [side, col, x] of [
      ["left", "#5bd5ff", K.P1_X0],
      ["right", "#ff5b92", K.P2_X0],
    ] as const) {
      const p = state.paddles[side];
      c.fillStyle = col;
      c.beginPath();
      c.roundRect(x, p.cy - K.PADDLE_HALF, K.PADDLE_W, K.PADDLE_H, 8);
      c.fill();
    }
    if (state.ball) {
      c.strokeStyle = "#d9faff";
      c.lineWidth = 5;
      c.beginPath();
      state.ball.trail.forEach((p, i) =>
        i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y),
      );
      c.stroke();
      c.fillStyle = "#fff";
      c.beginPath();
      c.arc(state.ball.x, state.ball.y, K.BALL_R, 0, 7);
      c.fill();
    }
    c.textAlign = "center";
    if (["playing", "countdown", "paused"].includes(state.screen)) {
      c.fillStyle = "#e8f8ff";
      c.font = "bold 42px system-ui";
      c.fillText(`${state.score.p1}       ${state.score.p2}`, K.FIELD_CX, 70);
      c.font = "14px system-ui";
      c.fillStyle = "#8ab5c9";
      c.fillText(
        state.mode === "solo" ? "SOLO · SPIN DUEL" : "VERSUS · SPIN DUEL",
        K.FIELD_CX,
        700,
      );
    }
    if (state.screen === "title") {
      c.fillStyle = "#e8f8ff";
      c.font = "bold 82px system-ui";
      c.fillText(K.TITLE_TEXT, K.FIELD_CX, 210);
    }
    if (state.screen === "howto") {
      c.fillStyle = "#e8f8ff";
      c.font = "bold 36px system-ui";
      c.fillText("HOW TO PLAY", K.FIELD_CX, 160);
      c.font = "20px system-ui";
      c.fillStyle = "#b7d3df";
      [
        "W / S for left · ↑ / ↓ for right",
        "Move while striking to curve the ball with spin.",
        "Bank shots around the amber obstacles. First to 11, win by 2.",
      ].forEach((t, i) => c.fillText(t, K.FIELD_CX, 260 + i * 42));
    }
    if (state.screen === "paused" || state.screen === "matchover") {
      c.fillStyle = "rgba(0,0,0,.55)";
      c.fillRect(0, 0, K.FIELD_W, K.FIELD_H);
      c.fillStyle = "#fff";
      c.font = "bold 40px system-ui";
      c.fillText(
        state.screen === "paused"
          ? "PAUSED"
          : `${state.winner === "left" ? "PLAYER ONE" : "PLAYER TWO"} WINS`,
        K.FIELD_CX,
        240,
      );
    }
    items(state.screen).forEach((v, i) => {
      const r = menuRect(state.screen, i)!;
      c.fillStyle = i === state.menuIndex ? "#f1a64a" : "#b9d7e5";
      c.fillRect(r.x, r.y, r.w, r.h);
      c.fillStyle = BACKGROUND;
      c.font = "bold 20px system-ui";
      c.fillText(v, K.FIELD_CX, r.y + 34);
    });
  },
};
