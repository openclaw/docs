---
read_when:
    - Sprawdzanie przesłanych plików pod kątem nadużyć lub naruszeń zasad
    - Pisanie dokumentacji moderacji lub runbooków dla recenzentów
    - Decydowanie, czy ukryć umiejętność, czy zablokować użytkownika
summary: 'Zasady katalogu: co ClawHub dopuszcza i czego nie będzie hostować.'
x-i18n:
    generated_at: "2026-05-12T04:09:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Dopuszczalne użycie

Ta strona opisuje rodzaje umiejętności i treści, które ClawHub akceptuje, oraz nadużyciowe przepływy pracy, których nie będzie hostować.

Te zasady są celowo praktyczne. Najbardziej zależy nam na kompletnych przepływach pracy służących nadużyciom, a nie tylko na odizolowanych słowach kluczowych. Jeśli umiejętność została zbudowana w celu omijania zabezpieczeń, nadużywania platform, oszukiwania ludzi, naruszania prywatności lub umożliwiania działań bez zgody, nie należy do ClawHub.

## Najnowsze wzorce, które wyraźnie akceptujemy

- Prace frontendowe i nad systemami projektowania, które używają prawdziwych komponentów, tokenów semantycznych, dostępnych stanów i przetestowanych przepływów użytkownika.
- Kompozycja shadcn/ui, która używa zainstalowanych komponentów źródłowych, aliasów projektu i udokumentowanych wariantów zamiast jednorazowego znacznika.
- Konwersja JavaScript-to-TypeScript dla UI5, która zachowuje komentarze, używa konkretnych typów UI5 i utrzymuje wygenerowane interfejsy kontrolek w stanie możliwym do przeglądu.
- Defensywny przegląd bezpieczeństwa, narzędzia moderacyjne i prompty do wykrywania nadużyć, które pokazują dowody i jasno utrzymują granice zatwierdzania przez człowieka.
- Automatyzacja przepływów pracy oparta na zgodzie dla kont osobistych lub zespołowych, z jawnymi danymi uwierzytelniającymi, przejrzystą konfiguracją oraz trybami dry-run lub podglądu.
- Dokumentacja, runbooki migracyjne, narzędzia deweloperskie i fikstury testowe ograniczone do oprogramowania, które wspierają.

## Niedozwolone

- Przepływy pracy służące obchodzeniu zabezpieczeń lub nieautoryzowanemu dostępowi.
  - Przykłady: obejście uwierzytelniania, przejęcie konta, obejście CAPTCHA, omijanie Cloudflare lub zabezpieczeń antybotowych, obejście limitów szybkości, ukryte scrapowanie zaprojektowane do pokonywania zabezpieczeń, przejęcie rozmowy na żywo lub agenta, kradzież sesji wielokrotnego użytku, automatyczne zatwierdzanie przepływów parowania dla niezatwierdzonych użytkowników.

- Nadużywanie platform i omijanie banów.
  - Przykłady: ukryte konta po banach, podgrzewanie/farmienie kont, fałszywe zaangażowanie, budowanie karmy lub obserwujących, automatyzacja wielu kont, masowe publikowanie, boty spamujące, automatyzacja marketplace'ów lub mediów społecznościowych zbudowana tak, aby uniknąć wykrycia.

- Oszustwa, scamy i zwodnicze przepływy finansowe.
  - Przykłady: fałszywe certyfikaty, fałszywe faktury, zwodnicze przepływy płatności, scamowy outreach, fałszywy dowód społeczny, narzędzia umożliwiające wydawanie pieniędzy lub obciążanie bez jasnej zgody człowieka i przejrzystych kontroli albo przepływy pracy związane z syntetyczną tożsamością zbudowane do tworzenia kont na potrzeby oszustw.

- Scrapowanie, wzbogacanie danych lub nadzór naruszające prywatność.
  - Przykłady: scrapowanie danych kontaktowych na dużą skalę do spamu, doxxing, stalking, pozyskiwanie leadów połączone z niezamawianym outreachem, ukryte monitorowanie, wyszukiwanie twarzy lub dopasowywanie biometryczne używane bez jasnej zgody albo kupowanie, publikowanie, pobieranie lub operacjonalizowanie wyciekłych danych lub zrzutów z naruszeń.

- Podszywanie się bez zgody lub zwodnicza manipulacja tożsamością.
  - Przykłady: face swap, cyfrowe bliźniaki, fałszywe persony, sklonowani influencerzy lub inne narzędzia do manipulacji tożsamością używane do podszywania się lub wprowadzania w błąd.

- Treści seksualne explicite i generowanie treści dla dorosłych z wyłączonymi zabezpieczeniami.
  - Przykłady: generowanie obrazów/wideo/treści NSFW, wrappery treści dla dorosłych wokół API stron trzecich albo umiejętności, których głównym celem są treści seksualne explicite.

- Ukryte, niebezpieczne lub wprowadzające w błąd wymagania wykonania.
  - Przykłady: zaciemnione polecenia instalacyjne, `curl | sh`, nieujawnione wymagania dotyczące sekretów, nieujawnione użycie klucza prywatnego, zdalne wykonanie `npx @latest` bez jasnej możliwości przeglądu, wprowadzające w błąd metadane, które ukrywają, czego umiejętność naprawdę potrzebuje do uruchomienia.

## Najnowsze wzorce, których wyraźnie nie akceptujemy

- „Twórz ukryte konta sprzedawców po banach na marketplace'ach.”
- „Zmodyfikuj parowanie Telegram, aby niezatwierdzeni użytkownicy automatycznie otrzymywali kody parowania.”
- „Rozwijaj konta Reddit/Twitter za pomocą niewykrywalnej automatyzacji.”
- „Generuj profesjonalne certyfikaty lub faktury do dowolnego użycia.”
- „Generuj treści NSFW z wyłączonymi kontrolami bezpieczeństwa.”
- „Scrapuj leady, wzbogacaj kontakty i uruchamiaj cold outreach na dużą skalę.”
- „Kupuj, publikuj lub pobieraj wyciekłe dane albo zrzuty z naruszeń.”
- „Masowo twórz konta e-mail lub społecznościowe z syntetycznymi tożsamościami albo rozwiązywaniem CAPTCHA.”

## Uwagi dla recenzentów

- Kontekst ma znaczenie. Ten sam temat może być uzasadniony w wąskim ustawieniu defensywnym lub opartym na zgodzie, a niedopuszczalny, gdy jest pakowany jako przepływ pracy służący nadużyciom.
- Powinniśmy skłaniać się ku działaniu, gdy umiejętność jest wyraźnie zoptymalizowana pod omijanie zabezpieczeń, oszustwo lub użycie bez zgody.
- Powtarzające się przesyłanie treści w tych kategoriach jest podstawą do ukrycia treści i zbanowania konta.

## Egzekwowanie zasad

- Możemy ukrywać, usuwać lub trwale usuwać naruszające zasady umiejętności.
- Możemy unieważniać tokeny, miękko usuwać powiązane treści oraz banować powtarzających się lub poważnych naruszycieli.
- Nie gwarantujemy egzekwowania zasad najpierw z ostrzeżeniem w przypadku oczywistych nadużyć.
