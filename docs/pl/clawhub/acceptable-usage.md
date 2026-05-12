---
read_when:
    - Sprawdzanie przesłanych plików pod kątem nadużyć lub naruszeń zasad
    - Pisanie dokumentacji moderacji lub instrukcji operacyjnych dla recenzentów
    - Decydowanie, czy umiejętność powinna zostać ukryta, czy użytkownik zablokowany
summary: 'Zasady marketplace''u: co ClawHub dopuszcza i czego nie będzie hostować.'
x-i18n:
    generated_at: "2026-05-12T15:42:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Dopuszczalne użycie

Ta strona opisuje rodzaje Skills i treści akceptowane przez ClawHub oraz procesy nadużyć, których nie będzie hostować.

Te zasady są celowo praktyczne. Najbardziej zależy nam na procesach nadużyć end-to-end, a nie tylko na odizolowanych słowach kluczowych. Jeśli Skill jest zbudowany po to, by omijać zabezpieczenia, nadużywać platform, oszukiwać ludzi, naruszać prywatność lub umożliwiać działania bez zgody, nie ma miejsca w ClawHub.

## Najnowsze wzorce, które wyraźnie akceptujemy

- Praca nad frontendem i systemem projektowym wykorzystująca rzeczywiste komponenty, semantyczne tokeny, dostępne stany i przetestowane przepływy użytkownika.
- Kompozycja shadcn/ui wykorzystująca zainstalowane komponenty źródłowe, aliasy projektu i udokumentowane warianty zamiast jednorazowego znacznika.
- Konwersja UI5 z JavaScript na TypeScript, która zachowuje komentarze, używa konkretnych typów UI5 i utrzymuje wygenerowane interfejsy kontrolek w formie możliwej do przeglądu.
- Defensywny przegląd bezpieczeństwa, narzędzia moderacyjne i prompty do wykrywania nadużyć, które pokazują dowody i jasno określają granice zatwierdzania przez człowieka.
- Automatyzacja przepływów pracy oparta na zgodzie dla kont osobistych lub zespołowych, z jawnymi poświadczeniami, przejrzystą konfiguracją oraz trybami próbnego uruchomienia lub podglądu.
- Dokumentacja, instrukcje migracji, narzędzia deweloperskie i fixture testowe ograniczone do oprogramowania, które wspierają.

## Niedozwolone

- Przepływy pracy omijające zabezpieczenia lub zapewniające nieautoryzowany dostęp.
  - Przykłady: omijanie uwierzytelniania, przejmowanie kont, omijanie CAPTCHA, omijanie Cloudflare lub zabezpieczeń antybotowych, omijanie limitów szybkości, skryte scrapowanie zaprojektowane do obchodzenia zabezpieczeń, przejmowanie rozmowy na żywo lub agenta, kradzież sesji wielokrotnego użytku, automatyczne zatwierdzanie przepływów parowania dla niezatwierdzonych użytkowników.

- Nadużycia platform i obchodzenie blokad.
  - Przykłady: skryte konta po blokadach, rozgrzewanie lub farmienie kont, fałszywe zaangażowanie, pozyskiwanie karmy lub obserwujących, automatyzacja wielu kont, masowe publikowanie, boty spamujące, automatyzacja marketplace lub mediów społecznościowych zbudowana tak, by unikać wykrycia.

- Oszustwa, scamy i zwodnicze przepływy finansowe.
  - Przykłady: fałszywe certyfikaty, fałszywe faktury, zwodnicze przepływy płatności, scamerskie działania kontaktowe, fałszywy dowód społeczny, narzędzia umożliwiające wydawanie lub pobieranie pieniędzy bez jasnego zatwierdzenia przez człowieka i przejrzystych kontroli albo przepływy z syntetyczną tożsamością zbudowane do tworzenia kont w celu oszustwa.

- Inwazyjne wobec prywatności scrapowanie, wzbogacanie lub nadzór.
  - Przykłady: scrapowanie danych kontaktowych na dużą skalę do spamu, doxxing, stalking, pozyskiwanie leadów połączone z niezamówionym kontaktem, ukryte monitorowanie, wyszukiwanie twarzy lub dopasowywanie biometryczne używane bez jasnej zgody albo kupowanie, publikowanie, pobieranie lub operacjonalizowanie wyciekłych danych lub zrzutów danych z naruszeń.

- Podszywanie się bez zgody lub zwodnicza manipulacja tożsamością.
  - Przykłady: zamiana twarzy, cyfrowe bliźniaki, fałszywe persony, klonowani influencerzy lub inne narzędzia do manipulacji tożsamością używane do podszywania się lub wprowadzania w błąd.

- Wyraźne treści seksualne i generowanie treści dla dorosłych z wyłączonymi zabezpieczeniami.
  - Przykłady: generowanie obrazów/wideo/treści NSFW, wrappery treści dla dorosłych wokół API stron trzecich albo Skills, których głównym celem są wyraźne treści seksualne.

- Ukryte, niebezpieczne lub wprowadzające w błąd wymagania wykonania.
  - Przykłady: zaciemnione polecenia instalacji, `curl | sh`, nieujawnione wymagania dotyczące sekretów, nieujawnione użycie klucza prywatnego, zdalne wykonanie `npx @latest` bez jasnej możliwości przeglądu, wprowadzające w błąd metadane ukrywające, czego Skill naprawdę potrzebuje do uruchomienia.

## Najnowsze wzorce, których wyraźnie nie akceptujemy

- „Twórz skryte konta sprzedawców po blokadach w marketplace.”
- „Zmodyfikuj parowanie Telegram tak, aby niezatwierdzeni użytkownicy automatycznie otrzymywali kody parowania.”
- „Rozwijaj konta Reddit/Twitter przy użyciu niewykrywalnej automatyzacji.”
- „Generuj profesjonalne certyfikaty lub faktury do dowolnego użycia.”
- „Generuj treści NSFW z wyłączonymi kontrolami bezpieczeństwa.”
- „Scrapuj leady, wzbogacaj kontakty i uruchamiaj zimny kontakt na dużą skalę.”
- „Kupuj, publikuj lub pobieraj wyciekłe dane albo zrzuty danych z naruszeń.”
- „Masowo twórz konta e-mail lub społecznościowe przy użyciu syntetycznych tożsamości albo rozwiązywania CAPTCHA.”

## Uwagi dla recenzentów

- Kontekst ma znaczenie. Ten sam temat może być uzasadniony w wąskim środowisku defensywnym lub opartym na zgodzie i niedopuszczalny, gdy jest zapakowany jako przepływ nadużyć.
- Powinniśmy skłaniać się ku działaniu, gdy Skill jest wyraźnie zoptymalizowany pod kątem obchodzenia zabezpieczeń, oszustwa lub użycia bez zgody.
- Powtarzające się przesyłanie treści w tych kategoriach stanowi podstawę do ukrycia treści i zablokowania konta.

## Egzekwowanie zasad

- Możemy ukrywać, usuwać lub trwale usuwać naruszające zasady Skills.
- Możemy unieważniać tokeny, miękko usuwać powiązane treści i blokować powtarzających się lub poważnych naruszycieli.
- Nie gwarantujemy egzekwowania zasad z wcześniejszym ostrzeżeniem w przypadku oczywistych nadużyć.
