---
read_when:
    - Sprawdzanie przesłanych plików pod kątem nadużyć lub naruszeń zasad
    - Pisanie dokumentacji moderacji lub runbooków recenzenta
    - Decydowanie, czy umiejętność powinna zostać ukryta, czy użytkownik zbanowany
sidebarTitle: Acceptable Usage
summary: 'Polityka marketplace’u: co ClawHub dopuszcza i czego nie będzie hostować.'
title: Dopuszczalne użycie
x-i18n:
    generated_at: "2026-06-28T20:41:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Dopuszczalne użycie

ClawHub hostuje Skills, pluginy, pakiety i metadane marketplace dla OpenClaw.
Użyj tej strony, aby zdecydować, czy treść lub sposób publikowania należy do
ClawHub.

Te zasady dotyczą tego, co robi wpis, o uruchomienie czego prosi użytkowników,
jak przedstawia sam siebie oraz jak wydawcy używają powierzchni odkrywania,
instalacji i zaufania ClawHub. Stany moderacji i status konta opisuje
[Moderacja i bezpieczeństwo konta](/pl/clawhub/moderation). Roszczenia dotyczące
praw autorskich lub innych praw opisuje [Żądania dotyczące praw do treści](/pl/clawhub/content-rights).

## Dozwolone treści

ClawHub przyjmuje treści, które są użyteczne, zrozumiałe i publikowane w dobrej
wierze.

| Kategoria | Dozwolone, gdy |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produktywność deweloperska | Wpis pomaga użytkownikom tworzyć, testować, migrować, debugować, dokumentować lub obsługiwać oprogramowanie. |
| Przepływy pracy UI, danych i automatyzacji | Zakres jest jasny, wymagane dane uwierzytelniające są wyraźnie wskazane, a ryzykowne działania obejmują ścieżki przeglądu, dry-run, podglądu lub potwierdzenia. |
| Defensywne bezpieczeństwo, moderacja i przegląd nadużyć | Narzędzie jest przedstawione jako przeznaczone do autoryzowanego przeglądu, zachowuje dowody i jasno utrzymuje granice akceptacji przez człowieka. |
| Osobiste lub zespołowe przepływy pracy | Przepływ pracy używa kont opartych na zgodzie, przejrzystej konfiguracji i wyraźnych uprawnień. |
| Utrzymywane katalogi | Każdy wpis jest odrębny, użyteczny, dokładnie opisany i rozsądnie utrzymywany. |

Kontekst ma znaczenie. Ten sam temat może być dopuszczalny w wąskim ustawieniu
defensywnym lub opartym na zgodzie, a niedopuszczalny, gdy jest opakowany jako
przepływ pracy do nadużyć.

## Niedozwolone treści

ClawHub nie hostuje treści, których głównym celem są nadużycia, oszustwo,
niebezpieczne wykonywanie lub naruszanie praw.

| Kategoria | Niedozwolone |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nieautoryzowany dostęp lub obejście zabezpieczeń | Obejście uwierzytelniania, przejęcie konta, nadużywanie limitów szybkości, przejęcie połączenia na żywo lub agenta, kradzież sesji wielokrotnego użytku albo automatyczne zatwierdzanie przepływów parowania dla niezatwierdzonych użytkowników. |
| Nadużycia platformy i omijanie blokad | Ukryte konta po blokadach, rozgrzewanie lub farmienie kont, fałszywe zaangażowanie, automatyzacja wielu kont, masowe publikowanie, boty spamujące albo automatyzacja zbudowana w celu uniknięcia wykrycia. |
| Oszustwa, wyłudzenia i zwodnicze przepływy finansowe | Fałszywe certyfikaty lub faktury, zwodnicze przepływy płatności, oszukańcze wiadomości wychodzące, fałszywy dowód społeczny, przepływy syntetycznej tożsamości do oszustw albo narzędzia wydawania/obciążania bez jasnej akceptacji człowieka. |
| Inwazyjne wzbogacanie danych lub nadzór naruszający prywatność | Scraping kontaktów do spamu, doxxing, stalking, pozyskiwanie leadów połączone z niezamówionymi wiadomościami wychodzącymi, ukryte monitorowanie, biometryczne dopasowywanie bez zgody albo użycie wyciekłych danych lub zrzutów z naruszeń. |
| Podszywanie się bez zgody lub manipulowanie tożsamością | Zamiana twarzy, cyfrowe bliźniaki, sklonowani influencerzy, fałszywe persony albo inne narzędzia używane do podszywania się lub wprowadzania w błąd. |
| Jawne treści seksualne lub generowanie treści dla dorosłych z wyłączonymi zabezpieczeniami | Generowanie obrazów, wideo lub treści NSFW; wrappery treści dla dorosłych wokół API stron trzecich; albo wpisy, których głównym celem są jawne treści seksualne. |
| Ukryte, niebezpieczne lub mylące wymagania wykonania | Zaciemnione polecenia instalacji, instalatory pipe-to-shell, takie jak pobrane treści uruchamiane przez `sh` lub `bash` bez jasnej możliwości przeglądu, nieujawnione wymagania dotyczące sekretów lub kluczy prywatnych, zdalne wykonanie `npx @latest` bez jasnej możliwości przeglądu albo metadane ukrywające, czego wpis naprawdę potrzebuje do uruchomienia. |
| Materiały naruszające prawa autorskie lub inne prawa | Ponowne publikowanie cudzych Skills, pluginów, dokumentacji, zasobów marki lub kodu własnościowego bez pozwolenia; naruszanie warunków licencji; albo podszywanie się pod pierwotnego autora lub wydawcę. |

## Niedozwolone zachowanie w marketplace

ClawHub sprawdza również, jak wydawcy używają marketplace. Nie używaj ClawHub do
manipulowania odkrywaniem, metrykami, sygnałami zaufania, systemami moderacji
ani uwagą użytkowników.

Niedozwolone zachowanie w marketplace obejmuje:

- masowe publikowanie dużej liczby wpisów o niskim nakładzie pracy,
  duplikacyjnych, zastępczych lub generowanych maszynowo, które nie wydają się
  mieć realnej wartości dla użytkowników
- zalewanie powierzchni wyszukiwania lub kategorii niemal identycznymi Skills
  albo pluginami
- publikowanie setek wpisów z niewielkim użyciem lub bez użycia, konserwacji,
  jasności źródła albo znaczącego zróżnicowania
- sztuczne zwiększanie instalacji, pobrań, gwiazdek lub innych metryk
  zaangażowania przez automatyzację, pętle samodzielnych instalacji, fałszywe
  konta, skoordynowaną aktywność, płatne zaangażowanie albo inne nieorganiczne
  zachowanie
- tworzenie lub rotowanie kont w celu omijania moderacji, blokad, limitów
  wydawcy lub przeglądu marketplace
- wprowadzanie użytkowników w błąd co do własności, źródła, możliwości, stanu
  bezpieczeństwa, wymagań instalacyjnych lub powiązania z innym projektem albo
  wydawcą
- wielokrotne przesyłanie treści, które zostały już ukryte, usunięte lub
  zablokowane, bez naprawienia podstawowego problemu

Publikowanie na dużą skalę nie jest automatycznie nadużyciem. Duże katalogi są
dopuszczalne, gdy wpisy znacząco się różnią, są dokładnie opisane, utrzymywane
i używane przez prawdziwych użytkowników. Duże katalogi stają się problemem
zaufania i bezpieczeństwa, gdy skala łączy się z wpisami płytkimi,
duplikacyjnymi, mylącymi, nieutrzymywanymi lub sztucznie promowanymi.

## Prawa do treści

Jeśli uważasz, że treść w ClawHub narusza Twoje prawa autorskie lub inne prawa,
użyj [Żądań dotyczących praw do treści](/pl/clawhub/content-rights). Nie używaj
zwykłych zgłoszeń marketplace do roszczeń dotyczących praw autorskich lub innych
praw, chyba że wpis jest również niebezpieczny, złośliwy albo mylący.

## Przegląd i egzekwowanie

ClawHub może używać automatycznych kontroli, statystycznych sygnałów nadużyć,
zgłoszeń użytkowników i przeglądu przez personel, aby identyfikować
niebezpieczne treści lub nadużycia w publikowaniu. Sygnał sam w sobie nie
dowodzi nadużycia; pomaga ClawHub zdecydować, co wymaga przeglądu.

Możemy:

- ukrywać, wstrzymywać, usuwać, usuwać miękko lub, jeśli typ zasobu to obsługuje,
  usuwać twardo naruszające zasady wpisy
- blokować pobrania lub instalacje niebezpiecznych wydań
- unieważniać tokeny API
- usuwać miękko powiązane treści
- ograniczać dostęp do publikowania
- blokować osoby dopuszczające się powtarzających się lub poważnych naruszeń

Nie gwarantujemy egzekwowania z wcześniejszym ostrzeżeniem w przypadku
oczywistych nadużyć. Zobacz
[Moderację i bezpieczeństwo konta](/pl/clawhub/moderation), aby uzyskać informacje
o zgłoszeniach, wstrzymaniach moderacyjnych, ukrytych wpisach, blokadach i
statusie konta.
