---
read_when:
    - Zmiana wykonywania automatycznych odpowiedzi lub współbieżności
    - Wyjaśnianie trybów /queue lub zachowania kierowania wiadomościami
summary: Tryby kolejki automatycznych odpowiedzi, wartości domyślne i nadpisania dla poszczególnych sesji
title: Kolejka poleceń
x-i18n:
    generated_at: "2026-04-30T18:39:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbf1bb1ffd4ce06fa138f63e31651b8821226d9c95dd6b93d68326a5fb91fdd0
    source_path: concepts/queue.md
    workflow: 16
---

Serializujemy przychodzące uruchomienia automatycznych odpowiedzi (wszystkie kanały) przez niewielką kolejkę w procesie, aby zapobiec kolizjom między wieloma uruchomieniami agenta, jednocześnie nadal pozwalając na bezpieczną równoległość między sesjami.

## Dlaczego

- Uruchomienia automatycznych odpowiedzi mogą być kosztowne (wywołania LLM) i mogą kolidować, gdy wiele wiadomości przychodzących nadejdzie w krótkim odstępie czasu.
- Serializacja pozwala uniknąć rywalizacji o współdzielone zasoby (pliki sesji, dzienniki, stdin CLI) i zmniejsza ryzyko limitów szybkości po stronie upstream.

## Jak to działa

- Kolejka FIFO świadoma torów opróżnia każdy tor z konfigurowalnym limitem współbieżności (domyślnie 1 dla nieskonfigurowanych torów; główny domyślnie 4, subagent 8).
- `runEmbeddedPiAgent` dodaje zadania do kolejki według **klucza sesji** (tor `session:<key>`), aby zagwarantować tylko jedno aktywne uruchomienie na sesję.
- Każde uruchomienie sesji jest następnie kolejkowane do **globalnego toru** (domyślnie `main`), więc ogólna równoległość jest ograniczana przez `agents.defaults.maxConcurrent`.
- Gdy włączone jest szczegółowe logowanie, zakolejkowane uruchomienia emitują krótkie powiadomienie, jeśli czekały ponad ~2 s przed startem.
- Wskaźniki pisania nadal uruchamiają się natychmiast po dodaniu do kolejki (gdy kanał to obsługuje), więc doświadczenie użytkownika pozostaje niezmienione podczas oczekiwania na swoją kolej.

## Domyślne wartości

Gdy nie ustawiono inaczej, wszystkie powierzchnie kanałów przychodzących używają:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` jest ustawieniem domyślnym, ponieważ utrzymuje aktywną turę modelu responsywną bez
uruchamiania drugiego przebiegu sesji. Opróżnia wszystkie wiadomości sterujące, które dotarły
przed następną granicą modelu. Jeśli bieżące uruchomienie nie może przyjąć sterowania,
OpenClaw przechodzi awaryjnie do wpisu kolejki followup.

## Tryby kolejki

Wiadomości przychodzące mogą sterować bieżącym uruchomieniem, czekać na turę followup albo robić jedno i drugie:

- `steer`: kolejkuje wiadomości sterujące do aktywnego środowiska wykonawczego. Pi dostarcza wszystkie oczekujące wiadomości sterujące **po zakończeniu wykonywania wywołań narzędzi przez bieżącą turę asystenta**, przed następnym wywołaniem LLM; serwer aplikacji Codex otrzymuje jedno zbiorcze `turn/steer`. Jeśli uruchomienie nie prowadzi aktywnie streamingu albo sterowanie jest niedostępne, OpenClaw przechodzi awaryjnie do wpisu kolejki followup.
- `queue` (starsze): stare sterowanie po jednej wiadomości naraz. Pi dostarcza jedną zakolejkowaną wiadomość sterującą przy każdej granicy modelu; serwer aplikacji Codex otrzymuje osobne żądania `turn/steer`. Preferuj `steer`, chyba że potrzebujesz poprzedniego serializowanego zachowania.
- `followup`: dodaje każdą wiadomość do kolejki na późniejszą turę agenta po zakończeniu bieżącego uruchomienia.
- `collect`: scala zakolejkowane wiadomości w **pojedynczą** turę followup po oknie ciszy. Jeśli wiadomości są kierowane do różnych kanałów/wątków, są opróżniane pojedynczo, aby zachować routing.
- `steer-backlog` (alias `steer+backlog`): steruje teraz **i** zachowuje tę samą wiadomość na turę followup.
- `interrupt` (starsze): przerywa aktywne uruchomienie dla tej sesji, a następnie uruchamia najnowszą wiadomość.

Steer-backlog oznacza, że po sterowanym uruchomieniu możesz otrzymać odpowiedź followup, więc
powierzchnie streamingowe mogą wyglądać jak duplikaty. Preferuj `collect`/`steer`, jeśli chcesz
jednej odpowiedzi na wiadomość przychodzącą.

Informacje o czasie działania i zachowaniu zależności specyficznym dla środowiska wykonawczego znajdziesz w
[Kolejka sterowania](/pl/concepts/queue-steering).

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

Opcje dotyczą `followup`, `collect` i `steer-backlog` (oraz `steer` lub starszego `queue`, gdy sterowanie przechodzi awaryjnie do followup):

- `debounceMs`: okno ciszy przed opróżnieniem zakolejkowanych followupów. Same liczby oznaczają milisekundy; jednostki `ms`, `s`, `m`, `h` i `d` są akceptowane przez opcje `/queue`.
- `cap`: maksymalna liczba zakolejkowanych wiadomości na sesję. Wartości poniżej `1` są ignorowane.
- `drop: "summarize"`: domyślne. Odrzuca najstarsze zakolejkowane wpisy w razie potrzeby, zachowuje kompaktowe podsumowania i wstrzykuje je jako syntetyczny prompt followup.
- `drop: "old"`: odrzuca najstarsze zakolejkowane wpisy w razie potrzeby, bez zachowywania podsumowań.
- `drop: "new"`: odrzuca najnowszą wiadomość, gdy kolejka jest już pełna.

Domyślne wartości: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Pierwszeństwo

Przy wyborze trybu OpenClaw rozstrzyga kolejno:

1. Wbudowane lub zapisane nadpisanie `/queue` dla sesji.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Domyślne `steer`.

Dla opcji wbudowane lub zapisane opcje `/queue` mają pierwszeństwo przed konfiguracją. Następnie
stosowane są opóźnienie debounce specyficzne dla kanału (`messages.queue.debounceMsByChannel`), domyślne wartości
debounce Plugin, globalne opcje `messages.queue` i wbudowane wartości domyślne. `cap` i `drop` są opcjami globalnymi/sesyjnymi, a nie kluczami konfiguracji dla kanału.

## Nadpisania dla sesji

- Wyślij `/queue <mode>` jako samodzielne polecenie, aby zapisać tryb dla bieżącej sesji.
- Opcje można łączyć: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` lub `/queue reset` czyści nadpisanie sesji.

## Zakres i gwarancje

- Dotyczy uruchomień agentów automatycznych odpowiedzi we wszystkich kanałach przychodzących, które używają potoku odpowiedzi Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat itd.).
- Domyślny tor (`main`) jest ogólny dla procesu dla przychodzących + głównych Heartbeat; ustaw `agents.defaults.maxConcurrent`, aby pozwolić na wiele sesji równolegle.
- Mogą istnieć dodatkowe tory (np. `cron`, `cron-nested`, `nested`, `subagent`), aby zadania w tle mogły działać równolegle bez blokowania odpowiedzi przychodzących. Izolowane tury agenta Cron zajmują slot `cron`, podczas gdy ich wewnętrzne wykonanie agenta używa `cron-nested`; oba używają `cron.maxConcurrentRuns`. Współdzielone przepływy `nested` inne niż cron zachowują własne zachowanie toru. Te odłączone uruchomienia są śledzone jako [zadania w tle](/pl/automation/tasks).
- Tory dla sesji gwarantują, że tylko jedno uruchomienie agenta dotyka danej sesji naraz.
- Brak zewnętrznych zależności lub wątków workerów w tle; czysty TypeScript + obietnice.

## Rozwiązywanie problemów

- Jeśli polecenia wydają się zablokowane, włącz szczegółowe logi i szukaj wierszy „queued for …ms”, aby potwierdzić, że kolejka się opróżnia.
- Jeśli potrzebujesz głębokości kolejki, włącz szczegółowe logi i obserwuj wiersze z czasem kolejki.
- Uruchomienia serwera aplikacji Codex, które akceptują turę, a potem przestają emitować postęp, są przerywane przez adapter Codex, aby aktywny tor sesji mógł zostać zwolniony zamiast czekać na limit czasu zewnętrznego uruchomienia.
- Gdy diagnostyka jest włączona, sesje pozostające w `processing` po `diagnostics.stuckSessionWarnMs` logują ostrzeżenie o zablokowanej sesji. Aktywne osadzone uruchomienia, aktywne operacje odpowiedzi i aktywne zadania toru domyślnie pozostają wyłącznie ostrzeżeniami; przestarzała ewidencja startowa bez aktywnej pracy sesji może zwolnić dotknięty tor sesji, aby zakolejkowana praca została opróżniona.

## Powiązane

- [Zarządzanie sesjami](/pl/concepts/session)
- [Kolejka sterowania](/pl/concepts/queue-steering)
- [Polityka ponawiania](/pl/concepts/retry)
