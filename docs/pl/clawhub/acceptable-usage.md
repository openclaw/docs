---
read_when:
    - Przeglądanie przesłanych plików pod kątem nadużyć lub naruszeń zasad
    - Pisanie dokumentacji moderacji lub runbooków recenzenckich
    - Podejmowanie decyzji, czy skill powinien zostać ukryty, czy użytkownik zbanowany
sidebarTitle: Acceptable Usage
summary: 'Zasady marketplace: co ClawHub dopuszcza i czego nie będzie hostować.'
title: Dopuszczalne użycie
x-i18n:
    generated_at: "2026-07-04T18:22:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Dopuszczalne użycie

ClawHub hostuje Skills, Plugins, pakiety oraz metadane marketplace dla OpenClaw.
Użyj tej strony, aby zdecydować, czy dana treść lub zachowanie publikacyjne
należy do ClawHub.

Te zasady dotyczą tego, co robi wpis, o uruchomienie czego prosi użytkowników, jak
przedstawia siebie oraz jak wydawcy używają powierzchni odkrywania, instalacji i
zaufania ClawHub. Stany moderacji i status konta opisuje
[Moderacja i bezpieczeństwo konta](/clawhub/moderation). Roszczenia dotyczące praw
autorskich lub innych praw opisują [Żądania dotyczące praw do treści](/pl/clawhub/content-rights).

## Dozwolone treści

ClawHub przyjmuje treści, które są użyteczne, zrozumiałe i publikowane w dobrej
wierze.

| Kategoria                                         | Dozwolone, gdy                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produktywność deweloperska                           | Wpis pomaga użytkownikom tworzyć, testować, migrować, debugować, dokumentować lub obsługiwać oprogramowanie.                                               |
| Przepływy pracy UI, danych i automatyzacji               | Zakres jest jasny, wymagane dane uwierzytelniające są wyraźnie wskazane, a ryzykowne działania obejmują ścieżki przeglądu, trybu próbnego, podglądu lub potwierdzenia. |
| Ochronne bezpieczeństwo, moderacja i przegląd nadużyć | Narzędzie jest przedstawione jako przeznaczone do autoryzowanego przeglądu, zachowuje dowody i utrzymuje jasne granice zatwierdzania przez człowieka.                          |
| Osobiste lub zespołowe przepływy pracy                       | Przepływ pracy używa kont opartych na zgodzie, przejrzystej konfiguracji i wyraźnych uprawnień.                                            |
| Utrzymywane katalogi                              | Każdy wpis jest odrębny, użyteczny, dokładnie opisany i rozsądnie utrzymywany.                                                |

Kontekst ma znaczenie. Ten sam temat może być akceptowalny w wąskim ustawieniu
ochronnym lub opartym na zgodzie, a nieakceptowalny, gdy jest opakowany jako
przepływ pracy służący nadużyciom.

## Niedozwolone treści

ClawHub nie hostuje treści, których głównym celem jest nadużycie, oszustwo, niebezpieczne
wykonanie lub naruszenie praw.

| Kategoria                                                    | Niedozwolone                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nieautoryzowany dostęp lub obejście zabezpieczeń                      | Obejście uwierzytelniania, przejęcie konta, nadużycie limitów szybkości, przejęcie aktywnego połączenia lub agenta, kradzież sesji wielokrotnego użytku albo automatyczne zatwierdzanie przepływów parowania dla niezatwierdzonych użytkowników.                                                                                                                                                   |
| Nadużycia platformy i omijanie blokad                              | Konta ukrywane po blokadach, rozgrzewanie lub farmienie kont, fałszywe zaangażowanie, automatyzacja wielu kont, masowe publikowanie, boty spamujące albo automatyzacja zbudowana w celu uniknięcia wykrycia.                                                                                                                                          |
| Oszustwa, wyłudzenia i zwodnicze finansowe przepływy pracy             | Fałszywe certyfikaty lub faktury, zwodnicze przepływy płatności, kontaktowanie się w celu oszustwa, fałszywy dowód społeczny, przepływy pracy syntetycznej tożsamości do oszustw albo narzędzia wydawania/obciążania środków bez jasnej zgody człowieka.                                                                                                                    |
| Naruszające prywatność wzbogacanie danych lub nadzór                 | Pozyskiwanie kontaktów do spamu, doxxing, stalking, pozyskiwanie leadów połączone z niezamówionym kontaktem, ukryte monitorowanie, niekonsensualne dopasowywanie biometryczne albo użycie ujawnionych danych lub zrzutów z naruszeń bezpieczeństwa.                                                                                                                  |
| Nieuzgodnione podszywanie się lub manipulowanie tożsamością       | Podmiana twarzy, cyfrowe bliźniaki, klonowani influencerzy, fałszywe persony albo inne narzędzia używane do podszywania się lub wprowadzania w błąd.                                                                                                                                                                                                 |
| Jawne treści seksualne lub generowanie treści dla dorosłych z wyłączonymi zabezpieczeniami | Generowanie obrazów, wideo lub treści NSFW; wrappery treści dla dorosłych wokół API firm trzecich; albo wpisy, których głównym celem są jawne treści seksualne.                                                                                                                                                       |
| Ukryte, niebezpieczne lub mylące wymagania wykonania        | Zaciemnione polecenia instalacji, instalatory pipe-to-shell, takie jak pobrana treść uruchamiana za pomocą `sh` lub `bash` bez jasnej możliwości przeglądu, niezadeklarowane wymagania dotyczące sekretów lub kluczy prywatnych, zdalne wykonanie `npx @latest` bez jasnej możliwości przeglądu albo metadane ukrywające, czego wpis naprawdę potrzebuje do uruchomienia. |
| Materiał naruszający prawa autorskie lub inne prawa           | Ponowne publikowanie cudzej Skills, Plugin, dokumentacji, zasobów marki lub zastrzeżonego kodu bez pozwolenia; naruszanie warunków licencji; albo podszywanie się pod oryginalnego autora lub wydawcę.                                                                                                                            |

## Niedozwolone zachowania marketplace

ClawHub sprawdza też, jak wydawcy używają marketplace. Nie używaj ClawHub do
manipulowania odkrywaniem, metrykami, sygnałami zaufania, systemami moderacji ani
uwagą użytkowników.

Niedozwolone zachowania marketplace obejmują:

- masowe publikowanie dużej liczby mało wartościowych, duplikatywnych, zastępczych lub
  wygenerowanych maszynowo wpisów, które nie wydają się mieć realnej wartości dla użytkownika
- zalewanie powierzchni wyszukiwania lub kategorii niemal identycznymi Skills albo Plugins
- publikowanie setek wpisów z niewielkim użyciem lub bez użycia, utrzymania, jasności
  źródła albo znaczącego zróżnicowania
- sztuczne zawyżanie liczby instalacji, pobrań, gwiazdek lub innych metryk
  zaangażowania przez automatyzację, pętle samodzielnych instalacji, fałszywe konta, skoordynowaną
  aktywność, płatne zaangażowanie lub inne nieorganiczne zachowanie
- tworzenie lub rotowanie kont w celu uniknięcia moderacji, blokad, limitów wydawcy albo
  przeglądu marketplace
- wprowadzanie użytkowników w błąd co do własności, źródła, możliwości, stanu zabezpieczeń,
  wymagań instalacyjnych lub powiązania z innym projektem albo wydawcą
- wielokrotne przesyłanie treści, która została już ukryta, usunięta lub zablokowana,
  bez naprawienia podstawowego problemu

Publikowanie dużych wolumenów nie jest automatycznie nadużyciem. Duże katalogi są akceptowalne,
gdy wpisy istotnie się różnią, są dokładnie opisane, utrzymywane
i używane przez realnych użytkowników. Duże katalogi stają się problemem zaufania i bezpieczeństwa, gdy
wolumen łączy się z ubogimi, duplikatywnymi, mylącymi, nieutrzymywanymi lub
sztucznie promowanymi wpisami.

## Prawa do treści

Jeśli uważasz, że treść w ClawHub narusza Twoje prawa autorskie lub inne prawa, użyj
[Żądania dotyczące praw do treści](/pl/clawhub/content-rights). Nie używaj zwykłych zgłoszeń
marketplace do roszczeń dotyczących praw autorskich lub innych praw, chyba że wpis jest również niebezpieczny,
złośliwy lub mylący.

## Przegląd i egzekwowanie

ClawHub może używać automatycznych kontroli, statystycznych sygnałów nadużyć, zgłoszeń użytkowników i
przeglądu personelu do identyfikowania niebezpiecznych treści lub nadużywczych zachowań publikacyjnych. Sygnał
sam w sobie nie dowodzi nadużycia; pomaga ClawHub zdecydować, co wymaga przeglądu.

Możemy:

- ukrywać, wstrzymywać, usuwać, miękko usuwać albo, gdy typ zasobu to obsługuje,
  trwale usuwać naruszające zasady wpisy
- blokować pobieranie lub instalacje niebezpiecznych wydań
- unieważniać tokeny API
- miękko usuwać powiązane treści
- ograniczać dostęp do publikowania
- blokować recydywistów lub sprawców poważnych naruszeń

Nie gwarantujemy egzekwowania z ostrzeżeniem w pierwszej kolejności w przypadku oczywistych nadużyć. Zobacz
[Moderacja i bezpieczeństwo konta](/clawhub/moderation), aby uzyskać informacje o zgłoszeniach, wstrzymaniach moderacyjnych,
ukrytych wpisach, blokadach i statusie konta.
