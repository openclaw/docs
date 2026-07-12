---
read_when:
    - Potrzebujesz prostego modelu mentalnego obsługi stref czasowych
    - Decydujesz, gdzie ustawić lub nadpisać strefę czasową
summary: Gdzie strefy czasowe pojawiają się w OpenClaw — w kopertach, danych narzędzi i monicie systemowym
title: Strefy czasowe
x-i18n:
    generated_at: "2026-07-12T15:05:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d1620b4b2cedba89bd6ab4392018cd48d0ef92a6abc1744011d482557e2c4fc
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw standaryzuje znaczniki czasu, dzięki czemu model widzi **jeden czas odniesienia**, zamiast mieszanki zegarów lokalnych dostawców. Strefy czasowe są wyświetlane w trzech miejscach, z których każde ma własne przeznaczenie:

## Trzy miejsca wyświetlania stref czasowych

| Miejsce              | Co pokazuje                                                                                                             | Domyślne                                      | Konfiguracja za pomocą                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------- |
| Obwiednie wiadomości | Obejmują przychodzące wiadomości z kanałów: `[Signal +1555 Sun 2026-01-18 00:19:42 PST] hello`                           | Lokalna strefa hosta                          | `agents.defaults.envelopeTimezone`                      |
| Dane narzędzi        | Narzędzia kanałów typu `readMessages` zwracają nieprzetworzony czas dostawcy oraz znormalizowane `timestampMs` / `timestampUtc` | Pola UTC są zawsze obecne                     | Brak konfiguracji; zachowuje natywne znaczniki dostawcy |
| Monit systemowy      | Mały blok `Current Date & Time` zawierający **tylko strefę czasową** (bez wartości czasu, aby zapewnić stabilność pamięci podręcznej) | Strefa hosta, jeśli nie ustawiono `userTimezone` | `agents.defaults.userTimezone`                          |

Monit systemowy celowo pomija bieżący czas, aby zachować stabilność buforowania monitu między turami. Gdy agent potrzebuje bieżącego czasu, wywołuje `session_status`.

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

Jeśli `userTimezone` nie jest ustawione, OpenClaw określa strefę czasową hosta w czasie działania za pomocą `Intl.DateTimeFormat().resolvedOptions().timeZone` (bez zapisywania konfiguracji). `agents.defaults.timeFormat` (`auto` | `12` | `24`) steruje formatem 12-/24-godzinnym w obwiedniach i dalszych miejscach, ale nie w sekcji monitu systemowego.

## Wartości strefy czasowej obwiedni

`agents.defaults.envelopeTimezone` przyjmuje:

- `"local"` (domyślnie) lub `"host"` — strefa czasowa komputera hosta.
- `"utc"` lub `"gmt"` — UTC.
- `"user"` — określona wartość `agents.defaults.userTimezone` (jeśli nie jest ustawiona, używana jest strefa czasowa hosta).
- Dowolny jawny identyfikator strefy IANA, np. `"Europe/Vienna"`.

## Kiedy nadpisać ustawienie

- **Użyj `"utc"`**, aby zachować spójne znaczniki czasu na hostach w różnych regionach lub dopasować je do danych diagnostycznych albo dzienników wyrównanych do UTC.
- **Użyj `"user"`**, aby zachować zgodność obwiedni ze skonfigurowaną strefą czasową użytkownika niezależnie od strefy, w której działa host Gateway.
- **Użyj stałej strefy IANA**, gdy host Gateway znajduje się w jednej strefie, ale obwiednia powinna zawsze wskazywać inną strefę niezależnie od migracji hosta.
- **Ustaw `envelopeTimestamp: "off"`**, gdy kontekst znacznika czasu nie jest przydatny w rozmowie. Spowoduje to usunięcie bezwzględnych znaczników czasu z obwiedni, prefiksów bezpośrednich monitów agenta oraz osadzonych prefiksów danych wejściowych modelu.

Pełny opis działania, przykłady dla poszczególnych dostawców oraz formatowanie czasu, który upłynął, znajdziesz w sekcji [Data i czas](/pl/date-time).

## Powiązane

- [Data i czas](/pl/date-time) — pełny opis działania obwiedni, narzędzi i monitów oraz przykłady.
- [Heartbeat](/pl/gateway/heartbeat) — godziny aktywności wykorzystują strefę czasową do planowania.
- [Zadania Cron](/pl/automation/cron-jobs) — wyrażenia Cron wykorzystują strefę czasową do planowania.
