---
read_when:
    - Musisz zrozumieć, jak znaczniki czasu są normalizowane dla modelu
    - Konfigurowanie strefy czasowej użytkownika dla promptów systemowych
summary: Obsługa stref czasowych dla agentów, kopert i promptów
title: Strefy czasowe
x-i18n:
    generated_at: "2026-04-24T09:07:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8318acb0269f446fb3d3198f47811d40490a9ee9593fed82f31353aef2bacb81
    source_path: concepts/timezone.md
    workflow: 15
---

OpenClaw standaryzuje znaczniki czasu, aby model widział **jeden wspólny czas odniesienia**.

## Koperty wiadomości (domyślnie lokalne)

Wiadomości przychodzące są opakowywane w kopertę taką jak:

```
[Provider ... 2026-01-05 16:26 PST] message text
```

Znacznik czasu w kopercie jest **domyślnie lokalny dla hosta**, z precyzją do minut.

Możesz to nadpisać za pomocą:

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | strefa czasowa IANA
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"` używa UTC.
- `envelopeTimezone: "user"` używa `agents.defaults.userTimezone` (fallback do strefy czasowej hosta).
- Użyj jawnej strefy czasowej IANA (np. `"Europe/Vienna"`), aby uzyskać stałe przesunięcie.
- `envelopeTimestamp: "off"` usuwa bezwzględne znaczniki czasu z nagłówków kopert.
- `envelopeElapsed: "off"` usuwa sufiksy czasu, który upłynął (styl `+2m`).

### Przykłady

**Lokalny (domyślnie):**

```
[Signal Alice +1555 2026-01-18 00:19 PST] hello
```

**Stała strefa czasowa:**

```
[Signal Alice +1555 2026-01-18 06:19 GMT+1] hello
```

**Czas, który upłynął:**

```
[Signal Alice +1555 +2m 2026-01-18T05:19Z] follow-up
```

## Ładunki narzędzi (surowe dane providera + znormalizowane pola)

Wywołania narzędzi (`channels.discord.readMessages`, `channels.slack.readMessages` itd.) zwracają **surowe znaczniki czasu providera**.
Dla spójności dołączamy również znormalizowane pola:

- `timestampMs` (milisekundy epoki UTC)
- `timestampUtc` (ciąg ISO 8601 UTC)

Surowe pola providera są zachowywane.

## Strefa czasowa użytkownika dla promptu systemowego

Ustaw `agents.defaults.userTimezone`, aby powiedzieć modelowi, jaka jest lokalna strefa czasowa użytkownika. Jeśli
nie jest ustawiona, OpenClaw rozwiązuje **strefę czasową hosta w runtime** (bez zapisu konfiguracji).

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

Prompt systemowy zawiera:

- sekcję `Current Date & Time` z czasem lokalnym i strefą czasową
- `Time format: 12-hour` lub `24-hour`

Możesz kontrolować format promptu za pomocą `agents.defaults.timeFormat` (`auto` | `12` | `24`).

Zobacz [Date & Time](/pl/date-time), aby poznać pełne zachowanie i przykłady.

## Powiązane

- [Heartbeat](/pl/gateway/heartbeat) — aktywne godziny używają strefy czasowej do planowania
- [Cron Jobs](/pl/automation/cron-jobs) — wyrażenia cron używają strefy czasowej do planowania
- [Date & Time](/pl/date-time) — pełne zachowanie daty/czasu i przykłady
