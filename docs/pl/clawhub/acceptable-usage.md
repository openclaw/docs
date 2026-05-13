---
read_when:
    - Sprawdzanie przesłanych plików pod kątem nadużyć lub naruszeń zasad
    - Pisanie dokumentacji moderacji lub procedur operacyjnych dla recenzentów
    - Podejmowanie decyzji, czy umiejętność powinna zostać ukryta, czy użytkownik zablokowany
summary: 'Zasady sklepu: co ClawHub dopuszcza i czego nie będzie hostować.'
x-i18n:
    generated_at: "2026-05-13T02:51:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Dopuszczalne użycie

Ta strona opisuje rodzaje umiejętności i treści, które ClawHub akceptuje, oraz nadużyciowe przepływy pracy, których nie będzie hostować.

Te reguły są celowo praktyczne. Najbardziej interesują nas kompleksowe przepływy pracy służące nadużyciom, a nie tylko pojedyncze słowa kluczowe. Jeśli umiejętność została zbudowana po to, aby obchodzić zabezpieczenia, nadużywać platform, oszukiwać ludzi, naruszać prywatność lub umożliwiać działania bez zgody, nie ma dla niej miejsca w ClawHub.

## Najnowsze wzorce, które wyraźnie akceptujemy

- Prace frontendowe i nad systemami projektowymi, które używają prawdziwych komponentów, tokenów semantycznych, stanów dostępności oraz przetestowanych przepływów użytkownika.
- Kompozycja shadcn/ui używająca zainstalowanych komponentów źródłowych, aliasów projektu i udokumentowanych wariantów zamiast jednorazowego znacznika.
- Konwersja UI5 z JavaScriptu na TypeScript, która zachowuje komentarze, używa konkretnych typów UI5 i utrzymuje wygenerowane interfejsy kontrolek w formie możliwej do przeglądu.
- Defensywny przegląd bezpieczeństwa, narzędzia moderacyjne i prompty do wykrywania nadużyć, które pokazują dowody i jasno utrzymują granice zatwierdzania przez człowieka.
- Automatyzacja przepływów pracy oparta na zgodzie dla kont osobistych lub zespołowych, z jawnymi poświadczeniami, przejrzystą konfiguracją oraz trybami dry-run lub podglądu.
- Dokumentacja, runbooki migracji, narzędzia deweloperskie i fixture’y testowe ograniczone do oprogramowania, które wspierają.

## Niedozwolone

- Przepływy pracy obchodzące zabezpieczenia lub zapewniające nieautoryzowany dostęp.
  - Przykłady: obejście uwierzytelniania, przejęcie konta, obejście CAPTCHA, omijanie Cloudflare lub zabezpieczeń antybotowych, obejście limitów szybkości, ukryte scrapowanie zaprojektowane do pokonywania zabezpieczeń, przejęcie połączenia na żywo lub agenta, wielokrotne wykorzystywanie skradzionych sesji, automatyczne zatwierdzanie przepływów parowania dla niezatwierdzonych użytkowników.

- Nadużycia platform i obchodzenie banów.
  - Przykłady: ukryte konta po banach, rozgrzewanie/farmienie kont, fałszywe zaangażowanie, budowanie karmy lub obserwujących, automatyzacja wielu kont, masowe publikowanie, boty spamujące, automatyzacja marketplace’ów lub mediów społecznościowych zbudowana w celu uniknięcia wykrycia.

- Oszustwa, wyłudzenia i zwodnicze przepływy finansowe.
  - Przykłady: fałszywe certyfikaty, fałszywe faktury, zwodnicze przepływy płatności, outreach oszustw, fałszywy dowód społeczny, narzędzia umożliwiające wydawanie środków lub naliczanie opłat bez jasnej zgody człowieka i przejrzystych mechanizmów kontroli albo przepływy pracy z tożsamościami syntetycznymi tworzone do zakładania kont w celu oszustwa.

- Inwazyjne wobec prywatności scrapowanie, wzbogacanie danych lub nadzór.
  - Przykłady: scrapowanie danych kontaktowych na dużą skalę w celu spamu, doxxing, stalking, pozyskiwanie leadów połączone z niezamówionym outreach’em, ukryte monitorowanie, wyszukiwanie twarzy lub dopasowywanie biometryczne używane bez jasnej zgody albo kupowanie, publikowanie, pobieranie lub operacjonalizacja wyciekłych danych bądź zrzutów z naruszeń.

- Podszywanie się bez zgody lub zwodnicza manipulacja tożsamością.
  - Przykłady: zamiana twarzy, cyfrowe bliźniaki, fałszywe persony, sklonowani influencerzy lub inne narzędzia do manipulacji tożsamością używane do podszywania się lub wprowadzania w błąd.

- Jawne treści seksualne i generowanie treści dla dorosłych z wyłączonymi zabezpieczeniami.
  - Przykłady: generowanie obrazów/wideo/treści NSFW, wrappery treści dla dorosłych wokół API podmiotów trzecich albo umiejętności, których głównym celem są jawne treści seksualne.

- Ukryte, niebezpieczne lub wprowadzające w błąd wymagania wykonania.
  - Przykłady: zaciemnione polecenia instalacji, `curl | sh`, niezadeklarowane wymagania dotyczące sekretów, niezadeklarowane użycie klucza prywatnego, zdalne wykonanie `npx @latest` bez jasnej możliwości przeglądu, wprowadzające w błąd metadane ukrywające, czego umiejętność naprawdę potrzebuje do uruchomienia.

## Najnowsze wzorce, których wyraźnie nie akceptujemy

- „Twórz ukryte konta sprzedawców po banach na marketplace’ach”.
- „Zmodyfikuj parowanie Telegram, aby niezatwierdzeni użytkownicy automatycznie otrzymywali kody parowania”.
- „Rozwijaj konta Reddit/Twitter za pomocą niewykrywalnej automatyzacji”.
- „Generuj profesjonalne certyfikaty lub faktury do dowolnego użycia”.
- „Generuj treści NSFW z wyłączonymi kontrolami bezpieczeństwa”.
- „Scrapuj leady, wzbogacaj kontakty i uruchamiaj cold outreach na dużą skalę”.
- „Kupuj, publikuj lub pobieraj wyciekłe dane albo zrzuty z naruszeń”.
- „Masowo twórz konta e-mail lub społecznościowe z tożsamościami syntetycznymi albo rozwiązywaniem CAPTCHA”.

## Uwagi dla recenzentów

- Kontekst ma znaczenie. Ten sam temat może być uzasadniony w wąskim defensywnym lub opartym na zgodzie zastosowaniu i niedopuszczalny, gdy jest opakowany jako przepływ pracy służący nadużyciom.
- Powinniśmy skłaniać się ku działaniu, gdy umiejętność jest wyraźnie zoptymalizowana pod kątem obchodzenia zabezpieczeń, zwodzenia lub użycia bez zgody.
- Powtarzające się przesyłanie treści w tych kategoriach jest podstawą do ukrycia treści i zbanowania konta.

## Egzekwowanie zasad

- Możemy ukrywać, usuwać lub trwale usuwać naruszające zasady umiejętności.
- Możemy unieważniać tokeny, miękko usuwać powiązane treści i banować powtarzających się lub poważnych naruszycieli.
- W przypadku oczywistych nadużyć nie gwarantujemy egzekwowania zasad najpierw z ostrzeżeniem.
