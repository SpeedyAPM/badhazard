# badhazard — system wykrywania nielegalnych reklam hazardowych

## Opis projektu
- Problem: identyfikacja i archiwizacja przypadków kierowania ruchu do treści hazardowych, w tym nielegalnych reklam i stron „klonów”.
- Rozwiązanie: lekki serwer Node.js zbiera dane wizyt przez osadzalny snippet, analizuje parametry UTM i referer, wykrywa podejrzane słowa kluczowe oraz generuje zrzuty ekranu strony źródłowej (Puppeteer). Wyniki zapisuje w formacie JSONL i serwuje podgląd wraz ze zrzutami.
- Efekt: szybki wgląd w dowody (URL + screenshot), możliwość filtrowania logów oraz eksportu.

## Założenia projektu
- Przechowywanie logów jako JSON Lines w `visits.log`.
- Zrzuty ekranu zapisywane lokalnie w `screenshots/` i dostępne pod `/screenshots/*`.
- Wykonanie zrzutu dla wpisów oznaczonych jako podejrzane (`suspicious: true`) lub z dopasowaniami słów kluczowych.
- Anty-duplikacja: podczas generowania zrzutu serwer dodaje parametr `bh_nolog=1`, a snippet ignoruje go i nie raportuje ponownie.
- Wsparcie dla scenariusza „referer: brak” — źródłem zrzutu jest wtedy `location`.

## Instalacja i uruchomienie
- Wymagania: `Node.js 18+`, przeglądarka Chromium/Chrome, Linux.
- Instalacja zależności w katalogu głównym:
```
cd /var/www/badhazard
npm i
```
- Uruchomienie serwera:
```
node index.js
# Serwer: http://localhost:3000
```
- Zależności kluczowe: `express`, `cors`, `body-parser`, `puppeteer`, `mongoose` (opcjonalnie).

## Przykłady wyników
- Log JSONL: `var/www/badhazard/visits.log` — każdy wiersz to jeden wpis, np.
```
{"timestamp":"2025-12-07T08:29:45.123Z","location":"https://badhazard.mipsdeb.online/efortuna_fake_clone.html","referer":"https://badhazard.mipsdeb.online/","utm":{"source":"brak","campaign":"brak","medium":"brak"},"suspicious":true,"screenshotFilename":"/screenshots/screenshot_1765052109315_http_127_0_0_1_3000_fake_ad_landing_html.png"}
```
- Podgląd w przeglądarce: `public/logs.html` korzysta z `GET /api/logs` i pokazuje kolumny czas/URL/status/źródło/zrzut.

## Wydzielona integracja (`intergracja/`)
- `intergracja/snippet/tracker.js`: osadzalny fragment JS do wklejenia na stronę. Zbiera `timestamp`, `location`, `referer`, `utm`, wykrywa słowa kluczowe (np. „bonus”, „free spin”), oznacza `suspicious` i wysyła `POST /api/log-visit`. Ignoruje `bh_nolog=1`.
- `intergracja/server/index.js`: minimalny serwer Express z analogicznym końcem `POST /api/log-visit` oraz serwowaniem `/screenshots`. Dla `suspicious === true` wykonuje zrzut ekranu i dopisuje `screenshotFilename`. Ma prosty `GET /api/logs` do wglądu.
- `intergracja/server/README.md`: opis wymagań, instalacji, API i anty-duplikacji.

## Architektura i API
- Endpointy w głównym serwerze:
  - `POST /api/log-visit` — zapis JSONL i (dla podejrzanych) zrzut ekranu. Implementacja: `index.js:42`.
  - `GET /api/logs` — odczyt znormalizowanych wpisów z `visits.log` z przypięciem zrzutów, filtrowaniem i paginacją. Implementacja: `index.js:140`, logika pomocnicza `lib/logReader.js`.
  - `GET /api/stats` — proste statystyki i top źródła. Implementacja: `index.js:153`, `lib/logReader.js`.
  - `/screenshots/*` — serwowanie zrzutów PNG.
- Generowanie zrzutu: Puppeteer otwiera stronę (referer lub `location`) z parametrem `bh_nolog=1` i pełnym zrzutem. Implementacja: `index.js:58-114`.

## Dodatkowe informacje
- Zgodność z `referer: brak`: gdy `referer` jest pusty lub `brak`, kod użyje `location` do zrzutu.
- Rozpoznawanie lokalnej domeny: adres `badhazard.mipsdeb.online` może być odwiedzany wewnętrznie po translacji na `http://localhost:3000`.
- Eksport pełnych logów: `GET /export` — zwraca całą zawartość `visits.log` w JSON.

