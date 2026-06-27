---
read_when:
    - Chcesz mieć tablicę pracy w stylu Kanban w Control UI
    - Włączasz lub wyłączasz dołączony Plugin Workboard
    - Chcesz śledzić zaplanowaną pracę agentów bez zewnętrznego menedżera projektów
summary: Opcjonalna tablica robocza dashboardu dla kart należących do agentów i przekazywania sesji
title: Plugin tablicy roboczej
x-i18n:
    generated_at: "2026-06-27T18:09:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: caca6263b4ee08b36816ef6acdef506499c66b4d27f4f75551ac7784b2bf3324
    source_path: plugins/workboard.md
    workflow: 16
---

Plugin Workboard dodaje opcjonalną tablicę w stylu Kanban do
[Control UI](/pl/web/control-ui). Użyj jej do zbierania kart pracy o zakresie
odpowiednim dla agentów, przypisywania ich do agentów oraz śledzenia
powiązanego zadania w tle, uruchomienia i sesji dashboardu z jednej karty.

Workboard jest celowo mały. Śledzi lokalną pracę operacyjną dla
OpenClaw Gateway; nie zastępuje GitHub Issues, Linear, Jira ani innych
zespołowych systemów zarządzania projektami.

## Stan domyślny

Workboard jest dołączonym Pluginem i jest domyślnie wyłączony, chyba że
włączysz go w konfiguracji Pluginu.

Włącz go poleceniem:

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

Następnie otwórz dashboard:

```bash
openclaw dashboard
```

Karta Workboard pojawia się w nawigacji dashboardu. Jeśli karta jest widoczna,
ale Plugin jest wyłączony albo zablokowany przez `plugins.allow` / `plugins.deny`,
widok pokazuje stan niedostępności Pluginu zamiast lokalnych danych kart.

## Co zawierają karty

Każda karta przechowuje:

- tytuł i notatki
- status: `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`,
  `review`, `blocked` lub `done`
- priorytet: `low`, `normal`, `high` lub `urgent`
- etykiety
- opcjonalny identyfikator agenta
- opcjonalne powiązane zadanie, uruchomienie, sesję lub źródłowy URL
- opcjonalne metadane wykonania dla uruchomienia Codex lub Claude rozpoczętego z karty
- zwięzłe metadane dla prób, komentarzy, linków, dowodów, artefaktów, automatyzacji,
  załączników, logów workerów, stanu protokołu workera, zgłoszeń, diagnostyki,
  powiadomień, szablonów, stanu archiwum i wykrywania nieaktualnych sesji
- ostatnie zdarzenia karty, takie jak utworzenie, przeniesienie, powiązanie,
  przejęcie, Heartbeat, próba, dowód, artefakt, diagnostyka, powiadomienie,
  wysłanie, archiwum, nieaktualność lub zmiany zaktualizowane przez agenta

Karty są przechowywane w stanie Gateway Pluginu. Są lokalne względem katalogu
stanu Gateway i przenoszą się razem z resztą stanu OpenClaw tego Gateway.

Workboard utrzymuje zwięzłe metadane dla każdej karty, aby operatorzy mogli
zobaczyć, jak karta przechodziła przez tablicę bez otwierania powiązanej sesji.
Zdarzenia, podsumowania prób, fragmenty dowodów, powiązane linki, komentarze,
znaczniki archiwum i znaczniki nieaktualnej sesji są celowo lokalnymi
metadanymi; nie zastępują transkrypcji sesji ani historii zgłoszeń GitHub.

## Wykonania kart i zadania

Niepowiązane karty mogą rozpoczynać pracę z poziomu karty. Autonomiczne starty
używają ścieżki uruchomienia agenta śledzonego jako zadanie w Gateway, po czym
Workboard wiąże wynikowe zadanie, identyfikator uruchomienia i klucz sesji z
powrotem z kartą. Start używa domyślnego agenta i modelu skonfigurowanych w
Gateway. Akcje Codex i Claude są opcjonalnymi, jawnymi wyborami modelu:

- Run Codex lub Run Claude rozpoczyna uruchomienie agenta wspierane zadaniem,
  wysyła prompt karty i oznacza kartę jako `running`.
- Open Codex lub Open Claude tworzy powiązaną sesję dashboardu bez wysyłania
  promptu karty ani przenoszenia karty, aby można było pracować ręcznie,
  zachowując jej powiązanie z tablicą.

Metadane wykonania przechowują na karcie wybrany silnik, tryb, odwołanie modelu,
klucz sesji, identyfikator uruchomienia, identyfikator zadania, jeśli jest
dostępny, oraz status cyklu życia. Wykonania Codex używają `openai/gpt-5.5`;
wykonania Claude używają `anthropic/claude-sonnet-4-6`.

Każde powiązane wykonanie zapisuje też podsumowanie próby w tym samym rekordzie
karty. Podsumowanie próby przechowuje silnik, tryb, model, identyfikator
uruchomienia, znaczniki czasu, status i kroczącą liczbę niepowodzeń, aby
powtarzające się awarie pozostały widoczne na tablicy.

Dashboard odświeża status zadania z rejestru zadań Gateway i dopasowuje zadania
z powrotem do kart według identyfikatora zadania, identyfikatora uruchomienia
lub powiązanego klucza sesji. Jeśli zadanie jest w kolejce lub jest uruchomione,
cykl życia karty pokazuje aktywny stan zadania. Jeśli zadanie kończy się
powodzeniem, niepowodzeniem, przekroczeniem czasu lub zostaje anulowane, cykl
życia karty przesuwa się w stronę statusu przeglądu lub zablokowania przy użyciu
tej samej synchronizacji cyklu życia co powiązane sesje.

## Koordynacja agentów

Workboard udostępnia także opcjonalne narzędzia agentów dla przepływów pracy
świadomych tablicy:

- `workboard_list` wyświetla zwięzłe karty ze stanem przejęcia i diagnostyki,
  z opcjonalnym filtrem tablicy.
- `workboard_read` zwraca jedną kartę oraz ograniczony kontekst workera zbudowany
  z notatek, prób, komentarzy, linków, dowodów, artefaktów, wyników nadrzędnych,
  ostatniej pracy przypisanego użytkownika i aktywnej diagnostyki.
- `workboard_create` tworzy kartę z opcjonalnymi elementami nadrzędnymi, tenantem,
  Skills, tablicą, metadanymi workspace, kluczem idempotencji, limitem czasu
  wykonania i budżetem ponowień.
- `workboard_link` łączy kartę nadrzędną z kartą podrzędną. Elementy podrzędne
  pozostają w `todo`, dopóki każdy element nadrzędny nie osiągnie `done`;
  następnie promocja wysyłki przenosi je do `ready`.
- `workboard_claim` przejmuje kartę dla wywołującego agenta i przenosi karty
  z backlogu, todo lub ready do `running`.
- `workboard_heartbeat` odświeża Heartbeat przejęcia podczas dłuższych uruchomień.
- `workboard_release` zwalnia przejęcie po ukończeniu, pauzie lub przekazaniu i
  może przenieść kartę do następnego statusu.
- `workboard_complete` i `workboard_block` to ustrukturyzowane narzędzia cyklu
  życia dla końcowych podsumowań, dowodów, artefaktów, manifestów utworzonych
  kart i powodów blokady. Manifesty utworzonych kart muszą odwoływać się do
  kart powiązanych z ukończoną kartą, co zapobiega trafianiu fikcyjnych
  elementów podrzędnych do podsumowań.
- `workboard_attachment_add`, `workboard_attachment_read` i
  `workboard_attachment_delete` przechowują małe załączniki kart w stanie
  SQLite Pluginu, indeksują je na karcie i udostępniają w kontekście workera.
- `workboard_worker_log` i `workboard_protocol_violation` zapisują wiersze logu
  workera i blokują karty, gdy zautomatyzowany worker zatrzymuje się bez
  wywołania `workboard_complete` lub `workboard_block`.
- `workboard_board_create`, `workboard_board_archive` i
  `workboard_board_delete` zarządzają trwałymi metadanymi tablicy, takimi jak
  wyświetlana nazwa, opis, stan archiwum i domyślny workspace.
- `workboard_runs` zwraca trwałą historię prób uruchomienia przechowywaną na karcie.
- `workboard_specify` zamienia ogólną kartę triage lub backlog w doprecyzowaną
  kartę `todo` i zapisuje podsumowanie specyfikacji na karcie.
- `workboard_decompose` rozdziela nadrzędną kartę orkiestracji na powiązane
  elementy podrzędne, dziedziczy metadane tablicy i tenanta oraz może ukończyć
  element nadrzędny z manifestem utworzonych kart.
- `workboard_notify_subscribe`, `workboard_notify_list`,
  `workboard_notify_events`, `workboard_notify_advance` i
  `workboard_notify_unsubscribe` zarządzają subskrypcjami powiadomień w stanie
  Pluginu. Odczyty zdarzeń są bezpieczne przy powtórkach; narzędzie advance
  przesuwa trwały kursor, aby wywołujący mogli wznowić pracę bez utraty lub
  podwójnego odczytu ukończonych, nieudanych albo nieaktualnych zdarzeń kart.
- `workboard_boards`, `workboard_stats`, `workboard_promote`,
  `workboard_reassign`, `workboard_reclaim`, `workboard_comment`,
  `workboard_proof`, `workboard_unblock` i `workboard_dispatch` pozwalają
  agentowi sprawdzać przestrzenie nazw tablic, przeglądać statystyki kolejki,
  odzyskiwać zablokowaną pracę, dodawać notatki przekazania, dołączać dowody lub
  odwołania do artefaktów, przenosić zablokowaną pracę z powrotem do `todo` oraz
  inicjować promocję zależności lub czyszczenie nieaktualnych przejęć.

Przejęte karty odrzucają mutacje z narzędzi agentów pochodzące od innych
agentów, chyba że wywołujący ma token przejęcia zwrócony przez `workboard_claim`.
Operatorzy dashboardu nadal używają zwykłej powierzchni RPC Gateway i mogą
odzyskiwać lub ponownie przypisywać karty.

Workboard przechowuje trwałe dane tablicy w relacyjnej bazie danych SQLite
należącej do Pluginu, w katalogu stanu OpenClaw. Tablice, karty, etykiety,
zdarzenia cyklu życia, próby uruchomień, komentarze, linki zależności, dowody,
odwołania do artefaktów, metadane i bloby załączników, diagnostyka,
powiadomienia, logi workerów, stan protokołu i subskrypcje są utrwalane w
tabelach Workboard zamiast we wpisach klucz-wartość Pluginu. Eksport karty nadal
zachowuje narrację tablicy bez osadzania zawartości blobów załączników.

Instalacje, które używały Workboard w wydaniu `.28`, mogą uruchomić
`openclaw doctor --fix`, aby zmigrować dostarczone starsze przestrzenie nazw
stanu Pluginu (`workboard.cards`, `workboard.boards` i `workboard.notify`) do
relacyjnej bazy danych. Jeśli istnieje starsza przestrzeń nazw
`workboard.attachments`, doctor migruje także te bloby załączników.

Diagnostyka Workboard jest wyliczana z lokalnych metadanych kart. Wbudowane
sprawdzenia oznaczają przypisane karty, które czekają zbyt długo, uruchomione
karty bez ostatniego Heartbeat, zablokowane karty wymagające uwagi, powtarzające
się awarie, ukończone karty bez dowodu oraz uruchomione karty, które mają tylko
luźne powiązanie z sesją.

Wysyłka jest celowo lokalna dla Gateway. Nie uruchamia dowolnych procesów
systemu operacyjnego; normalne sesje podagentów OpenClaw nadal odpowiadają za
wykonanie. Akcja wysyłki promuje karty gotowe pod względem zależności, zapisuje
metadane wysyłki na gotowych kartach, blokuje wygasłe przejęcia lub uruchomienia
po przekroczeniu czasu, oznacza skonfigurowane przez tablicę karty triage jako
kandydatów do orkiestracji, a następnie przejmuje małą partię gotowych kart i
rozpoczyna uruchomienia workerów przez runtime podagentów Gateway. Przypisane
karty używają kluczy sesji workerów `agent:<id>:subagent:workboard-*`;
nieprzypisane karty używają kluczy bez zakresu `subagent:workboard-*`, aby
Gateway nadal rozwiązywał skonfigurowanego domyślnego agenta. Workery otrzymują
ograniczony kontekst karty oraz token przejęcia potrzebny do wysyłania
Heartbeat, ukończenia lub zablokowania karty przez narzędzia Workboard.

### Wybór workera wysyłki

Każde przejście wysyłki domyślnie uruchamia najwyżej trzy workery. Gotowe karty
są porządkowane według priorytetu, pozycji i czasu utworzenia, a następnie
filtrowane, aby uniknąć zduplikowanej aktywnej własności. Wysyłka uruchamia w
tym samym przejściu tylko jedną kartę dla danego właściciela lub agenta i
pomija właścicieli, którzy mają już uruchomioną pracę albo pracę w przeglądzie
na tablicy.

Zarchiwizowane karty, karty z aktywnymi przejęciami i karty bez statusu `ready`
nie są wybierane do startów workerów. Nadal mogą być objęte stroną danych
wysyłki, gdy zastosowanie mają nieaktualne przejęcia, promocja zależności lub
czyszczenie przekroczeń czasu.

### Prompt workera i cykl życia

Prompt workera zawiera tytuł karty, ograniczone notatki i kontekst, przypisaną
tablicę oraz protokół workera Workboard. Zawiera także właściciela przejęcia i
token przejęcia, aby worker mógł wywołać `workboard_heartbeat`,
`workboard_complete` lub `workboard_block` bez przejmowania karty przez innego
aktora.

Gdy worker uruchomi się pomyślnie, Workboard zapisuje na karcie klucz sesji,
identyfikator uruchomienia, silnik, tryb, etykietę modelu, status i log workera.
Klucz sesji jest deterministyczny dla tablicy i karty, dzięki czemu powtarzane
wysyłki wracają do tego samego toru workera zamiast tworzyć niepowiązane sesje.

Jeśli po przejęciu karty nie można uruchomić workera, Workboard blokuje kartę,
czyści przejęcie, zapisuje niepowodzenie startu uruchomienia i dodaje wiersz
logu workera. To niepowodzenie jest widoczne w dashboardzie, JSON z CLI,
narzędziach agentów i diagnostyce karty.

### Punkty wejścia wysyłki

Starty workerów gotowych kart mogą nastąpić z:

- akcji wysyłki dashboardu
- `openclaw workboard dispatch`
- `/workboard dispatch` w kanale obsługującym polecenia

Wszystkie trzy punkty wejścia używają runtime podagentów Gateway, gdy Gateway
jest dostępny. CLI ma jeden dodatkowy awaryjny wariant dla operatora: jeśli
Gateway jest offline lub nie udostępnia metody wysyłki Workboard i nie podano
jawnego celu `--url` ani `--token`, uruchamia wysyłkę tylko danych względem
lokalnego stanu SQLite. Ten wariant awaryjny może promować zależności, czyścić
nieaktualne przejęcia i blokować uruchomienia po przekroczeniu czasu, ale nie
może uruchamiać workerów.

Metadane tablicy mogą zawierać ustawienia orkiestracji, takie jak
`autoDecompose`, `autoDecomposePerDispatch`, `defaultAssignee` i
`orchestratorProfile`. OpenClaw zapisuje zamiar orkiestracji i udostępnia go w
kontekście workera; właściwa specyfikacja i dekompozycja nadal odbywają się
przez zwykłe narzędzia Workboard.

## CLI i polecenie z ukośnikiem

Plugin rejestruje główne polecenie CLI:

```bash
openclaw workboard list
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id>
openclaw workboard dispatch
```

`openclaw workboard dispatch` wywołuje działający Gateway, aby uruchomienia workerów używały tego samego środowiska uruchomieniowego subagentów co panel. Jeśli Gateway jest niedostępny, wraca do dispatchu wyłącznie na danych, aby promowanie zależności, czyszczenie nieaktualnych roszczeń i blokowanie po przekroczeniu limitu czasu nadal mogły działać. Błędy uwierzytelniania, uprawnień i walidacji nadal pojawiają się jako błędy polecenia, podobnie jak błędy dla jawnych celów `--url` lub `--token`.

Polecenie slash `/workboard` obsługuje tę samą zwięzłą ścieżkę operatora:
`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>` i
`/workboard dispatch`. Lista i podgląd są operacjami odczytu dla autoryzowanych nadawców poleceń. Tworzenie i dispatch wymagają statusu właściciela na powierzchniach czatu albo klienta Gateway z `operator.write` lub `operator.admin`.

Zobacz [CLI Workboard](/pl/cli/workboard), aby poznać flagi poleceń, wyjście JSON, zachowanie awaryjne Gateway, jednoznaczną obsługę prefiksów identyfikatorów, reguły wyboru dispatchu i rozwiązywanie problemów.

## Synchronizacja cyklu życia sesji

Karty można łączyć z istniejącymi sesjami panelu albo z sesją utworzoną po rozpoczęciu pracy z karty. Połączone karty pokazują cykl życia sesji w wierszu:
uruchomiona, nieaktualna, połączona bezczynna, zakończona, nieudana lub brakująca.

Jeśli połączonej sesji brakuje, karta pozostaje połączona dla kontekstu i nadal oferuje kontrolki uruchamiania, aby można było wznowić pracę w nowej sesji panelu.
Jeśli aktywna połączona sesja przestanie zgłaszać niedawną aktywność, Workboard oznacza kartę jako nieaktualną i przechowuje ten znacznik jako metadane karty, dopóki cykl życia go nie wyczyści.

Możesz też przechwycić istniejącą sesję panelu z karty Sesje za pomocą
Dodaj do Workboard. Karta zostaje połączona z tą sesją, używa etykiety sesji albo niedawnego promptu użytkownika jako tytułu i wypełnia notatki niedawnym promptem użytkownika oraz najnowszą odpowiedzią asystenta, gdy historia czatu jest dostępna.

Workboard śledzi połączoną sesję, gdy karta nadal jest w aktywnym stanie pracy:

- aktywna połączona sesja -> `running`
- ukończona połączona sesja -> `review`
- nieudana, zabita, przekroczona czasowo albo przerwana połączona sesja -> `blocked`

Ręczne stany przeglądu mają pierwszeństwo. Jeśli przeniesiesz kartę do `review`, `blocked` lub `done`, Workboard przestaje automatycznie przenosić tę kartę, dopóki nie przeniesiesz jej z powrotem do `todo` lub `running`.

## Przepływ pracy w panelu

1. Otwórz kartę Workboard w interfejsie sterowania.
2. Utwórz kartę z tytułem, notatkami, priorytetem, etykietami, opcjonalnym agentem i opcjonalną połączoną sesją.
3. Albo otwórz Sesje i wybierz Dodaj do Workboard dla istniejącej sesji.
4. Przeciągnij kartę między kolumnami albo ustaw fokus na zwięzłej kontrolce statusu na karcie i użyj jej menu lub ArrowLeft/ArrowRight.
5. Rozpocznij pracę z karty, aby utworzyć albo ponownie użyć sesji panelu.
6. Otwórz połączoną sesję z karty, gdy agent pracuje.
7. Pozwól synchronizacji cyklu życia przenieść działającą pracę do przeglądu albo zablokowanych, a następnie ręcznie przenieś kartę do zakończonych po akceptacji.

Uruchomienie karty używa zwykłych sesji Gateway. Plugin Workboard przechowuje tylko metadane i połączenia kart; transkrypcja rozmowy, wybór modelu i cykl życia uruchomienia pozostają własnością zwykłego systemu sesji.

Użyj Zatrzymaj na aktywnej połączonej karcie, aby przerwać aktywne uruchomienie sesji. Workboard oznacza tę kartę jako `blocked`, aby pozostała widoczna do dalszych działań.

Nowe karty mogą startować z szablonów Workboard dla poprawek błędów, dokumentacji, wydań, przeglądów PR albo pracy nad pluginami. Szablony wstępnie wypełniają tytuł, notatki, etykiety i priorytet, a identyfikator wybranego szablonu jest przechowywany jako metadane karty.

## Uprawnienia

Plugin rejestruje metody RPC Gateway w przestrzeni nazw `workboard.*`:

- `workboard.cards.list` wymaga `operator.read`
- `workboard.cards.export` wymaga `operator.read`
- `workboard.cards.diagnostics` wymaga `operator.read`
- `workboard.cards.diagnostics.refresh` wymaga `operator.write`
- odczyty listy/pobierania załączników i zdarzeń powiadomień wymagają `operator.read`
- przesunięcie kursora powiadomień wymaga `operator.write`
- metody tworzenia, aktualizacji, przenoszenia, usuwania, komentowania, łączenia, łączenia zależności, dowodu, artefaktu,
  dodawania/usuwania załącznika, dziennika workera, naruszenia protokołu, roszczenia, Heartbeat,
  wydania, ukończenia, blokowania, odblokowania, dispatchu, operacji zbiorczych i archiwizacji wymagają
  `operator.write`

Przeglądarki połączone z dostępem operatora tylko do odczytu mogą sprawdzać tablicę, ale nie mogą modyfikować kart.

## Konfiguracja

Workboard nie ma dziś konfiguracji specyficznej dla pluginu. Włącz lub wyłącz go za pomocą standardowego wpisu pluginu:

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

Wyłącz go ponownie za pomocą:

```bash
openclaw plugins disable workboard
openclaw gateway restart
```

## Rozwiązywanie problemów

### Karta mówi, że Workboard jest niedostępny

Sprawdź politykę pluginu:

```bash
openclaw plugins inspect workboard --runtime --json
```

Jeśli skonfigurowano `plugins.allow`, dodaj `workboard` do tej listy dozwolonych. Jeśli
`plugins.deny` zawiera `workboard`, usuń go przed włączeniem pluginu.

### Karty się nie zapisują

Potwierdź, że połączenie przeglądarki ma dostęp `operator.write`. Sesje operatora tylko do odczytu mogą wyświetlać karty, ale nie mogą ich tworzyć, edytować, przenosić ani usuwać.

### Uruchomienie karty nie otwiera oczekiwanej sesji

Workboard tworzy połączenia do zwykłych sesji panelu. Sprawdź identyfikator agenta karty i połączoną sesję, a następnie otwórz widok Sesje albo Czat, aby sprawdzić rzeczywisty stan uruchomienia.

### Dispatch nie uruchamia workera

Potwierdź, że istnieje co najmniej jedna karta `ready` bez aktywnego roszczenia:

```bash
openclaw workboard list --status ready
```

Jeśli CLI zgłasza dispatch wyłącznie na danych, uruchom albo zrestartuj Gateway i spróbuj ponownie.
Dispatch wyłącznie na danych aktualizuje lokalny stan tablicy, ale nie może uruchamiać przebiegów workerów subagentów.

Karty mogą być też pomijane, gdy inna karta dla tego samego właściciela albo agenta jest już uruchomiona lub czeka na przegląd. Ukończ, zablokuj albo zwolnij tę aktywną pracę przed dispatchowaniem kolejnej pracy dla tego samego właściciela.

## Powiązane

- [Interfejs sterowania](/pl/web/control-ui)
- [CLI Workboard](/pl/cli/workboard)
- [Pluginy](/pl/tools/plugin)
- [Zarządzanie pluginami](/pl/plugins/manage-plugins)
- [Sesje](/pl/concepts/session)
