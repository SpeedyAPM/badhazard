const fs = require("fs");
const path = require("path");
const readline = require("readline");

function parseLine(line) {
  try {
    const obj = JSON.parse(line);
    return obj && typeof obj === "object" ? obj : null;
  } catch (_) {
    return null;
  }
}

function toUrl(name) {
  if (!name) return null;
  if (/^https?:\/\//i.test(name)) return name;
  return `http://badhazard.mipsdeb.online/screenshots/${name}`;
}

function normalizeEntry(e) {
  const location = typeof e.location === "string" ? e.location : "";
  const referer = typeof e.referer === "string" ? e.referer : "brak";
  const suspicious = !!e.suspicious;
  const legal = !suspicious;
  const timestamp = typeof e.timestamp === "string" ? e.timestamp : null;
  const screenshotFilename = typeof e.screenshotFilename === "string" ? toUrl(e.screenshotFilename) : null;
  const adContent = location || "";
  return { timestamp, adContent, legal, referer, screenshotFilename };
}

async function readLogs(opts = {}) {
  const filePath = path.join(__dirname, "..", "visits.log");
  const { limit = 50, offset = 0, status, source } = opts;
  const exists = fs.existsSync(filePath);
  if (!exists) {
    return { items: [], total: 0, errors: 0 };
  }
  let screenshotsIndex = null;
  let screenshotsByTime = [];
  try {
    const dir = path.join(__dirname, "..", "screenshots");
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith(".png"));
      screenshotsIndex = new Map();
      for (const f of files) {
        const m1 = f.match(/^screenshot_(\d+)_/);
        const m2 = f.match(/^screenshot_(\d+)\.png$/i);
        const ts = m1 ? parseInt(m1[1], 10) : (m2 ? parseInt(m2[1], 10) : 0);
        if (m1) {
          const refPart = f.replace(/^screenshot_\d+_/, "").replace(/\.png$/i, "");
          const arr = screenshotsIndex.get(refPart) || [];
          arr.push({ f, ts });
          screenshotsIndex.set(refPart, arr);
        }
        if (m2) {
          screenshotsByTime.push({ f, ts });
        }
      }
      for (const [k, arr] of screenshotsIndex.entries()) {
        arr.sort((a,b)=>b.ts-a.ts);
        screenshotsIndex.set(k, arr);
      }
      screenshotsByTime.sort((a,b)=>b.ts-a.ts);
    }
  } catch (_) {}
  const stream = fs.createReadStream(filePath, { encoding: "utf-8" });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  let total = 0;
  let errors = 0;
  let collected = [];
  let skipped = 0;
  for await (const line of rl) {
    if (!line || !line.trim()) continue;
    const obj = parseLine(line);
    if (!obj) {
      errors++;
      continue;
    }
    const entry = normalizeEntry(obj);
    if (!entry.screenshotFilename && screenshotsIndex && entry.legal === false) {
      const refPart = (entry.referer || "").replace(/[^a-z0-9]+/gi, "_").slice(0,60);
      const locPart = (entry.adContent || "").replace(/[^a-z0-9]+/gi, "_").slice(0,60);
      let arr = screenshotsIndex.get(refPart) || screenshotsIndex.get(locPart) || null;
      if (arr && arr.length) {
        if (entry.timestamp) {
          const t = Date.parse(entry.timestamp);
          if (!isNaN(t)) {
            let best = arr[0];
            let bestDiff = Math.abs(best.ts - t);
            for (let i = 1; i < arr.length; i++) {
              const d = Math.abs(arr[i].ts - t);
              if (d < bestDiff) { best = arr[i]; bestDiff = d; }
            }
            entry.screenshotFilename = toUrl(best.f);
          } else {
            entry.screenshotFilename = toUrl(arr[0].f);
          }
        } else {
          entry.screenshotFilename = toUrl(arr[0].f);
        }
      } else if (screenshotsByTime && screenshotsByTime.length) {
        if (entry.timestamp) {
          const t = Date.parse(entry.timestamp);
          if (!isNaN(t)) {
            let best = screenshotsByTime[0];
            let bestDiff = Math.abs(best.ts - t);
            for (let i = 1; i < screenshotsByTime.length; i++) {
              const d = Math.abs(screenshotsByTime[i].ts - t);
              if (d < bestDiff) { best = screenshotsByTime[i]; bestDiff = d; }
            }
            entry.screenshotFilename = toUrl(best.f);
          } else {
            entry.screenshotFilename = toUrl(screenshotsByTime[0].f);
          }
        } else {
          entry.screenshotFilename = toUrl(screenshotsByTime[0].f);
        }
      }
    }
    let match = true;
    if (typeof status === "string") {
      if (status === "legal" && entry.legal !== true) match = false;
      if (status === "illegal" && entry.legal !== false) match = false;
    }
    if (typeof source === "string" && source.trim()) {
      const s = source.trim().toLowerCase();
      const ref = (entry.referer || "").toLowerCase();
      if (!ref.includes(s)) match = false;
    }
    if (!match) continue;
    total++;
    if (skipped < offset) {
      skipped++;
      continue;
    }
    if (collected.length < limit) {
      collected.push(entry);
    }
  }
  rl.close();
  return { items: collected, total, errors };
}

async function readStats(opts = {}) {
  const { from, to, status } = opts;
  const filePath = path.join(__dirname, "..", "visits.log");
  const exists = fs.existsSync(filePath);
  if (!exists) {
    return { total: 0, legal: 0, illegal: 0, topSources: [], timeline: [] };
  }
  const stream = fs.createReadStream(filePath, { encoding: "utf-8" });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  let total = 0;
  let legal = 0;
  let illegal = 0;
  const sourceCounts = new Map();
  const timelineCounts = new Map();
  const fromMs = from ? Date.parse(from) : null;
  const toMs = to ? Date.parse(to) : null;
  for await (const line of rl) {
    if (!line || !line.trim()) continue;
    const obj = parseLine(line);
    if (!obj) continue;
    const entry = normalizeEntry(obj);
    if (fromMs && entry.timestamp) {
      const t = Date.parse(entry.timestamp);
      if (!isNaN(t) && t < fromMs) continue;
    }
    if (toMs && entry.timestamp) {
      const t = Date.parse(entry.timestamp);
      if (!isNaN(t) && t > toMs) continue;
    }
    if (typeof status === "string") {
      if (status === "legal" && entry.legal !== true) continue;
      if (status === "illegal" && entry.legal !== false) continue;
    }
    total++;
    if (entry.legal) legal++; else illegal++;
    const src = entry.referer || "brak";
    sourceCounts.set(src, (sourceCounts.get(src) || 0) + 1);
    let bucket = "unknown";
    if (entry.timestamp) {
      const d = new Date(entry.timestamp);
      bucket = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`;
    }
    timelineCounts.set(bucket, (timelineCounts.get(bucket) || 0) + 1);
  }
  rl.close();
  const topSources = Array.from(sourceCounts.entries()).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([name,count])=>({name,count}));
  const timeline = Array.from(timelineCounts.entries()).sort((a,b)=>a[0].localeCompare(b[0])).map(([date,count])=>({date,count}));
  return { total, legal, illegal, topSources, timeline };
}

module.exports = { readLogs, readStats };
