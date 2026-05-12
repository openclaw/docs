---
read_when:
    - Sprawdzanie przesłanych materiałów pod kątem nadużyć lub naruszeń zasad
    - Pisanie dokumentacji moderacji lub podręczników operacyjnych dla recenzentów
    - Decydowanie, czy ukryć umiejętność, czy zablokować użytkownika
summary: 'Zasady marketplace: co ClawHub dopuszcza i czego nie będzie hostować.'
x-i18n:
    generated_at: "2026-05-12T00:56:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Dopuszczalne użycie

Ta strona opisuje rodzaje umiejętności i treści, które ClawHub akceptuje, oraz przepływy nadużyć, których nie będzie hostować.

Te zasady są celowo praktyczne. Najbardziej zależy nam na całościowych przepływach nadużyć, a nie tylko na pojedynczych słowach kluczowych. Jeśli umiejętność jest zbudowana po to, aby omijać zabezpieczenia, nadużywać platform, oszukiwać ludzi, naruszać prywatność lub umożliwiać zachowania bez zgody, nie należy do ClawHub.

## Najnowsze wzorce, które wyraźnie akceptujemy

- Prace frontendowe i nad systemami projektowymi, które używają rzeczywistych komponentów, tokenów semantycznych, dostępnych stanów i przetestowanych przepływów użytkownika.
- Kompozycje shadcn/ui, które używają zainstalowanych komponentów źródłowych, aliasów projektu i udokumentowanych wariantów zamiast jednorazowego markupu.
- Konwersja UI5 z JavaScript na TypeScript, która zachowuje komentarze, używa konkretnych typów UI5 i utrzymuje wygenerowane interfejsy kontrolek w formie możliwej do przeglądu.
- Defensywny przegląd bezpieczeństwa, narzędzia moderacyjne i prompty do wykrywania nadużyć, które pokazują dowody i jasno utrzymują granice zatwierdzania przez człowieka.
- Automatyzacja przepływów oparta na zgodzie dla kont osobistych lub zespołowych, z wyraźnymi poświadczeniami, przejrzystą konfiguracją oraz trybami próbnymi lub podglądu.
- Dokumentacja, instrukcje migracji, narzędzia deweloperskie i fikstury testowe ograniczone do oprogramowania, które wspierają.

## Niedozwolone

- Przepływy omijania zabezpieczeń lub nieautoryzowanego dostępu.
  - Przykłady: omijanie uwierzytelniania, przejęcie konta, omijanie CAPTCHA, omijanie Cloudflare lub zabezpieczeń antybotowych, omijanie limitów częstotliwości, ukryte scrapowanie zaprojektowane w celu pokonania zabezpieczeń, przejęcie połączenia na żywo lub agenta, kradzież sesji wielokrotnego użytku, automatyczne zatwierdzanie przepływów parowania dla niezatwierdzonych użytkowników.

- Nadużywanie platform i omijanie banów.
  - Przykłady: ukryte konta po banach, rozgrzewanie lub farmienie kont, fałszywe zaangażowanie, budowanie karmy lub obserwujących, automatyzacja wielu kont, masowe publikowanie, boty spamujące, automatyzacja marketplace’ów lub serwisów społecznościowych zbudowana tak, aby unikać wykrycia.

- Oszustwa, wyłudzenia i zwodnicze przepływy finansowe.
  - Przykłady: fałszywe certyfikaty, fałszywe faktury, zwodnicze przepływy płatności, oszukańcze działania kontaktowe, fałszywy dowód społeczny, narzędzia umożliwiające wydawanie środków lub naliczanie opłat bez jasnej zgody człowieka i przejrzystych kontroli albo przepływy syntetycznej tożsamości zbudowane w celu tworzenia kont do oszustw.

- Inwazyjne dla prywatności scrapowanie, wzbogacanie danych lub nadzór.
  - Przykłady: scrapowanie danych kontaktowych na dużą skalę do spamu, doxxing, stalking, ekstrakcja leadów połączona z niezamówionymi działaniami kontaktowymi, ukryte monitorowanie, wyszukiwanie twarzy lub dopasowywanie biometryczne używane bez jasnej zgody albo kupowanie, publikowanie, pobieranie lub operacjonalizowanie wyciekłych danych lub zrzutów z naruszeń.

- Podszywanie się bez zgody lub zwodnicza manipulacja tożsamością.
  - Przykłady: podmiana twarzy, cyfrowe bliźniaki, fałszywe persony, sklonowani influencerzy lub inne narzędzia do manipulacji tożsamością używane do podszywania się lub wprowadzania w błąd.

- Jawne treści seksualne i generowanie treści dla dorosłych z wyłączonymi zabezpieczeniami.
  - Przykłady: generowanie obrazów, wideo lub treści NSFW, nakładki treści dla dorosłych na API firm trzecich albo umiejętności, których głównym celem są jawne treści seksualne.

- Ukryte, niebezpieczne lub mylące wymagania wykonania.
  - Przykłady: zaciemnione polecenia instalacji, `curl | sh`, nieujawnione wymagania dotyczące sekretów, nieujawnione użycie klucza prywatnego, zdalne wykonanie `npx @latest` bez jasnej możliwości przeglądu, mylące metadane ukrywające, czego umiejętność naprawdę potrzebuje do uruchomienia.

## Najnowsze wzorce, których wyraźnie nie akceptujemy

- „Twórz ukryte konta sprzedawców po banach na marketplace’ach.”
- „Zmodyfikuj parowanie Telegram tak, aby niezatwierdzeni użytkownicy automatycznie otrzymywali kody parowania.”
- „Rozwijaj konta Reddit/Twitter za pomocą niewykrywalnej automatyzacji.”
- „Generuj profesjonalne certyfikaty lub faktury do dowolnego użycia.”
- „Generuj treści NSFW z wyłączonymi kontrolami bezpieczeństwa.”
- „Scrapuj leady, wzbogacaj kontakty i uruchamiaj zimne działania kontaktowe na dużą skalę.”
- „Kupuj, publikuj lub pobieraj wyciekłe dane albo zrzuty z naruszeń.”
- „Masowo twórz konta e-mail lub społecznościowe z syntetycznymi tożsamościami albo rozwiązywaniem CAPTCHA.”

## Uwagi dla recenzentów

- Kontekst ma znaczenie. Ten sam temat może być uzasadniony w wąskim ustawieniu defensywnym lub opartym na zgodzie i niedopuszczalny, gdy jest opakowany jako przepływ nadużyć.
- Powinniśmy skłaniać się ku działaniu, gdy umiejętność jest wyraźnie zoptymalizowana pod kątem omijania, oszustwa lub użycia bez zgody.
- Powtarzające się przesyłanie treści w tych kategoriach stanowi podstawę do ukrycia treści i zbanowania konta.

## Egzekwowanie zasad

- Możemy ukrywać, usuwać lub trwale usuwać naruszające zasady umiejętności.
- Możemy unieważniać tokeny, miękko usuwać powiązane treści oraz banować powtarzających się lub poważnych naruszycieli.
- Nie gwarantujemy egzekwowania zasad najpierw z ostrzeżeniem w przypadku oczywistych nadużyć.
