---
read_when:
    - Zmiana wykonywania automatycznych odpowiedzi lub ich współbieżności
    - Wyjaśnianie trybów /queue lub zachowania kierowania wiadomości
summary: Tryby kolejki automatycznych odpowiedzi, wartości domyślne i nadpisania dla poszczególnych sesji
title: Kolejka poleceń
x-i18n:
    generated_at: "2026-05-04T02:23:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 085aebe7059020f027eb08bb382cce2d253ea117eed0ca77d6ffd208f295acb1
    source_path: concepts/queue.md
    workflow: 16
---

Serializujemy przychodzące uruchomienia automatycznych odpowiedzi (we wszystkich kanałach) przez małą kolejkę wewnątrz procesu, aby zapobiec kolizjom wielu uruchomień agentów, a jednocześnie nadal pozwalać na bezpieczną równoległość między sesjami.

## Dlaczego

- Uruchomienia automatycznych odpowiedzi mogą być kosztowne (wywołania LLM) i mogą kolidować, gdy wiele wiadomości przychodzących pojawia się w krótkim odstępie czasu.
- Serializacja pozwala uniknąć rywalizacji o współdzielone zasoby (pliki sesji, logi, stdin CLI) i zmniejsza ryzyko limitów szybkości po stronie usług nadrzędnych.

## Jak to działa

- Kolejka FIFO świadoma torów opróżnia każdy tor z konfigurowalnym limitem współbieżności (domyślnie 1 dla nieskonfigurowanych torów; main domyślnie 4, subagent 8).
- `runEmbeddedPiAgent` dodaje do kolejki według **klucza sesji** (tor `session:<key>`), aby zagwarantować tylko jedno aktywne uruchomienie na sesję.
- Każde uruchomienie sesji jest następnie dodawane do **toru globalnego** (domyślnie `main`), więc ogólna równoległość jest ograniczona przez `agents.defaults.maxConcurrent`.
- Gdy włączone jest szczegółowe logowanie, uruchomienia w kolejce emitują krótkie powiadomienie, jeśli czekały ponad około 2 s przed rozpoczęciem.
- Wskaźniki pisania nadal uruchamiają się natychmiast po dodaniu do kolejki (gdy kanał to obsługuje), więc doświadczenie użytkownika pozostaje bez zmian podczas oczekiwania na swoją kolej.

## Domyślne wartości

Gdy nie ustawiono inaczej, wszystkie powierzchnie kanałów przychodzących używają:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` jest domyślne, ponieważ utrzymuje aktywną turę modelu responsywną bez
rozpoczynania drugiego uruchomienia sesji. Opróżnia wszystkie wiadomości sterujące, które dotarły
przed następną granicą modelu. Jeśli bieżące uruchomienie nie może przyjąć sterowania,
OpenClaw wraca do wpisu kolejki followup.

## Tryby kolejki

Wiadomości przychodzące mogą sterować bieżącym uruchomieniem, czekać na turę followup albo robić jedno i drugie:

- `steer`: dodaje wiadomości sterujące do aktywnego runtime. Pi dostarcza wszystkie oczekujące wiadomości sterujące **po zakończeniu wykonywania wywołań narzędzi przez bieżącą turę asystenta**, przed następnym wywołaniem LLM; Codex app-server otrzymuje jedno zbiorcze `turn/steer`. Jeśli uruchomienie nie streamuje aktywnie albo sterowanie jest niedostępne, OpenClaw wraca do wpisu kolejki followup.
- `queue` (starsze): stare sterowanie po jednej wiadomości naraz. Pi dostarcza jedną zakolejkowaną wiadomość sterującą przy każdej granicy modelu; Codex app-server otrzymuje osobne żądania `turn/steer`. Preferuj `steer`, chyba że potrzebujesz poprzedniego serializowanego zachowania.
- `followup`: dodaje każdą wiadomość do kolejki na późniejszą turę agenta po zakończeniu bieżącego uruchomienia.
- `collect`: scala zakolejkowane wiadomości w **pojedynczą** turę followup po oknie ciszy. Jeśli wiadomości celują w różne kanały/wątki, są opróżniane pojedynczo, aby zachować routing.
- `steer-backlog` (alias `steer+backlog`): steruj teraz **i** zachowaj tę samą wiadomość na turę followup.
- `interrupt` (starsze): przerywa aktywne uruchomienie dla tej sesji, a następnie uruchamia najnowszą wiadomość.

Steer-backlog oznacza, że możesz otrzymać odpowiedź followup po sterowanym uruchomieniu, więc
powierzchnie streamujące mogą wyglądać jak duplikaty. Preferuj `collect`/`steer`, jeśli chcesz
jednej odpowiedzi na wiadomość przychodzącą.

Informacje o czasie i zachowaniu zależności specyficznym dla runtime znajdziesz w
[Kolejka sterowania](/pl/concepts/queue-steering). Informacje o jawnym poleceniu `/steer <message>`
znajdziesz w [Sterowanie](/pl/tools/steer).

Skonfiguruj globalnie lub dla kanału przez `messages.queue`:

```json5
{
  messages: {
    queue: {
      mode: "steer",
      debounceMs: 500,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## Opcje kolejki

Opcje dotyczą `followup`, `collect` i `steer-backlog` (oraz `steer` lub starszego `queue`, gdy sterowanie wraca do followup):

- `debounceMs`: okno ciszy przed opróżnieniem zakolejkowanych followup. Same liczby oznaczają milisekundy; jednostki `ms`, `s`, `m`, `h` i `d` są akceptowane przez opcje `/queue`.
- `cap`: maksymalna liczba zakolejkowanych wiadomości na sesję. Wartości poniżej `1` są ignorowane.
- `drop: "summarize"`: domyślne. Upuszczaj najstarsze zakolejkowane wpisy w razie potrzeby, zachowuj zwarte podsumowania i wstrzykuj je jako syntetyczny prompt followup.
- `drop: "old"`: upuszczaj najstarsze zakolejkowane wpisy w razie potrzeby, bez zachowywania podsumowań.
- `drop: "new"`: odrzuć najnowszą wiadomość, gdy kolejka jest już pełna.

Domyślne wartości: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Pierwszeństwo

Przy wyborze trybu OpenClaw rozwiązuje:

1. Wbudowane lub zapisane nadpisanie `/queue` dla sesji.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Domyślne `steer`.

Dla opcji wygrywają wbudowane lub zapisane opcje `/queue` nad konfiguracją. Następnie
stosowane są debounce specyficzne dla kanału (`messages.queue.debounceMsByChannel`), domyślne
wartości debounce Pluginów, globalne opcje `messages.queue` oraz wbudowane wartości domyślne.
`cap` i `drop` są opcjami globalnymi/sesyjnymi, a nie kluczami konfiguracji per kanał.

## Nadpisania dla sesji

- Wyślij `/queue <mode>` jako samodzielne polecenie, aby zapisać tryb dla bieżącej sesji.
- Opcje można łączyć: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` lub `/queue reset` czyści nadpisanie sesji.

## Zakres i gwarancje

- Dotyczy uruchomień agentów automatycznych odpowiedzi we wszystkich kanałach przychodzących, które używają potoku odpowiedzi Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat itd.).
- Domyślny tor (`main`) jest ogólny dla procesu dla przychodzących wiadomości i głównych heartbeatów; ustaw `agents.defaults.maxConcurrent`, aby dopuścić wiele sesji równolegle.
- Mogą istnieć dodatkowe tory (np. `cron`, `cron-nested`, `nested`, `subagent`), aby zadania w tle mogły działać równolegle bez blokowania odpowiedzi przychodzących. Izolowane tury agenta cron zajmują slot `cron`, podczas gdy ich wewnętrzne wykonanie agenta używa `cron-nested`; oba używają `cron.maxConcurrentRuns`. Współdzielone przepływy `nested` niebędące cron zachowują własne zachowanie toru. Te odłączone uruchomienia są śledzone jako [zadania w tle](/pl/automation/tasks).
- Tory per sesja gwarantują, że tylko jedno uruchomienie agenta dotyka danej sesji naraz.
- Bez zewnętrznych zależności ani wątków pracowników w tle; czysty TypeScript + obietnice.

## Rozwiązywanie problemów

- Jeśli polecenia wydają się zablokowane, włącz szczegółowe logi i szukaj wierszy „queued for …ms”, aby potwierdzić, że kolejka się opróżnia.
- Jeśli potrzebujesz głębokości kolejki, włącz szczegółowe logi i obserwuj wiersze czasu kolejki.
- Uruchomienia Codex app-server, które przyjmują turę, a następnie przestają emitować postęp, są przerywane przez adapter Codex, aby aktywny tor sesji mógł się zwolnić zamiast czekać na limit czasu zewnętrznego uruchomienia.
- Gdy diagnostyka jest włączona, sesje, które pozostają w `processing` po `diagnostics.stuckSessionWarnMs` bez zaobserwowanej odpowiedzi, narzędzia, statusu, bloku ani postępu ACP, są klasyfikowane według bieżącej aktywności. Aktywna praca loguje się jako `session.long_running`; aktywna praca bez ostatniego postępu loguje się jako `session.stalled`; `session.stuck` jest zarezerwowane dla przestarzałej ewidencji sesji bez aktywnej pracy i tylko ta ścieżka może zwolnić dotknięty tor sesji, aby zakolejkowana praca została opróżniona. Powtarzane diagnostyki `session.stuck` wycofują się, dopóki sesja pozostaje bez zmian.

## Powiązane

- [Zarządzanie sesją](/pl/concepts/session)
- [Kolejka sterowania](/pl/concepts/queue-steering)
- [Sterowanie](/pl/tools/steer)
- [Polityka ponawiania](/pl/concepts/retry)
