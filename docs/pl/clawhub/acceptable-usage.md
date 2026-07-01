---
read_when:
    - Sprawdzanie przesłanych plików pod kątem nadużyć lub naruszeń zasad
    - Pisanie dokumentacji moderacji lub podręczników dla recenzentów
    - Decydowanie, czy Skills powinien zostać ukryty, czy użytkownik zbanowany
sidebarTitle: Acceptable Usage
summary: 'Zasady platformy: co ClawHub dopuszcza i czego nie będzie udostępniać.'
title: Dopuszczalne użycie
x-i18n:
    generated_at: "2026-07-01T13:22:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Dopuszczalne użycie

ClawHub hostuje Skills, pluginy, pakiety i metadane marketplace dla OpenClaw.
Użyj tej strony, aby zdecydować, czy treść lub zachowanie publikowania powinny
znajdować się w ClawHub.

Te zasady dotyczą tego, co robi wpis, o uruchomienie czego prosi użytkowników,
jak przedstawia sam siebie oraz jak wydawcy używają powierzchni odkrywania,
instalacji i zaufania ClawHub. Stany moderacji i status konta opisuje
[Moderacja i bezpieczeństwo konta](/clawhub/moderation). Roszczenia dotyczące
praw autorskich lub innych praw opisują [Żądania dotyczące praw do treści](/pl/clawhub/content-rights).

## Dozwolone treści

ClawHub przyjmuje treści, które są użyteczne, zrozumiałe i publikowane w dobrej
wierze.

| Kategoria                                         | Dozwolone, gdy                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produktywność deweloperska                           | Wpis pomaga użytkownikom budować, testować, migrować, debugować, dokumentować lub obsługiwać oprogramowanie.                                               |
| Przepływy pracy UI, danych i automatyzacji               | Zakres jest jasny, wymagane dane uwierzytelniające są wyraźnie wskazane, a ryzykowne działania obejmują ścieżki przeglądu, próbnego uruchomienia, podglądu lub potwierdzenia. |
| Bezpieczeństwo defensywne, moderacja i przegląd nadużyć | Narzędzie jest przedstawione jako przeznaczone do autoryzowanego przeglądu, zachowuje dowody i jasno określa granice zatwierdzenia przez człowieka.                          |
| Osobiste lub zespołowe przepływy pracy                       | Przepływ pracy używa kont opartych na zgodzie, przejrzystej konfiguracji i wyraźnych uprawnień.                                            |
| Utrzymywane katalogi                              | Każdy wpis jest odrębny, użyteczny, dokładnie opisany i rozsądnie utrzymywany.                                                |

Kontekst ma znaczenie. Ten sam temat może być akceptowalny w wąskim ustawieniu
defensywnym lub opartym na zgodzie, a niedopuszczalny, gdy jest opakowany jako
przepływ pracy służący do nadużyć.

## Niedozwolone treści

ClawHub nie hostuje treści, których głównym celem są nadużycia, oszustwo,
niebezpieczne wykonywanie lub naruszenie praw.

| Kategoria                                                    | Niedozwolone                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nieautoryzowany dostęp lub obejście zabezpieczeń                      | Obejście uwierzytelniania, przejęcie konta, nadużycie limitów szybkości, przejęcie połączenia na żywo lub agenta, kradzież sesji wielokrotnego użytku albo automatyczne zatwierdzanie przepływów parowania dla niezatwierdzonych użytkowników.                                                                                                                                                   |
| Nadużycia platformy i omijanie blokad                              | Ukryte konta po blokadach, rozgrzewanie lub farmienie kont, fałszywe zaangażowanie, automatyzacja wielu kont, masowe publikowanie, boty spamujące albo automatyzacja zbudowana w celu uniknięcia wykrycia.                                                                                                                                          |
| Oszustwa, wyłudzenia i zwodnicze przepływy finansowe             | Fałszywe certyfikaty lub faktury, zwodnicze przepływy płatności, kontaktowanie się w celu oszustwa, fałszywe dowody społeczne, przepływy pracy syntetycznej tożsamości do oszustw albo narzędzia do wydawania lub obciążania bez jasnego zatwierdzenia przez człowieka.                                                                                                                    |
| Inwazyjne wobec prywatności wzbogacanie danych lub nadzór                 | Pozyskiwanie kontaktów do spamu, doxxing, stalking, pozyskiwanie leadów połączone z niezamówionym kontaktem, potajemne monitorowanie, biometryczne dopasowywanie bez zgody albo używanie wyciekłych danych lub zrzutów po naruszeniach.                                                                                                                  |
| Podszywanie się lub manipulacja tożsamością bez zgody       | Podmiana twarzy, cyfrowe bliźniaki, klonowani influencerzy, fałszywe persony albo inne narzędzia używane do podszywania się lub wprowadzania w błąd.                                                                                                                                                                                                 |
| Jawne treści seksualne lub generowanie treści dla dorosłych z wyłączonymi zabezpieczeniami | Generowanie obrazów, wideo lub treści NSFW; wrappery treści dla dorosłych wokół API firm trzecich; albo wpisy, których głównym celem są jawne treści seksualne.                                                                                                                                                       |
| Ukryte, niebezpieczne lub wprowadzające w błąd wymagania wykonania        | Zaciemnione polecenia instalacji, instalatory typu potok-do-powłoki, takie jak pobrane treści uruchamiane z `sh` lub `bash` bez jasnej możliwości przeglądu, niezadeklarowane wymagania dotyczące sekretów lub kluczy prywatnych, zdalne wykonanie `npx @latest` bez jasnej możliwości przeglądu albo metadane ukrywające, czego wpis naprawdę potrzebuje do działania. |
| Materiały naruszające prawa autorskie lub inne prawa           | Ponowne publikowanie cudzej umiejętności, pluginu, dokumentacji, zasobów marki lub kodu własnościowego bez pozwolenia; naruszanie warunków licencji; albo podszywanie się pod pierwotnego autora lub wydawcę.                                                                                                                            |

## Niedozwolone zachowania marketplace

ClawHub sprawdza również, jak wydawcy korzystają z marketplace. Nie używaj
ClawHub do manipulowania odkrywaniem, metrykami, sygnałami zaufania, systemami
moderacji ani uwagą użytkowników.

Niedozwolone zachowania marketplace obejmują:

- masowe publikowanie dużej liczby niskonakładowych, powielonych,
  zastępczych lub generowanych maszynowo wpisów, które nie wydają się mieć
  realnej wartości dla użytkowników
- zalewanie powierzchni wyszukiwania lub kategorii prawie identycznymi Skills
  lub pluginami
- publikowanie setek wpisów z niewielkim lub żadnym użyciem, utrzymaniem,
  jasnością źródła albo znaczącym zróżnicowaniem
- sztuczne zawyżanie instalacji, pobrań, gwiazdek lub innych metryk
  zaangażowania za pomocą automatyzacji, pętli samodzielnej instalacji,
  fałszywych kont, skoordynowanej aktywności, płatnego zaangażowania albo
  innych nieorganicznych zachowań
- tworzenie lub rotowanie kont w celu omijania moderacji, blokad, limitów
  wydawcy albo przeglądu marketplace
- wprowadzanie użytkowników w błąd co do własności, źródła, możliwości, stanu
  bezpieczeństwa, wymagań instalacji albo powiązania z innym projektem lub
  wydawcą
- wielokrotne przesyłanie treści, które zostały już ukryte, usunięte lub
  zablokowane, bez naprawienia podstawowego problemu

Publikowanie na dużą skalę nie jest automatycznie nadużyciem. Duże katalogi są
akceptowalne, gdy wpisy są znacząco różne, dokładnie opisane, utrzymywane i
używane przez prawdziwych użytkowników. Duże katalogi stają się problemem
zaufania i bezpieczeństwa, gdy wolumen łączy się z wpisami płytkimi,
powielonymi, wprowadzającymi w błąd, nieutrzymywanymi lub sztucznie
promowanymi.

## Prawa do treści

Jeśli uważasz, że treść w ClawHub narusza Twoje prawa autorskie lub inne prawa,
użyj [Żądań dotyczących praw do treści](/pl/clawhub/content-rights). Nie używaj
zwykłych zgłoszeń marketplace do roszczeń dotyczących praw autorskich lub praw,
chyba że wpis jest również niebezpieczny, złośliwy lub wprowadzający w błąd.

## Przegląd i egzekwowanie

ClawHub może używać automatycznych kontroli, statystycznych sygnałów nadużyć,
zgłoszeń użytkowników i przeglądu przez personel, aby identyfikować
niebezpieczne treści lub nadużycia w publikowaniu. Sygnał sam w sobie nie
dowodzi nadużycia; pomaga ClawHub zdecydować, co wymaga przeglądu.

Możemy:

- ukrywać, wstrzymywać, usuwać, usuwać miękko albo, gdy typ zasobu to obsługuje,
  usuwać trwale naruszające zasady wpisy
- blokować pobieranie lub instalację niebezpiecznych wydań
- unieważniać tokeny API
- usuwać miękko powiązane treści
- ograniczać dostęp do publikowania
- blokować powtarzających się lub poważnych naruszycieli

Nie gwarantujemy egzekwowania zaczynającego się od ostrzeżenia w przypadku
oczywistych nadużyć. Zobacz [Moderację i bezpieczeństwo konta](/clawhub/moderation),
aby uzyskać informacje o zgłoszeniach, wstrzymaniach moderacyjnych, ukrytych
wpisach, blokadach i statusie konta.
