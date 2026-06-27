---
read_when:
    - Zmieniasz sposób wyświetlania znaczników czasu modelowi lub użytkownikom
    - Debugujesz formatowanie czasu w wiadomościach lub danych wyjściowych promptu systemowego
summary: Obsługa daty i czasu w obwiedniach, promptach, narzędziach i konektorach
title: Data i godzina
x-i18n:
    generated_at: "2026-06-27T17:30:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d40e8626269d26a14506a178080b353529080b6ee5ce523c3281521f1a34bf90
    source_path: date-time.md
    workflow: 16
---

OpenClaw domyślnie używa **czasu lokalnego hosta dla znaczników czasu transportu** oraz **strefy czasowej użytkownika tylko w prompcie systemowym**.
Znaczniki czasu dostawcy są zachowywane, aby narzędzia utrzymywały swoją natywną semantykę (bieżący czas jest dostępny przez `session_status`).

## Koperty wiadomości (domyślnie lokalne)

Wiadomości przychodzące są opakowywane znacznikiem czasu (z dokładnością do sekundy):

```
[Provider ... Mon 2026-01-05 16:26:34 PST] message text
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
- `envelopeTimezone: "user"` używa `agents.defaults.userTimezone` (z przejściem awaryjnym na strefę czasową hosta).
- Użyj jawnej strefy czasowej IANA (np. `"America/Chicago"`) dla stałej strefy.
- `envelopeTimestamp: "off"` usuwa bezwzględne znaczniki czasu z nagłówków kopert, bezpośrednich prefiksów promptów agenta i osadzonych prefiksów danych wejściowych modelu.
- `envelopeElapsed: "off"` usuwa sufiksy czasu, który upłynął (styl `+2m`).

### Przykłady

**Lokalnie (domyślnie):**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 PST] hello
```

**Strefa czasowa użytkownika:**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 CST] hello
```

**Włączony czas, który upłynął:**

```
[WhatsApp +1555 +30s Sun 2026-01-18T05:19:00Z] follow-up
```

## Prompt systemowy: bieżąca data i godzina

Jeśli strefa czasowa użytkownika jest znana, prompt systemowy zawiera dedykowaną
sekcję **Bieżąca data i godzina** z **samą strefą czasową** (bez zegara/formatu czasu),
aby zachować stabilność buforowania promptów:

```
Time zone: America/Chicago
```

Gdy agent potrzebuje bieżącego czasu, użyj narzędzia `session_status`; karta statusu
zawiera wiersz znacznika czasu.

## Wiersze zdarzeń systemowych (domyślnie lokalne)

Zdarzenia systemowe w kolejce wstawiane do kontekstu agenta są poprzedzane znacznikiem czasu przy użyciu
tego samego wyboru strefy czasowej co koperty wiadomości (domyślnie: lokalna dla hosta).

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

- `userTimezone` ustawia **strefę czasową lokalną dla użytkownika** dla kontekstu promptu.
- `timeFormat` kontroluje **wyświetlanie w formacie 12h/24h** w prompcie. `auto` podąża za preferencjami systemu operacyjnego.

## Wykrywanie formatu czasu (auto)

Gdy `timeFormat: "auto"`, OpenClaw sprawdza preferencję systemu operacyjnego (macOS/Windows)
i przechodzi awaryjnie na formatowanie ustawień regionalnych. Wykryta wartość jest **buforowana na proces**,
aby uniknąć powtarzających się wywołań systemowych.

## Ładunki narzędzi i konektory (surowy czas dostawcy oraz znormalizowane pola)

Narzędzia kanałów zwracają **natywne znaczniki czasu dostawcy** i dodają znormalizowane pola dla spójności:

- `timestampMs`: milisekundy epoki (UTC)
- `timestampUtc`: ciąg ISO 8601 UTC

Surowe pola dostawcy są zachowywane, aby nic nie zostało utracone.

- Slack: ciągi podobne do epoki z API
- Discord: znaczniki czasu ISO w UTC
- Telegram/WhatsApp: specyficzne dla dostawcy znaczniki czasu liczbowe/ISO

Jeśli potrzebujesz czasu lokalnego, przekonwertuj go dalej przy użyciu znanej strefy czasowej.

## Powiązane dokumenty

- [Prompt systemowy](/pl/concepts/system-prompt)
- [Strefy czasowe](/pl/concepts/timezone)
- [Wiadomości](/pl/concepts/messages)
