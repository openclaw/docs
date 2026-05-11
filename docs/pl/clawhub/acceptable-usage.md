---
read_when:
    - Sprawdzanie przesłanych plików pod kątem nadużyć lub naruszeń zasad
    - Tworzenie dokumentacji moderacji lub procedur dla recenzentów
    - Decydowanie, czy ukryć umiejętność, czy zablokować użytkownika
summary: 'Zasady Marketplace: co ClawHub dopuszcza i czego nie będzie hostować.'
x-i18n:
    generated_at: "2026-05-11T22:19:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Akceptowalne użycie

Ta strona opisuje rodzaje skills i treści, które ClawHub akceptuje, oraz przepływy nadużyć, których nie będzie hostować.

Te zasady są celowo praktyczne. Najbardziej zależy nam na kompletnych przepływach nadużyć, a nie tylko na odizolowanych słowach kluczowych. Jeśli skill jest zbudowany tak, aby omijać zabezpieczenia, nadużywać platform, oszukiwać ludzi, naruszać prywatność lub umożliwiać działania bez zgody, nie należy do ClawHub.

## Najnowsze wzorce, które wyraźnie akceptujemy

- Prace nad frontendem i systemem projektowym, które używają rzeczywistych komponentów, tokenów semantycznych, dostępnych stanów i przetestowanych przepływów użytkownika.
- Kompozycja shadcn/ui, która używa zainstalowanych komponentów źródłowych, aliasów projektu i udokumentowanych wariantów zamiast jednorazowego znacznika.
- Konwersja UI5 z JavaScript na TypeScript, która zachowuje komentarze, używa konkretnych typów UI5 i utrzymuje wygenerowane interfejsy kontrolek w formie możliwej do przeglądu.
- Defensywny przegląd bezpieczeństwa, narzędzia do moderacji i prompty do wykrywania nadużyć, które pokazują dowody i jasno utrzymują granice zatwierdzania przez człowieka.
- Automatyzacja przepływów pracy oparta na zgodzie dla kont osobistych lub zespołowych, z jawnymi poświadczeniami, przejrzystą konfiguracją oraz trybami próbnymi lub podglądu.
- Dokumentacja, instrukcje migracji, narzędzia deweloperskie i fikstury testowe ograniczone do oprogramowania, które wspierają.

## Niedozwolone

- Przepływy omijania zabezpieczeń lub nieautoryzowanego dostępu.
  - Przykłady: obejście uwierzytelniania, przejęcie konta, obejście CAPTCHA, omijanie Cloudflare lub zabezpieczeń antybotowych, obejście limitów żądań, ukryte scrapowanie zaprojektowane w celu pokonania zabezpieczeń, przejęcie połączenia na żywo lub agenta, kradzież sesji wielokrotnego użytku, automatyczne zatwierdzanie przepływów parowania dla niezatwierdzonych użytkowników.

- Nadużycia platform i omijanie banów.
  - Przykłady: ukryte konta po banach, rozgrzewanie/hodowanie kont, fałszywe zaangażowanie, budowanie karmy lub obserwujących, automatyzacja wielu kont, masowe publikowanie, boty spamujące, automatyzacja marketplace lub społecznościowa zbudowana tak, aby unikać wykrycia.

- Oszustwa, wyłudzenia i zwodnicze przepływy finansowe.
  - Przykłady: fałszywe certyfikaty, fałszywe faktury, zwodnicze przepływy płatności, oszukańczy outreach, fałszywy dowód społeczny, narzędzia umożliwiające wydawanie lub obciążanie bez jasnej zgody człowieka i przejrzystych mechanizmów kontroli, albo przepływy syntetycznej tożsamości zbudowane do tworzenia kont na potrzeby oszustw.

- Naruszające prywatność scrapowanie, wzbogacanie danych lub nadzór.
  - Przykłady: scrapowanie danych kontaktowych na dużą skalę na potrzeby spamu, doxxing, stalking, pozyskiwanie leadów połączone z niezamówionym outreach, ukryte monitorowanie, wyszukiwanie twarzy lub dopasowywanie biometryczne używane bez wyraźnej zgody, albo kupowanie, publikowanie, pobieranie lub operacjonalizowanie wyciekłych danych lub zrzutów z naruszeń.

- Podszywanie się bez zgody lub zwodnicza manipulacja tożsamością.
  - Przykłady: podmiana twarzy, cyfrowe bliźniaki, fałszywe persony, sklonowani influencerzy lub inne narzędzia do manipulacji tożsamością używane do podszywania się lub wprowadzania w błąd.

- Jawne treści seksualne i generowanie treści dla dorosłych z wyłączonymi zabezpieczeniami.
  - Przykłady: generowanie obrazów/wideo/treści NSFW, nakładki treści dla dorosłych na API firm trzecich albo skills, których głównym celem są jawne treści seksualne.

- Ukryte, niebezpieczne lub wprowadzające w błąd wymagania wykonawcze.
  - Przykłady: zaciemnione polecenia instalacyjne, `curl | sh`, nieujawnione wymagania dotyczące sekretów, nieujawnione użycie kluczy prywatnych, zdalne wykonanie `npx @latest` bez jasnej możliwości przeglądu, wprowadzające w błąd metadane ukrywające, czego skill naprawdę potrzebuje do uruchomienia.

## Najnowsze wzorce, których wyraźnie nie akceptujemy

- „Twórz ukryte konta sprzedawców po banach na marketplace”.
- „Zmodyfikuj parowanie Telegram, aby niezatwierdzeni użytkownicy automatycznie otrzymywali kody parowania”.
- „Rozwijaj konta Reddit/Twitter za pomocą niewykrywalnej automatyzacji”.
- „Generuj profesjonalne certyfikaty lub faktury do dowolnego użycia”.
- „Generuj treści NSFW z wyłączonymi kontrolami bezpieczeństwa”.
- „Scrapuj leady, wzbogacaj kontakty i uruchamiaj cold outreach na dużą skalę”.
- „Kupuj, publikuj lub pobieraj wyciekłe dane albo zrzuty z naruszeń”.
- „Masowo twórz konta e-mail lub społecznościowe z syntetycznymi tożsamościami albo rozwiązywaniem CAPTCHA”.

## Uwagi dla recenzentów

- Kontekst ma znaczenie. Ten sam temat może być uzasadniony w wąskim ustawieniu defensywnym lub opartym na zgodzie i niedopuszczalny, gdy jest opakowany jako przepływ nadużycia.
- Powinniśmy skłaniać się ku działaniu, gdy skill jest wyraźnie zoptymalizowany pod kątem omijania zabezpieczeń, oszustwa lub użycia bez zgody.
- Powtarzające się przesyłanie treści z tych kategorii jest podstawą do ukrycia treści i zbanowania konta.

## Egzekwowanie zasad

- Możemy ukrywać, usuwać lub trwale usuwać naruszające zasady skills.
- Możemy unieważniać tokeny, miękko usuwać powiązane treści oraz banować powtarzających się lub poważnych sprawców naruszeń.
- Nie gwarantujemy egzekwowania z ostrzeżeniem jako pierwszym krokiem w przypadku oczywistych nadużyć.
