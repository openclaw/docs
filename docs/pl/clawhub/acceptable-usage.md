---
read_when:
    - Sprawdzanie przesłanych plików pod kątem nadużyć lub naruszeń zasad
    - Pisanie dokumentacji moderacji lub runbooków recenzentów
    - Podejmowanie decyzji, czy umiejętność powinna zostać ukryta, czy użytkownik zbanowany
sidebarTitle: Acceptable Usage
summary: 'Zasady marketplace: co ClawHub dopuszcza, a czego nie będzie hostować.'
title: Dopuszczalne użycie
x-i18n:
    generated_at: "2026-07-02T17:47:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Dopuszczalne użycie

ClawHub hostuje skills, pluginy, pakiety i metadane marketplace dla OpenClaw.
Użyj tej strony, aby zdecydować, czy treści lub zachowanie publikowania należą do
ClawHub.

Te zasady dotyczą tego, co robi wpis, o co prosi użytkowników, jak się
przedstawia oraz jak wydawcy korzystają z powierzchni odkrywania, instalacji i
zaufania ClawHub. Stany moderacji i status konta opisano w
[Moderacja i bezpieczeństwo konta](/clawhub/moderation). Roszczenia dotyczące praw autorskich lub innych praw
opisano w [Żądania dotyczące praw do treści](/clawhub/content-rights).

## Dozwolone treści

ClawHub przyjmuje treści, które są użyteczne, zrozumiałe i publikowane w dobrej
wierze.

| Kategoria                                         | Dozwolone, gdy                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produktywność deweloperska                           | Wpis pomaga użytkownikom tworzyć, testować, migrować, debugować, dokumentować lub obsługiwać oprogramowanie.                                               |
| Przepływy pracy UI, danych i automatyzacji               | Zakres jest jasny, wymagane dane uwierzytelniające są wyraźnie wskazane, a ryzykowne działania obejmują ścieżki przeglądu, próbnego uruchomienia, podglądu lub potwierdzenia. |
| Bezpieczeństwo defensywne, moderacja i przegląd nadużyć | Narzędzie jest przedstawione jako przeznaczone do autoryzowanego przeglądu, zachowuje dowody i utrzymuje jasne granice zatwierdzania przez człowieka.                          |
| Osobiste lub zespołowe przepływy pracy                       | Przepływ pracy używa kont opartych na zgodzie, przejrzystej konfiguracji i wyraźnych uprawnień.                                            |
| Utrzymywane katalogi                              | Każdy wpis jest odrębny, użyteczny, dokładnie opisany i rozsądnie utrzymywany.                                                |

Kontekst ma znaczenie. Ten sam temat może być dopuszczalny w wąskim ustawieniu
defensywnym lub opartym na zgodzie, a niedopuszczalny, gdy jest zapakowany jako
przepływ pracy do nadużyć.

## Niedozwolone treści

ClawHub nie hostuje treści, których głównym celem jest nadużycie, oszustwo, niebezpieczne
wykonanie lub naruszenie praw.

| Kategoria                                                    | Niedozwolone                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nieautoryzowany dostęp lub obejście zabezpieczeń                      | Obejście uwierzytelniania, przejęcie konta, nadużycie limitów szybkości, przejęcie aktywnego połączenia lub agenta, kradzież sesji wielokrotnego użytku albo automatyczne zatwierdzanie przepływów parowania dla niezatwierdzonych użytkowników.                                                                                                                                                   |
| Nadużycia platformy i omijanie blokad                              | Ukryte konta po blokadach, rozgrzewanie lub farmienie kont, fałszywe zaangażowanie, automatyzacja wielu kont, masowe publikowanie, boty spamujące lub automatyzacja zbudowana w celu unikania wykrycia.                                                                                                                                          |
| Oszustwa, wyłudzenia i zwodnicze przepływy finansowe             | Fałszywe certyfikaty lub faktury, zwodnicze przepływy płatności, oszukańcze działania kontaktowe, fałszywe dowody społeczne, przepływy pracy z syntetyczną tożsamością do oszustw albo narzędzia do wydawania środków lub obciążania bez wyraźnej zgody człowieka.                                                                                                                    |
| Naruszające prywatność wzbogacanie danych lub nadzór                 | Pozyskiwanie kontaktów do spamu, doxxing, stalking, pozyskiwanie leadów połączone z niezamówionym kontaktem, ukryte monitorowanie, niekonsensualne dopasowywanie biometryczne albo użycie ujawnionych danych lub zrzutów z naruszeń.                                                                                                                  |
| Niekonsensualne podszywanie się lub manipulacja tożsamością       | Podmiana twarzy, cyfrowe bliźniaki, sklonowani influencerzy, fałszywe persony lub inne narzędzia używane do podszywania się lub wprowadzania w błąd.                                                                                                                                                                                                 |
| Treści seksualne wprost lub wyłączające zabezpieczenia generowanie dla dorosłych | Generowanie obrazów, wideo lub treści NSFW; wrappery treści dla dorosłych wokół API firm trzecich; albo wpisy, których podstawowym celem są treści seksualne wprost.                                                                                                                                                       |
| Ukryte, niebezpieczne lub wprowadzające w błąd wymagania dotyczące wykonania        | Zaciemnione polecenia instalacji, instalatory pipe-to-shell, takie jak pobrana treść uruchamiana przez `sh` lub `bash` bez jasnej możliwości przeglądu, niezadeklarowane wymagania dotyczące sekretów lub kluczy prywatnych, zdalne wykonanie `npx @latest` bez jasnej możliwości przeglądu albo metadane ukrywające, czego wpis naprawdę potrzebuje do uruchomienia. |
| Materiały naruszające prawa autorskie lub inne prawa           | Ponowna publikacja cudzej umiejętności, pluginu, dokumentacji, zasobów marki lub zastrzeżonego kodu bez pozwolenia; naruszanie warunków licencji; albo podszywanie się pod pierwotnego autora lub wydawcę.                                                                                                                            |

## Niedozwolone zachowania w marketplace

ClawHub sprawdza także, jak wydawcy korzystają z marketplace. Nie używaj ClawHub do
manipulowania odkrywaniem, metrykami, sygnałami zaufania, systemami moderacji lub
uwagą użytkowników.

Niedozwolone zachowania w marketplace obejmują:

- masowe publikowanie dużej liczby wpisów o niskim nakładzie pracy, duplikacyjnych, zastępczych lub
  wygenerowanych maszynowo, które nie wydają się mieć realnej wartości dla użytkowników
- zalewanie wyszukiwania lub powierzchni kategorii niemal identycznymi skills lub pluginami
- publikowanie setek wpisów z niewielkim użyciem lub bez użycia, utrzymania, jasności źródła
  albo znaczącego zróżnicowania
- sztuczne zawyżanie instalacji, pobrań, gwiazdek lub innych metryk
  zaangażowania przez automatyzację, pętle samodzielnej instalacji, fałszywe konta, skoordynowaną
  aktywność, płatne zaangażowanie lub inne nieorganiczne zachowanie
- tworzenie lub rotowanie kont w celu omijania moderacji, blokad, limitów wydawcy lub
  przeglądu marketplace
- wprowadzanie użytkowników w błąd co do własności, źródła, możliwości, poziomu bezpieczeństwa,
  wymagań instalacyjnych lub powiązania z innym projektem albo wydawcą
- wielokrotne przesyłanie treści, które zostały już ukryte, usunięte lub zablokowane,
  bez naprawienia podstawowego problemu

Publikowanie dużego wolumenu nie jest automatycznie nadużyciem. Duże katalogi są dopuszczalne,
gdy wpisy są znacząco różne, dokładnie opisane, utrzymywane
i używane przez prawdziwych użytkowników. Duże katalogi stają się problemem zaufania i bezpieczeństwa, gdy
wolumen łączy się z wpisami płytkimi, duplikacyjnymi, wprowadzającymi w błąd, nieutrzymywanymi lub
sztucznie promowanymi.

## Prawa do treści

Jeśli uważasz, że treść w ClawHub narusza Twoje prawa autorskie lub inne prawa, użyj
[Żądania dotyczące praw do treści](/clawhub/content-rights). Nie używaj zwykłych zgłoszeń marketplace
do roszczeń dotyczących praw autorskich lub praw, chyba że wpis jest także niebezpieczny,
złośliwy lub wprowadzający w błąd.

## Przegląd i egzekwowanie

ClawHub może używać automatycznych kontroli, statystycznych sygnałów nadużyć, zgłoszeń użytkowników i
przeglądu personelu, aby identyfikować niebezpieczne treści lub nadużycia w publikowaniu. Sygnał
sam w sobie nie dowodzi nadużycia; pomaga ClawHub zdecydować, co wymaga przeglądu.

Możemy:

- ukrywać, wstrzymywać, usuwać, usuwać miękko lub, gdy jest to obsługiwane dla danego typu zasobu,
  usuwać trwale naruszające zasady wpisy
- blokować pobrania lub instalacje niebezpiecznych wydań
- unieważniać tokeny API
- miękko usuwać powiązane treści
- ograniczać dostęp do publikowania
- blokować powtarzających się lub poważnych naruszycieli

Nie gwarantujemy egzekwowania zasad najpierw z ostrzeżeniem w przypadku oczywistych nadużyć. Zobacz
[Moderacja i bezpieczeństwo konta](/clawhub/moderation), aby uzyskać informacje o zgłoszeniach, wstrzymaniach moderacyjnych,
ukrytych wpisach, blokadach i statusie konta.
