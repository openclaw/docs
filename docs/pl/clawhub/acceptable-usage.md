---
read_when:
    - Sprawdzanie przesłanych plików pod kątem nadużyć lub naruszeń zasad
    - Pisanie dokumentacji moderacji lub podręczników dla recenzentów
    - Decydowanie, czy umiejętność powinna zostać ukryta, czy użytkownik zbanowany
sidebarTitle: Acceptable Usage
summary: 'Zasady marketplace: co ClawHub dopuszcza i czego nie będzie hostować.'
title: Dopuszczalne użycie
x-i18n:
    generated_at: "2026-07-03T01:04:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Akceptowalne użycie

ClawHub hostuje Skills, pluginy, pakiety i metadane marketplace dla OpenClaw.
Ta strona pomaga zdecydować, czy dana treść lub sposób publikacji należy do
ClawHub.

Te zasady dotyczą tego, co robi wpis, o uruchomienie czego prosi użytkowników,
jak się przedstawia oraz jak wydawcy korzystają z powierzchni odkrywania,
instalacji i zaufania ClawHub. Stany moderacji i status konta opisuje
[Moderacja i bezpieczeństwo konta](/clawhub/moderation). Roszczenia dotyczące
praw autorskich lub innych praw opisują [Żądania dotyczące praw do treści](/pl/clawhub/content-rights).

## Dozwolone treści

ClawHub przyjmuje treści, które są użyteczne, zrozumiałe i publikowane w dobrej
wierze.

| Kategoria                                         | Dozwolone, gdy                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produktywność deweloperów                           | Wpis pomaga użytkownikom tworzyć, testować, migrować, debugować, dokumentować lub obsługiwać oprogramowanie.                                               |
| Przepływy pracy UI, danych i automatyzacji               | Zakres jest jasny, wymagane dane uwierzytelniające są wyraźnie wskazane, a ryzykowne działania obejmują ścieżki przeglądu, przebiegu próbnego, podglądu lub potwierdzenia. |
| Obronna analiza bezpieczeństwa, moderacji i nadużyć | Narzędzie jest przedstawione jako przeznaczone do autoryzowanego przeglądu, zachowuje dowody i jasno utrzymuje granice zatwierdzania przez człowieka.                          |
| Osobiste lub zespołowe przepływy pracy                       | Przepływ pracy używa kont opartych na zgodzie, przejrzystej konfiguracji i wyraźnych uprawnień.                                            |
| Utrzymywane katalogi                              | Każdy wpis jest odrębny, użyteczny, dokładnie opisany i rozsądnie utrzymywany.                                                |

Kontekst ma znaczenie. Ten sam temat może być akceptowalny w wąskim, obronnym
lub opartym na zgodzie ustawieniu i niedopuszczalny, gdy jest opakowany jako
przepływ pracy do nadużyć.

## Niedozwolone treści

ClawHub nie hostuje treści, których głównym celem jest nadużycie, oszustwo,
niebezpieczne wykonywanie lub naruszenie praw.

| Kategoria                                                    | Niedozwolone                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nieautoryzowany dostęp lub obejście zabezpieczeń                      | Obejście uwierzytelniania, przejęcie konta, nadużycie limitów szybkości, przejęcie połączenia na żywo lub agenta, kradzież sesji wielokrotnego użytku albo automatyczne zatwierdzanie przepływów parowania dla niezatwierdzonych użytkowników.                                                                                                                                                   |
| Nadużycia platformy i obchodzenie blokad                              | Ukryte konta po blokadach, rozgrzewanie lub farmienie kont, fałszywe zaangażowanie, automatyzacja wielu kont, masowe publikowanie, boty spamujące albo automatyzacja zbudowana w celu uniknięcia wykrycia.                                                                                                                                          |
| Oszustwa, wyłudzenia i zwodnicze przepływy finansowe             | Fałszywe certyfikaty lub faktury, zwodnicze przepływy płatności, kontaktowanie się w celu wyłudzeń, fałszywy dowód społeczny, przepływy pracy z syntetyczną tożsamością do oszustw albo narzędzia do wydawania/obciążania bez jasnej zgody człowieka.                                                                                                                    |
| Inwazyjne wobec prywatności wzbogacanie danych lub nadzór                 | Zbieranie kontaktów do spamu, doxxing, stalking, pozyskiwanie leadów połączone z niezamówionym kontaktem, ukryte monitorowanie, biometryczne dopasowywanie bez zgody albo użycie wyciekłych danych lub zrzutów z naruszeń bezpieczeństwa.                                                                                                                  |
| Podszywanie się bez zgody lub manipulacja tożsamością       | Zamiana twarzy, cyfrowe bliźniaki, sklonowani influencerzy, fałszywe persony lub inne narzędzia używane do podszywania się albo wprowadzania w błąd.                                                                                                                                                                                                 |
| Wyraźne treści seksualne lub generowanie treści dla dorosłych z wyłączonymi zabezpieczeniami | Generowanie obrazów, filmów lub treści NSFW; wrappery treści dla dorosłych wokół API firm trzecich; albo wpisy, których głównym celem są wyraźne treści seksualne.                                                                                                                                                       |
| Ukryte, niebezpieczne lub mylące wymagania wykonania        | Zaciemnione polecenia instalacji, instalatory typu pipe-to-shell, takie jak pobrane treści uruchamiane za pomocą `sh` lub `bash` bez jasnej możliwości przeglądu, niezadeklarowane wymagania dotyczące sekretów lub kluczy prywatnych, zdalne wykonanie `npx @latest` bez jasnej możliwości przeglądu albo metadane ukrywające, czego wpis naprawdę potrzebuje do uruchomienia. |
| Materiały naruszające prawa autorskie lub inne prawa           | Ponowne publikowanie cudzej umiejętności, pluginu, dokumentacji, zasobów marki lub zastrzeżonego kodu bez pozwolenia; naruszanie warunków licencji; albo podszywanie się pod pierwotnego autora lub wydawcę.                                                                                                                            |

## Niedozwolone zachowania w marketplace

ClawHub sprawdza także, jak wydawcy korzystają z marketplace. Nie używaj ClawHub
do manipulowania odkrywaniem, metrykami, sygnałami zaufania, systemami moderacji
lub uwagą użytkowników.

Niedozwolone zachowania w marketplace obejmują:

- masowe publikowanie dużej liczby niskonakładowych, powielających się,
  zastępczych lub generowanych maszynowo wpisów, które nie wydają się mieć
  rzeczywistej wartości dla użytkowników
- zalewanie wyszukiwania lub powierzchni kategorii niemal identycznymi Skills
  lub pluginami
- publikowanie setek wpisów przy niewielkim lub żadnym użyciu, utrzymaniu,
  jasności źródła albo znaczącym zróżnicowaniu
- sztuczne zawyżanie instalacji, pobrań, gwiazdek lub innych metryk
  zaangażowania przez automatyzację, pętle samodzielnej instalacji, fałszywe
  konta, skoordynowaną aktywność, płatne zaangażowanie lub inne nieorganiczne
  zachowanie
- tworzenie lub rotowanie kont w celu obejścia moderacji, blokad, limitów
  wydawcy lub przeglądu marketplace
- wprowadzanie użytkowników w błąd co do własności, źródła, możliwości, stanu
  bezpieczeństwa, wymagań instalacyjnych lub powiązania z innym projektem albo
  wydawcą
- wielokrotne przesyłanie treści, które zostały już ukryte, usunięte lub
  zablokowane, bez naprawienia podstawowego problemu

Publikowanie na dużą skalę nie jest automatycznie nadużyciem. Duże katalogi są
akceptowalne, gdy wpisy są znacząco różne, dokładnie opisane, utrzymywane i
używane przez rzeczywistych użytkowników. Duże katalogi stają się problemem
zaufania i bezpieczeństwa, gdy skala łączy się z powierzchownymi, powielającymi
się, mylącymi, nieutrzymywanymi lub sztucznie promowanymi wpisami.

## Prawa do treści

Jeśli uważasz, że treść w ClawHub narusza Twoje prawa autorskie lub inne prawa,
użyj [Żądań dotyczących praw do treści](/pl/clawhub/content-rights). Nie używaj
zwykłych zgłoszeń marketplace do roszczeń dotyczących praw autorskich lub innych
praw, chyba że wpis jest również niebezpieczny, złośliwy lub mylący.

## Przegląd i egzekwowanie

ClawHub może używać automatycznych kontroli, statystycznych sygnałów nadużyć,
zgłoszeń użytkowników i przeglądu przez pracowników do identyfikowania
niebezpiecznych treści lub nadużyć w publikowaniu. Sygnał sam w sobie nie
dowodzi nadużycia; pomaga ClawHub zdecydować, co wymaga przeglądu.

Możemy:

- ukrywać, wstrzymywać, usuwać, miękko usuwać lub, gdy jest to obsługiwane dla
  danego typu zasobu, trwale usuwać naruszające wpisy
- blokować pobieranie lub instalacje niebezpiecznych wydań
- unieważniać tokeny API
- miękko usuwać powiązane treści
- ograniczać dostęp do publikowania
- blokować powtarzających się lub poważnych naruszycieli

Nie gwarantujemy egzekwowania z wcześniejszym ostrzeżeniem w przypadku
oczywistych nadużyć. Zobacz
[Moderację i bezpieczeństwo konta](/clawhub/moderation), aby uzyskać informacje
o zgłoszeniach, wstrzymaniach moderacyjnych, ukrytych wpisach, blokadach i
statusie konta.
