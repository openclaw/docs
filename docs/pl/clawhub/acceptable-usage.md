---
read_when:
    - Przeglądanie przesyłanych plików pod kątem nadużyć lub naruszeń zasad
    - Pisanie dokumentacji moderacji lub podręczników dla recenzentów
    - Decydowanie, czy umiejętność powinna zostać ukryta, czy użytkownik zablokowany
sidebarTitle: Acceptable Usage
summary: 'Zasady marketplace''u: co ClawHub dopuszcza i czego nie będzie hostować.'
title: Dopuszczalne użycie
x-i18n:
    generated_at: "2026-07-05T08:39:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Akceptowalne użycie

ClawHub hostuje Skills, pluginy, pakiety i metadane marketplace dla OpenClaw.
Użyj tej strony, aby zdecydować, czy treść lub zachowanie publikowania należy do
ClawHub.

Te zasady dotyczą tego, co robi wpis, o uruchomienie czego prosi użytkowników, jak
się przedstawia oraz jak wydawcy używają powierzchni odkrywania, instalacji i
zaufania ClawHub. Stany moderacji i status konta opisuje
[Moderacja i bezpieczeństwo konta](/clawhub/moderation). Roszczenia dotyczące praw autorskich lub innych praw opisują [Żądania dotyczące praw do treści](/clawhub/content-rights).

## Dozwolone treści

ClawHub przyjmuje treści, które są użyteczne, zrozumiałe i publikowane w dobrej
wierze.

| Kategoria                                         | Dozwolone, gdy                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produktywność deweloperów                           | Wpis pomaga użytkownikom budować, testować, migrować, debugować, dokumentować lub obsługiwać oprogramowanie.                                               |
| Przepływy pracy UI, danych i automatyzacji               | Zakres jest jasny, wymagane dane uwierzytelniające są wyraźnie wskazane, a ryzykowne działania obejmują ścieżki przeglądu, przebiegu próbnego, podglądu lub potwierdzenia. |
| Bezpieczeństwo defensywne, moderacja i przegląd nadużyć | Narzędzie jest przedstawione jako przeznaczone do autoryzowanego przeglądu, zachowuje dowody i jasno określa granice zatwierdzania przez człowieka.                          |
| Osobiste lub zespołowe przepływy pracy                       | Przepływ pracy używa kont opartych na zgodzie, przejrzystej konfiguracji i jawnych uprawnień.                                            |
| Utrzymywane katalogi                              | Każdy wpis jest odrębny, użyteczny, dokładnie opisany i rozsądnie utrzymywany.                                                |

Kontekst ma znaczenie. Ten sam temat może być akceptowalny w wąskim ustawieniu
defensywnym lub opartym na zgodzie, a niedopuszczalny, gdy jest spakowany jako
przepływ pracy do nadużyć.

## Niedozwolone treści

ClawHub nie hostuje treści, których głównym celem są nadużycia, oszustwo,
niebezpieczne wykonywanie lub naruszanie praw.

| Kategoria                                                    | Niedozwolone                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nieautoryzowany dostęp lub obchodzenie zabezpieczeń                      | Obchodzenie uwierzytelniania, przejęcie konta, nadużywanie limitów, przejęcie połączenia na żywo lub agenta, kradzież sesji wielokrotnego użytku albo automatyczne zatwierdzanie przepływów parowania dla niezatwierdzonych użytkowników.                                                                                                                                                   |
| Nadużycia platformy i obchodzenie banów                              | Konta ukryte po banach, rozgrzewanie lub farmienie kont, fałszywe zaangażowanie, automatyzacja wielu kont, masowe publikowanie, boty spamujące albo automatyzacja zbudowana w celu uniknięcia wykrycia.                                                                                                                                          |
| Oszustwa, wyłudzenia i zwodnicze przepływy finansowe             | Fałszywe certyfikaty lub faktury, zwodnicze przepływy płatności, kontaktowanie się w celu oszustwa, fałszywy dowód społeczny, przepływy syntetycznej tożsamości do oszustw albo narzędzia wydawania/obciążania bez jasnego zatwierdzenia przez człowieka.                                                                                                                    |
| Inwazyjne wobec prywatności wzbogacanie danych lub nadzór                 | Scraping kontaktów do spamu, doxxing, stalking, pozyskiwanie leadów połączone z niezamówionym kontaktem, ukryte monitorowanie, niedobrowolne dopasowywanie biometryczne albo użycie wyciekłych danych lub zrzutów z naruszeń.                                                                                                                  |
| Niedobrowolne podszywanie się lub manipulacja tożsamością       | Zamiana twarzy, cyfrowe bliźniaki, sklonowani influencerzy, fałszywe persony albo inne narzędzia używane do podszywania się lub wprowadzania w błąd.                                                                                                                                                                                                 |
| Wyraźne treści seksualne lub generowanie treści dla dorosłych z wyłączonymi zabezpieczeniami | Generowanie obrazów, wideo lub treści NSFW; nakładki treści dla dorosłych wokół API stron trzecich; albo wpisy, których głównym celem są wyraźne treści seksualne.                                                                                                                                                       |
| Ukryte, niebezpieczne lub wprowadzające w błąd wymagania wykonania        | Zaciemnione polecenia instalacji, instalatory typu pipe-to-shell, takie jak pobrana treść uruchamiana przez `sh` lub `bash` bez jasnej możliwości przeglądu, niezgłoszone wymagania dotyczące sekretów lub kluczy prywatnych, zdalne wykonanie `npx @latest` bez jasnej możliwości przeglądu albo metadane ukrywające, czego wpis naprawdę potrzebuje do uruchomienia. |
| Materiały naruszające prawa autorskie lub inne prawa           | Ponowne publikowanie cudzych Skills, pluginów, dokumentacji, zasobów marki lub kodu własnościowego bez pozwolenia; naruszanie warunków licencji; albo podszywanie się pod pierwotnego autora lub wydawcę.                                                                                                                            |

## Niedozwolone zachowanie w marketplace

ClawHub sprawdza również, jak wydawcy używają marketplace. Nie używaj ClawHub do
manipulowania odkrywaniem, metrykami, sygnałami zaufania, systemami moderacji ani
uwagą użytkowników.

Niedozwolone zachowanie w marketplace obejmuje:

- masowe publikowanie dużej liczby niskowysiłkowych, duplikujących się,
  zastępczych lub wygenerowanych maszynowo wpisów, które nie wydają się mieć
  realnej wartości dla użytkowników
- zalewanie powierzchni wyszukiwania lub kategorii niemal identycznymi Skills lub pluginami
- publikowanie setek wpisów z małym użyciem lub bez użycia, utrzymania, jasności
  źródła albo znaczącego zróżnicowania
- sztuczne zawyżanie instalacji, pobrań, gwiazdek lub innych metryk
  zaangażowania przez automatyzację, pętle samodzielnej instalacji, fałszywe
  konta, skoordynowane działania, płatne zaangażowanie lub inne nieorganiczne
  zachowanie
- tworzenie lub rotowanie kont w celu obchodzenia moderacji, banów, limitów wydawcy lub
  przeglądu marketplace
- wprowadzanie użytkowników w błąd co do własności, źródła, możliwości, postawy
  bezpieczeństwa, wymagań instalacyjnych lub powiązania z innym projektem albo wydawcą
- wielokrotne przesyłanie treści, które zostały już ukryte, usunięte lub zablokowane,
  bez naprawienia przyczyny problemu

Publikowanie na dużą skalę nie jest automatycznie nadużyciem. Duże katalogi są
akceptowalne, gdy wpisy są znacząco różne, dokładnie opisane, utrzymywane i
używane przez rzeczywistych użytkowników. Duże katalogi stają się problemem
zaufania i bezpieczeństwa, gdy skala łączy się z wpisami płytkimi,
duplikującymi się, wprowadzającymi w błąd, nieutrzymywanymi lub sztucznie
promowanymi.

## Prawa do treści

Jeśli uważasz, że treść w ClawHub narusza Twoje prawa autorskie lub inne prawa,
użyj [Żądań dotyczących praw do treści](/clawhub/content-rights). Nie używaj zwykłych
zgłoszeń marketplace do roszczeń dotyczących praw autorskich lub innych praw,
chyba że wpis jest również niebezpieczny, złośliwy albo wprowadzający w błąd.

## Przegląd i egzekwowanie

ClawHub może używać automatycznych kontroli, statystycznych sygnałów nadużyć,
zgłoszeń użytkowników i przeglądu personelu, aby identyfikować niebezpieczne
treści lub nadużycia w zachowaniu publikowania. Sygnał sam w sobie nie dowodzi
nadużycia; pomaga ClawHub zdecydować, co wymaga przeglądu.

Możemy:

- ukrywać, wstrzymywać, usuwać, miękko usuwać albo, jeśli typ zasobu to obsługuje,
  trwale usuwać naruszające zasady wpisy
- blokować pobrania lub instalacje niebezpiecznych wydań
- unieważniać tokeny API
- miękko usuwać powiązane treści
- ograniczać dostęp do publikowania
- banować powtarzających się lub poważnych naruszycieli

Nie gwarantujemy egzekwowania poprzedzonego ostrzeżeniem w przypadku oczywistych
nadużyć. Zobacz [Moderacja i bezpieczeństwo konta](/clawhub/moderation), aby uzyskać
informacje o zgłoszeniach, wstrzymaniach moderacyjnych, ukrytych wpisach, banach i
statusie konta.
