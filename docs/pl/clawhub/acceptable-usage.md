---
read_when:
    - Przeglądanie przesłanych plików pod kątem nadużyć lub naruszeń zasad
    - Pisanie dokumentacji moderacji lub runbooków dla recenzentów
    - Decydowanie, czy umiejętność powinna zostać ukryta, czy użytkownik zbanowany
sidebarTitle: Acceptable Usage
summary: 'Zasady sklepu: co ClawHub dopuszcza i czego nie będzie hostować.'
title: Dopuszczalne użycie
x-i18n:
    generated_at: "2026-07-01T20:37:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Dopuszczalne użycie

ClawHub hostuje Skills, pluginy, pakiety i metadane marketplace dla OpenClaw.
Ta strona pomaga zdecydować, czy treści lub sposób publikowania należą do
ClawHub.

Te zasady dotyczą tego, co robi wpis, czego wymaga od użytkowników, jak się
przedstawia oraz jak wydawcy używają powierzchni odkrywania, instalacji i
zaufania ClawHub. Stany moderacji i status konta opisuje
[Moderacja i bezpieczeństwo konta](/clawhub/moderation). Roszczenia dotyczące praw
autorskich lub innych praw opisuje [Żądania dotyczące praw do treści](/pl/clawhub/content-rights).

## Dozwolone treści

ClawHub przyjmuje treści, które są użyteczne, zrozumiałe i publikowane w dobrej
wierze.

| Kategoria                                        | Dozwolone, gdy                                                                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Produktywność deweloperów                       | Wpis pomaga użytkownikom tworzyć, testować, migrować, debugować, dokumentować lub obsługiwać oprogramowanie.                         |
| Przepływy UI, danych i automatyzacji             | Zakres jest jasny, wymagane poświadczenia są wyraźnie wskazane, a ryzykowne działania obejmują ścieżki przeglądu, przebiegu próbnego, podglądu lub potwierdzenia. |
| Bezpieczeństwo defensywne, moderacja i przegląd nadużyć | Narzędzie jest przedstawione jako służące do autoryzowanego przeglądu, zachowuje dowody i jasno utrzymuje granice zatwierdzania przez człowieka. |
| Przepływy osobiste lub zespołowe                 | Przepływ używa kont opartych na zgodzie, przejrzystej konfiguracji i jawnych uprawnień.                                               |
| Utrzymywane katalogi                             | Każdy wpis jest odrębny, użyteczny, dokładnie opisany i rozsądnie utrzymywany.                                                        |

Kontekst ma znaczenie. Ten sam temat może być dopuszczalny w wąskim ustawieniu
defensywnym lub opartym na zgodzie, a niedopuszczalny, gdy jest opakowany jako
przepływ nadużyć.

## Niedozwolone treści

ClawHub nie hostuje treści, których głównym celem jest nadużycie, oszustwo,
niebezpieczne wykonanie lub naruszenie praw.

| Kategoria                                                   | Niedozwolone                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nieautoryzowany dostęp lub obejście zabezpieczeń            | Obejście uwierzytelniania, przejęcie konta, nadużycie limitów szybkości, przejęcie połączenia na żywo lub agenta, kradzież sesji wielokrotnego użytku albo automatyczne zatwierdzanie przepływów parowania dla niezatwierdzonych użytkowników.                                                                  |
| Nadużycia platformy i omijanie blokad                       | Ukryte konta po blokadach, rozgrzewanie lub hodowanie kont, fałszywe zaangażowanie, automatyzacja wielu kont, masowe publikowanie, boty spamujące albo automatyzacja zbudowana w celu uniknięcia wykrycia.                                                                                                      |
| Oszustwa, scamy i zwodnicze przepływy finansowe             | Fałszywe certyfikaty lub faktury, zwodnicze przepływy płatności, kontaktowanie się w celu scamu, fałszywy dowód społeczny, przepływy syntetycznej tożsamości do oszustw albo narzędzia do wydawania/obciążania bez jasnej akceptacji człowieka.                                                                  |
| Inwazyjne wobec prywatności wzbogacanie danych lub nadzór   | Scraping kontaktów do spamu, doxxing, stalking, pozyskiwanie leadów połączone z niezamówionym kontaktem, ukryte monitorowanie, biometryczne dopasowywanie bez zgody albo użycie wyciekłych danych lub zrzutów z naruszeń.                                                                                       |
| Podszywanie się lub manipulacja tożsamością bez zgody       | Zamiana twarzy, cyfrowe bliźniaki, sklonowani influencerzy, fałszywe persony albo inne narzędzia używane do podszywania się lub wprowadzania w błąd.                                                                                                                                                            |
| Jawne treści seksualne lub generowanie treści dla dorosłych z wyłączonymi zabezpieczeniami | Generowanie obrazów, wideo lub treści NSFW; wrappery treści dla dorosłych wokół API firm trzecich; albo wpisy, których głównym celem są jawne treści seksualne.                                                                                                                                                |
| Ukryte, niebezpieczne lub mylące wymagania wykonania        | Zaciemnione polecenia instalacji, instalatory typu pipe-to-shell, takie jak pobrane treści uruchamiane przez `sh` lub `bash` bez jasnej możliwości przeglądu, nieujawnione wymagania dotyczące sekretów lub kluczy prywatnych, zdalne wykonanie `npx @latest` bez jasnej możliwości przeglądu albo metadane ukrywające, czego wpis naprawdę potrzebuje do działania. |
| Materiały naruszające prawa autorskie lub inne prawa        | Ponowne publikowanie cudzych Skills, pluginów, dokumentacji, zasobów marki lub zastrzeżonego kodu bez pozwolenia; naruszanie warunków licencji; albo podszywanie się pod pierwotnego autora lub wydawcę.                                                                                                       |

## Niedozwolone zachowania w marketplace

ClawHub sprawdza również, jak wydawcy używają marketplace. Nie używaj ClawHub do
manipulowania odkrywaniem, metrykami, sygnałami zaufania, systemami moderacji ani
uwagą użytkowników.

Niedozwolone zachowania w marketplace obejmują:

- masowe publikowanie dużej liczby niskiej jakości, powielających się,
  zastępczych lub generowanych maszynowo wpisów, które nie wydają się mieć
  realnej wartości dla użytkownika
- zalewanie powierzchni wyszukiwania lub kategorii niemal identycznymi Skills
  lub pluginami
- publikowanie setek wpisów z niewielkim użyciem lub bez użycia, utrzymania,
  jasności źródła albo znaczącego zróżnicowania
- sztuczne zawyżanie liczby instalacji, pobrań, gwiazdek lub innych metryk
  zaangażowania przez automatyzację, pętle samoinstalacji, fałszywe konta,
  skoordynowaną aktywność, płatne zaangażowanie albo inne nieorganiczne działania
- tworzenie lub rotowanie kont w celu omijania moderacji, blokad, limitów
  wydawcy lub przeglądu marketplace
- wprowadzanie użytkowników w błąd co do własności, źródła, możliwości, stanu
  bezpieczeństwa, wymagań instalacji lub powiązania z innym projektem albo
  wydawcą
- wielokrotne przesyłanie treści, które zostały już ukryte, usunięte lub
  zablokowane, bez naprawienia problemu źródłowego

Publikowanie na dużą skalę nie jest automatycznie nadużyciem. Duże katalogi są
akceptowalne, gdy wpisy znacząco się różnią, są dokładnie opisane, utrzymywane i
używane przez rzeczywistych użytkowników. Duże katalogi stają się problemem
zaufania i bezpieczeństwa, gdy skala łączy się z wpisami płytkimi,
powielającymi się, mylącymi, nieutrzymywanymi lub sztucznie promowanymi.

## Prawa do treści

Jeśli uważasz, że treść w ClawHub narusza Twoje prawa autorskie lub inne prawa,
użyj [Żądań dotyczących praw do treści](/pl/clawhub/content-rights). Nie używaj
zwykłych zgłoszeń marketplace do roszczeń dotyczących praw autorskich lub innych
praw, chyba że wpis jest również niebezpieczny, złośliwy lub mylący.

## Przegląd i egzekwowanie

ClawHub może używać automatycznych kontroli, statystycznych sygnałów nadużyć,
zgłoszeń użytkowników i przeglądu przez personel, aby identyfikować
niebezpieczne treści lub nadużycia w publikowaniu. Sygnał sam w sobie nie
dowodzi nadużycia; pomaga ClawHub zdecydować, co wymaga przeglądu.

Możemy:

- ukrywać, wstrzymywać, usuwać, miękko usuwać albo, tam gdzie jest to obsługiwane
  dla danego typu zasobu, trwale usuwać naruszające zasady wpisy
- blokować pobieranie lub instalacje niebezpiecznych wydań
- unieważniać tokeny API
- miękko usuwać powiązane treści
- ograniczać dostęp do publikowania
- blokować osoby dopuszczające się powtarzających się lub poważnych naruszeń

Nie gwarantujemy egzekwowania najpierw z ostrzeżeniem w przypadku oczywistych
nadużyć. Zobacz [Moderacja i bezpieczeństwo konta](/clawhub/moderation), aby
uzyskać informacje o zgłoszeniach, wstrzymaniach moderacyjnych, ukrytych wpisach,
blokadach i statusie konta.
