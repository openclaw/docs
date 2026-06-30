---
read_when:
    - Przeglądanie przesłanych plików pod kątem nadużyć lub naruszeń zasad
    - Pisanie dokumentacji moderacji lub podręczników dla recenzentów
    - Podejmowanie decyzji, czy skill powinien zostać ukryty, czy użytkownik zbanowany
sidebarTitle: Acceptable Usage
summary: 'Zasady marketplace’u: co ClawHub dopuszcza i czego nie będzie hostować.'
title: Dopuszczalne użycie
x-i18n:
    generated_at: "2026-06-30T22:36:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Dopuszczalne użycie

ClawHub hostuje Skills, pluginy, pakiety i metadane marketplace dla OpenClaw.
Ta strona pomaga zdecydować, czy dana treść lub sposób publikowania należą do
ClawHub.

Te zasady dotyczą tego, co robi wpis, co prosi użytkowników o uruchomienie, jak
sam siebie przedstawia oraz jak wydawcy używają powierzchni odkrywania, instalacji
i zaufania ClawHub. Stany moderacji i status konta opisuje
[Moderacja i bezpieczeństwo konta](/clawhub/moderation). Roszczenia dotyczące praw autorskich lub innych praw opisuje
[Żądania dotyczące praw do treści](/clawhub/content-rights).

## Dozwolona treść

ClawHub przyjmuje treści, które są użyteczne, zrozumiałe i publikowane w dobrej
wierze.

| Kategoria                                        | Dozwolone, gdy                                                                                                                   |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Produktywność deweloperów                       | Wpis pomaga użytkownikom budować, testować, migrować, debugować, dokumentować lub obsługiwać oprogramowanie.                    |
| Przepływy pracy UI, danych i automatyzacji       | Zakres jest jasny, wymagane dane uwierzytelniające są wyraźnie podane, a ryzykowne działania mają ścieżki przeglądu, próbnego uruchomienia, podglądu lub potwierdzenia. |
| Bezpieczeństwo defensywne, moderacja i przegląd nadużyć | Narzędzie jest przedstawione jako przeznaczone do autoryzowanego przeglądu, zachowuje dowody i jasno utrzymuje granice ludzkiej akceptacji. |
| Osobiste lub zespołowe przepływy pracy           | Przepływ pracy używa kont opartych na zgodzie, przejrzystej konfiguracji i wyraźnych uprawnień.                                 |
| Utrzymywane katalogi                            | Każdy wpis jest odrębny, użyteczny, dokładnie opisany i rozsądnie utrzymywany.                                                   |

Kontekst ma znaczenie. Ten sam temat może być akceptowalny w wąskim ustawieniu
defensywnym lub opartym na zgodzie, a nieakceptowalny, gdy jest opakowany jako
przepływ pracy do nadużyć.

## Niedozwolona treść

ClawHub nie hostuje treści, których głównym celem jest nadużycie, oszustwo,
niebezpieczne wykonanie lub naruszenie praw.

| Kategoria                                                   | Niedozwolone                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nieautoryzowany dostęp lub obejście zabezpieczeń            | Obejście uwierzytelniania, przejęcie konta, nadużywanie limitów szybkości, przejęcie połączenia na żywo lub agenta, kradzież sesji wielokrotnego użycia albo automatyczne zatwierdzanie przepływów parowania dla niezatwierdzonych użytkowników. |
| Nadużycia platformy i obchodzenie blokad                    | Ukryte konta po blokadach, rozgrzewanie lub farmienie kont, fałszywe zaangażowanie, automatyzacja wielu kont, masowe publikowanie, boty spamujące albo automatyzacja zbudowana w celu uniknięcia wykrycia. |
| Oszustwa, wyłudzenia i zwodnicze przepływy finansowe        | Fałszywe certyfikaty lub faktury, zwodnicze przepływy płatności, kontaktowanie się w celu oszustwa, fałszywy dowód społeczny, przepływy pracy syntetycznej tożsamości do oszustw albo narzędzia do wydawania/obciążania bez jasnej ludzkiej akceptacji. |
| Inwazyjne wobec prywatności wzbogacanie danych lub nadzór   | Zbieranie kontaktów do spamu, doxxing, stalking, pozyskiwanie leadów połączone z niezamówionym kontaktem, ukryte monitorowanie, biometryczne dopasowywanie bez zgody albo użycie wyciekłych danych lub zrzutów po naruszeniach. |
| Podszywanie się lub manipulacja tożsamością bez zgody        | Face swap, cyfrowe bliźniaki, sklonowani influencerzy, fałszywe persony albo inne narzędzia używane do podszywania się lub wprowadzania w błąd. |
| Jawne treści seksualne lub generowanie treści dla dorosłych z wyłączonymi zabezpieczeniami | Generowanie obrazów, wideo lub treści NSFW; wrappery treści dla dorosłych wokół API stron trzecich; albo wpisy, których głównym celem są jawne treści seksualne. |
| Ukryte, niebezpieczne lub mylące wymagania wykonania        | Zaciemnione polecenia instalacji, instalatory typu pipe-to-shell, takie jak pobrana treść uruchamiana przez `sh` lub `bash` bez jasnej możliwości przeglądu, niezgłoszone wymagania dotyczące sekretów lub kluczy prywatnych, zdalne wykonanie `npx @latest` bez jasnej możliwości przeglądu albo metadane ukrywające, czego wpis naprawdę potrzebuje do uruchomienia. |
| Materiały naruszające prawa autorskie lub inne prawa        | Ponowne publikowanie cudzej Skills, pluginu, dokumentacji, zasobów marki lub zastrzeżonego kodu bez pozwolenia; naruszanie warunków licencji; albo podszywanie się pod pierwotnego autora lub wydawcę. |

## Niedozwolone zachowanie w marketplace

ClawHub sprawdza też, jak wydawcy używają marketplace. Nie używaj ClawHub do
manipulowania odkrywaniem, metrykami, sygnałami zaufania, systemami moderacji
ani uwagą użytkowników.

Niedozwolone zachowanie w marketplace obejmuje:

- masowe publikowanie dużej liczby niskonakładowych, duplikujących się, zastępczych lub
  wygenerowanych maszynowo wpisów, które nie wydają się mieć realnej wartości dla użytkowników
- zalewanie powierzchni wyszukiwania lub kategorii niemal identycznymi Skills lub pluginami
- publikowanie setek wpisów z niewielkim użyciem lub bez użycia, utrzymania, jasności źródła
  albo znaczącego zróżnicowania
- sztuczne zawyżanie instalacji, pobrań, gwiazdek lub innych metryk
  zaangażowania przez automatyzację, pętle samoinstalacji, fałszywe konta, skoordynowaną
  aktywność, płatne zaangażowanie albo inne nieorganiczne zachowanie
- tworzenie lub rotowanie kont w celu obejścia moderacji, blokad, limitów wydawców albo
  przeglądu marketplace
- wprowadzanie użytkowników w błąd co do własności, źródła, możliwości, postawy bezpieczeństwa,
  wymagań instalacyjnych albo powiązania z innym projektem lub wydawcą
- wielokrotne przesyłanie treści, które zostały już ukryte, usunięte lub zablokowane,
  bez naprawienia podstawowego problemu

Publikowanie dużego wolumenu nie jest automatycznie nadużyciem. Duże katalogi są akceptowalne,
gdy wpisy znacząco się różnią, są dokładnie opisane, utrzymywane
i używane przez realnych użytkowników. Duże katalogi stają się problemem zaufania i bezpieczeństwa, gdy
wolumen łączy się z wpisami płytkimi, duplikującymi się, mylącymi, nieutrzymywanymi lub
sztucznie promowanymi.

## Prawa do treści

Jeśli uważasz, że treść w ClawHub narusza Twoje prawa autorskie lub inne prawa, użyj
[Żądań dotyczących praw do treści](/clawhub/content-rights). Nie używaj zwykłych zgłoszeń marketplace
do roszczeń dotyczących praw autorskich lub innych praw, chyba że wpis jest również niebezpieczny,
złośliwy lub mylący.

## Przegląd i egzekwowanie

ClawHub może używać automatycznych kontroli, statystycznych sygnałów nadużyć, zgłoszeń użytkowników i
przeglądu zespołu, aby identyfikować niebezpieczne treści lub nadużycia w publikowaniu. Sygnał
sam w sobie nie dowodzi nadużycia; pomaga ClawHub zdecydować, co wymaga przeglądu.

Możemy:

- ukrywać, wstrzymywać, usuwać, miękko usuwać albo, tam gdzie obsługuje to typ zasobu,
  trwale usuwać naruszające wpisy
- blokować pobrania lub instalacje niebezpiecznych wydań
- unieważniać tokeny API
- miękko usuwać powiązaną treść
- ograniczać dostęp do publikowania
- blokować powtarzających się lub poważnych naruszycieli

Nie gwarantujemy egzekwowania z wcześniejszym ostrzeżeniem w przypadku oczywistych nadużyć. Zobacz
[Moderację i bezpieczeństwo konta](/clawhub/moderation), aby uzyskać informacje o zgłoszeniach, wstrzymaniach moderacyjnych,
ukrytych wpisach, blokadach i statusie konta.
