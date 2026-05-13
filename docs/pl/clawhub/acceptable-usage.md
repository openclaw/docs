---
read_when:
    - Sprawdzanie przesłanych plików pod kątem nadużyć lub naruszeń zasad
    - Pisanie dokumentacji moderacji lub instrukcji operacyjnych dla recenzentów
    - Decydowanie, czy umiejętność powinna zostać ukryta, czy użytkownik zablokowany
summary: 'Polityka marketplace: co ClawHub dopuszcza i czego nie będzie hostować.'
x-i18n:
    generated_at: "2026-05-13T04:18:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Dopuszczalne użycie

Ta strona opisuje rodzaje umiejętności i treści, które są akceptowalne w ClawHub, oraz przepływy nadużyć, których ClawHub nie będzie hostować.

Te reguły są celowo praktyczne. Najbardziej zależy nam na kompletnych przepływach nadużyć, a nie tylko na odizolowanych słowach kluczowych. Jeśli umiejętność jest zbudowana po to, aby obchodzić zabezpieczenia, nadużywać platform, oszukiwać ludzi, naruszać prywatność lub umożliwiać zachowania bez zgody, nie ma dla niej miejsca w ClawHub.

## Najnowsze wzorce, które wyraźnie akceptujemy

- Prace frontendowe i nad systemami projektowymi, które używają rzeczywistych komponentów, tokenów semantycznych, dostępnych stanów oraz przetestowanych przepływów użytkownika.
- Kompozycje shadcn/ui używające zainstalowanych komponentów źródłowych, aliasów projektu i udokumentowanych wariantów zamiast jednorazowego znacznika.
- Konwersja UI5 z JavaScript na TypeScript, która zachowuje komentarze, używa konkretnych typów UI5 i utrzymuje wygenerowane interfejsy kontrolek w stanie możliwym do przeglądu.
- Defensywny przegląd bezpieczeństwa, narzędzia moderacji i prompty do wykrywania nadużyć, które pokazują dowody i jasno utrzymują granice zatwierdzania przez człowieka.
- Automatyzacja przepływów pracy oparta na zgodzie dla kont osobistych lub zespołowych z jawnymi poświadczeniami, przejrzystą konfiguracją oraz trybami próbnego uruchomienia lub podglądu.
- Dokumentacja, runbooki migracji, narzędzia deweloperskie i fikstury testowe ograniczone do oprogramowania, które wspierają.

## Niedozwolone

- Przepływy obchodzenia zabezpieczeń lub nieautoryzowanego dostępu.
  - Przykłady: obchodzenie uwierzytelniania, przejęcie konta, obchodzenie CAPTCHA, omijanie Cloudflare lub zabezpieczeń przed botami, obchodzenie limitów szybkości, ukryte scrapowanie zaprojektowane w celu pokonania zabezpieczeń, przejmowanie połączeń na żywo lub agentów, kradzież sesji wielokrotnego użytku, automatyczne zatwierdzanie przepływów parowania dla niezatwierdzonych użytkowników.

- Nadużywanie platform i obchodzenie banów.
  - Przykłady: ukryte konta po banach, rozgrzewanie/farmienie kont, fałszywe zaangażowanie, budowanie karmy lub obserwujących, automatyzacja wielu kont, masowe publikowanie, boty spamujące, automatyzacja marketplace lub społecznościowa zbudowana w celu uniknięcia wykrycia.

- Oszustwa, scamy i zwodnicze przepływy finansowe.
  - Przykłady: fałszywe certyfikaty, fałszywe faktury, zwodnicze przepływy płatności, outreach scamowy, fałszywy dowód społeczny, narzędzia umożliwiające wydawanie lub pobieranie opłat bez jasnej zgody człowieka i przejrzystych kontroli albo przepływy syntetycznej tożsamości zbudowane do tworzenia kont na potrzeby oszustw.

- Naruszające prywatność scrapowanie, wzbogacanie danych lub nadzór.
  - Przykłady: scrapowanie danych kontaktowych na dużą skalę na potrzeby spamu, doxxing, stalking, pozyskiwanie leadów połączone z niechcianym outreach, potajemne monitorowanie, wyszukiwanie twarzy lub dopasowywanie biometryczne używane bez jasnej zgody albo kupowanie, publikowanie, pobieranie lub operacjonalizowanie wyciekłych danych lub zrzutów z naruszeń.

- Podszywanie się bez zgody lub zwodnicza manipulacja tożsamością.
  - Przykłady: podmiana twarzy, cyfrowe bliźniaki, fałszywe persony, sklonowani influencerzy lub inne narzędzia manipulacji tożsamością używane do podszywania się lub wprowadzania w błąd.

- Jawne treści seksualne i generowanie treści dla dorosłych z wyłączonymi zabezpieczeniami.
  - Przykłady: generowanie obrazów/wideo/treści NSFW, wrappery treści dla dorosłych wokół API firm trzecich albo umiejętności, których głównym celem są jawne treści seksualne.

- Ukryte, niebezpieczne lub mylące wymagania wykonawcze.
  - Przykłady: zaciemnione polecenia instalacji, `curl | sh`, nieujawnione wymagania dotyczące sekretów, nieujawnione użycie klucza prywatnego, zdalne wykonanie `npx @latest` bez jasnej możliwości przeglądu, mylące metadane ukrywające, czego umiejętność naprawdę potrzebuje do działania.

## Najnowsze wzorce, których wyraźnie nie akceptujemy

- „Twórz ukryte konta sprzedawców po banach na marketplace”.
- „Zmodyfikuj parowanie Telegram tak, aby niezatwierdzeni użytkownicy automatycznie otrzymywali kody parowania”.
- „Rozwijaj konta Reddit/Twitter za pomocą niewykrywalnej automatyzacji”.
- „Generuj profesjonalne certyfikaty lub faktury do dowolnego użycia”.
- „Generuj treści NSFW z wyłączonymi kontrolami bezpieczeństwa”.
- „Scrapuj leady, wzbogacaj kontakty i uruchamiaj cold outreach na dużą skalę”.
- „Kupuj, publikuj lub pobieraj wyciekłe dane albo zrzuty z naruszeń”.
- „Masowo twórz konta e-mail lub społecznościowe z syntetycznymi tożsamościami albo rozwiązywaniem CAPTCHA”.

## Uwagi dla recenzentów

- Kontekst ma znaczenie. Ten sam temat może być uzasadniony w wąskim, defensywnym lub opartym na zgodzie zastosowaniu i niedopuszczalny, gdy jest zapakowany jako przepływ nadużycia.
- Powinniśmy skłaniać się ku działaniu, gdy umiejętność jest wyraźnie zoptymalizowana pod kątem obchodzenia zabezpieczeń, oszustwa lub użycia bez zgody.
- Powtarzające się przesyłanie treści w tych kategoriach stanowi podstawę do ukrywania treści i banowania konta.

## Egzekwowanie zasad

- Możemy ukrywać, usuwać lub trwale usuwać naruszające zasady umiejętności.
- Możemy unieważniać tokeny, miękko usuwać powiązane treści oraz banować powtarzających się lub poważnych naruszycieli.
- Nie gwarantujemy egzekwowania zasad z uprzednim ostrzeżeniem w przypadku oczywistych nadużyć.
