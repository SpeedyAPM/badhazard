const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const mongoose = require("mongoose");
const puppeteer = require("puppeteer");
const readline = require("readline");
const path = require("path");


const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static("public"));
app.use('/screenshots', express.static(path.join(__dirname, 'screenshots')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// === Настройки ===
const SAVE_TO = "file"; // "mongo" или "file"

// === MongoDB (если используете) ===
//const mongoUri = "mongodb://localhost:27017/przw";
//mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

const VisitSchema = new mongoose.Schema({
    timestamp: String,
    location: String,
    referer: String,
    userAgent: String,
    utm: Object,
    suspiciousMatches: [String],
    suspicious: Boolean
});
const Visit = mongoose.model("Visit", VisitSchema);

// === Middleware ===
app.use(cors());
app.use(bodyParser.json());

// === Логика приема данных ===
app.post("/api/log-visit", async(req, res) => {
    const data = req.body;

    console.log("📝 Новое посещение:");
    console.log(JSON.stringify(data, null, 2));

    try {
        const xff = req.headers["x-forwarded-for"]; 
        const first = Array.isArray(xff) ? xff[0] : (xff || "");
        const ip = (first.split(",")[0] || "").trim() || (req.socket && req.socket.remoteAddress) || req.ip || "";
        fs.appendFileSync("visitsip.txt", JSON.stringify({ timestamp: new Date().toISOString(), ip }) + "\n");
        console.log(`🧭 IP zapisany: ${ip}`);
    } catch (err) {
        console.error("❌ Błąd zapisu visitsip.txt:", err);
    }

    if (SAVE_TO === "mongo") {
        try {
            await new Visit(data).save();
            console.log("✅ Сохранено в MongoDB");
        } catch (err) {
            console.error("❌ Ошибка сохранения:", err);
        }
    }

    // === Дополнительно: делаем скриншот только для нелегальных (suspicious === true) ===
    const ref = data.referer || "";

    if (data.suspicious === true) {
        try {
            const findChromiumPath = () => {
                const candidates = [
                    "/usr/bin/chromium",
                    "/usr/bin/chromium-browser",
                    "/snap/bin/chromium",
                    "/usr/bin/google-chrome",
                    "/usr/bin/google-chrome-stable"
                ];
                for (const p of candidates) { try { if (fs.existsSync(p)) return p; } catch(_) {} }
                return null;
            };
            const exe = findChromiumPath();
            const launchOpts = { headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"] };
            if (exe) launchOpts.executablePath = exe; else launchOpts.browser = "chrome";
            const browser = await puppeteer.launch(launchOpts);
            const page = await browser.newPage();
            let targetUrl = ref !== "brak" ? ref : (data.location || "");
            try {
                const u = new URL(targetUrl);
                if (u.hostname === "badhazard.mipsdeb.online") {
                    targetUrl = `http://127.0.0.1:3000${u.pathname}${u.search}`;
                }
            } catch (_) {}
            if (!targetUrl) {
                throw new Error("no target url to screenshot");
            }
            console.log(`🎯 Screenshot target: ${targetUrl}`);
            await page.goto(targetUrl, { timeout: 20000, waitUntil: "domcontentloaded" });

            let timestamp = Date.now();
            if (typeof data.timestamp === "string") {
                const t = Date.parse(data.timestamp);
                if (!isNaN(t)) timestamp = t;
            }
            const safeRef = targetUrl.replace(/[^a-z0-9]+/gi, "_").slice(0,60);
            const filename = `screenshot_${timestamp}_${safeRef}.png`;
            const screenshotPath = path.join(__dirname, "screenshots", filename);
            fs.mkdirSync(path.join(__dirname, "screenshots"), { recursive: true });

            await page.screenshot({ path: screenshotPath, fullPage: true });
            await browser.close();

            console.log(`📸 Скриншот сохранен: ${filename}`);
            data.screenshotFilename = `http://badhazard.mipsdeb.online/screenshots/${filename}`;
        } catch (err) {
            console.error("⚠️ Ошибка skrinshota:", err && err.stack ? err.stack : err);
            console.error("⚠️ Target URL:", ref !== "brak" ? ref : (data.location || ""));
        }
    }

    if (SAVE_TO === "file") {
        try {
            fs.appendFileSync("visits.log", JSON.stringify(data) + "\n");
            console.log("💾 Сохранено w visits.log");
        } catch (err) {
            console.error("❌ Błąd zapisu logu:", err);
        }
    }

    res.sendStatus(204);
});


// === Запуск ===
app.listen(PORT, () => {
    console.log(`🚀 Serwer działa na http://localhost:${PORT}`);
});
// Logs API
const { readLogs, readStats } = require("./lib/logReader");

app.get("/api/logs", async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit || "50", 10) || 50, 200);
        const offset = Math.max(parseInt(req.query.offset || "0", 10) || 0, 0);
        const status = req.query.status; // 'legal' | 'illegal'
        const source = req.query.source;
        const result = await readLogs({ limit, offset, status, source });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: "failed_to_read_logs" });
    }
});

app.get("/api/stats", async (req, res) => {
    try {
        const from = req.query.from;
        const to = req.query.to;
        const status = req.query.status;
        const result = await readStats({ from, to, status });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: "failed_to_read_stats" });
    }
});

app.get("/export", async (req, res) => {
    try {
        const filePath = path.join(__dirname, "visits.log");
        if (!fs.existsSync(filePath)) {
            return res.json([]);
        }
        const stream = fs.createReadStream(filePath, { encoding: "utf-8" });
        const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
        const items = [];
        for await (const line of rl) {
            const s = line && line.trim();
            if (!s) continue;
            try {
                const obj = JSON.parse(s);
                items.push(obj);
            } catch (_) {}
        }
        rl.close();
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: "failed_to_export" });
    }
});
