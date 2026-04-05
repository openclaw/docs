---
read_when:
    - Musisz zrozumieć, jak znaczniki czasu są normalizowane dla modelu
    - Konfigurujesz strefę czasową użytkownika dla system prompt
summary: Obsługa stref czasowych dla agentów, envelope'ów i promptów
title: Strefy czasowe
x-i18n:
    generated_at: "2026-04-05T13:51:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31a195fa43e3fc17b788d8e70d74ef55da998fc7997c4f0538d4331b1260baac
    source_path: concepts/timezone.md
    workflow: 15
---

# Strefy czasowe

OpenClaw standaryzuje znaczniki czasu, aby model widział **jeden czas odniesienia**.

## Envelope'y wiadomości (domyślnie lokalne)

Wiadomości przychodzące są opakowywane w envelope w rodzaju:

```
[Provider ... 2026-01-05 16:26 PST] message text
```

Znacznik czasu w envelope jest **domyślnie lokalny dla hosta**, z precyzją do minut.

Możesz to nadpisać przez:

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
- `envelopeTimezone: "user"` używa `agents.defaults.userTimezone` (zapasowo strefy czasowej hosta).
- Użyj jawnej strefy czasowej IANA (np. `"Europe/Vienna"`), aby uzyskać stałe przesunięcie.
- `envelopeTimestamp: "off"` usuwa bezwzględne znaczniki czasu z nagłówków envelope.
- `envelopeElapsed: "off"` usuwa sufiksy czasu, jaki upłynął (styl `+2m`).

### Przykłady

**Lokalne (domyślne):**

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

## Payloady narzędzi (surowe dane providera + pola znormalizowane)

Wywołania narzędzi (`channels.discord.readMessages`, `channels.slack.readMessages` itd.) zwracają **surowe znaczniki czasu providera**.
Dla spójności dołączamy także pola znormalizowane:

- `timestampMs` (milisekundy epoki UTC)
- `timestampUtc` (ciąg UTC ISO 8601)

Surowe pola providera są zachowywane.

## Strefa czasowa użytkownika dla system prompt

Ustaw `agents.defaults.userTimezone`, aby powiedzieć modelowi, jaka jest lokalna strefa czasowa użytkownika. Jeśli
nie jest ustawiona, OpenClaw rozwiązuje **strefę czasową hosta w czasie działania** (bez zapisu do konfiguracji).

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

System prompt zawiera:

- sekcję `Current Date & Time` z czasem lokalnym i strefą czasową
- `Time format: 12-hour` albo `24-hour`

Format promptu możesz kontrolować przez `agents.defaults.timeFormat` (`auto` | `12` | `24`).

Zobacz [Date & Time](/date-time), aby poznać pełne zachowanie i przykłady.

## Powiązane

- [Heartbeat](/gateway/heartbeat) — aktywne godziny używają strefy czasowej do harmonogramowania
- [Cron Jobs](/pl/automation/cron-jobs) — wyrażenia cron używają strefy czasowej do harmonogramowania
- [Date & Time](/date-time) — pełne zachowanie daty/czasu i przykłady
