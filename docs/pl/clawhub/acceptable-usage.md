---
read_when:
    - Przeglądanie przesłanych plików pod kątem nadużyć lub naruszeń zasad
    - Pisanie dokumentacji moderacji lub instrukcji operacyjnych dla recenzentów
    - Decydowanie, czy skill powinien zostać ukryty, czy użytkownik zbanowany
sidebarTitle: Acceptable Usage
summary: 'Zasady marketplace: co ClawHub dopuszcza i czego nie będzie hostować.'
title: Dopuszczalne użycie
x-i18n:
    generated_at: "2026-06-28T07:41:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Dopuszczalne użycie

ClawHub hostuje Skills, Plugins, pakiety i metadane marketplace dla OpenClaw.
Użyj tej strony, aby zdecydować, czy treść lub sposób publikowania należą do
ClawHub.

Te reguły dotyczą tego, co robi listing, o uruchomienie czego prosi użytkowników, jak
przedstawia sam siebie oraz jak wydawcy korzystają z powierzchni odkrywania, instalacji i
zaufania w ClawHub. Stany moderacji i status konta opisuje
[Moderacja i bezpieczeństwo konta](/pl/clawhub/moderation). Roszczenia dotyczące praw autorskich lub innych praw
opisuje [Żądania dotyczące praw do treści](/pl/clawhub/content-rights).

## Dozwolone treści

ClawHub przyjmuje treści, które są użyteczne, zrozumiałe i publikowane w dobrej
wierze.

| Kategoria                                        | Dozwolone, gdy                                                                                                                      |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Produktywność deweloperska                      | Listing pomaga użytkownikom budować, testować, migrować, debugować, dokumentować lub obsługiwać oprogramowanie.                    |
| Przepływy pracy UI, danych i automatyzacji       | Zakres jest jasny, wymagane dane uwierzytelniające są wyraźnie wskazane, a ryzykowne działania obejmują ścieżki przeglądu, dry-run, podglądu lub potwierdzenia. |
| Obronna ochrona, moderacja i przegląd nadużyć    | Narzędzie jest przedstawione jako przeznaczone do autoryzowanego przeglądu, zachowuje dowody i utrzymuje jasne granice zatwierdzania przez człowieka. |
| Osobiste lub zespołowe przepływy pracy           | Przepływ pracy używa kont opartych na zgodzie, przejrzystej konfiguracji i jednoznacznych uprawnień.                               |
| Utrzymywane katalogi                             | Każdy listing jest odrębny, użyteczny, dokładnie opisany i rozsądnie utrzymywany.                                                  |

Kontekst ma znaczenie. Ten sam temat może być dopuszczalny w wąskim, obronnym lub
opartym na zgodzie kontekście, a niedopuszczalny, gdy jest opakowany jako przepływ pracy do nadużyć.

## Niedozwolone treści

ClawHub nie hostuje treści, których głównym celem jest nadużycie, oszustwo, niebezpieczne
wykonanie lub naruszenie praw.

| Kategoria                                                   | Niedozwolone                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nieautoryzowany dostęp lub obejście zabezpieczeń            | Omijanie uwierzytelniania, przejęcie konta, nadużywanie limitów szybkości, przejęcie rozmowy na żywo lub agenta, kradzież sesji wielokrotnego użytku albo automatyczne zatwierdzanie przepływów parowania dla niezatwierdzonych użytkowników.                                                              |
| Nadużycia platformy i obchodzenie banów                     | Ukryte konta po banach, rozgrzewanie lub hodowanie kont, fałszywe zaangażowanie, automatyzacja wielu kont, masowe publikowanie, boty spamowe lub automatyzacja zbudowana w celu uniknięcia wykrycia.                                                                                                        |
| Oszustwa, wyłudzenia i zwodnicze przepływy finansowe        | Fałszywe certyfikaty lub faktury, zwodnicze przepływy płatności, kontaktowanie się w celu oszustwa, fałszywy dowód społeczny, przepływy syntetycznej tożsamości do oszustw albo narzędzia wydawania/obciążania bez jasnego zatwierdzenia przez człowieka.                                                    |
| Naruszające prywatność wzbogacanie danych lub nadzór        | Zbieranie kontaktów do spamu, doxxing, stalking, pozyskiwanie leadów połączone z niezamówionym kontaktem, ukryte monitorowanie, niedobrowolne dopasowywanie biometryczne albo używanie wyciekłych danych lub zrzutów z naruszeń.                                                                            |
| Niedobrowolne podszywanie się lub manipulacja tożsamością   | Zamiana twarzy, cyfrowe bliźniaki, sklonowani influencerzy, fałszywe persony lub inne narzędzia używane do podszywania się albo wprowadzania w błąd.                                                                                                                                                         |
| Jawne treści seksualne lub generowanie treści dla dorosłych z wyłączonymi zabezpieczeniami | Generowanie obrazów, wideo lub treści NSFW; wrappery treści dla dorosłych wokół API firm trzecich; albo listingi, których głównym celem są jawne treści seksualne.                                                                                                                                            |
| Ukryte, niebezpieczne lub mylące wymagania wykonania        | Zaciemnione polecenia instalacji, instalatory pipe-to-shell, takie jak pobrana treść uruchamiana przez `sh` lub `bash` bez jasnej możliwości przeglądu, nieujawnione wymagania dotyczące sekretów lub kluczy prywatnych, zdalne wykonanie `npx @latest` bez jasnej możliwości przeglądu albo metadane ukrywające, czego listing naprawdę potrzebuje do uruchomienia. |
| Materiały naruszające prawa autorskie lub inne prawa        | Ponowne publikowanie cudzych Skills, pluginów, dokumentacji, zasobów marki lub kodu własnościowego bez pozwolenia; naruszanie warunków licencji; albo podszywanie się pod pierwotnego autora lub wydawcę.                                                                                                    |

## Niedozwolone zachowanie w marketplace

ClawHub ocenia również, jak wydawcy korzystają z marketplace. Nie używaj ClawHub do
manipulowania odkrywaniem, metrykami, sygnałami zaufania, systemami moderacji ani
uwagą użytkowników.

Niedozwolone zachowania w marketplace obejmują:

- masowe publikowanie dużej liczby niskiej jakości, duplikujących się, zastępczych lub
  wygenerowanych maszynowo listingów, które nie wydają się mieć realnej wartości dla użytkowników
- zalewanie powierzchni wyszukiwania lub kategorii niemal identycznymi Skills lub pluginami
- publikowanie setek listingów z niewielkim lub żadnym użyciem, utrzymaniem, jasnością źródła
  albo znaczącym zróżnicowaniem
- sztuczne zawyżanie instalacji, pobrań, gwiazdek lub innych metryk zaangażowania
  przez automatyzację, pętle samodzielnej instalacji, fałszywe konta, skoordynowane
  działania, płatne zaangażowanie lub inne nieorganiczne zachowanie
- tworzenie lub rotowanie kont w celu unikania moderacji, banów, limitów wydawcy lub
  przeglądu marketplace
- wprowadzanie użytkowników w błąd co do własności, źródła, możliwości, stanu bezpieczeństwa,
  wymagań instalacyjnych lub powiązania z innym projektem albo wydawcą
- wielokrotne przesyłanie treści, które zostały już ukryte, usunięte lub zablokowane,
  bez naprawienia podstawowego problemu

Publikowanie na dużą skalę nie jest automatycznie nadużyciem. Duże katalogi są dopuszczalne,
gdy listingi znacząco się różnią, są dokładnie opisane, utrzymywane
i używane przez realnych użytkowników. Duże katalogi stają się problemem zaufania i bezpieczeństwa, gdy
wolumen łączy się z listingami ubogimi, duplikującymi się, mylącymi, nieutrzymywanymi lub
sztucznie promowanymi.

## Prawa do treści

Jeśli uważasz, że treść w ClawHub narusza Twoje prawa autorskie lub inne prawa, użyj
[Żądania dotyczące praw do treści](/pl/clawhub/content-rights). Nie używaj zwykłych zgłoszeń marketplace
do roszczeń dotyczących praw autorskich lub innych praw, chyba że listing jest również niebezpieczny,
złośliwy lub mylący.

## Przegląd i egzekwowanie

ClawHub może używać zautomatyzowanych kontroli, statystycznych sygnałów nadużyć, zgłoszeń użytkowników i
przeglądu przez personel do identyfikowania niebezpiecznych treści lub nadużyć w zachowaniu publikacyjnym. Sygnał
sam w sobie nie dowodzi nadużycia; pomaga ClawHub zdecydować, co wymaga przeglądu.

Możemy:

- ukrywać, wstrzymywać, usuwać, miękko usuwać lub, gdy jest to obsługiwane dla danego typu zasobu,
  trwale usuwać naruszające listingi
- blokować pobrania lub instalacje niebezpiecznych wydań
- cofać tokeny API
- miękko usuwać powiązane treści
- ograniczać dostęp do publikowania
- banować powtarzających się lub poważnych sprawców naruszeń

Nie gwarantujemy egzekwowania z wcześniejszym ostrzeżeniem w przypadku oczywistych nadużyć. Zobacz
[Moderacja i bezpieczeństwo konta](/pl/clawhub/moderation), aby uzyskać informacje o zgłoszeniach, wstrzymaniach moderacyjnych,
ukrytych listingach, banach i statusie konta.
