---
read_when:
    - Zmieniasz sposób wyświetlania znaczników czasu modelowi lub użytkownikom
    - Debugujesz formatowanie czasu w wiadomościach lub danych wyjściowych promptu systemowego
summary: Obsługa daty i czasu w kopertach, promptach, narzędziach i konektorach
title: Data i godzina
x-i18n:
    generated_at: "2026-05-06T09:11:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f695a5009c949cc24689bfb8950d96cf72f0b2a1472efe88923182527b56b74
    source_path: date-time.md
    workflow: 16
---

OpenClaw domyślnie używa **lokalnego czasu hosta dla znaczników czasu transportu** oraz **strefy czasowej użytkownika tylko w prompcie systemowym**.
Znaczniki czasu dostawcy są zachowywane, aby narzędzia utrzymywały swoją natywną semantykę (bieżący czas jest dostępny przez `session_status`).

## Koperty wiadomości (domyślnie lokalne)

Wiadści przychodzące są opakowywane znacznikiem czasu (precyzja do minuty):

```
[Provider ... 2026-01-05 16:26 PST] message text
```

Ten znacznik czasu koperty jest **domyślnie lokalny dla hosta**, niezależnie od strefy czasowej dostawcy.

Możesz nadpisać to zachowanie:

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA timezone
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"` używa UTC.
- `envelopeTimezone: "local"` używa strefy czasowej hosta.
- `envelopeTimezone: "user"` używa `agents.defaults.userTimezone` (z powrotem do strefy czasowej hosta).
- Użyj jawnej strefy czasowej IANA (np. `"America/Chicago"`) dla stałej strefy.
- `envelopeTimestamp: "off"` usuwa bezwzględne znaczniki czasu z nagłówków koperty.
- `envelopeElapsed: "off"` usuwa sufiksy czasu, który upłynął (styl `+2m`).

### Przykłady

**Lokalna (domyślnie):**

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

## Prompt systemowy: bieżąca data i godzina

Jeśli strefa czasowa użytkownika jest znana, prompt systemowy zawiera dedykowaną
sekcję **Bieżąca data i godzina** z **samą strefą czasową** (bez formatu zegara/czasu),
aby zachować stabilność buforowania promptów:

```
Time zone: America/Chicago
```

Gdy agent potrzebuje bieżącego czasu, użyj narzędzia `session_status`; karta statusu
zawiera wiersz ze znacznikiem czasu.

## Wiersze zdarzeń systemowych (domyślnie lokalne)

Zdarzenia systemowe w kolejce wstawiane do kontekstu agenta są poprzedzane znacznikiem czasu przy użyciu
tego samego wyboru strefy czasowej co koperty wiadomości (domyślnie: lokalna hosta).

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### Konfiguracja strefy czasowej użytkownika i formatu

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
- `timeFormat` kontroluje **wyświetlanie w formacie 12h/24h** w prompcie. `auto` podąża za preferencjami systemu operacyjnego.

## Wykrywanie formatu czasu (auto)

Gdy `timeFormat: "auto"`, OpenClaw sprawdza preferencję systemu operacyjnego (macOS/Windows)
i z powrotem używa formatowania ustawień regionalnych. Wykryta wartość jest **buforowana dla procesu**,
aby uniknąć powtarzanych wywołań systemowych.

## Ładunki narzędzi i konektory (surowy czas dostawcy + znormalizowane pola)

Narzędzia kanałów zwracają **natywne znaczniki czasu dostawcy** i dodają znormalizowane pola dla spójności:

- `timestampMs`: milisekundy epoki (UTC)
- `timestampUtc`: ciąg ISO 8601 UTC

Surowe pola dostawcy są zachowywane, więc nic nie zostaje utracone.

- Slack: ciągi podobne do epoki z API
- Discord: znaczniki czasu ISO UTC
- Telegram/WhatsApp: specyficzne dla dostawcy znaczniki czasu numeryczne/ISO

Jeśli potrzebujesz czasu lokalnego, przekonwertuj go dalej, używając znanej strefy czasowej.

## Powiązane dokumenty

- [Prompt systemowy](/pl/concepts/system-prompt)
- [Strefy czasowe](/pl/concepts/timezone)
- [Wiadomości](/pl/concepts/messages)
