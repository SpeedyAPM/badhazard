# Snippet badhazard – szybka integracja dla marketerów

## Co to jest
- Lekki kod, który rejestruje wejścia na stronę i wspiera analizę skuteczności kampanii.
- Działa podobnie jak kody śledzące reklam (np. Google Ads/Analytics).

## Jak dodać na stronę
- WordPress (najprościej):
  - Zainstaluj wtyczkę do wklejenia kodów w `<head>` (np. „Insert Headers and Footers”).
  - Wklej poniższy kod w ustawieniach wtyczki (sekcja Header) i zapisz.
- Google Tag Manager:
  - Utwórz nowy Tag typu „HTML niestandardowy”.
  - Wklej poniższy kod, ustaw Trigger „All Pages”, opublikuj kontener.

## Kod do wklejenia
```html
<script>
  window.BadhazardConfig = {
    endpoint: 'https://twoj-backend.example.com/api/log-visit'
  };
</script>
<script src="https://twoja-domena/intergracja/snippet/tracker.js"></script>
```
- `endpoint` to adres Twojego serwera, który zbiera wizyty.
- `https://twoja-domena/intergracja/snippet/tracker.js` to publiczny adres skryptu snippetu (udostępnij plik z tego repo na swojej domenie).

## Jak sprawdzić działanie (prosto)
- Otwórz swoją stronę z wklejonym kodem i dopisz do adresu `?utm_source=test&utm_campaign=promo`.
- Jeśli używasz GTM – wejdź w „Podgląd” i sprawdź, czy tag uruchamia się na każdej stronie.
- Poproś zespół techniczny o potwierdzenie, że w serwerowym logu wizyt pojawił się wpis (nie trzeba używać narzędzi programistycznych po stronie przeglądarki).

## Kontakt
- Masz pytania? Skontaktuj się z zespołem technicznym odpowiedzialnym za `endpoint` Twojej organizacji.
