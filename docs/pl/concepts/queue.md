---
read_when:
    - Zmienianie wykonania automatycznych odpowiedzi lub współbieżności
summary: Projekt kolejki poleceń, który serializuje przychodzące uruchomienia automatycznych odpowiedzi
title: Kolejka poleceń
x-i18n:
    generated_at: "2026-04-24T09:07:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa442e9aa2f0d6d95770d43e987d19ce8d9343450b302ee448e1fa4ab3feeb15
    source_path: concepts/queue.md
    workflow: 15
---

# Kolejka poleceń (2026-01-16)

Serializujemy przychodzące uruchomienia automatycznych odpowiedzi (wszystkie kanały) przez małą kolejkę działającą w procesie, aby zapobiec kolizjom wielu uruchomień agenta, a jednocześnie pozwolić na bezpieczną równoległość między sesjami.

## Dlaczego

- Uruchomienia automatycznych odpowiedzi mogą być kosztowne (wywołania LLM) i mogą kolidować, gdy wiele wiadomości przychodzących pojawia się blisko siebie w czasie.
- Serializacja zapobiega rywalizacji o współdzielone zasoby (pliki sesji, logi, stdin CLI) i zmniejsza ryzyko limitów szybkości po stronie upstream.

## Jak to działa

- Kolejka FIFO świadoma lane opróżnia każdy lane z konfigurowalnym limitem współbieżności (domyślnie 1 dla nieskonfigurowanych lane; `main` domyślnie 4, `subagent` 8).
- `runEmbeddedPiAgent` dodaje do kolejki według **klucza sesji** (lane `session:<key>`), aby zagwarantować tylko jedno aktywne uruchomienie na sesję.
- Każde uruchomienie sesji jest następnie kolejkowane do **globalnego lane** (`main` domyślnie), więc całkowita równoległość jest ograniczana przez `agents.defaults.maxConcurrent`.
- Gdy włączone jest szczegółowe logowanie, zakolejkowane uruchomienia emitują krótką informację, jeśli czekały ponad ~2 s przed rozpoczęciem.
- Wskaźniki pisania nadal uruchamiają się natychmiast przy dodaniu do kolejki (gdy kanał to obsługuje), więc doświadczenie użytkownika się nie zmienia, gdy czekamy na swoją kolej.

## Tryby kolejki (per channel)

Wiadomości przychodzące mogą kierować bieżące uruchomienie, czekać na kolejną turę lub robić obie rzeczy:

- `steer`: natychmiast wstrzykuje do bieżącego uruchomienia (anuluje oczekujące wywołania narzędzi po następnej granicy narzędzia). Jeśli nie ma strumieniowania, wraca do `followup`.
- `followup`: dodaje do kolejki na następną turę agenta po zakończeniu bieżącego uruchomienia.
- `collect`: scala wszystkie zakolejkowane wiadomości w **jedną** kolejną turę (domyślnie). Jeśli wiadomości są kierowane do różnych kanałów/wątków, są opróżniane osobno, aby zachować routing.
- `steer-backlog` (alias `steer+backlog`): kieruje teraz **i** zachowuje wiadomość do kolejnej tury.
- `interrupt` (starsze): przerywa aktywne uruchomienie dla tej sesji, a następnie uruchamia najnowszą wiadomość.
- `queue` (starszy alias): to samo co `steer`.

`steer-backlog` oznacza, że możesz otrzymać odpowiedź followup po uruchomieniu sterowanym, więc
na powierzchniach strumieniujących może to wyglądać jak duplikaty. Jeśli chcesz
jednej odpowiedzi na każdą wiadomość przychodzącą, wybierz `collect`/`steer`.
Wyślij `/queue collect` jako samodzielne polecenie (per-session) lub ustaw `messages.queue.byChannel.discord: "collect"`.

Wartości domyślne (gdy nie ustawiono ich w konfiguracji):

- Wszystkie powierzchnie → `collect`

Konfiguracja globalna lub per channel przez `messages.queue`:

```json5
{
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## Opcje kolejki

Opcje dotyczą `followup`, `collect` i `steer-backlog` (oraz `steer`, gdy wraca do `followup`):

- `debounceMs`: czeka na ciszę przed rozpoczęciem tury followup (zapobiega „continue, continue”).
- `cap`: maksymalna liczba zakolejkowanych wiadomości na sesję.
- `drop`: polityka przepełnienia (`old`, `new`, `summarize`).

`Summarize` zachowuje krótką listę punktowaną odrzuconych wiadomości i wstrzykuje ją jako syntetyczny prompt followup.
Wartości domyślne: `debounceMs: 1000`, `cap: 20`, `drop: summarize`.

## Nadpisania per session

- Wyślij `/queue <mode>` jako samodzielne polecenie, aby zapisać tryb dla bieżącej sesji.
- Opcje można łączyć: `/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` lub `/queue reset` czyści nadpisanie sesji.

## Zakres i gwarancje

- Dotyczy uruchomień agentów automatycznych odpowiedzi we wszystkich kanałach przychodzących korzystających z potoku odpowiedzi Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat itd.).
- Domyślny lane (`main`) obejmuje cały proces dla przychodzących wiadomości + głównych Heartbeat; ustaw `agents.defaults.maxConcurrent`, aby dopuścić wiele sesji równolegle.
- Mogą istnieć dodatkowe lane (np. `cron`, `subagent`), dzięki czemu zadania w tle mogą działać równolegle bez blokowania odpowiedzi przychodzących. Te odłączone uruchomienia są śledzone jako [zadania w tle](/pl/automation/tasks).
- Lane per session gwarantują, że tylko jedno uruchomienie agenta dotyka danej sesji naraz.
- Bez zewnętrznych zależności i wątków workerów w tle; czysty TypeScript + promises.

## Rozwiązywanie problemów

- Jeśli polecenia wydają się zablokowane, włącz szczegółowe logi i szukaj wierszy „queued for …ms”, aby potwierdzić, że kolejka się opróżnia.
- Jeśli potrzebujesz głębokości kolejki, włącz szczegółowe logi i obserwuj wiersze z czasem kolejki.

## Powiązane

- [Zarządzanie sesją](/pl/concepts/session)
- [Polityka ponawiania](/pl/concepts/retry)
