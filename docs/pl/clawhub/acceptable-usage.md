---
read_when:
    - Sprawdzanie przesłanych plików pod kątem nadużyć lub naruszeń zasad
    - Pisanie dokumentacji moderacyjnej lub instrukcji operacyjnych dla recenzentów
    - Decydowanie, czy umiejętność powinna zostać ukryta, czy użytkownik zablokowany
summary: 'Zasady Marketplace: co ClawHub dopuszcza i czego nie będzie hostować.'
x-i18n:
    generated_at: "2026-05-12T23:29:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Dopuszczalne użycie

Ta strona opisuje rodzaje umiejętności i treści, które ClawHub akceptuje, oraz procedury nadużyć, których nie będzie hostować.

Te zasady są celowo praktyczne. Najbardziej zależy nam na pełnych procedurach nadużyć, a nie tylko na pojedynczych słowach kluczowych. Jeśli umiejętność jest zbudowana do omijania zabezpieczeń, nadużywania platform, oszukiwania ludzi, naruszania prywatności lub umożliwiania zachowań bez zgody, nie należy do ClawHub.

## Najnowsze wzorce, które wyraźnie akceptujemy

- Prace nad frontendem i systemem projektowym, które używają rzeczywistych komponentów, tokenów semantycznych, dostępnych stanów i przetestowanych przepływów użytkownika.
- Kompozycja shadcn/ui, która używa zainstalowanych komponentów źródłowych, aliasów projektu i udokumentowanych wariantów zamiast jednorazowego znacznika.
- Konwersja UI5 z JavaScript na TypeScript, która zachowuje komentarze, używa konkretnych typów UI5 i utrzymuje wygenerowane interfejsy kontrolek w formie możliwej do przeglądu.
- Defensywny przegląd bezpieczeństwa, narzędzia moderacyjne i prompty do wykrywania nadużyć, które pokazują dowody i jasno wyznaczają granice zatwierdzania przez człowieka.
- Automatyzacja przepływów pracy oparta na zgodzie dla kont osobistych lub zespołowych, z wyraźnymi poświadczeniami, przejrzystą konfiguracją oraz trybami próbnego uruchomienia lub podglądu.
- Dokumentacja, procedury migracji, narzędzia deweloperskie i fikstury testowe ograniczone do oprogramowania, które wspierają.

## Niedozwolone

- Procedury omijania zabezpieczeń lub uzyskiwania nieautoryzowanego dostępu.
  - Przykłady: obejście uwierzytelniania, przejęcie konta, obejście CAPTCHA, omijanie Cloudflare lub zabezpieczeń przed botami, obchodzenie limitów żądań, ukryte scrapowanie zaprojektowane w celu pokonania zabezpieczeń, przejęcie rozmowy na żywo lub agenta, kradzież sesji wielokrotnego użytku, automatyczne zatwierdzanie przepływów parowania dla niezatwierdzonych użytkowników.

- Nadużycia platform i omijanie banów.
  - Przykłady: ukryte konta po banach, rozgrzewanie lub farmienie kont, fałszywe zaangażowanie, budowanie karmy lub obserwujących, automatyzacja wielu kont, masowe publikowanie, boty spamujące, automatyzacja marketplace’ów lub mediów społecznościowych zbudowana w celu unikania wykrycia.

- Oszustwa, wyłudzenia i zwodnicze przepływy finansowe.
  - Przykłady: fałszywe certyfikaty, fałszywe faktury, zwodnicze przepływy płatności, kontaktowanie się w celu oszustwa, fałszywy dowód społeczny, narzędzia umożliwiające wydawanie pieniędzy lub obciążanie płatnościami bez wyraźnej zgody człowieka i przejrzystych mechanizmów kontroli, albo przepływy syntetycznej tożsamości zbudowane do tworzenia kont na potrzeby oszustw.

- Inwazyjne wobec prywatności scrapowanie, wzbogacanie danych lub nadzór.
  - Przykłady: scrapowanie danych kontaktowych na dużą skalę w celu spamu, doxxing, stalking, pozyskiwanie leadów połączone z niezamówionym kontaktem, ukryte monitorowanie, wyszukiwanie twarzy lub dopasowywanie biometryczne używane bez wyraźnej zgody, albo kupowanie, publikowanie, pobieranie lub operacjonalizowanie wyciekłych danych albo zrzutów z naruszeń.

- Podszywanie się bez zgody lub zwodnicza manipulacja tożsamością.
  - Przykłady: zamiana twarzy, cyfrowe bliźniaki, fałszywe persony, sklonowani influencerzy lub inne narzędzia do manipulacji tożsamością używane do podszywania się lub wprowadzania w błąd.

- Treści jawnie seksualne i generowanie treści dla dorosłych z wyłączonymi zabezpieczeniami.
  - Przykłady: generowanie obrazów, wideo lub treści NSFW, wrappery treści dla dorosłych wokół API stron trzecich albo umiejętności, których głównym celem są jawnie seksualne treści.

- Ukryte, niebezpieczne lub mylące wymagania wykonania.
  - Przykłady: zaciemnione polecenia instalacji, `curl | sh`, niezadeklarowane wymagania dotyczące sekretów, niezadeklarowane użycie kluczy prywatnych, zdalne wykonanie `npx @latest` bez jasnej możliwości przeglądu, mylące metadane ukrywające, czego umiejętność naprawdę potrzebuje do działania.

## Najnowsze wzorce, których wyraźnie nie akceptujemy

- „Twórz ukryte konta sprzedawców po banach na marketplace’ach.”
- „Zmodyfikuj parowanie Telegram, aby niezatwierdzeni użytkownicy automatycznie otrzymywali kody parowania.”
- „Rozwijaj konta Reddit/Twitter za pomocą niewykrywalnej automatyzacji.”
- „Generuj profesjonalne certyfikaty lub faktury do dowolnego użytku.”
- „Generuj treści NSFW z wyłączonymi kontrolami bezpieczeństwa.”
- „Scrapuj leady, wzbogacaj kontakty i uruchamiaj zimny outreach na dużą skalę.”
- „Kupuj, publikuj lub pobieraj wyciekłe dane albo zrzuty z naruszeń.”
- „Masowo twórz konta e-mail lub społecznościowe z syntetycznymi tożsamościami albo rozwiązywaniem CAPTCHA.”

## Uwagi dla recenzentów

- Kontekst ma znaczenie. Ten sam temat może być uzasadniony w wąskim, defensywnym lub opartym na zgodzie zastosowaniu i niedopuszczalny, gdy jest zapakowany jako procedura nadużyć.
- Powinniśmy skłaniać się ku działaniu, gdy umiejętność jest wyraźnie zoptymalizowana pod kątem omijania zabezpieczeń, oszustwa lub użycia bez zgody.
- Wielokrotne przesyłanie treści w tych kategoriach stanowi podstawę do ukrycia treści i zbanowania konta.

## Egzekwowanie zasad

- Możemy ukrywać, usuwać lub trwale usuwać naruszające zasady umiejętności.
- Możemy unieważniać tokeny, miękko usuwać powiązane treści oraz banować osoby dopuszczające się powtarzających się lub poważnych naruszeń.
- Nie gwarantujemy egzekwowania zasad z wcześniejszym ostrzeżeniem w przypadku oczywistych nadużyć.
