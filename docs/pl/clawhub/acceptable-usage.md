---
read_when:
    - Sprawdzanie przesłanych plików pod kątem nadużyć lub naruszeń zasad
    - Pisanie dokumentacji moderacji lub procedur operacyjnych dla recenzentów
    - Decydowanie, czy umiejętność powinna zostać ukryta, czy użytkownik zbanowany
summary: 'Polityka katalogu: co ClawHub dopuszcza i czego nie będzie udostępniać.'
x-i18n:
    generated_at: "2026-05-13T05:32:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Dopuszczalne użycie

Ta strona opisuje rodzaje umiejętności i treści akceptowane przez ClawHub oraz przepływy nadużyć, których nie będzie hostować.

Te reguły są celowo praktyczne. Najbardziej zależy nam na kompletnych przepływach nadużyć, a nie tylko na odizolowanych słowach kluczowych. Jeśli umiejętność jest zbudowana po to, by omijać zabezpieczenia, nadużywać platform, oszukiwać ludzi, naruszać prywatność albo umożliwiać zachowania bez zgody, nie należy do ClawHub.

## Najnowsze wzorce, które wyraźnie akceptujemy

- Prace frontendowe i nad systemami projektowymi, które używają rzeczywistych komponentów, tokenów semantycznych, dostępnych stanów i przetestowanych przepływów użytkownika.
- Kompozycje shadcn/ui, które używają zainstalowanych komponentów źródłowych, aliasów projektu i udokumentowanych wariantów zamiast jednorazowego znaczników.
- Konwersje UI5 z JavaScriptu na TypeScript, które zachowują komentarze, używają konkretnych typów UI5 i utrzymują wygenerowane interfejsy kontrolek w formie możliwej do przeglądu.
- Defensywne przeglądy bezpieczeństwa, narzędzia moderacyjne i prompty do wykrywania nadużyć, które pokazują dowody i jasno utrzymują granice ludzkiej akceptacji.
- Automatyzację przepływów opartą na zgodzie dla kont osobistych lub zespołowych, z wyraźnymi danymi uwierzytelniającymi, przejrzystą konfiguracją oraz trybami próbnymi lub podglądu.
- Dokumentację, runbooki migracji, narzędzia deweloperskie i fixtures testowe ograniczone do oprogramowania, które wspierają.

## Nieakceptowalne

- Przepływy omijania zabezpieczeń lub nieautoryzowanego dostępu.
  - Przykłady: omijanie uwierzytelniania, przejęcie konta, omijanie CAPTCHA, omijanie Cloudflare lub zabezpieczeń antybotowych, omijanie limitów szybkości, skryte scrapowanie zaprojektowane do pokonywania zabezpieczeń, przejęcie rozmowy na żywo lub agenta, kradzież sesji wielokrotnego użytku, automatyczne zatwierdzanie przepływów parowania dla niezatwierdzonych użytkowników.

- Nadużycia platform i omijanie blokad.
  - Przykłady: skryte konta po blokadach, rozgrzewanie lub farmienie kont, fałszywe zaangażowanie, budowanie karmy lub obserwujących, automatyzacja wielu kont, masowe publikowanie, boty spamujące, automatyzacja marketplace lub społecznościowa zbudowana w celu uniknięcia wykrycia.

- Oszustwa, wyłudzenia i zwodnicze przepływy finansowe.
  - Przykłady: fałszywe certyfikaty, fałszywe faktury, zwodnicze przepływy płatności, kontaktowanie się w celu oszustwa, fałszywy dowód społeczny, narzędzia umożliwiające wydawanie lub pobieranie opłat bez jasnej ludzkiej akceptacji i przejrzystych kontroli albo przepływy syntetycznej tożsamości zbudowane do tworzenia kont w celu oszustwa.

- Scrapowanie, wzbogacanie danych lub nadzór naruszające prywatność.
  - Przykłady: scrapowanie danych kontaktowych na dużą skalę na potrzeby spamu, doxxing, stalking, ekstrakcja leadów połączona z niezamówionym kontaktem, ukryte monitorowanie, wyszukiwanie twarzy lub dopasowywanie biometryczne używane bez jasnej zgody albo kupowanie, publikowanie, pobieranie lub operacjonalizowanie wyciekłych danych lub zrzutów z naruszeń.

- Podszywanie się bez zgody lub zwodnicza manipulacja tożsamością.
  - Przykłady: podmiana twarzy, cyfrowe bliźniaki, fałszywe persony, sklonowani influencerzy lub inne narzędzia do manipulacji tożsamością używane do podszywania się lub wprowadzania w błąd.

- Jawne treści seksualne i generowanie treści dla dorosłych z wyłączonymi zabezpieczeniami.
  - Przykłady: generowanie obrazów/wideo/treści NSFW, wrappery treści dla dorosłych wokół API firm trzecich albo umiejętności, których głównym celem są jawne treści seksualne.

- Ukryte, niebezpieczne lub wprowadzające w błąd wymagania wykonania.
  - Przykłady: zaciemnione polecenia instalacji, `curl | sh`, nieujawnione wymagania dotyczące sekretów, nieujawnione użycie kluczy prywatnych, zdalne wykonywanie `npx @latest` bez jasnej możliwości przeglądu, mylące metadane ukrywające, czego umiejętność naprawdę potrzebuje do działania.

## Najnowsze wzorce, których wyraźnie nie akceptujemy

- „Twórz skryte konta sprzedawców po blokadach w marketplace”.
- „Zmodyfikuj parowanie Telegram, aby niezatwierdzeni użytkownicy automatycznie otrzymywali kody parowania”.
- „Rozwijaj konta Reddit/Twitter za pomocą niewykrywalnej automatyzacji”.
- „Generuj profesjonalne certyfikaty lub faktury do dowolnego użycia”.
- „Generuj treści NSFW z wyłączonymi kontrolami bezpieczeństwa”.
- „Scrapuj leady, wzbogacaj kontakty i uruchamiaj masowy zimny outreach”.
- „Kupuj, publikuj lub pobieraj wyciekłe dane albo zrzuty z naruszeń”.
- „Masowo twórz konta e-mail lub społecznościowe z syntetycznymi tożsamościami albo rozwiązywaniem CAPTCHA”.

## Uwagi dla recenzentów

- Kontekst ma znaczenie. Ten sam temat może być uzasadniony w wąskim defensywnym lub opartym na zgodzie zastosowaniu i nieakceptowalny, gdy jest opakowany jako przepływ nadużyć.
- Powinniśmy skłaniać się ku działaniu, gdy umiejętność jest wyraźnie zoptymalizowana pod kątem omijania zabezpieczeń, zwodzenia lub użycia bez zgody.
- Powtarzające się przesyłanie treści w tych kategoriach stanowi podstawę do ukrycia treści i zablokowania konta.

## Egzekwowanie

- Możemy ukrywać, usuwać lub trwale usuwać naruszające zasady umiejętności.
- Możemy unieważniać tokeny, miękko usuwać powiązane treści oraz blokować powtarzających się lub poważnych sprawców naruszeń.
- Nie gwarantujemy egzekwowania zasad z wcześniejszym ostrzeżeniem w przypadku oczywistych nadużyć.
