---
read_when:
    - Sprawdzanie przesłanych plików pod kątem nadużyć lub naruszeń zasad
    - Pisanie dokumentacji moderacji lub podręczników dla recenzentów
    - Decydowanie, czy skill powinien zostać ukryty, czy użytkownik zbanowany
sidebarTitle: Acceptable Usage
summary: 'Zasady marketplace: co ClawHub dopuszcza i czego nie będzie hostować.'
title: Dopuszczalne użycie
x-i18n:
    generated_at: "2026-06-27T17:15:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Dopuszczalne użytkowanie

ClawHub hostuje Skills, pluginy, pakiety i metadane marketplace dla OpenClaw.
Użyj tej strony, aby zdecydować, czy treść lub zachowanie publikowania należy do
ClawHub.

Te reguły dotyczą tego, co robi wpis, o co prosi użytkowników, jak
przedstawia sam siebie oraz jak wydawcy korzystają z powierzchni odkrywania,
instalacji i zaufania ClawHub. Stany moderacji i status konta opisuje
[Moderacja i bezpieczeństwo konta](/pl/clawhub/moderation). Roszczenia dotyczące praw autorskich lub innych praw opisuje [Żądania dotyczące praw do treści](/pl/clawhub/content-rights).

## Dozwolona treść

ClawHub przyjmuje treści, które są użyteczne, zrozumiałe i publikowane w dobrej
wierze.

| Kategoria                                         | Dozwolone, gdy                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produktywność deweloperska                           | Wpis pomaga użytkownikom budować, testować, migrować, debugować, dokumentować lub obsługiwać oprogramowanie.                                               |
| Przepływy pracy UI, danych i automatyzacji               | Zakres jest jasny, wymagane poświadczenia są wyraźnie wskazane, a ryzykowne działania obejmują ścieżki przeglądu, uruchomienia próbnego, podglądu lub potwierdzenia. |
| Bezpieczeństwo defensywne, moderacja i przegląd nadużyć | Narzędzie jest przedstawione jako służące do autoryzowanego przeglądu, zachowuje dowody i utrzymuje jasne granice zatwierdzania przez człowieka.                          |
| Osobiste lub zespołowe przepływy pracy                       | Przepływ pracy używa kont opartych na zgodzie, przejrzystej konfiguracji i wyraźnych uprawnień.                                            |
| Utrzymywane katalogi                              | Każdy wpis jest odrębny, użyteczny, dokładnie opisany i rozsądnie utrzymywany.                                                |

Kontekst ma znaczenie. Ten sam temat może być akceptowalny w wąskim ustawieniu
defensywnym lub opartym na zgodzie, a niedopuszczalny, gdy jest opakowany jako
przepływ pracy do nadużyć.

## Niedozwolona treść

ClawHub nie hostuje treści, których głównym celem jest nadużycie, oszustwo,
niebezpieczne wykonywanie lub naruszenie praw.

| Kategoria                                                    | Niedozwolone                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nieautoryzowany dostęp lub obejście zabezpieczeń                      | Obejście uwierzytelniania, przejęcie konta, nadużywanie limitów szybkości, przejęcie połączenia na żywo lub agenta, kradzież sesji wielokrotnego użytku albo automatyczne zatwierdzanie przepływów parowania dla niezatwierdzonych użytkowników.                                                                                                                                                   |
| Nadużycia platformy i obchodzenie banów                              | Ukryte konta po banach, rozgrzewanie lub farmienie kont, fałszywe zaangażowanie, automatyzacja wielu kont, masowe publikowanie, boty spamujące albo automatyzacja zbudowana w celu unikania wykrycia.                                                                                                                                          |
| Oszustwa, scamy i zwodnicze przepływy finansowe             | Fałszywe certyfikaty lub faktury, zwodnicze przepływy płatności, scamowy outreach, fałszywy dowód społeczny, przepływy pracy z syntetyczną tożsamością do oszustw albo narzędzia do wydawania/obciążania bez jasnej zgody człowieka.                                                                                                                    |
| Naruszające prywatność wzbogacanie lub nadzór                 | Scraping kontaktów do spamu, doxxing, stalking, ekstrakcja leadów połączona z niezamówionym outreach, ukryte monitorowanie, niedobrowolne dopasowywanie biometryczne albo użycie wyciekłych danych lub zrzutów z naruszeń.                                                                                                                  |
| Niedobrowolne podszywanie się lub manipulacja tożsamością       | Face swap, cyfrowe bliźniaki, klonowani influencerzy, fałszywe persony albo inne narzędzia używane do podszywania się lub wprowadzania w błąd.                                                                                                                                                                                                 |
| Jawne treści seksualne lub generowanie treści dla dorosłych z wyłączonymi zabezpieczeniami | Generowanie obrazów, wideo lub treści NSFW; wrappery treści dla dorosłych wokół API stron trzecich; albo wpisy, których podstawowym celem są jawne treści seksualne.                                                                                                                                                       |
| Ukryte, niebezpieczne lub wprowadzające w błąd wymagania wykonania        | Zaciemnione polecenia instalacyjne, instalatory pipe-to-shell, takie jak pobrana treść uruchamiana przez `sh` lub `bash` bez jasnej możliwości przeglądu, niezgłoszone wymagania dotyczące sekretów lub kluczy prywatnych, zdalne wykonywanie `npx @latest` bez jasnej możliwości przeglądu albo metadane ukrywające, czego wpis naprawdę potrzebuje do uruchomienia. |
| Materiały naruszające prawa autorskie lub inne prawa           | Ponowne publikowanie cudzej umiejętności, pluginu, dokumentacji, zasobów marki lub zastrzeżonego kodu bez pozwolenia; naruszanie warunków licencji; albo podszywanie się pod oryginalnego autora lub wydawcę.                                                                                                                            |

## Niedozwolone zachowanie marketplace

ClawHub sprawdza także, jak wydawcy używają marketplace. Nie używaj ClawHub do
manipulowania odkrywaniem, metrykami, sygnałami zaufania, systemami moderacji
ani uwagą użytkowników.

Niedozwolone zachowanie marketplace obejmuje:

- masowe publikowanie dużej liczby wpisów o niskim nakładzie pracy,
  duplikatywnych, zastępczych lub generowanych maszynowo, które nie wydają się
  mieć realnej wartości dla użytkowników
- zalewanie powierzchni wyszukiwania lub kategorii niemal identycznymi Skills lub pluginami
- publikowanie setek wpisów z niewielkim użyciem lub bez użycia, utrzymania,
  jasności źródła albo znaczącego zróżnicowania
- sztuczne zawyżanie instalacji, pobrań, gwiazdek lub innych metryk
  zaangażowania przez automatyzację, pętle samodzielnej instalacji, fałszywe
  konta, skoordynowaną aktywność, płatne zaangażowanie albo inne nieorganiczne zachowanie
- tworzenie lub rotowanie kont w celu obchodzenia moderacji, banów, limitów wydawcy lub
  przeglądu marketplace
- wprowadzanie użytkowników w błąd co do własności, źródła, możliwości, postawy bezpieczeństwa,
  wymagań instalacyjnych lub powiązania z innym projektem albo wydawcą
- wielokrotne przesyłanie treści, które zostały już ukryte, usunięte lub zablokowane,
  bez naprawienia podstawowego problemu

Publikowanie na dużą skalę nie jest automatycznie nadużyciem. Duże katalogi są
akceptowalne, gdy wpisy znacząco się różnią, są dokładnie opisane, utrzymywane
i używane przez realnych użytkowników. Duże katalogi stają się problemem zaufania
i bezpieczeństwa, gdy wolumen łączy się z wpisami powierzchownymi, duplikatywnymi,
wprowadzającymi w błąd, nieutrzymywanymi lub sztucznie promowanymi.

## Prawa do treści

Jeśli uważasz, że treść w ClawHub narusza Twoje prawa autorskie lub inne prawa,
użyj [Żądań dotyczących praw do treści](/pl/clawhub/content-rights). Nie używaj zwykłych zgłoszeń marketplace
do roszczeń dotyczących praw autorskich lub innych praw, chyba że wpis jest także niebezpieczny,
złośliwy lub wprowadzający w błąd.

## Przegląd i egzekwowanie

ClawHub może używać zautomatyzowanych kontroli, statystycznych sygnałów nadużyć,
zgłoszeń użytkowników i przeglądu przez personel, aby identyfikować niebezpieczne treści
lub nadużycia w publikowaniu. Sygnał sam w sobie nie dowodzi nadużycia; pomaga
ClawHub zdecydować, co wymaga przeglądu.

Możemy:

- ukryć, wstrzymać, usunąć, miękko usunąć albo, gdy typ zasobu to obsługuje,
  trwale usunąć naruszające wpisy
- blokować pobrania lub instalacje niebezpiecznych wydań
- unieważniać tokeny API
- miękko usuwać powiązane treści
- ograniczać dostęp do publikowania
- banować recydywistów lub sprawców poważnych naruszeń

Nie gwarantujemy egzekwowania z wcześniejszym ostrzeżeniem w przypadku oczywistych nadużyć. Zobacz
[Moderacja i bezpieczeństwo konta](/pl/clawhub/moderation), aby uzyskać informacje o zgłoszeniach, wstrzymaniach moderacyjnych,
ukrytych wpisach, banach i statusie konta.
