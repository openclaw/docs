---
read_when:
    - Sprawdzanie przesłanych plików pod kątem nadużyć lub naruszeń zasad
    - Tworzenie dokumentacji moderacyjnej lub podręczników dla recenzentów
    - Podejmowanie decyzji, czy umiejętność powinna zostać ukryta, czy użytkownik zbanowany
sidebarTitle: Acceptable Usage
summary: 'Zasady marketplace’u: co ClawHub dopuszcza, a czego nie będzie hostować.'
title: Dopuszczalne użytkowanie
x-i18n:
    generated_at: "2026-07-12T14:51:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Zasady dopuszczalnego użytkowania

ClawHub udostępnia Skills, Pluginy, pakiety i metadane marketplace'u dla OpenClaw.
Ta strona pomoże ustalić, czy określone treści lub działania związane z publikowaniem są odpowiednie dla
ClawHub.

Te zasady dotyczą działania opublikowanej pozycji, poleceń, o których wykonanie prosi ona użytkowników, sposobu,
w jaki się przedstawia, oraz sposobu korzystania przez wydawców z funkcji odkrywania, instalowania i
zaufania w ClawHub. Informacje o statusach moderacji i stanie konta znajdziesz w sekcji
[Moderacja i bezpieczeństwo konta](/clawhub/moderation). Informacje o roszczeniach dotyczących praw autorskich lub innych praw
znajdziesz w sekcji [Żądania dotyczące praw do treści](/clawhub/content-rights).

## Dozwolone treści

ClawHub przyjmuje treści, które są użyteczne, zrozumiałe i publikowane w dobrej
wierze.

| Kategoria                                         | Dozwolone, gdy                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produktywność programistów                           | Pozycja pomaga użytkownikom tworzyć, testować, migrować, debugować, dokumentować lub obsługiwać oprogramowanie.                                               |
| Interfejs użytkownika, dane i przepływy automatyzacji               | Zakres jest jasny, wymagane dane uwierzytelniające są wyraźnie wskazane, a ryzykowne działania obejmują ścieżki weryfikacji, uruchomienia próbnego, podglądu lub potwierdzenia. |
| Bezpieczeństwo defensywne, moderacja i analiza nadużyć | Narzędzie jest przeznaczone do autoryzowanej analizy, zachowuje dowody i jasno określa granice wymagające zatwierdzenia przez człowieka.                          |
| Osobiste lub zespołowe przepływy pracy                       | Przepływ pracy korzysta z kont opartych na zgodzie, przejrzystej konfiguracji i jawnych uprawnień.                                            |
| Utrzymywane katalogi                              | Każda pozycja jest odrębna, użyteczna, dokładnie opisana i odpowiednio utrzymywana.                                                |

Kontekst ma znaczenie. Ten sam temat może być dopuszczalny w wąskim zastosowaniu defensywnym lub
opartym na zgodzie, a niedopuszczalny, gdy jest oferowany jako przepływ służący do nadużyć.

## Niedozwolone treści

ClawHub nie udostępnia treści, których głównym celem są nadużycia, oszustwa, niebezpieczne
wykonywanie działań lub naruszanie praw.

| Kategoria                                                    | Niedozwolone                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nieautoryzowany dostęp lub omijanie zabezpieczeń                      | Omijanie uwierzytelniania, przejmowanie kont, nadużywanie limitów częstotliwości, przejmowanie aktywnych połączeń lub agentów, kradzież sesji nadających się do ponownego użycia albo automatyczne zatwierdzanie procesów parowania dla niezatwierdzonych użytkowników.                                                                                                                                                   |
| Nadużywanie platformy i obchodzenie banów                              | Ukryte konta zakładane po banach, przygotowywanie lub masowe tworzenie kont, fałszywe zaangażowanie, automatyzacja wielu kont, masowe publikowanie, boty spamujące lub automatyzacja zaprojektowana w celu uniknięcia wykrycia.                                                                                                                                          |
| Oszustwa, wyłudzenia i zwodnicze przepływy finansowe             | Fałszywe certyfikaty lub faktury, zwodnicze przepływy płatności, próby wyłudzeń, fałszywe dowody społeczne, przepływy wykorzystujące syntetyczne tożsamości do oszustw albo narzędzia do wydawania środków lub naliczania opłat bez wyraźnego zatwierdzenia przez człowieka.                                                                                                                    |
| Wzbogacanie danych naruszające prywatność lub inwigilacja                 | Pozyskiwanie danych kontaktowych do spamu, ujawnianie danych osobowych, nękanie, pozyskiwanie potencjalnych klientów połączone z niezamówionym kontaktem, ukryte monitorowanie, dopasowywanie biometryczne bez zgody albo wykorzystywanie ujawnionych danych lub zrzutów danych z naruszeń bezpieczeństwa.                                                                                                                  |
| Podszywanie się bez zgody lub manipulowanie tożsamością       | Zamiana twarzy, cyfrowe sobowtóry, sklonowani influencerzy, fałszywe persony lub inne narzędzia używane do podszywania się lub wprowadzania w błąd.                                                                                                                                                                                                 |
| Jawne treści seksualne lub generowanie treści dla dorosłych z wyłączonymi zabezpieczeniami | Generowanie obrazów, filmów lub treści NSFW; nakładki do tworzenia treści dla dorosłych wykorzystujące interfejsy API innych firm; albo pozycje, których głównym przeznaczeniem są jawne treści seksualne.                                                                                                                                                       |
| Ukryte, niebezpieczne lub wprowadzające w błąd wymagania dotyczące wykonywania działań        | Zaciemnione polecenia instalacyjne, instalatory przekazujące dane potokiem do powłoki, takie jak uruchamianie pobranych treści za pomocą `sh` lub `bash` bez możliwości ich przejrzystej weryfikacji, nieujawnione wymagania dotyczące sekretów lub kluczy prywatnych, zdalne wykonywanie `npx @latest` bez możliwości przejrzystej weryfikacji albo metadane ukrywające rzeczywiste wymagania niezbędne do uruchomienia pozycji. |
| Materiały naruszające prawa autorskie lub inne prawa           | Ponowne publikowanie cudzych Skills, Pluginów, dokumentacji, zasobów marki lub zastrzeżonego kodu bez pozwolenia; naruszanie warunków licencji; albo podszywanie się pod pierwotnego autora lub wydawcę.                                                                                                                            |

## Niedozwolone działania w marketplace'ie

ClawHub analizuje również sposób korzystania z marketplace'u przez wydawców. Nie używaj ClawHub do
manipulowania odkrywaniem treści, metrykami, sygnałami zaufania, systemami moderacji ani uwagą
użytkowników.

Niedozwolone działania w marketplace'ie obejmują:

- masowe publikowanie dużej liczby niskiej jakości, powielonych, zastępczych lub
  wygenerowanych maszynowo pozycji, które nie zapewniają rzeczywistej wartości użytkownikom
- zalewanie wyników wyszukiwania lub kategorii niemal identycznymi Skills lub Pluginami
- publikowanie setek pozycji, które są rzadko lub wcale używane i mają niewielki lub zerowy poziom utrzymania, przejrzystości
  źródła albo istotnego zróżnicowania
- sztuczne zawyżanie liczby instalacji, pobrań, gwiazdek lub innych wskaźników
  zaangażowania za pomocą automatyzacji, pętli samodzielnych instalacji, fałszywych kont, skoordynowanych
  działań, płatnego zaangażowania lub innych nieorganicznych metod
- tworzenie lub rotacyjne używanie kont w celu obchodzenia moderacji, banów, limitów wydawców lub
  weryfikacji marketplace'u
- wprowadzanie użytkowników w błąd co do własności, źródła, możliwości, poziomu bezpieczeństwa,
  wymagań instalacyjnych lub powiązań z innym projektem albo wydawcą
- wielokrotne przesyłanie treści, które zostały już ukryte, usunięte lub zablokowane,
  bez rozwiązania pierwotnego problemu

Publikowanie dużej liczby pozycji nie jest automatycznie nadużyciem. Duże katalogi są dopuszczalne,
gdy pozycje znacząco się różnią, są dokładnie opisane, utrzymywane
i używane przez rzeczywistych użytkowników. Duże katalogi stają się problemem z zakresu zaufania i bezpieczeństwa, gdy
dużej liczbie towarzyszą powierzchowne, powielone, wprowadzające w błąd, nieutrzymywane lub
sztucznie promowane pozycje.

## Prawa do treści

Jeśli uważasz, że treści w ClawHub naruszają Twoje prawa autorskie lub inne prawa, skorzystaj ze strony
[Żądania dotyczące praw do treści](/clawhub/content-rights). Nie używaj zwykłych zgłoszeń marketplace'u
do zgłaszania roszczeń dotyczących praw autorskich lub innych praw, chyba że pozycja jest również niebezpieczna,
złośliwa lub wprowadzająca w błąd.

## Weryfikacja i egzekwowanie zasad

ClawHub może korzystać z automatycznych kontroli, statystycznych sygnałów nadużyć, zgłoszeń użytkowników oraz
weryfikacji przez personel, aby identyfikować niebezpieczne treści lub niewłaściwe działania wydawców. Sam sygnał
nie stanowi dowodu nadużycia; pomaga ClawHub ustalić, co wymaga weryfikacji.

Możemy:

- ukrywać, wstrzymywać, usuwać, usuwać w sposób odwracalny lub, jeśli dany typ zasobu na to pozwala,
  usuwać trwale pozycje naruszające zasady
- blokować pobieranie lub instalowanie niebezpiecznych wydań
- unieważniać tokeny API
- usuwać powiązane treści w sposób odwracalny
- ograniczać dostęp do publikowania
- banować osoby dopuszczające się powtarzających się lub poważnych naruszeń

Nie gwarantujemy, że w przypadku oczywistych nadużyć egzekwowanie zasad będzie poprzedzone ostrzeżeniem. Informacje o
zgłoszeniach, wstrzymaniach moderacyjnych, ukrytych pozycjach, banach i stanie konta znajdziesz w sekcji
[Moderacja i bezpieczeństwo konta](/clawhub/moderation).
