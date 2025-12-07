Przewodnik integracji badhazard

Cel: umożliwić szybkie osadzenie monitoringu wizyt i zrzutów ekranu na stronach (blogi, portale, WordPress, strony influencerów), analogicznie do integracji z narzędziami reklamowymi.

Struktura folderów
- /snippet – dla użytkowników nietechnicznych; gotowy kod do wklejenia na stronę
- /server  – dla programistów; serwis HTTP, zrzuty ekranu, logowanie
- /docs    – dokumentacja ogólna i nawigacja (ten plik)

Kto powinien czytać co
- Użytkownicy nietechniczni: część „Snippet – szybka integracja” poniżej
- Programiści/devops: część „Server – instalacja i utrzymanie” poniżej
- Menedżerowie/marketing: „Testowanie i wsparcie” (jak sprawdzać działanie)

Snippet – szybka integracja (dla nietechnicznych)
- Opis: mały fragment kodu, który automatycznie rejestruje wejścia na stronę i wysyła bezpieczne dane (źródło, kampania, urządzenie) do Twojego serwera.
- Co daje: śledzenie skuteczności kampanii, identyfikacja podejrzanych źródeł, możliwość tworzenia zrzutów ekranu landing page.
- Jak dodać na stronę:
  1) WordPress (wtyczka „Header/Footer” lub moduł „Dodatkowy kod”):
     Wklej poniższy kod w sekcję <head> lub przez GTM:
       <script>
         window.BadhazardConfig = { endpoint: 'https://twoj-backend.example.com/api/log-visit' };
       </script>
       <script src="https://twoja-domena/intergracja/snippet/tracker.js"></script>
  2) Google Tag Manager (Tag HTML niestandardowy, trigger: All Pages):
       <script>
         window.BadhazardConfig = { endpoint: 'https://twoj-backend.example.com/api/log-visit' };
       </script>
       <script src="https://twoja-domena/intergracja/snippet/tracker.js"></script>
- Co zbieramy: adres strony, referer, parametry UTM, przeglądarka. Nie zbieramy danych osobowych.
- Plik snippetu: /intergracja/snippet/tracker.js

Server – instalacja i utrzymanie (dla programistów)
- Funkcje: przyjęcie wizyt (POST /api/log-visit), zapis do visits.log, warunkowe zrzuty ekranu (Puppeteer) do /screenshots, prosty odczyt (GET /api/logs).
- Minimalne wymagania sprzętowe:
  - 1 vCPU, 1 GB RAM (zalecane 2 GB przy wzmożonych zrzutach)
  - Dysk: ~1 GB na logi i zrzuty (skalować wg ruchu)
- Wymagane wersje:
  - Node.js 18+
  - Chromium/Chrome dostępny w systemie (np. /usr/bin/google-chrome-stable)
- Firewall/porty:
  - Otwórz port usługi (domyślnie 8080) lub postaw za reverse proxy (HTTPS)
  - Zezwól na ruch do ścieżek: /api/log-visit, /api/logs, /screenshots/*
- Instalacja Node.js i zależności (przykład):
  - cd /var/www/badhazard/intergracja/server
  - npm init -y
  - npm i express cors body-parser puppeteer
- Uruchomienie:
  - node index.js
  - Serwis nasłuchuje pod adresem http://localhost:8080
- Utrzymanie (PM2):
  - pm2 start index.js --name badhazard-integracja -- 8080
  - pm2 save
  - pm2 status
- Utrzymanie (Docker – przykład):
  - Dockerfile: bazowy node:18 + instalacja Chromium; mapuj /screenshots jako volume
  - docker run -d --name badhazard-integracja -p 8080:8080 image:tag
- SSL/HTTPS:
  - Zalecany reverse proxy (Nginx/Caddy) z certyfikatem TLS; proxy_pass do http://127.0.0.1:8080
- Monitorowanie i logowanie:
  - Logi wizyt: intergracja/server/visits.log (JSON lines)
  - Zrzuty: intergracja/server/screenshots/
  - Sprawdzenie pracy: curl http://localhost:8080/api/logs
- Plik serwera: /intergracja/server/index.js

Testowanie integracji
- Czy snippet działa:
  - Otwórz stronę z wklejonym kodem, dodaj parametry UTM w URL
  - Sprawdź, czy serwer otrzymał wpis w visits.log (nowa linia JSON)
- Czy zrzuty działają:
  - Wywołaj POST testowy:
    curl -X POST 'http://localhost:8080/api/log-visit' -H 'Content-Type: application/json' -d '{"timestamp":"2025-01-01T00:00:00Z","location":"https://twoja-strona/przyklad?utm_source=test&utm_campaign=kampania","referer":"https://przyklad-referer","userAgent":"Test UA","utm":{"source":"test","campaign":"kampania","medium":"seo"},"suspiciousMatches":["bonus"],"suspiciousUserAgent":false,"suspicious":true}'
  - Sprawdź plik visits.log oraz katalog /screenshots
- Debug: włącz podgląd konsoli przeglądarki na stronie z wklejonym snippetem

Wsparcie i rozwiązywanie problemów
- Typowe problemy:
  - CORS: jeśli snippet jest na innej domenie niż serwer, włącz CORS (app.use(cors()))
  - Brak Chromium: zainstaluj pakiet przeglądarki (apt/yum) lub użyj google-chrome-stable
  - Sandbox: przy uruchamianiu puppeteer używaj "--no-sandbox" w środowiskach container/CI
  - SSL: konfiguruj reverse proxy z certyfikatem (Let’s Encrypt) i przekieruj ruch do serwisu
- API – opis uproszczony:
  - POST /api/log-visit
    - Body: { timestamp, location, referer, refererHash, userAgent, utm, suspiciousMatches, suspiciousUserAgent, suspicious }
    - Odpowiedź: 204 No Content; serwer może dodać screenshotFilename do zapisanego wpisu
  - GET /api/logs
    - Zwraca: { items: [...], total: n }
- Kontakt: dev@twoj-serwis.example

Nawigacja po repozytorium
- Snippet: /intergracja/snippet/tracker.js (gotowy do wklejenia)
- Serwer: /intergracja/server/index.js (uruchomienie usługi)
- Dokumentacja: /intergracja/docs/readme.txt (ten plik)
