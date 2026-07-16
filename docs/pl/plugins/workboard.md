---
read_when:
    - Potrzebna jest tablica robocza w stylu Kanban w interfejsie Control UI
    - Włączasz lub wyłączasz dołączony Plugin Workboard
    - Chcesz śledzić zaplanowaną pracę agenta bez zewnętrznego narzędzia do zarządzania projektami
summary: Opcjonalna tablica robocza pulpitu nawigacyjnego dla kart zarządzanych przez agentów i przekazywania sesji
title: Plugin Workboard
x-i18n:
    generated_at: "2026-07-16T18:52:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 607c6db4a7c038aa12b7db8f881635683871675bc6ef31686cc8b05853fb0701
    source_path: plugins/workboard.md
    workflow: 16
---

Plugin Workboard dodaje opcjonalną tablicę w stylu Kanban do
[interfejsu Control UI](/pl/web/control-ui): karty pracy o zakresie odpowiednim dla agenta, przypisywanie agentom
oraz łącze prowadzące do zadania, uruchomienia i sesji panelu powiązanych z kartą.

Workboard jest celowo niewielki: śledzi lokalne prace operacyjne dla jednego
Gateway OpenClaw. Nie zastępuje GitHub Issues, Linear, Jira ani
innych zespołowych systemów zarządzania projektami.

## Włączanie

Workboard jest dołączony, ale domyślnie wyłączony:

1. Otwórz **Pluginy** w interfejsie Control UI lub użyj `/settings/plugins` względem
   skonfigurowanej ścieżki bazowej interfejsu Control UI. Na przykład ścieżka bazowa `/openclaw`
   używa `/openclaw/settings/plugins`.
2. Znajdź **Workboard** i wybierz **Włącz**. Ponieważ Workboard jest dołączony do
   OpenClaw, nie wymaga działania **Zainstaluj**.
3. Jeśli interfejs zgłosi konieczność ponownego uruchomienia, uruchom ponownie Gateway.

Karta Workboard pojawia się w nawigacji panelu po załadowaniu środowiska uruchomieniowego pluginu.
Gdy jest wyłączona, pozostaje ukryta w nawigacji. Bezpośrednie otwarcie
trasy `/workboard`, gdy plugin jest wyłączony lub zablokowany przez
`plugins.allow`/`plugins.deny`, zamiast danych kart wyświetla stan
niedostępności pluginu.

Odpowiedni proces w CLI wygląda następująco:

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

## Konfiguracja

Workboard nie ma konfiguracji właściwej dla tego pluginu. Można go włączać i wyłączać za pomocą standardowego
wpisu pluginu:

```json5
{
  plugins: {
    entries: {
      workboard: {
        enabled: true,
        config: {},
      },
    },
  },
}
```

```bash
openclaw plugins disable workboard
openclaw gateway restart
```

## Pola karty

| Pole        | Wartości                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| `status`    | `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`                     |
| `priority`  | `low`, `normal`, `high`, `urgent`                                                                             |
| `labels`    | ciągi tekstowe o dowolnej postaci                                                                              |
| `agentId`   | opcjonalnie przypisany agent                                                                                   |
| powiązane odwołania | opcjonalne zadanie, uruchomienie, sesja lub adres URL źródła                                                   |
| `execution` | opcjonalne metadane uruchomienia Codex/Claude rozpoczętego z karty (silnik, tryb, model, sesja, identyfikator uruchomienia, stan) |

Karty zawierają również zwarte metadane dotyczące prób, komentarzy, łączy, dowodów,
artefaktów, ustawień automatyzacji, załączników, dzienników procesów roboczych, stanu protokołu
procesu roboczego, roszczeń, diagnostyki, powiadomień, identyfikatora szablonu, stanu archiwizacji i
wykrywania nieaktualnych sesji, a także listę ostatnich zdarzeń (`created`, `edited`,
`moved`, `linked`, `specified`, `decomposed`, `claimed`, `heartbeat`,
`execution_updated`, `attempt_started`, `attempt_updated`, `comment_added`,
`link_added`, `proof_added`, `artifact_added`, `attachment_added`,
`diagnostic`, `notification`, `dispatch`, `orchestration`,
`protocol_violation`, `archived`, `unarchived`, `stale`). Te metadane pozwalają
operatorowi sprawdzić, jak karta przemieszczała się po tablicy, bez otwierania powiązanej
sesji; stanowią lokalny kontekst operacyjny, a nie zamiennik transkrypcji
sesji ani historii zgłoszenia w GitHub.

Plugin i interfejs Control UI korzystają z jednego kontraktu karty Workboard. Odświeżanie panelu
zachowuje więc pochodzenie i uprawnienia przestrzeni roboczej, stan roszczenia, działania
diagnostyczne oraz numery sekwencyjne powiadomień, zamiast tworzyć mniejszą kopię karty
wyłącznie na potrzeby interfejsu. Nieznane rodzaje i poziomy ważności diagnostyki oraz
rodzaje powiadomień są ignorowane, dopóki obie warstwy nie zaczną ich obsługiwać; nigdy nie są
przekształcane w inny prawidłowy stan.

Otwarty panel aktualizuje się na podstawie unieważnień `plugin.workboard.changed`. Każde
zdarzenie zawiera wyłącznie epokę i rewizję magazynu; interfejs następnie ponownie odczytuje kanoniczne
karty za pomocą standardowego RPC `operator.read`. Wiele rewizji jest łączonych w
jeden kolejny odczyt. Workboard odracza ten odczyt podczas przeciągania,
edytowania lub zapisywania karty, a następnie wznawia go po zakończeniu lokalnej interakcji.
Ponowne połączenie zawsze powoduje kanoniczne przeładowanie. Nie odbywa się rutynowe odpytywanie
pełnych kart, a opcja **Odśwież** pozostaje dostępna do ręcznego odzyskiwania.

Gdy istnieje więcej niż jedna tablica, pasek narzędzi zawiera filtr **Tablica** oparty
na utrwalonych metadanych tablic, a nie tylko na aktualnie widocznych kartach. Dzięki temu puste
i zarchiwizowane tablice nadal można wybierać. Karty bez jawnego identyfikatora
tablicy należą do kanonicznej tablicy `default`. Wybrana tablica jest przechowywana
w parametrze zapytania `?board=`, dzięki czemu adres URL przefiltrowanego Workboard można dodać do zakładek
lub udostępnić; wybranie opcji **Wszystkie tablice** usuwa ten parametr.

Karty są przechowywane we własnym stanie Gateway pluginu i są przenoszone wraz z pozostałym
stanem OpenClaw tego Gateway (zobacz [Przechowywanie](#storage)).

## Rozpoczynanie pracy z karty

Niepowiązane karty mogą bezpośrednio rozpoczynać pracę:

- **Uruchom Codex** / **Uruchom Claude** rozpoczyna śledzone przez zadanie uruchomienie agenta z
  jawnym silnikiem, wysyła prompt karty i oznacza kartę jako `running`. Uruchomienia Codex
  używają `openai/gpt-5.6-sol`; uruchomienia Claude używają `anthropic/claude-sonnet-4-6`.
- **Otwórz Codex** / **Otwórz Claude** tworzy powiązaną sesję panelu bez
  wysyłania promptu karty ani przenoszenia karty, na potrzeby pracy ręcznej, która pozostaje
  powiązana z tablicą.

Uruchomienia autonomiczne korzystają ze ścieżki uruchamiania agentów śledzonej przez zadania w Gateway (domyślny agent
i model, chyba że jawnie wybrano Codex/Claude); Workboard następnie wiąże
wynikowe zadanie, identyfikator uruchomienia i klucz sesji z kartą. Każde powiązane
wykonanie zapisuje również podsumowanie próby (silnik, tryb, model, identyfikator uruchomienia,
znaczniki czasu, stan, krocząca liczba niepowodzeń), dzięki czemu powtarzające się niepowodzenia pozostają widoczne.

Panel odświeża stan zadania na podstawie rejestru zadań Gateway, dopasowując
zadania do kart według identyfikatora zadania, identyfikatora uruchomienia lub klucza powiązanej sesji. Zadanie oczekujące lub uruchomione
utrzymuje aktywny cykl życia karty; zadanie ukończone, zakończone niepowodzeniem, przekraczające limit czasu lub
anulowane przesuwa kartę w kierunku `review` lub `blocked` zgodnie z tą samą regułą
synchronizacji co powiązane sesje (zobacz [Synchronizacja cyklu życia sesji](#session-lifecycle-sync)).

## Narzędzia agenta

| Narzędzie                                                                                                                                         | Przeznaczenie                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | Wyświetla kompaktowe karty ze stanem przejęcia/diagnostyki; opcjonalny filtr tablicy.                                                                                                     |
| `workboard_read`                                                                                                                                 | Zwraca jedną kartę wraz z ograniczonym kontekstem procesu roboczego (notatki, próby, komentarze, odnośniki, dowody, artefakty, wyniki nadrzędne, ostatnia praca osoby przypisanej, aktywna diagnostyka). |
| `workboard_create`                                                                                                                               | Tworzy kartę z opcjonalnymi elementami nadrzędnymi, dzierżawcą, Skills, tablicą, metadanymi przestrzeni roboczej, kluczem idempotencji, limitem czasu działania i budżetem ponowień.         |
| `workboard_link`                                                                                                                                 | Łączy kartę nadrzędną z podrzędną. Elementy podrzędne pozostają w stanie `todo`, dopóki każdy element nadrzędny nie osiągnie stanu `done`; następnie promocja wysyłania przenosi je do stanu `ready`. |
| `workboard_claim`                                                                                                                                | Przejmuje kartę dla wywołującego agenta; przenosi `backlog`/`todo`/`ready` do `running`.                                                          |
| `workboard_heartbeat`                                                                                                                            | Odświeża Heartbeat przejęcia podczas dłuższego działania.                                                                                                                                |
| `workboard_release`                                                                                                                              | Zwalnia przejęcie po ukończeniu, wstrzymaniu lub przekazaniu; może przenieść kartę do następnego stanu.                                                                                   |
| `workboard_complete` / `workboard_block`                                                                                                         | Ustrukturyzowane narzędzia cyklu życia do podsumowań końcowych, dowodów, artefaktów i manifestów utworzonych kart (muszą odwoływać się do kart połączonych z ukończoną kartą) lub przyczyn blokady. |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | Przechowuje małe załączniki kart w stanie SQLite pluginu, indeksuje je na karcie i udostępnia w kontekście procesu roboczego.                                                             |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | Rejestruje wiersze dziennika procesu roboczego i blokuje kartę, gdy zautomatyzowany proces roboczy zatrzyma się bez wywołania `workboard_complete`/`workboard_block`.                       |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | Zarządza utrwalonymi metadanymi tablicy (nazwa wyświetlana, opis, stan archiwizacji, domyślna przestrzeń robocza).                                                                         |
| `workboard_runs`                                                                                                                                 | Zwraca utrwaloną historię prób uruchomienia karty.                                                                                                                                        |
| `workboard_specify`                                                                                                                              | Przekształca wstępną kartę selekcji/backlogu w doprecyzowaną kartę `todo`; zapisuje podsumowanie specyfikacji na karcie.                                                       |
| `workboard_decompose`                                                                                                                            | Rozdziela nadrzędną kartę orkiestracji na połączone elementy podrzędne, dziedziczące metadane tablicy/dzierżawcy; może ukończyć kartę nadrzędną z manifestem utworzonych kart.              |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | Zarządza subskrypcjami powiadomień. Odczyty zdarzeń można bezpiecznie powtarzać; `advance` przesuwa trwały kursor, dzięki czemu wywołujący wznawiają pracę bez utraty ani podwójnego odczytu zdarzeń ukończonych/nieudanych/nieaktualnych kart. |
| `workboard_boards` / `workboard_stats`                                                                                                           | Sprawdza przestrzenie nazw tablicy i statystyki kolejki.                                                                                                                                  |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | Odzyskuje lub przekazuje zablokowaną pracę.                                                                                                                                               |
| `workboard_comment` / `workboard_proof`                                                                                                          | Dodaje notatki dotyczące przekazania albo dołącza odwołania do dowodów/artefaktów.                                                                                                       |
| `workboard_unblock`                                                                                                                              | Przenosi zablokowaną pracę z powrotem do `todo`.                                                                                                                              |
| `workboard_move`                                                                                                                                 | Przenosi kartę do innego stanu; przejęte karty wymagają zakresu przejęcia agenta wywołującego.                                                                                            |
| `workboard_dispatch`                                                                                                                             | Wymusza promocję zależności lub czyszczenie nieaktualnych przejęć bez uruchamiania procesów roboczych; uruchamianie procesów roboczych wykorzystuje wysyłanie przez Gateway lub polecenie ukośnikowe. |

Przejęte karty odrzucają modyfikacje wykonywane narzędziami agentów przez inne
agenty, chyba że wywołujący ma token przejęcia zwrócony przez `workboard_claim`.
Każda karta zwrócona przez narzędzie agenta lub wywołanie RPC Gateway maskuje
`metadata.claim.token` jako `[redacted]` (sam token jest zwracany jednorazowo,
na najwyższym poziomie, wyłącznie przez `workboard_claim`), dzięki czemu
operatorzy pulpitu i inne agenty mogą sprawdzać stan przejęcia bez uzyskiwania
dostępu do użytecznego tokenu. Odzyskiwanie odbywa się przez
`workboard_promote`/`workboard_reassign`/`workboard_reclaim`, które nie wymagają
tokenu.

## Wysyłanie

Wysyłanie odbywa się lokalnie w Gateway: nie uruchamia dowolnych procesów
systemu operacyjnego. Za wykonywanie nadal odpowiadają zwykłe sesje podagentów
OpenClaw. Jeden przebieg wysyłania:

1. Promuje karty z gotowymi zależnościami.
2. Zapisuje metadane wysyłania na gotowych kartach.
3. Blokuje wygasłe przejęcia lub uruchomienia, które przekroczyły limit czasu.
4. Oznacza skonfigurowane na tablicy karty selekcji jako kandydatów do orkiestracji.
5. Przejmuje małą partię gotowych kart i uruchamia procesy robocze za pośrednictwem
   środowiska wykonawczego podagentów Gateway.

Procesy robocze otrzymują ograniczony kontekst karty oraz token przejęcia
potrzebny do wysyłania Heartbeat, ukończenia lub zablokowania karty za pomocą
narzędzi Workboard.

Ścieżki przestrzeni roboczych podlegają istniejącym uprawnieniom wywołującego
do systemu plików. Klienci Gateway z `operator.write` mogą korzystać ze
skonfigurowanych przestrzeni roboczych agentów; klienci `operator.admin` mogą
korzystać z innych kopii roboczych na hoście. Narzędzia agentów działające w
piaskownicy korzystają z dostępu do przestrzeni roboczej swojej piaskownicy,
natomiast narzędzia ograniczone do przestrzeni roboczej, lecz działające poza
piaskownicą, korzystają ze skonfigurowanego katalogu głównego przestrzeni
roboczej. Workboard zapisuje te uprawnienia podczas przypisywania przestrzeni
roboczej i przy wysyłaniu ponownie wyznacza ich część wspólną z bieżącymi
uprawnieniami wywołującego, aby utrwalona karta nie mogła rozszerzyć dostępu
późniejszego wywołującego. W przypadku starszych kart z jawną przestrzenią
roboczą hosta, lecz bez zapisanych uprawnień, należy ponownie zapisać tę
przestrzeń roboczą przed wysłaniem z pełnym dostępem do hosta; karty bez ścieżki
hosta przyjmują uprawnienia bieżącego wywołującego podczas pierwszego wysłania.

Wysyłanie powiązane z przestrzenią roboczą akceptuje katalog lub kopię roboczą
Git tylko wtedy, gdy katalog główny repozytorium dokładnie odpowiada docelowej
przestrzeni roboczej agenta. Żądanie drzewa roboczego jest zawężane do tego
katalogu i utrwalane jako katalogowa przestrzeń robocza, dzięki czemu host nie
materializuje kopii roboczej ani nie wykonuje kodu konfigurującego repozytorium.
Docelowy proces roboczy musi korzystać z zapisywalnej, niewspółdzielonej
piaskownicy Docker dla dokładnie tej przestrzeni roboczej, bez wykonywania z
podwyższonymi uprawnieniami, utrwalonych nadpisań wykonywania na hoście/Node ani
niesklasyfikowanych narzędzi pluginów i MCP. Workboard wylicza zarejestrowane
narzędzia zamiast ufać prefiksowi `workboard_*`, a wysyłanie odrzuca aktywny
kontener Docker, którego bieżący skrót montowania/konfiguracji jest nieaktualny.
Zamiast uruchamiać słabiej odizolowany proces roboczy wysyłanie zgłasza
niezgodne zasady docelowe. Wysyłanie z pełnym dostępem do hosta może kierować
pracę do innych lokalnych kopii roboczych i zachowuje zwykłą konfigurację
zarządzanego drzewa roboczego.

Uprawnienia przestrzeni roboczej nie tworzą drugiego modelu uprawnień cyklu
życia kart. Wywołujący, którzy mogą modyfikować karty Workboard, mogą ręcznie
przenosić je przez te same stany na każdej powierzchni; dostęp tylko do odczytu
przestrzeni roboczej uniemożliwia jedynie wysyłanie procesu roboczego wymagające
zapisu.

### Wybór procesu roboczego

Każdy przebieg domyślnie uruchamia **najwyżej 3 procesy robocze**. Gotowe karty
są uporządkowane najpierw według priorytetu, następnie pozycji, a potem czasu
utworzenia. Przebieg uruchamia tylko jedną kartę na właściciela/agenta i pomija
właścicieli, którzy mają już na tablicy pracę uruchomioną lub w trakcie
przeglądu. Zarchiwizowane karty, karty z aktywnym przejęciem oraz karty, które
nie mają stanu `ready`, nigdy nie są wybierane do uruchomienia
procesów roboczych (nadal może na nie wpływać część wysyłania dotycząca danych:
czyszczenie nieaktualnych przejęć, promocja zależności, czyszczenie po
przekroczeniu limitu czasu).

Klucze sesji są deterministyczne dla każdej tablicy/karty, dlatego powtarzane
wysyłanie kieruje pracę z powrotem do tej samej ścieżki procesu roboczego,
zamiast tworzyć niepowiązane sesje:

- Przypisane karty: `agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- Nieprzypisane karty: `subagent:workboard-<boardId>-<cardId>` (Gateway rozpoznaje
  skonfigurowanego domyślnego agenta)

Jeśli po przejęciu karty nie można uruchomić procesu roboczego, Workboard
blokuje kartę, usuwa przejęcie, zapisuje błąd uruchomienia i dodaje wiersz
dziennika procesu roboczego — widoczny na pulpicie, w danych JSON CLI,
narzędziach agentów i diagnostyce karty.

### Punkty wejścia

- Akcja wysyłania z pulpitu
- `openclaw workboard dispatch`
- `/workboard dispatch` na kanale obsługującym polecenia

Wszystkie trzy korzystają ze środowiska uruchomieniowego podagentów Gateway, gdy Gateway jest dostępny. CLI ma jeden mechanizm awaryjny dla operatora: jeśli wywołanie Gateway zakończy się błędem połączenia/niedostępności (lub błędem `unknown method` w przypadku starszych wersji Gateway), a nie podano jawnego celu `--url`/`--token` ani nie skonfigurowano zdalnego Gateway (`OPENCLAW_GATEWAY_URL` lub `gateway.mode: remote`), CLI wykonuje wysyłanie wyłącznie danych na podstawie lokalnego stanu SQLite — może promować zależności, usuwać nieaktualne zgłoszenia i blokować wykonania po przekroczeniu limitu czasu, ale nie może uruchamiać procesów roboczych. Błędy uwierzytelniania, uprawnień i walidacji pochodzące z osiągalnego Gateway nie są traktowane jako niedostępność; są zgłaszane jako błędy polecenia, podobnie jak każda awaria Gateway, gdy podano jawny cel `--url`/`--token`.

Metadane tablicy mogą ustawiać `autoDecompose`, `autoDecomposePerDispatch`, `defaultAssignee` i `orchestratorProfile`. OpenClaw rejestruje tę intencję i udostępnia ją w kontekście procesu roboczego; właściwa specyfikacja/dekompozycja nadal odbywa się za pomocą standardowych narzędzi Workboard.

## CLI i polecenie z ukośnikiem

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Napraw cykl życia nieaktualnej karty" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard move <card-id> --status <status> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

Dane wyjściowe tekstowe `list` domyślnie ukrywają zarchiwizowane karty (`--include-archived` to zastępuje); `--json` zawsze uwzględnia zarchiwizowane karty, zgodnie z kontraktem pełnej karty używanym przez istniejące skrypty. `show` i `move` przyjmują jednoznaczny prefiks identyfikatora. `list`, `create`, `show` i `move` zawsze bezpośrednio odczytują/zapisują lokalny stan pluginu. Tylko `dispatch` wywołuje działający Gateway, korzystając z opisanego powyżej mechanizmu awaryjnego.

Pełny opis flag, danych wyjściowych JSON, awaryjnego działania Gateway, obsługi prefiksów identyfikatorów, reguł wyboru wysyłania oraz rozwiązywania problemów zawiera dokumentacja [CLI Workboard](/pl/cli/workboard).

`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>`, `/workboard move <card-id> --status <status>` i `/workboard dispatch` odpowiadają funkcjom CLI. Wyświetlanie listy i szczegółów to operacje odczytu dostępne dla każdego autoryzowanego nadawcy poleceń. Tworzenie, przenoszenie i wysyłanie wymagają statusu właściciela w interfejsach czatu albo klienta Gateway z `operator.write`/`operator.admin`. Ręczne przeniesienia wykonywane przez operatora korzystają z takiego samego zachowania zastępowania zgłoszenia jak przeciąganie i upuszczanie na pulpicie. Dostęp do drzewa roboczego nadal podlega tej samej granicy przestrzeni roboczej opisanej powyżej.

## Synchronizacja cyklu życia sesji

Karty można połączyć z istniejącą sesją pulpitu lub z sesją utworzoną podczas rozpoczynania pracy z poziomu karty. Połączone karty pokazują cykl życia sesji bezpośrednio w interfejsie: w toku, nieaktualna, połączona i bezczynna, ukończona, zakończona niepowodzeniem lub brakująca. Istniejącą sesję można również przechwycić z karty Sessions za pomocą **Add to Workboard**; karta zostanie połączona z tą sesją, użyje etykiety sesji lub ostatniego monitu użytkownika jako tytułu oraz wstępnie wypełni notatki ostatnim monitem użytkownika i najnowszą odpowiedzią asystenta, jeśli są dostępne.

Jeśli połączona sesja zniknie, karta pozostanie połączona w celu zachowania kontekstu i nadal będzie udostępniać elementy sterujące umożliwiające ponowne uruchomienie w nowej sesji. Jeśli aktywna połączona sesja przestanie zgłaszać niedawną aktywność, Workboard oznaczy kartę jako `stale` i zachowa to w metadanych, dopóki cykl życia nie usunie tego oznaczenia.

Gdy karta znajduje się w aktywnym stanie pracy, Workboard śledzi połączoną sesję:

| Stan połączonej sesji                 | Status karty |
| ------------------------------------- | ----------- |
| aktywna                               | `running`   |
| ukończona                             | `review`    |
| zakończona niepowodzeniem, zabita, po przekroczeniu limitu czasu lub przerwana | `blocked`   |

**Ręczne stany przeglądu mają pierwszeństwo.** Przeniesienie karty do `review`, `blocked` lub `done` zatrzymuje jej automatyczną synchronizację, dopóki nie zostanie przeniesiona z powrotem do `todo` lub `running`.

Uruchomienie karty korzysta ze standardowych sesji Gateway; Workboard przechowuje tylko metadane i powiązania karty. Transkrypcja rozmowy, wybór modelu i cykl życia wykonania pozostają własnością standardowego systemu sesji. Aby przerwać aktywne wykonanie, należy użyć **Stop** na aktywnej połączonej karcie — Workboard oznaczy tę kartę jako `blocked`, dzięki czemu pozostanie widoczna do dalszej obsługi.

Nowe karty można tworzyć na podstawie szablonów Workboard (`bugfix`, `docs`, `release`, `pr_review`, `plugin`). Szablony wstępnie wypełniają tytuł, notatki, etykiety i priorytet; identyfikator szablonu jest przechowywany jako metadane karty.

## Przepływ pracy na pulpicie

1. Otwórz kartę Workboard w Control UI.
2. Utwórz kartę z tytułem, notatkami, priorytetem, etykietami, opcjonalnym agentem i opcjonalnie połączoną sesją — albo otwórz Sessions i wybierz **Add to Workboard** dla istniejącej sesji.
3. Przeciągnij kartę między kolumnami albo ustaw fokus na jej kompaktowym elemencie sterującym statusem i użyj menu lub ArrowLeft/ArrowRight. Podczas przeciągania karta źródłowa jest przyciemniana, a dostępne kolumny docelowe otrzymują obramowanie.
4. Rozpocznij pracę z poziomu karty, aby utworzyć sesję pulpitu lub ponownie jej użyć.
5. Otwórz połączoną sesję z poziomu karty, gdy agent pracuje.
6. Pozwól, aby synchronizacja cyklu życia przeniosła trwającą pracę do `review`/`blocked`, a następnie po zaakceptowaniu ręcznie przenieś kartę do `done`.

## Diagnostyka

Diagnostyka jest obliczana na podstawie lokalnych metadanych kart. Wbudowane kontrole oznaczają:

| Rodzaj                      | Warunek                                                                        |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`          | Przypisana karta `todo`/`backlog`/`ready` nie była aktualizowana przez ponad 1 godzinę. |
| `running_without_heartbeat`          | Karta `running` bez Heartbeat zgłoszenia ani aktualizacji wykonania przez ponad 20 minut. |
| `blocked_too_long`          | Karta `blocked` nie była aktualizowana przez ponad 24 godziny.        |
| `repeated_failures`          | Śledzona liczba niepowodzeń karty osiągnęła 2 lub więcej.                      |
| `missing_proof`          | Karta `done` bez dowodu, artefaktów ani załączników.               |
| `orphaned_session`          | Karta `running` z `sessionKey`, ale bez metadanych `execution`. |

## Uprawnienia

Metody RPC Gateway znajdują się w przestrzeni `workboard.*`:

| Zakres           | Metody                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`, `cards.export`, `cards.diagnostics`, wyświetlanie/pobieranie załączników, odczyt zdarzeń powiadomień, `boards.list`, `cards.stats`, `cards.runs`                                                                                                                                                                                                 |
| `operator.write` | `cards.diagnostics.refresh`, tworzenie/aktualizowanie/przenoszenie/usuwanie/komentowanie/łączenie/linkDependency/dowód/artefakt, dodawanie/usuwanie załączników, dziennik procesu roboczego, naruszenie protokołu, zgłoszenie/Heartbeat/zwolnienie/promowanie/ponowne przypisanie/ponowne zgłoszenie/ukończenie/blokowanie/odblokowanie, `cards.dispatch`, `cards.bulk`, archiwizowanie, `boards.upsert`/`archive`/`delete`, `cards.specify`/`decompose`, subskrybowanie/usuwanie/przesuwanie powiadomień |

Żadna metoda RPC nie wymaga `operator.admin`. Przeglądarki połączone z dostępem operatora tylko do odczytu mogą przeglądać tablicę, ale nie mogą modyfikować kart. Zakres administratora rozszerza akceptowane ścieżki hosta Workboard; nie zmienia dostępnych metod.

## Przechowywanie

Workboard przechowuje trwałe dane we własnej relacyjnej bazie danych SQLite pluginu w katalogu stanu OpenClaw: tablice, karty, etykiety, zdarzenia cyklu życia, próby wykonania, komentarze, powiązania zależności, dowody, odwołania do artefaktów, metadane i obiekty binarne załączników, dane diagnostyczne, powiadomienia, dzienniki procesów roboczych, stan protokołu i subskrypcje znajdują się w tabelach Workboard (a nie we wpisach klucz-wartość pluginu). Eksport karty zachowuje narrację tablicy bez osadzania zawartości obiektów binarnych załączników.

Instalacje, które korzystały z Workboard w wydaniu `.28`, mogą uruchomić `openclaw doctor --fix`, aby przeprowadzić migrację dostarczonych starszych przestrzeni nazw stanu pluginu (`workboard.cards`, `workboard.boards`, `workboard.notify` oraz, jeśli istnieje, `workboard.attachments`) do relacyjnej bazy danych.

## Rozwiązywanie problemów

**Karta informuje, że Workboard jest niedostępny**

```bash
openclaw plugins inspect workboard --runtime --json
```

Jeśli skonfigurowano `plugins.allow`, należy dodać do niego `workboard`. Jeśli `plugins.deny` zawiera `workboard`, należy usunąć ten wpis przed włączeniem pluginu.

**Karty nie są zapisywane**

Należy potwierdzić, że połączenie przeglądarki ma dostęp `operator.write`. Sesje operatora tylko do odczytu mogą wyświetlać karty, ale nie mogą ich tworzyć, edytować, przenosić ani usuwać.

**Uruchomienie karty nie otwiera oczekiwanej sesji**

Należy sprawdzić identyfikator agenta i połączoną sesję karty, a następnie otworzyć Sessions lub Chat, aby sprawdzić rzeczywisty stan wykonania.

**Wysłanie nie uruchamia procesu roboczego**

Należy potwierdzić, że istnieje co najmniej jedna karta `ready` bez aktywnego zgłoszenia:

```bash
openclaw workboard list --status ready
```

Jeśli CLI zgłasza wysyłanie wyłącznie danych, należy uruchomić lub ponownie uruchomić Gateway i spróbować ponownie — wysyłanie wyłącznie danych aktualizuje lokalny stan tablicy, ale nie może uruchamiać podagentów roboczych. Karty mogą być również pomijane, gdy inna karta tego samego właściciela lub agenta jest już uruchomiona albo oczekuje na przegląd; przed wysłaniem kolejnych zadań dla tego samego właściciela należy ukończyć, zablokować lub zwolnić tę aktywną pracę.

## Powiązane materiały

- [Control UI](/pl/web/control-ui)
- [CLI Workboard](/pl/cli/workboard)
- [Pluginy](/pl/tools/plugin)
- [Zarządzanie pluginami](/pl/plugins/manage-plugins)
- [Sesje](/pl/concepts/session)
