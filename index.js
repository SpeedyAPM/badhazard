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
app.post("/api/log-visit", async (req, res) => {
    const data = req.body;
    console.log("📝 Новое посещение:");
    console.log(JSON.stringify(data, null, 2));

    if (SAVE_TO === "mongo") {
        try {
            await new Visit(data).save();
            console.log("✅ Сохранено в MongoDB");
        } catch (err) {
            console.error("❌ Ошибка сохранения:", err);
        }
    } else {
        fs.appendFileSync("visits.log", JSON.stringify(data) + "\n");
        console.log("💾 Сохранено w visits.log");
    }

    const ref = data.referer || "";
    const lowerRef = ref.toLowerCase();
    const suspiciousWords = [
        "bonus", "bez podatku", "gra bez ryzyka", "free spin", "kasyno", "hazard"
    ];
    const matched = suspiciousWords.filter(word => lowerRef.includes(word));

    if (ref !== "brak" && matched.length > 0) {
        try {
            const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"] });
            const page = await browser.newPage();
            await page.goto(ref, { timeout: 15000, waitUntil: "domcontentloaded" });
            const timestamp = Date.now();
            const filename = `screenshot_${timestamp}.png`;
            const screenshotPath = path.join(__dirname, "screenshots", filename);
            await page.screenshot({ path: screenshotPath, fullPage: true });
            await browser.close();
            console.log(`📸 Скриншот сохранен: ${filename}`);
        } catch (err) {
            console.error("⚠️ Ошибка скриншота:", err.message);
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
        const xff = req.headers["x-forwarded-for"]; 
        const first = Array.isArray(xff) ? xff[0] : (xff || "");
        const ip = (first.split(",")[0] || "").trim() || (req.socket && req.socket.remoteAddress) || req.ip || "";
        fs.appendFileSync("visitsip.txt", JSON.stringify({ timestamp: new Date().toISOString(), ip }) + "\n");
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
