# SIGMA KZW – system indentyfikacji gracza i monitoring aktywności, kontrola zakładów wzajemnych

Aplikacja Node.js, która:
- Rejestruje wizyty i metadane (czas, URL, referer, UA, UTM)
- Wykrywa podejrzane źródła i reklamy
- Wykonuje zrzuty ekranu stron powiązanych z podejrzanymi wpisami
- Udostępnia logi i statystyki przez API oraz proste strony WWW

## Szybki start
- Aplikacja działa pod adresem `http://badhazard.mipsdeb.online` (reverse proxy do backendu na porcie `3000`).
- Główne strony:
  - `logs.html` – tabela z logami, paginacja, filtry, podgląd zrzutów
  - `dashboard.html` – podsumowanie, wykresy (legal/illegal, źródła, trendy)
  - `efortuna_mock_clone.html` – strona symulacyjna „legalna” z linkiem do regulaminu
  - `efortuna_fake_clone.html` – strona symulacyjna „fałszywa” z regulaminem

## API
- `POST /api/log-visit` – rejestracja wizyty (JSON)
- `GET /api/logs` – lista logów z paginacją i filtrami (`limit`, `offset`, `status`, `source`)
- `GET /api/stats` – statystyki (`from`, `to`, `status`)
- `GET /export` – cały `visits.log` jako jedna tablica JSON

## Format logu (linia JSON)
Przykład pola:
- `timestamp` – ISO string
- `location` – pełny URL strony odwiedzonej
- `referer` – referer (lub `brak`)
- `utm` – obiekt `source`, `campaign`, `medium`
- `suspiciousMatches` – lista słów kluczowych zadziałanych w detekcji
- `suspicious` – flaga podejrzany wpis (true/false)
- `screenshotFilename` – pełny URL do zrzutu np. `http://badhazard.mipsdeb.online/screenshots/<plik>.png`

## Mechanizm wykonywania zrzutu ekranu
- Backend decyduje o zrzucie, gdy:
  - `suspicious === true` w payloadzie
  - lub referer zawiera słowa kluczowe (lista na backendzie)
- Główna logika:
  - Wykrywanie podejrzanych słów w refererze: `badhazard/index.js:60-62`
  - Warunek wykonania zrzutu: `badhazard/index.js:64`
  - Uruchomienie przeglądarki (Chromium/Chrome): `badhazard/index.js:66-81`
  - Mapowanie domeny na lokalny backend dla stabilnego renderu: `badhazard/index.js:84-87`
  - Wejście na stronę i screenshot: `badhazard/index.js:92-106`
  - Generowanie nazwy pliku i zapis: `badhazard/index.js:100-106`
  - Zapis pełnego URL do zrzutu w `data.screenshotFilename`: `badhazard/index.js:109`
  - Serwowanie katalogu ze zrzutami: `badhazard/index.js:14`

### Wymagania przeglądarki
- Backend używa Puppeteer. Zalecane jest posiadanie systemowego Chromium lub Chrome.
- Aplikacja próbuje wykryć przeglądarkę pod typowymi ścieżkami (`/usr/bin/chromium`, `/snap/bin/chromium`, etc.).
- Alternatywnie można zainstalować Chrome dla Puppeteer cache: `npx puppeteer browsers install chrome`.

## Ustalanie flagi `suspicious`
- Po stronie klienta (mock): słowa kluczowe i heurystyki ustawiają `suspicious: true`.
  - Lista słów: `badhazard/public/efortuna_mock_clone.html:14-19`
  - Flaga w payloadzie: `badhazard/public/efortuna_mock_clone.html:45`
- Po stronie serwera: niezależna kontrola referera (backendowa lista słów) może wymusić zrzut nawet gdy klient nie ustawił `suspicious`.
- Można jawnie wymusić zrzut: wyślij `suspicious: true` w `POST /api/log-visit` wraz z `location`/`referer`.

## Strony WWW
- `logs.html` – tabela, filtrowanie po statusie i źródle, miniatury z modalem.
  - Pobieranie: `GET /api/logs`
  - Miniatury używają pełnych URL zwracanych w `screenshotFilename`.
- `dashboard.html` – wykres kołowy legal/illegal, top źródła, trendy dzienne.
  - Statystyki: `GET /api/stats`
- Regulaminy:
  - Prawdziwy: `regulamin_true.html` osadzony na mocku
  - „Fałszywy”: `regulamin_false.html` osadzony na kopii fake

## Eksport logów
- `GET /export` zwraca cały `visits.log` jako tablicę JSON (odczyt strumieniowy): `badhazard/index.js:161-183`

## Wydajność i bezpieczeństwo
- Odczyt logów wykonywany jest strumieniowo (`readline`), co skaluje się dla dużych plików.
- API ogranicza `limit` do rozsądnych wartości (domyślnie 50, maksymalnie 200).
- Zrzuty ekranu sanitizują nazwę pliku, katalog `screenshots/` jest serwowany statycznie.
- Reverse proxy (nginx) powinno przekazywać nagłówki `X-Forwarded-Proto`, obsłużyć `/` oraz `/screenshots/`.

## Uruchomienie
- PM2 (przykład):
  - `pm2 restart badhazard-app`
  - `pm2 status`
- Lokalna weryfikacja:
  - `curl http://127.0.0.1:3000/export`
  - `curl 'http://127.0.0.1:3000/api/logs?limit=20&status=illegal'`

## Testy
- Podstawowe testy modułu odczytu i statystyk: `badhazard/tests/run-tests.js`
- Uruchomienie: `node /var/www/badhazard/tests/run-tests.js`

## Struktura
- Backend: `index.js`
- Logi: `visits.log`
- Zrzuty: `screenshots/`
- Odczyt i agregacje: `lib/logReader.js`
- Front: `public/*.html` (mock, fake, logs, dashboard, regulaminy)

