---
read_when:
    - Zmieniasz sposób prezentowania znaczników czasu modelowi lub użytkownikom
    - Debugujesz formatowanie czasu w wiadomościach lub danych wyjściowych promptu systemowego
summary: Obsługa daty i czasu w kopertach, promptach, narzędziach i konektorach
title: Data i czas
x-i18n:
    generated_at: "2026-04-24T09:08:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3d54da4077ac985ae1209b4364e049afb83b5746276e164181c1a30f0faa06e
    source_path: date-time.md
    workflow: 15
---

# Data i czas

OpenClaw domyślnie używa **czasu lokalnego hosta dla znaczników czasu transportu** oraz **strefy czasowej użytkownika tylko w prompcie systemowym**.
Znaczniki czasu providera są zachowywane, aby narzędzia zachowały swoją natywną semantykę (bieżący czas jest dostępny przez `session_status`).

## Koperty wiadomości (domyślnie lokalne)

Wiadomości przychodzące są opakowywane znacznikiem czasu (precyzja do minuty):

```
[Provider ... 2026-01-05 16:26 PST] message text
```

Ten znacznik czasu koperty jest **domyślnie lokalny dla hosta**, niezależnie od strefy czasowej providera.

Możesz nadpisać to zachowanie:

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
- `envelopeTimezone: "local"` używa strefy czasowej hosta.
- `envelopeTimezone: "user"` używa `agents.defaults.userTimezone` (fallback do strefy czasowej hosta).
- Użyj jawnej strefy czasowej IANA (np. `"America/Chicago"`), aby ustawić stałą strefę.
- `envelopeTimestamp: "off"` usuwa bezwzględne znaczniki czasu z nagłówków kopert.
- `envelopeElapsed: "off"` usuwa sufiksy czasu, który upłynął (styl `+2m`).

### Przykłady

**Lokalny (domyślnie):**

```
[WhatsApp +1555 2026-01-18 00:19 PST] hello
```

**Strefa czasowa użytkownika:**

```
[WhatsApp +1555 2026-01-18 00:19 CST] hello
```

**Włączony czas, który upłynął:**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] follow-up
```

## Prompt systemowy: Current Date & Time

Jeśli strefa czasowa użytkownika jest znana, prompt systemowy zawiera osobną
sekcję **Current Date & Time** z **samą strefą czasową** (bez zegara/formatu czasu),
aby utrzymać stabilność cache promptów:

```
Time zone: America/Chicago
```

Gdy agent potrzebuje bieżącego czasu, użyj narzędzia `session_status`; karta statusu
zawiera wiersz znacznika czasu.

## Wiersze zdarzeń systemowych (domyślnie lokalne)

Wstawiane do kontekstu agenta zdarzenia systemowe z kolejki są poprzedzane znacznikiem czasu z użyciem
tej samej selekcji strefy czasowej co koperty wiadomości (domyślnie: czas lokalny hosta).

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### Konfigurowanie strefy czasowej użytkownika + formatu

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
      timeFormat: "auto", // auto | 12 | 24
    },
  },
}
```

- `userTimezone` ustawia **lokalną strefę czasową użytkownika** dla kontekstu promptu.
- `timeFormat` kontroluje wyświetlanie **12h/24h** w prompcie. `auto` stosuje preferencje systemu operacyjnego.

## Wykrywanie formatu czasu (auto)

Gdy `timeFormat: "auto"`, OpenClaw sprawdza preferencje systemu operacyjnego (macOS/Windows)
i wraca do formatowania zależnego od locale. Wykryta wartość jest **buforowana per proces**,
aby uniknąć powtarzanych wywołań systemowych.

## Ładunki narzędzi + konektory (surowy czas providera + znormalizowane pola)

Narzędzia kanałów zwracają **natywne znaczniki czasu providera** i dodają znormalizowane pola dla spójności:

- `timestampMs`: milisekundy epoki (UTC)
- `timestampUtc`: ciąg ISO 8601 UTC

Surowe pola providera są zachowywane, więc nic nie ginie.

- Slack: ciągi podobne do epoki z API
- Discord: znaczniki czasu UTC ISO
- Telegram/WhatsApp: znaczniki czasu liczbowe/ISO specyficzne dla providera

Jeśli potrzebujesz czasu lokalnego, przekonwertuj go dalej, używając znanej strefy czasowej.

## Powiązana dokumentacja

- [System Prompt](/pl/concepts/system-prompt)
- [Timezones](/pl/concepts/timezone)
- [Messages](/pl/concepts/messages)
