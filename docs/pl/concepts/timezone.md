---
read_when:
    - Chcesz szybko zrozumieć model obsługi stref czasowych
    - Decydujesz, gdzie ustawić lub nadpisać strefę czasową
summary: Gdzie strefy czasowe pojawiają się w OpenClaw — koperty, ładunki narzędzi, prompt systemowy
title: Strefy czasowe
x-i18n:
    generated_at: "2026-06-27T17:30:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cc5bfe595c81b9c6ffaceac4c86b6f82b82917a506cdd7227e3e8cb1c0eb99a3
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw standaryzuje znaczniki czasu, aby model widział **jeden czas referencyjny** zamiast mieszanki zegarów lokalnych dla dostawców. Istnieją trzy powierzchnie, na których pojawiają się strefy czasowe, każda z własnym celem:

## Trzy powierzchnie stref czasowych

| Powierzchnia       | Co pokazuje                                                                                                     | Domyślnie                                      | Konfigurowane przez                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------- |
| Koperty wiadomości | Owijają przychodzące wiadomości z kanałów: `[Signal +1555 Sun 2026-01-18 00:19:42 PST] hello`                   | Lokalna strefa hosta                           | `agents.defaults.envelopeTimezone`                       |
| Ładunki narzędzi   | Narzędzia kanału w stylu `readMessages` zwracają surowy czas dostawcy + znormalizowane `timestampMs` / `timestampUtc` | Pola UTC są zawsze obecne                      | Nie można konfigurować — zachowuje znaczniki czasu natywne dla dostawcy |
| Prompt systemowy   | Mały blok `Current Date & Time` z **samą strefą czasową** (bez wartości zegara, dla stabilności cache)           | Strefa czasowa hosta, jeśli `userTimezone` nie jest ustawione | `agents.defaults.userTimezone`                           |

Prompt systemowy celowo pomija aktualny zegar, aby cache promptów pozostawał stabilny między turami. Gdy agent potrzebuje bieżącego czasu, wywołuje `session_status`.

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

Jeśli `userTimezone` nie jest ustawione, OpenClaw ustala strefę czasową hosta w czasie działania (bez zapisu konfiguracji). `agents.defaults.timeFormat` (`auto` | `12` | `24`) kontroluje formatowanie 12h/24h w kopertach i powierzchniach niższego poziomu, ale nie w sekcji promptu systemowego.

## Kiedy nadpisywać

- **Używaj kopert UTC** (`envelopeTimezone: "utc"`), gdy chcesz mieć stabilne znaczniki czasu między hostami w różnych regionach albo gdy chcesz, aby logi wyrównane do UTC pasowały do danych wyjściowych diagnostyki.
- **Używaj stałej strefy IANA** (np. `"Europe/Vienna"`), gdy host Gateway znajduje się w jednej strefie, ale użytkownik w innej, i chcesz, aby koperty były odczytywane w strefie użytkownika niezależnie od migracji hosta.
- **Ustaw `envelopeTimestamp: "off"`**, gdy kontekst znacznika czasu nie jest przydatny w rozmowie. Usuwa to bezwzględne znaczniki czasu z kopert, bezpośrednich prefiksów promptów agenta i osadzonych prefiksów wejścia modelu.

Pełny opis zachowania, przykłady dla poszczególnych dostawców oraz formatowanie czasu, który upłynął, znajdziesz w [Data i godzina](/pl/date-time).

## Powiązane

- [Data i godzina](/pl/date-time) — pełne zachowanie kopert/narzędzi/promptów oraz przykłady.
- [Heartbeat](/pl/gateway/heartbeat) — aktywne godziny używają strefy czasowej do planowania.
- [Zadania Cron](/pl/automation/cron-jobs) — wyrażenia Cron używają strefy czasowej do planowania.
