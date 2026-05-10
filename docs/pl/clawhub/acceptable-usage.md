---
read_when:
    - Sprawdzanie przesłanych materiałów pod kątem nadużyć lub naruszeń zasad
    - Pisanie dokumentacji moderacji lub procedur operacyjnych dla recenzentów
    - Ustalanie, czy umiejętność powinna zostać ukryta, czy użytkownik zablokowany
summary: 'Zasady katalogu: co ClawHub dopuszcza i czego nie będzie hostować.'
x-i18n:
    generated_at: "2026-05-10T19:25:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Dopuszczalne użycie

Ta strona opisuje rodzaje umiejętności i treści akceptowanych przez ClawHub oraz schematy nadużyć, których nie będzie hostować.

Te zasady są celowo praktyczne. Najbardziej zależy nam na pełnych schematach nadużyć, a nie tylko na pojedynczych słowach kluczowych. Jeśli umiejętność jest zbudowana po to, aby omijać zabezpieczenia, nadużywać platform, oszukiwać ludzi, naruszać prywatność lub umożliwiać działania bez zgody, nie należy do ClawHub.

## Najnowsze wzorce, które wyraźnie akceptujemy

- Prace frontendowe i nad systemami projektowymi, które używają rzeczywistych komponentów, tokenów semantycznych, dostępnych stanów i przetestowanych przepływów użytkownika.
- Kompozycje shadcn/ui, które używają zainstalowanych komponentów źródłowych, aliasów projektu i udokumentowanych wariantów zamiast jednorazowego markupu.
- Konwersje UI5 z JavaScript na TypeScript, które zachowują komentarze, używają konkretnych typów UI5 i utrzymują wygenerowane interfejsy kontrolek w formie możliwej do przeglądu.
- Defensywne przeglądy bezpieczeństwa, narzędzia moderacyjne i prompty do wykrywania nadużyć, które pokazują dowody i jasno utrzymują granice zatwierdzania przez człowieka.
- Automatyzacja przepływów pracy oparta na zgodzie dla kont osobistych lub zespołowych, z jawnymi poświadczeniami, przejrzystą konfiguracją oraz trybami próbnego uruchomienia lub podglądu.
- Dokumentacja, runbooki migracji, narzędzia deweloperskie i fixture’y testowe ograniczone do oprogramowania, które wspierają.

## Niedozwolone

- Schematy obchodzenia zabezpieczeń lub nieautoryzowanego dostępu.
  - Przykłady: obejście uwierzytelniania, przejęcie konta, obejście CAPTCHA, unikanie Cloudflare lub zabezpieczeń antybotowych, obejście limitów szybkości, ukryte scrapowanie zaprojektowane do pokonywania zabezpieczeń, przejęcie połączenia na żywo lub agenta, kradzież sesji wielokrotnego użytku, automatyczne zatwierdzanie przepływów parowania dla niezatwierdzonych użytkowników.

- Nadużycia platform i obchodzenie banów.
  - Przykłady: ukryte konta po banach, rozgrzewanie lub farmienie kont, fałszywe zaangażowanie, budowanie karmy lub obserwujących, automatyzacja wielu kont, masowe publikowanie, boty spamujące, automatyzacja marketplace’ów lub mediów społecznościowych zbudowana w celu uniknięcia wykrycia.

- Oszustwa, scamy i zwodnicze przepływy finansowe.
  - Przykłady: fałszywe certyfikaty, fałszywe faktury, zwodnicze przepływy płatności, scamerski outreach, fałszywy dowód społeczny, narzędzia umożliwiające wydawanie pieniędzy lub obciążanie bez jasnego zatwierdzenia przez człowieka i przejrzystych kontroli albo przepływy syntetycznej tożsamości zbudowane do tworzenia kont na potrzeby oszustw.

- Scrapowanie, wzbogacanie danych lub nadzór naruszające prywatność.
  - Przykłady: scrapowanie danych kontaktowych na dużą skalę do spamu, doxxing, stalking, pozyskiwanie leadów połączone z niezamówionym outreachem, ukryte monitorowanie, wyszukiwanie twarzy lub dopasowanie biometryczne używane bez wyraźnej zgody albo kupowanie, publikowanie, pobieranie lub operacjonalizowanie wyciekłych danych bądź zrzutów z naruszeń bezpieczeństwa.

- Podszywanie się bez zgody lub zwodnicza manipulacja tożsamością.
  - Przykłady: zamiana twarzy, cyfrowe bliźniaki, fałszywe persony, sklonowani influencerzy albo inne narzędzia manipulacji tożsamością używane do podszywania się lub wprowadzania w błąd.

- Treści jednoznacznie seksualne i generowanie treści dla dorosłych z wyłączonymi zabezpieczeniami.
  - Przykłady: generowanie obrazów, wideo lub treści NSFW, wrappery treści dla dorosłych wokół API stron trzecich albo umiejętności, których głównym celem są treści jednoznacznie seksualne.

- Ukryte, niebezpieczne lub mylące wymagania dotyczące uruchamiania.
  - Przykłady: zaciemnione polecenia instalacyjne, `curl | sh`, niezadeklarowane wymagania dotyczące sekretów, niezadeklarowane użycie klucza prywatnego, zdalne wykonanie `npx @latest` bez jasnej możliwości przeglądu, mylące metadane ukrywające, czego umiejętność naprawdę potrzebuje do działania.

## Najnowsze wzorce, których wyraźnie nie akceptujemy

- „Tworzenie ukrytych kont sprzedawców po banach na marketplace’ach.”
- „Modyfikowanie parowania Telegram tak, aby niezatwierdzeni użytkownicy automatycznie otrzymywali kody parowania.”
- „Rozwijanie kont Reddit/Twitter za pomocą niewykrywalnej automatyzacji.”
- „Generowanie profesjonalnych certyfikatów lub faktur do dowolnego użycia.”
- „Generowanie treści NSFW z wyłączonymi kontrolami bezpieczeństwa.”
- „Scrapowanie leadów, wzbogacanie kontaktów i uruchamianie cold outreachu na dużą skalę.”
- „Kupowanie, publikowanie lub pobieranie wyciekłych danych bądź zrzutów z naruszeń bezpieczeństwa.”
- „Masowe tworzenie kont e-mail lub społecznościowych z syntetycznymi tożsamościami albo rozwiązywaniem CAPTCHA.”

## Uwagi dla recenzentów

- Kontekst ma znaczenie. Ten sam temat może być uzasadniony w wąskim ustawieniu defensywnym lub opartym na zgodzie, a niedopuszczalny, gdy jest spakowany jako schemat nadużycia.
- Powinniśmy skłaniać się ku działaniu, gdy umiejętność jest wyraźnie zoptymalizowana pod kątem unikania zabezpieczeń, oszustwa lub użycia bez zgody.
- Powtarzające się przesyłanie treści w tych kategoriach stanowi podstawę do ukrycia treści i zbanowania konta.

## Egzekwowanie zasad

- Możemy ukrywać, usuwać lub trwale usuwać naruszające zasady umiejętności.
- Możemy unieważniać tokeny, miękko usuwać powiązane treści i banować powtarzających się lub poważnych naruszycieli.
- Nie gwarantujemy egzekwowania zasad z wcześniejszym ostrzeżeniem w przypadku oczywistych nadużyć.
