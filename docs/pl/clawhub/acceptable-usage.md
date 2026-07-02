---
read_when:
    - Sprawdzanie przesłanych plików pod kątem nadużyć lub naruszeń zasad
    - Pisanie dokumentacji moderacji lub podręczników dla recenzentów
    - Podejmowanie decyzji, czy skill powinien zostać ukryty, czy użytkownik zbanowany
sidebarTitle: Acceptable Usage
summary: 'Zasady marketplace: co ClawHub dopuszcza, a czego nie będzie hostować.'
title: Dopuszczalne użycie
x-i18n:
    generated_at: "2026-07-02T14:12:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Dopuszczalne użycie

ClawHub hostuje Skills, pluginy, pakiety i metadane marketplace dla OpenClaw.
Użyj tej strony, aby zdecydować, czy treść lub sposób publikowania należą do
ClawHub.

Te reguły dotyczą tego, co robi wpis, o uruchomienie czego prosi użytkowników,
jak przedstawia sam siebie oraz jak wydawcy korzystają z powierzchni odkrywania,
instalacji i zaufania w ClawHub. Stany moderacji i status konta opisuje
[Moderacja i bezpieczeństwo konta](/clawhub/moderation). Roszczenia dotyczące
praw autorskich lub innych praw opisuje [Żądania dotyczące praw do treści](/pl/clawhub/content-rights).

## Dozwolone treści

ClawHub przyjmuje treści, które są użyteczne, zrozumiałe i publikowane w dobrej
wierze.

| Kategoria                                         | Dozwolone, gdy                                                                                                                    |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produktywność programistów                       | Wpis pomaga użytkownikom budować, testować, migrować, debugować, dokumentować lub obsługiwać oprogramowanie.                     |
| Przepływy pracy UI, danych i automatyzacji       | Zakres jest jasny, wymagane dane uwierzytelniające są wyraźnie wskazane, a ryzykowne działania obejmują ścieżki przeglądu, dry-run, podglądu lub potwierdzenia. |
| Bezpieczeństwo defensywne, moderacja i przegląd nadużyć | Narzędzie jest przedstawione jako przeznaczone do autoryzowanego przeglądu, zachowuje dowody i utrzymuje jasne granice zatwierdzania przez człowieka. |
| Osobiste lub zespołowe przepływy pracy           | Przepływ pracy używa kont opartych na zgodzie, przejrzystej konfiguracji i wyraźnych uprawnień.                                  |
| Utrzymywane katalogi                             | Każdy wpis jest odrębny, użyteczny, dokładnie opisany i rozsądnie utrzymywany.                                                    |

Kontekst ma znaczenie. Ten sam temat może być dopuszczalny w wąskim,
defensywnym lub opartym na zgodzie ustawieniu, a niedopuszczalny, gdy jest
opakowany jako przepływ pracy do nadużyć.

## Niedozwolone treści

ClawHub nie hostuje treści, których głównym celem jest nadużycie, oszustwo,
niebezpieczne wykonanie lub naruszenie praw.

| Kategoria                                                    | Niedozwolone                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nieautoryzowany dostęp lub obejście zabezpieczeń            | Obejście uwierzytelniania, przejęcie konta, nadużycie limitów szybkości, przejęcie rozmowy na żywo lub agenta, kradzież sesji wielokrotnego użytku albo automatyczne zatwierdzanie przepływów parowania dla niezatwierdzonych użytkowników.                                                                |
| Nadużycia platformy i omijanie banów                        | Ukryte konta po banach, rozgrzewanie lub hodowanie kont, fałszywe zaangażowanie, automatyzacja wielu kont, masowe publikowanie, boty spamujące albo automatyzacja zbudowana w celu uniknięcia wykrycia.                                                                                                      |
| Oszustwa, wyłudzenia i zwodnicze przepływy finansowe        | Fałszywe certyfikaty lub faktury, zwodnicze przepływy płatności, kontaktowanie się w celu oszustwa, fałszywy dowód społeczny, przepływy syntetycznej tożsamości do oszustw albo narzędzia do wydawania/obciążania bez wyraźnej zgody człowieka.                                                             |
| Inwazyjne wobec prywatności wzbogacanie lub nadzór          | Zbieranie kontaktów do spamu, doxxing, stalking, ekstrakcja leadów połączona z niezamówionym kontaktem, ukryty monitoring, niekonsensualne dopasowywanie biometryczne albo użycie wyciekłych danych lub zrzutów z naruszeń.                                                                                |
| Niekonsensualne podszywanie się lub manipulacja tożsamością | Zamiana twarzy, cyfrowe bliźniaki, sklonowani influencerzy, fałszywe persony albo inne narzędzia używane do podszywania się lub wprowadzania w błąd.                                                                                                                                                         |
| Jawne treści seksualne lub generowanie treści dla dorosłych z wyłączonymi zabezpieczeniami | Generowanie obrazów, wideo lub treści NSFW; wrappery treści dla dorosłych wokół API firm trzecich; albo wpisy, których głównym celem są jawne treści seksualne.                                                                                                                                              |
| Ukryte, niebezpieczne lub mylące wymagania wykonania        | Zaciemnione polecenia instalacji, instalatory typu pipe-to-shell, takie jak pobrane treści uruchamiane za pomocą `sh` lub `bash` bez jasnej możliwości przeglądu, niezgłoszone wymagania dotyczące sekretów lub kluczy prywatnych, zdalne wykonanie `npx @latest` bez jasnej możliwości przeglądu albo metadane ukrywające, czego wpis naprawdę potrzebuje do uruchomienia. |
| Materiały naruszające prawa autorskie lub inne prawa        | Ponowne publikowanie cudzych Skills, pluginów, dokumentacji, zasobów marki lub kodu własnościowego bez pozwolenia; naruszanie warunków licencji; albo podszywanie się pod pierwotnego autora lub wydawcę.                                                                                                      |

## Niedozwolone zachowanie w marketplace

ClawHub sprawdza również, jak wydawcy używają marketplace. Nie używaj ClawHub do
manipulowania odkrywaniem, metrykami, sygnałami zaufania, systemami moderacji
ani uwagą użytkowników.

Niedozwolone zachowania w marketplace obejmują:

- masowe publikowanie dużej liczby wpisów o niskim nakładzie pracy, powielonych,
  zastępczych lub wygenerowanych maszynowo, które nie wydają się mieć realnej
  wartości dla użytkowników
- zalewanie powierzchni wyszukiwania lub kategorii niemal identycznymi Skills albo pluginami
- publikowanie setek wpisów o niewielkim lub żadnym użyciu, utrzymaniu, jasności
  źródła albo znaczącym zróżnicowaniu
- sztuczne zawyżanie instalacji, pobrań, gwiazdek lub innych metryk
  zaangażowania przez automatyzację, pętle samodzielnych instalacji, fałszywe
  konta, skoordynowaną aktywność, płatne zaangażowanie albo inne nieorganiczne zachowanie
- tworzenie lub rotowanie kont w celu omijania moderacji, banów, limitów wydawców
  albo przeglądu marketplace
- wprowadzanie użytkowników w błąd co do własności, źródła, możliwości, postawy
  bezpieczeństwa, wymagań instalacyjnych albo powiązania z innym projektem lub wydawcą
- wielokrotne przesyłanie treści, które zostały już ukryte, usunięte lub zablokowane,
  bez naprawienia podstawowego problemu

Publikowanie na dużą skalę nie jest automatycznie nadużyciem. Duże katalogi są
dopuszczalne, gdy wpisy znacząco się różnią, są dokładnie opisane, utrzymywane
i używane przez prawdziwych użytkowników. Duże katalogi stają się problemem
zaufania i bezpieczeństwa, gdy wolumen łączy się z wpisami ubogimi, powielonymi,
mylącymi, nieutrzymywanymi lub sztucznie promowanymi.

## Prawa do treści

Jeśli uważasz, że treść w ClawHub narusza Twoje prawa autorskie lub inne prawa,
użyj [Żądania dotyczące praw do treści](/pl/clawhub/content-rights). Nie używaj zwykłych
zgłoszeń marketplace do roszczeń dotyczących praw autorskich lub innych praw,
chyba że wpis jest również niebezpieczny, złośliwy albo mylący.

## Przegląd i egzekwowanie

ClawHub może używać automatycznych kontroli, statystycznych sygnałów nadużyć,
zgłoszeń użytkowników i przeglądu przez personel, aby identyfikować
niebezpieczne treści lub nadużycia w publikowaniu. Sygnał sam w sobie nie
dowodzi nadużycia; pomaga ClawHub zdecydować, co wymaga przeglądu.

Możemy:

- ukrywać, wstrzymywać, usuwać, miękko usuwać albo, tam gdzie jest to obsługiwane
  dla typu zasobu, trwale usuwać naruszające wpisy
- blokować pobrania lub instalacje niebezpiecznych wydań
- unieważniać tokeny API
- miękko usuwać powiązane treści
- ograniczać dostęp do publikowania
- banować powtarzających się lub poważnych naruszycieli

Nie gwarantujemy egzekwowania z wcześniejszym ostrzeżeniem w przypadku
oczywistych nadużyć. Zobacz [Moderacja i bezpieczeństwo konta](/clawhub/moderation),
aby uzyskać informacje o zgłoszeniach, wstrzymaniach moderacyjnych, ukrytych
wpisach, banach i statusie konta.
