---
read_when:
    - Przeglądanie przesłanych plików pod kątem nadużyć lub naruszeń zasad
    - Pisanie dokumentacji moderacyjnej lub podręczników dla recenzentów
    - Decydowanie, czy skill powinien zostać ukryty, czy użytkownik zbanowany
sidebarTitle: Acceptable Usage
summary: 'Zasady marketplace: co ClawHub dopuszcza i czego nie będzie hostować.'
title: Dopuszczalne użycie
x-i18n:
    generated_at: "2026-07-04T04:08:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Dopuszczalne użycie

ClawHub hostuje Skills, pluginy, pakiety oraz metadane marketplace dla OpenClaw.
Użyj tej strony, aby zdecydować, czy treść lub zachowanie publikacyjne należy do
ClawHub.

Te zasady dotyczą tego, co robi wpis, o uruchomienie czego prosi użytkowników, jak
przedstawia sam siebie oraz jak wydawcy korzystają z powierzchni odkrywania,
instalacji i zaufania ClawHub. Informacje o stanach moderacji i reputacji konta
znajdziesz w [Moderacja i bezpieczeństwo konta](/clawhub/moderation). Informacje o
roszczeniach dotyczących praw autorskich lub innych praw znajdziesz w
[Zgłoszenia dotyczące praw do treści](/pl/clawhub/content-rights).

## Dozwolone treści

ClawHub przyjmuje treści, które są użyteczne, zrozumiałe i publikowane w dobrej
wierze.

| Kategoria                                         | Dozwolone, gdy                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produktywność deweloperska                           | Wpis pomaga użytkownikom budować, testować, migrować, debugować, dokumentować lub obsługiwać oprogramowanie.                                               |
| Przepływy pracy UI, danych i automatyzacji               | Zakres jest jasny, wymagane poświadczenia są wyraźnie określone, a ryzykowne działania obejmują ścieżki przeglądu, dry-run, podglądu lub potwierdzenia. |
| Bezpieczeństwo defensywne, moderacja i przegląd nadużyć | Narzędzie jest przedstawione jako przeznaczone do autoryzowanego przeglądu, zachowuje dowody i utrzymuje jasne granice zatwierdzania przez człowieka.                          |
| Osobiste lub zespołowe przepływy pracy                       | Przepływ pracy używa kont opartych na zgodzie, przejrzystej konfiguracji i wyraźnych uprawnień.                                            |
| Utrzymywane katalogi                              | Każdy wpis jest odrębny, użyteczny, dokładnie opisany i rozsądnie utrzymywany.                                                |

Kontekst ma znaczenie. Ten sam temat może być dopuszczalny w wąskim ustawieniu
defensywnym lub opartym na zgodzie, a niedopuszczalny, gdy jest opakowany jako
przepływ pracy służący nadużyciom.

## Niedozwolone treści

ClawHub nie hostuje treści, których głównym celem jest nadużycie, oszustwo,
niebezpieczne wykonanie lub naruszenie praw.

| Kategoria                                                    | Niedozwolone                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nieautoryzowany dostęp lub obejście zabezpieczeń                      | Obejście uwierzytelniania, przejęcie konta, nadużycie limitów szybkości, przejęcie połączenia na żywo lub agenta, kradzież sesji wielokrotnego użytku albo automatyczne zatwierdzanie przepływów parowania dla niezatwierdzonych użytkowników.                                                                                                                                                   |
| Nadużycia platformy i omijanie banów                              | Ukryte konta po banach, rozgrzewanie lub farmienie kont, fałszywe zaangażowanie, automatyzacja wielu kont, masowe publikowanie, boty spamujące albo automatyzacja zbudowana w celu uniknięcia wykrycia.                                                                                                                                          |
| Oszustwa, wyłudzenia i zwodnicze przepływy finansowe             | Fałszywe certyfikaty lub faktury, zwodnicze przepływy płatności, kontaktowanie się w celu oszustwa, fałszywy dowód społeczny, przepływy pracy z syntetyczną tożsamością do oszustw albo narzędzia do wydawania pieniędzy/obciążania bez jasnej zgody człowieka.                                                                                                                    |
| Wzbogacanie naruszające prywatność lub inwigilacja                 | Scrapowanie kontaktów do spamu, doxxing, stalking, pozyskiwanie leadów połączone z niezamówionym kontaktem, ukryte monitorowanie, niedobrowolne dopasowywanie biometryczne albo użycie wyciekłych danych lub zrzutów po naruszeniach bezpieczeństwa.                                                                                                                  |
| Niedobrowolne podszywanie się lub manipulacja tożsamością       | Zamiana twarzy, cyfrowe bliźniaki, sklonowani influencerzy, fałszywe persony lub inne narzędzia używane do podszywania się albo wprowadzania w błąd.                                                                                                                                                                                                 |
| Jawne treści seksualne lub generowanie treści dla dorosłych z wyłączonymi zabezpieczeniami | Generowanie obrazów, wideo lub treści NSFW; opakowania treści dla dorosłych wokół API stron trzecich; albo wpisy, których głównym celem są jawne treści seksualne.                                                                                                                                                       |
| Ukryte, niebezpieczne lub wprowadzające w błąd wymagania wykonania        | Zaciemnione polecenia instalacji, instalatory pipe-to-shell, takie jak pobrane treści uruchamiane przez `sh` lub `bash` bez jasnej możliwości przeglądu, nieujawnione wymagania dotyczące sekretów lub kluczy prywatnych, zdalne wykonanie `npx @latest` bez jasnej możliwości przeglądu albo metadane ukrywające, czego wpis naprawdę potrzebuje do uruchomienia. |
| Materiały naruszające prawa autorskie lub inne prawa           | Ponowne publikowanie cudzych Skills, pluginu, dokumentacji, zasobów marki lub zastrzeżonego kodu bez pozwolenia; naruszanie warunków licencji; albo podszywanie się pod pierwotnego autora lub wydawcę.                                                                                                                            |

## Niedozwolone zachowanie w marketplace

ClawHub sprawdza także, jak wydawcy korzystają z marketplace. Nie używaj ClawHub do
manipulowania odkrywaniem, metrykami, sygnałami zaufania, systemami moderacji ani
uwagą użytkowników.

Niedozwolone zachowanie w marketplace obejmuje:

- masowe publikowanie dużej liczby niskonakładowych, duplikacyjnych, zastępczych lub
  generowanych maszynowo wpisów, które nie wydają się mieć rzeczywistej wartości dla użytkowników
- zalewanie powierzchni wyszukiwania lub kategorii niemal identycznymi Skills lub pluginami
- publikowanie setek wpisów z małym użyciem lub bez użycia, utrzymania, jasności
  źródła albo znaczącego zróżnicowania
- sztuczne zawyżanie instalacji, pobrań, gwiazdek lub innych metryk
  zaangażowania przez automatyzację, pętle samoinstalacji, fałszywe konta, skoordynowane
  działania, płatne zaangażowanie lub inne nieorganiczne zachowanie
- tworzenie lub rotowanie kont w celu omijania moderacji, banów, limitów wydawcy lub
  przeglądu marketplace
- wprowadzanie użytkowników w błąd co do własności, źródła, możliwości, postawy bezpieczeństwa,
  wymagań instalacyjnych lub powiązania z innym projektem albo wydawcą
- wielokrotne przesyłanie treści, które zostały już ukryte, usunięte lub zablokowane,
  bez naprawienia podstawowego problemu

Publikowanie na dużą skalę nie jest automatycznie nadużyciem. Duże katalogi są dopuszczalne,
gdy wpisy są znacząco różne, dokładnie opisane, utrzymywane
i używane przez rzeczywistych użytkowników. Duże katalogi stają się problemem zaufania i bezpieczeństwa, gdy
wolumen łączy się z wpisami płytkimi, duplikacyjnymi, wprowadzającymi w błąd, nieutrzymywanymi lub
sztucznie promowanymi.

## Prawa do treści

Jeśli uważasz, że treść w ClawHub narusza Twoje prawa autorskie lub inne prawa, użyj
[Zgłoszenia dotyczące praw do treści](/pl/clawhub/content-rights). Nie używaj zwykłych zgłoszeń marketplace
do roszczeń dotyczących praw autorskich lub innych praw, chyba że wpis jest także niebezpieczny,
złośliwy lub wprowadzający w błąd.

## Przegląd i egzekwowanie

ClawHub może używać automatycznych kontroli, statystycznych sygnałów nadużyć, zgłoszeń użytkowników oraz
przeglądu przez personel, aby identyfikować niebezpieczne treści lub nadużycia publikacyjne. Sygnał
sam w sobie nie dowodzi nadużycia; pomaga ClawHub zdecydować, co wymaga przeglądu.

Możemy:

- ukrywać, wstrzymywać, usuwać, usuwać miękko lub, tam gdzie jest to obsługiwane dla danego typu zasobu,
  usuwać trwale naruszające zasady wpisy
- blokować pobrania lub instalacje niebezpiecznych wydań
- unieważniać tokeny API
- usuwać miękko powiązane treści
- ograniczać dostęp do publikowania
- banować powtarzających się lub poważnych naruszycieli

Nie gwarantujemy egzekwowania z najpierw wysłanym ostrzeżeniem w przypadku oczywistych nadużyć. Zobacz
[Moderacja i bezpieczeństwo konta](/clawhub/moderation), aby uzyskać informacje o zgłoszeniach, wstrzymaniach moderacyjnych,
ukrytych wpisach, banach i reputacji konta.
