---
read_when:
    - Sprawdzanie przesłanych plików pod kątem nadużyć lub naruszeń zasad
    - Pisanie dokumentacji moderacyjnej lub instrukcji operacyjnych dla recenzentów
    - Podejmowanie decyzji, czy ukryć umiejętność lub zablokować użytkownika
summary: 'Zasady rynku: co ClawHub dopuszcza i czego nie będzie hostować.'
x-i18n:
    generated_at: "2026-05-11T20:22:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Akceptowalne użycie

Ta strona opisuje rodzaje umiejętności i treści, które ClawHub akceptuje, oraz przepływy nadużyć, których nie będzie hostować.

Te zasady są celowo praktyczne. Najbardziej zależy nam na pełnych przepływach nadużyć, a nie tylko na pojedynczych słowach kluczowych. Jeśli umiejętność została zbudowana po to, by omijać zabezpieczenia, nadużywać platform, oszukiwać ludzi, naruszać prywatność lub umożliwiać zachowania bez zgody, nie należy jej umieszczać w ClawHub.

## Najnowsze wzorce, które wyraźnie akceptujemy

- Prace frontendowe i nad systemami projektowymi, które używają prawdziwych komponentów, semantycznych tokenów, dostępnych stanów i przetestowanych przepływów użytkownika.
- Kompozycja shadcn/ui, która używa zainstalowanych komponentów źródłowych, aliasów projektu i udokumentowanych wariantów zamiast jednorazowego znacznika.
- Konwersja UI5 z JavaScriptu na TypeScript, która zachowuje komentarze, używa konkretnych typów UI5 i utrzymuje wygenerowane interfejsy kontrolek w stanie możliwym do przeglądu.
- Defensywne przeglądy bezpieczeństwa, narzędzia moderacji i prompty do wykrywania nadużyć, które pokazują dowody i jasno utrzymują granice ludzkiej akceptacji.
- Automatyzacja przepływów pracy oparta na zgodzie dla kont osobistych lub zespołowych, z jawnymi poświadczeniami, przejrzystą konfiguracją oraz trybami dry-run lub podglądu.
- Dokumentacja, runbooki migracji, narzędzia deweloperskie i fixture’y testowe ograniczone do oprogramowania, które wspierają.

## Niedozwolone

- Przepływy omijania zabezpieczeń lub nieautoryzowanego dostępu.
  - Przykłady: omijanie uwierzytelniania, przejęcie konta, omijanie CAPTCHA, omijanie Cloudflare lub zabezpieczeń antybotowych, omijanie limitów szybkości, stealth scraping zaprojektowany do pokonywania zabezpieczeń, przejęcie rozmowy na żywo lub agenta, kradzież sesji wielokrotnego użytku, automatyczne zatwierdzanie przepływów parowania dla niezatwierdzonych użytkowników.

- Nadużywanie platform i omijanie banów.
  - Przykłady: konta stealth po banach, rozgrzewanie/farmienie kont, fałszywe zaangażowanie, budowanie karmy lub obserwujących, automatyzacja wielu kont, masowe publikowanie, boty spamujące, automatyzacja marketplace’ów lub mediów społecznościowych zbudowana w celu uniknięcia wykrycia.

- Oszustwa, scamy i zwodnicze przepływy finansowe.
  - Przykłady: fałszywe certyfikaty, fałszywe faktury, zwodnicze przepływy płatności, outreach scamowy, fałszywy dowód społeczny, narzędzia umożliwiające wydawanie lub obciążanie bez jasnej ludzkiej akceptacji i przejrzystych kontroli albo przepływy syntetycznej tożsamości zbudowane do tworzenia kont na potrzeby oszustw.

- Scraping, wzbogacanie lub nadzór naruszające prywatność.
  - Przykłady: scraping danych kontaktowych na dużą skalę do spamu, doxxing, stalking, ekstrakcja leadów połączona z niezamówionym outreach’em, ukryte monitorowanie, wyszukiwanie twarzy lub dopasowywanie biometryczne używane bez jasnej zgody albo kupowanie, publikowanie, pobieranie lub operacjonalizowanie wyciekłych danych albo zrzutów z naruszeń bezpieczeństwa.

- Podszywanie się bez zgody lub zwodnicza manipulacja tożsamością.
  - Przykłady: face swap, cyfrowe bliźniaki, fałszywe persony, sklonowani influencerzy albo inne narzędzia do manipulacji tożsamością używane do podszywania się lub wprowadzania w błąd.

- Jawne treści seksualne i generowanie treści dla dorosłych z wyłączonymi zabezpieczeniami.
  - Przykłady: generowanie obrazów/wideo/treści NSFW, wrappery treści dla dorosłych wokół API firm trzecich albo umiejętności, których głównym celem są jawne treści seksualne.

- Ukryte, niebezpieczne lub wprowadzające w błąd wymagania wykonania.
  - Przykłady: zaciemnione polecenia instalacji, `curl | sh`, nieujawnione wymagania dotyczące sekretów, nieujawnione użycie klucza prywatnego, zdalne wykonanie `npx @latest` bez jasnej możliwości przeglądu, wprowadzające w błąd metadane ukrywające, czego umiejętność naprawdę potrzebuje do uruchomienia.

## Najnowsze wzorce, których wyraźnie nie akceptujemy

- „Twórz konta sprzedawców stealth po banach na marketplace’ach.”
- „Zmodyfikuj parowanie Telegram tak, aby niezatwierdzeni użytkownicy automatycznie otrzymywali kody parowania.”
- „Rozwijaj konta Reddit/Twitter z niewykrywalną automatyzacją.”
- „Generuj profesjonalne certyfikaty lub faktury do dowolnego użycia.”
- „Generuj treści NSFW z wyłączonymi kontrolami bezpieczeństwa.”
- „Scrapuj leady, wzbogacaj kontakty i uruchamiaj zimny outreach na dużą skalę.”
- „Kupuj, publikuj lub pobieraj wyciekłe dane albo zrzuty z naruszeń bezpieczeństwa.”
- „Masowo twórz konta e-mail lub społecznościowe z syntetycznymi tożsamościami albo rozwiązywaniem CAPTCHA.”

## Uwagi dla recenzentów

- Kontekst ma znaczenie. Ten sam temat może być uzasadniony w wąskim ustawieniu defensywnym lub opartym na zgodzie, a niedopuszczalny, gdy jest pakowany jako przepływ nadużyć.
- Powinniśmy skłaniać się ku działaniu, gdy umiejętność jest wyraźnie zoptymalizowana pod kątem omijania zabezpieczeń, oszustwa lub użycia bez zgody.
- Powtarzające się przesyłanie treści w tych kategoriach stanowi podstawę do ukrycia treści i zbanowania konta.

## Egzekwowanie zasad

- Możemy ukrywać, usuwać lub trwale usuwać naruszające zasady umiejętności.
- Możemy unieważniać tokeny, miękko usuwać powiązane treści i banować sprawców powtarzających się lub poważnych naruszeń.
- Nie gwarantujemy egzekwowania zasad z ostrzeżeniem w pierwszej kolejności w przypadku oczywistych nadużyć.
