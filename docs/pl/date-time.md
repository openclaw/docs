---
read_when:
    - Zmieniasz sposób wyświetlania znaczników czasu modelowi lub użytkownikom
    - Debugujesz formatowanie czasu w wiadomościach lub danych wyjściowych promptu systemowego
summary: Obsługa daty i czasu w kopertach, promptach, narzędziach i konektorach
title: Data i godzina
x-i18n:
    generated_at: "2026-07-12T15:01:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6f923022c021c1cf18ba306cd7b9a4873f5df947bb9a8fae9c737a89f64cbf2
    source_path: date-time.md
    workflow: 16
---

OpenClaw używa **czasu lokalnego hosta dla znaczników czasu transportu** i umieszcza w prompcie systemowym **tylko strefę czasową**.
Znaczniki czasu dostawcy są zachowywane, dzięki czemu narzędzia zachowują swoją natywną semantykę. Gdy agent potrzebuje bieżącego
czasu, uruchamia narzędzie `session_status`.

## Obwiednie wiadomości (domyślnie lokalne)

Wiadomości przychodzące są opakowywane znacznikiem czasu zawierającym dzień tygodnia i czas z dokładnością do sekundy:

```
[WhatsApp +1555 Mon 2026-01-05 16:26:34 PST] treść wiadomości
```

Znacznik czasu obwiedni jest **domyślnie zgodny z czasem lokalnym hosta**, niezależnie od strefy czasowej dostawcy.
Można to zmienić w `agents.defaults`:

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

| Klucz               | Wartości                                                     | Zachowanie                                                                                                                                                                                                 |
| ------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `envelopeTimezone`  | `local` (domyślnie), `utc`, `user`, jawna nazwa IANA         | `user` używa `agents.defaults.userTimezone` (strefy czasowej hosta, jeśli nie ustawiono). Jawna nazwa IANA (np. `"America/Chicago"`) ustala stałą strefę; nierozpoznane nazwy powodują użycie UTC. |
| `envelopeTimestamp` | `on` (domyślnie), `off`                                      | `off` usuwa bezwzględne znaczniki czasu z nagłówków obwiedni, bezpośrednich prefiksów promptów agenta oraz osadzonych prefiksów danych wejściowych modelu.                                     |
| `envelopeElapsed`   | `on` (domyślnie), `off`                                      | `off` usuwa przyrostek czasu, który upłynął od poprzedniej wiadomości w sesji (w formacie takim jak `+30s` / `+2m`).                                                                         |

### Przykłady

**Czas lokalny (domyślnie):**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 PST] cześć
```

**Strefa czasowa użytkownika:**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 CST] cześć
```

**Czas, który upłynął, z `envelopeTimezone: "utc"`:**

```
[WhatsApp +1555 +30s Sun 2026-01-18T05:19:00Z] kolejna wiadomość
```

## Prompt systemowy: bieżąca data i godzina

Prompt systemowy zawiera sekcję **Bieżąca data i godzina** z **samą strefą czasową**
(bez zegara ani formatu czasu), dzięki czemu pamięć podręczna promptu pozostaje stabilna:

```
Strefa czasowa: America/Chicago
```

Strefą jest `agents.defaults.userTimezone`, jeśli ją skonfigurowano, a w przeciwnym razie strefa czasowa hosta.
Prompt instruuje również agenta, aby uruchamiał narzędzie `session_status`, gdy potrzebuje
bieżącej daty, godziny lub dnia tygodnia.

## Wiersze zdarzeń systemowych (domyślnie lokalne)

Zdarzenia systemowe umieszczone w kolejce i wstawiane do kontekstu agenta są poprzedzane znacznikiem czasu przy użyciu
tego samego ustawienia `envelopeTimezone` co obwiednie wiadomości (domyślnie: czas lokalny hosta).

```
System: [2026-01-12 12:19:17 PST] Model został przełączony.
```

### Konfigurowanie strefy czasowej użytkownika i formatu

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

- `userTimezone` ustawia **lokalną strefę czasową użytkownika** dla kontekstu promptu (oraz dla `envelopeTimezone: "user"`).
- `timeFormat` steruje **wyświetlaniem w formacie 12- lub 24-godzinnym** dla czasu prezentowanego w prompcie. `auto` korzysta z preferencji systemu operacyjnego.

## Wykrywanie formatu czasu (automatyczne)

Gdy ustawiono `timeFormat: "auto"`, OpenClaw sprawdza preferencje systemu operacyjnego (macOS i Windows),
a jeśli nie jest to możliwe, używa formatowania zgodnego z ustawieniami regionalnymi. Wykryta wartość jest **buforowana dla procesu**,
aby uniknąć powtarzających się wywołań systemowych.

## Dane narzędzi i konektory (nieprzetworzony czas dostawcy oraz pola znormalizowane)

Narzędzia kanałów zwracają **natywne znaczniki czasu dostawcy** i dla spójności dodają znormalizowane pola:

- `timestampMs`: liczba milisekund od epoki (UTC)
- `timestampUtc`: ciąg UTC w formacie ISO 8601

Nieprzetworzone pola dostawcy są zachowywane, aby nie utracić żadnych informacji.

- Discord: znaczniki czasu UTC w formacie ISO
- Slack: ciągi przypominające czas epoki zwracane przez API
- Telegram/WhatsApp: specyficzne dla dostawcy znaczniki czasu w formacie liczbowym lub ISO

Jeśli potrzebujesz czasu lokalnego, przekształć go na dalszym etapie przy użyciu znanej strefy czasowej.

## Powiązana dokumentacja

- [Prompt systemowy](/pl/concepts/system-prompt)
- [Strefy czasowe](/pl/concepts/timezone)
- [Wiadomości](/pl/concepts/messages)
