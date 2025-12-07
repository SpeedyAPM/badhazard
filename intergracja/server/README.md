# badhazard – dokumentacja serwera

## Wymagania
- Sprzęt: min. 1 vCPU / 1 GB RAM (zalecane 2 GB przy większym ruchu)
- System: Linux/Unix z dostępem do powłoki
- Node.js: 18+
- Przeglądarka: Chromium/Chrome (np. `/usr/bin/google-chrome-stable`)
- Porty: HTTP (domyślnie 8080) lub reverse proxy z SSL

## Instalacja
```bash
cd /var/www/badhazard/intergracja/server
npm init -y
npm i express cors body-parser puppeteer
```

## Uruchomienie
```bash
node index.js
# Serwer: http://localhost:8080
```
- PM2 (production):
```bash
pm2 start index.js --name badhazard-integracja -- 8080
pm2 save
pm2 status
```
- Docker (przykład):
  - Użyj `node:18` i doinstaluj Chromium w obrazie; mapuj `/screenshots` jako volume
  - Uruchom: `docker run -d --name badhazard-integracja -p 8080:8080 image:tag`

## Bezpieczeństwo
- Firewall: przepuść ruch do portu serwisu lub reverse proxy
- SSL/HTTPS: Nginx/Caddy jako reverse proxy; certyfikaty Let’s Encrypt
- CORS: włącz gdy snippet jest na innej domenie (`app.use(cors())`)

## Monitoring i logi
- Logi wizyt: `intergracja/server/visits.log` (JSONL)
- Zrzuty ekranu: `intergracja/server/screenshots/`
- Test odczytu: `curl http://localhost:8080/api/logs`

## API
- `POST /api/log-visit`
  - Body: `{ timestamp, location, referer, refererHash, userAgent, utm, suspiciousMatches, suspiciousUserAgent, suspicious }`
  - Odpowiedź: `204 No Content`
  - Dla `suspicious === true` serwer wykona zrzut i doda `screenshotFilename`
- `GET /api/logs`
  - Zwraca: `{ items: [...], total: n }`
- `/screenshots/*`
  - Serwuje pliki PNG zrzutów

## Troubleshooting
- Brak Chromium: zainstaluj pakiet przeglądarki (apt/yum) albo użyj Google Chrome stable
- Błąd sandbox: uruchom Puppeteer z `--no-sandbox` i `--disable-setuid-sandbox`
- CORS blokuje żądania: włącz `cors()` i ustaw poprawne nagłówki
- Certyfikaty: użyj reverse proxy i terminuj TLS na froncie

## Pliki referencyjne
- Kod serwera: `intergracja/server/index.js`
- Snippet do osadzenia: `intergracja/snippet/tracker.js`
