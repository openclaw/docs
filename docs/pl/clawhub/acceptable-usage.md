---
read_when:
    - Kontrola przesyłanych plików pod kątem nadużyć lub naruszeń zasad
    - Pisanie dokumentacji moderacji lub instrukcji dla recenzentów
    - Decydowanie, czy umiejętność powinna zostać ukryta, czy użytkownik zbanowany
sidebarTitle: Acceptable Usage
summary: 'Zasady marketplace''u: co ClawHub dopuszcza i czego nie będzie hostować.'
title: Dopuszczalne użycie
x-i18n:
    generated_at: "2026-07-03T23:43:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Dopuszczalne użycie

ClawHub hostuje Skills, Pluginy, pakiety i metadane marketplace dla OpenClaw.
Użyj tej strony, aby zdecydować, czy dana treść lub zachowanie publikowania
należy do ClawHub.

Te zasady dotyczą tego, co robi wpis, o uruchomienie czego prosi użytkowników,
jak się przedstawia oraz jak wydawcy korzystają z powierzchni odkrywania,
instalacji i zaufania ClawHub. Stany moderacji i status konta opisano w
[Moderacja i bezpieczeństwo konta](/clawhub/moderation). Roszczenia dotyczące
praw autorskich lub innych praw opisano w [Żądania dotyczące praw do treści](/pl/clawhub/content-rights).

## Dozwolona treść

ClawHub przyjmuje treści, które są użyteczne, zrozumiałe i publikowane w dobrej
wierze.

| Kategoria                                         | Dozwolone, gdy                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produktywność deweloperska                           | Wpis pomaga użytkownikom budować, testować, migrować, debugować, dokumentować lub obsługiwać oprogramowanie.                                               |
| Przepływy pracy UI, danych i automatyzacji               | Zakres jest jasny, wymagane poświadczenia są wyraźnie wskazane, a ryzykowne działania obejmują ścieżki przeglądu, dry-run, podglądu lub potwierdzenia. |
| Bezpieczeństwo defensywne, moderacja i przegląd nadużyć | Narzędzie jest przedstawione jako służące autoryzowanemu przeglądowi, zachowuje dowody i jasno utrzymuje granice zatwierdzania przez człowieka.                          |
| Przepływy pracy osobiste lub zespołowe                       | Przepływ pracy używa kont opartych na zgodzie, przejrzystej konfiguracji i wyraźnych uprawnień.                                            |
| Utrzymywane katalogi                              | Każdy wpis jest odrębny, użyteczny, dokładnie opisany i rozsądnie utrzymywany.                                                |

Kontekst ma znaczenie. Ten sam temat może być akceptowalny w wąskim ustawieniu
defensywnym lub opartym na zgodzie, a niedopuszczalny, gdy jest pakowany jako
przepływ pracy do nadużyć.

## Niedozwolona treść

ClawHub nie hostuje treści, których głównym celem jest nadużycie, oszustwo,
niebezpieczne wykonanie lub naruszenie praw.

| Kategoria                                                    | Niedozwolone                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nieautoryzowany dostęp lub obejście zabezpieczeń                      | Omijanie uwierzytelniania, przejęcie konta, nadużycie limitów szybkości, przejęcie połączenia na żywo lub agenta, kradzież sesji wielokrotnego użytku albo automatyczne zatwierdzanie przepływów parowania dla niezatwierdzonych użytkowników.                                                                                                                                                   |
| Nadużycia platformy i obchodzenie banów                              | Ukryte konta po banach, rozgrzewanie lub farmienie kont, fałszywe zaangażowanie, automatyzacja wielu kont, masowe publikowanie, boty spamujące lub automatyzacja zbudowana w celu uniknięcia wykrycia.                                                                                                                                          |
| Oszustwa, wyłudzenia i zwodnicze przepływy finansowe             | Fałszywe certyfikaty lub faktury, zwodnicze przepływy płatności, kontaktowanie się w celu oszustwa, fałszywy dowód społeczny, przepływy pracy z syntetyczną tożsamością do oszustw albo narzędzia do wydawania/obciążania bez jasnego zatwierdzenia przez człowieka.                                                                                                                    |
| Inwazyjne wzbogacanie danych lub nadzór naruszające prywatność                 | Scrapowanie kontaktów do spamu, doxxing, stalking, pozyskiwanie leadów połączone z niezamówionym kontaktem, ukryty monitoring, niedobrowolne dopasowywanie biometryczne albo użycie wyciekłych danych lub zrzutów z naruszeń.                                                                                                                  |
| Niedobrowolne podszywanie się lub manipulowanie tożsamością       | Zamiana twarzy, cyfrowe bliźniaki, sklonowani influencerzy, fałszywe persony lub inne narzędzia używane do podszywania się albo wprowadzania w błąd.                                                                                                                                                                                                 |
| Wyraźne treści seksualne lub generowanie treści dla dorosłych z wyłączonymi zabezpieczeniami | Generowanie obrazów, wideo lub treści NSFW; wrappery treści dla dorosłych wokół API firm trzecich; albo wpisy, których głównym celem są wyraźne treści seksualne.                                                                                                                                                       |
| Ukryte, niebezpieczne lub wprowadzające w błąd wymagania wykonania        | Zaciemnione polecenia instalacyjne, instalatory typu pipe-to-shell, takie jak pobrana treść uruchamiana przez `sh` lub `bash` bez jasnej możliwości przeglądu, nieujawnione wymagania dotyczące sekretów lub kluczy prywatnych, zdalne wykonanie `npx @latest` bez jasnej możliwości przeglądu albo metadane ukrywające, czego wpis naprawdę potrzebuje do uruchomienia. |
| Materiały naruszające prawa autorskie lub inne prawa           | Ponowne publikowanie cudzych Skills, Pluginów, dokumentacji, zasobów marki lub zastrzeżonego kodu bez pozwolenia; naruszanie warunków licencji; albo podszywanie się pod oryginalnego autora lub wydawcę.                                                                                                                            |

## Niedozwolone zachowanie na marketplace

ClawHub ocenia także, jak wydawcy używają marketplace. Nie używaj ClawHub do
manipulowania odkrywaniem, metrykami, sygnałami zaufania, systemami moderacji
ani uwagą użytkowników.

Niedozwolone zachowanie na marketplace obejmuje:

- masowe publikowanie dużej liczby niskonakładowych, powielających się,
  zastępczych lub generowanych maszynowo wpisów, które nie wydają się mieć
  realnej wartości dla użytkowników
- zalewanie wyszukiwarki lub powierzchni kategorii niemal identycznymi Skills
  lub Pluginami
- publikowanie setek wpisów z małym lub zerowym użyciem, utrzymaniem, jasnością
  źródła albo sensownym zróżnicowaniem
- sztuczne zwiększanie liczby instalacji, pobrań, gwiazdek lub innych metryk
  zaangażowania przez automatyzację, pętle samoinstalacji, fałszywe konta,
  skoordynowaną aktywność, płatne zaangażowanie lub inne nieorganiczne działania
- tworzenie lub rotowanie kont w celu obejścia moderacji, banów, limitów
  wydawców albo przeglądu marketplace
- wprowadzanie użytkowników w błąd co do własności, źródła, możliwości, postawy
  bezpieczeństwa, wymagań instalacyjnych lub powiązania z innym projektem albo
  wydawcą
- wielokrotne przesyłanie treści, która została już ukryta, usunięta lub
  zablokowana, bez naprawienia podstawowego problemu

Publikowanie dużej liczby wpisów nie jest automatycznie nadużyciem. Duże katalogi
są akceptowalne, gdy wpisy są znacząco różne, dokładnie opisane, utrzymywane
i używane przez prawdziwych użytkowników. Duże katalogi stają się problemem
zaufania i bezpieczeństwa, gdy wolumen łączy się z wpisami powierzchownymi,
powielającymi się, wprowadzającymi w błąd, nieutrzymywanymi lub sztucznie
promowanymi.

## Prawa do treści

Jeśli uważasz, że treść w ClawHub narusza Twoje prawa autorskie lub inne prawa,
użyj [Żądań dotyczących praw do treści](/pl/clawhub/content-rights). Nie używaj
zwykłych zgłoszeń marketplace do roszczeń dotyczących praw autorskich lub innych
praw, chyba że wpis jest także niebezpieczny, złośliwy lub wprowadzający w błąd.

## Przegląd i egzekwowanie zasad

ClawHub może używać zautomatyzowanych kontroli, statystycznych sygnałów nadużyć,
zgłoszeń użytkowników i przeglądu przez personel, aby identyfikować niebezpieczne
treści lub nadużycia w publikowaniu. Sygnał sam w sobie nie dowodzi nadużycia;
pomaga ClawHub zdecydować, co wymaga przeglądu.

Możemy:

- ukrywać, wstrzymywać, usuwać, usuwać miękko lub, gdy jest to obsługiwane dla
  danego typu zasobu, usuwać trwale naruszające zasady wpisy
- blokować pobieranie lub instalacje niebezpiecznych wydań
- unieważniać tokeny API
- usuwać miękko powiązaną treść
- ograniczać dostęp do publikowania
- banować powtarzających się lub poważnych naruszycieli

Nie gwarantujemy egzekwowania zasad z wcześniejszym ostrzeżeniem w przypadku
oczywistych nadużyć. Zobacz
[Moderacja i bezpieczeństwo konta](/clawhub/moderation), aby uzyskać informacje
o zgłoszeniach, wstrzymaniach moderacyjnych, ukrytych wpisach, banach i statusie
konta.
