---
read_when:
    - Sprawdzanie przesłanych plików pod kątem nadużyć lub naruszeń zasad
    - Pisanie dokumentacji moderacyjnej lub podręczników dla recenzentów
    - Podejmowanie decyzji, czy ukryć umiejętność, czy zablokować użytkownika
sidebarTitle: Acceptable Usage
summary: 'Zasady marketplace’u: co ClawHub dopuszcza, a czego nie będzie hostować.'
title: Dopuszczalne użytkowanie
x-i18n:
    generated_at: "2026-07-16T18:20:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Zasady dopuszczalnego użytkowania

ClawHub udostępnia Skills, pluginy, pakiety i metadane marketplace’u dla OpenClaw.
Ta strona pomaga ustalić, czy dane treści lub sposób publikowania są odpowiednie dla
ClawHub.

Zasady te dotyczą działania wpisu, poleceń, które każe on uruchamiać użytkownikom, sposobu,
w jaki się przedstawia, oraz sposobu, w jaki wydawcy korzystają z mechanizmów odkrywania, instalacji i
zaufania ClawHub. Informacje o stanach moderacji i statusie konta zawiera strona
[Moderacja i bezpieczeństwo konta](/clawhub/moderation). Informacje o roszczeniach dotyczących praw autorskich lub innych praw
zawiera strona [Wnioski dotyczące praw do treści](/clawhub/content-rights).

## Dozwolone treści

ClawHub przyjmuje treści, które są użyteczne, zrozumiałe i publikowane w dobrej
wierze.

| Kategoria                                         | Dozwolone, gdy                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produktywność programistów                           | Wpis pomaga użytkownikom tworzyć, testować, migrować, debugować, dokumentować lub obsługiwać oprogramowanie.                                               |
| Przepływy pracy związane z interfejsem użytkownika, danymi i automatyzacją               | Zakres jest jasny, wymagane dane uwierzytelniające są wyraźnie określone, a ryzykowne działania obejmują ścieżki przeglądu, uruchomienia próbnego, podglądu lub potwierdzenia. |
| Bezpieczeństwo defensywne, moderacja i analiza nadużyć | Narzędzie jest przeznaczone do autoryzowanej analizy, zachowuje dowody i jasno określa granice wymagające zatwierdzenia przez człowieka.                          |
| Osobiste lub zespołowe przepływy pracy                       | Przepływ pracy korzysta z kont używanych za zgodą, przejrzystej konfiguracji i jawnych uprawnień.                                            |
| Utrzymywane katalogi                              | Każdy wpis jest odrębny, użyteczny, dokładnie opisany i odpowiednio utrzymywany.                                                |

Kontekst ma znaczenie. Ten sam temat może być dopuszczalny w wąskim kontekście defensywnym lub
opartym na zgodzie, a niedopuszczalny, gdy zostanie udostępniony jako przepływ pracy służący do nadużyć.

## Niedozwolone treści

ClawHub nie udostępnia treści, których głównym celem są nadużycia, oszustwo, niebezpieczne
wykonywanie lub naruszanie praw.

| Kategoria                                                    | Niedozwolone                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nieautoryzowany dostęp lub omijanie zabezpieczeń                      | Omijanie uwierzytelniania, przejmowanie kont, nadużywanie limitów szybkości, przejmowanie trwających połączeń lub agentów, kradzież sesji umożliwiająca ich ponowne wykorzystanie albo automatyczne zatwierdzanie procesów parowania dla niezatwierdzonych użytkowników.                                                                                                                                                   |
| Nadużywanie platformy i obchodzenie blokad                              | Konta ukrywane po zablokowaniu, rozgrzewanie lub masowe tworzenie kont, fałszywe zaangażowanie, automatyzacja wielu kont, masowe publikowanie, boty spamujące lub automatyzacja stworzona w celu uniknięcia wykrycia.                                                                                                                                          |
| Oszustwa, wyłudzenia i zwodnicze finansowe przepływy pracy             | Fałszywe certyfikaty lub faktury, zwodnicze przepływy płatności, oszukańcze wiadomości, fałszywe dowody społeczne, przepływy pracy wykorzystujące syntetyczne tożsamości do oszustw albo narzędzia do wydawania lub obciążania środków bez wyraźnej zgody człowieka.                                                                                                                    |
| Naruszające prywatność wzbogacanie danych lub inwigilacja                 | Pozyskiwanie danych kontaktowych w celu spamowania, doxxing, stalking, pozyskiwanie potencjalnych klientów połączone z niechcianym kontaktem, ukryte monitorowanie, biometryczne dopasowywanie bez zgody albo wykorzystywanie danych pochodzących z wycieków lub zbiorów danych z naruszeń.                                                                                                                  |
| Podszywanie się lub manipulowanie tożsamością bez zgody       | Zamiana twarzy, cyfrowe bliźniaki, klonowani influencerzy, fałszywe persony lub inne narzędzia używane do podszywania się albo wprowadzania w błąd.                                                                                                                                                                                                 |
| Jawne treści seksualne lub generowanie treści dla dorosłych z wyłączonymi zabezpieczeniami | Generowanie obrazów, filmów lub treści NSFW; nakładki do tworzenia treści dla dorosłych wykorzystujące interfejsy API innych firm; albo wpisy, których głównym celem są jawne treści seksualne.                                                                                                                                                       |
| Ukryte, niebezpieczne lub wprowadzające w błąd wymagania dotyczące wykonywania        | Zaciemnione polecenia instalacyjne, instalatory przekazujące dane do powłoki, na przykład pobrane treści uruchamiane za pomocą `sh` lub `bash` bez możliwości łatwego sprawdzenia, nieujawnione wymagania dotyczące sekretów lub kluczy prywatnych, zdalne wykonywanie `npx @latest` bez możliwości łatwego sprawdzenia albo metadane ukrywające rzeczywiste wymagania potrzebne do uruchomienia wpisu. |
| Materiały naruszające prawa autorskie lub inne prawa           | Ponowne publikowanie należących do innej osoby Skills, pluginu, dokumentacji, zasobów marki lub kodu własnościowego bez pozwolenia; naruszanie warunków licencji; albo podszywanie się pod pierwotnego autora lub wydawcę.                                                                                                                            |

## Niedozwolone zachowania w marketplace’ie

ClawHub sprawdza również, w jaki sposób wydawcy korzystają z marketplace’u. Nie wolno używać ClawHub do
manipulowania mechanizmami odkrywania, wskaźnikami, sygnałami zaufania, systemami moderacji ani uwagą
użytkowników.

Niedozwolone zachowania w marketplace’ie obejmują:

- masowe publikowanie dużej liczby niskiej jakości, powielających się, zastępczych lub
  generowanych maszynowo wpisów, które nie wydają się zapewniać użytkownikom rzeczywistej wartości
- zalewanie wyników wyszukiwania lub kategorii niemal identycznymi Skills lub pluginami
- publikowanie setek wpisów o niewielkim lub zerowym wykorzystaniu, stopniu utrzymania, przejrzystości
  źródła albo znaczącym zróżnicowaniu
- sztuczne zawyżanie liczby instalacji, pobrań, gwiazdek lub innych wskaźników
  zaangażowania za pomocą automatyzacji, pętli samoczynnych instalacji, fałszywych kont, skoordynowanej
  aktywności, płatnego zaangażowania lub innych nieorganicznych zachowań
- tworzenie lub rotacyjne używanie kont w celu obchodzenia moderacji, blokad, limitów wydawców lub
  procesu weryfikacji w marketplace’ie
- wprowadzanie użytkowników w błąd co do własności, źródła, możliwości, poziomu bezpieczeństwa,
  wymagań instalacyjnych lub powiązania z innym projektem albo wydawcą
- wielokrotne przesyłanie treści, które zostały już ukryte, usunięte lub zablokowane,
  bez rozwiązania problemu będącego tego przyczyną

Publikowanie dużej liczby wpisów nie jest automatycznie nadużyciem. Duże katalogi są dopuszczalne,
gdy wpisy znacząco się różnią, są dokładnie opisane, utrzymywane
i używane przez rzeczywistych użytkowników. Duże katalogi stają się problemem dotyczącym zaufania i bezpieczeństwa, gdy
dużej liczbie towarzyszą powierzchowne, powielające się, wprowadzające w błąd, nieutrzymywane lub
sztucznie promowane wpisy.

## Prawa do treści

Jeśli istnieje podejrzenie, że treść w ClawHub narusza prawa autorskie lub inne prawa, należy skorzystać ze strony
[Wnioski dotyczące praw do treści](/clawhub/content-rights). Nie należy używać zwykłych zgłoszeń w marketplace’ie
do zgłaszania roszczeń dotyczących praw autorskich lub innych praw, chyba że wpis jest również niebezpieczny,
złośliwy lub wprowadzający w błąd.

## Weryfikacja i egzekwowanie zasad

ClawHub może wykorzystywać automatyczne kontrole, statystyczne sygnały nadużyć, zgłoszenia użytkowników i
weryfikację personelu w celu identyfikowania niebezpiecznych treści lub niewłaściwych zachowań związanych z publikowaniem. Sam sygnał
nie stanowi dowodu nadużycia; pomaga ClawHub określić, co wymaga weryfikacji.

Możemy:

- ukrywać, wstrzymywać, usuwać, usuwać miękko lub, jeśli dany typ zasobu na to pozwala,
  usuwać trwale wpisy naruszające zasady
- blokować pobieranie lub instalowanie niebezpiecznych wersji
- unieważniać tokeny API
- usuwać miękko powiązane treści
- ograniczać dostęp do publikowania
- blokować sprawców powtarzających się lub poważnych naruszeń

Nie gwarantujemy, że w przypadku oczywistych nadużyć egzekwowanie zasad będzie poprzedzone ostrzeżeniem. Informacje o
zgłoszeniach, wstrzymaniach moderacyjnych, ukrytych wpisach, blokadach i statusie konta zawiera strona
[Moderacja i bezpieczeństwo konta](/clawhub/moderation).
