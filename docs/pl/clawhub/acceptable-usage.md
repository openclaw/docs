---
read_when:
    - Sprawdzanie przesłanych plików pod kątem nadużyć lub naruszeń zasad
    - Pisanie dokumentacji moderacji lub runbooków dla recenzentów
    - Decydowanie, czy Skills powinien zostać ukryty, czy użytkownik zbanowany
sidebarTitle: Acceptable Usage
summary: 'Zasady Marketplace: co ClawHub dopuszcza i czego nie będzie hostować.'
title: Dopuszczalne użycie
x-i18n:
    generated_at: "2026-07-04T15:37:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Dopuszczalne użycie

ClawHub hostuje Skills, pluginy, pakiety i metadane marketplace dla OpenClaw.
Użyj tej strony, aby zdecydować, czy treść albo sposób publikowania pasuje do
ClawHub.

Te zasady dotyczą tego, co robi wpis, o uruchomienie czego prosi użytkowników,
jak przedstawia sam siebie oraz jak wydawcy korzystają z powierzchni
odkrywania, instalacji i zaufania ClawHub. Informacje o stanach moderacji i
statusie konta znajdziesz w sekcji
[Moderacja i bezpieczeństwo konta](/clawhub/moderation). W sprawach dotyczących
praw autorskich lub innych roszczeń z tytułu praw zobacz
[Wnioski dotyczące praw do treści](/pl/clawhub/content-rights).

## Dozwolone treści

ClawHub przyjmuje treści, które są użyteczne, zrozumiałe i publikowane w dobrej
wierze.

| Kategoria                                        | Dozwolone, gdy                                                                                                                    |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produktywność programistów                       | Wpis pomaga użytkownikom budować, testować, migrować, debugować, dokumentować lub obsługiwać oprogramowanie.                     |
| Przepływy pracy UI, danych i automatyzacji       | Zakres jest jasny, wymagane dane uwierzytelniające są jawne, a ryzykowne działania mają ścieżki przeglądu, dry-run, podglądu lub potwierdzenia. |
| Obronna ochrona, moderacja i przegląd nadużyć    | Narzędzie jest przedstawione jako przeznaczone do autoryzowanego przeglądu, zachowuje dowody i jasno utrzymuje granice zatwierdzania przez człowieka. |
| Osobiste lub zespołowe przepływy pracy           | Przepływ pracy używa kont opartych na zgodzie, przejrzystej konfiguracji i jawnych uprawnień.                                    |
| Utrzymywane katalogi                             | Każdy wpis jest odrębny, użyteczny, dokładnie opisany i rozsądnie utrzymywany.                                                    |

Kontekst ma znaczenie. Ten sam temat może być akceptowalny w wąskim ustawieniu
obronnym lub opartym na zgodzie, a niedopuszczalny, gdy jest opakowany jako
przepływ pracy do nadużyć.

## Niedozwolone treści

ClawHub nie hostuje treści, których głównym celem jest nadużycie, oszustwo,
niebezpieczne wykonywanie albo naruszenie praw.

| Kategoria                                                   | Niedozwolone                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nieautoryzowany dostęp lub obchodzenie zabezpieczeń         | Omijanie uwierzytelniania, przejęcie konta, nadużywanie limitów szybkości, przejęcie połączenia na żywo lub agenta, kradzież sesji wielokrotnego użytku albo automatyczne zatwierdzanie przepływów parowania dla niezatwierdzonych użytkowników.                                                              |
| Nadużywanie platformy i omijanie blokad                     | Ukryte konta po blokadach, rozgrzewanie lub hodowanie kont, fałszywe zaangażowanie, automatyzacja wielu kont, masowe publikowanie, boty spamujące albo automatyzacja zbudowana w celu uniknięcia wykrycia.                                                                                                   |
| Oszustwa, wyłudzenia i zwodnicze przepływy finansowe        | Fałszywe certyfikaty lub faktury, zwodnicze przepływy płatności, kontaktowanie się w ramach oszustw, fałszywy dowód społeczny, przepływy syntetycznej tożsamości do oszustw albo narzędzia do wydawania/obciążania bez jasnego zatwierdzenia przez człowieka.                                                |
| Naruszające prywatność wzbogacanie danych lub nadzór        | Zbieranie kontaktów do spamu, doxxing, stalking, pozyskiwanie leadów połączone z niezamówionym kontaktem, ukryte monitorowanie, niekonsensualne dopasowywanie biometryczne albo użycie wyciekłych danych lub zrzutów po naruszeniach.                                                                        |
| Niekonsensualne podszywanie się lub manipulacja tożsamością | Zamiana twarzy, cyfrowe bliźniaki, sklonowani influencerzy, fałszywe persony albo inne narzędzia używane do podszywania się lub wprowadzania w błąd.                                                                                                                                                          |
| Jawne treści seksualne lub generowanie treści dla dorosłych z wyłączonymi zabezpieczeniami | Generowanie obrazów, wideo lub treści NSFW; nakładki dla treści dla dorosłych wokół API stron trzecich; albo wpisy, których głównym celem są jawne treści seksualne.                                                                                                                                          |
| Ukryte, niebezpieczne lub mylące wymagania wykonania        | Zaciemnione polecenia instalacji, instalatory typu pipe-to-shell, takie jak pobrana treść uruchamiana przez `sh` lub `bash` bez jasnej możliwości przeglądu, nieujawnione wymagania dotyczące sekretów lub kluczy prywatnych, zdalne wykonanie `npx @latest` bez jasnej możliwości przeglądu albo metadane ukrywające, czego wpis naprawdę potrzebuje do uruchomienia. |
| Materiały naruszające prawa autorskie lub inne prawa        | Ponowne publikowanie cudzej Skill, pluginu, dokumentacji, zasobów marki lub kodu własnościowego bez pozwolenia; naruszanie warunków licencji; albo podszywanie się pod pierwotnego autora lub wydawcę.                                                                                                        |

## Niedozwolone zachowanie w marketplace

ClawHub sprawdza także, jak wydawcy korzystają z marketplace. Nie używaj ClawHub
do manipulowania odkrywaniem, metrykami, sygnałami zaufania, systemami moderacji
ani uwagą użytkowników.

Niedozwolone zachowanie w marketplace obejmuje:

- masowe publikowanie dużej liczby niskonakładowych, duplikujących się,
  zastępczych lub generowanych maszynowo wpisów, które nie wydają się mieć
  rzeczywistej wartości dla użytkowników
- zalewanie wyszukiwania lub powierzchni kategorii niemal identycznymi Skills
  lub pluginami
- publikowanie setek wpisów z niewielkim użyciem albo bez użycia, konserwacji,
  jasności źródła lub znaczącego zróżnicowania
- sztuczne zawyżanie instalacji, pobrań, gwiazdek lub innych metryk
  zaangażowania za pomocą automatyzacji, pętli samodzielnej instalacji,
  fałszywych kont, skoordynowanej aktywności, płatnego zaangażowania lub innego
  nieorganicznego zachowania
- tworzenie lub rotowanie kont w celu obejścia moderacji, blokad, limitów
  wydawcy lub przeglądu marketplace
- wprowadzanie użytkowników w błąd co do własności, źródła, możliwości, poziomu
  bezpieczeństwa, wymagań instalacyjnych lub powiązania z innym projektem albo
  wydawcą
- wielokrotne przesyłanie treści, które zostały już ukryte, usunięte lub
  zablokowane, bez naprawienia podstawowego problemu

Publikowanie dużej liczby wpisów nie jest automatycznie nadużyciem. Duże
katalogi są akceptowalne, gdy wpisy są znacząco różne, dokładnie opisane,
utrzymywane i używane przez rzeczywistych użytkowników. Duże katalogi stają się
problemem zaufania i bezpieczeństwa, gdy wolumen łączy się z wpisami płytkimi,
duplikującymi się, mylącymi, nieutrzymywanymi lub sztucznie promowanymi.

## Prawa do treści

Jeśli uważasz, że treść w ClawHub narusza Twoje prawa autorskie lub inne prawa,
użyj sekcji [Wnioski dotyczące praw do treści](/pl/clawhub/content-rights). Nie
używaj zwykłych zgłoszeń marketplace do roszczeń dotyczących praw autorskich lub
innych praw, chyba że wpis jest również niebezpieczny, złośliwy albo mylący.

## Przegląd i egzekwowanie

ClawHub może używać automatycznych kontroli, statystycznych sygnałów nadużyć,
zgłoszeń użytkowników i przeglądu pracowników, aby identyfikować niebezpieczne
treści lub nadużycia w publikowaniu. Sygnał sam w sobie nie dowodzi nadużycia;
pomaga ClawHub zdecydować, co wymaga przeglądu.

Możemy:

- ukrywać, wstrzymywać, usuwać, usuwać miękko albo, gdy jest to obsługiwane dla
  danego typu zasobu, usuwać trwale naruszające zasady wpisy
- blokować pobrania lub instalacje niebezpiecznych wydań
- unieważniać tokeny API
- miękko usuwać powiązane treści
- ograniczać dostęp do publikowania
- blokować powtarzających się lub poważnych naruszycieli

Nie gwarantujemy egzekwowania poprzedzonego ostrzeżeniem w przypadku oczywistych
nadużyć. Zobacz [Moderacja i bezpieczeństwo konta](/clawhub/moderation), aby
uzyskać informacje o zgłoszeniach, wstrzymaniach moderacyjnych, ukrytych
wpisach, blokadach i statusie konta.
