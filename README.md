System Identyfikacji Graczy i Monitoringu Aktywności (SIGMA)
Państwowy System Nadzoru nad Hazardem Online

🎯 Cel systemu
Zapewnienie legalności, przejrzystości i bezpieczeństwa rynku zakładów i kasyn online w Polsce poprzez scentralizowaną kontrolę graczy, operatorów oraz źródeł ruchu internetowego.

🧩 Moduły systemu SIGMA

1. 🧑‍💼 Moduł Graczy
Opis: Centralny rejestr graczy hazardowych wraz z pełną historią działań i oceną ryzyka.
Funkcjonalności:
Integracja z PESEL / e-Dowód


Historia depozytów, wypłat, zakładów


Analiza zachowań gracza (uzależnienia, wysokie ryzyko)


Kategoryzacja RG (Responsible Gambling): alerty, limity, samowykluczenia


Weryfikacja tożsamości (KYC)


Integracja z systemem skarg


Automatyczne oznaczanie podejrzanych graczy



2. 🏦 Moduł Operatorów (Kasyna / Bukmacherzy)
Opis: Nadzór nad działalnością licencjonowanych firm B2C i B2B
Funkcjonalności:
Monitorowanie GGR, NGR, RTP, liczby aktywnych graczy


Analiza stawek i współczynników


Integracja z systemem podatkowym


Weryfikacja statusu licencji i certyfikatów (GLI, iTechLabs itd.)


Sprawdzenie systemów płatniczych i kierunku wypłat


Wykrywanie anomalii (np. zmiany w HTML, bug-stawki, fałszywe kursy)



3. 🔐 Moduł Bezpieczeństwa
Opis: Zapewnienie cyfrowego bezpieczeństwa użytkowników oraz ochrony danych.
Funkcjonalności:
Centralna weryfikacja KYC / AML


Lista zbanowanych i niepożądanych graczy


Identyfikacja urządzeń, IP, VPN, TOR


Ochrona DDoS (dla zatwierdzonych operatorów)



4. 📜 Moduł Regulacyjny
Opis: Automatyczne sprawdzanie zgodności z polskim prawem hazardowym.
Funkcjonalności:
Weryfikacja dokumentacji licencyjnej i regulaminów


Audyty RTP dla gier


Sprawdzanie regulaminów i dokumentów za pomocą AI/NLP


Analiza zgodności z lokalnym językiem i przepisami



5. 🌍 Moduł Ruchu Sieciowego (Traffic)
Opis: Wykrywanie nielegalnych źródeł ruchu i reklam.
Funkcjonalności:
Odczyt źródła odwiedzin (referer, utm_source, utm_campaign)


Analiza linków pod kątem słów kluczowych:


bonus, bez podatku, gra bez ryzyka, free spin, kasyno, hazard


Wykrywanie podejrzanych agentów przeglądarki (User-Agent)


Wykonywanie zrzutów ekranu strony źródłowej (Puppeteer)


Automatyczne tworzenie raportów / skarg (PDF / JSON)


Lista domen wewnętrznych i zagranicznych, przez które użytkownicy wchodzą na stronę


Zgłoszenia do UKNF / UOKiK



6. 🔍 Moduł Wyszukiwania Kasyn Nielegalnych
Opis: Automatyczne wykrywanie nielegalnych kasyn, ich kopii i alternatywnych domen.
Funkcjonalności:
Crawler do skanowania domen globalnych (.com, .net)


Identyfikacja stron z niedozwolonymi słowami i ofertami


Wykrywanie mirrorów / alternatywnych adresów URL


Automatyczne blokowanie (DNS/Cloudflare)


Tworzenie listy domen do zgłoszenia / ukarania


Interfejs API do generowania formalnych zgłoszeń



⚙️ Technologie Wykorzystane (Tech Stack)
Komponent
Technologia
Backend
Node.js (Express)
Baza danych
MongoDB / PostgreSQL
Analiza stron
Puppeteer
Parsery i crawler
Cheerio, Axios
Monitorowanie
Grafana + Prometheus
Frontend
Flutter
Przechowywanie zrzutów
AWS S3 / lokalnie









