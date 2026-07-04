---
read_when:
    - Sprawdzanie przesłanych plików pod kątem nadużyć lub naruszeń zasad
    - Pisanie dokumentacji moderacji lub podręczników dla recenzentów
    - Decydowanie, czy skill powinien zostać ukryty, czy użytkownik zbanowany
sidebarTitle: Acceptable Usage
summary: 'Zasady Marketplace: co ClawHub dopuszcza i czego nie będzie hostować.'
title: Dopuszczalne użycie
x-i18n:
    generated_at: "2026-07-04T11:04:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Dopuszczalne użycie

ClawHub hostuje Skills, pluginy, pakiety i metadane marketplace dla OpenClaw.
Użyj tej strony, aby zdecydować, czy dana treść lub sposób publikowania należy
do ClawHub.

Te zasady dotyczą tego, co robi wpis, o uruchomienie czego prosi użytkowników, jak
się przedstawia oraz jak wydawcy korzystają z powierzchni odkrywania, instalacji
i zaufania w ClawHub. Informacje o stanach moderacji i statusie konta znajdziesz
w [Moderacja i bezpieczeństwo konta](/clawhub/moderation). Roszczenia dotyczące praw autorskich lub innych praw
opisano w [Żądania dotyczące praw do treści](/pl/clawhub/content-rights).

## Dozwolona treść

ClawHub przyjmuje treści, które są użyteczne, zrozumiałe i publikowane w dobrej
wierze.

| Kategoria                                        | Dozwolone, gdy                                                                                                                     |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Produktywność programistów                       | Wpis pomaga użytkownikom budować, testować, migrować, debugować, dokumentować lub obsługiwać oprogramowanie.                      |
| Przepływy pracy UI, danych i automatyzacji       | Zakres jest jasny, wymagane poświadczenia są wyraźnie wskazane, a ryzykowne działania obejmują ścieżki przeglądu, przebiegu próbnego, podglądu lub potwierdzenia. |
| Defensywne bezpieczeństwo, moderacja i przegląd nadużyć | Narzędzie jest przedstawione jako przeznaczone do autoryzowanego przeglądu, zachowuje dowody i utrzymuje jasne granice ludzkiej akceptacji. |
| Osobiste lub zespołowe przepływy pracy           | Przepływ pracy używa kont opartych na zgodzie, przejrzystej konfiguracji i wyraźnych uprawnień.                                    |
| Utrzymywane katalogi                             | Każdy wpis jest odrębny, użyteczny, dokładnie opisany i rozsądnie utrzymywany.                                                     |

Kontekst ma znaczenie. Ten sam temat może być akceptowalny w wąskim ustawieniu
defensywnym lub opartym na zgodzie, a nieakceptowalny, gdy jest opakowany jako
przepływ pracy do nadużyć.

## Niedozwolona treść

ClawHub nie hostuje treści, których głównym celem jest nadużycie, oszustwo,
niebezpieczne wykonanie lub naruszenie praw.

| Kategoria                                                   | Niedozwolone                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nieautoryzowany dostęp lub omijanie zabezpieczeń            | Omijanie uwierzytelniania, przejęcie konta, nadużywanie limitów szybkości, przejęcie połączenia na żywo lub agenta, kradzież sesji wielokrotnego użytku albo automatyczne zatwierdzanie przepływów parowania dla niezatwierdzonych użytkowników.                                                            |
| Nadużycia platformy i omijanie blokad                       | Ukryte konta po blokadach, rozgrzewanie lub farmienie kont, fałszywe zaangażowanie, automatyzacja wielu kont, masowe publikowanie, boty spamujące albo automatyzacja zbudowana w celu uniknięcia wykrycia.                                                                                                   |
| Oszustwa, wyłudzenia i zwodnicze przepływy finansowe        | Fałszywe certyfikaty lub faktury, zwodnicze przepływy płatności, kontaktowanie się w celu oszustwa, fałszywe dowody społeczne, przepływy pracy z syntetyczną tożsamością do oszustw albo narzędzia do wydawania lub obciążania bez jasnej ludzkiej akceptacji.                                               |
| Inwazyjne dla prywatności wzbogacanie danych lub nadzór     | Pozyskiwanie kontaktów do spamu, doxxing, stalking, pozyskiwanie leadów połączone z niezamówionym kontaktem, ukryte monitorowanie, niedobrowolne dopasowywanie biometryczne albo użycie wyciekłych danych lub zrzutów z naruszeń.                                                                            |
| Niedobrowolne podszywanie się lub manipulacja tożsamością   | Zamiana twarzy, cyfrowe bliźniaki, sklonowani influencerzy, fałszywe persony albo inne narzędzia używane do podszywania się lub wprowadzania w błąd.                                                                                                                                                         |
| Jawne treści seksualne lub generowanie treści dla dorosłych z wyłączonymi zabezpieczeniami | Generowanie obrazów, wideo lub treści NSFW; wrappery treści dla dorosłych wokół API stron trzecich; albo wpisy, których głównym celem są jawne treści seksualne.                                                                                                                                             |
| Ukryte, niebezpieczne lub mylące wymagania wykonania        | Zaciemnione polecenia instalacji, instalatory przekazujące dane potokiem do powłoki, takie jak pobrana treść uruchamiana przez `sh` lub `bash` bez jasnej możliwości przeglądu, niezadeklarowane wymagania dotyczące sekretów lub kluczy prywatnych, zdalne wykonanie `npx @latest` bez jasnej możliwości przeglądu albo metadane ukrywające, czego wpis naprawdę potrzebuje do uruchomienia. |
| Materiały naruszające prawa autorskie lub inne prawa        | Ponowna publikacja cudzych Skills, pluginów, dokumentacji, zasobów marki lub kodu własnościowego bez pozwolenia; naruszenie warunków licencji; albo podszywanie się pod pierwotnego autora lub wydawcę.                                                                                                     |

## Niedozwolone zachowanie w marketplace

ClawHub sprawdza także, jak wydawcy korzystają z marketplace. Nie używaj ClawHub do
manipulowania odkrywaniem, metrykami, sygnałami zaufania, systemami moderacji ani
uwagą użytkowników.

Niedozwolone zachowanie w marketplace obejmuje:

- masowe publikowanie dużej liczby niskiej jakości, duplikujących się, zastępczych lub
  wygenerowanych maszynowo wpisów, które nie wydają się mieć realnej wartości dla użytkowników
- zalewanie powierzchni wyszukiwania lub kategorii niemal identycznymi Skills lub pluginami
- publikowanie setek wpisów z niewielkim użyciem lub bez użycia, utrzymania, jasności źródła
  albo znaczącego zróżnicowania
- sztuczne zawyżanie instalacji, pobrań, gwiazdek lub innych metryk
  zaangażowania przez automatyzację, pętle samodzielnej instalacji, fałszywe konta, skoordynowane
  działania, płatne zaangażowanie lub inne nieorganiczne zachowanie
- tworzenie lub rotowanie kont w celu omijania moderacji, blokad, limitów wydawców lub
  przeglądu marketplace
- wprowadzanie użytkowników w błąd co do własności, źródła, możliwości, stanu bezpieczeństwa,
  wymagań instalacji albo powiązania z innym projektem lub wydawcą
- wielokrotne przesyłanie treści, która została już ukryta, usunięta lub zablokowana,
  bez naprawienia podstawowego problemu

Publikowanie na dużą skalę nie jest automatycznie nadużyciem. Duże katalogi są akceptowalne,
gdy wpisy znacząco się różnią, są dokładnie opisane, utrzymywane
i używane przez realnych użytkowników. Duże katalogi stają się problemem zaufania i bezpieczeństwa, gdy
wolumen łączy się z powierzchownymi, duplikującymi się, mylącymi, nieutrzymywanymi lub
sztucznie promowanymi wpisami.

## Prawa do treści

Jeśli uważasz, że treść w ClawHub narusza Twoje prawa autorskie lub inne prawa, użyj
[Żądania dotyczące praw do treści](/pl/clawhub/content-rights). Nie używaj zwykłych zgłoszeń marketplace
do roszczeń dotyczących praw autorskich lub innych praw, chyba że wpis jest również niebezpieczny,
złośliwy lub mylący.

## Przegląd i egzekwowanie zasad

ClawHub może używać automatycznych kontroli, statystycznych sygnałów nadużyć, zgłoszeń użytkowników i
przeglądu pracowników, aby identyfikować niebezpieczne treści lub nadużycia w publikowaniu. Sygnał
sam w sobie nie dowodzi nadużycia; pomaga ClawHub zdecydować, co wymaga przeglądu.

Możemy:

- ukrywać, wstrzymywać, usuwać, miękko usuwać albo, gdy typ zasobu to obsługuje,
  trwale usuwać naruszające wpisy
- blokować pobieranie lub instalacje niebezpiecznych wydań
- unieważniać tokeny API
- miękko usuwać powiązane treści
- ograniczać dostęp do publikowania
- blokować powtarzających się lub poważnych sprawców naruszeń

Nie gwarantujemy egzekwowania z wcześniejszym ostrzeżeniem w przypadku oczywistych nadużyć. Zobacz
[Moderacja i bezpieczeństwo konta](/clawhub/moderation), aby uzyskać informacje o zgłoszeniach, blokadach moderacyjnych,
ukrytych wpisach, blokadach kont i statusie konta.
