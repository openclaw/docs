---
read_when:
    - Sprawdzanie przesyłanych plików pod kątem nadużyć lub naruszeń zasad
    - Pisanie dokumentacji moderacji lub podręczników pracy dla recenzentów
    - Podejmowanie decyzji, czy skill powinien zostać ukryty, czy użytkownik zbanowany
sidebarTitle: Acceptable Usage
summary: 'Polityka marketplace: co ClawHub dopuszcza, a czego nie będzie hostować.'
title: Dopuszczalne użycie
x-i18n:
    generated_at: "2026-07-04T20:44:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Dopuszczalne użycie

ClawHub hostuje Skills, plugins, pakiety i metadane marketplace dla OpenClaw.
Ta strona pomaga zdecydować, czy dana treść lub zachowanie publikacyjne należy
do ClawHub.

Te zasady dotyczą tego, co robi wpis, jakie polecenia prosi użytkowników uruchamiać, jak
przedstawia sam siebie oraz jak wydawcy korzystają z powierzchni odkrywania, instalacji i
zaufania ClawHub. Informacje o stanach moderacji i statusie konta znajdziesz w
[Moderacja i bezpieczeństwo konta](/clawhub/moderation). W przypadku roszczeń dotyczących praw autorskich lub innych praw
zobacz [Żądania dotyczące praw do treści](/pl/clawhub/content-rights).

## Dozwolone treści

ClawHub przyjmuje treści, które są użyteczne, zrozumiałe i publikowane w dobrej
wierze.

| Kategoria                                        | Dozwolone, gdy                                                                                                                    |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produktywność deweloperska                      | Wpis pomaga użytkownikom tworzyć, testować, migrować, debugować, dokumentować lub obsługiwać oprogramowanie.                     |
| Przepływy pracy UI, danych i automatyzacji       | Zakres jest jasny, wymagane poświadczenia są jednoznaczne, a ryzykowne działania obejmują ścieżki przeglądu, dry-run, podglądu lub potwierdzenia. |
| Defensywne bezpieczeństwo, moderacja i przegląd nadużyć | Narzędzie jest przedstawione jako przeznaczone do autoryzowanego przeglądu, zachowuje dowody i jasno utrzymuje granice zatwierdzania przez człowieka. |
| Przepływy pracy osobiste lub zespołowe           | Przepływ pracy używa kont opartych na zgodzie, przejrzystej konfiguracji i jednoznacznych uprawnień.                              |
| Utrzymywane katalogi                             | Każdy wpis jest odrębny, użyteczny, dokładnie opisany i rozsądnie utrzymywany.                                                    |

Kontekst ma znaczenie. Ten sam temat może być akceptowalny w wąskim ustawieniu defensywnym lub
opartym na zgodzie, a nieakceptowalny, gdy jest opakowany jako przepływ pracy do nadużyć.

## Niedozwolone treści

ClawHub nie hostuje treści, których głównym celem jest nadużycie, oszustwo, niebezpieczne
wykonanie lub naruszenie praw.

| Kategoria                                                    | Niedozwolone                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nieautoryzowany dostęp lub obejście zabezpieczeń             | Obejście uwierzytelniania, przejęcie konta, nadużywanie limitów szybkości, przejęcie rozmowy na żywo lub agenta, kradzież sesji wielokrotnego użytku albo automatyczne zatwierdzanie przepływów parowania dla niezatwierdzonych użytkowników. |
| Nadużycia platformy i obchodzenie banów                      | Ukryte konta po banach, rozgrzewanie lub farmienie kont, fałszywe zaangażowanie, automatyzacja wielu kont, masowe publikowanie, boty spamujące lub automatyzacja zbudowana w celu uniknięcia wykrycia. |
| Oszustwa, scamy i zwodnicze przepływy finansowe              | Fałszywe certyfikaty lub faktury, zwodnicze przepływy płatności, oszukańczy outreach, fałszywy dowód społeczny, przepływy syntetycznej tożsamości do oszustw albo narzędzia do wydawania/obciążania bez jasnego zatwierdzenia przez człowieka. |
| Inwazyjne wzbogacanie prywatności lub nadzór                 | Scraping kontaktów na potrzeby spamu, doxxing, stalking, pozyskiwanie leadów połączone z niezamówionym outreach, ukryte monitorowanie, niedobrowolne dopasowywanie biometryczne albo użycie wyciekłych danych lub zrzutów po naruszeniach. |
| Niedobrowolne podszywanie się lub manipulacja tożsamością    | Face swap, cyfrowe bliźniaki, sklonowani influencerzy, fałszywe persony lub inne narzędzia używane do podszywania się albo wprowadzania w błąd. |
| Jawne treści seksualne lub generowanie treści dla dorosłych z wyłączonymi zabezpieczeniami | Generowanie obrazów, wideo lub treści NSFW; wrappery treści dla dorosłych wokół API stron trzecich; albo wpisy, których podstawowym celem są jawne treści seksualne. |
| Ukryte, niebezpieczne lub wprowadzające w błąd wymagania wykonania | Zaciemnione polecenia instalacji, instalatory pipe-to-shell, takie jak pobrana zawartość uruchamiana przez `sh` lub `bash` bez jasnej możliwości przeglądu, niezadeklarowane wymagania dotyczące sekretów lub kluczy prywatnych, zdalne wykonanie `npx @latest` bez jasnej możliwości przeglądu albo metadane ukrywające, czego wpis naprawdę potrzebuje do uruchomienia. |
| Materiał naruszający prawa autorskie lub inne prawa          | Ponowna publikacja cudzych skill, Plugin, dokumentacji, zasobów marki lub kodu własnościowego bez pozwolenia; naruszenie warunków licencji; albo podszywanie się pod pierwotnego autora lub wydawcę. |

## Niedozwolone zachowania marketplace

ClawHub sprawdza również, jak wydawcy korzystają z marketplace. Nie używaj ClawHub do
manipulowania odkrywaniem, metrykami, sygnałami zaufania, systemami moderacji ani uwagą
użytkowników.

Niedozwolone zachowania marketplace obejmują:

- masowe publikowanie dużej liczby wpisów o niskim nakładzie pracy, duplikacyjnych, zastępczych lub
  generowanych maszynowo, które nie wydają się mieć realnej wartości dla użytkownika
- zalewanie wyszukiwania lub powierzchni kategorii niemal identycznymi skills lub plugins
- publikowanie setek wpisów o małym lub żadnym użyciu, utrzymaniu, jasności źródła
  albo znaczącym zróżnicowaniu
- sztuczne zawyżanie instalacji, pobrań, gwiazdek lub innych metryk
  zaangażowania przez automatyzację, pętle samoinstalacji, fałszywe konta, skoordynowaną
  aktywność, płatne zaangażowanie lub inne nieorganiczne zachowanie
- tworzenie lub rotowanie kont w celu obejścia moderacji, banów, limitów wydawcy albo
  przeglądu marketplace
- wprowadzanie użytkowników w błąd co do własności, źródła, możliwości, postawy bezpieczeństwa,
  wymagań instalacji lub powiązania z innym projektem albo wydawcą
- wielokrotne przesyłanie treści, które zostały już ukryte, usunięte lub zablokowane
  bez naprawienia problemu źródłowego

Publikowanie dużej liczby wpisów nie jest automatycznie nadużyciem. Duże katalogi są akceptowalne,
gdy wpisy są znacząco różne, dokładnie opisane, utrzymywane
i używane przez prawdziwych użytkowników. Duże katalogi stają się problemem zaufania i bezpieczeństwa, gdy
wolumen łączy się z cienkimi, duplikacyjnymi, wprowadzającymi w błąd, nieutrzymywanymi lub
sztucznie promowanymi wpisami.

## Prawa do treści

Jeśli uważasz, że treść w ClawHub narusza Twoje prawa autorskie lub inne prawa, użyj
[Żądania dotyczące praw do treści](/pl/clawhub/content-rights). Nie używaj zwykłych zgłoszeń marketplace
do roszczeń dotyczących praw autorskich lub innych praw, chyba że wpis jest również niebezpieczny,
złośliwy lub wprowadzający w błąd.

## Przegląd i egzekwowanie

ClawHub może używać automatycznych kontroli, statystycznych sygnałów nadużyć, zgłoszeń użytkowników i
przeglądu pracowników, aby identyfikować niebezpieczne treści lub nadużycia publikacyjne. Sygnał
sam w sobie nie dowodzi nadużycia; pomaga ClawHub zdecydować, co wymaga przeglądu.

Możemy:

- ukrywać, wstrzymywać, usuwać, usuwać miękko albo, gdy jest to obsługiwane dla typu zasobu,
  usuwać trwale naruszające wpisy
- blokować pobrania lub instalacje niebezpiecznych wydań
- unieważniać tokeny API
- miękko usuwać powiązane treści
- ograniczać dostęp do publikowania
- banować recydywistów lub poważnych sprawców

Nie gwarantujemy egzekwowania z wcześniejszym ostrzeżeniem w przypadku oczywistych nadużyć. Zobacz
[Moderacja i bezpieczeństwo konta](/clawhub/moderation), aby uzyskać informacje o zgłoszeniach, wstrzymaniach moderacyjnych,
ukrytych wpisach, banach i statusie konta.
