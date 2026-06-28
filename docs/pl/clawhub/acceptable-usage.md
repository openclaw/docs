---
read_when:
    - Sprawdzanie przesłanych plików pod kątem nadużyć lub naruszeń zasad
    - Pisanie dokumentacji moderacji lub runbooków dla recenzentów
    - Decydowanie, czy Skills powinna być ukryta, czy użytkownik zbanowany
sidebarTitle: Acceptable Usage
summary: 'Polityka marketplace: co ClawHub dopuszcza i czego nie będzie hostować.'
title: Dopuszczalne użycie
x-i18n:
    generated_at: "2026-06-28T00:10:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Dopuszczalne użycie

ClawHub hostuje Skills, pluginy, pakiety i metadane marketplace dla OpenClaw.
Użyj tej strony, aby zdecydować, czy treść lub zachowanie publikowania należy do
ClawHub.

Te zasady dotyczą tego, co robi wpis, co prosi użytkowników o uruchomienie, jak
przedstawia sam siebie oraz jak wydawcy używają powierzchni odkrywania, instalacji
i zaufania ClawHub. Stany moderacji i status konta opisuje
[Moderacja i bezpieczeństwo konta](/pl/clawhub/moderation). Roszczenia dotyczące praw autorskich lub innych praw opisują
[Zgłoszenia praw do treści](/pl/clawhub/content-rights).

## Dozwolona treść

ClawHub akceptuje treści, które są użyteczne, zrozumiałe i publikowane w dobrej
wierze.

| Kategoria                                        | Dozwolone, gdy                                                                                                                      |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Produktywność deweloperska                       | Wpis pomaga użytkownikom budować, testować, migrować, debugować, dokumentować lub obsługiwać oprogramowanie.                       |
| Przepływy pracy UI, danych i automatyzacji       | Zakres jest jasny, wymagane dane uwierzytelniające są jednoznaczne, a ryzykowne działania obejmują ścieżki przeglądu, dry-run, podglądu lub potwierdzenia. |
| Defensywne bezpieczeństwo, moderacja i przegląd nadużyć | Narzędzie jest przedstawione jako przeznaczone do autoryzowanego przeglądu, zachowuje dowody i jasno utrzymuje granice zatwierdzania przez człowieka. |
| Osobiste lub zespołowe przepływy pracy           | Przepływ pracy używa kont opartych na zgodzie, przejrzystej konfiguracji i jednoznacznych uprawnień.                                |
| Utrzymywane katalogi                             | Każdy wpis jest odrębny, użyteczny, dokładnie opisany i rozsądnie utrzymywany.                                                       |

Kontekst ma znaczenie. Ten sam temat może być akceptowalny w wąskim ustawieniu
defensywnym lub opartym na zgodzie i niedopuszczalny, gdy jest opakowany jako
przepływ pracy do nadużyć.

## Niedozwolona treść

ClawHub nie hostuje treści, których głównym celem są nadużycia, oszustwo,
niebezpieczne wykonanie lub naruszenie praw.

| Kategoria                                                   | Niedozwolone                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nieautoryzowany dostęp lub obchodzenie zabezpieczeń         | Obchodzenie uwierzytelniania, przejęcie konta, nadużywanie limitów szybkości, przejęcie aktywnego połączenia lub agenta, kradzież sesji wielokrotnego użytku albo automatyczne zatwierdzanie przepływów parowania dla niezatwierdzonych użytkowników. |
| Nadużycia platformy i obchodzenie blokad                    | Ukryte konta po blokadach, rozgrzewanie lub farmienie kont, fałszywe zaangażowanie, automatyzacja wielu kont, masowe publikowanie, boty spamujące albo automatyzacja zbudowana w celu uniknięcia wykrycia.                                      |
| Oszustwa, wyłudzenia i zwodnicze przepływy finansowe        | Fałszywe certyfikaty lub faktury, zwodnicze przepływy płatności, kontaktowanie się w celu oszustwa, fałszywy dowód społeczny, przepływy syntetycznej tożsamości do oszustw albo narzędzia wydawania/obciążania bez jasnej zgody człowieka.        |
| Naruszające prywatność wzbogacanie danych lub nadzór        | Scrapowanie kontaktów do spamu, doxxing, stalking, ekstrakcja leadów połączona z niezamówionym kontaktem, ukryte monitorowanie, biometryczne dopasowywanie bez zgody albo użycie wyciekłych danych lub zrzutów z naruszeń.                     |
| Podszywanie się lub manipulacja tożsamością bez zgody       | Zamiana twarzy, cyfrowe bliźniaki, klonowani influencerzy, fałszywe persony albo inne narzędzia używane do podszywania się lub wprowadzania w błąd.                                                                                              |
| Jawne treści seksualne lub generowanie dla dorosłych z wyłączonymi zabezpieczeniami | Generowanie obrazów, wideo lub treści NSFW; wrappery treści dla dorosłych wokół API zewnętrznych; albo wpisy, których głównym celem są jawne treści seksualne.                                                                                  |
| Ukryte, niebezpieczne lub mylące wymagania wykonania        | Zaciemnione polecenia instalacyjne, instalatory typu pipe-to-shell, takie jak pobrana treść uruchamiana przez `sh` lub `bash` bez jasnej możliwości przeglądu, nieujawnione wymagania dotyczące sekretów lub kluczy prywatnych, zdalne wykonanie `npx @latest` bez jasnej możliwości przeglądu albo metadane ukrywające, czego wpis naprawdę potrzebuje do uruchomienia. |
| Materiały naruszające prawa autorskie lub inne prawa        | Ponowna publikacja czyjegoś Skill, pluginu, dokumentacji, zasobów marki lub kodu własnościowego bez pozwolenia; naruszenie warunków licencji; albo podszywanie się pod pierwotnego autora lub wydawcę.                                         |

## Niedozwolone zachowania marketplace

ClawHub sprawdza także, jak wydawcy używają marketplace. Nie używaj ClawHub do
manipulowania odkrywaniem, metrykami, sygnałami zaufania, systemami moderacji ani
uwagą użytkowników.

Niedozwolone zachowania marketplace obejmują:

- masowe publikowanie dużej liczby niskonakładowych, duplikatywnych, zastępczych lub
  wygenerowanych maszynowo wpisów, które nie wydają się mieć realnej wartości dla użytkowników
- zalewanie powierzchni wyszukiwania lub kategorii niemal identycznymi Skills lub pluginami
- publikowanie setek wpisów z niewielkim lub zerowym użyciem, utrzymaniem, jasnością źródła
  albo znaczącym zróżnicowaniem
- sztuczne zawyżanie instalacji, pobrań, gwiazdek lub innych metryk zaangażowania
  przez automatyzację, pętle samoinstalacji, fałszywe konta, skoordynowaną
  aktywność, płatne zaangażowanie albo inne nieorganiczne zachowanie
- tworzenie lub rotowanie kont w celu obejścia moderacji, blokad, limitów wydawcy lub
  przeglądu marketplace
- wprowadzanie użytkowników w błąd co do własności, źródła, możliwości, postawy bezpieczeństwa,
  wymagań instalacyjnych albo powiązania z innym projektem lub wydawcą
- wielokrotne przesyłanie treści, które zostały już ukryte, usunięte lub zablokowane,
  bez naprawienia podstawowego problemu

Publikowanie na dużą skalę nie jest automatycznie nadużyciem. Duże katalogi są akceptowalne,
gdy wpisy są znacząco różne, dokładnie opisane, utrzymywane
i używane przez rzeczywistych użytkowników. Duże katalogi stają się problemem zaufania
i bezpieczeństwa, gdy wolumen łączy się z wpisami płytkimi, duplikatywnymi, mylącymi,
nieutrzymywanymi lub sztucznie promowanymi.

## Prawa do treści

Jeśli uważasz, że treść w ClawHub narusza Twoje prawa autorskie lub inne prawa, użyj
[Zgłoszeń praw do treści](/pl/clawhub/content-rights). Nie używaj zwykłych zgłoszeń marketplace
do roszczeń dotyczących praw autorskich lub innych praw, chyba że wpis jest także niebezpieczny,
złośliwy lub mylący.

## Przegląd i egzekwowanie

ClawHub może używać automatycznych kontroli, statystycznych sygnałów nadużyć, zgłoszeń użytkowników i
przeglądu przez zespół, aby identyfikować niebezpieczne treści lub nadużycia przy publikowaniu. Sygnał
sam w sobie nie dowodzi nadużycia; pomaga ClawHub zdecydować, co wymaga przeglądu.

Możemy:

- ukryć, wstrzymać, usunąć, miękko usunąć albo, tam gdzie jest to obsługiwane dla typu zasobu,
  trwale usunąć naruszające wpisy
- zablokować pobieranie lub instalacje niebezpiecznych wydań
- unieważnić tokeny API
- miękko usunąć powiązaną treść
- ograniczyć dostęp do publikowania
- zablokować powtarzających się lub poważnych naruszycieli

Nie gwarantujemy egzekwowania z ostrzeżeniem w pierwszej kolejności w przypadku oczywistych nadużyć. Zobacz
[Moderację i bezpieczeństwo konta](/pl/clawhub/moderation), aby uzyskać informacje o zgłoszeniach, blokadach moderacyjnych,
ukrytych wpisach, banach i statusie konta.
