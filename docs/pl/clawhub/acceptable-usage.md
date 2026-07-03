---
read_when:
    - Sprawdzanie przesłanych plików pod kątem nadużyć lub naruszeń zasad
    - Pisanie dokumentacji moderacji lub instrukcji dla recenzentów
    - Decydowanie, czy skill powinien zostać ukryty, czy użytkownik zbanowany
sidebarTitle: Acceptable Usage
summary: 'Zasady marketplace’u: co ClawHub dopuszcza i czego nie będzie hostować.'
title: Dopuszczalne użycie
x-i18n:
    generated_at: "2026-07-03T02:57:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Dopuszczalne użycie

ClawHub hostuje Skills, pluginy, pakiety i metadane marketplace dla OpenClaw.
Ta strona pomaga zdecydować, czy treść lub sposób publikowania należy umieścić w
ClawHub.

Te zasady dotyczą tego, co robi wpis, o uruchomienie czego prosi użytkowników, jak
się przedstawia oraz jak wydawcy używają powierzchni odkrywania, instalacji i
zaufania w ClawHub. Stany moderacji i status konta opisuje
[Moderacja i bezpieczeństwo konta](/clawhub/moderation). Roszczenia dotyczące praw
autorskich lub innych praw opisuje [Żądania dotyczące praw do treści](/pl/clawhub/content-rights).

## Dozwolone treści

ClawHub przyjmuje treści, które są użyteczne, zrozumiałe i publikowane w dobrej
wierze.

| Kategoria                                        | Dozwolone, gdy                                                                                                                     |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Produktywność deweloperska                      | Wpis pomaga użytkownikom budować, testować, migrować, debugować, dokumentować lub obsługiwać oprogramowanie.                      |
| Przepływy pracy UI, danych i automatyzacji       | Zakres jest jasny, wymagane dane uwierzytelniające są wyraźnie określone, a ryzykowne działania obejmują ścieżki przeglądu, próby na sucho, podglądu lub potwierdzenia. |
| Bezpieczeństwo defensywne, moderacja i przegląd nadużyć | Narzędzie jest przedstawione jako przeznaczone do autoryzowanego przeglądu, zachowuje dowody i jasno określa granice zatwierdzenia przez człowieka. |
| Osobiste lub zespołowe przepływy pracy           | Przepływ pracy używa kont opartych na zgodzie, przejrzystej konfiguracji i wyraźnych uprawnień.                                   |
| Utrzymywane katalogi                             | Każdy wpis jest odrębny, użyteczny, dokładnie opisany i rozsądnie utrzymywany.                                                     |

Kontekst ma znaczenie. Ten sam temat może być akceptowalny w wąskim kontekście
defensywnym lub opartym na zgodzie, a niedopuszczalny, gdy jest spakowany jako
przepływ pracy do nadużyć.

## Niedozwolone treści

ClawHub nie hostuje treści, których głównym celem jest nadużycie, oszustwo,
niebezpieczne wykonywanie lub naruszenie praw.

| Kategoria                                                   | Niedozwolone                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nieautoryzowany dostęp lub obejście zabezpieczeń            | Obejście uwierzytelniania, przejęcie konta, nadużywanie limitów szybkości, przejęcie połączenia na żywo lub agenta, wielokrotnego użytku kradzież sesji albo automatyczne zatwierdzanie przepływów parowania dla niezatwierdzonych użytkowników. |
| Nadużycia platformy i obchodzenie blokad                    | Ukryte konta po blokadach, rozgrzewanie lub farmienie kont, fałszywe zaangażowanie, automatyzacja wielu kont, masowe publikowanie, boty spamujące albo automatyzacja zbudowana w celu uniknięcia wykrycia. |
| Oszustwa, wyłudzenia i zwodnicze przepływy finansowe        | Fałszywe certyfikaty lub faktury, zwodnicze przepływy płatności, kontaktowanie się w celu oszustwa, fałszywy dowód społeczny, przepływy syntetycznej tożsamości do oszustw albo narzędzia do wydawania/obciążania bez jasnego zatwierdzenia przez człowieka. |
| Inwazyjne wobec prywatności wzbogacanie lub nadzór          | Pozyskiwanie kontaktów do spamu, doxxing, stalking, wyodrębnianie leadów połączone z niezamówionym kontaktem, ukryte monitorowanie, niedobrowolne dopasowywanie biometryczne albo użycie wyciekłych danych lub zrzutów z naruszeń. |
| Niedobrowolne podszywanie się lub manipulacja tożsamością   | Zamiana twarzy, cyfrowe bliźniaki, sklonowani influencerzy, fałszywe persony albo inne narzędzia używane do podszywania się lub wprowadzania w błąd. |
| Wyraźne treści seksualne lub generowanie treści dla dorosłych z wyłączonymi zabezpieczeniami | Generowanie obrazów, wideo lub treści NSFW; wrappery treści dla dorosłych wokół API podmiotów trzecich; albo wpisy, których podstawowym celem są wyraźne treści seksualne. |
| Ukryte, niebezpieczne lub wprowadzające w błąd wymagania wykonania | Zaciemnione polecenia instalacyjne, instalatory typu pipe-to-shell, takie jak pobrane treści uruchamiane za pomocą `sh` lub `bash` bez jasnej możliwości przeglądu, nieujawnione wymagania dotyczące sekretów lub kluczy prywatnych, zdalne wykonanie `npx @latest` bez jasnej możliwości przeglądu albo metadane ukrywające, czego wpis naprawdę potrzebuje do działania. |
| Materiały naruszające prawa autorskie lub inne prawa        | Ponowne publikowanie cudzych skill, pluginu, dokumentacji, zasobów marki lub kodu własnościowego bez pozwolenia; naruszanie warunków licencji; albo podszywanie się pod oryginalnego autora lub wydawcę. |

## Niedozwolone zachowanie w marketplace

ClawHub sprawdza również, jak wydawcy używają marketplace. Nie używaj ClawHub do
manipulowania odkrywaniem, metrykami, sygnałami zaufania, systemami moderacji ani
uwagą użytkowników.

Niedozwolone zachowanie w marketplace obejmuje:

- masowe publikowanie dużej liczby niskonakładowych, zduplikowanych, zastępczych lub
  wygenerowanych maszynowo wpisów, które nie wydają się mieć rzeczywistej wartości dla użytkowników
- zalewanie powierzchni wyszukiwania lub kategorii niemal identycznymi skills lub pluginami
- publikowanie setek wpisów z niewielkim użyciem lub bez użycia, utrzymania, jasności źródła
  albo znaczącego zróżnicowania
- sztuczne zawyżanie instalacji, pobrań, gwiazdek lub innych metryk zaangażowania
  przez automatyzację, pętle samodzielnej instalacji, fałszywe konta, skoordynowaną
  aktywność, płatne zaangażowanie lub inne nieorganiczne zachowanie
- tworzenie lub rotowanie kont w celu obejścia moderacji, blokad, limitów wydawcy lub
  przeglądu marketplace
- wprowadzanie użytkowników w błąd co do własności, źródła, możliwości, stanu bezpieczeństwa,
  wymagań instalacji lub powiązania z innym projektem bądź wydawcą
- wielokrotne przesyłanie treści, które zostały już ukryte, usunięte lub zablokowane
  bez naprawienia problemu źródłowego

Publikowanie dużego wolumenu nie jest automatycznie nadużyciem. Duże katalogi są akceptowalne,
gdy wpisy znacząco się różnią, są dokładnie opisane, utrzymywane
i używane przez prawdziwych użytkowników. Duże katalogi stają się problemem zaufania i bezpieczeństwa, gdy
wolumen łączy się z wpisami płytkimi, zduplikowanymi, wprowadzającymi w błąd, nieutrzymywanymi lub
sztucznie promowanymi.

## Prawa do treści

Jeśli uważasz, że treść w ClawHub narusza Twoje prawa autorskie lub inne prawa, użyj
[Żądań dotyczących praw do treści](/pl/clawhub/content-rights). Nie używaj zwykłych zgłoszeń marketplace
do roszczeń dotyczących praw autorskich lub innych praw, chyba że wpis jest również niebezpieczny,
złośliwy lub wprowadzający w błąd.

## Przegląd i egzekwowanie

ClawHub może używać automatycznych kontroli, statystycznych sygnałów nadużyć, zgłoszeń użytkowników i
przeglądu personelu, aby identyfikować niebezpieczne treści lub nadużycia w zachowaniach publikowania. Sygnał
sam w sobie nie dowodzi nadużycia; pomaga ClawHub zdecydować, co wymaga przeglądu.

Możemy:

- ukryć, wstrzymać, usunąć, miękko usunąć albo, tam gdzie jest to obsługiwane dla typu zasobu,
  trwale usunąć naruszające zasady wpisy
- blokować pobrania lub instalacje niebezpiecznych wydań
- unieważnić tokeny API
- miękko usunąć powiązane treści
- ograniczyć dostęp do publikowania
- zablokować sprawców powtarzających się lub poważnych naruszeń

Nie gwarantujemy egzekwowania zasad najpierw z ostrzeżeniem w przypadku oczywistych nadużyć. Zobacz
[Moderacja i bezpieczeństwo konta](/clawhub/moderation), aby uzyskać informacje o zgłoszeniach, wstrzymaniach moderacyjnych,
ukrytych wpisach, blokadach i statusie konta.
