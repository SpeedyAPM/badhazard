Instrukcja integracji badhazard (pakiet uproszczony)

1) Osadź snippet na stronie:
   <script>
     window.BadhazardConfig = { endpoint: 'https://twoj-backend.example.com/api/log-visit' };
   </script>
   <script src="/intergracja/snippet/tracker.js"></script>

   Snippet automatycznie wyśle payload wizyty (referer, UTM, UA, słowa kluczowe, hash).

2) Uruchom mały serwis HTTP:
   node intergracja/server/index.js

   Endpointy:
   - POST /api/log-visit   (przyjęcie i zapis wizyty, zrzut dla suspicious)
   - GET  /api/logs        (prosty odczyt logów)
   - /screenshots/*        (serwowanie zrzutów)

3) Minimalne wymagania:
   - Node.js 18+
   - Chromium/Chrome dostępny w systemie (do zrzutów)

4) Konfiguracja środowiska:
   - Zmień endpoint w snippecie na własny URL backendu
   - Jeśli backend jest na innej domenie, włącz CORS w serwerze

