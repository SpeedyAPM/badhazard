const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const app = express();
const PORT = process.env.PORT || 8080;
app.use(cors());
app.use(bodyParser.json());
app.use('/screenshots', express.static(path.join(__dirname, 'screenshots')));

app.post('/api/log-visit', async (req, res) => {
  const data = req.body || {};
  try {
    fs.appendFileSync(path.join(__dirname, 'visits.log'), JSON.stringify(data) + "\n");
  } catch (e) { console.error('write visits.log failed', e); }

  if (data && data.suspicious === true) {
    try {
      const candidates = ["/usr/bin/chromium","/usr/bin/chromium-browser","/snap/bin/chromium","/usr/bin/google-chrome","/usr/bin/google-chrome-stable"]; 
      let executablePath = null; for (const p of candidates) { try { if (fs.existsSync(p)) { executablePath = p; break; } } catch(_){} }
      const launchOpts = { headless: "new", args: ["--no-sandbox","--disable-setuid-sandbox"] };
      if (executablePath) launchOpts.executablePath = executablePath; else launchOpts.browser = 'chrome';
      const browser = await puppeteer.launch(launchOpts);
      const page = await browser.newPage();
      try {
        await page.setRequestInterception(true);
        page.on('request', (rq) => {
          const url = rq.url();
          if (url.includes('/api/log-visit')) {
            try { rq.abort(); } catch(_) {}
          } else {
            try { rq.continue(); } catch(_) {}
          }
        });
      } catch(_) {}
      const target = data.referer && data.referer !== 'brak' ? data.referer : (data.location || '');
      let targetNoLog = target;
      try {
        const u = new URL(target);
        u.searchParams.set('bh_nolog','1');
        targetNoLog = u.toString();
      } catch(_) {
        const joiner = target.includes('?') ? '&' : '?';
        targetNoLog = `${target}${joiner}bh_nolog=1`;
      }
      if (!target) throw new Error('no target');
      await page.goto(targetNoLog, { timeout: 20000, waitUntil: 'domcontentloaded' });
      const timestamp = Date.parse(data.timestamp || Date.now()) || Date.now();
      const safeRef = target.replace(/[^a-z0-9]+/gi, "_").slice(0,60);
      const filename = `screenshot_${timestamp}_${safeRef}.png`;
      const outDir = path.join(__dirname, 'screenshots');
      fs.mkdirSync(outDir, { recursive: true });
      await page.screenshot({ path: path.join(outDir, filename), fullPage: true });
      await browser.close();
      data.screenshotFilename = `/screenshots/${filename}`;
    } catch (e) { console.error('screenshot failed', e); }
  }
  res.sendStatus(204);
});

app.get('/api/logs', async (req, res) => {
  try {
    const file = path.join(__dirname, 'visits.log');
    if (!fs.existsSync(file)) return res.json({ items: [], total: 0 });
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean);
    const items = lines.map(l=>{ try{ return JSON.parse(l) }catch(_){ return null } }).filter(Boolean);
    res.json({ items, total: items.length });
  } catch(e) { res.status(500).json({ error: 'failed_to_read' }); }
});

app.listen(PORT, () => console.log(`integracja server on http://localhost:${PORT}`));
