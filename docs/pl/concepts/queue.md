---
read_when:
    - Zmieniasz wykonanie automatycznych odpowiedzi lub współbieżność
summary: Projekt kolejki poleceń, który serializuje przychodzące przebiegi automatycznych odpowiedzi
title: Kolejka poleceń
x-i18n:
    generated_at: "2026-04-05T13:51:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36e1d004e9a2c21ad1470517a249285216114dd4cf876681cc860e992c73914f
    source_path: concepts/queue.md
    workflow: 15
---

# Kolejka poleceń (2026-01-16)

Serializujemy przychodzące przebiegi automatycznych odpowiedzi (wszystkie kanały) przez małą kolejkę w procesie, aby zapobiec kolizjom wielu przebiegów agentów, a jednocześnie nadal umożliwić bezpieczny paralelizm między sesjami.

## Dlaczego

- Przebiegi automatycznych odpowiedzi mogą być kosztowne (wywołania LLM) i mogą się ze sobą zderzać, gdy wiele wiadomości przychodzących pojawia się blisko siebie w czasie.
- Serializacja pozwala uniknąć konkurowania o współdzielone zasoby (pliki sesji, logi, stdin CLI) i zmniejsza ryzyko limitów po stronie usług nadrzędnych.

## Jak to działa

- Kolejka FIFO świadoma pasów opróżnia każdy pas z konfigurowalnym limitem współbieżności (domyślnie 1 dla nieskonfigurowanych pasów; `main` domyślnie ma 4, a `subagent` 8).
- `runEmbeddedPiAgent` dodaje do kolejki według **klucza sesji** (pas `session:<key>`), aby zagwarantować tylko jeden aktywny przebieg na sesję.
- Następnie każdy przebieg sesji jest umieszczany w kolejce do **globalnego pasa** (domyślnie `main`), więc ogólny paralelizm jest ograniczany przez `agents.defaults.maxConcurrent`.
- Gdy włączone jest szczegółowe logowanie, przebiegi oczekujące w kolejce emitują krótkie powiadomienie, jeśli czekały ponad ~2 s przed rozpoczęciem.
- Wskaźniki pisania nadal uruchamiają się natychmiast po dodaniu do kolejki (jeśli dany kanał to obsługuje), więc komfort użytkownika pozostaje bez zmian, gdy czekamy na swoją kolej.

## Tryby kolejki (na kanał)

Wiadomości przychodzące mogą sterować bieżącym przebiegiem, czekać na turę followup albo robić obie te rzeczy:

- `steer`: natychmiast wstrzyknij do bieżącego przebiegu (anuluje oczekujące wywołania narzędzi po następnym punkcie granicznym narzędzia). Jeśli nie trwa strumieniowanie, wraca do followup.
- `followup`: dodaj do kolejki na następną turę agenta po zakończeniu bieżącego przebiegu.
- `collect`: scala wszystkie wiadomości oczekujące w kolejce w **jedną** turę followup (domyślnie). Jeśli wiadomości są kierowane do różnych kanałów/wątków, są opróżniane osobno, aby zachować routing.
- `steer-backlog` (alias `steer+backlog`): steruj teraz **i** zachowaj wiadomość na potrzeby tury followup.
- `interrupt` (starsze): przerwij aktywny przebieg dla tej sesji, a następnie uruchom najnowszą wiadomość.
- `queue` (starszy alias): to samo co `steer`.

`steer-backlog` oznacza, że po przebiegu sterowanym możesz otrzymać odpowiedź followup, więc
powierzchnie strumieniujące mogą wyglądać na zduplikowane. Jeśli chcesz
jedną odpowiedź na wiadomość przychodzącą, preferuj `collect`/`steer`.
Wyślij `/queue collect` jako samodzielne polecenie (na sesję) albo ustaw `messages.queue.byChannel.discord: "collect"`.

Domyślne wartości (gdy nie są ustawione w konfiguracji):

- Wszystkie powierzchnie → `collect`

Konfiguruj globalnie lub per kanał przez `messages.queue`:

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

Opcje dotyczą `followup`, `collect` i `steer-backlog` (oraz `steer`, gdy wraca do followup):

- `debounceMs`: czekaj na ciszę przed rozpoczęciem tury followup (zapobiega „continue, continue”).
- `cap`: maksymalna liczba wiadomości w kolejce na sesję.
- `drop`: polityka przepełnienia (`old`, `new`, `summarize`).

`summarize` zachowuje krótką listę punktowaną odrzuconych wiadomości i wstrzykuje ją jako syntetyczny prompt followup.
Wartości domyślne: `debounceMs: 1000`, `cap: 20`, `drop: summarize`.

## Nadpisania na sesję

- Wyślij `/queue <mode>` jako samodzielne polecenie, aby zapisać tryb dla bieżącej sesji.
- Opcje można łączyć: `/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` lub `/queue reset` czyści nadpisanie sesji.

## Zakres i gwarancje

- Dotyczy przebiegów agentów automatycznych odpowiedzi we wszystkich przychodzących kanałach używających potoku odpowiedzi gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat itd.).
- Domyślny pas (`main`) jest obejmujący cały proces dla ruchu przychodzącego + głównych heartbeatów; ustaw `agents.defaults.maxConcurrent`, aby umożliwić równoległe wykonywanie wielu sesji.
- Mogą istnieć dodatkowe pasy (np. `cron`, `subagent`), aby zadania w tle mogły działać równolegle bez blokowania odpowiedzi przychodzących. Te odłączone przebiegi są śledzone jako [background tasks](/pl/automation/tasks).
- Pasy per sesja gwarantują, że tylko jeden przebieg agenta naraz dotyka danej sesji.
- Bez zewnętrznych zależności ani wątków workerów w tle; czysty TypeScript + promises.

## Rozwiązywanie problemów

- Jeśli polecenia wydają się zawieszone, włącz szczegółowe logi i szukaj wierszy „queued for …ms”, aby potwierdzić, że kolejka się opróżnia.
- Jeśli potrzebujesz głębokości kolejki, włącz szczegółowe logi i obserwuj wiersze z czasami kolejki.
