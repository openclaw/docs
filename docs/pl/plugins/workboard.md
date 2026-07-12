---
read_when:
    - Chcesz tablicę zadań w stylu Kanban w interfejsie sterowania
    - Włączasz lub wyłączasz dołączony Plugin Workboard
    - Chcesz śledzić zaplanowaną pracę agenta bez zewnętrznego narzędzia do zarządzania projektami
summary: Opcjonalna tablica robocza panelu dla kart zarządzanych przez agentów i przekazywania sesji
title: Plugin tablicy roboczej
x-i18n:
    generated_at: "2026-07-12T15:30:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b647fa702f629c26335d301899edfab3104f0a5cb6995e646901845d7ad4357f
    source_path: plugins/workboard.md
    workflow: 16
---

Plugin Workboard dodaje opcjonalną tablicę w stylu Kanban do
[interfejsu Control UI](/pl/web/control-ui): karty pracy dostosowane do agentów, przypisywanie ich agentom
oraz odnośnik do zadania, uruchomienia i sesji panelu powiązanych z kartą.

Workboard jest celowo niewielki: śledzi lokalne prace operacyjne dla jednego
Gateway OpenClaw. Nie zastępuje GitHub Issues, Linear, Jira ani
innych zespołowych systemów zarządzania projektami.

## Włączanie

Workboard jest dołączony, ale domyślnie wyłączony:

1. Otwórz **Pluginy** w interfejsie Control UI lub użyj `/settings/plugins` względem
   skonfigurowanej ścieżki bazowej interfejsu Control UI. Na przykład dla ścieżki bazowej `/openclaw`
   należy użyć `/openclaw/settings/plugins`.
2. Znajdź **Workboard** i wybierz **Włącz**. Ponieważ Workboard jest dołączony do
   OpenClaw, nie wymaga działania **Zainstaluj**.
3. Jeśli interfejs poinformuje, że wymagane jest ponowne uruchomienie, uruchom ponownie Gateway.

Karta Workboard pojawi się w nawigacji panelu po załadowaniu środowiska uruchomieniowego pluginu.
Gdy plugin jest wyłączony, karta pozostaje ukryta w nawigacji. Bezpośrednie otwarcie
trasy `/workboard`, gdy plugin jest wyłączony lub zablokowany przez
`plugins.allow`/`plugins.deny`, powoduje wyświetlenie stanu niedostępności pluginu zamiast danych
kart.

Odpowiedni przepływ pracy w CLI wygląda następująco:

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

## Pola kart

| Pole        | Wartości                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| `status`    | `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`                     |
| `priority`  | `low`, `normal`, `high`, `urgent`                                                                             |
| `labels`    | dowolne ciągi znaków                                                                                          |
| `agentId`   | opcjonalnie przypisany agent                                                                                  |
| powiązane odwołania | opcjonalne zadanie, uruchomienie, sesja lub źródłowy adres URL                                         |
| `execution` | opcjonalne metadane uruchomienia Codex/Claude rozpoczętego z karty (silnik, tryb, model, sesja, identyfikator uruchomienia, stan) |

Karty zawierają także zwięzłe metadane dotyczące prób, komentarzy, odnośników, dowodów,
artefaktów, ustawień automatyzacji, załączników, dzienników procesów roboczych, stanu protokołu
procesu roboczego, przejęć, diagnostyki, powiadomień, identyfikatora szablonu, stanu archiwizacji i
wykrywania nieaktualnych sesji, a także listę ostatnich zdarzeń (`created`, `edited`,
`moved`, `linked`, `specified`, `decomposed`, `claimed`, `heartbeat`,
`execution_updated`, `attempt_started`, `attempt_updated`, `comment_added`,
`link_added`, `proof_added`, `artifact_added`, `attachment_added`,
`diagnostic`, `notification`, `dispatch`, `orchestration`,
`protocol_violation`, `archived`, `unarchived`, `stale`). Te metadane pozwalają
operatorowi zobaczyć, jak karta przemieszczała się po tablicy, bez otwierania powiązanej
sesji. Stanowią lokalny kontekst operacyjny, a nie zamiennik transkrypcji
sesji ani historii zgłoszeń GitHub.

Karty są przechowywane we własnym stanie Gateway pluginu i są przenoszone wraz z pozostałym
stanem OpenClaw tego Gateway (zobacz [Przechowywanie](#storage)).

## Rozpoczynanie pracy z karty

Niepowiązane karty mogą bezpośrednio rozpoczynać pracę:

- **Uruchom Codex** / **Uruchom Claude** rozpoczyna śledzone przez zadanie uruchomienie agenta z
  jawnie określonym silnikiem, wysyła polecenie z karty i oznacza kartę jako `running`. Uruchomienia Codex
  używają `openai/gpt-5.6-sol`, a uruchomienia Claude używają `anthropic/claude-sonnet-4-6`.
- **Otwórz Codex** / **Otwórz Claude** tworzy powiązaną sesję panelu bez
  wysyłania polecenia z karty ani przenoszenia karty, na potrzeby pracy ręcznej, która pozostaje
  powiązana z tablicą.

Autonomiczne uruchomienia używają ścieżki uruchamiania agenta śledzonej przez zadania w Gateway (domyślny agent
i model, chyba że wyraźnie wybrano Codex lub Claude); Workboard następnie wiąże
wynikowe zadanie, identyfikator uruchomienia i klucz sesji z kartą. Każde powiązane
wykonanie zapisuje również podsumowanie próby (silnik, tryb, model, identyfikator uruchomienia,
znaczniki czasu, stan, bieżąca liczba niepowodzeń), dzięki czemu powtarzające się niepowodzenia pozostają widoczne.

Panel odświeża stan zadania na podstawie rejestru zadań Gateway, dopasowując
zadania do kart według identyfikatora zadania, identyfikatora uruchomienia lub klucza powiązanej sesji. Zadanie w kolejce lub w trakcie wykonywania
utrzymuje aktywny cykl życia karty; zadanie zakończone powodzeniem, niepowodzeniem, przekroczeniem limitu czasu lub
anulowane przenosi kartę do stanu `review` albo `blocked` zgodnie z tą samą regułą synchronizacji
co powiązane sesje (zobacz [Synchronizacja cyklu życia sesji](#session-lifecycle-sync)).

## Narzędzia agenta

| Narzędzie                                                                                                                                       | Przeznaczenie                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | Wyświetla zwięzłe karty ze stanem przejęcia i diagnostyki; opcjonalny filtr tablicy.                                                                                                                  |
| `workboard_read`                                                                                                                                 | Zwraca jedną kartę wraz z ograniczonym kontekstem wykonawcy (notatki, próby, komentarze, linki, dowody, artefakty, wyniki kart nadrzędnych, ostatnie prace przypisanego wykonawcy, aktywna diagnostyka). |
| `workboard_create`                                                                                                                               | Tworzy kartę z opcjonalnymi kartami nadrzędnymi, dzierżawcą, Skills, tablicą, metadanymi obszaru roboczego, kluczem idempotencji, limitem czasu wykonania i budżetem ponowień.                          |
| `workboard_link`                                                                                                                                 | Łączy kartę nadrzędną z podrzędną. Karty podrzędne pozostają w stanie `todo`, dopóki każda karta nadrzędna nie osiągnie stanu `done`; następnie promocja przy rozdzielaniu przenosi je do `ready`.      |
| `workboard_claim`                                                                                                                                | Przejmuje kartę dla wywołującego agenta; przenosi ją ze stanu `backlog`/`todo`/`ready` do `running`.                                                                                                  |
| `workboard_heartbeat`                                                                                                                            | Odświeża Heartbeat przejęcia podczas dłuższego wykonania.                                                                                                                                             |
| `workboard_release`                                                                                                                              | Zwalnia przejęcie po ukończeniu, wstrzymaniu lub przekazaniu; może przenieść kartę do następnego stanu.                                                                                               |
| `workboard_complete` / `workboard_block`                                                                                                         | Ustrukturyzowane narzędzia cyklu życia do końcowych podsumowań, dowodów, artefaktów i manifestów utworzonych kart (muszą wskazywać karty połączone z ukończoną kartą) albo powodów zablokowania.        |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | Przechowuje małe załączniki kart w stanie SQLite pluginu, indeksuje je na karcie i udostępnia w kontekście wykonawcy.                                                                                  |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | Rejestruje wiersze dziennika wykonawcy i blokuje kartę, gdy zautomatyzowany wykonawca zatrzyma się bez wywołania `workboard_complete`/`workboard_block`.                                                |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | Zarządza utrwalonymi metadanymi tablicy (nazwa wyświetlana, opis, stan archiwizacji, domyślny obszar roboczy).                                                                                         |
| `workboard_runs`                                                                                                                                 | Zwraca utrwaloną historię prób wykonania karty.                                                                                                                                                       |
| `workboard_specify`                                                                                                                              | Przekształca wstępną kartę selekcji/backlogu w doprecyzowaną kartę `todo`; zapisuje na karcie podsumowanie specyfikacji.                                                                               |
| `workboard_decompose`                                                                                                                            | Rozdziela nadrzędną kartę orkiestracji na połączone karty podrzędne, dziedziczące metadane tablicy/dzierżawcy; może ukończyć kartę nadrzędną z manifestem utworzonych kart.                            |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | Zarządza subskrypcjami powiadomień. Odczyty zdarzeń można bezpiecznie powtarzać; `advance` przesuwa trwały kursor, dzięki czemu wywołujący wznawiają pracę bez utraty ani podwójnego odczytu zdarzeń ukończonych/nieudanych/nieaktualnych kart. |
| `workboard_boards` / `workboard_stats`                                                                                                           | Umożliwia sprawdzanie przestrzeni nazw tablic i statystyk kolejki.                                                                                                                                    |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | Przywraca lub przekazuje zablokowaną pracę.                                                                                                                                                           |
| `workboard_comment` / `workboard_proof`                                                                                                          | Dodaje notatki dotyczące przekazania albo dołącza odwołania do dowodów/artefaktów.                                                                                                                    |
| `workboard_unblock`                                                                                                                              | Przenosi zablokowaną pracę z powrotem do `todo`.                                                                                                                                                      |
| `workboard_dispatch`                                                                                                                             | Wymusza promocję zależności lub czyszczenie nieaktualnych przejęć.                                                                                                                                   |

Przejęte karty odrzucają modyfikacje wykonywane narzędziami agentów przez inne
agenty, chyba że wywołujący posiada token przejęcia zwrócony przez
`workboard_claim`. Każda karta zwracana przez narzędzie agenta lub wywołanie
RPC Gateway maskuje `metadata.claim.token` jako `[redacted]` (sam token jest
zwracany tylko raz, na najwyższym poziomie, wyłącznie przez `workboard_claim`),
dzięki czemu operatorzy panelu i inni agenci mogą sprawdzać stan przejęcia bez
możliwości zobaczenia użytecznego tokenu. Odzyskiwanie odbywa się za pomocą
`workboard_promote`/`workboard_reassign`/`workboard_reclaim`, które nie
wymagają tokenu.

## Rozdzielanie

Rozdzielanie jest lokalne dla Gateway: nie uruchamia dowolnych procesów systemu
operacyjnego. Za wykonanie nadal odpowiadają zwykłe sesje podagentów OpenClaw.
Jeden przebieg rozdzielania:

1. Promuje karty, których zależności są gotowe.
2. Zapisuje metadane rozdzielania na gotowych kartach.
3. Blokuje wygasłe przejęcia lub wykonania, które przekroczyły limit czasu.
4. Oznacza skonfigurowane na tablicy karty selekcji jako kandydatów do orkiestracji.
5. Przejmuje niewielką partię gotowych kart i uruchamia wykonania przez środowisko
   uruchomieniowe podagentów Gateway.

Wykonawcy otrzymują ograniczony kontekst karty oraz token przejęcia potrzebny do
wysyłania Heartbeat, ukończenia lub zablokowania karty za pomocą narzędzi
Workboard.

### Wybór wykonawców

Każdy przebieg uruchamia **domyślnie najwyżej 3 wykonawców**. Gotowe karty są
porządkowane według priorytetu, następnie pozycji, a potem czasu utworzenia.
Przebieg uruchamia tylko jedną kartę na właściciela/agenta i pomija właścicieli,
którzy mają już na tablicy pracę w toku lub w trakcie przeglądu. Zarchiwizowane
karty, karty z aktywnym przejęciem i karty, które nie mają stanu `ready`, nigdy
nie są wybierane do uruchomienia wykonawców (nadal może na nie wpływać część
rozdzielania dotycząca danych: czyszczenie nieaktualnych przejęć, promocja
zależności, czyszczenie po przekroczeniu limitu czasu).

Klucze sesji są deterministyczne dla każdej tablicy/karty, dlatego powtarzane
rozdzielanie kieruje pracę z powrotem do tej samej ścieżki wykonawcy zamiast
tworzyć niepowiązane sesje:

- Przypisane karty: `agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- Nieprzypisane karty: `subagent:workboard-<boardId>-<cardId>` (Gateway ustala
  skonfigurowanego domyślnego agenta)

Jeśli po przejęciu karty nie można uruchomić wykonawcy, Workboard blokuje kartę,
usuwa przejęcie, rejestruje niepowodzenie uruchomienia wykonania i dopisuje
wiersz dziennika wykonawcy — widoczny w panelu, danych JSON CLI, narzędziach
agentów i diagnostyce karty.

### Punkty wejścia

- Akcja rozdzielania w panelu
- `openclaw workboard dispatch`
- `/workboard dispatch` w kanale obsługującym polecenia

Wszystkie trzy korzystają ze środowiska uruchomieniowego podagentów Gateway,
gdy Gateway jest dostępny. CLI ma jeden mechanizm zastępczy dla operatora:
jeśli wywołanie Gateway zakończy się błędem połączenia/niedostępności (lub
błędem `unknown method` w przypadku starszych wersji Gateway), a nie podano
jawnego celu `--url`/`--token` i nie obowiązuje skonfigurowany zdalny Gateway
(`OPENCLAW_GATEWAY_URL` lub `gateway.mode: remote`), CLI wykonuje lokalnie
rozdzielanie obejmujące tylko dane, korzystając ze stanu SQLite — może
promować zależności, usuwać nieaktualne przejęcia i blokować wykonania, które
przekroczyły limit czasu, ale nie może uruchamiać wykonawców. Błędy
uwierzytelniania, uprawnień i walidacji zwracane przez osiągalny Gateway nie
są traktowane jako niedostępność; są zgłaszane jako błędy polecenia, podobnie
jak każde niepowodzenie Gateway, gdy podano jawny cel `--url`/`--token`.

Metadane tablicy mogą ustawiać `autoDecompose`, `autoDecomposePerDispatch`,
`defaultAssignee` i `orchestratorProfile`. OpenClaw zapisuje tę intencję i
udostępnia ją w kontekście wykonawcy; właściwe określanie specyfikacji i
dekompozycja nadal odbywają się za pomocą standardowych narzędzi Workboard.

## CLI i polecenie z ukośnikiem

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

Tekstowe dane wyjściowe polecenia `list` domyślnie ukrywają zarchiwizowane
karty (`--include-archived` zmienia to zachowanie); `--json` zawsze uwzględnia
zarchiwizowane karty, zgodnie z kontraktem pełnej karty używanym przez
istniejące skrypty. `show` przyjmuje jednoznaczny prefiks identyfikatora.
`list`, `create` i `show` zawsze bezpośrednio odczytują/zapisują lokalny stan
pluginu. Tylko `dispatch` wywołuje działający Gateway, korzystając z opisanego
powyżej mechanizmu zastępczego.

Pełny opis flag, danych wyjściowych JSON, mechanizmu zastępczego Gateway,
obsługi prefiksów identyfikatorów, reguł wyboru przy rozdzielaniu i
rozwiązywania problemów zawiera dokumentacja [CLI Workboard](/pl/cli/workboard).

`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>`
i `/workboard dispatch` odzwierciedlają CLI. Wyświetlanie listy i szczegółów
to operacje odczytu dostępne dla każdego autoryzowanego nadawcy poleceń.
Tworzenie i rozdzielanie wymagają statusu właściciela w interfejsach czatu albo
klienta Gateway z uprawnieniem `operator.write`/`operator.admin`.

## Synchronizacja cyklu życia sesji

Karty mogą być powiązane z istniejącą sesją panelu lub z sesją utworzoną po
rozpoczęciu pracy z karty. Powiązane karty pokazują cykl życia sesji bezpośrednio:
uruchomiona, nieaktualna, powiązana i bezczynna, zakończona, nieudana lub brakująca. Możesz również przechwycić
istniejącą sesję z karty Sesje za pomocą opcji **Dodaj do Workboard**; karta
zostanie powiązana z tą sesją, użyje etykiety sesji lub ostatniego monitu użytkownika jako tytułu
oraz wypełni notatki ostatnim monitem użytkownika i najnowszą odpowiedzią asystenta,
jeśli są dostępne.

Jeśli powiązana sesja zniknie, karta pozostanie powiązana, aby zachować kontekst,
i nadal będzie oferować elementy sterujące umożliwiające ponowne uruchomienie w nowej sesji. Jeśli aktywna
powiązana sesja przestanie zgłaszać niedawną aktywność, Workboard oznaczy kartę jako
`stale` i zapisze ten stan jako metadane, dopóki cykl życia go nie usunie.

Gdy karta jest w aktywnym stanie pracy, Workboard śledzi powiązaną sesję:

| Stan powiązanej sesji                     | Stan karty |
| ----------------------------------------- | ---------- |
| aktywna                                   | `running`  |
| ukończona                                 | `review`   |
| nieudana, zakończona, przekroczyła limit czasu lub przerwana | `blocked`  |

**Ręczne stany przeglądu mają pierwszeństwo.** Przeniesienie karty do stanu `review`, `blocked` lub `done`
zatrzymuje automatyczną synchronizację tej karty, dopóki nie przeniesiesz jej z powrotem do stanu `todo` lub `running`.

Uruchomienie karty korzysta ze zwykłych sesji Gateway; Workboard przechowuje tylko
metadane i powiązania karty. Transkrypcja rozmowy, wybór modelu i cykl życia
uruchomienia pozostają zarządzane przez standardowy system sesji. Użyj opcji **Zatrzymaj** na aktywnej
powiązanej karcie, aby przerwać aktywne uruchomienie — Workboard oznaczy tę kartę jako `blocked`, dzięki czemu
pozostanie widoczna do dalszej obsługi.

Nowe karty mogą korzystać z szablonów Workboard (`bugfix`, `docs`, `release`,
`pr_review`, `plugin`). Szablony wstępnie wypełniają tytuł, notatki, etykiety i priorytet;
identyfikator szablonu jest przechowywany jako metadane karty.

## Przepływ pracy w panelu

1. Otwórz kartę Workboard w interfejsie Control UI.
2. Utwórz kartę z tytułem, notatkami, priorytetem, etykietami, opcjonalnym agentem i
   opcjonalną powiązaną sesją — lub otwórz Sesje i wybierz **Dodaj do Workboard**
   dla istniejącej sesji.
3. Przeciągnij kartę między kolumnami albo ustaw fokus na jej kompaktowym elemencie sterującym stanem i użyj
   menu lub klawiszy ArrowLeft/ArrowRight.
4. Rozpocznij pracę z karty, aby utworzyć lub ponownie wykorzystać sesję panelu.
5. Otwórz powiązaną sesję z karty podczas pracy agenta.
6. Pozwól synchronizacji cyklu życia przenieść wykonywaną pracę do stanu `review`/`blocked`, a następnie ręcznie
   przenieś kartę do stanu `done` po jej zaakceptowaniu.

## Diagnostyka

Diagnostyka jest obliczana na podstawie lokalnych metadanych kart. Wbudowane kontrole sygnalizują:

| Rodzaj                      | Warunek                                                                        |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | Przypisana karta w stanie `todo`/`backlog`/`ready`, nieaktualizowana od ponad 1 godziny. |
| `running_without_heartbeat` | Karta w stanie `running` bez Heartbeat roszczenia ani aktualizacji wykonania od ponad 20 minut. |
| `blocked_too_long`          | Karta w stanie `blocked`, nieaktualizowana od ponad 24 godzin.                  |
| `repeated_failures`         | Śledzona liczba niepowodzeń karty osiągnęła co najmniej 2.                      |
| `missing_proof`             | Karta w stanie `done` bez dowodu, artefaktów ani załączników.                   |
| `orphaned_session`          | Karta w stanie `running` z `sessionKey`, ale bez metadanych `execution`.        |

## Uprawnienia

Metody RPC Gateway znajdują się w przestrzeni `workboard.*`:

| Zakres           | Metody                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`, `cards.export`, `cards.diagnostics`, wyświetlanie/pobieranie załączników, odczyt zdarzeń powiadomień, `boards.list`, `cards.stats`, `cards.runs`                                                                                                                                                                                                                        |
| `operator.write` | `cards.diagnostics.refresh`, tworzenie/aktualizowanie/przenoszenie/usuwanie/komentowanie/powiązywanie/linkDependency/dowód/artefakt, dodawanie/usuwanie załączników, dziennik procesu roboczego, naruszenie protokołu, claim/heartbeat/release/promote/reassign/reclaim/complete/block/unblock, `cards.dispatch`, `cards.bulk`, archiwizowanie, `boards.upsert`/`archive`/`delete`, `cards.specify`/`decompose`, subskrybowanie/usuwanie/przesuwanie powiadomień |

Żadna metoda RPC nie wymaga uprawnienia `operator.admin`. Przeglądarki połączone z dostępem operatora
tylko do odczytu mogą przeglądać tablicę, ale nie mogą modyfikować kart.

## Przechowywanie danych

Workboard przechowuje trwałe dane w relacyjnej bazie danych SQLite należącej do pluginu,
w katalogu stanu OpenClaw: tablice, karty, etykiety, zdarzenia cyklu życia,
próby uruchomienia, komentarze, powiązania zależności, dowody, odwołania do artefaktów,
metadane i obiekty binarne załączników, dane diagnostyczne, powiadomienia, dzienniki procesów roboczych,
stan protokołu oraz subskrypcje znajdują się w tabelach Workboard (a nie
we wpisach klucz-wartość pluginu). Eksport karty zachowuje opis tablicy
bez osadzania zawartości obiektów binarnych załączników.

Instalacje, które korzystały z Workboard w wydaniu `.28`, mogą uruchomić
`openclaw doctor --fix`, aby zmigrować dostarczone starsze przestrzenie nazw stanu pluginu
(`workboard.cards`, `workboard.boards`, `workboard.notify` oraz, jeśli istnieje,
`workboard.attachments`) do relacyjnej bazy danych.

## Rozwiązywanie problemów

**Karta informuje, że Workboard jest niedostępny**

```bash
openclaw plugins inspect workboard --runtime --json
```

Jeśli skonfigurowano `plugins.allow`, dodaj do niego `workboard`. Jeśli `plugins.deny`
zawiera `workboard`, usuń go przed włączeniem pluginu.

**Karty nie są zapisywane**

Upewnij się, że połączenie przeglądarki ma uprawnienie `operator.write`. Sesje operatora
tylko do odczytu mogą wyświetlać karty, ale nie mogą ich tworzyć, edytować, przenosić ani usuwać.

**Uruchomienie karty nie otwiera oczekiwanej sesji**

Sprawdź identyfikator agenta karty i powiązaną sesję, a następnie otwórz Sesje lub Czat, aby
sprawdzić faktyczny stan uruchomienia.

**Wysłanie zadania nie uruchamia procesu roboczego**

Upewnij się, że istnieje co najmniej jedna karta w stanie `ready` bez aktywnego roszczenia:

```bash
openclaw workboard list --status ready
```

Jeśli CLI zgłasza wysyłanie tylko danych, uruchom lub ponownie uruchom Gateway i
spróbuj ponownie — wysyłanie tylko danych aktualizuje stan lokalnej tablicy, ale nie może uruchomić
procesów roboczych podagentów. Karty mogą być również pomijane, gdy inna karta tego
samego właściciela lub agenta jest już uruchomiona albo oczekuje na przegląd; ukończ,
zablokuj lub zwolnij tę aktywną pracę przed wysłaniem kolejnych zadań dla tego samego
właściciela.

## Powiązane materiały

- [Control UI](/pl/web/control-ui)
- [CLI Workboard](/pl/cli/workboard)
- [Pluginy](/pl/tools/plugin)
- [Zarządzanie pluginami](/pl/plugins/manage-plugins)
- [Sesje](/pl/concepts/session)
