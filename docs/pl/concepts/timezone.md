---
read_when:
    - Chcesz mieć szybki model mentalny obsługi stref czasowych
    - Decydujesz, gdzie ustawić lub nadpisać strefę czasową
summary: Gdzie strefy czasowe pojawiają się w OpenClaw — koperty, ładunki narzędzi, prompt systemowy
title: Strefy czasowe
x-i18n:
    generated_at: "2026-05-06T09:10:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 041b207a0fa2758a20e8f3c4eca852d3dd416560d045459cb4d86709b45449e3
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw standaryzuje znaczniki czasu, aby model widział **jeden czas odniesienia** zamiast mieszanki zegarów lokalnych dla dostawców. Strefy czasowe pojawiają się w trzech miejscach, z których każde ma własny cel:

## Trzy obszary stref czasowych

| Obszar             | Co pokazuje                                                                                            | Domyślnie                              | Konfigurowane przez                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------ | -------------------------------------- | ------------------------------------------------------- |
| Koperty wiadomości | Opakowuje przychodzące wiadomości kanału: `[Signal +1555 2026-01-18 00:19 PST] hello`                 | Lokalna strefa hosta                   | `agents.defaults.envelopeTimezone`                      |
| Ładunki narzędzi   | Narzędzia kanału w stylu `readMessages` zwracają surowy czas dostawcy + znormalizowane `timestampMs` / `timestampUtc` | Pola UTC zawsze obecne                 | Nie można skonfigurować — zachowuje natywne znaczniki czasu dostawcy |
| Prompt systemowy   | Mały blok `Current Date & Time` zawierający **tylko strefę czasową** (bez wartości zegara, dla stabilności cache) | Strefa czasowa hosta, jeśli `userTimezone` nie jest ustawione | `agents.defaults.userTimezone`                          |

Prompt systemowy celowo pomija bieżący zegar, aby cache promptów pozostawał stabilny między turami. Gdy agent potrzebuje bieżącego czasu, wywołuje `session_status`.

## Ustawianie strefy czasowej użytkownika

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
    },
  },
}
```

Jeśli `userTimezone` nie jest ustawione, OpenClaw ustala strefę czasową hosta w czasie działania (bez zapisu konfiguracji). `agents.defaults.timeFormat` (`auto` | `12` | `24`) kontroluje renderowanie w formacie 12h/24h w kopertach i dalszych obszarach, ale nie w sekcji promptu systemowego.

## Kiedy nadpisywać ustawienia

- **Używaj kopert UTC** (`envelopeTimezone: "utc"`), gdy chcesz mieć stabilne znaczniki czasu na hostach w różnych regionach albo gdy chcesz, aby logi wyrównane do UTC pasowały do danych diagnostycznych.
- **Używaj stałej strefy IANA** (np. `"Europe/Vienna"`), gdy host Gateway znajduje się w jednej strefie, ale użytkownik w innej, i chcesz, aby koperty były odczytywane w strefie użytkownika niezależnie od migracji hosta.
- **Ustaw `envelopeTimestamp: "off"`** dla kopert o niskim zużyciu tokenów, gdy kontekst znacznika czasu nie jest przydatny w rozmowie.

Pełne omówienie zachowania, przykłady dla poszczególnych dostawców oraz formatowanie czasu, który upłynął, znajdziesz w sekcji [Data i godzina](/pl/date-time).

## Powiązane

- [Data i godzina](/pl/date-time) — pełne zachowanie kopert/narzędzi/promptu i przykłady.
- [Heartbeat](/pl/gateway/heartbeat) — aktywne godziny używają strefy czasowej do planowania.
- [Zadania Cron](/pl/automation/cron-jobs) — wyrażenia cron używają strefy czasowej do planowania.
