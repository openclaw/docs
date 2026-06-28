---
read_when:
    - Przeglądanie przesłanych plików pod kątem nadużyć lub naruszeń zasad
    - Pisanie dokumentacji moderacji lub podręczników dla recenzentów
    - Decydowanie, czy skill powinien zostać ukryty, czy użytkownik zbanowany
sidebarTitle: Acceptable Usage
summary: 'Zasady Marketplace: co ClawHub dopuszcza i czego nie będzie hostować.'
title: Dopuszczalne użycie
x-i18n:
    generated_at: "2026-06-28T05:07:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Dopuszczalne użycie

ClawHub hostuje Skills, pluginy, pakiety i metadane marketplace dla OpenClaw.
Użyj tej strony, aby ustalić, czy dana treść lub zachowanie publikowania należy
do ClawHub.

Te zasady dotyczą tego, co robi wpis, o uruchomienie czego prosi użytkowników,
jak się przedstawia oraz jak wydawcy używają powierzchni odkrywania, instalacji
i zaufania ClawHub. Stany moderacji i status konta opisuje
[Moderacja i bezpieczeństwo konta](/pl/clawhub/moderation). Roszczenia dotyczące praw autorskich lub innych praw opisuje [Żądania dotyczące praw do treści](/pl/clawhub/content-rights).

## Dozwolona treść

ClawHub przyjmuje treści, które są użyteczne, zrozumiałe i publikowane w dobrej
wierze.

| Kategoria                                         | Dozwolone, gdy                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produktywność programistów                           | Wpis pomaga użytkownikom budować, testować, migrować, debugować, dokumentować lub obsługiwać oprogramowanie.                                               |
| Przepływy pracy UI, danych i automatyzacji               | Zakres jest jasny, wymagane dane uwierzytelniające są wyraźnie wskazane, a ryzykowne działania obejmują ścieżki przeglądu, dry-run, podglądu lub potwierdzenia. |
| Defensywne bezpieczeństwo, moderacja i przegląd nadużyć | Narzędzie jest przedstawione jako przeznaczone do autoryzowanego przeglądu, zachowuje dowody i jasno utrzymuje granice zatwierdzania przez człowieka.                          |
| Osobiste lub zespołowe przepływy pracy                       | Przepływ pracy używa kont opartych na zgodzie, przejrzystej konfiguracji i jawnych uprawnień.                                            |
| Utrzymywane katalogi                              | Każdy wpis jest odrębny, użyteczny, dokładnie opisany i rozsądnie utrzymywany.                                                |

Kontekst ma znaczenie. Ten sam temat może być akceptowalny w wąskim ustawieniu
defensywnym lub opartym na zgodzie, a niedopuszczalny, gdy jest opakowany jako
przepływ pracy do nadużyć.

## Niedozwolona treść

ClawHub nie hostuje treści, których głównym celem jest nadużycie, oszustwo,
niebezpieczne wykonanie lub naruszenie praw.

| Kategoria                                                    | Niedozwolone                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nieautoryzowany dostęp lub obejście zabezpieczeń                      | Obejście uwierzytelniania, przejęcie konta, nadużywanie limitów szybkości, przejęcie rozmowy na żywo lub agenta, kradzież sesji wielokrotnego użytku albo automatyczne zatwierdzanie przepływów parowania dla niezatwierdzonych użytkowników.                                                                                                                                                   |
| Nadużycia platformy i omijanie banów                              | Ukryte konta po banach, rozgrzewanie lub farmienie kont, fałszywe zaangażowanie, automatyzacja wielu kont, masowe publikowanie, boty spamujące albo automatyzacja zbudowana w celu uniknięcia wykrycia.                                                                                                                                          |
| Oszustwa, wyłudzenia i zwodnicze finansowe przepływy pracy             | Fałszywe certyfikaty lub faktury, zwodnicze przepływy płatności, kontaktowanie się w celu oszustwa, fałszywy dowód społeczny, przepływy pracy z syntetyczną tożsamością do oszustw albo narzędzia do wydawania lub obciążania bez jasnego zatwierdzenia przez człowieka.                                                                                                                    |
| Inwazyjne dla prywatności wzbogacanie lub nadzór                 | Scraping kontaktów do spamu, doxxing, stalking, pozyskiwanie leadów połączone z niezamówionym kontaktem, ukryte monitorowanie, biometryczne dopasowywanie bez zgody albo użycie wyciekłych danych lub zrzutów z naruszeń.                                                                                                                  |
| Podszywanie się lub manipulacja tożsamością bez zgody       | Face swap, cyfrowe bliźniaki, sklonowani influencerzy, fałszywe persony albo inne narzędzia używane do podszywania się lub wprowadzania w błąd.                                                                                                                                                                                                 |
| Jawne treści seksualne lub generowanie treści dla dorosłych z wyłączonymi zabezpieczeniami | Generowanie obrazów, wideo lub treści NSFW; wrappery dla treści dla dorosłych wokół API firm trzecich; albo wpisy, których głównym celem są jawne treści seksualne.                                                                                                                                                       |
| Ukryte, niebezpieczne lub mylące wymagania wykonania        | Zaciemnione polecenia instalacji, instalatory pipe-to-shell, takie jak pobrana treść uruchamiana za pomocą `sh` lub `bash` bez jasnej możliwości przeglądu, niezadeklarowane wymagania dotyczące sekretów lub kluczy prywatnych, zdalne wykonanie `npx @latest` bez jasnej możliwości przeglądu albo metadane ukrywające, czego wpis naprawdę potrzebuje do uruchomienia. |
| Materiały naruszające prawa autorskie lub inne prawa           | Ponowne publikowanie cudzej Skills, pluginu, dokumentacji, zasobów marki lub zastrzeżonego kodu bez pozwolenia; naruszanie warunków licencji; albo podszywanie się pod pierwotnego autora lub wydawcę.                                                                                                                            |

## Niedozwolone zachowanie marketplace

ClawHub sprawdza także, jak wydawcy korzystają z marketplace. Nie używaj ClawHub
do manipulowania odkrywaniem, metrykami, sygnałami zaufania, systemami moderacji
ani uwagą użytkowników.

Niedozwolone zachowanie marketplace obejmuje:

- masowe publikowanie dużej liczby wpisów o niskim nakładzie pracy,
  duplikacyjnych, zastępczych lub generowanych maszynowo, które nie wydają się
  mieć realnej wartości dla użytkowników
- zalewanie powierzchni wyszukiwania lub kategorii niemal identycznymi Skills lub pluginami
- publikowanie setek wpisów z niewielkim użyciem, utrzymaniem, jasnością źródła
  lub znaczącym zróżnicowaniem albo bez nich
- sztuczne zawyżanie instalacji, pobrań, gwiazdek lub innych metryk
  zaangażowania przez automatyzację, pętle samodzielnych instalacji, fałszywe
  konta, skoordynowaną aktywność, płatne zaangażowanie albo inne zachowanie
  nieorganiczne
- tworzenie lub rotowanie kont w celu omijania moderacji, banów, limitów
  wydawców albo przeglądu marketplace
- wprowadzanie użytkowników w błąd co do własności, źródła, możliwości, postawy
  bezpieczeństwa, wymagań instalacyjnych albo powiązania z innym projektem lub
  wydawcą
- wielokrotne przesyłanie treści, która została już ukryta, usunięta lub
  zablokowana, bez naprawienia podstawowego problemu

Publikowanie na dużą skalę nie jest automatycznie nadużyciem. Duże katalogi są
akceptowalne, gdy wpisy znacząco się różnią, są dokładnie opisane, utrzymywane i
używane przez rzeczywistych użytkowników. Duże katalogi stają się problemem
zaufania i bezpieczeństwa, gdy skala łączy się z wpisami powierzchownymi,
duplikacyjnymi, mylącymi, nieutrzymywanymi lub sztucznie promowanymi.

## Prawa do treści

Jeśli uważasz, że treść w ClawHub narusza Twoje prawa autorskie lub inne prawa,
użyj [Żądań dotyczących praw do treści](/pl/clawhub/content-rights). Nie używaj zwykłych
zgłoszeń marketplace do roszczeń dotyczących praw autorskich lub praw, chyba że
wpis jest również niebezpieczny, złośliwy lub mylący.

## Przegląd i egzekwowanie

ClawHub może używać automatycznych kontroli, statystycznych sygnałów nadużyć,
zgłoszeń użytkowników i przeglądu przez personel, aby identyfikować
niebezpieczne treści lub nadużycia w publikowaniu. Sygnał sam w sobie nie
dowodzi nadużycia; pomaga ClawHub zdecydować, co wymaga przeglądu.

Możemy:

- ukrywać, wstrzymywać, usuwać, soft-delete lub, tam gdzie typ zasobu to
  obsługuje, hard-delete naruszające wpisy
- blokować pobrania lub instalacje niebezpiecznych wydań
- unieważniać tokeny API
- soft-delete powiązaną treść
- ograniczać dostęp do publikowania
- banować powtarzających się lub poważnych sprawców naruszeń

Nie gwarantujemy egzekwowania z wcześniejszym ostrzeżeniem w przypadku
oczywistych nadużyć. Zobacz
[Moderację i bezpieczeństwo konta](/pl/clawhub/moderation), aby uzyskać informacje o zgłoszeniach, wstrzymaniach moderacyjnych,
ukrytych wpisach, banach i statusie konta.
