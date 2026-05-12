---
read_when:
    - Sprawdzanie przesłanych plików pod kątem nadużyć lub naruszeń zasad
    - Pisanie dokumentacji dotyczącej moderacji lub instrukcji operacyjnych dla recenzentów
    - Decydowanie, czy ukryć umiejętność, czy zablokować użytkownika
summary: 'Zasady rynku: co ClawHub dopuszcza, a czego nie będzie hostować.'
x-i18n:
    generated_at: "2026-05-12T08:44:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Dopuszczalne użycie

Ta strona opisuje rodzaje umiejętności i treści, które ClawHub akceptuje, oraz nadużycia, których nie będzie hostować.

Te zasady są celowo praktyczne. Najbardziej zależy nam na kompletnych przepływach nadużyć, a nie tylko na pojedynczych słowach kluczowych. Jeśli umiejętność jest zbudowana do omijania zabezpieczeń, nadużywania platform, oszukiwania ludzi, naruszania prywatności lub umożliwiania działań bez zgody, nie ma dla niej miejsca w ClawHub.

## Najnowsze wzorce, które wyraźnie akceptujemy

- Prace frontendowe i nad systemami projektowymi, które używają rzeczywistych komponentów, tokenów semantycznych, dostępnych stanów i przetestowanych przepływów użytkownika.
- Kompozycja shadcn/ui, która używa zainstalowanych komponentów źródłowych, aliasów projektu i udokumentowanych wariantów zamiast jednorazowego znacznikowania.
- Konwersja UI5 z JavaScript do TypeScript, która zachowuje komentarze, używa konkretnych typów UI5 i utrzymuje wygenerowane interfejsy kontrolek w formie możliwej do przeglądu.
- Defensywny przegląd bezpieczeństwa, narzędzia moderacji i prompty do wykrywania nadużyć, które pokazują dowody i jasno utrzymują granice zatwierdzania przez człowieka.
- Automatyzacja przepływów pracy oparta na zgodzie dla kont osobistych lub zespołowych, z jawnymi poświadczeniami, przejrzystą konfiguracją oraz trybami próbnymi lub podglądu.
- Dokumentacja, runbooki migracyjne, narzędzia deweloperskie i fikstury testowe ograniczone do oprogramowania, które wspierają.

## Niedopuszczalne

- Przepływy omijania zabezpieczeń lub nieautoryzowanego dostępu.
  - Przykłady: obejście uwierzytelniania, przejęcie konta, obejście CAPTCHA, omijanie Cloudflare lub zabezpieczeń antybotowych, obejście limitów żądań, ukryte scrapowanie zaprojektowane do pokonywania zabezpieczeń, przejęcie rozmowy na żywo lub agenta, wielokrotnego użytku kradzież sesji, automatyczne zatwierdzanie przepływów parowania dla niezatwierdzonych użytkowników.

- Nadużycia platform i omijanie banów.
  - Przykłady: ukryte konta po banach, rozgrzewanie/hodowanie kont, fałszywe zaangażowanie, budowanie karmy lub obserwujących, automatyzacja wielu kont, masowe publikowanie, boty spamujące, automatyzacja marketplace'ów lub społecznościowa zbudowana w celu uniknięcia wykrycia.

- Oszustwa, wyłudzenia i zwodnicze przepływy finansowe.
  - Przykłady: fałszywe certyfikaty, fałszywe faktury, zwodnicze przepływy płatności, kontaktowanie się w celu oszustwa, fałszywy dowód społeczny, narzędzia umożliwiające wydawanie lub naliczanie opłat bez jasnej zgody człowieka i przejrzystych kontroli albo przepływy syntetycznej tożsamości stworzone do zakładania kont na potrzeby oszustw.

- Scrapowanie, wzbogacanie danych lub nadzór naruszające prywatność.
  - Przykłady: scrapowanie danych kontaktowych na dużą skalę na potrzeby spamu, doxxing, stalking, pozyskiwanie leadów połączone z niezamówionym kontaktem, ukryte monitorowanie, wyszukiwanie twarzy lub dopasowywanie biometryczne używane bez jasnej zgody albo kupowanie, publikowanie, pobieranie lub operacyjne wykorzystywanie wyciekłych danych lub zrzutów z naruszeń.

- Podszywanie się bez zgody lub zwodnicza manipulacja tożsamością.
  - Przykłady: podmiana twarzy, cyfrowe bliźniaki, fałszywe persony, sklonowani influencerzy albo inne narzędzia manipulacji tożsamością używane do podszywania się lub wprowadzania w błąd.

- Treści jednoznacznie seksualne i generowanie treści dla dorosłych z wyłączonymi zabezpieczeniami.
  - Przykłady: generowanie obrazów/wideo/treści NSFW, wrappery treści dla dorosłych wokół API firm trzecich albo umiejętności, których głównym celem są jednoznacznie seksualne treści.

- Ukryte, niebezpieczne lub wprowadzające w błąd wymagania wykonania.
  - Przykłady: zaciemnione polecenia instalacji, `curl | sh`, nieujawnione wymagania dotyczące sekretów, nieujawnione użycie klucza prywatnego, zdalne wykonanie `npx @latest` bez jasnej możliwości przeglądu, wprowadzające w błąd metadane ukrywające, czego umiejętność naprawdę potrzebuje do uruchomienia.

## Najnowsze wzorce, których wyraźnie nie akceptujemy

- „Twórz ukryte konta sprzedawców po banach na marketplace'ach.”
- „Zmodyfikuj parowanie Telegram, aby niezatwierdzeni użytkownicy automatycznie otrzymywali kody parowania.”
- „Rozwijaj konta Reddit/Twitter za pomocą niewykrywalnej automatyzacji.”
- „Generuj profesjonalne certyfikaty lub faktury do dowolnego użytku.”
- „Generuj treści NSFW z wyłączonymi kontrolami bezpieczeństwa.”
- „Scrapuj leady, wzbogacaj kontakty i uruchamiaj zimny kontakt na dużą skalę.”
- „Kupuj, publikuj lub pobieraj wyciekłe dane albo zrzuty z naruszeń.”
- „Masowo twórz konta e-mailowe lub społecznościowe z syntetycznymi tożsamościami albo rozwiązywaniem CAPTCHA.”

## Uwagi dla recenzentów

- Kontekst ma znaczenie. Ten sam temat może być zasadny w wąskim, defensywnym lub opartym na zgodzie zastosowaniu i niedopuszczalny, gdy jest opakowany jako przepływ nadużycia.
- Powinniśmy skłaniać się ku działaniu, gdy umiejętność jest wyraźnie zoptymalizowana pod kątem omijania zabezpieczeń, oszustwa lub użycia bez zgody.
- Powtarzające się przesyłanie treści w tych kategoriach stanowi podstawę do ukrycia treści i zbanowania konta.

## Egzekwowanie zasad

- Możemy ukrywać, usuwać lub trwale usuwać naruszające zasady umiejętności.
- Możemy unieważniać tokeny, miękko usuwać powiązane treści oraz banować sprawców powtarzających się lub poważnych naruszeń.
- Nie gwarantujemy egzekwowania zasady najpierw z ostrzeżeniem w przypadku oczywistych nadużyć.
