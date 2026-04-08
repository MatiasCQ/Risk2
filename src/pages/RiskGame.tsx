import { useEffect, useRef, useState, useCallback } from "react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";
const WS_BASE = (() => {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws`;
})();

const PLAYER_COLORS_MAP: Record<string, string> = {
  "#e74c3c": "Rojo", "#3498db": "Azul", "#2ecc71": "Verde",
  "#f39c12": "Naranja", "#9b59b6": "Morado", "#1abc9c": "Turquesa",
};

const TERRITORY_POSITIONS: Record<string, { x: number; y: number; label: string }> = {
  alaska: { x: 75, y: 95, label: "Alaska" },
  northwest_territory: { x: 155, y: 85, label: "NW Territory" },
  greenland: { x: 290, y: 60, label: "Groenlandia" },
  alberta: { x: 140, y: 128, label: "Alberta" },
  ontario: { x: 200, y: 133, label: "Ontario" },
  quebec: { x: 255, y: 122, label: "Quebec" },
  western_us: { x: 145, y: 178, label: "USA Oeste" },
  eastern_us: { x: 212, y: 178, label: "USA Este" },
  central_america: { x: 172, y: 228, label: "C.America" },
  venezuela: { x: 228, y: 292, label: "Venezuela" },
  peru: { x: 228, y: 365, label: "Peru" },
  brazil: { x: 285, y: 342, label: "Brasil" },
  argentina: { x: 255, y: 432, label: "Argentina" },
  iceland: { x: 392, y: 75, label: "Islandia" },
  great_britain: { x: 402, y: 122, label: "Gran Bretana" },
  scandinavia: { x: 458, y: 78, label: "Escandinavia" },
  northern_europe: { x: 452, y: 132, label: "N.Europa" },
  western_europe: { x: 412, y: 168, label: "O.Europa" },
  southern_europe: { x: 462, y: 172, label: "S.Europa" },
  ukraine: { x: 515, y: 118, label: "Ucrania" },
  north_africa: { x: 422, y: 242, label: "N.Africa" },
  egypt: { x: 492, y: 232, label: "Egipto" },
  east_africa: { x: 522, y: 292, label: "E.Africa" },
  congo: { x: 478, y: 332, label: "Congo" },
  south_africa: { x: 492, y: 402, label: "S.Africa" },
  madagascar: { x: 552, y: 392, label: "Madagascar" },
  middle_east: { x: 558, y: 212, label: "O.Medio" },
  afghanistan: { x: 602, y: 155, label: "Afganistan" },
  ural: { x: 582, y: 98, label: "Ural" },
  india: { x: 642, y: 218, label: "India" },
  china: { x: 682, y: 175, label: "China" },
  siberia: { x: 662, y: 88, label: "Siberia" },
  mongolia: { x: 722, y: 142, label: "Mongolia" },
  irkutsk: { x: 722, y: 98, label: "Irkutsk" },
  yakutsk: { x: 742, y: 62, label: "Yakutsk" },
  kamchatka: { x: 792, y: 88, label: "Kamchatka" },
  japan: { x: 802, y: 152, label: "Japon" },
  siam: { x: 702, y: 248, label: "Siam" },
  indonesia: { x: 722, y: 312, label: "Indonesia" },
  new_guinea: { x: 792, y: 292, label: "Nueva Guinea" },
  western_australia: { x: 752, y: 392, label: "O.Australia" },
  eastern_australia: { x: 822, y: 372, label: "E.Australia" },
};

const CONTINENT_COLORS: Record<string, string> = {
  north_america: "#2980b9", south_america: "#27ae60", europe: "#8e44ad",
  africa: "#e67e22", asia: "#c0392b", australia: "#16a085",
};

const TERRITORY_TO_CONTINENT: Record<string, string> = {
  alaska: "north_america", northwest_territory: "north_america", greenland: "north_america",
  alberta: "north_america", ontario: "north_america", quebec: "north_america",
  western_us: "north_america", eastern_us: "north_america", central_america: "north_america",
  venezuela: "south_america", peru: "south_america", brazil: "south_america", argentina: "south_america",
  iceland: "europe", great_britain: "europe", scandinavia: "europe", northern_europe: "europe",
  western_europe: "europe", southern_europe: "europe", ukraine: "europe",
  north_africa: "africa", egypt: "africa", east_africa: "africa", congo: "africa",
  south_africa: "africa", madagascar: "africa",
  middle_east: "asia", afghanistan: "asia", ural: "asia", india: "asia", china: "asia",
  siberia: "asia", mongolia: "asia", irkutsk: "asia", yakutsk: "asia", kamchatka: "asia",
  japan: "asia", siam: "asia",
  indonesia: "australia", new_guinea: "australia", western_australia: "australia", eastern_australia: "australia",
};

const NEIGHBORS: Record<string, string[]> = {
  alaska: ["northwest_territory","alberta","kamchatka"],
  northwest_territory: ["alaska","alberta","ontario","greenland"],
  greenland: ["northwest_territory","ontario","quebec","iceland"],
  alberta: ["alaska","northwest_territory","ontario","western_us"],
  ontario: ["northwest_territory","alberta","greenland","quebec","western_us","eastern_us"],
  quebec: ["greenland","ontario","eastern_us"],
  western_us: ["alberta","ontario","eastern_us","central_america"],
  eastern_us: ["ontario","quebec","western_us","central_america"],
  central_america: ["western_us","eastern_us","venezuela"],
  venezuela: ["central_america","peru","brazil"],
  peru: ["venezuela","brazil","argentina"],
  brazil: ["venezuela","peru","argentina","north_africa"],
  argentina: ["peru","brazil"],
  iceland: ["greenland","great_britain","scandinavia"],
  great_britain: ["iceland","scandinavia","northern_europe","western_europe"],
  scandinavia: ["iceland","great_britain","northern_europe","ukraine"],
  northern_europe: ["great_britain","scandinavia","western_europe","southern_europe","ukraine"],
  western_europe: ["great_britain","northern_europe","southern_europe","north_africa"],
  southern_europe: ["northern_europe","western_europe","ukraine","middle_east","egypt"],
  ukraine: ["scandinavia","northern_europe","southern_europe","middle_east","afghanistan","ural"],
  north_africa: ["brazil","western_europe","southern_europe","egypt","east_africa","congo"],
  egypt: ["north_africa","southern_europe","middle_east","east_africa"],
  east_africa: ["north_africa","egypt","middle_east","congo","south_africa","madagascar"],
  congo: ["north_africa","east_africa","south_africa"],
  south_africa: ["congo","east_africa","madagascar"],
  madagascar: ["east_africa","south_africa"],
  middle_east: ["southern_europe","ukraine","egypt","east_africa","afghanistan","india"],
  afghanistan: ["ukraine","middle_east","india","ural","china"],
  ural: ["ukraine","afghanistan","siberia","china"],
  india: ["middle_east","afghanistan","china","siam"],
  china: ["afghanistan","ural","siberia","mongolia","india","siam"],
  siberia: ["ural","china","mongolia","irkutsk","yakutsk"],
  mongolia: ["china","siberia","irkutsk","kamchatka","japan"],
  irkutsk: ["siberia","mongolia","kamchatka","yakutsk"],
  yakutsk: ["siberia","irkutsk","kamchatka"],
  kamchatka: ["alaska","mongolia","irkutsk","yakutsk","japan"],
  japan: ["mongolia","kamchatka"],
  siam: ["india","china","indonesia"],
  indonesia: ["siam","new_guinea","western_australia"],
  new_guinea: ["indonesia","western_australia","eastern_australia"],
  western_australia: ["indonesia","new_guinea","eastern_australia"],
  eastern_australia: ["new_guinea","western_australia"],
};

const CONTINENT_SHAPES: Record<string, [number, number][]> = {
  north_america: [
    [50,92],[68,62],[80,52],[132,50],[162,56],[208,46],[262,36],
    [302,40],[312,58],[298,98],[286,148],[284,208],
    [265,232],[235,248],[208,250],[195,260],[182,270],
    [164,264],[148,244],[128,218],[105,202],
    [62,178],[50,148],[50,92]
  ],
  south_america: [
    [192,266],[250,254],[312,258],[326,302],[323,356],
    [308,412],[286,458],[262,470],[240,460],[224,430],
    [210,392],[196,356],[190,306],[192,266]
  ],
  europe_main: [
    [392,82],[416,66],[470,62],[538,78],[550,108],
    [542,148],[526,174],[492,188],[470,194],[448,178],
    [426,184],[408,170],[392,156],[386,128],[388,98],[392,82]
  ],
  iceland: [
    [370,60],[396,52],[418,60],[414,80],[388,87],[372,78],[370,60]
  ],
  africa: [
    [390,208],[432,198],[494,198],[570,192],[592,212],
    [582,268],[567,315],[564,370],[550,422],[516,442],
    [480,437],[458,412],[460,370],[455,355],[452,332],
    [422,288],[390,260],[390,208]
  ],
  madagascar: [
    [543,378],[560,372],[572,385],[568,408],[552,415],[538,405],[540,382],[543,378]
  ],
  asia: [
    [535,66],[612,48],[698,44],[780,48],[840,66],
    [860,98],[848,148],[830,182],[815,202],[752,232],
    [728,258],[728,284],[715,300],[702,282],[688,270],
    [660,270],[640,240],[622,230],[600,228],[578,228],
    [570,218],[568,192],[548,178],[542,155],[540,118],[535,88],[535,66]
  ],
  japan: [
    [795,142],[812,136],[825,148],[820,168],[806,172],[796,160],[795,142]
  ],
  australia_main: [
    [700,298],[732,286],[800,280],[860,283],[870,308],
    [858,348],[842,388],[820,410],[780,420],[750,422],
    [716,410],[703,385],[696,348],[700,298]
  ],
  new_guinea: [
    [758,272],[798,265],[830,275],[825,298],[796,305],[760,298],[758,272]
  ],
};

interface Player { id: string; name: string; color: string; isHost: boolean; isReady: boolean; }
interface TerritoryState { id: string; owner: string; armies: number; }
interface AttackResult {
  attackerDice: number[]; defenderDice: number[];
  attackerLosses: number; defenderLosses: number;
  territoryConquered: boolean;
  isBlitz?: boolean; totalAttackerLosses?: number; totalDefenderLosses?: number; rounds?: number;
}
interface GameState {
  code: string; phase: string; currentPlayer: string; players: Player[];
  territories: TerritoryState[]; reinforcementsLeft: number;
  attackResult: AttackResult | null; winner: string | null; message: string;
}
interface LobbyInfo { code: string; players: Player[]; maxPlayers: number; status: string; hostPlayerId?: string; joinedPlayerId?: string; }
type Screen = "home" | "create" | "join" | "lobby" | "game";

function getTerritoryPolygon(tid: string): [number, number][] {
  const pos = TERRITORY_POSITIONS[tid];
  if (!pos) return [];
  const neighbors = NEIGHBORS[tid] || [];
  const points: [number, number][] = [];

  for (const nid of neighbors) {
    const npos = TERRITORY_POSITIONS[nid];
    if (!npos || Math.abs(pos.x - npos.x) > 310) continue;
    const mx = (pos.x * 0.35 + npos.x * 0.65);
    const my = (pos.y * 0.35 + npos.y * 0.65);
    points.push([mx, my]);
  }

  if (points.length < 3) {
    const r = 35;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      points.push([pos.x + Math.cos(a) * r, pos.y + Math.sin(a) * r]);
    }
  } else {
    const angleStep = (Math.PI * 2) / 8;
    const existingAngles = points.map(p => Math.atan2(p[1] - pos.y, p[0] - pos.x));
    for (let i = 0; i < 8; i++) {
      const a = i * angleStep - Math.PI;
      const hasNear = existingAngles.some(ea => Math.abs(ea - a) < angleStep * 1.2);
      if (!hasNear) {
        const r = 30;
        points.push([pos.x + Math.cos(a) * r, pos.y + Math.sin(a) * r]);
      }
    }
  }

  points.sort((a, b) => {
    const aA = Math.atan2(a[1] - pos.y, a[0] - pos.x);
    const bA = Math.atan2(b[1] - pos.y, b[0] - pos.x);
    return aA - bA;
  });

  return points;
}

function drawContinent(ctx: CanvasRenderingContext2D, shape: [number, number][], fillColor: string, alpha = 0.18) {
  if (shape.length < 3) return;
  ctx.beginPath();
  ctx.moveTo(shape[0][0], shape[0][1]);
  for (let i = 1; i < shape.length; i++) ctx.lineTo(shape[i][0], shape[i][1]);
  ctx.closePath();
  ctx.fillStyle = fillColor + Math.round(alpha * 255).toString(16).padStart(2, "0");
  ctx.fill();
  ctx.strokeStyle = fillColor + "55";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawDie(ctx: CanvasRenderingContext2D, value: number, x: number, y: number, size: number, color: string, highlight = false) {
  const r = size * 0.12;
  ctx.save();
  ctx.shadowColor = highlight ? "#FFD700" : color;
  ctx.shadowBlur = highlight ? 14 : 6;

  const grad = ctx.createLinearGradient(x, y, x + size, y + size);
  grad.addColorStop(0, color + "ee");
  grad.addColorStop(1, color + "88");
  ctx.fillStyle = grad;
  ctx.strokeStyle = highlight ? "#FFD700" : "rgba(255,255,255,0.4)";
  ctx.lineWidth = highlight ? 2 : 1;
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, r);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;

  const dotPositions: Record<number, [number, number][]> = {
    1: [[0.5, 0.5]],
    2: [[0.25, 0.25], [0.75, 0.75]],
    3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
    4: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]],
    5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
    6: [[0.25, 0.2], [0.75, 0.2], [0.25, 0.5], [0.75, 0.5], [0.25, 0.8], [0.75, 0.8]],
  };
  const dots = dotPositions[value] || dotPositions[1];
  const dotR = size * 0.09;
  ctx.fillStyle = "#fff";
  for (const [dx, dy] of dots) {
    ctx.beginPath();
    ctx.arc(x + dx * size, y + dy * size, dotR, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawMap(
  canvas: HTMLCanvasElement,
  territories: TerritoryState[],
  players: Player[],
  selectedFrom: string | null,
  selectedTo: string | null
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;

  const oceanGrad = ctx.createLinearGradient(0, 0, W, H);
  oceanGrad.addColorStop(0, "#0a1e35");
  oceanGrad.addColorStop(0.5, "#0d2848");
  oceanGrad.addColorStop(1, "#091828");
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, W, H);

  for (let x = 0; x < W; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0); ctx.lineTo(x, H);
    ctx.strokeStyle = "rgba(100,160,220,0.04)"; ctx.lineWidth = 1; ctx.stroke();
  }
  for (let y = 0; y < H; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y); ctx.lineTo(W, y);
    ctx.strokeStyle = "rgba(100,160,220,0.04)"; ctx.lineWidth = 1; ctx.stroke();
  }

  const continentColorMap: Record<string, string> = {
    north_america: "#3498db", south_america: "#2ecc71",
    europe_main: "#9b59b6", iceland: "#9b59b6",
    africa: "#e67e22", madagascar: "#e67e22",
    asia: "#e74c3c", japan: "#e74c3c",
    australia_main: "#1abc9c", new_guinea: "#1abc9c",
  };

  for (const [key, shape] of Object.entries(CONTINENT_SHAPES)) {
    drawContinent(ctx, shape, continentColorMap[key] || "#888", 0.22);
  }

  const playerColorMap: Record<string, string> = {};
  players.forEach(p => { playerColorMap[p.id] = p.color; });
  const territoryMap: Record<string, TerritoryState> = {};
  territories.forEach(t => { territoryMap[t.id] = t; });

  const fromOwner = selectedFrom ? territoryMap[selectedFrom]?.owner : null;

  for (const tid of Object.keys(TERRITORY_POSITIONS)) {
    const ts = territoryMap[tid];
    const continent = TERRITORY_TO_CONTINENT[tid];
    const baseColor = CONTINENT_COLORS[continent] || "#555";
    const ownerColor = ts ? (playerColorMap[ts.owner] || baseColor) : baseColor;
    const isSelectedFrom = tid === selectedFrom;
    const isSelectedTo = tid === selectedTo;
    const isNeighborOfFrom = selectedFrom ? (NEIGHBORS[selectedFrom] || []).includes(tid) : false;
    const isAttackableNeighbor = isNeighborOfFrom && ts && ts.owner !== fromOwner;

    const poly = getTerritoryPolygon(tid);
    if (poly.length < 3) continue;

    ctx.save();
    const continentShape = Object.keys(CONTINENT_SHAPES).find(k => {
      const cContinent = k.replace("_main","").replace("iceland","europe").replace("madagascar","africa").replace("japan","asia").replace("new_guinea","australia");
      return continent.startsWith(cContinent.split("_")[0]);
    });
    if (continentShape) {
      const shape = CONTINENT_SHAPES[continentShape];
      if (shape && shape.length > 2) {
        ctx.beginPath();
        ctx.moveTo(shape[0][0], shape[0][1]);
        for (let i = 1; i < shape.length; i++) ctx.lineTo(shape[i][0], shape[i][1]);
        ctx.closePath();
        ctx.clip();
      }
    }

    ctx.beginPath();
    ctx.moveTo(poly[0][0], poly[0][1]);
    for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
    ctx.closePath();

    let fillColor: string;
    if (isSelectedFrom) fillColor = "#ffffff";
    else if (isSelectedTo) fillColor = ownerColor + "ff";
    else fillColor = ownerColor + "cc";
    ctx.fillStyle = fillColor;
    ctx.fill();

    ctx.strokeStyle = isSelectedFrom ? "#FFD700" : isSelectedTo ? "#ff4444" : isAttackableNeighbor ? "rgba(255,200,0,0.5)" : "rgba(0,0,0,0.5)";
    ctx.lineWidth = isSelectedFrom || isSelectedTo ? 2.5 : isAttackableNeighbor ? 1.5 : 1;
    ctx.stroke();
    ctx.restore();
  }

  for (const [tid, pos] of Object.entries(TERRITORY_POSITIONS)) {
    const ts = territoryMap[tid];
    const isNeighborOfFrom = selectedFrom ? (NEIGHBORS[selectedFrom] || []).includes(tid) : false;
    const isAttackableNeighbor = isNeighborOfFrom && ts && ts.owner !== fromOwner;

    if (isAttackableNeighbor) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,200,0,0.85)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  const drawn = new Set<string>();
  for (const [tid, neighbors] of Object.entries(NEIGHBORS)) {
    const posA = TERRITORY_POSITIONS[tid];
    if (!posA) continue;
    for (const nid of neighbors) {
      const key = [tid, nid].sort().join("-");
      if (drawn.has(key)) continue;
      drawn.add(key);
      const posB = TERRITORY_POSITIONS[nid];
      if (!posB || Math.abs(posA.x - posB.x) > 310) continue;
      const sameContinent = TERRITORY_TO_CONTINENT[tid] === TERRITORY_TO_CONTINENT[nid];
      if (sameContinent) continue;
      ctx.beginPath();
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      ctx.moveTo(posA.x, posA.y);
      ctx.lineTo(posB.x, posB.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  for (const [tid, pos] of Object.entries(TERRITORY_POSITIONS)) {
    const ts = territoryMap[tid];
    const continent = TERRITORY_TO_CONTINENT[tid];
    const baseColor = CONTINENT_COLORS[continent] || "#555";
    const ownerColor = ts ? (playerColorMap[ts.owner] || baseColor) : baseColor;
    const isSelectedFrom = tid === selectedFrom;
    const isSelectedTo = tid === selectedTo;

    const circleR = 15;
    ctx.save();
    ctx.shadowColor = ownerColor;
    ctx.shadowBlur = isSelectedFrom || isSelectedTo ? 18 : 8;

    const nodeGrad = ctx.createRadialGradient(pos.x - 3, pos.y - 3, 0, pos.x, pos.y, circleR);
    const nodeColor = isSelectedFrom ? "#fff" : isSelectedTo ? "#ffdd55" : ownerColor;
    nodeGrad.addColorStop(0, nodeColor + "ff");
    nodeGrad.addColorStop(1, nodeColor + "99");

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, circleR + (isSelectedFrom || isSelectedTo ? 3 : 0), 0, Math.PI * 2);
    ctx.fillStyle = nodeGrad;
    ctx.fill();
    ctx.strokeStyle = isSelectedFrom ? "#FFD700" : isSelectedTo ? "#ff4444" : "rgba(255,255,255,0.5)";
    ctx.lineWidth = isSelectedFrom || isSelectedTo ? 2.5 : 1.5;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    ctx.fillStyle = isSelectedFrom ? "#000" : "#fff";
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ts ? String(ts.armies) : "?", pos.x, pos.y);

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "bold 8px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(pos.label, pos.x, pos.y + circleR + 2);
  }
}

function hashString(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = Math.imul(31, h) + value.charCodeAt(i) | 0;
  }
  return Math.abs(h);
}

function pointsToPath(points: [number, number][]) {
  if (points.length === 0) return "";
  return `M ${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ")} Z`;
}

function makeTerritoryPolygon(tid: string): [number, number][] {
  const pos = TERRITORY_POSITIONS[tid];
  if (!pos) return [];
  const continent = TERRITORY_TO_CONTINENT[tid];
  const seed = hashString(tid);
  const base = {
    north_america: { rx: 22, ry: 14 },
    south_america: { rx: 18, ry: 20 },
    europe: { rx: 16, ry: 11 },
    africa: { rx: 18, ry: 18 },
    asia: { rx: 18, ry: 13 },
    australia: { rx: 17, ry: 11 },
  }[continent] || { rx: 18, ry: 14 };

  const rotation = ((seed % 360) - 180) * Math.PI / 180;
  const wobble = [0.92, 1.08, 0.96, 1.12, 0.98, 1.04, 0.9, 1.06];
  const points: [number, number][] = [];

  for (let i = 0; i < 8; i++) {
    const angle = rotation + (Math.PI * 2 * i) / 8;
    const rx = base.rx * wobble[(seed + i) % wobble.length];
    const ry = base.ry * wobble[(seed + i * 3) % wobble.length];
    const x = pos.x + Math.cos(angle) * rx + Math.sin(angle * 1.3) * 2.4;
    const y = pos.y + Math.sin(angle) * ry + Math.cos(angle * 1.1) * 1.8;
    points.push([x, y]);
  }

  return points;
}

function ContinentBlob({ name, fill }: { name: string; fill: string }) {
  const shape = CONTINENT_SHAPES[name];
  if (!shape) return null;
  return <path d={pointsToPath(shape)} fill={fill} stroke={fill} strokeOpacity={0.35} strokeWidth={1.5} opacity={0.24} />;
}

function WorldMapSvg({
  territories,
  players,
  selectedFrom,
  selectedTo,
  onTerritoryClick,
}: {
  territories: TerritoryState[];
  players: Player[];
  selectedFrom: string | null;
  selectedTo: string | null;
  onTerritoryClick: (territoryId: string) => void;
}) {
  const territoryMap: Record<string, TerritoryState> = {};
  territories.forEach((t) => {
    territoryMap[t.id] = t;
  });
  const playerColorMap: Record<string, string> = {};
  players.forEach((p) => {
    playerColorMap[p.id] = p.color;
  });
  const fromOwner = selectedFrom ? territoryMap[selectedFrom]?.owner : null;

  return (
    <svg viewBox="0 0 880 500" preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <linearGradient id="oceanGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0a1e35" />
          <stop offset="50%" stopColor="#0d2848" />
          <stop offset="100%" stopColor="#091828" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width="880" height="500" fill="url(#oceanGrad)" />

      <g opacity="0.14">
        {Array.from({ length: 15 }, (_, i) => i * 60).map((x) => (
          <line key={`v-${x}`} x1={x} y1={0} x2={x} y2={500} stroke="#9fd0ff" strokeOpacity="0.08" />
        ))}
        {Array.from({ length: 9 }, (_, i) => i * 60).map((y) => (
          <line key={`h-${y}`} x1={0} y1={y} x2={880} y2={y} stroke="#9fd0ff" strokeOpacity="0.08" />
        ))}
      </g>

      <g pointerEvents="none">
        <ContinentBlob name="north_america" fill="#3498db" />
        <ContinentBlob name="south_america" fill="#2ecc71" />
        <ContinentBlob name="europe_main" fill="#9b59b6" />
        <ContinentBlob name="iceland" fill="#9b59b6" />
        <ContinentBlob name="africa" fill="#e67e22" />
        <ContinentBlob name="madagascar" fill="#e67e22" />
        <ContinentBlob name="asia" fill="#e74c3c" />
        <ContinentBlob name="japan" fill="#e74c3c" />
        <ContinentBlob name="australia_main" fill="#1abc9c" />
        <ContinentBlob name="new_guinea" fill="#1abc9c" />
      </g>

      <g opacity="0.55" pointerEvents="none">
        {Object.entries(NEIGHBORS).flatMap(([tid, neighbors]) => {
          const posA = TERRITORY_POSITIONS[tid];
          if (!posA) return [];
          return neighbors
            .filter((nid) => tid < nid)
            .map((nid) => {
              const posB = TERRITORY_POSITIONS[nid];
              if (!posB) return null;
              const sameContinent = TERRITORY_TO_CONTINENT[tid] === TERRITORY_TO_CONTINENT[nid];
              return (
                <line
                  key={`${tid}-${nid}`}
                  x1={posA.x}
                  y1={posA.y}
                  x2={posB.x}
                  y2={posB.y}
                  stroke={sameContinent ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.08)"}
                  strokeDasharray="4 5"
                  strokeWidth="1"
                />
              );
            })
            .filter(Boolean);
        })}
      </g>

      <g>
        {Object.entries(TERRITORY_POSITIONS).map(([tid, pos]) => {
          const ts = territoryMap[tid];
          const continent = TERRITORY_TO_CONTINENT[tid];
          const baseColor = CONTINENT_COLORS[continent] || "#556677";
          const ownerColor = ts ? (playerColorMap[ts.owner] || baseColor) : baseColor;
          const isSelectedFrom = tid === selectedFrom;
          const isSelectedTo = tid === selectedTo;
          const isNeighborOfFrom = selectedFrom ? (NEIGHBORS[selectedFrom] || []).includes(tid) : false;
          const isAttackableNeighbor = isNeighborOfFrom && ts && ts.owner !== fromOwner;
          const points = makeTerritoryPolygon(tid);
          const path = pointsToPath(points);
          const labelY = pos.y + 25;

          return (
            <g key={tid} style={{ cursor: "pointer" }} onClick={() => onTerritoryClick(tid)}>
              <path
                d={path}
                fill={isSelectedFrom ? "#fff6bf" : ownerColor}
                fillOpacity={isSelectedTo ? 0.98 : ts ? 0.90 : 0.78}
                stroke={isSelectedFrom ? "#FFD700" : isSelectedTo ? "#ff4444" : isAttackableNeighbor ? "rgba(255,200,0,0.7)" : "rgba(0,0,0,0.45)"}
                strokeWidth={isSelectedFrom || isSelectedTo ? 2.4 : isAttackableNeighbor ? 1.6 : 1}
                filter={isSelectedFrom || isSelectedTo ? "url(#glow)" : undefined}
              />
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isSelectedFrom || isSelectedTo ? 19 : 15}
                fill={isSelectedFrom ? "#fff6bf" : ownerColor}
                fillOpacity={0.95}
                stroke={isSelectedFrom ? "#FFD700" : isSelectedTo ? "#ff4444" : "rgba(255,255,255,0.55)"}
                strokeWidth={isSelectedFrom || isSelectedTo ? 2 : 1.2}
                filter={isSelectedFrom || isSelectedTo ? "url(#glow)" : undefined}
              />
              <text
                x={pos.x}
                y={pos.y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="10"
                fontWeight="700"
                fill={isSelectedFrom ? "#000" : "#fff"}
              >
                {ts ? ts.armies : "?"}
              </text>
              <text
                x={pos.x}
                y={labelY}
                textAnchor="middle"
                fontSize="8"
                fontWeight="700"
                fill="rgba(255,255,255,0.9)"
                style={{ letterSpacing: "0.2px" }}
              >
                {pos.label}
              </text>
            </g>
          );
        })}
      </g>

      <g pointerEvents="none" opacity="0.85">
        {selectedFrom && (NEIGHBORS[selectedFrom] || []).map((nid) => {
          const pos = TERRITORY_POSITIONS[nid];
          if (!pos) return null;
          return (
            <circle key={`ring-${nid}`} cx={pos.x} cy={pos.y} r={20} fill="none" stroke="rgba(255,200,0,0.75)" strokeWidth="2" strokeDasharray="5 4" />
          );
        })}
      </g>
    </svg>
  );
}

function drawTitleCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, "#1a0000"); grad.addColorStop(0.5, "#8B0000"); grad.addColorStop(1, "#1a0000");
  ctx.fillStyle = grad;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(0, 0, canvas.width, canvas.height, 16);
  else ctx.rect(0, 0, canvas.width, canvas.height);
  ctx.fill();
  ctx.strokeStyle = "#FFD700"; ctx.lineWidth = 3; ctx.stroke();

  ctx.fillStyle = "#FFD700"; ctx.font = "bold 72px Georgia, serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.shadowColor = "#ff6600"; ctx.shadowBlur = 30;
  ctx.fillText("RISK", canvas.width / 2, canvas.height / 2 - 15);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,215,0,0.7)"; ctx.font = "18px Georgia, serif";
  ctx.fillText("DOMINACION MUNDIAL", canvas.width / 2, canvas.height / 2 + 40);

  const colors = ["#e74c3c","#3498db","#2ecc71","#f39c12","#9b59b6","#1abc9c"];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const cx = canvas.width / 2 + Math.cos(a) * 145;
    const cy = canvas.height / 2 + Math.sin(a) * 55;
    const dSize = 22;
    drawDie(ctx, Math.floor(Math.random() * 6) + 1, cx - dSize/2, cy - dSize/2, dSize, colors[i]);
  }
}

export default function RiskGame() {
  const [screen, setScreen] = useState<Screen>("home");
  const [hostName, setHostName] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [lobbyCode, setLobbyCode] = useState("");
  const [myPlayerId, setMyPlayerId] = useState("");
  const [lobby, setLobby] = useState<LobbyInfo | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedFrom, setSelectedFrom] = useState<string | null>(null);
  const [selectedTo, setSelectedTo] = useState<string | null>(null);
  const [reinforceAmt, setReinforceAmt] = useState(1);
  const [fortifyAmt, setFortifyAmt] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const titleCanvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (titleCanvasRef.current && screen === "home") drawTitleCanvas(titleCanvasRef.current);
  }, [screen]);

  const connectWS = useCallback((code: string) => {
    if (wsRef.current) wsRef.current.close();
    const ws = new WebSocket(`${WS_BASE}?code=${code}`);
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "lobby_update") setLobby(data.lobby);
        if (data.type === "game_start" || data.type === "game_update" || data.type === "game_over") {
          setGameState(data.game); setScreen("game"); setSelectedFrom(null); setSelectedTo(null);
        }
      } catch { /* ignore */ }
    };
    ws.onerror = () => {};
    wsRef.current = ws;
  }, []);

  useEffect(() => () => { wsRef.current?.close(); }, []);

  useEffect(() => {
    if (!canvasRef.current || !gameState) return;
    drawMap(canvasRef.current, gameState.territories, gameState.players, selectedFrom, selectedTo);
  }, [gameState, selectedFrom, selectedTo]);

  const createLobby = async () => {
    if (!hostName.trim()) { setError("Ingresa tu nombre"); return; }
    setLoading(true); setError("");
    try {
      const r = await fetch(`${API_BASE}/lobby`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hostName: hostName.trim(), maxPlayers: 6 }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setLobbyCode(data.code); setMyPlayerId(data.hostPlayerId || data.players[0].id);
      setLobby(data); connectWS(data.code); setScreen("lobby");
    } catch (e: unknown) { setError((e as Error).message || "Error al crear lobby"); }
    finally { setLoading(false); }
  };

  const joinLobby = async () => {
    if (!joinName.trim()) { setError("Ingresa tu nombre"); return; }
    if (!joinCode.trim()) { setError("Ingresa el codigo del lobby"); return; }
    setLoading(true); setError("");
    try {
      const r = await fetch(`${API_BASE}/lobby/${joinCode.toUpperCase()}/join`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playerName: joinName.trim() }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setLobbyCode(data.code); setMyPlayerId(data.joinedPlayerId || "");
      setLobby(data); connectWS(data.code); setScreen("lobby");
    } catch (e: unknown) { setError((e as Error).message || "Error al unirse"); }
    finally { setLoading(false); }
  };

  const startGame = async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch(`${API_BASE}/lobby/${lobbyCode}/start`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playerId: myPlayerId }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setGameState(data); setScreen("game");
    } catch (e: unknown) { setError((e as Error).message || "Error al iniciar"); }
    finally { setLoading(false); }
  };

  const doAction = async (type: string, extra: Record<string, unknown> = {}) => {
    if (!gameState) return;
    setError("");
    try {
      const r = await fetch(`${API_BASE}/game/${lobbyCode}/action`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playerId: myPlayerId, type, ...extra }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setGameState(data); setSelectedFrom(null); setSelectedTo(null);
    } catch (e: unknown) { setError((e as Error).message || "Error en accion"); }
  };

  const handleTerritoryClick = (clicked: string) => {
    if (!gameState) return;

    const territoryMap: Record<string, TerritoryState> = {};
    gameState.territories.forEach((t) => {
      territoryMap[t.id] = t;
    });

    const isMyTurn = gameState.currentPlayer === myPlayerId;
    if (!isMyTurn) return;
    const clickedTerritory = territoryMap[clicked];
    if (!clickedTerritory) return;

    if (gameState.phase === "reinforce") {
      if (clickedTerritory.owner === myPlayerId) {
        setSelectedTo(clicked);
        setSelectedFrom(null);
      }
    } else if (gameState.phase === "attack") {
      if (!selectedFrom) {
        if (clickedTerritory.owner === myPlayerId && clickedTerritory.armies >= 2) {
          setSelectedFrom(clicked);
          setSelectedTo(null);
        }
      } else {
        if (clicked === selectedFrom) {
          setSelectedFrom(null);
          return;
        }
        if (clickedTerritory.owner !== myPlayerId && (NEIGHBORS[selectedFrom] || []).includes(clicked)) {
          setSelectedTo(clicked);
        } else if (clickedTerritory.owner === myPlayerId && clickedTerritory.armies >= 2) {
          setSelectedFrom(clicked);
          setSelectedTo(null);
        }
      }
    } else if (gameState.phase === "fortify") {
      if (!selectedFrom) {
        if (clickedTerritory.owner === myPlayerId && clickedTerritory.armies >= 2) {
          setSelectedFrom(clicked);
          setSelectedTo(null);
        }
      } else {
        if (clicked === selectedFrom) {
          setSelectedFrom(null);
          return;
        }
        if (clickedTerritory.owner === myPlayerId && (NEIGHBORS[selectedFrom] || []).includes(clicked)) {
          setSelectedTo(clicked);
        } else if (clickedTerritory.owner === myPlayerId && clickedTerritory.armies >= 2) {
          setSelectedFrom(clicked);
          setSelectedTo(null);
        }
      }
    }
  };

  const handleCanvasClick = (_e: React.MouseEvent<HTMLCanvasElement>) => {
    // Kept for compatibility with the old canvas version.
  };

  const isMyTurn = gameState?.currentPlayer === myPlayerId;
  const myPlayer = gameState?.players.find(p => p.id === myPlayerId) || lobby?.players.find(p => p.id === myPlayerId);
  const currentPlayerObj = gameState?.players.find(p => p.id === gameState?.currentPlayer);
  const territoryMapForRender: Record<string, TerritoryState> = {};
  gameState?.territories.forEach(t => { territoryMapForRender[t.id] = t; });
  const fromTerritoryForRender = selectedFrom ? territoryMapForRender[selectedFrom] : null;

  if (screen === "home") return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #050d1a 0%, #0d2137 50%, #051020 100%)" }}>
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <canvas ref={titleCanvasRef} width={430} height={172} style={{ display: "block", margin: "0 auto 20px", borderRadius: "16px", maxWidth: "90vw" }} />
        <p style={{ color: "#aabbcc", fontSize: "15px", marginBottom: "36px", letterSpacing: "3px" }}>CONQUISTA EL MUNDO</p>
        <div style={{ display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => { setScreen("create"); setError(""); }} style={btnStyle("#8B0000","#cc2200")}>Crear Lobby</button>
          <button onClick={() => { setScreen("join"); setError(""); }} style={btnStyle("#003366","#1a5c9e")}>Unirse a Lobby</button>
        </div>
        <div style={{ marginTop: "36px", display: "flex", gap: "18px", justifyContent: "center", flexWrap: "wrap" }}>
          {Object.entries(PLAYER_COLORS_MAP).map(([color, name]) => (
            <div key={color} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}` }} />
              <span style={{ color: "#556677", fontSize: "10px" }}>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (screen === "create") return (
    <FormScreen title="Crear Lobby" onBack={() => setScreen("home")}>
      <input placeholder="Tu nombre de jugador" value={hostName} onChange={e => setHostName(e.target.value)} onKeyDown={e => e.key === "Enter" && createLobby()} style={inputStyle} maxLength={20} autoFocus />
      {error && <p style={{ color: "#ff6666", textAlign: "center", fontSize: "13px" }}>{error}</p>}
      <button onClick={createLobby} disabled={loading} style={btnStyle("#8B0000","#cc2200")}>{loading ? "Creando..." : "Crear Lobby"}</button>
    </FormScreen>
  );

  if (screen === "join") return (
    <FormScreen title="Unirse a Lobby" onBack={() => setScreen("home")}>
      <input placeholder="Tu nombre de jugador" value={joinName} onChange={e => setJoinName(e.target.value)} style={inputStyle} maxLength={20} autoFocus />
      <input placeholder="Codigo del lobby (ej: ABC123)" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === "Enter" && joinLobby()} style={inputStyle} maxLength={6} />
      {error && <p style={{ color: "#ff6666", textAlign: "center", fontSize: "13px" }}>{error}</p>}
      <button onClick={joinLobby} disabled={loading} style={btnStyle("#003366","#1a5c9e")}>{loading ? "Uniendose..." : "Unirse al Lobby"}</button>
    </FormScreen>
  );

  if (screen === "lobby") {
    const isHost = lobby?.players.find(p => p.id === myPlayerId)?.isHost;
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", background: "linear-gradient(135deg, #050d1a 0%, #0d2137 100%)" }}>
        <div style={{ background: "rgba(0,0,0,0.7)", border: "2px solid #FFD700", borderRadius: "16px", padding: "32px", maxWidth: "500px", width: "100%" }}>
          <h2 style={{ color: "#FFD700", fontSize: "28px", fontFamily: "Georgia, serif", textAlign: "center", marginBottom: "6px" }}>Sala de Espera</h2>
          <div style={{ background: "rgba(255,215,0,0.07)", border: "1px solid rgba(255,215,0,0.35)", borderRadius: "10px", padding: "14px", textAlign: "center", marginBottom: "22px" }}>
            <p style={{ color: "#aabbcc", fontSize: "12px", marginBottom: "5px" }}>CODIGO DE LOBBY</p>
            <p style={{ color: "#FFD700", fontSize: "36px", fontFamily: "monospace", fontWeight: "bold", letterSpacing: "10px" }}>{lobbyCode}</p>
          </div>
          <div style={{ marginBottom: "22px" }}>
            <p style={{ color: "#aabbcc", fontSize: "13px", marginBottom: "10px" }}>Jugadores ({lobby?.players.length}/{lobby?.maxPlayers}):</p>
            {lobby?.players.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "rgba(255,255,255,0.04)", borderRadius: "8px", marginBottom: "6px", border: `1px solid ${p.color}44` }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: p.color, flexShrink: 0, boxShadow: `0 0 6px ${p.color}` }} />
                <span style={{ color: p.id === myPlayerId ? "#fff" : "#ccc", fontWeight: p.id === myPlayerId ? "bold" : "normal", fontSize: "14px" }}>
                  {p.name}{p.id === myPlayerId && <span style={{ color: "#aabbcc", fontWeight: "normal", fontSize: "12px" }}> (Tu)</span>}{p.isHost && <span style={{ color: "#FFD700", fontSize: "12px" }}> Anfitrion</span>}
                </span>
                <span style={{ marginLeft: "auto", color: p.color, fontSize: "11px" }}>{PLAYER_COLORS_MAP[p.color] || ""}</span>
              </div>
            ))}
          </div>
          {error && <p style={{ color: "#ff6666", textAlign: "center", marginBottom: "12px", fontSize: "13px" }}>{error}</p>}
          {isHost
            ? <button onClick={startGame} disabled={loading || (lobby?.players.length || 0) < 2} style={{ ...btnStyle("#8B0000","#cc2200"), opacity: (lobby?.players.length || 0) < 2 ? 0.5 : 1 }}>
                {loading ? "Iniciando..." : (lobby?.players.length || 0) < 2 ? "Necesitas al menos 2 jugadores" : "Iniciar Juego"}
              </button>
            : <p style={{ color: "#aabbcc", textAlign: "center", fontSize: "13px" }}>Esperando que el anfitrion inicie...</p>}
        </div>
      </div>
    );
  }

  if (screen === "game" && gameState) return (
    <div style={{ background: "#050d1a", minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "Arial, sans-serif" }}>
      <div style={{ background: "rgba(0,0,0,0.92)", borderBottom: "2px solid #FFD70055", padding: "7px 14px", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", flexShrink: 0 }}>
        <span style={{ color: "#FFD700", fontFamily: "Georgia, serif", fontSize: "20px", fontWeight: "bold", textShadow: "0 0 10px #FFD70066" }}>RISK</span>
        <div style={{ display: "flex", gap: "5px", alignItems: "center", flexWrap: "wrap", flex: 1 }}>
          {gameState.players.map(p => {
            const tCount = gameState.territories.filter(t => t.owner === p.id).length;
            const isCurrent = gameState.currentPlayer === p.id;
            return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "2px 7px", borderRadius: "12px", border: `2px solid ${isCurrent ? p.color : "transparent"}`, background: isCurrent ? `${p.color}22` : "transparent" }}>
                <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: p.color }} />
                <span style={{ color: p.id === myPlayerId ? p.color : "#bbb", fontSize: "11px", fontWeight: p.id === myPlayerId ? "bold" : "normal" }}>
                  {p.name} ({tCount}){isCurrent && <span style={{ color: p.color }}> ▶</span>}
                </span>
              </div>
            );
          })}
        </div>
        {myPlayer && <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <div style={{ width: "11px", height: "11px", borderRadius: "50%", background: myPlayer.color }} />
          <span style={{ color: myPlayer.color, fontSize: "12px", fontWeight: "bold" }}>{myPlayer.name}</span>
        </div>}
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        <div style={{ flex: 1, overflow: "hidden", background: "#050d1a" }}>
          <div style={{ width: "100%", height: "100%", cursor: isMyTurn && gameState.phase !== "ended" ? "crosshair" : "default" }}>
            <WorldMapSvg
              territories={gameState.territories}
              players={gameState.players}
              selectedFrom={selectedFrom}
              selectedTo={selectedTo}
              onTerritoryClick={handleTerritoryClick}
            />
          </div>
        </div>

        <div style={{ width: "268px", minWidth: "268px", background: "rgba(2,8,18,0.97)", borderLeft: "1px solid #FFD70033", display: "flex", flexDirection: "column", padding: "12px", gap: "9px", overflowY: "auto" }}>
          <div style={{ background: `${currentPlayerObj?.color || "#FFD700"}18`, border: `1px solid ${currentPlayerObj?.color || "#FFD700"}44`, borderRadius: "8px", padding: "9px" }}>
            <p style={{ color: "#FFD700", fontSize: "10px", fontWeight: "bold", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "1px" }}>Fase: {phaseLabel(gameState.phase)}</p>
            <p style={{ color: currentPlayerObj?.color || "#fff", fontSize: "13px", fontWeight: "bold" }}>{currentPlayerObj?.name || "?"}</p>
            <p style={{ color: "#88aacc", fontSize: "10px", marginTop: "3px" }}>{gameState.message}</p>
          </div>

          {gameState.winner && (
            <div style={{ background: "rgba(255,215,0,0.12)", border: "2px solid #FFD700", borderRadius: "10px", padding: "14px", textAlign: "center" }}>
              <p style={{ color: "#FFD700", fontSize: "20px", fontWeight: "bold", fontFamily: "Georgia, serif" }}>VICTORIA!</p>
              <p style={{ color: "#fff", fontSize: "14px", marginTop: "4px" }}>{gameState.players.find(p => p.id === gameState.winner)?.name}</p>
              <button onClick={() => { setScreen("home"); setGameState(null); setLobby(null); }} style={{ ...btnStyle("#8B0000","#cc2200"), marginTop: "10px", padding: "6px 12px", fontSize: "12px" }}>
                Volver al inicio
              </button>
            </div>
          )}

          {isMyTurn && !gameState.winner && (
            <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              {gameState.phase === "reinforce" && <>
                <p style={{ color: "#aabbcc", fontSize: "12px" }}>Refuerzos: <strong style={{ color: "#FFD700", fontSize: "14px" }}>{gameState.reinforcementsLeft}</strong></p>
                {selectedTo ? <>
                  <p style={{ color: "#ccc", fontSize: "11px" }}>Territorio: <strong style={{ color: "#FFD700" }}>{TERRITORY_POSITIONS[selectedTo]?.label}</strong></p>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <button onClick={() => setReinforceAmt(Math.max(1, reinforceAmt - 1))} style={smallBtn}>-</button>
                    <span style={{ color: "#FFD700", fontWeight: "bold", minWidth: "26px", textAlign: "center" }}>{Math.min(reinforceAmt, gameState.reinforcementsLeft)}</span>
                    <button onClick={() => setReinforceAmt(Math.min(gameState.reinforcementsLeft, reinforceAmt + 1))} style={smallBtn}>+</button>
                    <button onClick={() => doAction("reinforce", { toTerritory: selectedTo, armies: Math.min(reinforceAmt, gameState.reinforcementsLeft) })} style={{ ...btnStyle("#226600","#33aa00"), padding: "3px 10px", fontSize: "11px", flex: 1 }}>Reforzar</button>
                  </div>
                  <button onClick={() => doAction("reinforce", { toTerritory: selectedTo, armies: gameState.reinforcementsLeft })} style={{ ...btnStyle("#554400","#886600"), fontSize: "11px" }}>
                    Colocar todos ({gameState.reinforcementsLeft})
                  </button>
                </> : <p style={{ color: "#556677", fontSize: "11px" }}>Haz clic en uno de tus territorios para reforzar</p>}
              </>}

              {gameState.phase === "attack" && <>
                {!selectedFrom && <p style={{ color: "#556677", fontSize: "11px" }}>Haz clic en un territorio tuyo (2+ ejercitos) para atacar</p>}
                {selectedFrom && !selectedTo && <p style={{ color: "#aabbcc", fontSize: "11px" }}>Desde: <strong style={{ color: "#FFD700" }}>{TERRITORY_POSITIONS[selectedFrom]?.label}</strong><br/>Haz clic en un enemigo adyacente (marcado)</p>}
                {selectedFrom && selectedTo && <>
                  <p style={{ color: "#ccc", fontSize: "11px" }}>
                    <strong style={{ color: "#FFD700" }}>{TERRITORY_POSITIONS[selectedFrom]?.label}</strong>
                    <span style={{ color: "#666" }}> vs </span>
                    <strong style={{ color: "#ff4444" }}>{TERRITORY_POSITIONS[selectedTo]?.label}</strong>
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    <button onClick={() => doAction("attack", { fromTerritory: selectedFrom, toTerritory: selectedTo })} style={btnStyle("#8B0000","#cc2200")}>
                      ATACAR (1 ronda)
                    </button>
                    <button onClick={() => doAction("blitz", { fromTerritory: selectedFrom, toTerritory: selectedTo })}
                      style={{ ...btnStyle("#6B0000","#990000"), background: "linear-gradient(180deg, #ff3300 0%, #8B0000 100%)", boxShadow: "0 4px 15px #ff330055" }}>
                      BLITZ — ATACAR TODO
                    </button>
                    <p style={{ color: "#556677", fontSize: "9px", textAlign: "center" }}>Blitz: ataca con todas las tropas hasta ganar o quedarte sin ejercitos</p>
                  </div>
                </>}
                <button onClick={() => { doAction("end_attack"); setSelectedFrom(null); setSelectedTo(null); }} style={{ ...btnStyle("#443300","#665500"), fontSize: "11px" }}>
                  Terminar ataques
                </button>
              </>}

              {gameState.phase === "fortify" && <>
                {!selectedFrom && <p style={{ color: "#556677", fontSize: "11px" }}>Puedes mover ejercitos entre territorios adyacentes (opcional)</p>}
                {selectedFrom && !selectedTo && <p style={{ color: "#aabbcc", fontSize: "11px" }}>Desde: <strong style={{ color: "#FFD700" }}>{TERRITORY_POSITIONS[selectedFrom]?.label}</strong><br/>Selecciona territorio adyacente tuyo</p>}
                {selectedFrom && selectedTo && (() => {
                  const max = (fromTerritoryForRender?.armies || 1) - 1;
                  return <>
                    <p style={{ color: "#ccc", fontSize: "11px" }}>
                      <strong style={{ color: "#FFD700" }}>{TERRITORY_POSITIONS[selectedFrom]?.label}</strong>
                      <span style={{ color: "#666" }}> → </span>
                      <strong style={{ color: "#2ecc71" }}>{TERRITORY_POSITIONS[selectedTo]?.label}</strong>
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button onClick={() => setFortifyAmt(Math.max(1, fortifyAmt - 1))} style={smallBtn}>-</button>
                      <span style={{ color: "#FFD700", fontWeight: "bold", minWidth: "26px", textAlign: "center" }}>{Math.min(fortifyAmt, max)}</span>
                      <button onClick={() => setFortifyAmt(Math.min(max, fortifyAmt + 1))} style={smallBtn}>+</button>
                    </div>
                    <button onClick={() => doAction("fortify", { fromTerritory: selectedFrom, toTerritory: selectedTo, armies: Math.min(fortifyAmt, max) })} style={btnStyle("#226600","#33aa00")}>Fortalecer</button>
                  </>;
                })()}
                <button onClick={() => doAction("end_turn")} style={btnStyle("#003366","#1a5c9e")}>Terminar turno</button>
              </>}
            </div>
          )}

          {!isMyTurn && !gameState.winner && (
            <div style={{ textAlign: "center", color: "#556677", fontSize: "12px", padding: "8px" }}>
              Turno de <strong style={{ color: currentPlayerObj?.color }}>{currentPlayerObj?.name}</strong>...<br/>
              <span style={{ fontSize: "10px" }}>Fase: {phaseLabel(gameState.phase)}</span>
            </div>
          )}

          {gameState.attackResult && (
            <AttackResultPanel result={gameState.attackResult} players={gameState.players} fromId={selectedFrom} toId={selectedTo} />
          )}

          {error && <p style={{ color: "#ff6666", fontSize: "11px" }}>{error}</p>}

          <div style={{ marginTop: "auto", borderTop: "1px solid #112233", paddingTop: "9px" }}>
            <p style={{ color: "#334455", fontSize: "9px", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "1px" }}>Territorios / Ejercitos</p>
            {gameState.players.map(p => {
              const tCount = gameState.territories.filter(t => t.owner === p.id).length;
              const armyCount = gameState.territories.filter(t => t.owner === p.id).reduce((s, t) => s + t.armies, 0);
              return (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "3px" }}>
                  <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                  <span style={{ color: p.id === myPlayerId ? p.color : "#778899", fontSize: "10px", flex: 1 }}>{p.name}</span>
                  <span style={{ color: "#445566", fontSize: "9px" }}>{tCount}t / {armyCount}a</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return null;
}

function AttackResultPanel({ result, players: _players, fromId: _from, toId: _to }: {
  result: AttackResult; players: Player[]; fromId: string | null; toId: string | null;
}) {
  const dSize = 32;
  return (
    <div style={{ background: "rgba(100,0,0,0.2)", border: "1px solid #cc2200", borderRadius: "8px", padding: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
        <span style={{ color: "#ff6666", fontSize: "11px", fontWeight: "bold" }}>
          {result.isBlitz ? "RESULTADO BLITZ" : "RESULTADO ATAQUE"}
        </span>
        {result.isBlitz && result.rounds != null && (
          <span style={{ color: "#ff9966", fontSize: "10px" }}>({result.rounds} rondas)</span>
        )}
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "8px" }}>
        <div>
          <p style={{ color: "#ff8888", fontSize: "9px", marginBottom: "4px", textTransform: "uppercase" }}>
            Atacante{result.isBlitz ? ` (última)` : ""}:
          </p>
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {result.attackerDice.map((d, i) => <CanvasDie key={i} value={d} color="#cc2200" size={dSize} />)}
          </div>
        </div>
        <div>
          <p style={{ color: "#8888ff", fontSize: "9px", marginBottom: "4px", textTransform: "uppercase" }}>
            Defensor{result.isBlitz ? ` (última)` : ""}:
          </p>
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {result.defenderDice.map((d, i) => <CanvasDie key={i} value={d} color="#1a5c9e" size={dSize} />)}
          </div>
        </div>
      </div>

      {result.isBlitz ? (
        <div style={{ display: "flex", gap: "8px" }}>
          <div style={{ flex: 1, background: "rgba(200,0,0,0.2)", borderRadius: "5px", padding: "5px", textAlign: "center" }}>
            <p style={{ color: "#ff8888", fontSize: "9px" }}>Bajas atacante</p>
            <p style={{ color: "#ff4444", fontSize: "18px", fontWeight: "bold" }}>{result.totalAttackerLosses}</p>
          </div>
          <div style={{ flex: 1, background: "rgba(0,0,200,0.2)", borderRadius: "5px", padding: "5px", textAlign: "center" }}>
            <p style={{ color: "#8888ff", fontSize: "9px" }}>Bajas defensor</p>
            <p style={{ color: "#4488ff", fontSize: "18px", fontWeight: "bold" }}>{result.totalDefenderLosses}</p>
          </div>
        </div>
      ) : (
        <p style={{ color: "#ffaaaa", fontSize: "10px" }}>
          Atacante -{result.attackerLosses} | Defensor -{result.defenderLosses}
        </p>
      )}

      {result.territoryConquered && (
        <div style={{ marginTop: "6px", background: "rgba(255,215,0,0.15)", borderRadius: "5px", padding: "5px", textAlign: "center" }}>
          <p style={{ color: "#FFD700", fontSize: "12px", fontWeight: "bold" }}>TERRITORIO CONQUISTADO!</p>
        </div>
      )}
      {!result.territoryConquered && (
        <div style={{ marginTop: "6px", background: "rgba(100,100,100,0.15)", borderRadius: "5px", padding: "5px", textAlign: "center" }}>
          <p style={{ color: "#aaaaaa", fontSize: "10px" }}>El defensor resistio el ataque</p>
        </div>
      )}
    </div>
  );
}

function CanvasDie({ value, color, size }: { value: number; color: string; size: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    drawDie(ctx, value, 0, 0, size, color);
  }, [value, color, size]);
  return <canvas ref={canvasRef} width={size} height={size} style={{ borderRadius: "6px" }} />;
}

function FormScreen({ title, children, onBack }: { title: string; children: React.ReactNode; onBack: () => void }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", background: "linear-gradient(135deg, #050d1a 0%, #0d2137 100%)" }}>
      <div style={{ background: "rgba(0,0,0,0.8)", border: "2px solid rgba(255,215,0,0.4)", borderRadius: "16px", padding: "32px", maxWidth: "400px", width: "100%", display: "flex", flexDirection: "column", gap: "14px" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#556677", cursor: "pointer", textAlign: "left", fontSize: "13px", padding: 0 }}>← Volver</button>
        <h2 style={{ color: "#FFD700", fontSize: "26px", fontFamily: "Georgia, serif", textAlign: "center" }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function phaseLabel(phase: string) {
  return ({ reinforce: "Refuerzo", attack: "Ataque", fortify: "Fortalecer", ended: "FIN" } as Record<string,string>)[phase] || phase;
}

const btnStyle = (bg: string, hover: string): React.CSSProperties => ({
  background: `linear-gradient(180deg, ${hover} 0%, ${bg} 100%)`,
  color: "#fff", border: `1px solid ${hover}66`, borderRadius: "8px",
  padding: "11px 20px", cursor: "pointer", fontWeight: "bold", fontSize: "15px", width: "100%",
  textShadow: "0 1px 3px rgba(0,0,0,0.6)", boxShadow: `0 4px 12px ${bg}88`,
});
const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,215,0,0.3)", borderRadius: "8px",
  padding: "10px 14px", color: "#fff", fontSize: "15px", width: "100%", outline: "none", boxSizing: "border-box",
};
const smallBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "4px",
  color: "#fff", width: "26px", height: "26px", cursor: "pointer", fontSize: "16px",
  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
};
