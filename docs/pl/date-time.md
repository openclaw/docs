---
read_when:
    - Zmieniasz sposób pokazywania znaczników czasu modelowi lub użytkownikom
    - Debugujesz formatowanie czasu w wiadomościach lub danych wyjściowych promptu systemowego
summary: Obsługa daty i czasu w obwiedniach, promptach, narzędziach i konektorach
title: Data i czas
x-i18n:
    generated_at: "2026-04-05T13:52:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 753af5946a006215d6af2467fa478f3abb42b1dff027cf85d5dc4c7ba4b58d39
    source_path: date-time.md
    workflow: 15
---

# Data i czas

OpenClaw domyślnie używa **czasu lokalnego hosta dla znaczników czasu transportu** oraz **strefy czasowej użytkownika tylko w prompcie systemowym**.
Znaczniki czasu dostawców są zachowywane, aby narzędzia utrzymywały swoje natywne semantyki (bieżący czas jest dostępny przez `session_status`).

## Obwiednie wiadomości (domyślnie lokalne)

Wiadomości przychodzące są opakowywane znacznikiem czasu (dokładność do minuty):

```
[Provider ... 2026-01-05 16:26 PST] treść wiadomości
```

Ten znacznik czasu w obwiedni jest **domyślnie lokalny dla hosta**, niezależnie od strefy czasowej dostawcy.

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
- `envelopeTimezone: "user"` używa `agents.defaults.userTimezone` (z powrotem do strefy czasowej hosta).
- Użyj jawnej strefy czasowej IANA (np. `"America/Chicago"`) dla stałej strefy.
- `envelopeTimestamp: "off"` usuwa bezwzględne znaczniki czasu z nagłówków obwiedni.
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

Jeśli strefa czasowa użytkownika jest znana, prompt systemowy zawiera osobną sekcję
**Current Date & Time** z **samą strefą czasową** (bez zegara/formatu czasu),
aby utrzymać stabilność prompt cache:

```
Time zone: America/Chicago
```

Gdy agent potrzebuje bieżącego czasu, użyj narzędzia `session_status`; karta stanu
zawiera wiersz ze znacznikiem czasu.

## Wiersze zdarzeń systemowych (domyślnie lokalne)

Zdarzenia systemowe w kolejce wstawiane do kontekstu agenta są poprzedzane znacznikiem czasu używającym
tej samej selekcji strefy czasowej co obwiednie wiadomości (domyślnie: czas lokalny hosta).

```
System: [2026-01-12 12:19:17 PST] Model został przełączony.
```

### Konfiguracja strefy czasowej użytkownika + formatu

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
- `timeFormat` kontroluje wyświetlanie **12h/24h** w prompcie. `auto` jest zgodne z preferencjami systemu operacyjnego.

## Wykrywanie formatu czasu (auto)

Gdy `timeFormat: "auto"`, OpenClaw sprawdza preferencje systemu operacyjnego (macOS/Windows)
i w razie potrzeby wraca do formatowania zależnego od ustawień regionalnych. Wykryta wartość jest **cache'owana na poziomie procesu**,
aby uniknąć powtarzanych wywołań systemowych.

## Ładunki narzędzi + konektory (surowy czas dostawcy + znormalizowane pola)

Narzędzia kanałów zwracają **natywne znaczniki czasu dostawcy** i dodają znormalizowane pola dla spójności:

- `timestampMs`: milisekundy epoki (UTC)
- `timestampUtc`: ciąg UTC ISO 8601

Surowe pola dostawcy są zachowywane, więc nic nie zostaje utracone.

- Slack: ciągi przypominające epoch z API
- Discord: znaczniki czasu UTC ISO
- Telegram/WhatsApp: numeryczne/ISO znaczniki czasu specyficzne dla dostawcy

Jeśli potrzebujesz czasu lokalnego, przekonwertuj go dalej, używając znanej strefy czasowej.

## Powiązana dokumentacja

- [Prompt systemowy](/concepts/system-prompt)
- [Strefy czasowe](/concepts/timezone)
- [Wiadomości](/concepts/messages)
