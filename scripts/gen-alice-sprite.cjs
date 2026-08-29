// 一次性脚本：生成天童爱丽丝像素雪碧图 public/alice-sprite.png
// 布局 3x3 格，每格 32x32（内部 16x16 逻辑像素，2x 放大）：
//   第 0 行 = 待机 3 帧（正常 / 下沉 1px 浮动 / 眨眼）
//   第 1 行 = 摸头 2 帧（开心弯眼 + 害羞）+ 复用帧
//   第 2 行 = 复用待机帧
const sharp = require('sharp');

const PALETTE = {
  G: '#dce775', // 光环（黄绿）
  H: '#6ec1e8', // 头发（浅蓝）
  D: '#3e8fc4', // 头发阴影/闭眼线
  S: '#ffe0c2', // 皮肤
  E: '#1f4e79', // 眼睛
  W: '#ffffff', // 眼中高光
  M: '#d8a686', // 闭眼线/嘴
  U: '#2e4374', // 制服（藏青）
  C: '#f2f2f2', // 衣领
  B: '#ffaf9b', // 脸红
};

// 基础帧：天童爱丽丝 16x16（光环 + 蓝发 + 制服半身）
const BASE = [
  '.....GGGGGG.....',
  '....G......G....',
  '....AHHHHHH.....'.replace(/A/g, 'H'),
  '...HHHHHHHHHH...',
  '..HHHHHHHHHHHH..',
  '.HHHHHHHHHHHHHH.',
  '.HHSSSSSSSSSSHH.',
  '.HSSEWSSSSWESSH.',
  '.HSSEESSSSEESSH.',
  '.HHSBSSSMMSSBSSH',
  '..HHSSSSSSSSHH..',
  '.D.UUUUUUUUUU.D.',
  '.D.UUCCCCUUUU.D.',
  '.D.UUUCUUCUUU.D.',
  '.D..UUUUUUUU..D.',
  '.D...UUUUUU...D.',
];

function shiftDown(rows) {
  return ['................', ...rows.slice(0, rows.length - 1)];
}

function closeEyes(rows, happy) {
  return rows.map((row, y) => {
    if (y === 7) {
      // 眼睛上缘：开心时用弯线，平时闭合为皮肤
      return happy ? row : row.replace(/E|W/g, 'S');
    }
    if (y === 8) {
      let r = happy ? row.replace(/EE/g, 'MM') : row.replace(/E/g, 'S');
      if (happy) r = r.replace(/M/g, 'M'); // 保持弯眼
      return r;
    }
    if (happy && y === 9) {
      // 微笑加大
      return row.replace(/MM/, 'MM');
    }
    return row;
  });
}

function toRows(base, transform) {
  const rows = base.map((r) => r.padEnd(16, '.').slice(0, 16));
  return transform ? transform(rows) : rows;
}

const frames = [
  toRows(BASE),                                  // idle0
  toRows(BASE, shiftDown),                       // idle1 浮动
  toRows(BASE, (r) => closeEyes(r, false)),      // idle2 眨眼
  toRows(BASE, (r) => closeEyes(r, true)),       // pet0 开心
  toRows(BASE, (r) => { const c = closeEyes(shiftDown(r), true); return c; }), // pet1
  toRows(BASE),                                  // 第 6 格备用
  toRows(BASE),                                  // 第 7 格备用
  toRows(BASE),                                  // 第 8 格备用
];

let rects = '';
frames.forEach((rows, fi) => {
  const ox = (fi % 3) * 32;
  const oy = Math.floor(fi / 3) * 32;
  rows.forEach((row, y) => {
    for (let x = 0; x < 16; x++) {
      const ch = row[x];
      if (ch === '.' || !PALETTE[ch]) continue;
      rects += `<rect x="${ox + x * 2}" y="${oy + y * 2}" width="2" height="2" fill="${PALETTE[ch]}" shape-rendering="crispEdges"/>`;
    }
  });
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">${rects}</svg>`;

sharp(Buffer.from(svg))
  .png()
  .toFile('public/alice-sprite.png')
  .then((info) => console.log('sprite generated:', info.width + 'x' + info.height))
  .catch((e) => { console.error(e); process.exit(1); });
