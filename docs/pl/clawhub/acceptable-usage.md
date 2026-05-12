---
read_when:
    - Sprawdzanie przesłanych plików pod kątem nadużyć lub naruszeń zasad
    - Pisanie dokumentacji dotyczącej moderacji lub podręczników operacyjnych dla recenzentów
    - Podejmowanie decyzji, czy ukryć umiejętność, czy zablokować użytkownika
summary: 'Zasady platformy marketplace: co ClawHub dopuszcza i czego nie będzie hostować.'
x-i18n:
    generated_at: "2026-05-12T12:49:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Akceptowalne użycie

Ta strona opisuje rodzaje Skills i treści, które są dopuszczalne w ClawHub, oraz przepływy nadużyć, których nie będzie hostować.

Te zasady są celowo praktyczne. Najbardziej zależy nam na kompletnych przepływach nadużyć, nie tylko na pojedynczych słowach kluczowych. Jeśli Skills są tworzone w celu omijania zabezpieczeń, nadużywania platform, oszukiwania ludzi, naruszania prywatności lub umożliwiania zachowań bez zgody, nie powinno ich być w ClawHub.

## Najnowsze wzorce, które wyraźnie akceptujemy

- Prace frontendowe i nad systemami projektowymi, które używają rzeczywistych komponentów, tokenów semantycznych, dostępnych stanów i przetestowanych przepływów użytkownika.
- Kompozycje shadcn/ui, które używają zainstalowanych komponentów źródłowych, aliasów projektu i udokumentowanych wariantów zamiast jednorazowego znacznika.
- Konwersja UI5 z JavaScriptu na TypeScript, która zachowuje komentarze, używa konkretnych typów UI5 i utrzymuje wygenerowane interfejsy kontrolek w formie możliwej do przeglądu.
- Defensywne przeglądy bezpieczeństwa, narzędzia moderacyjne i prompty do wykrywania nadużyć, które pokazują dowody i jasno określają granice zatwierdzania przez człowieka.
- Automatyzacja przepływów pracy oparta na zgodzie dla kont osobistych lub zespołowych, z jawnymi danymi uwierzytelniającymi, przejrzystą konfiguracją oraz trybami próbnego uruchomienia lub podglądu.
- Dokumentacja, instrukcje migracji, narzędzia deweloperskie i fixture’y testowe ograniczone do oprogramowania, które wspierają.

## Niedopuszczalne

- Przepływy omijania zabezpieczeń lub nieautoryzowanego dostępu.
  - Przykłady: obejście uwierzytelniania, przejęcie konta, obejście CAPTCHA, omijanie Cloudflare lub zabezpieczeń antybotowych, obejście limitów szybkości, ukryte scrapowanie zaprojektowane do pokonywania zabezpieczeń, przejęcie aktywnego połączenia lub agenta, kradzież sesji wielokrotnego użytku, automatyczne zatwierdzanie przepływów parowania dla niezatwierdzonych użytkowników.

- Nadużywanie platform i omijanie banów.
  - Przykłady: ukryte konta po banach, rozgrzewanie lub farmienie kont, fałszywe zaangażowanie, budowanie karmy lub obserwujących, automatyzacja wielu kont, masowe publikowanie, boty spamujące, automatyzacja marketplace’ów lub mediów społecznościowych zbudowana w celu uniknięcia wykrycia.

- Oszustwa, wyłudzenia i zwodnicze przepływy finansowe.
  - Przykłady: fałszywe certyfikaty, fałszywe faktury, zwodnicze przepływy płatności, oszukańczy outreach, fałszywy dowód społeczny, narzędzia umożliwiające wydawanie lub pobieranie opłat bez jasnej zgody człowieka i przejrzystych kontroli albo przepływy syntetycznej tożsamości tworzone w celu zakładania kont do oszustw.

- Scrapowanie, wzbogacanie lub nadzór naruszające prywatność.
  - Przykłady: masowe scrapowanie danych kontaktowych do spamu, doxxing, stalking, pozyskiwanie leadów połączone z niezamówionym outreachem, ukryte monitorowanie, wyszukiwanie twarzy lub dopasowywanie biometryczne używane bez jasnej zgody albo kupowanie, publikowanie, pobieranie lub operacyjne wykorzystywanie wyciekłych danych lub zrzutów z naruszeń.

- Podszywanie się bez zgody lub zwodnicza manipulacja tożsamością.
  - Przykłady: face swap, cyfrowe bliźniaki, fałszywe persony, sklonowani influencerzy albo inne narzędzia do manipulacji tożsamością używane do podszywania się lub wprowadzania w błąd.

- Jawne treści seksualne i generowanie treści dla dorosłych z wyłączonymi zabezpieczeniami.
  - Przykłady: generowanie obrazów, wideo lub treści NSFW, nakładki dla treści dla dorosłych na API firm trzecich albo Skills, których głównym celem są jawne treści seksualne.

- Ukryte, niebezpieczne lub wprowadzające w błąd wymagania wykonania.
  - Przykłady: zaciemnione polecenia instalacyjne, `curl | sh`, nieujawnione wymagania dotyczące sekretów, nieujawnione użycie klucza prywatnego, zdalne wykonanie `npx @latest` bez jasnej możliwości przeglądu, wprowadzające w błąd metadane ukrywające, czego Skills naprawdę potrzebują do uruchomienia.

## Najnowsze wzorce, których wyraźnie nie akceptujemy

- „Twórz ukryte konta sprzedawców po banach na marketplace’ach.”
- „Zmodyfikuj parowanie Telegram tak, aby niezatwierdzeni użytkownicy automatycznie otrzymywali kody parowania.”
- „Rozwijaj konta Reddit/Twitter za pomocą niewykrywalnej automatyzacji.”
- „Generuj profesjonalne certyfikaty lub faktury do dowolnego użycia.”
- „Generuj treści NSFW z wyłączonymi kontrolami bezpieczeństwa.”
- „Scrapuj leady, wzbogacaj kontakty i uruchamiaj masowy zimny outreach.”
- „Kupuj, publikuj lub pobieraj wyciekłe dane albo zrzuty z naruszeń.”
- „Masowo twórz konta e-mail lub społecznościowe z syntetycznymi tożsamościami albo rozwiązywaniem CAPTCHA.”

## Uwagi dla recenzentów

- Kontekst ma znaczenie. Ten sam temat może być uzasadniony w wąskim ustawieniu defensywnym lub opartym na zgodzie, a niedopuszczalny, gdy jest opakowany jako przepływ nadużyć.
- Powinniśmy skłaniać się ku działaniu, gdy Skills są wyraźnie optymalizowane pod kątem omijania zabezpieczeń, oszustwa lub użycia bez zgody.
- Powtarzające się przesyłanie treści w tych kategoriach stanowi podstawę do ukrycia treści i zbanowania konta.

## Egzekwowanie zasad

- Możemy ukrywać, usuwać lub trwale usuwać naruszające Skills.
- Możemy unieważniać tokeny, miękko usuwać powiązane treści i banować powtarzających się lub poważnych naruszycieli.
- Nie gwarantujemy egzekwowania zasad z wcześniejszym ostrzeżeniem w przypadku oczywistych nadużyć.
