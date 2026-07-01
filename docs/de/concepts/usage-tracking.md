---
read_when:
    - Sie verdrahten Provider-Nutzungs- und Kontingentoberflächen
    - Sie müssen das Verhalten der Nutzungsverfolgung oder Authentifizierungsanforderungen erklären
summary: Nutzungsverfolgungsoberflächen und Anmeldeinformationsanforderungen
title: Nutzungsverfolgung
x-i18n:
    generated_at: "2026-07-01T18:10:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa9b2b0b19ca0b4beeea40bfd50b07a92155178d5ec0e1877013843e0caba4fb
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Was es ist

- Ruft Provider-Nutzung/-Kontingent direkt von deren Nutzungsendpunkten ab.
- Keine geschätzten Kosten; nur vom Provider gemeldete Kontingentfenster oder Zusammenfassungen des Kontostands.
- Die menschenlesbare Statusausgabe für Kontingentfenster wird auf `X% übrig` normalisiert, auch wenn eine Upstream-API verbrauchtes Kontingent, verbleibendes Kontingent oder nur Rohzählungen meldet. Provider ohne zurücksetzbare Kontingentfenster können stattdessen Provider-Zusammenfassungstext anzeigen, etwa ein Guthaben.
- `/status` und `session_status` auf Sitzungsebene können auf den neuesten Nutzungs-Eintrag im Transkript zurückfallen, wenn der Live-Sitzungs-Snapshot spärlich ist. Dieser Fallback füllt fehlende Token-/Cache-Zähler, kann die aktive Runtime-Modellbeschriftung wiederherstellen und bevorzugt die größere promptorientierte Gesamtsumme, wenn Sitzungsmetadaten fehlen oder kleiner sind. Vorhandene Live-Werte ungleich null haben weiterhin Vorrang.

## Wo es angezeigt wird

- `/status` in Chats: Statuskarte mit vielen Emojis, Sitzungstokens + geschätzten Kosten (nur API-Schlüssel). Provider-Nutzung wird für den **aktuellen Modell-Provider** angezeigt, wenn verfügbar, als normalisiertes `X% übrig`-Fenster oder Provider-Zusammenfassungstext.
- `/usage off|tokens|full` in Chats: Nutzungsfußzeile pro Antwort.
- `/usage cost` in Chats: lokale Kostenzusammenfassung, aggregiert aus OpenClaw-Sitzungslogs.
- CLI: `openclaw status --usage` gibt eine vollständige Aufschlüsselung pro Provider aus.
- CLI: `openclaw channels list` gibt denselben Nutzungs-Snapshot zusammen mit der Provider-Konfiguration aus (verwenden Sie `--no-usage`, um dies zu überspringen).
- macOS-Menüleiste: Abschnitt „Usage“ unter Context (nur wenn verfügbar).

## Standardmodus der Nutzungsfußzeile

`/usage off|tokens|full` legt die Fußzeile für eine Sitzung fest und wird für diese Sitzung gespeichert. `messages.responseUsage` initialisiert diesen Modus für Sitzungen, die noch keinen ausgewählt haben, sodass die Fußzeile standardmäßig aktiviert sein kann, ohne jedes Mal `/usage` einzugeben.

Legen Sie einen Modus für jeden Kanal fest oder eine kanalbezogene Zuordnung mit einem `default`-Fallback:

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // or: { "default": "off", "discord": "full" }
  },
}
```

### Drei unterschiedliche Sitzungszustände

Das Feld `responseUsage` einer Sitzung hat drei darstellbare Zustände, jeweils mit unterschiedlicher Semantik:

| Zustand                       | Gespeicherter Wert              | Effektiver Modus                                                      |
| ----------------------------- | ------------------------------- | --------------------------------------------------------------------- |
| **Nicht gesetzt / vererben**  | `undefined` (nicht vorhanden)   | Fällt auf den `messages.responseUsage`-Konfigurationsstandard zurück, dann auf `off`. |
| **Explizit aus**              | `"off"` (gespeichert)           | Immer aus — ein Konfigurationsstandard ungleich `off` kann die Fußzeile nicht erneut aktivieren. |
| **Explizit an**               | `"tokens"` oder `"full"` (gespeichert) | Dieser Modus, unabhängig vom Konfigurationsstandard.                  |

### Vorrang

Effektiver Modus = Sitzungsüberschreibung → Kanalkonfigurationseintrag → `default` → `off`.

Ein explizites `/usage off` wird als literaler Wert `"off"` in der Sitzung **persistiert**, nicht als „nicht gesetzt“. Das bedeutet, dass ein `messages.responseUsage`-Standard ungleich `off` die Fußzeile nicht wieder einschalten kann, nachdem der Benutzer sie ausdrücklich deaktiviert hat.

### Zurücksetzen vs. Ausschalten

- `/usage off` — erzwingt das Ausschalten der Fußzeile und persistiert diese Auswahl. Ein konfigurierter Standard ungleich `off` kann dies nicht überschreiben.
- `/usage reset` (Aliase: `inherit`, `clear`, `default`) — löscht die Sitzungsüberschreibung. Die Sitzung **erbt** dann den effektiven Konfigurationsstandard (`messages.responseUsage`). Wenn kein Standard konfiguriert ist, bleibt die Fußzeile aus (unverändert gegenüber vorher). Verwenden Sie dies, um „zum Standard zurückzukehren“, ohne die Fußzeile ausdrücklich einzuschalten.
- Ein vollständiges Zurücksetzen der Sitzung (`/reset` oder `/new`) oder ein Sitzungs-Rollover **bewahrt** die explizite Nutzungsmodus-Präferenz, sodass die Anzeigeauswahl des Benutzers Sitzungs-Rollover übersteht. Nur `/usage reset` (und seine Aliase) löscht die Überschreibung tatsächlich.

### Umschaltverhalten

`/usage` ohne Argumente durchläuft: off → tokens → full → off. Der Ausgangspunkt für den Zyklus ist der **effektive** aktuelle Modus (Sitzungsüberschreibung fällt bei Nichtsetzung auf den Konfigurationsstandard zurück), sodass der Zyklus immer mit dem übereinstimmt, was der Benutzer in der Fußzeile sieht.

### Konfiguration

Ohne Konfiguration bleibt das bisherige Verhalten bestehen (Fußzeile aus bis `/usage`). Verwenden Sie `/usage reset`, um eine Sitzungsüberschreibung zu löschen und den konfigurierten Standard erneut zu erben.

## Benutzerdefinierte `/usage full`-Fußzeile

`/usage full` zeigt eine integrierte kompakte Fußzeile mit Modell, Reasoning, schnell/langsam, Kontextfenster und Kosten, wenn diese Felder verfügbar sind. Token- und Cache-Felder bleiben für benutzerdefinierte Vorlagen verfügbar. Es ist keine Vorlagendatei erforderlich.

`messages.usageTemplate` ist nur für fortgeschrittene benutzerdefinierte Layouts vorgesehen. Der Wert ist ein JSON-Dateipfad (unterstützt `~`) oder ein Inline-Objekt und ersetzt bei Gültigkeit die integrierte Fußzeile:

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

Fehlende oder leere Vorlagen fallen stillschweigend auf die integrierte Fußzeile zurück. Nicht lesbare oder ungültig konfigurierte Vorlagen fallen ebenfalls auf die integrierte Fußzeile zurück und geben eine Operator-Warnung aus.

Beginnen Sie benutzerdefinierte Vorlagen mit der integrierten Form und bearbeiten Sie dann die Teile, die Sie ändern möchten:

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": {
    "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿",
    "block": "░▏▎▍▌▋▊▉█",
    "shade": "░▒▓█",
    "moon": "🌑🌘🌗🌖🌕",
    "level": "▁▂▃▄▅▆▇█",
    "weather": ["🥶", "☁️", "🌥", "⛅️", "🌤", "☀️"],
    "plants": ["🪾", "🍂", "🌱", "☘️", "🍀", "🌿"],
    "moons6": ["🌑", "🌚", "🌘", "🌗", "🌖", "🌝"],
  },
  "aliases": {
    "models": {
      "claude-opus-4-6": "opus46",
      "claude-opus-4-8": "opus48",
      "claude-sonnet-4-6": "sonnet46",
      "claude-haiku-4-5": "haiku45",
      "gpt-5.5": "gpt5.5",
    },
    "reasoning": {
      "off": "🌑",
      "minimal": "🌚",
      "low": "🌘",
      "medium": "🌗",
      "high": "🌕",
      "xhigh": "🌝",
    },
  },
  "output": {
    "sep": "",
    "default": [
      { "text": "{model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
      { "map": "model.is_fallback", "cases": { "true": "🔄" } },
      { "map": "model.is_override", "cases": { "true": "📌" } },
      { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
      { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
      {
        "when": "context.max_tokens",
        "text": "\u00A0| 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      { "when": "cost.turn_usd", "text": "\u00A0💰{cost.turn_usd|fixed:4}" },
    ],
    "surfaces": {
      "discord": [
        { "text": "-# -\n" },
        { "text": "-# {model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
        { "map": "model.is_fallback", "cases": { "true": "🔄" } },
        { "map": "model.is_override", "cases": { "true": "📌" } },
        { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
        {
          "when": "context.max_tokens",
          "text": "\u00A0| 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        { "when": "cost.turn_usd", "text": "\u00A0💰{cost.turn_usd|fixed:4}" },
      ],
    },
  },
}
```

### Form

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "<name>": "low-to-high glyphs" }, // string (1 glyph/char) or array
  "aliases": { "<table>": { "<value>": "<label>" } },
  "output": {
    "sep": "", // joins surviving pieces
    "default": [
      /* pieces */
    ], // fallback for any surface
    "surfaces": {
      "discord": [
        /* pieces */
      ],
      "telegram": [
        /* pieces */
      ],
    },
  },
}
```

Jede Oberfläche ist eine geordnete Liste von **Teilen**; die Engine rendert jeden Teil, verwirft leere Teile und verbindet die verbleibenden mit `sep`. Eine Oberfläche ohne Eintrag verwendet `output.default`.

### Vertragspfade

Ein Teil liest Werte aus dem Pro-Turn-Vertrag per Punktpfad. Fehlende Werte sind leer (sodass ein `when`-Guard oder ein `|fallback` den Teil sauber hält).

| Pfad                                                                                | Bedeutung                              |
| ----------------------------------------------------------------------------------- | -------------------------------------- |
| `surface`                                                                           | Kanal-ID (`discord`/`telegram`/etc.)   |
| `model.provider` / `model.display_name`                                             | Provider-ID / Modell-ID                |
| `model.reasoning`                                                                   | Aufwand (`off` bis `xhigh`)            |
| `model.is_fallback` / `model.is_override`                                           | Bool: Fallback verwendet / Modell fixiert |
| `state.fast_mode`                                                                   | Bool: schnell vs. langsam              |
| `context.max_tokens` / `context.pct_used`                                           | Fensterbudget / 0-100 verwendet        |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | Turn-Aggregat                          |
| `usage.has_split_tokens` / `usage.has_total_only_tokens` / `usage.cache_hit_pct`    | Guards für Token-Anzeige und Cache-Prozent |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | nur finaler Modellaufruf               |
| `cost.turn_usd`                                                                     | geschätzte Turn-Kosten                 |
| `identity.name` / `identity.emoji`                                                  | Agentenname / ausgewähltes Emoji       |

(Provider-Rate-Limit-Fenster sind **nicht** in diesem Vertrag enthalten.)

### Verben

Leiten Sie einen Wert von links nach rechts durch Verben; ein Segment, das kein Verb ist, ist der Fallback.

| Verb            | Effekt                                | Beispiel                          |
| --------------- | ------------------------------------- | --------------------------------- |
| `num`           | kompakte Anzahl                       | `272000 -> 272k`                  |
| `fixed:N`       | N Dezimalstellen (Standard 2)         | `0.0377`                          |
| `dur`           | Sekunden in Dauer                     | `14820 -> 4h07m`                  |
| `pct`           | `%` anhängen                          | `96 -> 96%`                       |
| `inv`           | `100 - x`                             | von verwendet zu verbleibend      |
| `alias:TABLE`   | Nachschlagen in `aliases`, bei fehlendem Eintrag unverändert ausgeben | `medium -> 🌗` |
| `meter:W:SCALE` | W-Zellen-Glyphleiste über einen 0-100-Wert | `[⣿⣿⠐⠐⠐]` (`meter:1` = ein Glyph) |

### Teilformen

- `{ "text": "📚 {context.max_tokens|num}" }`: Literal + Interpolation.
- `{ "when": "<path>", "text": "..." }`: nur rendern, wenn der Pfad truthy ist.
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: Wert zu Glyph.
- `{ "each": "limits.windows", "item": "{label}" }`: ein Array iterieren.

### Beispiel

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿" },
  "aliases": { "reasoning": { "medium": "🌗", "high": "🌕" } },
  "output": {
    "surfaces": {
      "discord": [
        { "text": "{model.display_name}" },
        { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": " ⚡", "false": " 🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
      ],
    },
  },
}
```

rendert z. B. `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`.

## Provider + Anmeldedaten

- **Anthropic (Claude)**: OAuth-Token in Auth-Profilen.
- **GitHub Copilot**: OAuth-Token in Auth-Profilen.
- **Gemini CLI**: OAuth-Token in Auth-Profilen.
  - Die JSON-Nutzung fällt auf `stats` zurück; `stats.cached` wird zu
    `cacheRead` normalisiert.
- **OpenAI Codex**: OAuth-Token in Auth-Profilen (`accountId` wird verwendet, wenn vorhanden).
- **MiniMax**: API-Schlüssel oder MiniMax-OAuth-Auth-Profil. OpenClaw behandelt
  `minimax`, `minimax-cn` und `minimax-portal` als dieselbe MiniMax-Kontingent-
  Oberfläche, bevorzugt gespeichertes MiniMax-OAuth, wenn vorhanden, und fällt
  andernfalls auf `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` oder `MINIMAX_API_KEY`
  zurück.
  Die Nutzungsabfrage leitet den Coding-Plan-Host aus `models.providers.minimax-portal.baseUrl`
  oder `models.providers.minimax.baseUrl` ab, wenn konfiguriert, und verwendet andernfalls den
  MiniMax-CN-Host.
  Die rohen Felder `usage_percent` / `usagePercent` von MiniMax bedeuten **verbleibendes**
  Kontingent, daher invertiert OpenClaw sie vor der Anzeige; zählbasierte Felder haben Vorrang,
  wenn vorhanden.
  - Coding-Plan-Zeitfensterbezeichnungen stammen aus den Stunden-/Minutenfeldern des Providers,
    wenn vorhanden, und fallen dann auf die Spanne `start_time` / `end_time` zurück.
  - Wenn der Coding-Plan-Endpunkt `model_remains` zurückgibt, bevorzugt OpenClaw den
    Chat-Modell-Eintrag, leitet die Zeitfensterbezeichnung aus Zeitstempeln ab, wenn explizite
    Felder `window_hours` / `window_minutes` fehlen, und fügt den Modellnamen in die Planbezeichnung ein.
- **Xiaomi MiMo**: API-Schlüssel über Env/Konfiguration/Auth-Speicher (`XIAOMI_API_KEY`).
- **z.ai**: API-Schlüssel über Env/Konfiguration/Auth-Speicher.
- **DeepSeek**: API-Schlüssel über Env/Konfiguration/Auth-Speicher (`DEEPSEEK_API_KEY`).
  OpenClaw ruft den Balance-Endpunkt von DeepSeek auf und zeigt den vom Provider gemeldeten
  Kontostand als Text statt als Prozent-verbleibend-Kontingentfenster an.

Die Nutzung wird ausgeblendet, wenn keine verwendbare Provider-Nutzungs-Authentifizierung aufgelöst werden kann. Provider
können Plugin-spezifische Logik für die Nutzungs-Authentifizierung bereitstellen; andernfalls fällt OpenClaw auf
passende OAuth-/API-Schlüssel-Anmeldedaten aus Auth-Profilen, Umgebungsvariablen
oder der Konfiguration zurück.

## Verwandte Themen

- [Token-Nutzung und Kosten](/de/reference/token-use)
- [API-Nutzung und Kosten](/de/reference/api-usage-costs)
- [Prompt-Caching](/de/reference/prompt-caching)
