---
read_when:
    - Przeglądanie przesłanych materiałów pod kątem nadużyć lub naruszeń zasad
    - Pisanie dokumentacji moderacji lub podręczników pracy recenzentów
    - Decydowanie, czy umiejętność powinna zostać ukryta, czy użytkownik zablokowany
sidebarTitle: Acceptable Usage
summary: 'Zasady marketplace: co ClawHub dopuszcza i czego nie będzie hostować.'
title: Dopuszczalne użycie
x-i18n:
    generated_at: "2026-07-03T10:00:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Dopuszczalne użycie

ClawHub hostuje Skills, pluginy, pakiety i metadane marketplace dla OpenClaw.
Użyj tej strony, aby zdecydować, czy treści lub zachowanie publikowania należą
do ClawHub.

Te reguły dotyczą tego, co robi wpis, o uruchomienie czego prosi użytkowników, jak
przedstawia siebie oraz jak wydawcy używają powierzchni odkrywania, instalacji i
zaufania w ClawHub. Stany moderacji i status konta opisuje
[Moderacja i bezpieczeństwo konta](/clawhub/moderation). Roszczenia dotyczące
praw autorskich lub innych praw opisują [Żądania dotyczące praw do treści](/clawhub/content-rights).

## Dozwolone treści

ClawHub przyjmuje treści, które są przydatne, zrozumiałe i publikowane w dobrej
wierze.

| Kategoria                                        | Dozwolone, gdy                                                                                                                    |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produktywność deweloperów                        | Wpis pomaga użytkownikom budować, testować, migrować, debugować, dokumentować lub obsługiwać oprogramowanie.                     |
| Przepływy pracy UI, danych i automatyzacji        | Zakres jest jasny, wymagane dane uwierzytelniające są jawne, a ryzykowne działania obejmują ścieżki przeglądu, dry-run, podglądu lub potwierdzenia. |
| Defensywne bezpieczeństwo, moderacja i przegląd nadużyć | Narzędzie jest przedstawione jako przeznaczone do autoryzowanego przeglądu, zachowuje dowody i jasno utrzymuje granice zatwierdzania przez człowieka. |
| Osobiste lub zespołowe przepływy pracy            | Przepływ pracy używa kont opartych na zgodzie, przejrzystej konfiguracji i jawnych uprawnień.                                    |
| Utrzymywane katalogi                              | Każdy wpis jest odrębny, przydatny, dokładnie opisany i rozsądnie utrzymywany.                                                    |

Kontekst ma znaczenie. Ten sam temat może być akceptowalny w wąskim ustawieniu
defensywnym lub opartym na zgodzie, a nieakceptowalny, gdy jest zapakowany jako
przepływ pracy do nadużyć.

## Niedozwolone treści

ClawHub nie hostuje treści, których głównym celem są nadużycia, oszustwo,
niebezpieczne wykonanie lub naruszenie praw.

| Kategoria                                                   | Niedozwolone                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nieautoryzowany dostęp lub obejście zabezpieczeń            | Obejście uwierzytelniania, przejęcie konta, nadużycie limitów szybkości, przejęcie połączenia na żywo lub agenta, kradzież sesji wielokrotnego użytku albo automatyczne zatwierdzanie przepływów parowania dla niezatwierdzonych użytkowników. |
| Nadużycia platformy i obchodzenie banów                     | Ukryte konta po banach, rozgrzewanie lub farmienie kont, fałszywe zaangażowanie, automatyzacja wielu kont, masowe publikowanie, boty spamujące albo automatyzacja zbudowana w celu unikania wykrycia.                                                                                                       |
| Oszustwa, scam i zwodnicze przepływy finansowe              | Fałszywe certyfikaty lub faktury, zwodnicze przepływy płatności, kontaktowanie się w ramach scamów, fałszywy dowód społeczny, przepływy pracy z syntetyczną tożsamością do oszustw albo narzędzia do wydawania/obciążania bez jasnej zgody człowieka. |
| Inwazyjne wobec prywatności wzbogacanie danych lub nadzór   | Scrapowanie kontaktów do spamu, doxxing, stalking, ekstrakcja leadów połączona z niezamówionym kontaktem, ukryte monitorowanie, biometryczne dopasowywanie bez zgody albo użycie wyciekłych danych lub zrzutów z naruszeń.                                                                                    |
| Podszywanie się lub manipulacja tożsamością bez zgody       | Face swap, cyfrowe bliźniaki, sklonowani influencerzy, fałszywe persony albo inne narzędzia używane do podszywania się lub wprowadzania w błąd.                                                                                                                                                              |
| Jawne treści seksualne lub generowanie dla dorosłych z wyłączonymi zabezpieczeniami | Generowanie obrazów, wideo lub treści NSFW; opakowania treści dla dorosłych wokół API firm trzecich; albo wpisy, których głównym celem są jawne treści seksualne.                                                                                                                                            |
| Ukryte, niebezpieczne lub mylące wymagania wykonania        | Zaciemnione polecenia instalacji, instalatory typu pipe-to-shell, takie jak pobrane treści uruchamiane za pomocą `sh` lub `bash` bez jasnej możliwości przeglądu, niezadeklarowane wymagania dotyczące sekretów lub kluczy prywatnych, zdalne wykonanie `npx @latest` bez jasnej możliwości przeglądu albo metadane ukrywające, czego wpis naprawdę potrzebuje do uruchomienia. |
| Materiały naruszające prawa autorskie lub inne prawa        | Ponowna publikacja cudzej Skills, pluginu, dokumentacji, zasobów marki lub kodu własnościowego bez pozwolenia; naruszenie warunków licencji; albo podszywanie się pod pierwotnego autora lub wydawcę.                                                                                                        |

## Niedozwolone zachowanie marketplace

ClawHub sprawdza również, jak wydawcy używają marketplace. Nie używaj ClawHub do
manipulowania odkrywaniem, metrykami, sygnałami zaufania, systemami moderacji lub
uwagą użytkowników.

Niedozwolone zachowanie marketplace obejmuje:

- masowe publikowanie dużej liczby niskonakładowych, duplikatywnych, zastępczych
  lub generowanych maszynowo wpisów, które nie wydają się mieć realnej wartości
  dla użytkownika
- zalewanie powierzchni wyszukiwania lub kategorii niemal identycznymi Skills lub pluginami
- publikowanie setek wpisów z niewielkim użyciem albo bez użycia, utrzymania,
  jasności źródła lub znaczącego zróżnicowania
- sztuczne zawyżanie instalacji, pobrań, gwiazdek lub innych metryk
  zaangażowania przez automatyzację, pętle samodzielnych instalacji, fałszywe
  konta, skoordynowaną aktywność, płatne zaangażowanie lub inne nieorganiczne
  zachowanie
- tworzenie lub rotowanie kont w celu obchodzenia moderacji, banów, limitów
  wydawcy lub przeglądu marketplace
- wprowadzanie użytkowników w błąd co do własności, źródła, możliwości, postawy
  bezpieczeństwa, wymagań instalacji lub powiązania z innym projektem bądź wydawcą
- wielokrotne przesyłanie treści, które zostały już ukryte, usunięte lub
  zablokowane bez naprawienia problemu źródłowego

Publikowanie na dużą skalę nie jest automatycznie nadużyciem. Duże katalogi są
akceptowalne, gdy wpisy znacząco się różnią, są dokładnie opisane, utrzymywane i
używane przez realnych użytkowników. Duże katalogi stają się problemem zaufania i
bezpieczeństwa, gdy skala jest połączona z wpisami płytkimi, duplikatywnymi,
mylącymi, nieutrzymywanymi lub sztucznie promowanymi.

## Prawa do treści

Jeśli uważasz, że treści w ClawHub naruszają Twoje prawa autorskie lub inne
prawa, użyj [Żądań dotyczących praw do treści](/clawhub/content-rights). Nie używaj zwykłych
zgłoszeń marketplace do roszczeń dotyczących praw autorskich lub innych praw,
chyba że wpis jest również niebezpieczny, złośliwy lub mylący.

## Przegląd i egzekwowanie

ClawHub może używać zautomatyzowanych kontroli, statystycznych sygnałów nadużyć,
zgłoszeń użytkowników i przeglądu przez personel, aby identyfikować
niebezpieczne treści lub nadużycia w zachowaniu publikowania. Sygnał sam w sobie
nie dowodzi nadużycia; pomaga ClawHub zdecydować, co wymaga przeglądu.

Możemy:

- ukrywać, wstrzymywać, usuwać, miękko usuwać albo, gdy jest to obsługiwane dla
  danego typu zasobu, trwale usuwać naruszające wpisy
- blokować pobrania lub instalacje niebezpiecznych wydań
- unieważniać tokeny API
- miękko usuwać powiązane treści
- ograniczać dostęp do publikowania
- banować recydywistów lub poważnych naruszycieli

Nie gwarantujemy egzekwowania z ostrzeżeniem jako pierwszym krokiem w przypadku
oczywistych nadużyć. Zobacz
[Moderacja i bezpieczeństwo konta](/clawhub/moderation), aby poznać zgłoszenia,
wstrzymania moderacyjne, ukryte wpisy, bany i status konta.
