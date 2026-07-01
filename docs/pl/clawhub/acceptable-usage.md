---
read_when:
    - Sprawdzanie przesłanych plików pod kątem nadużyć lub naruszeń zasad
    - Pisanie dokumentacji moderacji lub runbooków recenzenckich
    - Decydowanie, czy umiejętność powinna zostać ukryta, czy użytkownik zablokowany
sidebarTitle: Acceptable Usage
summary: 'Polityka marketplace: co ClawHub dopuszcza, a czego nie będzie hostować.'
title: Dopuszczalne użycie
x-i18n:
    generated_at: "2026-07-01T15:32:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Dopuszczalne użycie

ClawHub hostuje Skills, pluginy, pakiety i metadane marketplace dla OpenClaw.
Użyj tej strony, aby zdecydować, czy treść lub sposób publikowania pasuje do
ClawHub.

Te zasady dotyczą tego, co robi wpis, o co prosi użytkowników, jak
przedstawia siebie oraz jak wydawcy korzystają z powierzchni odkrywania,
instalacji i zaufania w ClawHub. Stany moderacji i status konta opisuje
[Moderacja i bezpieczeństwo konta](/clawhub/moderation). Roszczenia dotyczące praw autorskich lub innych praw opisuje
[Żądania dotyczące praw do treści](/pl/clawhub/content-rights).

## Dozwolone treści

ClawHub przyjmuje treści, które są użyteczne, zrozumiałe i publikowane w dobrej
wierze.

| Kategoria                                        | Dozwolone, gdy                                                                                                                    |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produktywność deweloperska                       | Wpis pomaga użytkownikom budować, testować, migrować, debugować, dokumentować lub obsługiwać oprogramowanie.                     |
| Przepływy pracy UI, danych i automatyzacji       | Zakres jest jasny, wymagane poświadczenia są jawne, a ryzykowne działania obejmują ścieżki przeglądu, próby, podglądu lub potwierdzenia. |
| Defensywne bezpieczeństwo, moderacja i przegląd nadużyć | Narzędzie jest przedstawione jako przeznaczone do autoryzowanego przeglądu, zachowuje dowody i jasno utrzymuje granice ludzkiej akceptacji. |
| Osobiste lub zespołowe przepływy pracy           | Przepływ pracy używa kont opartych na zgodzie, przejrzystej konfiguracji i jawnych uprawnień.                                    |
| Utrzymywane katalogi                             | Każdy wpis jest odrębny, użyteczny, dokładnie opisany i rozsądnie utrzymywany.                                                    |

Kontekst ma znaczenie. Ten sam temat może być akceptowalny w wąskim ustawieniu
defensywnym lub opartym na zgodzie, a niedopuszczalny, gdy jest zapakowany jako
przepływ pracy do nadużyć.

## Niedozwolone treści

ClawHub nie hostuje treści, których głównym celem jest nadużycie, oszustwo,
niebezpieczne wykonanie lub naruszenie praw.

| Kategoria                                                   | Niedozwolone                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nieautoryzowany dostęp lub omijanie zabezpieczeń            | Omijanie uwierzytelniania, przejęcie konta, nadużywanie limitów szybkości, przejęcie połączenia na żywo lub agenta, kradzież sesji wielokrotnego użytku albo automatyczne zatwierdzanie przepływów parowania dla niezatwierdzonych użytkowników. |
| Nadużycia platformy i obchodzenie banów                     | Ukryte konta po banach, rozgrzewanie lub farmienie kont, fałszywe zaangażowanie, automatyzacja wielu kont, masowe publikowanie, boty spamujące albo automatyzacja zbudowana w celu uniknięcia wykrycia. |
| Oszustwa, wyłudzenia i zwodnicze przepływy finansowe        | Fałszywe certyfikaty lub faktury, zwodnicze przepływy płatności, kontaktowanie się w celu oszustwa, fałszywy dowód społeczny, przepływy syntetycznej tożsamości do oszustw albo narzędzia do wydawania lub obciążania bez jasnej ludzkiej akceptacji. |
| Naruszające prywatność wzbogacanie danych lub nadzór        | Scrapowanie kontaktów do spamu, doxxing, stalking, pozyskiwanie leadów połączone z niezamówionym kontaktem, ukryte monitorowanie, biometryczne dopasowywanie bez zgody albo używanie wyciekłych danych lub zrzutów z naruszeń. |
| Podszywanie się lub manipulacja tożsamością bez zgody       | Zamiana twarzy, cyfrowe bliźniaki, sklonowani influencerzy, fałszywe persony lub inne narzędzia używane do podszywania się lub wprowadzania w błąd. |
| Jawne treści seksualne lub generowanie treści dla dorosłych z wyłączonymi zabezpieczeniami | Generowanie obrazów, wideo lub treści NSFW; wrappery treści dla dorosłych wokół API firm trzecich; albo wpisy, których głównym celem są jawne treści seksualne. |
| Ukryte, niebezpieczne lub wprowadzające w błąd wymagania wykonania | Zaciemnione polecenia instalacji, instalatory typu pipe-to-shell, takie jak pobrana treść uruchamiana za pomocą `sh` lub `bash` bez jasnej możliwości przeglądu, niezgłoszone wymagania dotyczące sekretów lub kluczy prywatnych, zdalne wykonanie `npx @latest` bez jasnej możliwości przeglądu albo metadane ukrywające, czego wpis naprawdę potrzebuje do uruchomienia. |
| Materiały naruszające prawa autorskie lub inne prawa        | Ponowne publikowanie cudzych Skills, pluginów, dokumentacji, zasobów marki lub kodu własnościowego bez pozwolenia; naruszanie warunków licencji; albo podszywanie się pod pierwotnego autora lub wydawcę. |

## Niedozwolone zachowanie w marketplace

ClawHub ocenia także, jak wydawcy korzystają z marketplace. Nie używaj ClawHub do
manipulowania odkrywaniem, metrykami, sygnałami zaufania, systemami moderacji ani
uwagą użytkowników.

Niedozwolone zachowanie w marketplace obejmuje:

- masowe publikowanie dużej liczby niskiej jakości, duplikujących się, zastępczych lub
  wygenerowanych maszynowo wpisów, które nie wydają się mieć rzeczywistej wartości dla użytkownika
- zalewanie wyszukiwania lub powierzchni kategorii niemal identycznymi Skills albo pluginami
- publikowanie setek wpisów z niewielkim użyciem lub bez użycia, utrzymania, jasności źródła
  albo znaczącego zróżnicowania
- sztuczne zawyżanie instalacji, pobrań, gwiazdek lub innych metryk zaangażowania
  przez automatyzację, pętle samodzielnej instalacji, fałszywe konta, skoordynowaną
  aktywność, płatne zaangażowanie lub inne nieorganiczne zachowanie
- tworzenie lub rotowanie kont w celu obchodzenia moderacji, banów, limitów wydawcy lub
  przeglądu marketplace
- wprowadzanie użytkowników w błąd co do własności, źródła, możliwości, stanu bezpieczeństwa,
  wymagań instalacyjnych lub powiązania z innym projektem albo wydawcą
- wielokrotne przesyłanie treści, które zostały już ukryte, usunięte lub zablokowane,
  bez naprawienia podstawowego problemu

Publikowanie na dużą skalę nie jest automatycznie nadużyciem. Duże katalogi są akceptowalne,
gdy wpisy znacząco się różnią, są dokładnie opisane, utrzymywane i używane przez
rzeczywistych użytkowników. Duże katalogi stają się problemem zaufania i bezpieczeństwa, gdy
wolumen łączy się z wpisami powierzchownymi, duplikującymi się, wprowadzającymi w błąd,
nieutrzymywanymi lub sztucznie promowanymi.

## Prawa do treści

Jeśli uważasz, że treść w ClawHub narusza Twoje prawa autorskie lub inne prawa, użyj
[Żądań dotyczących praw do treści](/pl/clawhub/content-rights). Nie używaj zwykłych zgłoszeń marketplace
do roszczeń dotyczących praw autorskich lub innych praw, chyba że wpis jest również niebezpieczny,
złośliwy lub wprowadzający w błąd.

## Przegląd i egzekwowanie

ClawHub może używać automatycznych kontroli, statystycznych sygnałów nadużyć, zgłoszeń użytkowników i
przeglądu przez personel w celu identyfikowania niebezpiecznych treści lub nadużyć w publikowaniu. Sygnał
sam w sobie nie dowodzi nadużycia; pomaga ClawHub zdecydować, co wymaga przeglądu.

Możemy:

- ukrywać, wstrzymywać, usuwać, usuwać miękko lub, gdy typ zasobu to obsługuje,
  usuwać trwale naruszające zasady wpisy
- blokować pobrania lub instalacje niebezpiecznych wydań
- unieważniać tokeny API
- usuwać miękko powiązane treści
- ograniczać dostęp do publikowania
- banować powtarzających się lub poważnych naruszycieli

Nie gwarantujemy egzekwowania z ostrzeżeniem najpierw w przypadku oczywistych nadużyć. Zobacz
[Moderację i bezpieczeństwo konta](/clawhub/moderation), aby poznać zgłoszenia, blokady moderacyjne,
ukryte wpisy, bany i status konta.
