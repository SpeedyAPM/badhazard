# Snippet badhazard – szybka integracja

## Opis
- Niezależny fragment kodu, który rejestruje wejścia na stronę oraz podstawowe parametry kampanii.
- Może być osadzony w dowolnej witrynie bez zależności od zewnętrznych usług.

## Jak dodać na stronę
- Domyślny scenariusz: snippet działa na innej domenie niż serwer (cross-origin).
- Dodaj kod w sekcji `<head>` swojej witryny.
- Jeśli używasz CMS, wstaw kod w module umożliwiającym dodawanie skryptów w nagłówku dla wszystkich stron.

## Kod do osadzenia
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

## Weryfikacja działania
- Otwórz stronę z wklejonym kodem i dopisz do adresu `?utm_source=test&utm_campaign=promo`.
- Upewnij się, że serwer przyjmuje żądania z Twojej domeny (włączone CORS po stronie serwera).
- Poproś zespół techniczny o potwierdzenie, że w serwerowym logu wizyt pojawił się wpis.

## Kontakt
- Masz pytania? Skontaktuj się z zespołem technicznym odpowiedzialnym za `endpoint` Twojej organizacji.
