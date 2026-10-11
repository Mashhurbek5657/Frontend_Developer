import { useEffect, useRef, useState } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
 
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
 
// Kesishgan barmoqlar ishorasida chiqadigan yozuv (xohlasangiz o'zgartiring)
const GOJO_TEXT = "Satoru Gojo";
 
// Zarralar soni (telefonda kamroq)
const COUNT = typeof window !== "undefined" && window.innerWidth < 700 ? 2400 : 3800;
const TAU = Math.PI * 2;
const STRIDE = 6; // har bir zarra: x, y, z, hue, yorug'lik, guruh
 
const SHAPE_LABEL = {
  idle: "Ishora kutilmoqda...",
  name: "V ishora: kiritilgan ism",
  pistol: "Ikki qo'l ko'tarilgan: to'pponcha",
  saturn: "Mushtlangan qo'l: qizil Saturn",
  gojo: "Barmoqlar kesishgan: Gojo",
  castle: "OK ishora (bosh va ko'rsatkich halqa): qizil qala",
  spider: "Ko'rsatkich + jimjiloq ochiq: o'rgimchak va to'r",
};
 
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const wrapHue = (h) => ((h % 360) + 360) % 360;
 
/* ================= SHAKL GENERATORLARI =================
   Har bir shakl Float32Array: [x, y, z, hue, lightness, group, ...]
   x, y taxminan -1..1 oralig'ida (y pastga o'sadi).                  */
 
function newShape() {
  return new Float32Array(COUNT * STRIDE);
}
 
function put(a, i, x, y, z, h, l, g) {
  const k = i * STRIDE;
  a[k] = x;
  a[k + 1] = y;
  a[k + 2] = z;
  a[k + 3] = wrapHue(h);
  a[k + 4] = l;
  a[k + 5] = g || 0;
}
 
// Ishora yo'qligida: butun ekranga yoyilgan sekin aylanuvchi kosmik chang
function makeDust() {
  const out = newShape();
  for (let i = 0; i < COUNT; i++) {
    const r = Math.pow(Math.random(), 0.65);
    const a = (i % 3) * (TAU / 3) + r * 5.5 + rnd(-0.4, 0.4);
    put(out, i, Math.cos(a) * r, Math.sin(a) * r, 0, r < 0.12 ? 45 : 190 + r * 130, 60, 0);
  }
  return out;
}
 
// Matn piksellaridan nuqtalar (x: -1..1)
function textPoints(text) {
  const W = 640;
  const H = 240;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  g.fillStyle = "#fff";
  g.textAlign = "center";
  g.textBaseline = "middle";
 
  let size = 170;
  g.font = `bold ${size}px sans-serif`;
  while (g.measureText(text).width > 600 && size > 30) {
    size -= 6;
    g.font = `bold ${size}px sans-serif`;
  }
  g.fillText(text, W / 2, H / 2 + 6);
 
  const data = g.getImageData(0, 0, W, H).data;
  const pts = [];
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      if (data[(y * W + x) * 4 + 3] > 128) pts.push([(x - W / 2) / (W / 2), (y - H / 2) / (W / 2)]);
    }
  }
  if (!pts.length) pts.push([0, 0]);
  return pts;
}
 
// V ishora: kiritilgan ism
function makeName(text) {
  const out = newShape();
  const pts = textPoints(text);
  for (let i = 0; i < COUNT; i++) {
    const [x, y] = pts[(Math.random() * pts.length) | 0];
    put(out, i, x + rnd(-0.006, 0.006), y + rnd(-0.006, 0.006), 0, ((x + 1) / 2) * 300, 62, 0);
  }
  return out;
}
 
/* ---- ko'pburchaklarni zarralar bilan to'ldirish ---- */
 
function polyArea(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    s += x1 * y2 - x2 * y1;
  }
  return Math.abs(s) / 2;
}
 
function inPoly(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
 
// polys: [{ pts, hue, l, holes: [ring, ring] }]
function makeFilled(polys, edgeFrac = 0.3) {
  const items = polys.map((p) => {
    const holes = p.holes || [];
    const xs = p.pts.map((q) => q[0]);
    const ys = p.pts.map((q) => q[1]);
    const area = Math.max(
      1e-4,
      polyArea(p.pts) - holes.reduce((s, h) => s + polyArea(h), 0)
    );
    return {
      pts: p.pts,
      holes,
      hue: p.hue,
      l: p.l || 56,
      area,
      x0: Math.min(...xs),
      x1: Math.max(...xs),
      y0: Math.min(...ys),
      y1: Math.max(...ys),
    };
  });
  const totalArea = items.reduce((s, p) => s + p.area, 0);
 
  // chekka chiziqlari (yorqinroq kontur uchun)
  const segs = [];
  let totalLen = 0;
  items.forEach((p) => {
    [p.pts, ...p.holes].forEach((ring) => {
      for (let i = 0; i < ring.length; i++) {
        const [x1, y1] = ring[i];
        const [x2, y2] = ring[(i + 1) % ring.length];
        totalLen += Math.hypot(x2 - x1, y2 - y1);
        segs.push({ x1, y1, x2, y2, hue: p.hue, end: totalLen });
      }
    });
  });
 
  const edgePoint = () => {
    const pick = Math.random() * totalLen;
    const s = segs.find((g) => g.end >= pick) || segs[segs.length - 1];
    const t = Math.random();
    return {
      x: s.x1 + (s.x2 - s.x1) * t,
      y: s.y1 + (s.y2 - s.y1) * t,
      h: s.hue + rnd(-8, 8),
      l: 76,
    };
  };
 
  const list = [];
  for (let i = 0; i < COUNT; i++) {
    if (Math.random() < edgeFrac) {
      list.push(edgePoint());
      continue;
    }
    let pick = Math.random() * totalArea;
    const p = items.find((it) => (pick -= it.area) <= 0) || items[items.length - 1];
    let done = false;
    for (let tries = 0; tries < 30 && !done; tries++) {
      const x = rnd(p.x0, p.x1);
      const y = rnd(p.y0, p.y1);
      if (inPoly(x, y, p.pts) && !p.holes.some((h) => inPoly(x, y, h))) {
        list.push({ x, y, h: p.hue + rnd(-8, 8), l: p.l + rnd(-6, 6) });
        done = true;
      }
    }
    if (!done) list.push(edgePoint());
  }
 
  // markazga keltirish
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  list.forEach((q) => {
    if (q.x < minX) minX = q.x;
    if (q.x > maxX) maxX = q.x;
    if (q.y < minY) minY = q.y;
    if (q.y > maxY) maxY = q.y;
  });
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
 
  const out = newShape();
  list.forEach((q, i) => put(out, i, q.x - cx, q.y - cy, 0, q.h, q.l, 0));
  return out;
}
 
// Ikki qo'l ko'tarilgan: haqiqiy to'pponchaga o'xshash shakl (yon ko'rinish, dula o'ngga qaragan)
function makePistol() {
  const steel = 205; // slayd po'lati
  const polymer = 218; // ramka
  const brass = 38; // patron
 
  // slayd: orqa va old sirraklar (serrations), patron chiqarish oynasi
  const slots = [];
  for (let n = 0; n < 6; n++) {
    const x = -0.84 + n * 0.06;
    slots.push([[x, -0.27], [x + 0.022, -0.27], [x + 0.022, -0.07], [x, -0.07]]);
  }
  for (let n = 0; n < 3; n++) {
    const x = 0.52 + n * 0.06;
    slots.push([[x, -0.27], [x + 0.022, -0.27], [x + 0.022, -0.07], [x, -0.07]]);
  }
  const ejection = [[0.02, -0.26], [0.4, -0.26], [0.4, -0.12], [0.02, -0.12]];
 
  // ramka (aksessuar relslari, tepki halqasi bilan)
  const railSlots = [];
  for (let n = 0; n < 3; n++) {
    const x = 0.5 + n * 0.09;
    railSlots.push([[x, 0.0], [x + 0.04, 0.0], [x + 0.04, 0.05], [x, 0.05]]);
  }
  const guardHole = [[-0.3, 0.12], [0.2, 0.12], [0.12, 0.22], [0.06, 0.31], [-0.34, 0.31]];
 
  const polys = [
    // slayd (old tomoni qiya kesilgan)
    {
      pts: [[-0.9, -0.28], [-0.86, -0.3], [0.8, -0.3], [0.93, -0.26], [0.95, -0.2], [0.95, -0.04], [-0.9, -0.04]],
      hue: steel,
      l: 64,
      holes: [...slots, ejection],
    },
    // orqa nishon (o'yiqli)
    {
      pts: [[-0.88, -0.3], [-0.88, -0.37], [-0.7, -0.37], [-0.7, -0.3]],
      hue: steel,
      l: 70,
      holes: [[[-0.81, -0.38], [-0.77, -0.38], [-0.77, -0.33], [-0.81, -0.33]]],
    },
    // old nishon va uning nuqtasi
    { pts: [[0.78, -0.3], [0.8, -0.37], [0.9, -0.37], [0.92, -0.3]], hue: steel, l: 70 },
    { pts: [[0.84, -0.36], [0.86, -0.36], [0.86, -0.34], [0.84, -0.34]], hue: 120, l: 76 },
    // dula uchi (ichida kanal teshigi)
    {
      pts: [[0.94, -0.21], [1.03, -0.21], [1.03, -0.09], [0.94, -0.09]],
      hue: steel,
      l: 58,
      holes: [[[0.99, -0.17], [1.04, -0.17], [1.04, -0.13], [0.99, -0.13]]],
    },
    // patron (chiqarish oynasida ko'rinadi)
    { pts: [[0.1, -0.21], [0.38, -0.21], [0.38, -0.14], [0.1, -0.14]], hue: brass, l: 66 },
    // ramka: relsli old qismi, tepki halqasi, dasta
    {
      pts: [
        [-0.9, -0.04], [0.9, -0.04], [0.9, 0.03], [0.76, 0.08], [0.3, 0.08], [0.2, 0.2],
        [0.12, 0.33], [0.04, 0.38], [-0.38, 0.38], [-0.53, 0.9], [-1.1, 0.9], [-0.9, 0.04],
      ],
      hue: polymer,
      l: 50,
      holes: [guardHole, ...railSlots],
    },
    // slayd to'xtatgich
    { pts: [[-0.14, -0.04], [0.14, -0.04], [0.19, 0.0], [0.14, 0.045], [-0.14, 0.045]], hue: 195, l: 74 },
    // tepki
    { pts: [[0.0, 0.12], [0.05, 0.12], [0.025, 0.21], [-0.02, 0.27], [-0.08, 0.28], [-0.05, 0.22]], hue: 200, l: 68 },
    // magazin tagligi
    { pts: [[-1.13, 0.9], [-0.49, 0.9], [-0.5, 0.98], [-1.14, 0.98]], hue: polymer, l: 60 },
  ];
 
  // dasta g'adir-budirligi (romb shaklidagi nuqtalar)
  for (let row = 0; row < 7; row++) {
    const y = 0.48 + row * 0.063;
    const xb = -0.9 - 0.2 * ((y - 0.04) / 0.86); // orqa tomon chizig'i
    const xf = -0.38 - 0.15 * ((y - 0.38) / 0.52); // old tomon chizig'i
    const step = 0.07;
    const off = (row % 2) * (step / 2);
    for (let x = xb + 0.07 + off; x < xf - 0.06; x += step) {
      polys.push({ pts: [[x, y - 0.02], [x + 0.018, y], [x, y + 0.02], [x - 0.018, y]], hue: 30, l: 70 });
    }
  }
 
  return makeFilled(polys, 0.4);
}
 
// Tishli (crenellated) minora/devor konturi
function crenel(xl, xr, yTop, yBot, mH, n) {
  const pts = [[xl, yBot]];
  const segN = 2 * n - 1;
  const w = xr - xl;
  for (let s = 0; s < segN; s++) {
    const x0 = xl + (w * s) / segN;
    const x1 = xl + (w * (s + 1)) / segN;
    const y = s % 2 === 0 ? yTop : yTop + mH;
    pts.push([x0, y], [x1, y]);
  }
  pts.push([xr, yBot]);
  return pts;
}
 
// OK ishora: qizil qala
function makeCastle() {
  const red = 4;
  const gate = [
    [-0.13, 0.7], [-0.13, 0.34], [-0.1, 0.25], [-0.05, 0.2], [0, 0.19],
    [0.05, 0.2], [0.1, 0.25], [0.13, 0.34], [0.13, 0.7],
  ];
  return makeFilled(
    [
      { pts: crenel(-0.72, 0.72, -0.12, 0.7, 0.09, 7), hue: red, l: 46, holes: [gate] },
      {
        pts: crenel(-1.02, -0.62, -0.6, 0.7, 0.1, 3),
        hue: red + 5,
        l: 54,
        holes: [[[-0.88, -0.3], [-0.76, -0.3], [-0.76, -0.1], [-0.88, -0.1]]],
      },
      {
        pts: crenel(0.62, 1.02, -0.6, 0.7, 0.1, 3),
        hue: red + 5,
        l: 54,
        holes: [[[0.76, -0.3], [0.88, -0.3], [0.88, -0.1], [0.76, -0.1]]],
      },
      {
        pts: crenel(-0.3, 0.3, -0.9, 0.7, 0.1, 3),
        hue: red - 2,
        l: 58,
        holes: [gate, [[-0.05, -0.55], [0.05, -0.55], [0.05, -0.3], [-0.05, -0.3]]],
      },
      { pts: [[-0.012, -1.22], [0.012, -1.22], [0.012, -0.9], [-0.012, -0.9]], hue: 10, l: 66 }, // bayroq tayog'i
      { pts: [[0.012, -1.22], [0.3, -1.13], [0.012, -1.04]], hue: 12, l: 64 }, // bayroq
    ],
    0.32
  );
}
 
// Mushtlangan qo'l: o'z o'qi atrofida aylanuvchi qizil Saturn
function makeSaturn() {
  const out = newShape();
  const planetN = Math.floor(COUNT * 0.58);
  for (let i = 0; i < COUNT; i++) {
    if (i < planetN) {
      const u = rnd(-1, 1);
      const a = rnd(0, TAU);
      const s = Math.sqrt(1 - u * u);
      const r = 0.5 * rnd(0.93, 1);
      const band = Math.sin(u * 9 + Math.sin(a * 3) * 0.6); // gorizontal yo'llar
      const spot = Math.sin(a * 5 + u * 3) > 0.7 ? 12 : 0; // aylanishi ko'rinishi uchun dog'lar
      put(out, i, r * s * Math.cos(a), r * u, r * s * Math.sin(a), 358 + band * 8, 52 + band * 8 + spot, 0);
    } else {
      let rr = 0.72 + Math.random() * 0.45;
      while (rr > 0.93 && rr < 0.98) rr = 0.72 + Math.random() * 0.45; // Kassini bo'shlig'i
      const a = rnd(0, TAU);
      put(out, i, rr * Math.cos(a), rnd(-0.008, 0.008), rr * Math.sin(a), 10 + (rr - 0.72) * 40, 55 + rnd(-6, 8), 0);
    }
  }
  return out;
}
 
// Gojo: yon tomondagi aylanuvchi shar (guruh 1 = ko'k chapda, guruh 2 = qizil o'ngda)
function fillOrb(out, from, to, hue, group) {
  for (let i = from; i < to; i++) {
    if (Math.random() < 0.55) {
      const u = rnd(-1, 1);
      const a = rnd(0, TAU);
      const s = Math.sqrt(1 - u * u);
      const r = 0.2 * rnd(0.9, 1);
      const stripe = Math.sin(a * 4 + u * 3) > 0.6 ? 14 : 0;
      put(out, i, r * s * Math.cos(a), r * u, r * s * Math.sin(a), hue + rnd(-6, 6), 58 + stripe, group);
    } else {
      const rr = rnd(0.24, 0.38);
      const arm = i % 2;
      const a = arm * Math.PI + (rr - 0.24) * 12 + rnd(-0.28, 0.28);
      put(out, i, rr * Math.cos(a), rnd(-0.01, 0.01), rr * Math.sin(a), hue + rnd(-10, 10), 62, group);
    }
  }
}
 
function makeGojo() {
  const out = newShape();
  const textN = Math.floor(COUNT * 0.3);
  const orbN = Math.floor((COUNT - textN) / 2);
  const pts = textPoints(GOJO_TEXT);
  const k = 0.46;
  for (let i = 0; i < textN; i++) {
    const [x, y] = pts[(Math.random() * pts.length) | 0];
    // chapdan o'ngga: ko'k -> binafsha -> qizil
    put(out, i, x * k + rnd(-0.003, 0.003), y * k + rnd(-0.003, 0.003), 0, 220 + ((x + 1) / 2) * 140, 70, 0);
  }
  fillOrb(out, textN, textN + orbN, 205, 1);
  fillOrb(out, textN + orbN, COUNT, 358, 2);
  return out;
}
 
/* ---- o'rgimchak va to'r (original, umumiy o'rgimchak) ---- */
 
function makeSpiderWeb() {
  const out = newShape();
 
  const web = [];
  const legs = [];
  const addSeg = (arr, a, b) => arr.push({ a, b, len: Math.hypot(b[0] - a[0], b[1] - a[1]) });
 
  // --- to'r: nurlar + sal egilgan halqalar ---
  const cx = 0;
  const cy = -0.2;
  const R = 0.78;
  const N = 12;
  const ang = (k) => -Math.PI / 2 + (k / N) * TAU;
 
  for (let k = 0; k < N; k++) {
    addSeg(web, [cx, cy], [cx + Math.cos(ang(k)) * R, cy + Math.sin(ang(k)) * R]);
  }
  for (let ring = 1; ring <= 7; ring++) {
    const r = (R * ring) / 7;
    for (let k = 0; k < N; k++) {
      const a = [cx + Math.cos(ang(k)) * r, cy + Math.sin(ang(k)) * r];
      const b = [cx + Math.cos(ang(k + 1)) * r, cy + Math.sin(ang(k + 1)) * r];
      // o'rtasi markazga qarab sal tortilgan (to'r osilib turganday)
      const mid = [cx + ((a[0] + b[0]) / 2 - cx) * 0.9, cy + ((a[1] + b[1]) / 2 - cy) * 0.9];
      addSeg(web, a, mid);
      addSeg(web, mid, b);
    }
  }
 
  // --- o'rgimchak oyoqlari (4 juft, har biri ikki bo'g'in) ---
  const hx = 0;
  const hy = 0.66;
  const knee = [[0.2, -0.2], [0.28, -0.1], [0.28, 0.04], [0.22, 0.16]];
  const foot = [[0.12, 0.12], [0.16, 0.1], [0.14, 0.16], [0.1, 0.2]];
  for (const s of [-1, 1]) {
    for (let k = 0; k < 4; k++) {
      const start = [hx + s * 0.05, hy + k * 0.02];
      const kn = [start[0] + s * knee[k][0], start[1] + knee[k][1]];
      const ft = [kn[0] + s * foot[k][0], kn[1] + foot[k][1]];
      addSeg(legs, start, kn);
      addSeg(legs, kn, ft);
    }
  }
 
  const total = (arr) => arr.reduce((s, g) => s + g.len, 0);
  const webLen = total(web);
  const legLen = total(legs);
  const pickSeg = (arr, sum) => {
    let p = Math.random() * sum;
    for (const g of arr) {
      p -= g.len;
      if (p <= 0) return g;
    }
    return arr[arr.length - 1];
  };
 
  const webN = Math.floor(COUNT * 0.56);
  const legN = Math.floor(COUNT * 0.12);
  const abdN = Math.floor(COUNT * 0.17);
  const headN = Math.floor(COUNT * 0.07);
 
  let i = 0;
  // to'r
  for (let n = 0; n < webN; n++, i++) {
    const g = pickSeg(web, webLen);
    const t = Math.random();
    put(
      out,
      i,
      g.a[0] + (g.b[0] - g.a[0]) * t + rnd(-0.004, 0.004),
      g.a[1] + (g.b[1] - g.a[1]) * t + rnd(-0.004, 0.004),
      0,
      195 + rnd(-8, 8),
      78 + rnd(-6, 6),
      0
    );
  }
  // oyoqlar
  for (let n = 0; n < legN; n++, i++) {
    const g = pickSeg(legs, legLen);
    const t = Math.random();
    put(
      out,
      i,
      g.a[0] + (g.b[0] - g.a[0]) * t + rnd(-0.004, 0.004),
      g.a[1] + (g.b[1] - g.a[1]) * t + rnd(-0.004, 0.004),
      0,
      28 + rnd(-6, 6),
      52,
      0
    );
  }
  // qorin (yo'l-yo'l naqshli)
  for (let n = 0; n < abdN; n++, i++) {
    const r = Math.sqrt(Math.random());
    const a = rnd(0, TAU);
    const x = Math.cos(a) * r * 0.15;
    const y = 0.88 + Math.sin(a) * r * 0.19;
    const stripe = Math.sin(y * 45) > 0.4 ? 14 : 0;
    put(out, i, x, y, 0, 28 + rnd(-6, 6), 44 + stripe, 0);
  }
  // bosh
  for (let n = 0; n < headN; n++, i++) {
    const r = Math.sqrt(Math.random());
    const a = rnd(0, TAU);
    put(out, i, Math.cos(a) * r * 0.08, hy + Math.sin(a) * r * 0.07, 0, 32 + rnd(-5, 5), 56, 0);
  }
  // ko'zlar (yorqin nuqtalar) va qolgan zarralar to'rga qo'shiladi
  for (; i < COUNT; i++) {
    if (i % 3 === 0) {
      const s = i % 2 ? 1 : -1;
      put(out, i, s * 0.03 + rnd(-0.006, 0.006), hy - 0.015 + rnd(-0.006, 0.006), 0, 120, 78, 0);
    } else {
      const g = pickSeg(web, webLen);
      const t = Math.random();
      put(out, i, g.a[0] + (g.b[0] - g.a[0]) * t, g.a[1] + (g.b[1] - g.a[1]) * t, 0, 195, 80, 0);
    }
  }
  return out;
}
 
function buildShapes(name) {
  const orbDepth = 1 / 0.4;
  return {
    idle: { data: makeDust(), groups: [{ zspin: 0.05 }] },
    name: { data: makeName(name), groups: [{}] },
    pistol: { data: makePistol(), groups: [{}] },
    saturn: {
      data: makeSaturn(),
      groups: [{ spin: 0.7, tilt: 0.5, roll: -0.35, depth: 1 / 1.15 }],
    },
    gojo: {
      data: makeGojo(),
      groups: [
        {},
        { cx: -0.88, spin: 2.4, tilt: 0.5, roll: 0.35, depth: orbDepth },
        { cx: 0.88, spin: -2.4, tilt: -0.5, roll: -0.35, depth: orbDepth },
      ],
    },
    castle: { data: makeCastle(), groups: [{}] },
    spider: { data: makeSpiderWeb(), groups: [{}] },
  };
}
 
function getScale(key, W, H) {
  switch (key) {
    case "idle":
      return Math.max(W, H) * 0.5;
    case "name":
      return Math.min(W * 0.4, H * 0.8);
    case "gojo":
      return Math.min(W * 0.38, H * 0.6);
    case "pistol":
      return Math.min(W * 0.34, H * 0.5);
    case "saturn":
      return Math.min(W * 0.3, H * 0.38);
    case "spider":
      return Math.min(W * 0.4, H * 0.42);
    default:
      return Math.min(W, H) * 0.36;
  }
}
 
/* ================= ORQA FON: QORA G'UBORLI GALAKTIKA ================= */
 
function buildBackground(W, H) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.floor(W));
  c.height = Math.max(1, Math.floor(H));
  const g = c.getContext("2d");
 
  // deyarli sof qora asos
  const base = g.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0, "#000002");
  base.addColorStop(0.55, "#010105");
  base.addColorStop(1, "#02010a");
  g.fillStyle = base;
  g.fillRect(0, 0, W, H);
 
  g.globalCompositeOperation = "lighter";
 
  // juda xira, yumshoq g'uborli tumanliklar
  const hazes = [[265, 0.05], [225, 0.045], [300, 0.035], [200, 0.03], [270, 0.04]];
  for (let n = 0; n < 16; n++) {
    const [h, al] = hazes[n % hazes.length];
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = rnd(0.18, 0.42) * Math.max(W, H);
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `hsla(${h}, 70%, 35%, ${al})`);
    gr.addColorStop(1, `hsla(${h}, 70%, 35%, 0)`);
    g.fillStyle = gr;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
 
  // qo'zg'almas yulduzlar
  for (let n = 0; n < 380; n++) {
    g.fillStyle = `rgba(255,255,255,${rnd(0.12, 0.6)})`;
    const s = Math.random() < 0.08 ? 2 : 1;
    g.fillRect(Math.random() * W, Math.random() * H, s, s);
  }
  return c;
}
 
// Sekin aylanadigan spiral galaktika (bir marta chiziladi)
function buildGalaxy() {
  const S = 1024;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const g = c.getContext("2d");
  g.globalCompositeOperation = "lighter";
  const cx = S / 2;
  const R = S * 0.46;
 
  const core = g.createRadialGradient(cx, cx, 0, cx, cx, R * 0.45);
  core.addColorStop(0, "rgba(255,214,150,0.4)");
  core.addColorStop(0.35, "rgba(150,100,230,0.14)");
  core.addColorStop(1, "rgba(60,40,160,0)");
  g.fillStyle = core;
  g.fillRect(0, 0, S, S);
 
  for (let n = 0; n < 1100; n++) {
    const t = Math.pow(Math.random(), 0.75);
    const r = t * R;
    const a = (n % 2) * Math.PI + t * 5.2 + rnd(-0.5, 0.5) * (0.35 + t);
    const x = cx + Math.cos(a) * r;
    const y = cx + Math.sin(a) * r;
    const rad = rnd(14, 46) * (0.6 + t);
    const hue = t < 0.18 ? 35 : 200 + t * 120;
    const al = rnd(0.015, 0.05);
    const gg = g.createRadialGradient(x, y, 0, x, y, rad);
    gg.addColorStop(0, `hsla(${hue}, 80%, 58%, ${al})`);
    gg.addColorStop(1, `hsla(${hue}, 80%, 58%, 0)`);
    g.fillStyle = gg;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
 
  for (let n = 0; n < 1400; n++) {
    const t = Math.pow(Math.random(), 0.7);
    const r = t * R * 1.05;
    const a = (n % 2) * Math.PI + t * 5.2 + rnd(-0.7, 0.7) * (0.35 + t);
    g.fillStyle = `rgba(255,255,255,${rnd(0.08, 0.45)})`;
    g.fillRect(cx + Math.cos(a) * r, cx + Math.sin(a) * r, 1.2, 1.2);
  }
  return c;
}
 
/* ================= QO'L ISHORASINI ANIQLASH ================= */
 
function analyzeHand(l, vw, vh) {
  // piksel koordinatalariga o'tkazamiz (x, y turli masshtabda bo'lmasligi uchun)
  const P = l.map((p) => ({ x: p.x * vw, y: p.y * vh, z: p.z * vw }));
  const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
 
  // barmoq to'g'rimi: MCP -> uchi masofasi / barmoq bo'g'imlari yig'indisi
  const straight = (a, b, c, d) =>
    d3(P[a], P[d]) / (d3(P[a], P[b]) + d3(P[b], P[c]) + d3(P[c], P[d]) || 1);
  const EXT = 0.85;
  const i = straight(5, 6, 7, 8) > EXT;
  const m = straight(9, 10, 11, 12) > EXT;
  const r = straight(13, 14, 15, 16) > EXT;
  const p = straight(17, 18, 19, 20) > EXT;
 
  // ko'rsatkich va o'rta barmoq uchlari orasidagi holat:
  // ~1 yonma-yon, >1.3 V (ochiq), <0.55 kesishgan
  const ax = P[9].x - P[5].x;
  const ay = P[9].y - P[5].y;
  const len2 = ax * ax + ay * ay || 1;
  const proj = (q) => ((q.x - P[5].x) * ax + (q.y - P[5].y) * ay) / len2;
  const d = proj(P[12]) - proj(P[8]);
 
  // OK ishora / chimchilash: bosh barmoq va ko'rsatkich uchlari tegib turadi (kaft o'lchamiga nisbatan)
  const handSize = d3(P[0], P[9]) || 1;
  const pinch = d3(P[4], P[8]) / handSize;
 
  return {
    i,
    m,
    r,
    p,
    n4: (i ? 1 : 0) + (m ? 1 : 0) + (r ? 1 : 0) + (p ? 1 : 0),
    d,
    pinch,
  };
}
 
function classify(hands, vw, vh) {
  if (!hands.length) return "idle";
  const info = hands.map((h) => analyzeHand(h, vw, vh));
 
  // 1) OK ishora (rasmdagi): bosh + ko'rsatkich halqa, qolgan uch barmoq ochiq -> qala
  for (const f of info) {
    if (f.pinch < 0.45 && f.m && f.r && f.p) return "castle";
  }
 
  // 2) ikkala qo'l ochiq va ko'tarilgan
  if (info.length >= 2 && info[0].n4 === 4 && info[1].n4 === 4) return "pistol";
 
  for (const f of info) {
    if (f.n4 === 0) return "saturn"; // mushtlangan / bukilgan qo'l
    // 3) ko'rsatkich va jimjiloq ochiq, o'rta va nomsiz bukilgan -> o'rgimchak va to'r
    if (f.i && f.p && !f.m && !f.r) return "spider";
    if (f.i && f.m && !f.r && !f.p) {
      if (f.d > 1.3) return "name"; // V
      if (f.d < 0.55) return "gojo"; // kesishgan barmoqlar
      return "castle"; // yonma-yon barmoqlar (eski ishora ham ishlaydi)
    }
  }
  return "idle";
}
 
/* ================= CHIZISH BO'LIMI ================= */
 
const DRAW_COLORS = ["#ffffff", "#22d3ee", "#a78bfa", "#f472b6", "#ef4444", "#f59e0b", "#facc15", "#4ade80"];
 
// Faqat ko'rsatkich barmoq ochiq, qolgan barmoqlar yig'ilgan
function isPointing(f) {
  return f.i && !f.m && !f.r && !f.p;
}
 
const BTN = "rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-[11px] sm:px-2.5 sm:text-xs text-white hover:bg-white/20";
 
// Yaratuvchi logotipi: public/logo.png ga o'z rasmingizni qo'ying (topilmasa "ME" belgisi chiqadi)
const LOGO_SRC = "/logo.png";
const BTN_ON = "rounded-lg border border-cyan-300 bg-cyan-400/30 px-2 py-1 text-[11px] sm:px-2.5 sm:text-xs text-white";
 
/* ================= KOMPONENT ================= */
 
export default function AI() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const camCanvasRef = useRef(null);
  const strokeCanvasRef = useRef(null);
  const shapesRef = useRef(null);
  const handSeenRef = useRef(false);
 
  // Chizish sozlamalari: animatsiya sikli ichida ref orqali o'qiladi
  const modeRef = useRef("particles");
  const colorRef = useRef(DRAW_COLORS[1]);
  const sizeRef = useRef(8);
  const eraseRef = useRef(false);
  const glowRef = useRef(true);
  const drawStateRef = useRef("none");
  const actionsRef = useRef({ undo() {}, clear() {}, save() {} });
 
  const [status, setStatus] = useState("Kamera yoqilmoqda...");
  const [shape, setShape] = useState("idle");
  const [handSeen, setHandSeen] = useState(false);
  const [name, setName] = useState("Mashhurbek");
 
  const [mode, setMode] = useState("particles"); // "particles" | "draw"
  const [color, setColor] = useState(DRAW_COLORS[1]);
  const [size, setSize] = useState(8);
  const [erase, setErase] = useState(false);
  const [glow, setGlow] = useState(true);
  const [bright, setBright] = useState(0.35); // 2-bo'lim: kamera fonining yorqinligi
  const [drawState, setDrawState] = useState("none"); // none | ready | drawing | moving
  const [logoOk, setLogoOk] = useState(true);
 
  if (!shapesRef.current) shapesRef.current = buildShapes("Ism");
 
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => {
    colorRef.current = color;
  }, [color]);
  useEffect(() => {
    sizeRef.current = size;
  }, [size]);
  useEffect(() => {
    eraseRef.current = erase;
  }, [erase]);
  useEffect(() => {
    glowRef.current = glow;
  }, [glow]);
 
  // Ism o'zgarganda matn shaklini qayta yasash
  useEffect(() => {
    shapesRef.current.name = { data: makeName(name.trim() || "Ism"), groups: [{}] };
  }, [name]);
 
  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    let stream = null;
    let landmarker = null;
 
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const camCanvas = camCanvasRef.current;
    const strokeCanvas = strokeCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const camCtx = camCanvas.getContext("2d");
    const sctx = strokeCanvas.getContext("2d");
 
    let W = 0;
    let H = 0;
    let CW = 0;
    let CH = 0;
    let SW = 0;
    let SH = 0;
    let dpr = 1;
    let bg = null;
    const galaxy = buildGalaxy();
 
    /* ---------- 2-bo'lim: chizish ma'lumotlari ---------- */
    // har bir chiziq: { color, size, erase, glow, pts: [[nx, ny], ...] } (nx, ny: 0..1)
    const strokes = [];
    let curStroke = null;
    let smooth = null; // silliqlangan barmoq uchi (0..1)
    let cursor = null; // kamera kanvasidagi piksel koordinatalari
    let pointFrames = 0;
    let lostFrames = 0;
 
    // ---- siljitish (chimchilash) ----
    let grabbed = null; // ushlangan chiziq
    let gSmooth = null; // silliqlangan chimchilash nuqtasi (0..1)
    let gPrev = null; // oldingi chimchilash nuqtasi (0..1)
    let pinching = false;
    let pinchOpenFrames = 0;
 
    const toPx = (p) => [p[0] * SW, p[1] * SH];
 
    const distToStroke = (s, x, y) => {
      const P = s.pts.map((p) => [p[0] * SW, p[1] * SH]);
      if (P.length === 1) return Math.hypot(P[0][0] - x, P[0][1] - y);
      let best = Infinity;
      for (let n = 1; n < P.length; n++) {
        const [x1, y1] = P[n - 1];
        const [x2, y2] = P[n];
        const dx = x2 - x1;
        const dy = y2 - y1;
        const l2 = dx * dx + dy * dy || 1;
        const t = clamp(((x - x1) * dx + (y - y1) * dy) / l2, 0, 1);
        best = Math.min(best, Math.hypot(x - (x1 + dx * t), y - (y1 + dy * t)));
      }
      return best;
    };
    const findStroke = (x, y) => {
      for (let n = strokes.length - 1; n >= 0; n--) {
        const s = strokes[n];
        if (s.erase) continue; // o'chirgich izlarini siljitmaymiz
        if (distToStroke(s, x, y) <= s.size / 2 + 28) return s;
      }
      return null;
    };
 
    const applyStyle = (s) => {
      sctx.lineCap = "round";
      sctx.lineJoin = "round";
      if (s.erase) {
        sctx.globalCompositeOperation = "destination-out";
        sctx.strokeStyle = "#000";
        sctx.fillStyle = "#000";
        sctx.shadowBlur = 0;
        sctx.lineWidth = s.size * 2;
      } else {
        sctx.globalCompositeOperation = "source-over";
        sctx.strokeStyle = s.color;
        sctx.fillStyle = s.color;
        sctx.shadowColor = s.color;
        sctx.shadowBlur = s.glow ? s.size * 1.6 + 4 : 0;
        sctx.lineWidth = s.size;
      }
    };
    const resetStyle = () => {
      sctx.globalCompositeOperation = "source-over";
      sctx.shadowBlur = 0;
    };
    const drawDot = (s, p) => {
      applyStyle(s);
      const [x, y] = toPx(p);
      sctx.beginPath();
      sctx.arc(x, y, (s.erase ? s.size * 2 : s.size) / 2, 0, TAU);
      sctx.fill();
      resetStyle();
    };
    const drawSeg = (s, a, b) => {
      applyStyle(s);
      const [x1, y1] = toPx(a);
      const [x2, y2] = toPx(b);
      sctx.beginPath();
      sctx.moveTo(x1, y1);
      sctx.lineTo(x2, y2);
      sctx.stroke();
      resetStyle();
    };
 
    const redraw = () => {
      sctx.clearRect(0, 0, SW, SH);
      strokes.forEach((s) => {
        if (s.pts.length === 1) {
          drawDot(s, s.pts[0]);
          return;
        }
        applyStyle(s);
        sctx.beginPath();
        const [x0, y0] = toPx(s.pts[0]);
        sctx.moveTo(x0, y0);
        for (let n = 1; n < s.pts.length; n++) {
          const [x, y] = toPx(s.pts[n]);
          sctx.lineTo(x, y);
        }
        sctx.stroke();
        resetStyle();
      });
    };
 
    actionsRef.current = {
      undo: () => {
        strokes.pop();
        curStroke = null;
        grabbed = null;
        redraw();
      },
      clear: () => {
        strokes.length = 0;
        curStroke = null;
        grabbed = null;
        redraw();
      },
      save: () => {
        const c = document.createElement("canvas");
        c.width = strokeCanvas.width;
        c.height = strokeCanvas.height;
        const g = c.getContext("2d");
        g.fillStyle = "#04040c";
        g.fillRect(0, 0, c.width, c.height);
        g.drawImage(strokeCanvas, 0, 0);
        const a = document.createElement("a");
        a.download = "chizma.png";
        a.href = c.toDataURL("image/png");
        a.click();
      },
    };
 
    // kamera kanvasi o'lchami o'zgarsa (1-bo'lim <-> 2-bo'lim) moslashtiramiz
    const syncCam = () => {
      const w = camCanvas.clientWidth;
      const h = camCanvas.clientHeight;
      if (w > 0 && h > 0 && (w !== CW || h !== CH)) {
        CW = w;
        CH = h;
        camCanvas.width = Math.round(CW * dpr);
        camCanvas.height = Math.round(CH * dpr);
        camCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };
 
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
 
      SW = window.innerWidth;
      SH = window.innerHeight;
      strokeCanvas.width = Math.round(SW * dpr);
      strokeCanvas.height = Math.round(SH * dpr);
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
 
      CW = -1; // majburan qayta o'lchash
      syncCam();
 
      bg = buildBackground(W, H);
      redraw();
    };
    resize();
    window.addEventListener("resize", resize);
 
    // ---- zarralar ----
    const px = new Float32Array(COUNT);
    const py = new Float32Array(COUNT);
    const vx = new Float32Array(COUNT);
    const vy = new Float32Array(COUNT);
    const hue = new Float32Array(COUNT);
    const lit = new Float32Array(COUNT);
    const sz = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      px[i] = Math.random() * W;
      py[i] = Math.random() * H;
      hue[i] = rnd(180, 320);
      lit[i] = 60;
      sz[i] = rnd(0.9, 2.4);
    }
 
    // ---- miltillovchi yulduzlar ----
    const stars = Array.from({ length: 140 }, () => ({
      x: Math.random(),
      y: Math.random(),
      s: rnd(0.6, 1.8),
      p: rnd(0, TAU),
      f: rnd(0.6, 2.2),
    }));
 
    let current = "idle";
    let pending = "idle";
    let pendingFrames = 0;
    let alpha = 0.5;
    let scaleCur = getScale("idle", W, H);
    let handsPts = [];
 
    const toCam = (p) => {
      const vw = video.videoWidth || 640;
      const vh = video.videoHeight || 480;
      const s = Math.max(CW / vw, CH / vh);
      return {
        x: (CW - vw * s) / 2 + (1 - p.x) * vw * s, // kamera ko'zgudek
        y: (CH - vh * s) / 2 + p.y * vh * s,
      };
    };
 
    const setDrawStateSafe = (st) => {
      if (drawStateRef.current !== st) {
        drawStateRef.current = st;
        setDrawState(st);
      }
    };
 
    // 2-bo'lim: ko'rsatkich barmoq bilan chizish, chimchilash bilan siljitish
    const handleDraw = (hands, vw, vh) => {
      // --- chimchilash: bosh + ko'rsatkich uchi tutashgan bo'lsa siljitish rejimi ---
      let pinchIdx = -1;
      for (let n = 0; n < hands.length; n++) {
        const f = analyzeHand(hands[n], vw, vh);
        if (f.pinch < (pinching ? 0.55 : 0.35)) {
          pinchIdx = n;
          break;
        }
      }
 
      if (pinchIdx >= 0 && CW > 0 && CH > 0) {
        const a = handsPts[pinchIdx][4];
        const b = handsPts[pinchIdx][8];
        const nx = clamp((a.x + b.x) / 2 / CW, 0, 1);
        const ny = clamp((a.y + b.y) / 2 / CH, 0, 1);
 
        // chizish yarim qolgan bo'lsa tugatamiz
        curStroke = null;
        smooth = null;
        pointFrames = 0;
        lostFrames = 0;
        pinchOpenFrames = 0;
 
        if (!gSmooth) gSmooth = [nx, ny];
        else {
          gSmooth[0] += (nx - gSmooth[0]) * 0.5;
          gSmooth[1] += (ny - gSmooth[1]) * 0.5;
        }
 
        if (!pinching) {
          // chimchilash endi boshlandi: chiziq ustidami?
          pinching = true;
          grabbed = findStroke(gSmooth[0] * SW, gSmooth[1] * SH);
          gPrev = [gSmooth[0], gSmooth[1]];
        } else if (grabbed && gPrev) {
          const dx = gSmooth[0] - gPrev[0];
          const dy = gSmooth[1] - gPrev[1];
          grabbed.pts.forEach((p) => {
            p[0] += dx;
            p[1] += dy;
          });
          gPrev = [gSmooth[0], gSmooth[1]];
          redraw();
        }
        cursor = { x: gSmooth[0] * CW, y: gSmooth[1] * CH };
        setDrawStateSafe(grabbed ? "moving" : "ready");
        return;
      }
 
      if (pinching) {
        pinchOpenFrames++;
        if (pinchOpenFrames < 3) return; // qisqa uzilishlarni kechiramiz
        pinching = false;
        grabbed = null;
        gSmooth = null;
        gPrev = null;
      }
 
      // --- oddiy chizish ---
      let tip = null;
      for (let n = 0; n < hands.length; n++) {
        if (isPointing(analyzeHand(hands[n], vw, vh))) {
          tip = handsPts[n][8]; // 8 = ko'rsatkich barmoq uchi
          break;
        }
      }
 
      if (tip && CW > 0 && CH > 0) {
        const nx = clamp(tip.x / CW, 0, 1);
        const ny = clamp(tip.y / CH, 0, 1);
        if (!smooth) smooth = [nx, ny];
        else {
          smooth[0] += (nx - smooth[0]) * 0.5; // titroqni kamaytirish
          smooth[1] += (ny - smooth[1]) * 0.5;
        }
        pointFrames++;
        lostFrames = 0;
        cursor = { x: smooth[0] * CW, y: smooth[1] * CH };
 
        const startStroke = () => {
          curStroke = {
            color: colorRef.current,
            size: sizeRef.current,
            erase: eraseRef.current,
            glow: glowRef.current,
            pts: [[smooth[0], smooth[1]]],
          };
          strokes.push(curStroke);
          drawDot(curStroke, curStroke.pts[0]);
        };
        // rang/qalinlik o'zgarsa, yangi sozlama yangi chiziqdan boshlanadi
        const stale =
          curStroke &&
          (curStroke.color !== colorRef.current ||
            curStroke.size !== sizeRef.current ||
            curStroke.erase !== eraseRef.current ||
            curStroke.glow !== glowRef.current);
 
        if ((!curStroke && pointFrames >= 3) || stale) {
          startStroke();
        } else if (curStroke) {
          const last = curStroke.pts[curStroke.pts.length - 1];
          const cur = [smooth[0], smooth[1]];
          if (Math.hypot((cur[0] - last[0]) * SW, (cur[1] - last[1]) * SH) > 1.5) {
            curStroke.pts.push(cur);
            drawSeg(curStroke, last, cur);
          }
        }
      } else {
        cursor = null;
        pointFrames = 0;
        lostFrames++;
        if (lostFrames >= 4) {
          curStroke = null; // chiziq tugadi (barmoq yig'ildi yoki qo'l yo'qoldi)
          smooth = null;
        }
      }
 
      setDrawStateSafe(curStroke ? "drawing" : tip ? "ready" : "none");
    };
 
    const connections = HandLandmarker.HAND_CONNECTIONS || [];
    let lastVideoTime = -1;
 
    const loop = (now) => {
      if (cancelled) return;
      raf = requestAnimationFrame(loop);
      const t = now / 1000;
      const isDraw = modeRef.current === "draw";
 
      syncCam();
 
      // ---- qo'llarni aniqlash ----
      if (landmarker && video.readyState >= 2 && video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        let res = null;
        try {
          res = landmarker.detectForVideo(video, now);
        } catch (e) {
          res = null;
        }
        const hands = (res && res.landmarks) || [];
        handsPts = hands.map((h) => h.map(toCam));
 
        const seen = hands.length > 0;
        if (handSeenRef.current !== seen) {
          handSeenRef.current = seen;
          setHandSeen(seen);
        }
 
        const vw = video.videoWidth || 640;
        const vh = video.videoHeight || 480;
 
        if (isDraw) {
          handleDraw(hands, vw, vh);
        } else {
          // 1-bo'limga qaytilganda ochiq qolgan chiziq va ushlashni yopamiz
          if (curStroke || cursor || grabbed || pinching) {
            curStroke = null;
            smooth = null;
            cursor = null;
            pointFrames = 0;
            lostFrames = 0;
            grabbed = null;
            pinching = false;
            pinchOpenFrames = 0;
            gSmooth = null;
            gPrev = null;
            setDrawStateSafe("none");
          }
 
          const mapped = classify(hands, vw, vh);
          if (mapped === pending) pendingFrames++;
          else {
            pending = mapped;
            pendingFrames = 0;
          }
          // ishora barqaror bo'lsa almashtiramiz (idle ga qaytish sekinroq)
          const need = pending === "idle" ? 14 : 5;
          if (pendingFrames >= need && current !== pending) {
            current = pending;
            setShape(current);
          }
        }
      }
 
      // ---- kamera ustidagi qo'l skeleti (+ 2-bo'limda chizish kursori) ----
      camCtx.clearRect(0, 0, CW, CH);
      if (handsPts.length) {
        const col = isDraw ? "rgba(34, 211, 238, 0.35)" : "rgba(34, 211, 238, 0.95)";
        camCtx.strokeStyle = col;
        camCtx.lineWidth = isDraw ? 1.5 : 2;
        camCtx.fillStyle = col;
        handsPts.forEach((pts) => {
          camCtx.beginPath();
          connections.forEach(({ start, end }) => {
            camCtx.moveTo(pts[start].x, pts[start].y);
            camCtx.lineTo(pts[end].x, pts[end].y);
          });
          camCtx.stroke();
          pts.forEach((p) => {
            camCtx.beginPath();
            camCtx.arc(p.x, p.y, isDraw ? 2 : 2.5, 0, TAU);
            camCtx.fill();
          });
        });
      }
      if (isDraw && cursor) {
        const e = eraseRef.current;
        const r = Math.max(6, (e ? sizeRef.current * 2 : sizeRef.current) / 2);
        camCtx.beginPath();
        camCtx.arc(cursor.x, cursor.y, r, 0, TAU);
        camCtx.fillStyle = e ? "rgba(255,255,255,0.18)" : colorRef.current;
        camCtx.globalAlpha = curStroke || grabbed ? 0.95 : 0.4;
        camCtx.fill();
        camCtx.globalAlpha = 1;
        camCtx.lineWidth = 2;
        camCtx.strokeStyle = "rgba(255,255,255,0.9)";
        camCtx.stroke();
      }
 
      // ushlangan chiziq atrofida punktir ramka
      if (isDraw && grabbed) {
        let x0 = Infinity;
        let y0 = Infinity;
        let x1 = -Infinity;
        let y1 = -Infinity;
        grabbed.pts.forEach((p) => {
          const x = p[0] * CW;
          const y = p[1] * CH;
          if (x < x0) x0 = x;
          if (y < y0) y0 = y;
          if (x > x1) x1 = x;
          if (y > y1) y1 = y;
        });
        const pad = grabbed.size / 2 + 10;
        camCtx.save();
        camCtx.setLineDash([6, 5]);
        camCtx.lineWidth = 1.5;
        camCtx.strokeStyle = "rgba(255,255,255,0.85)";
        camCtx.strokeRect(x0 - pad, y0 - pad, x1 - x0 + pad * 2, y1 - y0 + pad * 2);
        camCtx.restore();
      }
 
      // ---- 1-bo'lim: zarralar ----
      if (!isDraw) {
        // orqa fon
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
        if (bg) ctx.drawImage(bg, 0, 0, W, H);
 
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.rotate(t * 0.03);
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 0.6; // galaktika xiraroq, fon qoraroq
        const gs = Math.max(W, H) * 1.15;
        ctx.drawImage(galaxy, -gs / 2, -gs / 2, gs, gs);
        ctx.restore();
 
        ctx.globalCompositeOperation = "lighter";
        for (let n = 0; n < stars.length; n++) {
          const s = stars[n];
          ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.35 * Math.sin(t * s.f + s.p)})`;
          ctx.fillRect(s.x * W, s.y * H, s.s, s.s);
        }
 
        const sh = shapesRef.current[current];
        const data = sh.data;
        const gm = sh.groups.map((g) => {
          const sa = (g.spin || 0) * t;
          const ra = (g.roll || 0) + (g.zspin || 0) * t;
          const ta = g.tilt || 0;
          return {
            ca: Math.cos(sa),
            sa: Math.sin(sa),
            ct: Math.cos(ta),
            st: Math.sin(ta),
            cr: Math.cos(ra),
            sr: Math.sin(ra),
            cx: g.cx || 0,
            cy: g.cy || 0,
            dep: g.depth || 0,
            rot: !!(g.spin || g.tilt || g.roll || g.zspin),
          };
        });
 
        scaleCur += (getScale(current, W, H) - scaleCur) * 0.1;
        alpha += ((current === "idle" ? 0.5 : 0.95) - alpha) * 0.06;
        const sizeMul = current === "idle" ? 0.85 : 1.2;
        const cX = W / 2;
        const cY = H / 2;
 
        for (let i = 0; i < COUNT; i++) {
          const k = i * STRIDE;
          let x = data[k];
          let y = data[k + 1];
          let z = data[k + 2];
          const m = gm[data[k + 5] | 0];
 
          let depth = 0;
          if (m.rot) {
            const x1 = x * m.ca + z * m.sa;
            const z1 = -x * m.sa + z * m.ca;
            const y2 = y * m.ct - z1 * m.st;
            const z2 = y * m.st + z1 * m.ct;
            x = x1 * m.cr - y2 * m.sr;
            y = x1 * m.sr + y2 * m.cr;
            z = z2;
            depth = clamp(z * m.dep, -1, 1);
          }
 
          const tx = cX + (m.cx + x) * scaleCur;
          const ty = cY + (m.cy + y) * scaleCur;
 
          vx[i] += (tx - px[i]) * 0.06;
          vy[i] += (ty - py[i]) * 0.06;
          vx[i] *= 0.84;
          vy[i] *= 0.84;
          px[i] += vx[i];
          py[i] += vy[i];
 
          const dh = ((data[k + 3] - hue[i] + 540) % 360) - 180;
          hue[i] = wrapHue(hue[i] + dh * 0.08);
          lit[i] += (data[k + 4] - lit[i]) * 0.08;
 
          const L = clamp(lit[i] + depth * 16, 30, 88);
          const a = alpha * (m.rot ? 0.65 + 0.35 * (depth * 0.5 + 0.5) : 1);
          const s = sz[i] * sizeMul * (1 + depth * 0.3);
 
          ctx.fillStyle = `hsla(${hue[i] | 0}, 100%, ${L | 0}%, ${a})`;
          ctx.fillRect(px[i] - s / 2, py[i] - s / 2, s, s);
        }
 
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
      }
    };
    raf = requestAnimationFrame(loop);
 
    // ---- kamera va model ----
    const init = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        video.srcObject = stream;
        await video.play();
 
        setStatus("Model yuklanmoqda...");
        const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
        const make = (delegate) =>
          HandLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: MODEL_URL, delegate },
            runningMode: "VIDEO",
            numHands: 2,
          });
        try {
          landmarker = await make("GPU");
        } catch {
          landmarker = await make("CPU");
        }
        if (cancelled) {
          landmarker.close();
          landmarker = null;
          return;
        }
        setStatus("Qo'lingizni kameraga ko'rsating");
      } catch (e) {
        console.error(e);
        if (e && e.name === "NotAllowedError") {
          setStatus("Kameraga ruxsat berilmadi. Brauzer sozlamalaridan ruxsat bering.");
        } else if (e && e.name === "NotFoundError") {
          setStatus("Kamera topilmadi.");
        } else {
          setStatus("Xato: " + ((e && e.message) || e));
        }
      }
    };
    init();
 
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      if (stream) stream.getTracks().forEach((tr) => tr.stop());
      if (landmarker) landmarker.close();
    };
  }, []);
 
  const isDraw = mode === "draw";
 
  let chipText;
  if (isDraw) {
    if (!handSeen) chipText = status;
    else if (drawState === "moving") chipText = "Ko'chirilmoqda... (barmoqlarni ochsangiz qo'yiladi)";
    else if (drawState === "drawing") chipText = "Chizilmoqda...";
    else if (drawState === "ready") chipText = "Tayyor: ko'rsatkich barmoq bilan chizing, chimchilab siljiting";
    else chipText = "Chizish: faqat ko'rsatkich barmoq. Siljitish: chiziq ustida bosh va ko'rsatkichni tutashtiring";
  } else {
    chipText = handSeen ? SHAPE_LABEL[shape] : status;
  }
 
  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* 1-bo'lim: zarralar kanvasi (2-bo'limda yashirin, lekin o'lchami saqlanadi) */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full ${isDraw ? "opacity-0 pointer-events-none" : ""}`}
      />
 
      {/* 1-bo'lim: ishoralar ro'yxati */}
      {!isDraw && (
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 hidden min-[400px]:block rounded-xl bg-black/45 backdrop-blur px-3 py-2 sm:px-4 sm:py-3 text-white text-xs sm:text-sm max-w-[48vw] sm:max-w-[60vw] md:max-w-[70vw]">
          <p className="font-semibold mb-1">Ishoralar</p>
          <ul className="space-y-0.5 text-[10px] sm:text-xs text-white/70">
            {Object.entries(SHAPE_LABEL)
              .filter(([key]) => key !== "idle")
              .map(([key, label]) => (
                <li key={key} className={key === shape ? "text-cyan-300 font-semibold" : ""}>
                  {label}
                </li>
              ))}
          </ul>
        </div>
      )}
 
      {/* 1-bo'lim: ism kiritish */}
      {!isDraw && (
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 rounded-xl bg-black/45 backdrop-blur px-3 py-2 sm:px-4 sm:py-3 text-white text-sm">
          <label className="block text-[10px] sm:text-xs text-white/70 mb-1">V ishorada chiqadigan ism</label>
          <input
            value={name}
            maxLength={14}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ismingiz"
            className="w-28 sm:w-40 rounded-lg bg-[#10133A] border border-[#273066] px-3 py-1.5 text-sm text-white outline-none"
          />
        </div>
      )}
 
      {/* Kamera: 1-bo'limda pastki chap burchakda, 2-bo'limda butun ekran (qoraroq fon) */}
      <div
        className={
          isDraw
            ? "absolute inset-0 overflow-hidden bg-black"
            : "absolute left-2 bottom-2 sm:left-4 sm:bottom-4 w-[min(220px,42vw)] md:w-[min(300px,30vw)] aspect-[4/3] overflow-hidden rounded-2xl border border-cyan-400/40 bg-black shadow-[0_0_25px_rgba(34,211,238,.25)]"
        }
        
      >
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            transform: "scaleX(-1)",
            filter: isDraw ? `brightness(${bright}) saturate(0.8)` : "none",
          }}
        />
        {/* 2-bo'lim: chizilgan chiziqlar */}
        <canvas ref={strokeCanvasRef} className={`absolute inset-0 w-full h-full ${isDraw ? "" : "hidden"}`} />
        {/* qo'l skeleti va kursor */}
        <canvas ref={camCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        <div
          className={`absolute rounded-md bg-black/60 px-2 py-0.5 text-cyan-200 ${
            isDraw
              ? "left-2 bottom-2 sm:left-4 sm:bottom-4 max-w-[58vw] sm:max-w-[70vw] text-[11px] sm:text-xs"
              : "left-1.5 top-1.5 sm:left-2 sm:top-2 max-w-[calc(100%-12px)] text-[9px] sm:text-[11px] leading-tight"
          }`}
        >
          {chipText}
        </div>
      </div>
 
      {/* 2-bo'lim: yuqoridagi asboblar paneli */}
      {isDraw && (
        <div className="absolute top-2 sm:top-4 left-1/2 z-10 flex max-w-[96vw] max-h-[60vh] overflow-y-auto -translate-x-1/2 flex-wrap items-center justify-center gap-x-2 sm:gap-x-4 gap-y-1.5 sm:gap-y-2 rounded-2xl bg-black/60 px-2.5 py-2 sm:px-4 sm:py-2.5 text-[11px] sm:text-xs text-white backdrop-blur">
          {/* rang tanlash */}
          <div className="flex items-center gap-1.5">
            {DRAW_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Rang ${c}`}
                onClick={() => {
                  setColor(c);
                  setErase(false);
                }}
                className={`h-5 w-5 sm:h-6 sm:w-6 rounded-full border-2 transition ${
                  color === c && !erase ? "scale-110 border-white" : "border-white/30"
                }`}
                style={{ background: c }}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                setErase(false);
              }}
              title="Boshqa rang"
              className="h-6 w-8 cursor-pointer rounded border border-white/30 bg-transparent p-0"
            />
          </div>
 
          {/* chizish qalinligi */}
          <label className="flex items-center gap-2">
            <span className="text-white/70">Qalinlik</span>
            <input
              type="range"
              min={2}
              max={48}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-20 sm:w-28 accent-cyan-400"
            />
            <span className="w-6 text-right tabular-nums">{size}</span>
            <span className="flex h-6 w-6 items-center justify-center">
              <span
                className="rounded-full"
                style={{
                  width: Math.min(24, size),
                  height: Math.min(24, size),
                  background: erase ? "transparent" : color,
                  border: erase ? "1px dashed #fff" : "none",
                }}
              />
            </span>
          </label>
 
          {/* kamera fonining yorqinligi */}
          <label className="flex items-center gap-2">
            <span className="text-white/70">Fon</span>
            <input
              type="range"
              min={0.1}
              max={0.9}
              step={0.05}
              value={bright}
              onChange={(e) => setBright(Number(e.target.value))}
              className="w-16 sm:w-20 accent-cyan-400"
            />
          </label>
 
          {/* amallar */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button type="button" onClick={() => setGlow((g) => !g)} className={glow ? BTN_ON : BTN}>
              Yorug'lik
            </button>
            <button type="button" onClick={() => setErase((e) => !e)} className={erase ? BTN_ON : BTN}>
              O'chirgich
            </button>
            <button type="button" onClick={() => actionsRef.current.undo()} className={BTN}>
              Orqaga
            </button>
            <button type="button" onClick={() => actionsRef.current.clear()} className={BTN}>
              Tozalash
            </button>
            <button type="button" onClick={() => actionsRef.current.save()} className={BTN}>
              Saqlash
            </button>
          </div>
        </div>
      )}
 
      {/* Yaratuvchi: ikkala bo'limda ham o'ng pastki burchakda */}
      <div className="pointer-events-none absolute bottom-12 right-2 z-10 flex items-center gap-2 rounded-xl bg-black/55 px-2 py-1.5 backdrop-blur sm:bottom-16 sm:right-4 sm:px-2.5">
        {logoOk ? (
          <img
            src={LOGO_SRC}
            alt="Logo"
            onError={() => setLogoOk(false)}
            className="h-7 w-7 rounded-full object-cover sm:h-9 sm:w-9"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-400/30 text-[10px] font-bold text-cyan-100 sm:h-9 sm:w-9 sm:text-xs">
            <img src="/ChatGPT Image 7 окт. 2026 г., 19_12_43.png" className=" border-0 rounded-full" alt="" />
          </div>
        )}
        <div className="leading-tight">
          <p className="text-[9px] text-white/60 sm:text-[10px]">Web-sayt yaratuvchisi</p>
          <p className="text-[11px] font-semibold text-white sm:text-xs">Mashhurbek Ergashev</p>
        </div>
      </div>
 
      {/* Bo'limlarni almashtirish */}
      <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 z-10 flex gap-1 rounded-2xl bg-black/55 p-1 backdrop-blur">
        <button
          type="button"
          onClick={() => setMode("particles")}
          className={`rounded-xl px-2.5 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm ${
            !isDraw ? "bg-cyan-400/30 text-white" : "text-white/70 hover:bg-white/10"
          }`}
        >
          1 · Zarralar
        </button>
        <button
          type="button"
          onClick={() => setMode("draw")}
          className={`rounded-xl px-2.5 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm ${
            isDraw ? "bg-cyan-400/30 text-white" : "text-white/70 hover:bg-white/10"
          }`}
        >
          2 · Chizish
        </button>
      </div>
    </div>
  );
} 