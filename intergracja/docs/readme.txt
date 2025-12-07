Przewodnik integracji badhazard

Cel: umożliwić szybkie osadzenie samodzielnego rozwiązania do rejestrowania wizyt i wykonywania zrzutów ekranu na stronach internetowych.

Struktura folderów
- /snippet – gotowy kod do osadzenia w witrynie
- /server  – serwis HTTP realizujący zapis wizyt i zrzuty ekranu
- /docs    – dokumentacja ogólna i nawigacja (ten plik)

Kto powinien czytać co
- Użytkownicy nietechniczni: „Snippet – szybka integracja”
- Zespoły techniczne: „Server – instalacja i utrzymanie”

Snippet – szybka integracja
- Domyślny scenariusz: snippet działa na innej domenie niż serwer.
- Opis: fragment kodu osadzany w nagłówku strony, rejestrujący wejścia i przekazujący dane do wskazanego punktu końcowego.
- Jak dodać na stronę:
  - Umieść poniższy kod w sekcji `<head>` Twojej witryny (lub w module CMS pozwalającym wstrzykiwać skrypty):
    <script>
      window.BadhazardConfig = { endpoint: 'https://twoj-backend.example.com/api/log-visit' };
    </script>
    <script src="https://twoja-domena/intergracja/snippet/tracker.js"></script>
- Zakres zbieranych danych: adres strony, referer, parametry UTM, informacje o przeglądarce. Bez danych osobowych.
- Plik snippetu: /intergracja/snippet/tracker.js

Server – instalacja i utrzymanie
- Funkcje: przyjęcie wizyt (POST /api/log-visit), zapis do visits.log, wykonywanie zrzutów ekranu (Puppeteer) do /screenshots, odczyt logów (GET /api/logs).
- Minimalne wymagania sprzętowe:
  - 1 vCPU, 1 GB RAM (zalecane 2 GB przy większym ruchu)
  - Dysk: ~1 GB na logi i zrzuty (skalować wg ruchu)
- Wersje:
  - Node.js 18+
  - Dostępna przeglądarka Chromium/Chrome
- Firewall/porty:
  - Otwórz port usługi (domyślnie 8080) lub zastosuj reverse proxy (HTTPS)
  - Zezwól na ruch do: /api/log-visit, /api/logs, /screenshots/*
  - Włącz CORS jako domyślną konfigurację dla źródeł zewnętrznych
- Instalacja zależności (przykład):
  - cd /var/www/badhazard/intergracja/server
  - npm init -y
  - npm i express cors body-parser puppeteer
- Uruchomienie:
  - node index.js (serwis pod http://localhost:8080)
- Utrzymanie (PM2):
  - pm2 start index.js --name badhazard-integracja -- 8080
  - pm2 save
  - pm2 status
- Utrzymanie (Docker – przykład):
  - Obraz oparty o Node 18 + instalacja Chromium; wolumen dla /screenshots
  - docker run -d --name badhazard-integracja -p 8080:8080 image:tag
- SSL/HTTPS:
  - Reverse proxy (Nginx/Caddy) z certyfikatem TLS; przekierowanie do serwisu (127.0.0.1:8080)
- Monitorowanie i logowanie:
  - Logi wizyt: intergracja/server/visits.log
  - Zrzuty ekranu: intergracja/server/screenshots/
  - Szybka kontrola: curl http://localhost:8080/api/logs
- Plik serwera: /intergracja/server/index.js

Testowanie integracji
- Weryfikacja snippetu:
  - Otwórz stronę z osadzonym kodem, dodaj parametry UTM w adresie URL
  - Sprawdź, czy w visits.log pojawił się nowy wpis
- Weryfikacja zrzutów:
  - Wyślij żądanie testowe:
    curl -X POST 'http://localhost:8080/api/log-visit' -H 'Content-Type: application/json' -d '{"timestamp":"2025-01-01T00:00:00Z","location":"https://twoja-strona/przyklad?utm_source=test&utm_campaign=kampania","referer":"https://przyklad-referer","userAgent":"Test UA","utm":{"source":"test","campaign":"kampania","medium":"seo"},"suspiciousMatches":["bonus"],"suspiciousUserAgent":false,"suspicious":true}'
  - Zweryfikuj, czy plik visits.log i katalog /screenshots zostały uzupełnione
- Debugowanie: użyj podglądu konsoli przeglądarki lub narzędzi sieciowych, aby sprawdzić żądania do endpointu

Wsparcie i rozwiązywanie problemów
- CORS: jeśli snippet działa na innej domenie niż serwer, włącz `cors()` po stronie serwera
- Brak przeglądarki: zainstaluj Chromium/Chrome
- Środowiska kontenerowe/CI: uruchamiaj Puppeteer z `--no-sandbox` i `--disable-setuid-sandbox`
- Certyfikaty TLS: skonfiguruj reverse proxy i terminuj TLS na froncie

API – opis skrócony
- POST /api/log-visit
  - Body: { timestamp, location, referer, refererHash, userAgent, utm, suspiciousMatches, suspiciousUserAgent, suspicious }
  - Odpowiedź: 204 No Content; serwer może dodać screenshotFilename do zapisanego wpisu
- GET /api/logs
  - Zwraca: { items: [...], total: n }

Nawigacja po repozytorium
- Snippet: /intergracja/snippet/tracker.js
- Serwer: /intergracja/server/index.js
- Dokumentacja: /intergracja/docs/readme.txt
