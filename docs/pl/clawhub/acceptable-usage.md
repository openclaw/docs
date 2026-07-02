---
read_when:
    - Sprawdzanie przesyłanych plików pod kątem nadużyć lub naruszeń zasad
    - Pisanie dokumentacji moderacji lub podręczników dla recenzentów
    - Decydowanie, czy Skills powinny zostać ukryte, czy użytkownik zbanowany
sidebarTitle: Acceptable Usage
summary: 'Zasady platformy: co ClawHub dopuszcza i czego nie będzie hostować.'
title: Dopuszczalne użycie
x-i18n:
    generated_at: "2026-07-02T08:52:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Dopuszczalne użycie

ClawHub hostuje Skills, pluginy, pakiety i metadane marketplace dla OpenClaw.
Użyj tej strony, aby zdecydować, czy treść lub zachowanie publikacji należy do
ClawHub.

Te zasady dotyczą tego, co robi listing, o uruchomienie czego prosi użytkowników, jak
przedstawia sam siebie oraz jak wydawcy używają powierzchni odkrywania, instalacji i
zaufania ClawHub. Stany moderacji i status konta opisuje
[Moderacja i bezpieczeństwo konta](/clawhub/moderation). Roszczenia dotyczące praw autorskich lub innych praw
opisuje [Żądania dotyczące praw do treści](/pl/clawhub/content-rights).

## Dozwolone treści

ClawHub przyjmuje treści, które są przydatne, zrozumiałe i publikowane w dobrej
wierze.

| Kategoria                                         | Dozwolone, gdy                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produktywność deweloperów                           | Listing pomaga użytkownikom budować, testować, migrować, debugować, dokumentować lub obsługiwać oprogramowanie.                                               |
| Przepływy pracy UI, danych i automatyzacji               | Zakres jest jasny, wymagane dane uwierzytelniające są wyraźnie wskazane, a ryzykowne działania obejmują ścieżki przeglądu, trybu próbnego, podglądu lub potwierdzenia. |
| Obronny przegląd bezpieczeństwa, moderacji i nadużyć | Narzędzie jest przedstawione jako przeznaczone do autoryzowanego przeglądu, zachowuje dowody i utrzymuje jasne granice zatwierdzania przez człowieka.                          |
| Osobiste lub zespołowe przepływy pracy                       | Przepływ pracy używa kont opartych na zgodzie, przejrzystej konfiguracji i wyraźnych uprawnień.                                            |
| Utrzymywane katalogi                              | Każdy listing jest odrębny, przydatny, dokładnie opisany i rozsądnie utrzymywany.                                                |

Kontekst ma znaczenie. Ten sam temat może być akceptowalny w wąskim, obronnym lub
opartym na zgodzie kontekście, a niedopuszczalny, gdy jest opakowany jako przepływ pracy do nadużyć.

## Niedozwolone treści

ClawHub nie hostuje treści, których głównym celem jest nadużycie, oszustwo, niebezpieczne
wykonanie lub naruszenie praw.

| Kategoria                                                    | Niedozwolone                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nieautoryzowany dostęp lub obejście zabezpieczeń                      | Obejście uwierzytelniania, przejęcie konta, nadużywanie limitów, przejęcie połączenia na żywo lub agenta, kradzież sesji wielokrotnego użytku albo automatyczne zatwierdzanie przepływów parowania dla niezatwierdzonych użytkowników.                                                                                                                                                   |
| Nadużycia platformy i omijanie blokad                              | Ukryte konta po blokadach, rozgrzewanie lub farmienie kont, fałszywe zaangażowanie, automatyzacja wielu kont, masowe publikowanie, boty spamujące albo automatyzacja zbudowana w celu unikania wykrycia.                                                                                                                                          |
| Oszustwa, wyłudzenia i zwodnicze przepływy finansowe             | Fałszywe certyfikaty lub faktury, zwodnicze przepływy płatności, oszukańcze działania outreach, fałszywy dowód społeczny, przepływy pracy z syntetyczną tożsamością do oszustw albo narzędzia do wydawania/obciążania bez jasnej akceptacji człowieka.                                                                                                                    |
| Naruszające prywatność wzbogacanie danych lub nadzór                 | Scrapowanie kontaktów do spamu, doxxing, stalking, pozyskiwanie leadów połączone z niezamówionym outreach, ukryte monitorowanie, niedobrowolne dopasowywanie biometryczne albo użycie wyciekłych danych lub zrzutów z naruszeń.                                                                                                                  |
| Niedobrowolne podszywanie się lub manipulacja tożsamością       | Zamiana twarzy, cyfrowe bliźniaki, klonowani influencerzy, fałszywe persony lub inne narzędzia używane do podszywania się lub wprowadzania w błąd.                                                                                                                                                                                                 |
| Jawne treści seksualne lub generowanie treści dla dorosłych z wyłączonymi zabezpieczeniami | Generowanie obrazów, filmów lub treści NSFW; wrappery treści dla dorosłych wokół API stron trzecich; albo listingi, których głównym celem są jawne treści seksualne.                                                                                                                                                       |
| Ukryte, niebezpieczne lub wprowadzające w błąd wymagania wykonania        | Zaciemnione polecenia instalacyjne, instalatory pipe-to-shell, takie jak pobrana treść uruchamiana przez `sh` lub `bash` bez jasnej możliwości przeglądu, nieujawnione wymagania dotyczące sekretów lub kluczy prywatnych, zdalne wykonanie `npx @latest` bez jasnej możliwości przeglądu albo metadane ukrywające, czego listing naprawdę potrzebuje do uruchomienia. |
| Materiały naruszające prawa autorskie lub inne prawa           | Ponowne publikowanie cudzej umiejętności, pluginu, dokumentacji, zasobów marki lub kodu zastrzeżonego bez pozwolenia; naruszanie warunków licencji; albo podszywanie się pod pierwotnego autora lub wydawcę.                                                                                                                            |

## Niedozwolone zachowanie na marketplace

ClawHub sprawdza też, jak wydawcy korzystają z marketplace. Nie używaj ClawHub do
manipulowania odkrywaniem, metrykami, sygnałami zaufania, systemami moderacji ani
uwagą użytkowników.

Niedozwolone zachowanie na marketplace obejmuje:

- masowe publikowanie dużej liczby listingów wymagających małego nakładu pracy, duplikatywnych, zastępczych lub
  generowanych maszynowo, które nie wydają się mieć realnej wartości dla użytkowników
- zalewanie powierzchni wyszukiwania lub kategorii niemal identycznymi Skills lub pluginami
- publikowanie setek listingów z niewielkim lub żadnym użyciem, utrzymaniem, jasnością źródła
  lub znaczącym zróżnicowaniem
- sztuczne zwiększanie liczby instalacji, pobrań, gwiazdek lub innych metryk zaangażowania
  przez automatyzację, pętle samoinstalacji, fałszywe konta, skoordynowaną
  aktywność, płatne zaangażowanie lub inne nieorganiczne zachowanie
- tworzenie lub rotowanie kont w celu omijania moderacji, blokad, limitów wydawcy lub
  przeglądu marketplace
- wprowadzanie użytkowników w błąd co do własności, źródła, możliwości, stanu bezpieczeństwa,
  wymagań instalacyjnych lub powiązania z innym projektem albo wydawcą
- wielokrotne przesyłanie treści, które zostały już ukryte, usunięte lub zablokowane,
  bez naprawienia podstawowego problemu

Publikowanie w dużej skali nie jest automatycznie nadużyciem. Duże katalogi są akceptowalne,
gdy listingi znacząco się różnią, są dokładnie opisane, utrzymywane
i używane przez rzeczywistych użytkowników. Duże katalogi stają się problemem zaufania i bezpieczeństwa, gdy
wolumen łączy się z listingami płytkimi, duplikatywnymi, wprowadzającymi w błąd, nieutrzymywanymi lub
sztucznie promowanymi.

## Prawa do treści

Jeśli uważasz, że treść w ClawHub narusza Twoje prawa autorskie lub inne prawa, użyj
[Żądania dotyczące praw do treści](/pl/clawhub/content-rights). Nie używaj zwykłych zgłoszeń marketplace
do roszczeń dotyczących praw autorskich lub innych praw, chyba że listing jest też niebezpieczny,
złośliwy lub wprowadzający w błąd.

## Przegląd i egzekwowanie

ClawHub może używać automatycznych kontroli, statystycznych sygnałów nadużyć, zgłoszeń użytkowników i
przeglądu przez personel do identyfikowania niebezpiecznych treści lub nadużyć w publikowaniu. Sygnał
sam w sobie nie dowodzi nadużycia; pomaga ClawHub zdecydować, co wymaga przeglądu.

Możemy:

- ukrywać, wstrzymywać, usuwać, usuwać miękko lub, gdy jest to obsługiwane dla danego typu zasobu,
  usuwać trwale listingi naruszające zasady
- blokować pobrania lub instalacje niebezpiecznych wydań
- unieważniać tokeny API
- usuwać miękko powiązane treści
- ograniczać dostęp do publikowania
- blokować recydywistów lub osoby dopuszczające się poważnych naruszeń

Nie gwarantujemy egzekwowania zasad z wcześniejszym ostrzeżeniem w przypadku oczywistych nadużyć. Zobacz
[Moderacja i bezpieczeństwo konta](/clawhub/moderation), aby uzyskać informacje o zgłoszeniach, wstrzymaniach moderacyjnych,
ukrytych listingach, blokadach i statusie konta.
